import { NextRequest, NextResponse } from "next/server";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { getSocialAccessToken } from "@/lib/meta-graph/client";
import {
  syncRecentPosts,
  syncAccountInsights,
  syncAccountSnapshot,
  syncAudience,
} from "@/lib/meta-graph/sync";

export const dynamic = "force-dynamic";

/**
 * Cron de sincronização de métricas sociais.
 *
 * Roda a cada hora. Para cada conta ativa:
 *   1. Snapshot da conta (followers/media_count/foto)
 *   2. Posts recentes (30 dias) com métricas individuais
 *   3. Insights diários da conta
 *   4. Audiência (demografia) — só 1x por dia pra economizar quota (modulo /6)
 *
 * Quando esse cron termina, /admin/social/relatorios reflete os dados mais
 * recentes da Meta sem precisar fazer fetch on-demand (mais rápido + dentro
 * dos limites de rate).
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

  const accounts = listSocialAccounts().filter((a) => a.provider === "instagram");
  const report: Array<{
    account: string;
    snapshot?: { ok: boolean; error?: string };
    posts?: { synced: number; errors: string[] };
    insights?: { synced: number; errors: string[] };
    audience?: { ok: boolean; error?: string };
  }> = [];

  // Audiência roda só de 6 em 6h (hour % 6 === 0) — limites mais apertados.
  const runAudience = new Date().getUTCHours() % 6 === 0;

  for (const account of accounts) {
    const r: (typeof report)[number] = { account: account.username };
    r.snapshot = await syncAccountSnapshot(token, account);
    r.posts = await syncRecentPosts(token, account, 30);
    r.insights = await syncAccountInsights(token, account, 30);
    if (runAudience) {
      r.audience = await syncAudience(token, account);
    }
    report.push(r);
  }

  return NextResponse.json({ ok: true, accounts: accounts.length, report });
}
