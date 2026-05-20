"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getOrCreateUserByEmail } from "@/lib/db/users";
import {
  validatePostsJson,
  importPosts,
  type ValidationResult,
  type ImportResult,
} from "@/lib/posts-import";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Não autorizado.");
  return session.user;
}

function parseJsonSafe(raw: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "JSON inválido." };
  }
}

export interface ValidateResponse {
  ok: boolean;
  parseError?: string;
  validation?: ValidationResult;
  /** Resumo amigável para preview (não inclui o conteúdo HTML completo). */
  preview?: {
    slug: string;
    source_locale: string;
    status: string;
    article_type: string;
    locales: string[];
    title: string;
    tagsCount: number;
    faqsCount: number;
  }[];
}

export async function validateJsonAction(raw: string): Promise<ValidateResponse> {
  await requireAdmin();
  const parsed = parseJsonSafe(raw);
  if (!parsed.ok) return { ok: false, parseError: parsed.error };

  const validation = validatePostsJson(parsed.data);
  const preview = validation.posts.map((p) => {
    const sourceT = p.input.translations.find((t) => t.locale === p.input.source_locale);
    return {
      slug: p.input.slug,
      source_locale: p.input.source_locale,
      status: p.input.status ?? "draft",
      article_type: p.input.article_type ?? "BlogPosting",
      locales: p.input.translations.map((t) => t.locale),
      title: sourceT?.title ?? "(sem título)",
      tagsCount: p.input.tags?.length ?? 0,
      faqsCount: p.input.faqs?.length ?? 0,
    };
  });

  return { ok: validation.ok, validation, preview };
}

export interface ImportResponse {
  ok: boolean;
  parseError?: string;
  result?: ImportResult;
  validation?: ValidationResult;
}

export async function importJsonAction(
  raw: string,
  options: { autoCover?: boolean } = {},
): Promise<ImportResponse> {
  const user = await requireAdmin();
  const parsed = parseJsonSafe(raw);
  if (!parsed.ok) return { ok: false, parseError: parsed.error };

  const validation = validatePostsJson(parsed.data);
  if (!validation.ok) {
    return { ok: false, validation };
  }

  const dbUser = getOrCreateUserByEmail(user.email!, user.name ?? "Admin");
  const result = await importPosts(validation.posts, dbUser.id, {
    autoCover: !!options.autoCover,
  });

  if (result.ok) {
    revalidatePath("/admin/posts");
    revalidatePath(`/[lang]/blog`, "page");
  }

  return { ok: result.ok, result };
}
