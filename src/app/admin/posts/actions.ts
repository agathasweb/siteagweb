"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLocale, type Locale } from "@/lib/i18n";
import { sanitizeHtml, markdownToHtml, isProbablyMarkdown } from "@/lib/content";
import { translatePost } from "@/lib/ai/translate";
import {
  createPost,
  updatePost,
  deletePost,
  upsertTranslation,
  getPostById,
  type PostStatus,
} from "@/lib/db/posts";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }
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

export async function createPostAction(formData: FormData) {
  await requireAdmin();

  const slug = getString(formData, "slug");
  const status = (getString(formData, "status") || "draft") as PostStatus;
  const sourceLocale = getLocale(formData, "source_locale");
  const coverImage = getOptionalString(formData, "cover_image");
  const title = getString(formData, "title");
  const excerpt = getOptionalString(formData, "excerpt");
  const content = getString(formData, "content");
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");

  if (!slug) throw new Error("Slug é obrigatório.");
  if (!title) throw new Error("Título é obrigatório.");
  if (!content) throw new Error("Conteúdo é obrigatório.");

  const contentHtml = await prepareHtml(content);

  const id = createPost({
    slug,
    status,
    source_locale: sourceLocale,
    cover_image: coverImage,
    translations: [
      {
        locale: sourceLocale,
        title,
        excerpt,
        content_html: contentHtml,
        meta_title: metaTitle,
        meta_description: metaDescription,
        translation_source: "manual",
      },
    ],
  });

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
      translation_source: "ai-anthropic",
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
