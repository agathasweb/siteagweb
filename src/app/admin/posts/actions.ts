"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { sanitizeHtml, markdownToHtml, isProbablyMarkdown } from "@/lib/content";
import {
  translatePostDistinct,
  type SiblingVariant,
} from "@/lib/ai/translate";
import {
  redifferentiateEnglishPosts,
  type RedifferentiateResult,
} from "@/lib/redifferentiate";
import { generateSeoBrief, type SeoBrief } from "@/lib/ai/brief";
import { countWords, readingTimeMinutes } from "@/lib/content-stats";
import {
  setPostTags,
  createPostFaq,
  deletePostFaq,
  upsertFaqTranslation,
  reorderPostFaqs,
} from "@/lib/db/taxonomy";
import { getOrCreateUserByEmail } from "@/lib/db/users";
import {
  createPost,
  updatePost,
  deletePost,
  upsertTranslation,
  getPostById,
  searchInternalLinks,
  publishPostById,
  markPostIndexed,
  listCollidingEnglishPostIds,
  type PostStatus,
  type ArticleType,
  type TwitterCardType,
  type InternalLinkSuggestion,
} from "@/lib/db/posts";
import { buildPostUrls } from "@/lib/indexer";
import { submitUrlsForIndexing, submitUrlsForIndexingAsync } from "@/lib/seo-sync";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }
  return session.user;
}

async function getAuthorId(): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = getOrCreateUserByEmail(session.user.email, session.user.name ?? "Admin");
  return dbUser.id;
}

/**
 * Constrói as URLs públicas de um post (em todos os locales onde existe
 * tradução) e dispara IndexNow + Google Indexing assincronamente.
 *
 * Só é chamado quando o post está publicado; caller é responsável por
 * checar status antes. Limitar `onlyLocale` ao locale específico quando
 * uma única tradução foi alterada (evita resubmeter os outros).
 */
function submitPostIndexing(postId: number, context: string, onlyLocale?: Locale): void {
  const detail = getPostById(postId);
  if (!detail) return;
  type PostRow = { slug: string; status: string };
  type TRow = { locale: Locale };
  const post = detail.post as PostRow;
  if (post.status !== "published") return;
  const translations = detail.translations as TRow[];
  let availableLocales = translations.map((t) => t.locale);
  if (onlyLocale) availableLocales = availableLocales.filter((l) => l === onlyLocale);
  if (availableLocales.length === 0) return;
  const urls = buildPostUrls(post.slug, availableLocales);
  submitUrlsForIndexingAsync(urls, context);
}

function getString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(form: FormData, key: string): string | null {
  const value = getString(form, key);
  return value.length > 0 ? value : null;
}

function getLocale(form: FormData, key: string): Locale {
  const raw = getString(form, key);
  if (!isLocale(raw)) throw new Error(`Locale inválido: ${raw}`);
  return raw;
}

async function prepareHtml(input: string): Promise<string> {
  const value = input.trim();
  if (!value) return "";
  if (isProbablyMarkdown(value)) {
    return markdownToHtml(value);
  }
  return sanitizeHtml(value);
}

function parseOptionalInt(form: FormData, key: string): number | null {
  const raw = getString(form, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseBool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "1" || form.get(key) === "true";
}

const POST_STATUS_VALUES = ["draft", "scheduled", "published", "archived"] as const;
const ARTICLE_TYPE_VALUES = [
  "Article",
  "BlogPosting",
  "NewsArticle",
  "TechArticle",
  "HowTo",
  "Course",
  "Recipe",
] as const;
const TWITTER_CARD_VALUES = ["summary", "summary_large_image"] as const;

function parsePostStatus(form: FormData, key: string): PostStatus {
  const raw = getString(form, key) || "draft";
  if (!(POST_STATUS_VALUES as readonly string[]).includes(raw)) {
    throw new Error(`Status inválido: ${raw}`);
  }
  return raw as PostStatus;
}

function parseArticleType(form: FormData, key: string): ArticleType {
  const raw = getString(form, key) || "BlogPosting";
  if (!(ARTICLE_TYPE_VALUES as readonly string[]).includes(raw)) {
    throw new Error(`Tipo de artigo inválido: ${raw}`);
  }
  return raw as ArticleType;
}

function parseTwitterCard(form: FormData, key: string): TwitterCardType {
  const raw = getString(form, key) || "summary_large_image";
  if (!(TWITTER_CARD_VALUES as readonly string[]).includes(raw)) {
    throw new Error(`Twitter card inválido: ${raw}`);
  }
  return raw as TwitterCardType;
}

export async function createPostAction(formData: FormData) {
  await requireAdmin();

  const slug = getString(formData, "slug");
  const status = parsePostStatus(formData, "status");
  const sourceLocale = getLocale(formData, "source_locale");
  const articleType = parseArticleType(formData, "article_type");

  const coverImage = getOptionalString(formData, "cover_image");
  const coverImageWidth = parseOptionalInt(formData, "cover_image_width");
  const coverImageHeight = parseOptionalInt(formData, "cover_image_height");

  const categoryId = parseOptionalInt(formData, "category_id");
  const noindex = parseBool(formData, "noindex");
  const nofollow = parseBool(formData, "nofollow");
  const featured = parseBool(formData, "featured");
  const canonicalUrl = getOptionalString(formData, "canonical_url");
  const scheduledAt = getOptionalString(formData, "scheduled_at");

  const videoUrl = getOptionalString(formData, "video_url");
  const videoDuration = parseOptionalInt(formData, "video_duration_sec");
  const videoThumbnail = getOptionalString(formData, "video_thumbnail");

  const tagsRaw = getString(formData, "tags");

  // Per-locale (source only on create)
  const title = getString(formData, "title");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");
  const ogTitle = getOptionalString(formData, "og_title");
  const ogDescription = getOptionalString(formData, "og_description");
  const twitterCardType = parseTwitterCard(formData, "twitter_card_type");
  const focusKeyword = getOptionalString(formData, "focus_keyword");
  const secondaryKeywords = getOptionalString(formData, "secondary_keywords");
  const coverImageAlt = getOptionalString(formData, "cover_image_alt");

  if (!slug) throw new Error("Slug é obrigatório.");
  if (!title) throw new Error("Título é obrigatório.");
  if (!content) throw new Error("Conteúdo é obrigatório.");

  const contentHtml = await prepareHtml(content);
  const wordCount = countWords(contentHtml);
  const readingTime = readingTimeMinutes(contentHtml);

  // Status logic: scheduled requires scheduled_at; published_at set automatically on published
  const finalStatus: PostStatus =
    status === "scheduled" && !scheduledAt ? "draft" : status;

  const authorId = await getAuthorId();
  const id = createPost({
    slug,
    status: finalStatus,
    source_locale: sourceLocale,
    author_id: authorId,
    category_id: categoryId,
    cover_image: coverImage,
    cover_image_width: coverImageWidth,
    cover_image_height: coverImageHeight,
    article_type: articleType,
    noindex,
    nofollow,
    canonical_url: canonicalUrl,
    scheduled_at: scheduledAt,
    featured,
    video_url: videoUrl,
    video_duration_sec: videoDuration,
    video_thumbnail: videoThumbnail,
    translations: [
      {
        locale: sourceLocale,
        title,
        excerpt,
        content_html: contentHtml,
        meta_title: metaTitle,
        meta_description: metaDescription,
        og_title: ogTitle,
        og_description: ogDescription,
        twitter_card_type: twitterCardType,
        focus_keyword: focusKeyword,
        secondary_keywords: secondaryKeywords,
        cover_image_alt: coverImageAlt,
        reading_time_min: readingTime,
        word_count: wordCount,
        translation_source: "manual",
      },
    ],
  });

  if (tagsRaw) {
    const names = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    setPostTags(id, names);
  }

  // Se já foi criado como publicado, notifica buscadores
  if (finalStatus === "published") {
    submitPostIndexing(id, `create-post:${slug}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  redirect(`/admin/posts/${id}`);
}

export interface SaveResult {
  ok: boolean;
  savedAt?: string;
  error?: string;
}

export async function updatePostMetaAction(
  postId: number,
  _prevState: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Não autorizado." };
  }
  try {

  const slug = getOptionalString(formData, "slug");
  const status = parsePostStatus(formData, "status");
  const articleType = parseArticleType(formData, "article_type");
  const categoryId = parseOptionalInt(formData, "category_id");
  const noindex = parseBool(formData, "noindex");
  const nofollow = parseBool(formData, "nofollow");
  const featured = parseBool(formData, "featured");
  const canonicalUrl = getOptionalString(formData, "canonical_url");
  const scheduledAt = getOptionalString(formData, "scheduled_at");
  const videoUrl = getOptionalString(formData, "video_url");
  const videoDuration = parseOptionalInt(formData, "video_duration_sec");
  const videoThumbnail = getOptionalString(formData, "video_thumbnail");
  const coverImage = getOptionalString(formData, "cover_image");

  const finalStatus: PostStatus =
    status === "scheduled" && !scheduledAt ? "draft" : status;

  updatePost(postId, {
    slug: slug ?? undefined,
    status: finalStatus,
    article_type: articleType,
    category_id: categoryId,
    noindex,
    nofollow,
    featured,
    canonical_url: canonicalUrl,
    scheduled_at: scheduledAt,
    video_url: videoUrl,
    video_duration_sec: videoDuration,
    video_thumbnail: videoThumbnail,
    cover_image: coverImage,
  });

    // Se permanece publicado (ou virou publicado agora), reindex
    if (finalStatus === "published") {
      submitPostIndexing(postId, `update-post:${postId}`);
    }

    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${postId}`);
    revalidatePath(`/[lang]/blog`, "page");
    revalidatePath(`/[lang]/blog/[slug]`, "page");
    revalidatePath(`/[lang]/blog/categoria`, "page");
    return { ok: true, savedAt: new Date().toISOString() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
}

export async function upsertTranslationAction(
  postId: number,
  formData: FormData,
) {
  await requireAdmin();

  const locale = getLocale(formData, "locale");
  const title = getString(formData, "title");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");
  const ogTitle = getOptionalString(formData, "og_title");
  const ogDescription = getOptionalString(formData, "og_description");
  const twitterCardType = parseTwitterCard(formData, "twitter_card_type");
  const focusKeyword = getOptionalString(formData, "focus_keyword");
  const secondaryKeywords = getOptionalString(formData, "secondary_keywords");
  const coverImageAlt = getOptionalString(formData, "cover_image_alt");

  if (!title) throw new Error("Título é obrigatório.");
  if (!content) throw new Error("Conteúdo é obrigatório.");

  const contentHtml = await prepareHtml(content);
  const wordCount = countWords(contentHtml);
  const readingTime = readingTimeMinutes(contentHtml);

  upsertTranslation(postId, {
    locale,
    title,
    excerpt,
    content_html: contentHtml,
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_title: ogTitle,
    og_description: ogDescription,
    twitter_card_type: twitterCardType,
    focus_keyword: focusKeyword,
    secondary_keywords: secondaryKeywords,
    cover_image_alt: coverImageAlt,
    reading_time_min: readingTime,
    word_count: wordCount,
    translation_source: "manual",
  });

  // Reindex apenas o locale alterado
  submitPostIndexing(postId, `translation:${locale}:${postId}`, locale);

  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

export interface TranslateActionResult {
  ok: boolean;
  error?: string;
  translation?: {
    title: string;
    excerpt: string | null;
    content_html: string;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
  };
}

// --- Divergência entre variantes inglesas (en-US ↔ en-GB) ---------------
// en-US e en-GB traduzidos do mesmo pt-BR ficam quase idênticos (só grafia),
// e o Google os trata como duplicata → o uk.agathasweb.com fica "rastreada não
// indexada". Ao gerar a 2ª variante inglesa passamos a 1ª como `avoidSibling`
// para forçar título/meta distintos.

interface SiblingRow {
  locale: Locale;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
}

function englishSiblingLocale(target: Locale): Locale | null {
  if (target === "en-GB") return "en-US";
  if (target === "en-US") return "en-GB";
  return null;
}

function buildEnglishSibling(
  target: Locale,
  rows: SiblingRow[],
): SiblingVariant | null {
  const sib = englishSiblingLocale(target);
  if (!sib) return null;
  const row = rows.find((r) => r.locale === sib);
  if (!row) return null;
  return {
    locale: sib,
    title: row.title,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
  };
}

export async function translateAction(
  postId: number,
  targetLocale: Locale,
): Promise<TranslateActionResult> {
  await requireAdmin();

  const detail = getPostById(postId);
  if (!detail) return { ok: false, error: "Post não encontrado." };

  type PostRow = { source_locale: Locale };
  type TRow = {
    locale: Locale;
    title: string;
    excerpt: string | null;
    content_html: string;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
  };

  const post = detail.post as PostRow;
  const translations = detail.translations as TRow[];
  const source = translations.find((t) => t.locale === post.source_locale);
  if (!source) {
    return {
      ok: false,
      error: `Tradução de origem (${post.source_locale}) não encontrada.`,
    };
  }

  try {
    const avoidSibling = buildEnglishSibling(targetLocale, translations);
    const translation = await translatePostDistinct(
      post.source_locale,
      targetLocale,
      {
        title: source.title,
        excerpt: source.excerpt,
        content_html: source.content_html,
        meta_title: source.meta_title,
        meta_description: source.meta_description,
        og_title: source.og_title,
        og_description: source.og_description,
      },
      { avoidSibling },
    );

    upsertTranslation(postId, {
      locale: targetLocale,
      title: translation.title,
      excerpt: translation.excerpt,
      content_html: sanitizeHtml(translation.content_html),
      meta_title: translation.meta_title,
      meta_description: translation.meta_description,
      og_title: translation.og_title,
      og_description: translation.og_description,
      translation_source: "ai-deepseek",
    });

    revalidatePath(`/admin/posts/${postId}`);
    revalidatePath(`/[lang]/blog`, "page");
    revalidatePath(`/[lang]/blog/[slug]`, "page");

    return { ok: true, translation };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido na tradução.",
    };
  }
}

export interface SeoBriefResult {
  ok: boolean;
  brief?: SeoBrief;
  error?: string;
}

export async function generateSeoBriefAction(
  keyword: string,
  locale: Locale,
  articleType: string,
): Promise<SeoBriefResult> {
  await requireAdmin();
  if (!keyword.trim()) return { ok: false, error: "Palavra-chave é obrigatória." };
  try {
    const brief = await generateSeoBrief(keyword.trim(), locale, articleType);
    return { ok: true, brief };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function deletePostAction(postId: number) {
  await requireAdmin();
  deletePost(postId);
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  redirect("/admin/posts");
}

// Exclusão inline (sem redirect) — usado na listagem /admin/posts
export async function deletePostInlineAction(postId: number): Promise<void> {
  await requireAdmin();
  deletePost(postId);
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

// Exclusão em lote — recebe lista de IDs, deleta todos, revalida uma vez
export async function deletePostsBulkAction(
  ids: number[],
): Promise<{ deleted: number }> {
  await requireAdmin();
  let deleted = 0;
  for (const id of ids) {
    if (Number.isFinite(id) && id > 0) {
      deletePost(id);
      deleted++;
    }
  }
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
  return { deleted };
}

// ---------- Bulk: Traduzir / Publicar / Indexar ----------

export interface BulkTranslateResult {
  translated: number; // total de traduções criadas (posts × locales)
  skipped: number;    // já existia tradução pra esse locale
  errors: { postId: number; locale: Locale; reason: string }[];
}

/**
 * Para cada post selecionado, gera as traduções faltantes via DeepSeek.
 * Pula locales que já existem. Sequencial (DeepSeek tem rate limit).
 */
export async function translatePostsBulkAction(
  ids: number[],
): Promise<BulkTranslateResult> {
  await requireAdmin();
  const result: BulkTranslateResult = { translated: 0, skipped: 0, errors: [] };

  for (const postId of ids) {
    if (!Number.isFinite(postId) || postId <= 0) continue;
    const detail = getPostById(postId);
    if (!detail) {
      result.errors.push({ postId, locale: "pt-BR" as Locale, reason: "Post não encontrado" });
      continue;
    }
    type PostRow = { source_locale: Locale };
    type TRow = {
      locale: Locale;
      title: string;
      excerpt: string | null;
      content_html: string;
      meta_title: string | null;
      meta_description: string | null;
      og_title: string | null;
      og_description: string | null;
    };
    const post = detail.post as PostRow;
    const translations = detail.translations as TRow[];
    const source = translations.find((t) => t.locale === post.source_locale);
    if (!source) {
      result.errors.push({
        postId,
        locale: post.source_locale,
        reason: `Tradução de origem (${post.source_locale}) não encontrada`,
      });
      continue;
    }
    const existingLocales = new Set(translations.map((t) => t.locale));
    // Rastreia variantes já disponíveis (existentes + criadas neste lote) para
    // que en-GB diverja do en-US recém-gerado. `locales` ordena en-US antes de en-GB.
    const siblingRows: SiblingRow[] = translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      meta_title: t.meta_title,
      meta_description: t.meta_description,
    }));
    const targets = locales.filter((l) => l !== post.source_locale);
    for (const target of targets) {
      if (existingLocales.has(target)) {
        result.skipped++;
        continue;
      }
      try {
        const avoidSibling = buildEnglishSibling(target, siblingRows);
        const translated = await translatePostDistinct(
          post.source_locale,
          target,
          {
            title: source.title,
            excerpt: source.excerpt,
            content_html: source.content_html,
            meta_title: source.meta_title,
            meta_description: source.meta_description,
            og_title: source.og_title,
            og_description: source.og_description,
          },
          { avoidSibling },
        );
        upsertTranslation(postId, {
          locale: target,
          title: translated.title,
          excerpt: translated.excerpt,
          content_html: sanitizeHtml(translated.content_html),
          meta_title: translated.meta_title,
          meta_description: translated.meta_description,
          og_title: translated.og_title,
          og_description: translated.og_description,
          translation_source: "ai-deepseek",
        });
        siblingRows.push({
          locale: target,
          title: translated.title,
          meta_title: translated.meta_title,
          meta_description: translated.meta_description,
        });
        result.translated++;
      } catch (err) {
        result.errors.push({
          postId,
          locale: target,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
  return result;
}

// ---------- Bulk: Rediferenciar inglês (corrigir duplicatas existentes) ----------

/** IDs dos posts cujo en-GB ainda é duplicata do en-US (para processar em lotes). */
export async function listCollidingEnglishPostIdsAction(): Promise<number[]> {
  await requireAdmin();
  return listCollidingEnglishPostIds();
}

export async function redifferentiateEnglishBulkAction(
  ids: number[],
): Promise<RedifferentiateResult> {
  await requireAdmin();
  const result = await redifferentiateEnglishPosts(ids);
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
  return result;
}

export interface BulkPublishResult {
  published: number;
  alreadyPublished: number;
  notFound: number;
}

/**
 * Publica os posts selecionados (status=published, published_at agora).
 * Não-op para posts já publicados.
 */
export async function publishPostsBulkAction(
  ids: number[],
): Promise<BulkPublishResult> {
  await requireAdmin();
  const result: BulkPublishResult = { published: 0, alreadyPublished: 0, notFound: 0 };
  for (const id of ids) {
    if (!Number.isFinite(id) || id <= 0) continue;
    const detail = getPostById(id);
    if (!detail) {
      result.notFound++;
      continue;
    }
    const post = detail.post as { status: string };
    if (post.status === "published") {
      result.alreadyPublished++;
      continue;
    }
    const ok = publishPostById(id);
    if (ok) {
      result.published++;
      submitPostIndexing(id, `bulk-publish:${id}`);
    }
  }
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
  revalidatePath(`/[lang]/blog/categoria`, "page");
  return result;
}

export interface BulkIndexResult {
  submitted: number;          // posts cujas URLs foram submetidas
  skipped: number;            // posts já indexados e sem alteração desde
  notPublished: number;       // posts não publicados (skip)
  hostResults: { host: string; urls: number; ok: boolean; status?: number; error?: string }[];
  totalUrls: number;
  error?: string;
}

/**
 * Submete URLs dos posts ao IndexNow (Bing/Yandex/Seznam/Naver/Yep, e Google
 * em adoção). Para cada post: monta URLs por locale disponível e agrupa por
 * host. Pula posts indexados onde updated_at == indexed_at.
 *
 * Não publica posts não-publicados (status != 'published').
 */
export async function indexPostsBulkAction(
  ids: number[],
  forceReindex = false,
): Promise<BulkIndexResult> {
  await requireAdmin();
  const result: BulkIndexResult = {
    submitted: 0,
    skipped: 0,
    notPublished: 0,
    hostResults: [],
    totalUrls: 0,
  };

  const allUrls: string[] = [];
  const postsToMark: number[] = [];

  for (const id of ids) {
    if (!Number.isFinite(id) || id <= 0) continue;
    const detail = getPostById(id);
    if (!detail) continue;
    type PostRow = {
      slug: string;
      status: string;
      indexed_at: string | null;
      updated_at: string;
    };
    type TRow = { locale: Locale };
    const post = detail.post as PostRow;
    const translations = detail.translations as TRow[];

    if (post.status !== "published") {
      result.notPublished++;
      continue;
    }
    if (
      !forceReindex &&
      post.indexed_at &&
      post.indexed_at >= post.updated_at
    ) {
      result.skipped++;
      continue;
    }
    const availableLocales = translations.map((t) => t.locale);
    if (availableLocales.length === 0) continue;
    const urls = buildPostUrls(post.slug, availableLocales);
    allUrls.push(...urls);
    postsToMark.push(id);
    result.submitted++;
  }

  if (allUrls.length === 0) {
    return { ...result, error: "Nenhuma URL para submeter (verifique status/locales/indexação)." };
  }

  result.totalUrls = allUrls.length;
  const sync = await submitUrlsForIndexing(allUrls);
  result.hostResults = sync.indexNow?.hosts ?? [];
  if (sync.errors.length > 0) result.error = sync.errors.join(" | ");

  // Marca como indexados se IndexNow OU WebSub retornou ok
  const anyEngineOk = sync.indexNow?.ok || sync.webSub?.ok;
  if (sync.indexNow || sync.webSub) {
    const status = anyEngineOk
      ? sync.indexNow?.ok && sync.webSub?.ok
        ? "indexnow+websub:ok"
        : sync.webSub?.ok
          ? "websub:ok"
          : "indexnow:ok"
      : "indexnow:partial";
    for (const id of postsToMark) {
      markPostIndexed(id, status);
    }
  }

  revalidatePath("/admin/posts");
  return result;
}

// ---------- FAQ actions ----------

export async function createFaqAction(postId: number, sortOrder: number): Promise<{ id: number }> {
  await requireAdmin();
  const id = createPostFaq(postId, sortOrder);
  revalidatePath(`/admin/posts/${postId}`);
  return { id };
}

export async function deleteFaqAction(postId: number, faqId: number): Promise<void> {
  await requireAdmin();
  deletePostFaq(postId, faqId);
  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

export async function saveFaqTranslationAction(
  faqId: number,
  locale: Locale,
  question: string,
  answer: string,
): Promise<void> {
  await requireAdmin();
  if (!question.trim() || !answer.trim()) {
    throw new Error("Pergunta e resposta são obrigatórias.");
  }
  upsertFaqTranslation(faqId, locale, question.trim(), answer.trim());
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

export async function reorderFaqsAction(postId: number, orderedIds: number[]): Promise<void> {
  await requireAdmin();
  reorderPostFaqs(postId, orderedIds);
  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

// ---------- Internal linking ----------

export async function searchInternalLinksAction(
  postId: number | null,
  locale: Locale,
  query: string,
): Promise<InternalLinkSuggestion[]> {
  await requireAdmin();
  return searchInternalLinks(postId ?? -1, locale, query);
}
