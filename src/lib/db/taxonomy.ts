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
