import { NextRequest, NextResponse } from "next/server";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import { syncCampaignsMetricsToDb } from "@/lib/meta-ads/insights";
import { listCampaignsFromMeta } from "@/lib/meta-ads/campaigns";
import { upsertAdsCampaign, type CampaignStatus } from "@/lib/db/ads-campaigns";
import { syncAdAccountsToDb } from "@/lib/meta-ads/accounts";

export const dynamic = "force-dynamic";

/**
 * Cron de sincronização Meta Ads.
 *
 * Roda a cada 15min. Para cada ad account ativa:
 *  1. Lista todas as campanhas da Meta (não só as criadas pelo nosso painel)
 *  2. Upsert mirror local
 *  3. Atualiza métricas via /insights
 *
 * Também atualiza o cache de ad accounts a cada execução (gasto histórico,
 * saldo, status) — refresh leve em background.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Refresh do cache de contas (gasto total, saldo, status)
  await syncAdAccountsToDb();

  const accounts = listManagedAdsAccounts();
  const report: Array<{
    account: string;
    campaigns_synced: number;
    metrics_updated: number;
    errors: string[];
  }> = [];

  for (const acc of accounts) {
    // 1. Lista campanhas da Meta e upsert mirror local
    const remote = await listCampaignsFromMeta(acc.ad_account_id, {
      effective_status: ["ACTIVE", "PAUSED", "ARCHIVED"],
      limit: 100,
    });
    let synced = 0;
    for (const c of remote) {
      if (!c.id) continue;
      try {
        const status = (c.status ?? "PAUSED") as CampaignStatus;
        upsertAdsCampaign({
          ad_account_id: acc.ad_account_id,
          external_id: c.id,
          name: c.name ?? "(sem nome)",
          objective: c.objective ?? "OUTCOME_TRAFFIC",
          status,
          daily_budget_brl: c.daily_budget ? parseInt(c.daily_budget, 10) / 100 : null,
          lifetime_budget_brl: c.lifetime_budget ? parseInt(c.lifetime_budget, 10) / 100 : null,
          spend_cap_brl: c.spend_cap ? parseInt(c.spend_cap, 10) / 100 : 0,
          buying_type: c.buying_type ?? null,
          start_time: c.start_time ?? null,
          stop_time: c.stop_time ?? null,
          created_at_meta: c.created_time ?? null,
        });
        synced++;
      } catch (err) {
        report.push({
          account: acc.name,
          campaigns_synced: 0,
          metrics_updated: 0,
          errors: [`upsert ${c.id}: ${err instanceof Error ? err.message : "?"}`],
        });
      }
    }

    // 2. Insights agregados (last_30d)
    const ins = await syncCampaignsMetricsToDb(acc.ad_account_id, "last_30d");

    report.push({
      account: acc.name,
      campaigns_synced: synced,
      metrics_updated: ins.updated,
      errors: ins.errors,
    });
  }

  return NextResponse.json({ ok: true, accounts: accounts.length, report });
}
