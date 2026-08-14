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

interface ColumnInfo {
  name: string;
}

function tableColumns(conn: Database.Database, table: string): Set<string> {
  const rows = conn.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
  return new Set(rows.map((r) => r.name));
}

function tableExists(conn: Database.Database, table: string): boolean {
  const row = conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { name?: string } | undefined;
  return !!row?.name;
}

function addColumnIfMissing(
  conn: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  const cols = tableColumns(conn, table);
  if (cols.has(column)) return;
  conn.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrateTranslationSourceCheck(conn: Database.Database): void {
  if (!tableExists(conn, "post_translations")) return;
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
      post_id            INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      locale             TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
      title              TEXT NOT NULL,
      excerpt            TEXT,
      content_html       TEXT NOT NULL,
      meta_title         TEXT,
      meta_description   TEXT,
      translation_source TEXT NOT NULL DEFAULT 'manual' CHECK (translation_source = 'manual' OR translation_source LIKE 'ai-%'),
      translated_at      TEXT NOT NULL DEFAULT (datetime('now')),
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

function migratePostsStatusCheck(conn: Database.Database): void {
  if (!tableExists(conn, "posts")) return;
  const tableInfo = conn
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'")
    .get() as { sql?: string } | undefined;
  if (!tableInfo?.sql) return;
  const needsScheduled = !tableInfo.sql.includes("'scheduled'");
  const hasArticleTypeCheck = /CHECK\s*\(\s*article_type\s+IN/i.test(tableInfo.sql);
  if (!needsScheduled && !hasArticleTypeCheck) return;

  conn.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;

    CREATE TABLE posts_new (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      slug                TEXT NOT NULL UNIQUE,
      status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
      source_locale       TEXT NOT NULL DEFAULT 'pt-BR',
      author_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
      category_id         INTEGER,
      cover_image         TEXT,
      cover_image_width   INTEGER,
      cover_image_height  INTEGER,
      article_type        TEXT NOT NULL DEFAULT 'BlogPosting',
      noindex             INTEGER NOT NULL DEFAULT 0,
      nofollow            INTEGER NOT NULL DEFAULT 0,
      canonical_url       TEXT,
      scheduled_at        TEXT,
      featured            INTEGER NOT NULL DEFAULT 0,
      video_url           TEXT,
      video_duration_sec  INTEGER,
      video_thumbnail     TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
      published_at        TEXT
    );

    INSERT INTO posts_new (
      id, slug, status, source_locale, author_id, category_id, cover_image,
      cover_image_width, cover_image_height, article_type, noindex, nofollow,
      canonical_url, scheduled_at, featured, video_url, video_duration_sec,
      video_thumbnail, created_at, updated_at, published_at
    )
      SELECT id, slug, status, source_locale, author_id, category_id, cover_image,
             cover_image_width, cover_image_height, article_type, noindex, nofollow,
             canonical_url, scheduled_at, featured, video_url, video_duration_sec,
             video_thumbnail, created_at, updated_at, published_at
      FROM posts;

    DROP TABLE posts;
    ALTER TABLE posts_new RENAME TO posts;

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

function migrateLeadsSourceCheck(conn: Database.Database): void {
  if (!tableExists(conn, "leads")) return;
  const tableInfo = conn
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'")
    .get() as { sql?: string } | undefined;
  if (!tableInfo?.sql) return;
  // Bancos antigos têm o CHECK sem 'quote_request'; reconstrói para alinhar.
  if (tableInfo.sql.includes("'quote_request'")) return;

  const runSql = conn.exec.bind(conn);
  runSql(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;

    CREATE TABLE leads_new (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      source           TEXT NOT NULL CHECK (source IN ('contact_form', 'whatsapp_cta', 'quote_request', 'other')),
      name             TEXT NOT NULL,
      email            TEXT NOT NULL,
      phone            TEXT,
      service          TEXT,
      message          TEXT,
      origin_page      TEXT,
      status           TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'spam')),
      recaptcha_score  REAL,
      ip               TEXT,
      user_agent       TEXT,
      locale           TEXT,
      notes            TEXT,
      tags             TEXT,
      subscription_id  INTEGER,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      contacted_at     TEXT
    );

    INSERT INTO leads_new (
      id, source, name, email, phone, service, message, origin_page, status,
      recaptcha_score, ip, user_agent, locale, notes, tags, subscription_id,
      created_at, contacted_at
    )
      SELECT id, source, name, email, phone, service, message, origin_page, status,
             recaptcha_score, ip, user_agent, locale, notes, tags, subscription_id,
             created_at, contacted_at
      FROM leads;

    DROP TABLE leads;
    ALTER TABLE leads_new RENAME TO leads;

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

function migrateAddedColumns(conn: Database.Database): void {
  if (tableExists(conn, "posts")) {
    const add = (col: string, def: string) => addColumnIfMissing(conn, "posts", col, def);
    add("category_id", "INTEGER");
    add("cover_image_width", "INTEGER");
    add("cover_image_height", "INTEGER");
    add("article_type", "TEXT NOT NULL DEFAULT 'BlogPosting'");
    add("noindex", "INTEGER NOT NULL DEFAULT 0");
    add("nofollow", "INTEGER NOT NULL DEFAULT 0");
    add("canonical_url", "TEXT");
    add("scheduled_at", "TEXT");
    add("featured", "INTEGER NOT NULL DEFAULT 0");
    add("video_url", "TEXT");
    add("video_duration_sec", "INTEGER");
    add("video_thumbnail", "TEXT");
    add("indexed_at", "TEXT");
    add("indexed_status", "TEXT");
  }
  if (tableExists(conn, "post_translations")) {
    const add = (col: string, def: string) => addColumnIfMissing(conn, "post_translations", col, def);
    add("og_title", "TEXT");
    add("og_description", "TEXT");
    add("twitter_card_type", "TEXT NOT NULL DEFAULT 'summary_large_image'");
    add("focus_keyword", "TEXT");
    add("secondary_keywords", "TEXT");
    add("cover_image_alt", "TEXT");
    add("reading_time_min", "INTEGER");
    add("word_count", "INTEGER");
  }
  if (tableExists(conn, "users")) {
    const add = (col: string, def: string) => addColumnIfMissing(conn, "users", col, def);
    add("bio", "TEXT");
    add("avatar_url", "TEXT");
    add("social_links", "TEXT");
  }
  if (tableExists(conn, "leads")) {
    const add = (col: string, def: string) => addColumnIfMissing(conn, "leads", col, def);
    add("tags", "TEXT");
    add("subscription_id", "INTEGER");
    // Meta attribution
    add("fbp", "TEXT");
    add("fbc", "TEXT");
    add("fbclid", "TEXT");
    add("gclid", "TEXT");
    add("utm_source", "TEXT");
    add("utm_medium", "TEXT");
    add("utm_campaign", "TEXT");
    add("utm_term", "TEXT");
    add("utm_content", "TEXT");
    add("meta_event_id", "TEXT");
    add("meta_lead_sent_at", "TEXT");
    // Contact (qualificação) enviado ao Meta quando o lead é marcado qualificado
    add("meta_contact_sent_at", "TEXT");
  }
  if (tableExists(conn, "subscriptions")) {
    const add = (col: string, def: string) =>
      addColumnIfMissing(conn, "subscriptions", col, def);
    add("customer_cpf_cnpj", "TEXT");
    add("customer_city", "TEXT");
    add("customer_state", "TEXT");
    add("customer_zip", "TEXT");
    add("customer_country", "TEXT");
    // Meta attribution
    add("fbp", "TEXT");
    add("fbc", "TEXT");
    add("fbclid", "TEXT");
    add("gclid", "TEXT");
    add("utm_source", "TEXT");
    add("utm_medium", "TEXT");
    add("utm_campaign", "TEXT");
    add("utm_term", "TEXT");
    add("utm_content", "TEXT");
    add("meta_event_id", "TEXT");
    add("meta_initiatecheckout_sent_at", "TEXT");
    add("meta_subscribe_sent_at", "TEXT");
    add("meta_purchase_sent_at", "TEXT");
    add("meta_completereg_sent_at", "TEXT");
    add("abandoned_flagged_at", "TEXT");
  }
  if (tableExists(conn, "capi_event_log")) {
    // Multi-pixel: identifica para qual pixel o evento foi enviado.
    addColumnIfMissing(conn, "capi_event_log", "pixel_id", "TEXT");
  }
}

function migrateFtsRebuild(conn: Database.Database): void {
  try {
    const row = conn
      .prepare("SELECT count(*) AS c FROM post_translations_fts")
      .get() as { c: number };
    const orig = conn
      .prepare("SELECT count(*) AS c FROM post_translations")
      .get() as { c: number };
    if (row.c < orig.c) {
      conn.exec(
        "INSERT INTO post_translations_fts(post_translations_fts) VALUES('rebuild')",
      );
    }
  } catch {
    // FTS table not yet created or rebuild not needed
  }
}

function createConnection(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  const schemaSql = readFileSync(SCHEMA_PATH, "utf8");
  conn.exec(schemaSql);
  migrateTranslationSourceCheck(conn);
  migratePostsStatusCheck(conn);
  migrateAddedColumns(conn);
  migrateLeadsSourceCheck(conn);
  migrateFtsRebuild(conn);
  return conn;
}

export const db: Database.Database = globalThis.__agathasDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__agathasDb = db;
}
