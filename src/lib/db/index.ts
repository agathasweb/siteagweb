import "server-only";
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const DB_PATH =
  process.env.DATABASE_PATH ?? join(process.cwd(), "data", "agathas.db");

const SCHEMA_PATH = join(process.cwd(), "src", "lib", "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __agathasDb: Database.Database | undefined;
}

function migratePostTranslationsCheck(conn: Database.Database): void {
  // SQLite não permite ALTER TABLE para mudar CHECK constraint. Se a tabela
  // antiga existe com o CHECK restrito (apenas ai-openai/anthropic/google),
  // recria preservando os dados com o novo CHECK permissivo (ai-*).
  const tableInfo = conn
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='post_translations'",
    )
    .get() as { sql?: string } | undefined;
  if (!tableInfo?.sql) return;
  if (!tableInfo.sql.includes("'ai-anthropic'")) return;

  conn.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;

    CREATE TABLE post_translations_new (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      locale TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
      title TEXT NOT NULL,
      excerpt TEXT,
      content_html TEXT NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      translation_source TEXT NOT NULL DEFAULT 'manual' CHECK (translation_source = 'manual' OR translation_source LIKE 'ai-%'),
      translated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (post_id, locale)
    );

    INSERT INTO post_translations_new
      SELECT post_id, locale, title, excerpt, content_html, meta_title, meta_description, translation_source, translated_at
      FROM post_translations;

    DROP TABLE post_translations;
    ALTER TABLE post_translations_new RENAME TO post_translations;

    CREATE INDEX IF NOT EXISTS idx_translations_locale ON post_translations(locale);

    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

function createConnection(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  const schemaSql = readFileSync(SCHEMA_PATH, "utf8");
  conn.exec(schemaSql);
  migratePostTranslationsCheck(conn);
  return conn;
}

export const db: Database.Database = globalThis.__agathasDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__agathasDb = db;
}
