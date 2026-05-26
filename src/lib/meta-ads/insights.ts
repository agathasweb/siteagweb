import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import { updateCampaignMetrics } from "@/lib/db/ads-campaigns";

/**
 * Insights — métricas agregadas vindas do endpoint /insights da Graph API.
 *
 * Níveis suportados:
 *  - account    (toda ad account)
 *  - campaign   (uma campanha)
 *  - adset
 *  - ad
 *
 * Métricas que puxamos:
 *  - spend, impressions, clicks, reach, frequency
 *  - ctr (cliques/impressões), cpc, cpm
 *  - actions (conversões: link_click, purchase, lead, etc.)
 *
 * Valores monetários da Meta vêm em STRING no currency da conta (BRL).
 */

export type InsightsLevel = "account" | "campaign" | "adset" | "ad";

export interface CampaignInsights {
  campaign_id?: string;
  spent_brl: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc_brl: number;
  cpm_brl: number;
  conversions: number;
  date_start?: string;
  date_stop?: string;
}

interface RawInsight {
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  frequency?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

// Tipos de "action" que contam como conversão (Meta tem dezenas).
const CONVERSION_ACTIONS = new Set([
  "offsite_conversion.fb_pixel_purchase",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_subscribe",
  "offsite_conversion.fb_pixel_complete_registration",
  "lead",
  "purchase",
  "subscribe",
  "complete_registration",
]);

function parseInsight(raw: RawInsight): CampaignInsights {
  let conversions = 0;
  for (const a of raw.actions ?? []) {
    if (CONVERSION_ACTIONS.has(a.action_type)) conversions += parseInt(a.value, 10);
  }
  return {
    campaign_id: raw.campaign_id,
    spent_brl: parseFloat(raw.spend ?? "0"),
    impressions: parseInt(raw.impressions ?? "0", 10),
    clicks: parseInt(raw.clicks ?? "0", 10),
    reach: parseInt(raw.reach ?? "0", 10),
    frequency: parseFloat(raw.frequency ?? "0"),
    ctr: parseFloat(raw.ctr ?? "0"),
    cpc_brl: parseFloat(raw.cpc ?? "0"),
    cpm_brl: parseFloat(raw.cpm ?? "0"),
    conversions,
    date_start: raw.date_start,
    date_stop: raw.date_stop,
  };
}

const DEFAULT_FIELDS =
  "campaign_id,spend,impressions,clicks,reach,frequency,ctr,cpc,cpm,actions,date_start,date_stop";

/** Insights agregados (uma linha) no período do date_preset. */
export async function getCampaignInsights(
  campaign_id: string,
  date_preset: "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "maximum" = "last_30d",
): Promise<CampaignInsights | null> {
  const token = getSocialAccessToken();
  if (!token) return null;
  const r = await metaGraph.get<{ data?: RawInsight[] }>(
    token,
    `${campaign_id}/insights`,
    { fields: DEFAULT_FIELDS, date_preset, level: "campaign" },
  );
  if (!r.ok || !r.json.data?.[0]) return null;
  return parseInsight(r.json.data[0]);
}

/** Insights de TODAS campanhas de uma conta — usado pelo cron. */
export async function getAccountCampaignsInsights(
  ad_account_id: string,
  date_preset: "today" | "last_7d" | "last_30d" | "last_90d" = "last_30d",
): Promise<CampaignInsights[]> {
  const token = getSocialAccessToken();
  if (!token) return [];
  const r = await metaGraph.get<{ data?: RawInsight[] }>(
    token,
    `${ad_account_id}/insights`,
    {
      fields: DEFAULT_FIELDS,
      date_preset,
      level: "campaign",
      limit: 200,
    },
  );
  if (!r.ok) return [];
  return (r.json.data ?? []).map(parseInsight);
}

/** Série temporal por dia — pra gráfico de linha. */
export async function getCampaignDailyInsights(
  campaign_id: string,
  date_preset: "last_7d" | "last_14d" | "last_30d" | "last_90d" = "last_30d",
): Promise<CampaignInsights[]> {
  const token = getSocialAccessToken();
  if (!token) return [];
  const r = await metaGraph.get<{ data?: RawInsight[] }>(
    token,
    `${campaign_id}/insights`,
    {
      fields: DEFAULT_FIELDS,
      date_preset,
      level: "campaign",
      time_increment: "1",
      limit: 100,
    },
  );
  if (!r.ok) return [];
  return (r.json.data ?? []).map(parseInsight);
}

/** Atualiza o cache local com métricas agregadas da Meta. */
export async function syncCampaignsMetricsToDb(
  ad_account_id: string,
  date_preset: "today" | "last_7d" | "last_30d" | "last_90d" = "last_30d",
): Promise<{ updated: number; errors: string[] }> {
  const insights = await getAccountCampaignsInsights(ad_account_id, date_preset);
  const errors: string[] = [];
  let updated = 0;
  for (const i of insights) {
    if (!i.campaign_id) continue;
    try {
      updateCampaignMetrics(i.campaign_id, {
        spent_brl: i.spent_brl,
        impressions: i.impressions,
        clicks: i.clicks,
        conversions: i.conversions,
        ctr: i.ctr,
        cpc_brl: i.cpc_brl,
        cpm_brl: i.cpm_brl,
        reach: i.reach,
        frequency: i.frequency,
      });
      updated++;
    } catch (err) {
      errors.push(`${i.campaign_id}: ${err instanceof Error ? err.message : "?"}`);
    }
  }
  return { updated, errors };
}
