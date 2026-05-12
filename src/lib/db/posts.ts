import "server-only";
import { db } from "./index";
import type { Locale } from "@/lib/i18n";

export type PostStatus = "draft" | "published" | "archived";
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
  translation_source: TranslationSource;
}

export interface PostTranslationInput {
  locale: Locale;
  title: string;
  excerpt?: string | null;
  content_html: string;
  meta_title?: string | null;
  meta_description?: string | null;
  translation_source?: TranslationSource;
}

export interface CreatePostInput {
  slug: string;
  status?: PostStatus;
  source_locale: Locale;
  author_id?: number | null;
  cover_image?: string | null;
  translations: PostTranslationInput[];
}

export interface UpdatePostInput {
  slug?: string;
  status?: PostStatus;
  cover_image?: string | null;
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
  SELECT p.id, p.slug, p.status, p.source_locale, p.cover_image,
         p.published_at, p.created_at, p.updated_at,
         t.title, t.excerpt, t.content_html, t.meta_title, t.meta_description,
         t.translation_source, t.locale
  FROM posts p
  INNER JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
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
  INSERT INTO posts (slug, status, source_locale, author_id, cover_image, published_at)
  VALUES (@slug, @status, @source_locale, @author_id, @cover_image, @published_at)
`);

const insertTranslationStmt = db.prepare(`
  INSERT INTO post_translations
    (post_id, locale, title, excerpt, content_html, meta_title, meta_description, translation_source)
  VALUES
    (@post_id, @locale, @title, @excerpt, @content_html, @meta_title, @meta_description, @translation_source)
`);

const upsertTranslationStmt = db.prepare(`
  INSERT INTO post_translations
    (post_id, locale, title, excerpt, content_html, meta_title, meta_description, translation_source, translated_at)
  VALUES
    (@post_id, @locale, @title, @excerpt, @content_html, @meta_title, @meta_description, @translation_source, datetime('now'))
  ON CONFLICT(post_id, locale) DO UPDATE SET
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_html = excluded.content_html,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description,
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
  const row = getBySlugStmt.get(locale, slug) as PostDetail | undefined;
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

export function createPost(input: CreatePostInput): number {
  const tx = db.transaction((data: CreatePostInput) => {
    const result = insertPostStmt.run({
      slug: data.slug,
      status: data.status ?? "draft",
      source_locale: data.source_locale,
      author_id: data.author_id ?? null,
      cover_image: data.cover_image ?? null,
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
    translation_source: translation.translation_source ?? "manual",
  });
}

export function updatePost(id: number, input: UpdatePostInput): void {
  const fields: string[] = [];
  const values: Record<string, unknown> = { id };
  if (input.slug !== undefined) {
    fields.push("slug = @slug");
    values.slug = input.slug;
  }
  if (input.status !== undefined) {
    fields.push("status = @status");
    values.status = input.status;
    if (input.status === "published" && input.published_at === undefined) {
      fields.push("published_at = datetime('now')");
    }
  }
  if (input.cover_image !== undefined) {
    fields.push("cover_image = @cover_image");
    values.cover_image = input.cover_image;
  }
  if (input.published_at !== undefined) {
    fields.push("published_at = @published_at");
    values.published_at = input.published_at;
  }
  fields.push("updated_at = datetime('now')");
  if (fields.length === 1) return;
  db.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = @id`).run(values);
}

export function deletePost(id: number): void {
  deletePostStmt.run(id);
}
