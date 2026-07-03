import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  listCollidingEnglishPostIds,
  listStaleEnGbPostIds,
} from "@/lib/db/posts";
import { redifferentiateEnglishPosts } from "@/lib/redifferentiate";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

/**
 * Rediferencia o en-GB dos posts que ainda são duplicata do en-US, em LOTES
 * pequenos (para caber no timeout de proxy). Idempotente/retomável: cada chamada
 * pega os primeiros `limit` posts com colisão e devolve quantos ainda faltam.
 * Chame em loop até `remaining` = 0. Auth: Authorization: Bearer CRON_SECRET.
 *
 *   curl -sS -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *        "http://localhost:3002/api/admin/redifferentiate-en?limit=5"
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(20, parseInt(url.searchParams.get("limit") ?? "5", 10) || 5));
  // mode=collision (padrão): só título/meta idênticos.
  // mode=stale: en-GB traduzido antes de `before` (default: hoje), re-localiza à
  // força — pega os posts com tradução antiga (fiel) que diferem só por pontuação.
  const mode = url.searchParams.get("mode") === "stale" ? "stale" : "collision";
  const before = url.searchParams.get("before") || new Date().toISOString().slice(0, 10);

  const select = () =>
    mode === "stale" ? listStaleEnGbPostIds(before) : listCollidingEnglishPostIds();

  const pending = select();
  const batch = pending.slice(0, limit);

  if (batch.length === 0) {
    return NextResponse.json({
      mode,
      processed: 0,
      redifferentiated: 0,
      skipped: 0,
      errors: [],
      remaining: 0,
      totalBefore: 0,
    });
  }

  const res = await redifferentiateEnglishPosts(batch, { force: mode === "stale" });
  const remaining = select().length;

  if (res.redifferentiated > 0) {
    revalidatePath("/admin/posts");
    revalidatePath(`/[lang]/blog`, "page");
    revalidatePath(`/[lang]/blog/[slug]`, "page");
  }

  return NextResponse.json({
    mode,
    processed: batch.length,
    redifferentiated: res.redifferentiated,
    skipped: res.skipped,
    errors: res.errors,
    remaining,
    totalBefore: pending.length,
  });
}
