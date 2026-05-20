import "server-only";
import { db } from "./index";
import type { Locale } from "@/lib/i18n";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";
export type ArticleType =
  | "Article"
  | "BlogPosting"
  | "NewsArticle"
  | "TechArticle"
  | "HowTo"
  | "Course"
  | "Recipe";
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
  secondary_keywords: string | null;
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
  secondary_keywords?: string | null;
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
         t.twitter_card_type, t.focus_keyword, t.secondary_keywords, t.cover_image_alt,
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

const listAllEnrichedStmt = db.prepare(`
  SELECT p.id, p.slug, p.status, p.source_locale, p.cover_image,
         p.published_at, p.created_at, p.updated_at,
         p.indexed_at, p.indexed_status,
         t.title, t.excerpt,
         (SELECT GROUP_CONCAT(locale) FROM post_translations WHERE post_id = p.id) AS locales_csv
  FROM posts p
  LEFT JOIN post_translations t ON t.post_id = p.id AND t.locale = p.source_locale
  ORDER BY p.updated_at DESC
`);

export interface PostListItemEnriched extends PostListItem {
  indexed_at: string | null;
  indexed_status: string | null;
  available_locales: Locale[];
  is_stale_index: boolean; // indexed_at < updated_at
}

export function listAllPostsEnriched(): PostListItemEnriched[] {
  const rows = listAllEnrichedStmt.all() as Array<
    PostListItem & {
      indexed_at: string | null;
      indexed_status: string | null;
      locales_csv: string | null;
    }
  >;
  return rows.map((r) => {
    const available = (r.locales_csv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0) as Locale[];
    const isStale = !!r.indexed_at && r.indexed_at < r.updated_at;
    return {
      ...r,
      available_locales: available,
      is_stale_index: isStale,
    };
  });
}

const setIndexedStmt = db.prepare(
  `UPDATE posts SET indexed_at = datetime('now'), indexed_status = ?, updated_at = updated_at WHERE id = ?`,
);

export function markPostIndexed(id: number, status: string): void {
  setIndexedStmt.run(status, id);
}

const setStatusPublishedStmt = db.prepare(`
  UPDATE posts
  SET status = 'published',
      published_at = COALESCE(published_at, datetime('now')),
      updated_at = datetime('now')
  WHERE id = ? AND status != 'published'
`);

export function publishPostById(id: number): boolean {
  const info = setStatusPublishedStmt.run(id);
  return info.changes > 0;
}

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
    focus_keyword, secondary_keywords, cover_image_alt, reading_time_min, word_count, translation_source
  )
  VALUES (
    @post_id, @locale, @title, @excerpt, @content_html,
    @meta_title, @meta_description, @og_title, @og_description, @twitter_card_type,
    @focus_keyword, @secondary_keywords, @cover_image_alt, @reading_time_min, @word_count, @translation_source
  )
`);

const upsertTranslationStmt = db.prepare(`
  INSERT INTO post_translations (
    post_id, locale, title, excerpt, content_html,
    meta_title, meta_description, og_title, og_description, twitter_card_type,
    focus_keyword, secondary_keywords, cover_image_alt, reading_time_min, word_count, translation_source, translated_at
  )
  VALUES (
    @post_id, @locale, @title, @excerpt, @content_html,
    @meta_title, @meta_description, @og_title, @og_description, @twitter_card_type,
    @focus_keyword, @secondary_keywords, @cover_image_alt, @reading_time_min, @word_count, @translation_source, datetime('now')
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
    secondary_keywords = excluded.secondary_keywords,
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

// ---------- Helpers ricos pra /blog landing ----------

export interface BlogCardData {
  id: number;
  slug: string;
  cover_image: string | null;
  published_at: string | null;
  featured: number;
  title: string;
  excerpt: string | null;
  reading_time_min: number | null;
  category_slug: string | null;
  category_name: string | null;
  category_color: string | null;
  author_name: string | null;
  author_avatar: string | null;
  tags_csv: string | null; // "tag1|slug1|tag2|slug2" — máx 3
}

const blogCardSelect = `
  SELECT
    p.id, p.slug, p.cover_image, p.published_at, p.featured,
    t.title, t.excerpt, t.reading_time_min,
    cat.slug AS category_slug,
    COALESCE(catt.name, cat.slug) AS category_name,
    cat.color AS category_color,
    u.name AS author_name, u.avatar_url AS author_avatar,
    (
      SELECT GROUP_CONCAT(tg.name || '|' || tg.slug, '||')
      FROM (
        SELECT tg.name, tg.slug
        FROM post_tags ptg
        INNER JOIN tags tg ON tg.id = ptg.tag_id
        WHERE ptg.post_id = p.id
        ORDER BY tg.name
        LIMIT 3
      ) AS tg
    ) AS tags_csv
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  LEFT JOIN categories cat ON cat.id = p.category_id
  LEFT JOIN category_translations catt ON catt.category_id = cat.id AND catt.locale = ?
  LEFT JOIN users u ON u.id = p.author_id
  WHERE p.status = 'published' AND p.published_at IS NOT NULL
`;

const listPostsForBlogStmt = db.prepare(
  `${blogCardSelect}
   AND p.featured = 0
   ORDER BY p.published_at DESC
   LIMIT ? OFFSET ?`,
);

const countPostsForBlogStmt = db.prepare(
  `SELECT COUNT(*) AS c
   FROM posts p
   INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
   WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.featured = 0`,
);

const listFeaturedForBlogStmt = db.prepare(
  `${blogCardSelect}
   AND p.featured = 1
   ORDER BY p.published_at DESC
   LIMIT ?`,
);

export function listPublishedPostsForBlog(
  locale: Locale,
  page = 1,
  pageSize = 9,
): { items: BlogCardData[]; total: number; page: number; pageSize: number } {
  const offset = (page - 1) * pageSize;
  const items = listPostsForBlogStmt.all(locale, locale, pageSize, offset) as BlogCardData[];
  const total = (countPostsForBlogStmt.get(locale) as { c: number }).c;
  return { items, total, page, pageSize };
}

export function listFeaturedPostsForBlog(locale: Locale, limit = 3): BlogCardData[] {
  return listFeaturedForBlogStmt.all(locale, locale, limit) as BlogCardData[];
}

export interface CategoryWithCount {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  post_count: number;
}

const listCategoriesWithCountStmt = db.prepare(`
  SELECT c.id, c.slug, COALESCE(t.name, c.slug) AS name, c.color,
    (SELECT COUNT(*) FROM posts p
     INNER JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = ?
     WHERE p.category_id = c.id AND p.status = 'published') AS post_count
  FROM categories c
  LEFT JOIN category_translations t ON t.category_id = c.id AND t.locale = ?
  WHERE EXISTS (
    SELECT 1 FROM posts p2
    INNER JOIN post_translations pt2 ON pt2.post_id = p2.id AND pt2.locale = ?
    WHERE p2.category_id = c.id AND p2.status = 'published'
  )
  ORDER BY post_count DESC, name COLLATE NOCASE
`);

export function listCategoriesWithPostCount(locale: Locale): CategoryWithCount[] {
  return listCategoriesWithCountStmt.all(locale, locale, locale) as CategoryWithCount[];
}

export interface TagCloudItem {
  id: number;
  slug: string;
  name: string;
  post_count: number;
}

const listPopularTagsStmt = db.prepare(`
  SELECT t.id, t.slug, t.name,
    (SELECT COUNT(DISTINCT pt2.post_id)
     FROM post_tags pt2
     INNER JOIN posts p2 ON p2.id = pt2.post_id
     INNER JOIN post_translations ptr ON ptr.post_id = p2.id AND ptr.locale = ?
     WHERE pt2.tag_id = t.id AND p2.status = 'published') AS post_count
  FROM tags t
  WHERE EXISTS (
    SELECT 1 FROM post_tags pt
    INNER JOIN posts p ON p.id = pt.post_id
    INNER JOIN post_translations ptr ON ptr.post_id = p.id AND ptr.locale = ?
    WHERE pt.tag_id = t.id AND p.status = 'published'
  )
  ORDER BY post_count DESC, t.name COLLATE NOCASE
  LIMIT ?
`);

export function listPopularTags(locale: Locale, limit = 30): TagCloudItem[] {
  return listPopularTagsStmt.all(locale, locale, limit) as TagCloudItem[];
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

// ---------- Full-text search ----------

function buildFtsQuery(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => {
      const cleaned = term.replace(/["']/g, "");
      if (cleaned.length === 0) return null;
      return `"${cleaned}"*`;
    })
    .filter(Boolean)
    .join(" AND ");
}

const fullTextSearchStmt = db.prepare(`
  SELECT p.id, p.slug, p.cover_image, p.published_at, p.created_at, p.updated_at,
         p.status, p.source_locale, t.title, t.excerpt, t.locale,
         snippet(post_translations_fts, 2, '<mark>', '</mark>', '…', 24) AS snippet,
         bm25(post_translations_fts) AS rank
  FROM post_translations_fts
  INNER JOIN post_translations t ON t.rowid = post_translations_fts.rowid
  INNER JOIN posts p ON p.id = t.post_id
  WHERE post_translations_fts MATCH ?
    AND t.locale = ?
    AND p.status = 'published'
  ORDER BY rank
  LIMIT ? OFFSET ?
`);

const fullTextSearchCountStmt = db.prepare(`
  SELECT COUNT(*) AS c
  FROM post_translations_fts
  INNER JOIN post_translations t ON t.rowid = post_translations_fts.rowid
  INNER JOIN posts p ON p.id = t.post_id
  WHERE post_translations_fts MATCH ?
    AND t.locale = ?
    AND p.status = 'published'
`);

export interface SearchResult extends PostListItem {
  snippet: string;
}

export function searchPosts(
  locale: Locale,
  query: string,
  page = 1,
  pageSize = 20,
): { items: SearchResult[]; total: number; pageSize: number; page: number } {
  const fts = buildFtsQuery(query);
  if (!fts) return { items: [], total: 0, pageSize, page };
  try {
    const items = fullTextSearchStmt.all(
      fts,
      locale,
      pageSize,
      (page - 1) * pageSize,
    ) as SearchResult[];
    const total = (fullTextSearchCountStmt.get(fts, locale) as { c: number }).c;
    return { items, total, pageSize, page };
  } catch {
    return { items: [], total: 0, pageSize, page };
  }
}

// ---------- Category / tag listings ----------

const listByCategoryStmt = db.prepare(
  `${blogCardSelect}
   AND p.category_id IN (SELECT id FROM categories WHERE slug = ?)
   ORDER BY p.published_at DESC
   LIMIT ? OFFSET ?`,
);
const countByCategoryStmt = db.prepare(`
  SELECT COUNT(*) AS c
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
  INNER JOIN categories c ON c.id = p.category_id
  WHERE p.status = 'published' AND p.published_at IS NOT NULL
    AND c.slug = ?
`);
const listByTagStmt = db.prepare(
  `${blogCardSelect}
   AND p.id IN (
     SELECT pt2.post_id FROM post_tags pt2
     INNER JOIN tags tg2 ON tg2.id = pt2.tag_id
     WHERE tg2.slug = ?
   )
   ORDER BY p.published_at DESC
   LIMIT ? OFFSET ?`,
);
const countByTagStmt = db.prepare(`
  SELECT COUNT(*) AS c
  FROM posts p
  INNER JOIN post_tags pt ON pt.post_id = p.id
  INNER JOIN tags tg ON tg.id = pt.tag_id
  WHERE p.status = 'published' AND p.published_at IS NOT NULL
    AND tg.slug = ?
`);

export function listPostsByCategory(
  categorySlug: string,
  locale: Locale,
  page = 1,
  pageSize = 12,
): { items: BlogCardData[]; total: number; pageSize: number; page: number } {
  const items = listByCategoryStmt.all(
    locale,
    locale,
    categorySlug,
    pageSize,
    (page - 1) * pageSize,
  ) as BlogCardData[];
  const total = (countByCategoryStmt.get(locale, categorySlug) as { c: number }).c;
  return { items, total, pageSize, page };
}

export function listPostsByTag(
  tagSlug: string,
  locale: Locale,
  page = 1,
  pageSize = 12,
): { items: BlogCardData[]; total: number; pageSize: number; page: number } {
  const items = listByTagStmt.all(
    locale,
    locale,
    tagSlug,
    pageSize,
    (page - 1) * pageSize,
  ) as BlogCardData[];
  const total = (countByTagStmt.get(tagSlug) as { c: number }).c;
  return { items, total, pageSize, page };
}

const getCategoryBySlugStmt = db.prepare(`
  SELECT c.id, c.slug, c.color, COALESCE(t.name, c.slug) AS name, t.description
  FROM categories c
  LEFT JOIN category_translations t ON t.category_id = c.id AND t.locale = ?
  WHERE c.slug = ?
`);
const getTagBySlugStmt = db.prepare(
  "SELECT id, slug, name FROM tags WHERE slug = ?",
);

export interface CategoryDetail {
  id: number;
  slug: string;
  color: string | null;
  name: string;
  description: string | null;
}

export function getCategoryBySlug(
  slug: string,
  locale: Locale,
): CategoryDetail | null {
  const row = getCategoryBySlugStmt.get(locale, slug) as CategoryDetail | undefined;
  return row ?? null;
}

export function getTagBySlug(slug: string) {
  return getTagBySlugStmt.get(slug) as
    | { id: number; slug: string; name: string }
    | undefined ?? null;
}

const listAllCategorySlugsStmt = db.prepare("SELECT slug FROM categories");
const listAllTagSlugsStmt = db.prepare(`
  SELECT DISTINCT tg.slug
  FROM tags tg
  INNER JOIN post_tags pt ON pt.tag_id = tg.id
  INNER JOIN posts p ON p.id = pt.post_id
  WHERE p.status = 'published'
`);

export function listAllCategorySlugs(): string[] {
  return (listAllCategorySlugsStmt.all() as { slug: string }[]).map((r) => r.slug);
}

export function listAllTagSlugsWithPosts(): string[] {
  return (listAllTagSlugsStmt.all() as { slug: string }[]).map((r) => r.slug);
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
        secondary_keywords: t.secondary_keywords ?? null,
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
    secondary_keywords: translation.secondary_keywords ?? null,
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

const publishScheduledStmt = db.prepare(`
  UPDATE posts
  SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
  WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= datetime('now')
`);

const listScheduledDueStmt = db.prepare<[], { id: number }>(
  `SELECT id FROM posts
   WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= datetime('now')`,
);

export function publishScheduledPosts(): { count: number; ids: number[] } {
  // Captura IDs antes do update (status muda pra published e some do filtro depois)
  const due = listScheduledDueStmt.all();
  const ids = due.map((r) => r.id);
  const info = publishScheduledStmt.run();
  return { count: info.changes, ids };
}
