import "server-only";
import { db } from "./index";

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface AdsCampaignRow {
  id: number;
  ad_account_id: string;
  external_id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  daily_budget_brl: number | null;
  lifetime_budget_brl: number | null;
  spend_cap_brl: number;
  buying_type: string | null;
  start_time: string | null;
  stop_time: string | null;
  spent_brl: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc_brl: number;
  cpm_brl: number;
  reach: number;
  frequency: number;
  created_by_user_id: number | null;
  created_at_meta: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertAdsCampaign {
  ad_account_id: string;
  external_id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  daily_budget_brl?: number | null;
  lifetime_budget_brl?: number | null;
  spend_cap_brl: number;
  buying_type?: string | null;
  start_time?: string | null;
  stop_time?: string | null;
  created_by_user_id?: number | null;
  created_at_meta?: string | null;
}

const upsertStmt = db.prepare(`
  INSERT INTO ads_campaigns (
    ad_account_id, external_id, name, objective, status,
    daily_budget_brl, lifetime_budget_brl, spend_cap_brl, buying_type,
    start_time, stop_time, created_by_user_id, created_at_meta, last_sync_at
  ) VALUES (
    @ad_account_id, @external_id, @name, @objective, @status,
    @daily_budget_brl, @lifetime_budget_brl, @spend_cap_brl, @buying_type,
    @start_time, @stop_time, @created_by_user_id, @created_at_meta, datetime('now')
  )
  ON CONFLICT(external_id) DO UPDATE SET
    name = excluded.name,
    status = excluded.status,
    daily_budget_brl = excluded.daily_budget_brl,
    lifetime_budget_brl = excluded.lifetime_budget_brl,
    spend_cap_brl = excluded.spend_cap_brl,
    stop_time = excluded.stop_time,
    last_sync_at = datetime('now'),
    updated_at = datetime('now')
`);

export function upsertAdsCampaign(input: UpsertAdsCampaign): void {
  upsertStmt.run({
    ad_account_id: input.ad_account_id,
    external_id: input.external_id,
    name: input.name,
    objective: input.objective,
    status: input.status,
    daily_budget_brl: input.daily_budget_brl ?? null,
    lifetime_budget_brl: input.lifetime_budget_brl ?? null,
    spend_cap_brl: input.spend_cap_brl,
    buying_type: input.buying_type ?? null,
    start_time: input.start_time ?? null,
    stop_time: input.stop_time ?? null,
    created_by_user_id: input.created_by_user_id ?? null,
    created_at_meta: input.created_at_meta ?? null,
  });
}

export function updateCampaignMetrics(
  external_id: string,
  metrics: {
    spent_brl: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc_brl: number;
    cpm_brl: number;
    reach: number;
    frequency: number;
  },
): void {
  db.prepare(
    `UPDATE ads_campaigns
     SET spent_brl=@spent_brl, impressions=@impressions, clicks=@clicks,
         conversions=@conversions, ctr=@ctr, cpc_brl=@cpc_brl, cpm_brl=@cpm_brl,
         reach=@reach, frequency=@frequency,
         last_sync_at = datetime('now'), updated_at = datetime('now')
     WHERE external_id = @external_id`,
  ).run({ ...metrics, external_id });
}

export function updateCampaignStatusLocal(
  external_id: string,
  status: CampaignStatus,
): void {
  db.prepare(
    `UPDATE ads_campaigns SET status=?, updated_at=datetime('now') WHERE external_id=?`,
  ).run(status, external_id);
}

export function getCampaignByExternalId(external_id: string): AdsCampaignRow | null {
  return (db
    .prepare(`SELECT * FROM ads_campaigns WHERE external_id = ?`)
    .get(external_id) as AdsCampaignRow | undefined) ?? null;
}

export function listCampaigns(filter: {
  ad_account_id?: string;
  status?: CampaignStatus;
  limit?: number;
} = {}): AdsCampaignRow[] {
  const where: string[] = ["status != 'DELETED'"];
  const params: Record<string, unknown> = {};
  if (filter.ad_account_id) {
    where.push("ad_account_id = @ad_account_id");
    params.ad_account_id = filter.ad_account_id;
  }
  if (filter.status) {
    where.push("status = @status");
    params.status = filter.status;
  }
  return db
    .prepare(
      `SELECT * FROM ads_campaigns
       WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC LIMIT ${filter.limit ?? 200}`,
    )
    .all(params) as AdsCampaignRow[];
}

export interface CampaignsSpendSummary {
  total_spent: number;
  active_count: number;
  paused_count: number;
}

export function spendSummary(ad_account_id?: string): CampaignsSpendSummary {
  const where = ad_account_id ? "WHERE ad_account_id = ?" : "";
  const params = ad_account_id ? [ad_account_id] : [];
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(spent_brl), 0) AS total_spent,
         SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) AS active_count,
         SUM(CASE WHEN status='PAUSED' THEN 1 ELSE 0 END) AS paused_count
       FROM ads_campaigns ${where}`,
    )
    .get(...params) as { total_spent: number; active_count: number | null; paused_count: number | null };
  return {
    total_spent: row.total_spent,
    active_count: row.active_count ?? 0,
    paused_count: row.paused_count ?? 0,
  };
}
