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

-- ============================================================================
-- AGENDADOR + RELATÓRIOS SOCIAL (Instagram + LinkedIn)
-- ============================================================================

-- Contas Instagram/LinkedIn gerenciadas pelo painel.
-- O `provider` indica qual plataforma — facilita expandir pra TikTok/X depois.
CREATE TABLE IF NOT EXISTS social_accounts (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  provider             TEXT NOT NULL CHECK (provider IN ('instagram', 'linkedin')),
  -- Display
  display_name         TEXT NOT NULL,
  username             TEXT NOT NULL,
  profile_picture_url  TEXT,
  -- Instagram (via Meta Graph + página FB)
  ig_user_id           TEXT,
  fb_page_id           TEXT,
  -- LinkedIn (Fase 8)
  linkedin_org_urn     TEXT,
  linkedin_person_urn  TEXT,
  linkedin_token       TEXT,
  linkedin_token_expires_at TEXT,
  -- Metadados
  followers_count      INTEGER DEFAULT 0,
  media_count          INTEGER DEFAULT 0,
  ativo                INTEGER NOT NULL DEFAULT 1,
  last_sync_at         TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, ig_user_id),
  UNIQUE(provider, linkedin_org_urn)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider, ativo);

-- Posts agendados (rascunho → agendado → publicando → publicado | falhou).
-- `media_urls` é JSON array de paths absolutos no servidor (uploads/social/...).
-- Pra carrossel temos múltiplas URLs; pra feed/story/reel só a primeira.
CREATE TABLE IF NOT EXISTS social_scheduled_posts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id        INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('feed_image', 'feed_video', 'reel', 'carousel', 'story_image', 'story_video', 'linkedin_text', 'linkedin_image', 'linkedin_video')),
  caption           TEXT,
  hashtags          TEXT,                       -- JSON array
  media_urls        TEXT,                       -- JSON array de paths
  cover_url         TEXT,                       -- thumbnail customizado (reel)
  location_id       TEXT,                       -- IG location_id opcional
  scheduled_at      TEXT NOT NULL,              -- ISO datetime UTC
  status            TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','agendado','publicando','publicado','falhou','cancelado')),
  ig_media_id       TEXT,                       -- Set após publicação IG
  linkedin_post_urn TEXT,                       -- Set após publicação LinkedIn
  permalink         TEXT,
  published_at      TEXT,
  attempts          INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scheduled_status_date ON social_scheduled_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_account ON social_scheduled_posts(account_id, scheduled_at);

-- Posts publicados (sincronizados da Graph API). Espelha o histórico real
-- do feed/reel/story com as métricas mais recentes.
CREATE TABLE IF NOT EXISTS social_published_posts (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id          INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,
  external_id         TEXT NOT NULL,            -- ig_media_id ou linkedin_urn
  type                TEXT NOT NULL,            -- feed_image, feed_video, reel, story, etc.
  caption             TEXT,
  permalink           TEXT,
  thumbnail_url       TEXT,
  media_url           TEXT,
  -- Métricas
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,
  views               INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  engagement_total    INTEGER DEFAULT 0,
  profile_visits      INTEGER DEFAULT 0,
  follows             INTEGER DEFAULT 0,
  avg_watch_time_ms   INTEGER,                  -- reels apenas
  -- Timestamps
  published_at        TEXT NOT NULL,
  last_sync_at        TEXT NOT NULL DEFAULT (datetime('now')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_published_account_date ON social_published_posts(account_id, published_at);
CREATE INDEX IF NOT EXISTS idx_published_external ON social_published_posts(external_id);

-- Insights diários da conta como um todo (não por post).
-- Permite plotar crescimento de seguidores, alcance/impressões totais, etc.
CREATE TABLE IF NOT EXISTS social_insights_daily (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id          INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  date                TEXT NOT NULL,            -- YYYY-MM-DD
  followers_count     INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  impressions         INTEGER DEFAULT 0,
  profile_views       INTEGER DEFAULT 0,
  website_clicks      INTEGER DEFAULT 0,
  email_clicks        INTEGER DEFAULT 0,
  phone_clicks        INTEGER DEFAULT 0,
  follower_count_delta INTEGER DEFAULT 0,       -- diff vs ontem (cache)
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, date)
);

CREATE INDEX IF NOT EXISTS idx_insights_account_date ON social_insights_daily(account_id, date);

-- Demografia da audiência (snapshot do mês corrente).
-- Refresh semanal — IG não dá histórico, sempre o estado atual.
CREATE TABLE IF NOT EXISTS social_audience (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id    INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  dimension     TEXT NOT NULL,                  -- age, gender, city, country
  bucket        TEXT NOT NULL,                  -- "18-24", "F", "São Paulo, BR"
  value         INTEGER NOT NULL DEFAULT 0,
  captured_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, dimension, bucket)
);

CREATE INDEX IF NOT EXISTS idx_audience_account_dim ON social_audience(account_id, dimension);

-- ============================================================================
-- META ADS — Gestão de campanhas pagas (apenas Agathas Principal + Voyia AGWEB)
-- ============================================================================

-- Ad accounts que o admin escolheu gerenciar (das 13 que o token enxerga, só 2).
-- A descoberta puxa todas mas o `ativo` controla quais aparecem no painel.
CREATE TABLE IF NOT EXISTS ads_accounts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_account_id     TEXT NOT NULL UNIQUE,  -- formato "act_XXXXXX"
  name              TEXT NOT NULL,
  account_status    INTEGER NOT NULL,      -- 1=ATIVA, 2=desabilitada, 3=fechada
  currency          TEXT NOT NULL DEFAULT 'BRL',
  timezone_name     TEXT,
  business_id       TEXT,
  business_name     TEXT,
  amount_spent      REAL DEFAULT 0,        -- gasto histórico total
  balance           REAL DEFAULT 0,
  ativo             INTEGER NOT NULL DEFAULT 0,  -- 0=ignorado, 1=gerenciado
  last_sync_at      TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_accounts_ativo ON ads_accounts(ativo);

-- Mirror local das campanhas. Espelha o que está na Meta — ID original
-- (`external_id`) é o do Graph API, que é a fonte da verdade.
CREATE TABLE IF NOT EXISTS ads_campaigns (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_account_id       TEXT NOT NULL,                -- act_xxxx
  external_id         TEXT NOT NULL UNIQUE,         -- ID Meta da campanha
  name                TEXT NOT NULL,
  objective           TEXT NOT NULL,                -- OUTCOME_TRAFFIC, OUTCOME_LEADS, etc.
  status              TEXT NOT NULL,                -- ACTIVE, PAUSED, DELETED, ARCHIVED
  daily_budget_brl    REAL,                         -- guardado em REAIS (não centavos)
  lifetime_budget_brl REAL,
  spend_cap_brl       REAL NOT NULL,                -- TETO ABSOLUTO obrigatório
  buying_type         TEXT,                         -- AUCTION (default), RESERVED
  start_time          TEXT,
  stop_time           TEXT,
  -- Mirror de métricas (atualizado pelo cron de sync)
  spent_brl           REAL DEFAULT 0,
  impressions         INTEGER DEFAULT 0,
  clicks              INTEGER DEFAULT 0,
  conversions         INTEGER DEFAULT 0,
  ctr                 REAL DEFAULT 0,
  cpc_brl             REAL DEFAULT 0,
  cpm_brl             REAL DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  frequency           REAL DEFAULT 0,
  -- Audit
  created_by_user_id  INTEGER,                       -- FK users (admin que criou)
  created_at_meta     TEXT,                          -- timestamp Meta
  last_sync_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_campaigns_account ON ads_campaigns(ad_account_id, status);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_external ON ads_campaigns(external_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_status ON ads_campaigns(status);

-- Audit log — toda action (create, pause, resume, delete, edit) fica registrada.
-- Permite reconstituir histórico em caso de "quem mexeu nessa campanha?".
CREATE TABLE IF NOT EXISTS ads_action_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  action          TEXT NOT NULL,           -- create_campaign, pause, resume, delete, edit_budget, etc.
  ad_account_id   TEXT,
  campaign_id     TEXT,                    -- external_id da Meta
  user_id         INTEGER,
  user_email      TEXT,
  payload_json    TEXT,                    -- request enviada
  response_json   TEXT,                    -- resposta Meta (success ou error)
  success         INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  fbtrace_id      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_log_campaign ON ads_action_log(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ads_log_action ON ads_action_log(action, created_at);
CREATE INDEX IF NOT EXISTS idx_ads_log_created_at ON ads_action_log(created_at);
