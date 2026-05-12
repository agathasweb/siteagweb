-- Schema Agathas Web (SQLite)
-- Suporta multi-idioma via tabela de traduções com chave composta (post_id, locale).

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_locale TEXT NOT NULL DEFAULT 'pt-BR',
  author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cover_image  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

CREATE TABLE IF NOT EXISTS post_translations (
  post_id           INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale            TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
  title             TEXT NOT NULL,
  excerpt           TEXT,
  content_html      TEXT NOT NULL,
  meta_title        TEXT,
  meta_description  TEXT,
  translation_source TEXT NOT NULL DEFAULT 'manual' CHECK (translation_source = 'manual' OR translation_source LIKE 'ai-%'),
  translated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_locale ON post_translations(locale);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
