import "server-only";
import { db } from "@/lib/db/index";
import {
  listManagedAdsAccounts,
  getAdsAccountById,
  type AdsAccountRow,
} from "@/lib/db/ads-accounts";
import {
  listCampaigns,
  type AdsCampaignRow,
} from "@/lib/db/ads-campaigns";
import { getCampaignDailyInsights } from "@/lib/meta-ads/insights";

/**
 * Dados para o relatório PDF de Tráfego Pago (Meta Ads).
 *
 * Diferencial: ROAS REAL — cruza gasto reportado pela Meta com receita real
 * vinda da nossa base (subscriptions confirmadas com utm_source=meta no
 * período). Mais preciso que ROAS do próprio painel Meta, que depende só
 * do Pixel.
 */

export interface AdsReportData {
  accounts: AdsAccountRow[];
  scope: "single" | "all";
  account?: AdsAccountRow;
  period: { since: string; until: string; days: number };
  kpis: AdsKpis;
  dailySpend: Array<{ date: string; spent: number; impressions: number; clicks: number; conversions: number }>;
  campaigns: AdsCampaignRow[];
  funnel: AdsFunnel;
  topAds: Array<{ campaign: string; spent: number; conversions: number; roas: number }>;
  demographics: {
    // Por enquanto vazio — Meta requer chamada com breakdowns separada (slow)
    // Pode ser expandido depois
    age: Array<{ bucket: string; value: number }>;
    gender: Array<{ bucket: string; value: number }>;
    city: Array<{ bucket: string; value: number }>;
  };
  recommendations: string[];
}

export interface AdsKpis {
  total_spent: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;             // cost per acquisition (gasto / conversões)
  reach: number;
  frequency: number;
  // ROAS real (nosso CAPI/subscriptions cruzado com gasto Meta)
  real_revenue: number;
  real_roas: number;       // real_revenue / total_spent
  // ROAS reportado (Pixel-only)
  reported_conversions: number;
}

export interface AdsFunnel {
  impressions: number;
  clicks: number;
  page_views: number;          // do nosso capi_event_log
  leads: number;               // tabela leads com utm_source=meta
  initiate_checkout: number;   // de capi_event_log
  subscribes: number;          // subscriptions CONFIRMED com utm_source=meta
}

export async function buildAdsReportData(
  options: { ad_account_id?: string; sinceDays?: number; from?: string; to?: string },
): Promise<AdsReportData> {
  const accounts = listManagedAdsAccounts();
  const scope: "single" | "all" = options.ad_account_id ? "single" : "all";
  const account = options.ad_account_id ? getAdsAccountById(options.ad_account_id) ?? undefined : undefined;

  // Range efetivo
  let since: Date;
  let until: Date;
  if (options.from && options.to) {
    since = new Date(options.from + "T00:00:00Z");
    until = new Date(options.to + "T23:59:59Z");
  } else {
    until = new Date();
    since = new Date(until.getTime() - (options.sinceDays ?? 30) * 86400_000);
  }
  const sinceDays = Math.max(
    1,
    Math.ceil((until.getTime() - since.getTime()) / 86400_000),
  );
  options.sinceDays = sinceDays;

  // Campanhas no período (excluindo DELETED)
  const campaigns = listCampaigns({
    ad_account_id: options.ad_account_id,
    limit: 200,
  });

  // ---------- KPIs ----------
  const total_spent = campaigns.reduce((s, c) => s + c.spent_brl, 0);
  const total_impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const total_clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const reported_conversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  // Receita real — sum de subscriptions confirmed com utm_source=meta no período
  const { real_revenue, real_subscribes, leads, ic_events, pv_events } =
    crossReferenceWithOurData(sinceDays);

  const kpis: AdsKpis = {
    total_spent,
    total_impressions,
    total_clicks,
    total_conversions: real_subscribes, // priorizamos nossa contagem (mais confiável)
    ctr: total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0,
    cpc: total_clicks > 0 ? total_spent / total_clicks : 0,
    cpm: total_impressions > 0 ? (total_spent / total_impressions) * 1000 : 0,
    cpa: real_subscribes > 0 ? total_spent / real_subscribes : 0,
    reach: campaigns.reduce((s, c) => s + c.reach, 0),
    frequency: campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.frequency, 0) / campaigns.length : 0,
    real_revenue,
    real_roas: total_spent > 0 ? real_revenue / total_spent : 0,
    reported_conversions,
  };

  // ---------- Daily spend series ----------
  // Como temos a série diária via Graph API por campanha — agregamos
  const dailyMap = new Map<string, { spent: number; impressions: number; clicks: number; conversions: number }>();
  const promises = campaigns
    .filter((c) => c.status === "ACTIVE" || c.status === "PAUSED")
    .slice(0, 20) // limita pra não estourar rate limit
    .map((c) => getCampaignDailyInsights(
      c.external_id,
      sinceDays <= 7 ? "last_7d" : sinceDays <= 14 ? "last_14d" : sinceDays <= 30 ? "last_30d" : "last_90d",
    ));
  const results = await Promise.all(promises);
  for (const series of results) {
    for (const day of series) {
      const date = day.date_start ?? "";
      if (!date) continue;
      const cur = dailyMap.get(date) ?? { spent: 0, impressions: 0, clicks: 0, conversions: 0 };
      cur.spent += day.spent_brl;
      cur.impressions += day.impressions;
      cur.clicks += day.clicks;
      cur.conversions += day.conversions;
      dailyMap.set(date, cur);
    }
  }
  const dailySpend = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ---------- Funnel ----------
  const funnel: AdsFunnel = {
    impressions: total_impressions,
    clicks: total_clicks,
    page_views: pv_events,
    leads,
    initiate_checkout: ic_events,
    subscribes: real_subscribes,
  };

  // ---------- Top ads (por enquanto = top campaigns por ROAS) ----------
  const topAds = campaigns
    .map((c) => {
      // ROAS estimado por campanha — sem desambiguar a venda específica.
      // Distribui receita proporcionalmente ao gasto.
      const share = total_spent > 0 ? c.spent_brl / total_spent : 0;
      const est_revenue = real_revenue * share;
      return {
        campaign: c.name,
        spent: c.spent_brl,
        conversions: c.conversions,
        roas: c.spent_brl > 0 ? est_revenue / c.spent_brl : 0,
      };
    })
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);

  // ---------- Recomendações ----------
  const recommendations: string[] = [];
  if (kpis.real_roas < 1 && total_spent > 0) {
    recommendations.push(`ROAS abaixo de 1x — você está gastando mais do que arrecadando (gasto R$ ${total_spent.toFixed(2)} vs receita R$ ${real_revenue.toFixed(2)}). Pause as campanhas com pior ROAS.`);
  }
  if (kpis.real_roas >= 3) {
    recommendations.push(`ROAS excelente (${kpis.real_roas.toFixed(2)}x) — escale o orçamento das campanhas vencedoras em 20%/semana.`);
  }
  if (kpis.frequency > 3.5) {
    recommendations.push(`Frequência média alta (${kpis.frequency.toFixed(1)}x por usuário) — risco de fadiga. Renove criativos ou amplie audiência.`);
  }
  if (kpis.ctr < 0.5) {
    recommendations.push(`CTR baixo (${kpis.ctr.toFixed(2)}%) — sinaliza que o criativo não está atraente. Teste novos headlines/imagens.`);
  }
  if (kpis.ctr > 2) {
    recommendations.push(`CTR alto (${kpis.ctr.toFixed(2)}%) — o anúncio engaja bem. Confirme se o landing está convertendo o tráfego que chega.`);
  }
  const noSpend = campaigns.filter((c) => c.spent_brl === 0 && c.status === "ACTIVE");
  if (noSpend.length > 0) {
    recommendations.push(`${noSpend.length} campanha(s) ativa(s) sem gasto — verifique se o ad set está aprovado pela Meta e o budget é suficiente.`);
  }
  const nearCap = campaigns.filter((c) => c.spend_cap_brl > 0 && c.spent_brl / c.spend_cap_brl > 0.8);
  if (nearCap.length > 0) {
    recommendations.push(`${nearCap.length} campanha(s) atingiu(ram) >80% do spend cap — aumente o cap ou prepare-se pra parar.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Performance dentro do esperado. Continue monitorando e teste 1-2 novas variantes por semana.");
  }

  return {
    accounts,
    scope,
    account,
    period: { since: since.toISOString(), until: until.toISOString(), days: sinceDays },
    kpis,
    dailySpend,
    campaigns: campaigns.slice(0, 50),
    funnel,
    topAds,
    demographics: { age: [], gender: [], city: [] }, // expansão futura
    recommendations,
  };
}

/** Cruza com nossas tabelas (CAPI + leads + subscriptions). */
function crossReferenceWithOurData(sinceDays: number) {
  // Receita real: subscriptions com status pago e utm_source contendo meta
  const subRow = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(value), 0) AS v
       FROM subscriptions
       WHERE status IN ('CONFIRMED','RECEIVED')
         AND confirmed_at > datetime('now', '-' || ? || ' days')
         AND (utm_source LIKE '%meta%' OR utm_source LIKE '%facebook%' OR utm_source LIKE '%instagram%' OR fbclid IS NOT NULL)`,
    )
    .get(sinceDays) as { c: number; v: number };

  // Leads: tabela leads com utm_source de meta ou fbclid
  const leadRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM leads
       WHERE created_at > datetime('now', '-' || ? || ' days')
         AND (utm_source LIKE '%meta%' OR utm_source LIKE '%facebook%' OR utm_source LIKE '%instagram%' OR fbclid IS NOT NULL)`,
    )
    .get(sinceDays) as { c: number };

  // Eventos CAPI no período
  const eventRow = db
    .prepare(
      `SELECT
         SUM(CASE WHEN event_name = 'PageView' THEN 1 ELSE 0 END) AS pv,
         SUM(CASE WHEN event_name = 'InitiateCheckout' THEN 1 ELSE 0 END) AS ic
       FROM capi_event_log
       WHERE status = 'sent'
         AND created_at > datetime('now', '-' || ? || ' days')`,
    )
    .get(sinceDays) as { pv: number | null; ic: number | null };

  return {
    real_revenue: subRow.v,
    real_subscribes: subRow.c,
    leads: leadRow.c,
    ic_events: eventRow.ic ?? 0,
    pv_events: eventRow.pv ?? 0,
  };
}
