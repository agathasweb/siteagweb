"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLocale, type Locale } from "@/lib/i18n";
import { sanitizeHtml, markdownToHtml, isProbablyMarkdown } from "@/lib/content";
import { translatePost } from "@/lib/ai/translate";
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
  type PostStatus,
  type ArticleType,
  type TwitterCardType,
} from "@/lib/db/posts";

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

export async function createPostAction(formData: FormData) {
  await requireAdmin();

  const slug = getString(formData, "slug");
  const status = (getString(formData, "status") || "draft") as PostStatus;
  const sourceLocale = getLocale(formData, "source_locale");
  const articleType = (getString(formData, "article_type") || "BlogPosting") as ArticleType;

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
  const twitterCardType = (getString(formData, "twitter_card_type") || "summary_large_image") as TwitterCardType;
  const focusKeyword = getOptionalString(formData, "focus_keyword");
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

  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  redirect(`/admin/posts/${id}`);
}

export async function updatePostMetaAction(postId: number, formData: FormData) {
  await requireAdmin();

  const slug = getOptionalString(formData, "slug");
  const status = getOptionalString(formData, "status") as PostStatus | null;
  const coverImage = formData.has("cover_image")
    ? getOptionalString(formData, "cover_image")
    : undefined;

  updatePost(postId, {
    slug: slug ?? undefined,
    status: status ?? undefined,
    cover_image: coverImage,
  });

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath(`/[lang]/blog`, "page");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
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

  if (!title) throw new Error("Título é obrigatório.");
  if (!content) throw new Error("Conteúdo é obrigatório.");

  const contentHtml = await prepareHtml(content);

  upsertTranslation(postId, {
    locale,
    title,
    excerpt,
    content_html: contentHtml,
    meta_title: metaTitle,
    meta_description: metaDescription,
    translation_source: "manual",
  });

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
    const translation = await translatePost(post.source_locale, targetLocale, {
      title: source.title,
      excerpt: source.excerpt,
      content_html: source.content_html,
      meta_title: source.meta_title,
      meta_description: source.meta_description,
    });

    upsertTranslation(postId, {
      locale: targetLocale,
      title: translation.title,
      excerpt: translation.excerpt,
      content_html: sanitizeHtml(translation.content_html),
      meta_title: translation.meta_title,
      meta_description: translation.meta_description,
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

export async function deletePostAction(postId: number) {
  await requireAdmin();
  deletePost(postId);
  revalidatePath("/admin/posts");
  revalidatePath(`/[lang]/blog`, "page");
  redirect("/admin/posts");
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
