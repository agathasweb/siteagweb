import "server-only";
import type { Locale } from "@/lib/i18n";
import { translatePostDistinct } from "@/lib/ai/translate";
import { getPostById, upsertTranslation } from "@/lib/db/posts";
import { sanitizeHtml } from "@/lib/content";
import { countWords, readingTimeMinutes } from "@/lib/content-stats";

export interface RedifferentiateResult {
  redifferentiated: number; // en-GB re-localizado para divergir do en-US
  skipped: number;          // não colidia, ou faltava en-US/en-GB/origem
  errors: { postId: number; reason: string }[];
}

interface FullTRow {
  locale: Locale;
  title: string;
  excerpt: string | null;
  content_html: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
}

function normTitle(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Núcleo do "Rediferenciar EN": para cada post cujo en-GB é duplicata do en-US
 * (mesmo título, ou mesma meta_description não-vazia), re-localiza APENAS o
 * en-GB a partir do source_locale forçando divergência do en-US (que fica
 * intacto). Só age quando há colisão real. Usado tanto pela server action do
 * admin quanto pelo endpoint /api/admin/redifferentiate-en.
 */
export async function redifferentiateEnglishPosts(
  ids: number[],
): Promise<RedifferentiateResult> {
  const result: RedifferentiateResult = { redifferentiated: 0, skipped: 0, errors: [] };

  for (const postId of ids) {
    if (!Number.isFinite(postId) || postId <= 0) continue;
    const detail = getPostById(postId);
    if (!detail) {
      result.errors.push({ postId, reason: "Post não encontrado" });
      continue;
    }
    const post = detail.post as { source_locale: Locale };
    const translations = detail.translations as FullTRow[];
    const enUS = translations.find((t) => t.locale === "en-US");
    const enGB = translations.find((t) => t.locale === "en-GB");
    const source = translations.find((t) => t.locale === post.source_locale);

    // Precisa de en-US (âncora), en-GB (alvo) e a origem para re-localizar.
    if (!source || !enUS || !enGB) {
      result.skipped++;
      continue;
    }
    const usMeta = normTitle(enUS.meta_description);
    const collide =
      normTitle(enUS.title) === normTitle(enGB.title) ||
      (usMeta !== "" && usMeta === normTitle(enGB.meta_description));
    if (!collide) {
      result.skipped++;
      continue;
    }

    try {
      const translated = await translatePostDistinct(
        post.source_locale,
        "en-GB",
        {
          title: source.title,
          excerpt: source.excerpt,
          content_html: source.content_html,
          meta_title: source.meta_title,
          meta_description: source.meta_description,
          og_title: source.og_title,
          og_description: source.og_description,
        },
        {
          avoidSibling: {
            locale: "en-US",
            title: enUS.title,
            metaTitle: enUS.meta_title,
            metaDescription: enUS.meta_description,
          },
        },
      );
      const html = sanitizeHtml(translated.content_html);
      upsertTranslation(postId, {
        locale: "en-GB",
        title: translated.title,
        excerpt: translated.excerpt,
        content_html: html,
        meta_title: translated.meta_title,
        meta_description: translated.meta_description,
        og_title: translated.og_title,
        og_description: translated.og_description,
        reading_time_min: readingTimeMinutes(html),
        word_count: countWords(html),
        translation_source: "ai-deepseek",
      });
      result.redifferentiated++;
    } catch (err) {
      result.errors.push({
        postId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
