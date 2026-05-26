-- Schema Agathas Web (SQLite)
-- Suporta multi-idioma via tabelas de tradução com chave composta.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  bio           TEXT,
  avatar_url    TEXT,
  social_links  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  color       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
  name        TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (category_id, locale)
);

CREATE TABLE IF NOT EXISTS tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  source_locale       TEXT NOT NULL DEFAULT 'pt-BR',
  author_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);

CREATE TABLE IF NOT EXISTS post_translations (
  post_id            INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale             TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
  title              TEXT NOT NULL,
  excerpt            TEXT,
  content_html       TEXT NOT NULL,
  meta_title         TEXT,
  meta_description   TEXT,
  og_title           TEXT,
  og_description     TEXT,
  twitter_card_type  TEXT NOT NULL DEFAULT 'summary_large_image' CHECK (twitter_card_type IN ('summary', 'summary_large_image')),
  focus_keyword       TEXT,
  secondary_keywords  TEXT,
  cover_image_alt     TEXT,
  reading_time_min    INTEGER,
  word_count          INTEGER,
  translation_source  TEXT NOT NULL DEFAULT 'manual' CHECK (translation_source = 'manual' OR translation_source LIKE 'ai-%'),
  translated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_locale ON post_translations(locale);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS post_images (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  path         TEXT NOT NULL,
  path_thumb   TEXT,
  path_medium  TEXT,
  path_large   TEXT,
  width        INTEGER,
  height       INTEGER,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_image_translations (
  image_id INTEGER NOT NULL REFERENCES post_images(id) ON DELETE CASCADE,
  locale   TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
  alt      TEXT NOT NULL,
  caption  TEXT,
  PRIMARY KEY (image_id, locale)
);

CREATE TABLE IF NOT EXISTS post_faqs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS post_faq_translations (
  faq_id   INTEGER NOT NULL REFERENCES post_faqs(id) ON DELETE CASCADE,
  locale   TEXT NOT NULL CHECK (locale IN ('pt-BR', 'es', 'en-US', 'en-GB')),
  question TEXT NOT NULL,
  answer   TEXT NOT NULL,
  PRIMARY KEY (faq_id, locale)
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Full-text search virtual table espelhando post_translations.
-- Mantida em sincronia pelos triggers abaixo.
CREATE VIRTUAL TABLE IF NOT EXISTS post_translations_fts USING fts5(
  title, excerpt, content_html, focus_keyword,
  content='post_translations',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS post_translations_fts_ai
AFTER INSERT ON post_translations BEGIN
  INSERT INTO post_translations_fts(rowid, title, excerpt, content_html, focus_keyword)
  VALUES (new.rowid, new.title, COALESCE(new.excerpt, ''), new.content_html, COALESCE(new.focus_keyword, ''));
END;

CREATE TRIGGER IF NOT EXISTS post_translations_fts_au
AFTER UPDATE ON post_translations BEGIN
  INSERT INTO post_translations_fts(post_translations_fts, rowid, title, excerpt, content_html, focus_keyword)
  VALUES ('delete', old.rowid, old.title, COALESCE(old.excerpt, ''), old.content_html, COALESCE(old.focus_keyword, ''));
  INSERT INTO post_translations_fts(rowid, title, excerpt, content_html, focus_keyword)
  VALUES (new.rowid, new.title, COALESCE(new.excerpt, ''), new.content_html, COALESCE(new.focus_keyword, ''));
END;

CREATE TRIGGER IF NOT EXISTS post_translations_fts_ad
AFTER DELETE ON post_translations BEGIN
  INSERT INTO post_translations_fts(post_translations_fts, rowid, title, excerpt, content_html, focus_keyword)
  VALUES ('delete', old.rowid, old.title, COALESCE(old.excerpt, ''), old.content_html, COALESCE(old.focus_keyword, ''));
END;

-- Leads capturados em formulários públicos (contato + CTAs WhatsApp)
CREATE TABLE IF NOT EXISTS leads (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  source             TEXT NOT NULL CHECK (source IN ('contact_form', 'whatsapp_cta', 'quote_request', 'other')),
  name               TEXT NOT NULL,
  email              TEXT NOT NULL,
  phone              TEXT,
  service            TEXT,
  message            TEXT,
  origin_page        TEXT,
  status             TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'spam')),
  recaptcha_score    REAL,
  ip                 TEXT,
  user_agent         TEXT,
  locale             TEXT,
  notes              TEXT,
  tags               TEXT,
  subscription_id    INTEGER,
  -- Meta attribution
  fbp                TEXT,
  fbc                TEXT,
  fbclid             TEXT,
  gclid              TEXT,
  utm_source         TEXT,
  utm_medium         TEXT,
  utm_campaign       TEXT,
  utm_term           TEXT,
  utm_content        TEXT,
  meta_event_id      TEXT,
  meta_lead_sent_at  TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  contacted_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Assinaturas criadas via checkout ASAAS (tráfego pago + Voyia)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  asaas_subscription_id       TEXT NOT NULL UNIQUE,
  asaas_customer_id           TEXT NOT NULL,
  plan_key                    TEXT NOT NULL,
  category                    TEXT NOT NULL,
  customer_name               TEXT NOT NULL,
  customer_email              TEXT NOT NULL,
  customer_phone              TEXT,
  customer_cpf_cnpj           TEXT,
  customer_city               TEXT,
  customer_state              TEXT,
  customer_zip                TEXT,
  customer_country            TEXT,
  value                       REAL NOT NULL,
  cycle                       TEXT NOT NULL,
  billing_type                TEXT NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'PENDING',
  account_token               TEXT,
  account_created             INTEGER NOT NULL DEFAULT 0,
  confirmation_email_sent     INTEGER NOT NULL DEFAULT 0,
  -- Meta attribution (capturado no checkout, reusado no webhook)
  fbp                         TEXT,
  fbc                         TEXT,
  fbclid                      TEXT,
  gclid                       TEXT,
  utm_source                  TEXT,
  utm_medium                  TEXT,
  utm_campaign                TEXT,
  utm_term                    TEXT,
  utm_content                 TEXT,
  meta_event_id               TEXT,
  -- Idempotência CAPI — evita reenvio em retries do webhook
  meta_initiatecheckout_sent_at TEXT,
  meta_subscribe_sent_at      TEXT,
  meta_purchase_sent_at       TEXT,
  meta_completereg_sent_at    TEXT,
  created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                  TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at                TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_token ON subscriptions(account_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);

-- Log de toda chamada ao Conversions API da Meta. Usado pra:
--   1. Auditoria/debug — buscar por fbtrace_id e ver o evento original.
--   2. Retry — registros com status='failed' ou 'retry_pending' são reenviados
--      pelo cron /api/cron/meta-retry (até 3 tentativas).
--   3. Dashboard — agregação por dia/evento, taxa de sucesso, EMQ proxy.
--
-- Retenção: 90 dias (limpeza pelo mesmo cron de retry).
CREATE TABLE IF NOT EXISTS capi_event_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name      TEXT NOT NULL,
  event_id        TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'retry_pending')),
  fbtrace_id      TEXT,
  http_status     INTEGER,
  error           TEXT,
  attempts        INTEGER NOT NULL DEFAULT 1,
  test_mode       INTEGER NOT NULL DEFAULT 0,
  -- FKs opcionais — permitem cross-reference lead/subscription a partir do log.
  lead_id         INTEGER,
  subscription_id INTEGER,
  -- Payload mínimo pra reprocessar em retry (sem PII em claro).
  -- JSON com: eventName, eventId, eventSourceUrl, actionSource, userData, customData.
  payload_json    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_capi_log_status ON capi_event_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_capi_log_event_id ON capi_event_log(event_id);
CREATE INDEX IF NOT EXISTS idx_capi_log_event_name ON capi_event_log(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_capi_log_created_at ON capi_event_log(created_at);
