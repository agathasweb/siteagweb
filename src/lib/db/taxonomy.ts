import "server-only";
import { db } from "./index";
import type { Locale } from "@/lib/i18n";

export interface CategoryListItem {
  id: number;
  slug: string;
  color: string | null;
  name: string;
}

const listCategoriesStmt = db.prepare(`
  SELECT c.id, c.slug, c.color, COALESCE(t.name, c.slug) AS name
  FROM categories c
  LEFT JOIN category_translations t ON t.category_id = c.id AND t.locale = ?
  ORDER BY name COLLATE NOCASE
`);

export function listCategories(locale: Locale): CategoryListItem[] {
  return listCategoriesStmt.all(locale) as CategoryListItem[];
}

const listAllCategoriesStmt = db.prepare(
  "SELECT id, slug, color, created_at FROM categories ORDER BY slug",
);
const insertCategoryStmt = db.prepare(
  "INSERT INTO categories (slug, color) VALUES (?, ?)",
);
const deleteCategoryStmt = db.prepare("DELETE FROM categories WHERE id = ?");
const updateCategoryStmt = db.prepare(
  "UPDATE categories SET slug = ?, color = ? WHERE id = ?",
);
const listCategoryTranslationsStmt = db.prepare(
  "SELECT category_id, locale, name, description FROM category_translations WHERE category_id = ?",
);
const upsertCategoryTranslationStmt = db.prepare(`
  INSERT INTO category_translations (category_id, locale, name, description)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(category_id, locale) DO UPDATE SET
    name = excluded.name,
    description = excluded.description
`);

export interface CategoryWithTranslations {
  id: number;
  slug: string;
  color: string | null;
  created_at: string;
  translations: Record<string, { name: string; description: string | null }>;
}

export function listAllCategories(): CategoryWithTranslations[] {
  const cats = listAllCategoriesStmt.all() as {
    id: number;
    slug: string;
    color: string | null;
    created_at: string;
  }[];
  return cats.map((c) => {
    const trans = listCategoryTranslationsStmt.all(c.id) as {
      category_id: number;
      locale: string;
      name: string;
      description: string | null;
    }[];
    const translations: Record<string, { name: string; description: string | null }> = {};
    for (const t of trans) {
      translations[t.locale] = { name: t.name, description: t.description };
    }
    return { ...c, translations };
  });
}

export function createCategory(slug: string, color: string | null): number {
  const result = insertCategoryStmt.run(slug, color);
  return Number(result.lastInsertRowid);
}

export function updateCategory(id: number, slug: string, color: string | null): void {
  updateCategoryStmt.run(slug, color, id);
}

export function deleteCategory(id: number): void {
  deleteCategoryStmt.run(id);
}

export function upsertCategoryTranslation(
  categoryId: number,
  locale: string,
  name: string,
  description: string | null,
): void {
  upsertCategoryTranslationStmt.run(categoryId, locale, name, description);
}

// ---------- Tags ----------

const listAllTagsStmt = db.prepare(`
  SELECT t.id, t.slug, t.name,
         (SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) AS post_count
  FROM tags t
  ORDER BY post_count DESC, t.name COLLATE NOCASE
`);
const updateTagStmt = db.prepare("UPDATE tags SET slug = ?, name = ? WHERE id = ?");
const deleteTagStmt = db.prepare("DELETE FROM tags WHERE id = ?");
const mergeTagPostsStmt = db.prepare(
  "UPDATE OR IGNORE post_tags SET tag_id = ? WHERE tag_id = ?",
);
const cleanupMergedPostsStmt = db.prepare("DELETE FROM post_tags WHERE tag_id = ?");

export interface TagWithCount {
  id: number;
  slug: string;
  name: string;
  post_count: number;
}

export function listAllTags(): TagWithCount[] {
  return listAllTagsStmt.all() as TagWithCount[];
}

export function renameTag(id: number, newName: string): void {
  const slug = slugifyTag(newName);
  updateTagStmt.run(slug, newName.trim(), id);
}

export function deleteTag(id: number): void {
  deleteTagStmt.run(id);
}

export function mergeTags(sourceId: number, targetId: number): void {
  const tx = db.transaction(() => {
    mergeTagPostsStmt.run(targetId, sourceId);
    cleanupMergedPostsStmt.run(sourceId);
    deleteTagStmt.run(sourceId);
  });
  tx();
}

const findTagBySlugStmt = db.prepare("SELECT id FROM tags WHERE slug = ?");
const insertTagStmt = db.prepare("INSERT INTO tags (slug, name) VALUES (?, ?)");
const linkPostTagStmt = db.prepare(
  "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)",
);
const clearPostTagsStmt = db.prepare("DELETE FROM post_tags WHERE post_id = ?");
const listPostTagsStmt = db.prepare(`
  SELECT t.id, t.slug, t.name
  FROM post_tags pt
  INNER JOIN tags t ON t.id = pt.tag_id
  WHERE pt.post_id = ?
  ORDER BY t.name COLLATE NOCASE
`);

function slugifyTag(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tag"
  );
}

export function setPostTags(postId: number, names: string[]): void {
  const unique = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length > 0)),
  );
  const tx = db.transaction(() => {
    clearPostTagsStmt.run(postId);
    for (const name of unique) {
      const slug = slugifyTag(name);
      let row = findTagBySlugStmt.get(slug) as { id: number } | undefined;
      if (!row) {
        const result = insertTagStmt.run(slug, name);
        row = { id: Number(result.lastInsertRowid) };
      }
      linkPostTagStmt.run(postId, row.id);
    }
  });
  tx();
}

export interface PostTagItem {
  id: number;
  slug: string;
  name: string;
}

export function listPostTags(postId: number): PostTagItem[] {
  return listPostTagsStmt.all(postId) as PostTagItem[];
}

export interface PostFaqItem {
  id: number;
  sort_order: number;
  question: string;
  answer: string;
}

const listPostFaqsStmt = db.prepare(`
  SELECT f.id, f.sort_order, t.question, t.answer
  FROM post_faqs f
  INNER JOIN post_faq_translations t ON t.faq_id = f.id AND t.locale = ?
  WHERE f.post_id = ?
  ORDER BY f.sort_order ASC, f.id ASC
`);

export function listPostFaqs(postId: number, locale: string): PostFaqItem[] {
  return listPostFaqsStmt.all(locale, postId) as PostFaqItem[];
}

const listAllFaqsStmt = db.prepare(`
  SELECT id, sort_order FROM post_faqs WHERE post_id = ? ORDER BY sort_order ASC, id ASC
`);
const insertFaqStmt = db.prepare(
  `INSERT INTO post_faqs (post_id, sort_order) VALUES (?, ?)`,
);
const deleteFaqStmt = db.prepare(`DELETE FROM post_faqs WHERE id = ? AND post_id = ?`);
const updateFaqOrderStmt = db.prepare(
  `UPDATE post_faqs SET sort_order = ? WHERE id = ? AND post_id = ?`,
);

const listFaqTranslationsStmt = db.prepare(
  `SELECT faq_id, locale, question, answer FROM post_faq_translations WHERE faq_id IN (SELECT id FROM post_faqs WHERE post_id = ?)`,
);
const upsertFaqTranslationStmt = db.prepare(`
  INSERT INTO post_faq_translations (faq_id, locale, question, answer)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(faq_id, locale) DO UPDATE SET
    question = excluded.question,
    answer = excluded.answer
`);

export interface AllFaqs {
  id: number;
  sort_order: number;
  translations: Record<string, { question: string; answer: string }>;
}

export function listAllPostFaqs(postId: number): AllFaqs[] {
  const faqs = listAllFaqsStmt.all(postId) as { id: number; sort_order: number }[];
  const trans = listFaqTranslationsStmt.all(postId) as {
    faq_id: number;
    locale: string;
    question: string;
    answer: string;
  }[];
  return faqs.map((f) => {
    const translations: Record<string, { question: string; answer: string }> = {};
    for (const t of trans.filter((x) => x.faq_id === f.id)) {
      translations[t.locale] = { question: t.question, answer: t.answer };
    }
    return { id: f.id, sort_order: f.sort_order, translations };
  });
}

export function createPostFaq(postId: number, sortOrder: number): number {
  const result = insertFaqStmt.run(postId, sortOrder);
  return Number(result.lastInsertRowid);
}

export function deletePostFaq(postId: number, faqId: number): void {
  deleteFaqStmt.run(faqId, postId);
}

export function reorderPostFaqs(postId: number, orderedIds: number[]): void {
  const tx = db.transaction(() => {
    orderedIds.forEach((id, idx) => {
      updateFaqOrderStmt.run(idx, id, postId);
    });
  });
  tx();
}

export function upsertFaqTranslation(
  faqId: number,
  locale: string,
  question: string,
  answer: string,
): void {
  upsertFaqTranslationStmt.run(faqId, locale, question, answer);
}
