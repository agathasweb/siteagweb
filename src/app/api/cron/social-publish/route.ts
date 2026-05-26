import { NextRequest, NextResponse } from "next/server";
import {
  listDueScheduledPosts,
  markScheduledPublishing,
  markScheduledPublished,
  markScheduledFailed,
} from "@/lib/db/social-scheduled";
import { getSocialAccount } from "@/lib/db/social-accounts";
import { getSocialAccessToken } from "@/lib/meta-graph/client";
import {
  publishInstagramImage,
  publishInstagramVideo,
  publishInstagramReel,
  publishInstagramCarousel,
  publishInstagramStory,
  type CarouselItem,
  type PublishResult,
} from "@/lib/meta-graph/publish";

export const dynamic = "force-dynamic";

/**
 * Cron de publicação de posts sociais agendados.
 *
 * Roda a cada 1 minuto (configurado via crontab no servidor).
 * - Pega até 20 posts com `status = 'agendado'` e `scheduled_at <= now()`
 * - Marca cada um como 'publicando' (bloqueia processamento concorrente)
 * - Chama o método de publicação correto pro tipo
 * - Marca 'publicado' com media_id/permalink ou 'falhou' com error_message
 *
 * Não retenta automaticamente em falha — admin retenta manualmente via UI
 * (intencional: vídeos/reels rejeitados muitas vezes têm problema de formato
 * que precisa fix humano, não retry às cegas).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = getSocialAccessToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_social_token" });
  }

  const due = listDueScheduledPosts(20);
  const results: Array<{ id: number; ok: boolean; error?: string; media_id?: string }> = [];

  for (const post of due) {
    const account = getSocialAccount(post.account_id);
    if (!account || !account.ig_user_id) {
      markScheduledFailed(post.id, "conta_inexistente_ou_sem_ig_user_id");
      results.push({ id: post.id, ok: false, error: "conta_inexistente" });
      continue;
    }

    markScheduledPublishing(post.id);

    const mediaUrls: string[] = post.media_urls ? JSON.parse(post.media_urls) : [];
    if (mediaUrls.length === 0 && post.type !== "linkedin_text") {
      markScheduledFailed(post.id, "sem_midia");
      results.push({ id: post.id, ok: false, error: "sem_midia" });
      continue;
    }

    // Monta URL absoluta (a Meta precisa de URL público) — assume PROD_DOMAIN.
    const publicBase = process.env.SOCIAL_PUBLIC_BASE_URL?.trim() || "https://agathas.com.br";
    const toAbs = (rel: string): string =>
      rel.startsWith("http") ? rel : publicBase + rel;

    const caption = [
      post.caption ?? "",
      post.hashtags ? (JSON.parse(post.hashtags) as string[]).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    let r: PublishResult;
    try {
      switch (post.type) {
        case "feed_image":
          r = await publishInstagramImage(token, account.ig_user_id, toAbs(mediaUrls[0]), caption, post.location_id ?? undefined);
          break;
        case "feed_video":
          r = await publishInstagramVideo(token, account.ig_user_id, toAbs(mediaUrls[0]), caption);
          break;
        case "reel":
          r = await publishInstagramReel(token, account.ig_user_id, toAbs(mediaUrls[0]), caption, {
            coverUrl: post.cover_url ? toAbs(post.cover_url) : undefined,
            shareToFeed: true,
          });
          break;
        case "carousel": {
          const items: CarouselItem[] = mediaUrls.map((u) => ({
            // Heurística simples: extensão .mp4/.mov → video, senão image.
            kind: /\.(mp4|mov)$/i.test(u) ? "video" : "image",
            url: toAbs(u),
          }));
          r = await publishInstagramCarousel(token, account.ig_user_id, items, caption);
          break;
        }
        case "story_image":
          r = await publishInstagramStory(token, account.ig_user_id, toAbs(mediaUrls[0]), "image");
          break;
        case "story_video":
          r = await publishInstagramStory(token, account.ig_user_id, toAbs(mediaUrls[0]), "video");
          break;
        case "linkedin_text":
        case "linkedin_image":
        case "linkedin_video":
          // Fase 8 — placeholder
          r = { ok: false, error: "linkedin_publish_not_implemented_yet" };
          break;
        default:
          r = { ok: false, error: `tipo_desconhecido: ${post.type}` };
      }
    } catch (err) {
      r = { ok: false, error: err instanceof Error ? err.message : "exception" };
    }

    if (r.ok && r.ig_media_id) {
      markScheduledPublished(
        post.id,
        { ig_media_id: r.ig_media_id },
        r.permalink ?? null,
      );
      results.push({ id: post.id, ok: true, media_id: r.ig_media_id });
    } else {
      markScheduledFailed(post.id, r.error ?? "falha_desconhecida");
      results.push({ id: post.id, ok: false, error: r.error });
    }
  }

  return NextResponse.json({ ok: true, processed: due.length, results });
}
