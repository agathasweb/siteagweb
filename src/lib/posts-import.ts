import "server-only";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { sanitizeHtml, markdownToHtml, isProbablyMarkdown } from "@/lib/content";
import { countWords, readingTimeMinutes } from "@/lib/content-stats";
import { db } from "@/lib/db/index";
import {
  createPost,
  updatePost,
  upsertTranslation,
  type PostStatus,
  type ArticleType,
  type TwitterCardType,
} from "@/lib/db/posts";
import {
  setPostTags,
  createPostFaq,
  upsertFaqTranslation,
  createCategory,
  upsertCategoryTranslation,
} from "@/lib/db/taxonomy";
import { searchUnsplash, fetchImageBuffer, trackDownload } from "@/lib/unsplash";
import { processImageToWebp } from "@/lib/images";

const POST_STATUSES: readonly PostStatus[] = ["draft", "scheduled", "published", "archived"];
const ARTICLE_TYPES: readonly ArticleType[] = [
  "Article",
  "BlogPosting",
  "NewsArticle",
  "TechArticle",
  "HowTo",
  "Course",
  "Recipe",
];
const TWITTER_CARDS: readonly TwitterCardType[] = ["summary", "summary_large_image"];

/**
 * Páginas que vendem. Todo post importado precisa apontar para uma delas —
 * é o que transforma leitor em lead e o que passa autoridade para a página
 * de produto. Espelha `money_pages` de scripts/seo/clusters.json (mantenha os
 * dois em sincronia ao criar/remover uma página comercial).
 */
export const MONEY_PAGES: readonly string[] = [
  "/produtos/hospedagem-moodle",
  "/produtos/hospedagem-gerenciada",
  "/produtos/aplicativo-moodle",
  "/produtos/voyia",
  "/produtos/sga",
  "/servicos/moodle",
  "/servicos/desenvolvimento",
  "/servicos/desenvolvimento-sites",
  "/servicos/consultoria",
  "/servicos/trafego-pago",
];

/**
 * Intenção de busca do post. "navegacional" é recusado de propósito: rankear
 * para o nome de um portal alheio (AVA de universidade, login de terceiro)
 * gera impressão sem clique e sem cliente.
 */
const SEARCH_INTENTS: readonly string[] = ["informacional", "comercial", "comparativo", "transacional"];
const MIN_MONEY_LINKS = 2;

// ---------- Tipos do JSON ----------

export interface PostImportTranslation {
  locale: Locale;
  title: string;
  excerpt?: string | null;
  content: string; // markdown ou HTML — sanitizado no import
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_card_type?: TwitterCardType;
  focus_keyword?: string | null;
  secondary_keywords?: string | null;
  cover_image_alt?: string | null;
}

export interface PostImportFaqTranslation {
  locale: Locale;
  question: string;
  answer: string;
}

export interface PostImportFaq {
  sort_order?: number;
  // Atalho single-locale (aplicado ao source_locale do post)
  question?: string;
  answer?: string;
  // Multi-locale (preferido)
  translations?: PostImportFaqTranslation[];
}

export interface PostImportCategoryTranslation {
  name: string;
  description?: string | null;
}

/**
 * Definição de categoria embutida no JSON. Quando presente, o import CRIA a
 * categoria se o slug ainda não existir (e faz upsert das traduções), evitando
 * divergência ("Categoria não encontrada") ao subir posts de categoria nova.
 */
export interface PostImportCategory {
  slug: string;
  color?: string | null;
  translations: Partial<Record<Locale, PostImportCategoryTranslation>>;
}

export interface PostImport {
  slug: string;
  source_locale: Locale;
  status?: PostStatus;
  article_type?: ArticleType;
  category_slug?: string | null;
  /** Cria/atualiza a categoria no import (tem precedência sobre category_slug). */
  category?: PostImportCategory | null;
  cover_image?: string | null;
  cover_image_width?: number | null;
  cover_image_height?: number | null;
  noindex?: boolean;
  nofollow?: boolean;
  featured?: boolean;
  canonical_url?: string | null;
  scheduled_at?: string | null;
  video_url?: string | null;
  video_duration_sec?: number | null;
  video_thumbnail?: string | null;
  tags?: string[];
  /** Página de produto/serviço que este post alimenta (ver MONEY_PAGES). */
  money_page: string;
  /** informacional | comercial | comparativo | transacional. */
  search_intent: string;
  /** Escape hatch consciente para reaproveitar uma focus keyword já usada. */
  allow_keyword_overlap?: boolean;
  translations: PostImportTranslation[];
  faqs?: PostImportFaq[];
}

export interface ValidationError {
  postIndex: number;
  slug: string | null;
  path: string;
  message: string;
}

export interface ValidatedPost {
  input: PostImport;
  resolvedCategoryId: number | null;
  /** Categoria a criar/atualizar no apply (quando o JSON traz `category`). */
  categoryDef: PostImportCategory | null;
}

export interface ValidationResult {
  ok: boolean;
  posts: ValidatedPost[];
  errors: ValidationError[];
}

// ---------- Helpers ----------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asTrimmedString(v: unknown): string | null {
  const s = asString(v);
  return s == null ? null : s.trim();
}

function asBool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function asInt(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v)) return null;
  return Math.trunc(v);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const findCategoryBySlugStmt = db.prepare("SELECT id FROM categories WHERE slug = ?");
const findPostBySlugStmt = db.prepare("SELECT id FROM posts WHERE slug = ?");
const findPostByFocusKeywordStmt = db.prepare(
  `SELECT p.slug FROM post_translations t
     JOIN posts p ON p.id = t.post_id
    WHERE LOWER(TRIM(t.focus_keyword)) = ?
      AND p.status <> 'archived'
    LIMIT 1`,
);

/** Conta links (markdown ou HTML) para um caminho interno. */
function countLinksTo(content: string, path: string): number {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:href="|\\]\\()${escaped}(?:[/?#][^"')\\s]*)?(?:"|\\))`, "g");
  return (content.match(re) || []).length;
}

// ---------- Validação ----------

function pushErr(
  errors: ValidationError[],
  postIndex: number,
  slug: string | null,
  path: string,
  message: string,
): void {
  errors.push({ postIndex, slug, path, message });
}

function validateTranslation(
  errors: ValidationError[],
  postIndex: number,
  slug: string | null,
  basePath: string,
  raw: unknown,
): PostImportTranslation | null {
  if (!isPlainObject(raw)) {
    pushErr(errors, postIndex, slug, basePath, "Tradução deve ser objeto.");
    return null;
  }
  const locale = asTrimmedString(raw.locale);
  if (!locale || !isLocale(locale)) {
    pushErr(errors, postIndex, slug, `${basePath}.locale`, `Locale inválido (esperado: ${locales.join(", ")}).`);
    return null;
  }
  const title = asTrimmedString(raw.title);
  if (!title) {
    pushErr(errors, postIndex, slug, `${basePath}.title`, "Título obrigatório.");
    return null;
  }
  const content = asString(raw.content);
  if (!content || !content.trim()) {
    pushErr(errors, postIndex, slug, `${basePath}.content`, "Conteúdo obrigatório.");
    return null;
  }
  const cardRaw = asTrimmedString(raw.twitter_card_type);
  if (cardRaw && !(TWITTER_CARDS as readonly string[]).includes(cardRaw)) {
    pushErr(errors, postIndex, slug, `${basePath}.twitter_card_type`, `Valor inválido (use: ${TWITTER_CARDS.join(", ")}).`);
    return null;
  }
  return {
    locale,
    title,
    content,
    excerpt: asTrimmedString(raw.excerpt) ?? null,
    meta_title: asTrimmedString(raw.meta_title) ?? null,
    meta_description: asTrimmedString(raw.meta_description) ?? null,
    og_title: asTrimmedString(raw.og_title) ?? null,
    og_description: asTrimmedString(raw.og_description) ?? null,
    twitter_card_type: (cardRaw as TwitterCardType | null) ?? "summary_large_image",
    focus_keyword: asTrimmedString(raw.focus_keyword) ?? null,
    secondary_keywords: asTrimmedString(raw.secondary_keywords) ?? null,
    cover_image_alt: asTrimmedString(raw.cover_image_alt) ?? null,
  };
}

function validateCategory(
  errors: ValidationError[],
  postIndex: number,
  slug: string | null,
  raw: unknown,
  sourceLocale: Locale,
): PostImportCategory | null {
  const basePath = "$.category";
  if (!isPlainObject(raw)) {
    pushErr(errors, postIndex, slug, basePath, "category deve ser objeto { slug, translations }.");
    return null;
  }
  const catSlug = asTrimmedString(raw.slug);
  if (!catSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(catSlug)) {
    pushErr(errors, postIndex, slug, `${basePath}.slug`, "category.slug obrigatório em kebab-case (a-z, 0-9, hífen).");
    return null;
  }
  const color = asTrimmedString(raw.color);
  const trRaw = raw.translations;
  if (!isPlainObject(trRaw)) {
    pushErr(errors, postIndex, slug, `${basePath}.translations`, "category.translations deve ser objeto { locale: { name } }.");
    return null;
  }
  const translations: Partial<Record<Locale, PostImportCategoryTranslation>> = {};
  for (const [loc, val] of Object.entries(trRaw)) {
    if (!isLocale(loc)) {
      pushErr(errors, postIndex, slug, `${basePath}.translations.${loc}`, `Locale inválido (use: ${locales.join(", ")}).`);
      return null;
    }
    if (!isPlainObject(val)) {
      pushErr(errors, postIndex, slug, `${basePath}.translations.${loc}`, "Tradução de categoria deve ser objeto { name, description? }.");
      return null;
    }
    const name = asTrimmedString(val.name);
    if (!name) {
      pushErr(errors, postIndex, slug, `${basePath}.translations.${loc}.name`, "name obrigatório.");
      return null;
    }
    translations[loc] = { name, description: asTrimmedString(val.description) };
  }
  if (!translations[sourceLocale]) {
    pushErr(errors, postIndex, slug, `${basePath}.translations`, `category.translations precisa incluir ao menos o source_locale "${sourceLocale}".`);
    return null;
  }
  return { slug: catSlug, color, translations };
}

function validateFaq(
  errors: ValidationError[],
  postIndex: number,
  slug: string | null,
  basePath: string,
  raw: unknown,
  sourceLocale: Locale,
): PostImportFaq | null {
  if (!isPlainObject(raw)) {
    pushErr(errors, postIndex, slug, basePath, "FAQ deve ser objeto.");
    return null;
  }
  const sortOrder = asInt(raw.sort_order);
  const shorthandQ = asTrimmedString(raw.question);
  const shorthandA = asTrimmedString(raw.answer);
  const translationsRaw = raw.translations;

  let translations: PostImportFaqTranslation[] | undefined;
  if (Array.isArray(translationsRaw)) {
    translations = [];
    for (let i = 0; i < translationsRaw.length; i++) {
      const t = translationsRaw[i];
      if (!isPlainObject(t)) {
        pushErr(errors, postIndex, slug, `${basePath}.translations[${i}]`, "Tradução de FAQ deve ser objeto.");
        return null;
      }
      const tLocale = asTrimmedString(t.locale);
      const tQ = asTrimmedString(t.question);
      const tA = asTrimmedString(t.answer);
      if (!tLocale || !isLocale(tLocale)) {
        pushErr(errors, postIndex, slug, `${basePath}.translations[${i}].locale`, "Locale inválido.");
        return null;
      }
      if (!tQ || !tA) {
        pushErr(errors, postIndex, slug, `${basePath}.translations[${i}]`, "FAQ precisa de question e answer.");
        return null;
      }
      translations.push({ locale: tLocale, question: tQ, answer: tA });
    }
  } else if (shorthandQ && shorthandA) {
    translations = [{ locale: sourceLocale, question: shorthandQ, answer: shorthandA }];
  } else {
    pushErr(errors, postIndex, slug, basePath, "FAQ precisa de translations[] ou {question, answer}.");
    return null;
  }

  return {
    sort_order: sortOrder ?? undefined,
    translations,
  };
}

function validateSinglePost(
  errors: ValidationError[],
  postIndex: number,
  raw: unknown,
): ValidatedPost | null {
  if (!isPlainObject(raw)) {
    pushErr(errors, postIndex, null, "$", "Post deve ser objeto.");
    return null;
  }

  const slug = asTrimmedString(raw.slug);
  if (!slug) {
    pushErr(errors, postIndex, null, "$.slug", "Slug obrigatório.");
    return null;
  }
  if (!SLUG_RE.test(slug)) {
    pushErr(errors, postIndex, slug, "$.slug", "Slug inválido (use minúsculas, dígitos e hífens; sem acentos).");
    return null;
  }
  const existing = findPostBySlugStmt.get(slug) as { id: number } | undefined;
  if (existing) {
    pushErr(errors, postIndex, slug, "$.slug", `Já existe um post com slug "${slug}" (id #${existing.id}).`);
    return null;
  }

  const sourceLocale = asTrimmedString(raw.source_locale);
  if (!sourceLocale || !isLocale(sourceLocale)) {
    pushErr(errors, postIndex, slug, "$.source_locale", `source_locale inválido (use: ${locales.join(", ")}).`);
    return null;
  }

  const statusRaw = asTrimmedString(raw.status) ?? "draft";
  if (!(POST_STATUSES as readonly string[]).includes(statusRaw)) {
    pushErr(errors, postIndex, slug, "$.status", `Status inválido (use: ${POST_STATUSES.join(", ")}).`);
    return null;
  }
  const status = statusRaw as PostStatus;

  const articleTypeRaw = asTrimmedString(raw.article_type) ?? "BlogPosting";
  if (!(ARTICLE_TYPES as readonly string[]).includes(articleTypeRaw)) {
    pushErr(errors, postIndex, slug, "$.article_type", `Tipo de artigo inválido (use: ${ARTICLE_TYPES.join(", ")}).`);
    return null;
  }

  const scheduledAt = asTrimmedString(raw.scheduled_at);
  if (status === "scheduled" && !scheduledAt) {
    pushErr(errors, postIndex, slug, "$.scheduled_at", "Status 'scheduled' exige scheduled_at (ISO datetime).");
    return null;
  }
  if (scheduledAt && Number.isNaN(Date.parse(scheduledAt))) {
    pushErr(errors, postIndex, slug, "$.scheduled_at", "scheduled_at não é uma data ISO válida.");
    return null;
  }

  const translationsRaw = raw.translations;
  if (!Array.isArray(translationsRaw) || translationsRaw.length === 0) {
    pushErr(errors, postIndex, slug, "$.translations", "translations[] obrigatório (mínimo 1 entrada).");
    return null;
  }
  const seenLocales = new Set<Locale>();
  const validatedTranslations: PostImportTranslation[] = [];
  for (let i = 0; i < translationsRaw.length; i++) {
    const t = validateTranslation(errors, postIndex, slug, `$.translations[${i}]`, translationsRaw[i]);
    if (!t) return null;
    if (seenLocales.has(t.locale)) {
      pushErr(errors, postIndex, slug, `$.translations[${i}].locale`, `Locale "${t.locale}" duplicado.`);
      return null;
    }
    seenLocales.add(t.locale);
    validatedTranslations.push(t);
  }
  if (!seenLocales.has(sourceLocale)) {
    pushErr(errors, postIndex, slug, "$.translations", `translations[] deve incluir o source_locale "${sourceLocale}".`);
    return null;
  }

  // ---- Arquitetura de conversão (regra do mapa em scripts/seo/clusters.json) ----
  // Um post que não aponta para uma página que vende não gera lead e não passa
  // autoridade para o produto. Por isso money_page é obrigatório, e não basta
  // declarar: o corpo do post precisa linkar de fato.
  const moneyPage = asTrimmedString(raw.money_page);
  if (!moneyPage) {
    pushErr(errors, postIndex, slug, "$.money_page", `money_page obrigatório. Escolha a página que este post alimenta: ${MONEY_PAGES.join(", ")}.`);
    return null;
  }
  if (!MONEY_PAGES.includes(moneyPage)) {
    pushErr(errors, postIndex, slug, "$.money_page", `money_page "${moneyPage}" não é uma página comercial válida. Use uma de: ${MONEY_PAGES.join(", ")}.`);
    return null;
  }

  const searchIntent = asTrimmedString(raw.search_intent);
  if (!searchIntent) {
    pushErr(errors, postIndex, slug, "$.search_intent", `search_intent obrigatório (use: ${SEARCH_INTENTS.join(", ")}).`);
    return null;
  }
  if (!SEARCH_INTENTS.includes(searchIntent)) {
    const extra = searchIntent === "navegacional"
      ? " Intenção navegacional (nome de portal/AVA/login de terceiros) é proibida: rende impressão sem clique e sem cliente."
      : "";
    pushErr(errors, postIndex, slug, "$.search_intent", `search_intent inválido (use: ${SEARCH_INTENTS.join(", ")}).${extra}`);
    return null;
  }

  const sourceTranslation = validatedTranslations.find((t) => t.locale === sourceLocale)!;
  const moneyLinks = countLinksTo(sourceTranslation.content, moneyPage);
  if (moneyLinks < MIN_MONEY_LINKS) {
    pushErr(
      errors,
      postIndex,
      slug,
      "$.translations[].content",
      `O conteúdo precisa de pelo menos ${MIN_MONEY_LINKS} links contextuais para ${moneyPage} (encontrados: ${moneyLinks}). Inclua também a seção "como a Agathas resolve isso".`,
    );
    return null;
  }

  // ---- Canibalização: duas URLs disputando a mesma consulta dividem força ----
  const allowOverlap = asBool(raw.allow_keyword_overlap) ?? false;
  const focusKeyword = sourceTranslation.focus_keyword;
  if (focusKeyword && !allowOverlap) {
    const clash = findPostByFocusKeywordStmt.get(focusKeyword.trim().toLowerCase()) as { slug: string } | undefined;
    if (clash) {
      pushErr(
        errors,
        postIndex,
        slug,
        "$.translations[].focus_keyword",
        `A focus keyword "${focusKeyword}" já é usada por /blog/${clash.slug}. Atualize aquele post em vez de criar um concorrente interno — ou envie "allow_keyword_overlap": true se a sobreposição for intencional.`,
      );
      return null;
    }
  }

  // Resolve categoria. Precedência: objeto `category` (cria no apply) >
  // `category_slug` (precisa existir).
  let categorySlug = asTrimmedString(raw.category_slug);
  let resolvedCategoryId: number | null = null;
  let categoryDef: PostImportCategory | null = null;

  if (raw.category !== undefined && raw.category !== null) {
    categoryDef = validateCategory(errors, postIndex, slug, raw.category, sourceLocale);
    if (!categoryDef) return null;
    // O slug do objeto manda; mantém category_slug coerente para o JSON.
    categorySlug = categoryDef.slug;
    const existing = findCategoryBySlugStmt.get(categoryDef.slug) as { id: number } | undefined;
    resolvedCategoryId = existing ? existing.id : null; // criada no apply se ausente
  } else if (categorySlug) {
    const cat = findCategoryBySlugStmt.get(categorySlug) as { id: number } | undefined;
    if (!cat) {
      pushErr(errors, postIndex, slug, "$.category_slug", `Categoria "${categorySlug}" não encontrada. Crie em /admin/categorias antes, ou envie o objeto "category" com as traduções para criá-la no import.`);
      return null;
    }
    resolvedCategoryId = cat.id;
  }

  // Tags
  let tags: string[] | undefined;
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags)) {
      pushErr(errors, postIndex, slug, "$.tags", "tags deve ser array de strings.");
      return null;
    }
    tags = [];
    for (const t of raw.tags) {
      const s = asTrimmedString(t);
      if (!s) {
        pushErr(errors, postIndex, slug, "$.tags", "Cada tag deve ser string não-vazia.");
        return null;
      }
      tags.push(s);
    }
  }

  // FAQs
  let faqs: PostImportFaq[] | undefined;
  if (raw.faqs !== undefined) {
    if (!Array.isArray(raw.faqs)) {
      pushErr(errors, postIndex, slug, "$.faqs", "faqs deve ser array.");
      return null;
    }
    faqs = [];
    for (let i = 0; i < raw.faqs.length; i++) {
      const f = validateFaq(errors, postIndex, slug, `$.faqs[${i}]`, raw.faqs[i], sourceLocale);
      if (!f) return null;
      faqs.push(f);
    }
  }

  return {
    input: {
      slug,
      source_locale: sourceLocale,
      status,
      article_type: articleTypeRaw as ArticleType,
      category_slug: categorySlug,
      cover_image: asTrimmedString(raw.cover_image),
      cover_image_width: asInt(raw.cover_image_width),
      cover_image_height: asInt(raw.cover_image_height),
      noindex: asBool(raw.noindex) ?? false,
      nofollow: asBool(raw.nofollow) ?? false,
      featured: asBool(raw.featured) ?? false,
      canonical_url: asTrimmedString(raw.canonical_url),
      scheduled_at: scheduledAt,
      video_url: asTrimmedString(raw.video_url),
      video_duration_sec: asInt(raw.video_duration_sec),
      video_thumbnail: asTrimmedString(raw.video_thumbnail),
      tags,
      money_page: moneyPage,
      search_intent: searchIntent,
      allow_keyword_overlap: allowOverlap,
      translations: validatedTranslations,
      faqs,
    },
    resolvedCategoryId,
    categoryDef,
  };
}

export function validatePostsJson(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const items: unknown[] = Array.isArray(raw) ? raw : [raw];

  // Detecta slugs duplicados dentro do mesmo lote
  const slugCount = new Map<string, number[]>();
  for (let i = 0; i < items.length; i++) {
    const r = items[i];
    if (isPlainObject(r) && typeof r.slug === "string") {
      const slug = r.slug.trim();
      if (slug) {
        const arr = slugCount.get(slug) ?? [];
        arr.push(i);
        slugCount.set(slug, arr);
      }
    }
  }
  for (const [slug, indices] of slugCount) {
    if (indices.length > 1) {
      pushErr(errors, indices[0], slug, "$.slug", `Slug duplicado no JSON (índices: ${indices.join(", ")}).`);
    }
  }

  const posts: ValidatedPost[] = [];
  for (let i = 0; i < items.length; i++) {
    const validated = validateSinglePost(errors, i, items[i]);
    if (validated) posts.push(validated);
  }

  return { ok: errors.length === 0, posts, errors };
}

// ---------- Importação (estrito: tudo ou nada) ----------

export interface ImportResult {
  ok: boolean;
  created: { slug: string; id: number }[];
  errors: ValidationError[];
  coversFetched?: number;
  coversFailed?: { slug: string; reason: string }[];
}

export interface ImportOptions {
  /** Buscar capa no Unsplash automaticamente para posts sem cover_image. */
  autoCover?: boolean;
}

async function prepareContentHtml(content: string): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (isProbablyMarkdown(trimmed)) return markdownToHtml(trimmed);
  return sanitizeHtml(trimmed);
}

/**
 * Busca capa no Unsplash para um post — usado em modo autoCover do importPosts.
 * Falhas são reportadas mas não bloqueiam: o post foi criado com sucesso, só
 * fica sem capa. Aplica uma query construída do focus_keyword + slug do post
 * pra aumentar relevância. Usa o primeiro resultado.
 */
async function fetchCoverForPost(
  postId: number,
  slug: string,
  query: string,
  title: string,
): Promise<{ ok: true; path: string; alt: string } | { ok: false; reason: string }> {
  const q = query.trim() || slug.replace(/-/g, " ");
  const search = await searchUnsplash(q, 1);
  if (!search.ok || !search.photos || search.photos.length === 0) {
    return { ok: false, reason: search.error || "sem resultados" };
  }
  const photo = search.photos[0];
  try {
    const buffer = await fetchImageBuffer(photo.download_url);
    const result = await processImageToWebp(buffer, {
      postSlug: slug,
      originalName: "unsplash.jpg",
      kind: "post",
    });
    // Track no Unsplash (TOS), best-effort
    void trackDownload(photo.download_location);
    const alt = photo.alt_description || photo.description || title;
    updatePost(postId, { cover_image: result.path_large });
    return { ok: true, path: result.path_large, alt };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function importPosts(
  validated: ValidatedPost[],
  authorId: number | null,
  options: ImportOptions = {},
): Promise<ImportResult> {
  // Pré-processa todo o HTML antes de abrir transação (markdown→html é async)
  const prepared: {
    item: ValidatedPost;
    translations: {
      translation: PostImportTranslation;
      contentHtml: string;
      wordCount: number;
      readingTime: number;
    }[];
  }[] = [];

  for (const item of validated) {
    const translations = [];
    for (const t of item.input.translations) {
      const contentHtml = await prepareContentHtml(t.content);
      translations.push({
        translation: t,
        contentHtml,
        wordCount: countWords(contentHtml),
        readingTime: readingTimeMinutes(contentHtml),
      });
    }
    prepared.push({ item, translations });
  }

  // Strict mode: tudo numa única transação. Qualquer throw → rollback total.
  const created: { slug: string; id: number }[] = [];
  // Cache de categorias criadas/resolvidas neste lote (idempotente por slug).
  const categoryCache = new Map<string, number>();
  const resolveCategoryDef = (def: PostImportCategory): number => {
    const cached = categoryCache.get(def.slug);
    if (cached) return cached;
    const existing = findCategoryBySlugStmt.get(def.slug) as { id: number } | undefined;
    const id = existing ? existing.id : createCategory(def.slug, def.color ?? null);
    for (const [loc, tr] of Object.entries(def.translations)) {
      if (tr) upsertCategoryTranslation(id, loc, tr.name, tr.description ?? null);
    }
    categoryCache.set(def.slug, id);
    return id;
  };

  const tx = db.transaction(() => {
    for (const { item, translations } of prepared) {
      const input = item.input;
      const sourceTrans = translations.find(
        (t) => t.translation.locale === input.source_locale,
      );
      if (!sourceTrans) {
        throw new Error(`Tradução do source_locale "${input.source_locale}" não encontrada (slug: ${input.slug}).`);
      }

      const categoryId = item.categoryDef
        ? resolveCategoryDef(item.categoryDef)
        : item.resolvedCategoryId;

      const postId = createPost({
        slug: input.slug,
        status: input.status,
        source_locale: input.source_locale,
        author_id: authorId,
        category_id: categoryId,
        cover_image: input.cover_image ?? null,
        cover_image_width: input.cover_image_width ?? null,
        cover_image_height: input.cover_image_height ?? null,
        article_type: input.article_type,
        noindex: input.noindex,
        nofollow: input.nofollow,
        canonical_url: input.canonical_url ?? null,
        scheduled_at: input.scheduled_at ?? null,
        featured: input.featured,
        video_url: input.video_url ?? null,
        video_duration_sec: input.video_duration_sec ?? null,
        video_thumbnail: input.video_thumbnail ?? null,
        translations: [
          {
            locale: sourceTrans.translation.locale,
            title: sourceTrans.translation.title,
            excerpt: sourceTrans.translation.excerpt ?? null,
            content_html: sourceTrans.contentHtml,
            meta_title: sourceTrans.translation.meta_title ?? null,
            meta_description: sourceTrans.translation.meta_description ?? null,
            og_title: sourceTrans.translation.og_title ?? null,
            og_description: sourceTrans.translation.og_description ?? null,
            twitter_card_type: sourceTrans.translation.twitter_card_type,
            focus_keyword: sourceTrans.translation.focus_keyword ?? null,
            secondary_keywords: sourceTrans.translation.secondary_keywords ?? null,
            cover_image_alt: sourceTrans.translation.cover_image_alt ?? null,
            reading_time_min: sourceTrans.readingTime,
            word_count: sourceTrans.wordCount,
            translation_source: "manual",
          },
        ],
      });

      // Demais locales via upsert
      for (const t of translations) {
        if (t.translation.locale === input.source_locale) continue;
        upsertTranslation(postId, {
          locale: t.translation.locale,
          title: t.translation.title,
          excerpt: t.translation.excerpt ?? null,
          content_html: t.contentHtml,
          meta_title: t.translation.meta_title ?? null,
          meta_description: t.translation.meta_description ?? null,
          og_title: t.translation.og_title ?? null,
          og_description: t.translation.og_description ?? null,
          twitter_card_type: t.translation.twitter_card_type,
          focus_keyword: t.translation.focus_keyword ?? null,
          secondary_keywords: t.translation.secondary_keywords ?? null,
          cover_image_alt: t.translation.cover_image_alt ?? null,
          reading_time_min: t.readingTime,
          word_count: t.wordCount,
          translation_source: "manual",
        });
      }

      if (input.tags && input.tags.length > 0) {
        setPostTags(postId, input.tags);
      }

      if (input.faqs && input.faqs.length > 0) {
        for (let i = 0; i < input.faqs.length; i++) {
          const faq = input.faqs[i];
          const faqId = createPostFaq(postId, faq.sort_order ?? i);
          if (faq.translations) {
            for (const ft of faq.translations) {
              upsertFaqTranslation(faqId, ft.locale, ft.question, ft.answer);
            }
          }
        }
      }

      created.push({ slug: input.slug, id: postId });
    }
  });

  try {
    tx();
  } catch (err) {
    return {
      ok: false,
      created: [],
      errors: [
        {
          postIndex: -1,
          slug: null,
          path: "$",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  // Auto-cover Unsplash (fora da transação — falhas não revertem posts)
  let coversFetched = 0;
  const coversFailed: { slug: string; reason: string }[] = [];
  if (options.autoCover) {
    for (let idx = 0; idx < created.length; idx++) {
      const { id: postId, slug } = created[idx];
      const item = validated[idx];
      // Pula se o JSON já trouxe capa
      if (item.input.cover_image) continue;
      const sourceT = item.input.translations.find(
        (t) => t.locale === item.input.source_locale,
      );
      if (!sourceT) continue;
      // Query: focus_keyword (mais temática) > primeira keyword secundária > título
      const query =
        sourceT.focus_keyword ||
        sourceT.secondary_keywords?.split(",")[0]?.trim() ||
        sourceT.title;
      const result = await fetchCoverForPost(postId, slug, query, sourceT.title);
      if (result.ok) {
        coversFetched++;
      } else {
        coversFailed.push({ slug, reason: result.reason });
      }
    }
  }

  return {
    ok: true,
    created,
    errors: [],
    coversFetched,
    coversFailed: coversFailed.length > 0 ? coversFailed : undefined,
  };
}
