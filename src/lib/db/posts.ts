import "server-only";
import { db } from "./index";
import type { Locale } from "@/lib/i18n";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";
export type ArticleType = "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";
export type TwitterCardType = "summary" | "summary_large_image";
export type TranslationSource =
  | "manual"
  | "ai-deepseek"
  | "ai-openai"
  | "ai-anthropic"
  | "ai-google"
  | (string & {});

export interface PostListItem {
  id: number;
  slug: string;
  status: PostStatus;
  source_locale: string;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  excerpt: string | null;
  locale: Locale;
}

export interface PostDetail extends PostListItem {
  content_html: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_card_type: TwitterCardType;
  focus_keyword: string | null;
  cover_image_alt: string | null;
  reading_time_min: number | null;
  word_count: number | null;
  translation_source: TranslationSource;
  cover_image_width: number | null;
  cover_image_height: number | null;
  article_type: ArticleType;
  noindex: number;
  nofollow: number;
  canonical_url: string | null;
  featured: number;
  video_url: string | null;
  video_duration_sec: number | null;
  video_thumbnail: string | null;
  category_id: number | null;
  category_slug: string | null;
  category_name: string | null;
  author_name: string | null;
  author_email: string | null;
  author_bio: string | null;
  author_avatar: string | null;
  author_social_links: string | null;
}

export interface PostTranslationInput {
  locale: Locale;
  title: string;
  excerpt?: string | null;
  content_html: string;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_card_type?: TwitterCardType;
  focus_keyword?: string | null;
  cover_image_alt?: string | null;
  reading_time_min?: number | null;
  word_count?: number | null;
  translation_source?: TranslationSource;
}

export interface CreatePostInput {
  slug: string;
  status?: PostStatus;
  source_locale: Locale;
  author_id?: number | null;
  category_id?: number | null;
  cover_image?: string | null;
  cover_image_width?: number | null;
  cover_image_height?: number | null;
  article_type?: ArticleType;
  noindex?: boolean;
  nofollow?: boolean;
  canonical_url?: string | null;
  scheduled_at?: string | null;
  featured?: boolean;
  video_url?: string | null;
  video_duration_sec?: number | null;
  video_thumbnail?: string | null;
  translations: PostTranslationInput[];
}

export interface UpdatePostInput {
  slug?: string;
  status?: PostStatus;
  category_id?: number | null;
  cover_image?: string | null;
  cover_image_width?: number | null;
  cover_image_height?: number | null;
  article_type?: ArticleType;
  noindex?: boolean;
  nofollow?: boolean;
  canonical_url?: string | null;
  scheduled_at?: string | null;
  featured?: boolean;
  video_url?: string | null;
  video_duration_sec?: number | null;
  video_thumbnail?: string | null;
  published_at?: string | null;
}

const listPublishedStmt = db.prepare(`
  SELECT p.id, p.slug, p.status, p.source_locale, p.cover_image,
         p.published_at, p.created_at, p.updated_at,
         t.title, t.excerpt, t.locale
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  WHERE p.status = 'published' AND p.published_at IS NOT NULL
  ORDER BY p.published_at DESC
`);

const getBySlugStmt = db.prepare(`
  SELECT p.id, p.slug, p.status, p.source_locale,
         p.cover_image, p.cover_image_width, p.cover_image_height,
         p.article_type, p.noindex, p.nofollow, p.canonical_url, p.featured,
         p.video_url, p.video_duration_sec, p.video_thumbnail,
         p.category_id,
         p.published_at, p.created_at, p.updated_at,
         t.title, t.excerpt, t.content_html,
         t.meta_title, t.meta_description, t.og_title, t.og_description,
         t.twitter_card_type, t.focus_keyword, t.cover_image_alt,
         t.reading_time_min, t.word_count,
         t.translation_source, t.locale,
         cat.slug AS category_slug,
         COALESCE(catt.name, cat.slug) AS category_name,
         u.name AS author_name, u.email AS author_email,
         u.bio AS author_bio, u.avatar_url AS author_avatar,
         u.social_links AS author_social_links
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  LEFT JOIN categories cat ON cat.id = p.category_id
  LEFT JOIN category_translations catt ON catt.category_id = cat.id AND catt.locale = ?
  LEFT JOIN users u ON u.id = p.author_id
  WHERE p.slug = ? AND p.status = 'published'
`);

const listAllStmt = db.prepare(`
  SELECT p.id, p.slug, p.status, p.source_locale, p.cover_image,
         p.published_at, p.created_at, p.updated_at,
         t.title, t.excerpt, t.locale
  FROM posts p
  LEFT JOIN post_translations t ON t.post_id = p.id AND t.locale = p.source_locale
  ORDER BY p.updated_at DESC
`);

const getByIdStmt = db.prepare(`SELECT * FROM posts WHERE id = ?`);
const getTranslationsByPostStmt = db.prepare(
  `SELECT * FROM post_translations WHERE post_id = ?`,
);
const listPublishedSlugsStmt = db.prepare(`
  SELECT p.slug, t.locale
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id
  WHERE p.status = 'published' AND p.published_at IS NOT NULL
`);

const insertPostStmt = db.prepare(`
  INSERT INTO posts (
    slug, status, source_locale, author_id, category_id,
    cover_image, cover_image_width, cover_image_height,
    article_type, noindex, nofollow, canonical_url, scheduled_at, featured,
    video_url, video_duration_sec, video_thumbnail, published_at
  )
  VALUES (
    @slug, @status, @source_locale, @author_id, @category_id,
    @cover_image, @cover_image_width, @cover_image_height,
    @article_type, @noindex, @nofollow, @canonical_url, @scheduled_at, @featured,
    @video_url, @video_duration_sec, @video_thumbnail, @published_at
  )
`);

const insertTranslationStmt = db.prepare(`
  INSERT INTO post_translations (
    post_id, locale, title, excerpt, content_html,
    meta_title, meta_description, og_title, og_description, twitter_card_type,
    focus_keyword, cover_image_alt, reading_time_min, word_count, translation_source
  )
  VALUES (
    @post_id, @locale, @title, @excerpt, @content_html,
    @meta_title, @meta_description, @og_title, @og_description, @twitter_card_type,
    @focus_keyword, @cover_image_alt, @reading_time_min, @word_count, @translation_source
  )
`);

const upsertTranslationStmt = db.prepare(`
  INSERT INTO post_translations (
    post_id, locale, title, excerpt, content_html,
    meta_title, meta_description, og_title, og_description, twitter_card_type,
    focus_keyword, cover_image_alt, reading_time_min, word_count, translation_source, translated_at
  )
  VALUES (
    @post_id, @locale, @title, @excerpt, @content_html,
    @meta_title, @meta_description, @og_title, @og_description, @twitter_card_type,
    @focus_keyword, @cover_image_alt, @reading_time_min, @word_count, @translation_source, datetime('now')
  )
  ON CONFLICT(post_id, locale) DO UPDATE SET
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description,
    og_title = excluded.og_title,
    og_description = excluded.og_description,
    twitter_card_type = excluded.twitter_card_type,
    focus_keyword = excluded.focus_keyword,
    cover_image_alt = excluded.cover_image_alt,
    reading_time_min = excluded.reading_time_min,
    word_count = excluded.word_count,
    translation_source = excluded.translation_source,
    translated_at = datetime('now')
`);

const deletePostStmt = db.prepare(`DELETE FROM posts WHERE id = ?`);

export function listPublishedPosts(locale: Locale): PostListItem[] {
  return listPublishedStmt.all(locale) as PostListItem[];
}

export function getPostBySlug(
  slug: string,
  locale: Locale,
): PostDetail | null {
  const row = getBySlugStmt.get(locale, locale, slug) as PostDetail | undefined;
  return row ?? null;
}

export function listAllPosts(): PostListItem[] {
  return listAllStmt.all() as PostListItem[];
}

export function getPostById(id: number) {
  const post = getByIdStmt.get(id);
  if (!post) return null;
  const translations = getTranslationsByPostStmt.all(id);
  return { post, translations };
}

export function listPublishedSlugs(): { slug: string; locale: Locale }[] {
  return listPublishedSlugsStmt.all() as { slug: string; locale: Locale }[];
}

const relatedByCategoryStmt = db.prepare(`
  SELECT p.id, p.slug, p.cover_image, p.published_at, t.title, t.excerpt
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  WHERE p.status = 'published'
    AND p.id != ?
    AND p.category_id = ?
  ORDER BY p.published_at DESC
  LIMIT ?
`);
const relatedByTagsStmt = db.prepare(`
  SELECT p.id, p.slug, p.cover_image, p.published_at, t.title, t.excerpt,
         COUNT(pt.tag_id) AS overlap
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  INNER JOIN post_tags pt ON pt.post_id = p.id
  WHERE p.status = 'published'
    AND p.id != ?
    AND pt.tag_id IN (SELECT tag_id FROM post_tags WHERE post_id = ?)
  GROUP BY p.id
  ORDER BY overlap DESC, p.published_at DESC
  LIMIT ?
`);
const latestPublishedStmt = db.prepare(`
  SELECT p.id, p.slug, p.cover_image, p.published_at, t.title, t.excerpt
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  WHERE p.status = 'published' AND p.id != ?
  ORDER BY p.published_at DESC
  LIMIT ?
`);

export interface RelatedPost {
  id: number;
  slug: string;
  cover_image: string | null;
  published_at: string | null;
  title: string;
  excerpt: string | null;
}

export function getRelatedPosts(
  postId: number,
  categoryId: number | null,
  locale: Locale,
  limit = 3,
): RelatedPost[] {
  const seen = new Set<number>();
  const results: RelatedPost[] = [];
  const push = (rows: RelatedPost[]) => {
    for (const r of rows) {
      if (seen.has(r.id) || results.length >= limit) continue;
      seen.add(r.id);
      results.push(r);
    }
  };

  if (categoryId) {
    push(relatedByCategoryStmt.all(locale, postId, categoryId, limit) as RelatedPost[]);
  }
  if (results.length < limit) {
    push(relatedByTagsStmt.all(locale, postId, postId, limit) as RelatedPost[]);
  }
  if (results.length < limit) {
    push(latestPublishedStmt.all(locale, postId, limit) as RelatedPost[]);
  }
  return results.slice(0, limit);
}

const internalLinkSearchStmt = db.prepare(`
  SELECT p.id, p.slug, t.title, t.excerpt
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  WHERE p.status = 'published'
    AND p.id != ?
    AND (t.title LIKE ? COLLATE NOCASE OR t.excerpt LIKE ? COLLATE NOCASE OR t.focus_keyword LIKE ? COLLATE NOCASE)
  ORDER BY p.published_at DESC
  LIMIT 10
`);

export interface InternalLinkSuggestion {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
}

export function searchInternalLinks(
  postId: number,
  locale: Locale,
  query: string,
): InternalLinkSuggestion[] {
  if (!query.trim()) return [];
  const like = `%${query.trim()}%`;
  return internalLinkSearchStmt.all(locale, postId, like, like, like) as InternalLinkSuggestion[];
}

export function createPost(input: CreatePostInput): number {
  const tx = db.transaction((data: CreatePostInput) => {
    const result = insertPostStmt.run({
      slug: data.slug,
      status: data.status ?? "draft",
      source_locale: data.source_locale,
      author_id: data.author_id ?? null,
      category_id: data.category_id ?? null,
      cover_image: data.cover_image ?? null,
      cover_image_width: data.cover_image_width ?? null,
      cover_image_height: data.cover_image_height ?? null,
      article_type: data.article_type ?? "BlogPosting",
      noindex: data.noindex ? 1 : 0,
      nofollow: data.nofollow ? 1 : 0,
      canonical_url: data.canonical_url ?? null,
      scheduled_at: data.scheduled_at ?? null,
      featured: data.featured ? 1 : 0,
      video_url: data.video_url ?? null,
      video_duration_sec: data.video_duration_sec ?? null,
      video_thumbnail: data.video_thumbnail ?? null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    });
    const postId = Number(result.lastInsertRowid);
    for (const t of data.translations) {
      insertTranslationStmt.run({
        post_id: postId,
        locale: t.locale,
        title: t.title,
        excerpt: t.excerpt ?? null,
        content_html: t.content_html,
        meta_title: t.meta_title ?? null,
        meta_description: t.meta_description ?? null,
        og_title: t.og_title ?? null,
        og_description: t.og_description ?? null,
        twitter_card_type: t.twitter_card_type ?? "summary_large_image",
        focus_keyword: t.focus_keyword ?? null,
        cover_image_alt: t.cover_image_alt ?? null,
        reading_time_min: t.reading_time_min ?? null,
        word_count: t.word_count ?? null,
        translation_source: t.translation_source ?? "manual",
      });
    }
    return postId;
  });
  return tx(input);
}

export function upsertTranslation(
  postId: number,
  translation: PostTranslationInput,
): void {
  upsertTranslationStmt.run({
    post_id: postId,
    locale: translation.locale,
    title: translation.title,
    excerpt: translation.excerpt ?? null,
    content_html: translation.content_html,
    meta_title: translation.meta_title ?? null,
    meta_description: translation.meta_description ?? null,
    og_title: translation.og_title ?? null,
    og_description: translation.og_description ?? null,
    twitter_card_type: translation.twitter_card_type ?? "summary_large_image",
    focus_keyword: translation.focus_keyword ?? null,
    cover_image_alt: translation.cover_image_alt ?? null,
    reading_time_min: translation.reading_time_min ?? null,
    word_count: translation.word_count ?? null,
    translation_source: translation.translation_source ?? "manual",
  });
}

export function updatePost(id: number, input: UpdatePostInput): void {
  const fields: string[] = [];
  const values: Record<string, unknown> = { id };
  const set = (col: string, value: unknown) => {
    fields.push(`${col} = @${col}`);
    values[col] = value;
  };
  if (input.slug !== undefined) set("slug", input.slug);
  if (input.status !== undefined) {
    set("status", input.status);
    if (input.status === "published" && input.published_at === undefined) {
      fields.push("published_at = datetime('now')");
    }
  }
  if (input.category_id !== undefined) set("category_id", input.category_id);
  if (input.cover_image !== undefined) set("cover_image", input.cover_image);
  if (input.cover_image_width !== undefined) set("cover_image_width", input.cover_image_width);
  if (input.cover_image_height !== undefined) set("cover_image_height", input.cover_image_height);
  if (input.article_type !== undefined) set("article_type", input.article_type);
  if (input.noindex !== undefined) set("noindex", input.noindex ? 1 : 0);
  if (input.nofollow !== undefined) set("nofollow", input.nofollow ? 1 : 0);
  if (input.canonical_url !== undefined) set("canonical_url", input.canonical_url);
  if (input.scheduled_at !== undefined) set("scheduled_at", input.scheduled_at);
  if (input.featured !== undefined) set("featured", input.featured ? 1 : 0);
  if (input.video_url !== undefined) set("video_url", input.video_url);
  if (input.video_duration_sec !== undefined) set("video_duration_sec", input.video_duration_sec);
  if (input.video_thumbnail !== undefined) set("video_thumbnail", input.video_thumbnail);
  if (input.published_at !== undefined) set("published_at", input.published_at);
  fields.push("updated_at = datetime('now')");
  if (fields.length === 1) return;
  db.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = @id`).run(values);
}

export function deletePost(id: number): void {
  deletePostStmt.run(id);
}
