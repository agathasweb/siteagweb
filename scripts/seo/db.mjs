// Leitura do acervo de posts para as ferramentas de SEO.
// Usa o node:sqlite nativo (o better-sqlite3 do projeto é compilado para o Node
// do container e quebra quando rodado no host).
//
// Ordem de resolução do banco:
//   1. --db=<caminho>
//   2. data/prod-snapshot.db   (gerado por scripts/seo/snapshot.mjs)
//   3. data/agathas.db         (banco de desenvolvimento — avisa que está local)

import { DatabaseSync } from "node:sqlite";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function resolveDbPath(flagPath) {
  if (flagPath) {
    if (!existsSync(flagPath)) throw new Error(`Banco não encontrado: ${flagPath}`);
    return { path: flagPath, origem: "informado" };
  }
  const snap = join(REPO, "data", "prod-snapshot.db");
  if (existsSync(snap)) return { path: snap, origem: "snapshot de produção" };
  const dev = join(REPO, "data", "agathas.db");
  if (existsSync(dev)) return { path: dev, origem: "banco de desenvolvimento (LOCAL — pode estar desatualizado)" };
  throw new Error("Nenhum banco encontrado. Rode: node scripts/seo/snapshot.mjs");
}

export function openDb(flagPath) {
  const { path, origem } = resolveDbPath(flagPath);
  const idade = Math.round((Date.now() - statSync(path).mtimeMs) / 86_400_000);
  const db = new DatabaseSync(path, { readOnly: true });
  return { db, path, origem, idade };
}

/** Posts publicados com a tradução do idioma-fonte. */
export function publishedPosts(db, locale = "pt-BR") {
  return db
    .prepare(
      `SELECT p.id, p.slug, p.published_at,
              COALESCE(c.slug, '') AS category_slug,
              t.title, t.focus_keyword, t.content_html
         FROM posts p
         JOIN post_translations t ON t.post_id = p.id AND t.locale = ?
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'published'
        ORDER BY p.published_at`,
    )
    .all(locale);
}

/** Slugs de categoria existentes. */
export function categorySlugs(db) {
  return db.prepare("SELECT slug FROM categories ORDER BY slug").all().map((r) => r.slug);
}

const HREF_RE = /href="([^"]+)"/g;

/** Links internos de um HTML, separados em blog e comerciais. */
export function extractLinks(html) {
  const blog = [];
  const comercial = [];
  for (const m of String(html || "").matchAll(HREF_RE)) {
    const href = m[1];
    if (!href.startsWith("/")) continue;
    const path = href.split("#")[0].replace(/\/$/, "");
    if (!path) continue;
    if (path.startsWith("/blog/")) blog.push(path);
    else if (/^\/(produtos|servicos)\//.test(path) || path === "/contato") comercial.push(path);
  }
  return { blog: [...new Set(blog)], comercial: [...new Set(comercial)] };
}

/** Normaliza texto para comparação (sem acento, minúsculo, sem pontuação). */
export function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Similaridade por sobreposição de tokens (Jaccard) — 0 a 1.
 * Frases curtas (menos de 2 tokens significativos) só casam por igualdade
 * exata: "moodle na aws" reduz a {moodle} e casaria com qualquer post de
 * Moodle se fosse comparado por sobreposição.
 */
export function similarity(a, b) {
  const A = new Set(norm(a).split(" ").filter((w) => w.length > 3));
  const B = new Set(norm(b).split(" ").filter((w) => w.length > 3));
  if (A.size < 2 || B.size < 2) return norm(a) === norm(b) ? 1 : 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export function contarPalavras(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
