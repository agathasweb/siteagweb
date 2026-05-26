import { NextRequest, NextResponse } from "next/server";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { getSocialAccessToken } from "@/lib/meta-graph/client";
import {
  syncRecentPosts,
  syncAccountInsights,
  syncAccountSnapshot,
  syncAudience,
  cacheThumbnails,
} from "@/lib/meta-graph/sync";

export const dynamic = "force-dynamic";
// Backfill de 90 dias × 5 contas × várias chamadas → pode passar de 60s.
export const maxDuration = 300;

/**
 * Cron de sincronização de métricas sociais.
 *
 * Roda a cada hora (cron servidor) com `days=90` por default. Pra cada
 * conta ativa, em sequência (não em paralelo pra respeitar rate limit Meta):
 *   1. Snapshot da conta (followers/media_count/foto)
 *   2. Posts recentes (até N dias) com métricas individuais
 *   3. Insights diários da conta
 *   4. Audiência (demografia) — só a cada 6h (hour % 6 === 0)
 *
 * Resilência: falha em UMA conta não bloqueia o resto — cada conta roda
 * dentro de try/catch e o report final mostra o que deu certo/errado.
 *
 * Query params:
 *  - `days` (default 90): janela de backfill
 *  - `audience=1`: força run de audiência mesmo fora da janela
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = getSocialAccessToken();
  if (!token) return NextResponse.json({ ok: false, error: "no_social_token" });

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? "90")));
  const forceAudience = url.searchParams.get("audience") === "1";

  const accounts = listSocialAccounts().filter((a) => a.provider === "instagram");
  const report: Array<{
    account: string;
    ok: boolean;
    snapshot?: { ok: boolean; error?: string };
    posts?: { synced: number; errors: string[] };
    insights?: { synced: number; errors: string[] };
    audience?: { ok: boolean; error?: string };
    error?: string;
  }> = [];

  // Audiência: 6 em 6h por default, ou se explicitamente forçada.
  const runAudience = forceAudience || new Date().getUTCHours() % 6 === 0;

  for (const account of accounts) {
    const r: (typeof report)[number] = { account: account.username, ok: false };
    try {
      r.snapshot = await syncAccountSnapshot(token, account);
      r.posts = await syncRecentPosts(token, account, days);
      r.insights = await syncAccountInsights(token, account, days);
      if (runAudience) {
        r.audience = await syncAudience(token, account);
      }
      r.ok = true;
    } catch (err) {
      r.error = err instanceof Error ? err.message : "exception";
      console.error(`[social-sync] ${account.username} falhou:`, r.error);
    }
    report.push(r);
  }

  // Após sincronizar metadata, baixa thumbnails dos posts pra cache local
  // (URLs do Meta CDN expiram em horas — sem cache os PDFs não renderizam imagens).
  const thumbsResult = await cacheThumbnails(100);

  return NextResponse.json({
    ok: true,
    accounts: accounts.length,
    days,
    runAudience,
    thumbnails: thumbsResult,
    report,
  });
}
