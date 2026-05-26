import "server-only";
import { db } from "./index";

export interface AdsActionLogRow {
  id: number;
  action: string;
  ad_account_id: string | null;
  campaign_id: string | null;
  user_id: number | null;
  user_email: string | null;
  payload_json: string | null;
  response_json: string | null;
  success: number;
  error_message: string | null;
  fbtrace_id: string | null;
  created_at: string;
}

const insertStmt = db.prepare(`
  INSERT INTO ads_action_log (
    action, ad_account_id, campaign_id, user_id, user_email,
    payload_json, response_json, success, error_message, fbtrace_id
  ) VALUES (
    @action, @ad_account_id, @campaign_id, @user_id, @user_email,
    @payload_json, @response_json, @success, @error_message, @fbtrace_id
  )
`);

export interface LogAdsActionInput {
  action: string;
  ad_account_id?: string | null;
  campaign_id?: string | null;
  user_id?: number | null;
  user_email?: string | null;
  payload?: unknown;
  response?: unknown;
  success: boolean;
  error_message?: string | null;
  fbtrace_id?: string | null;
}

export function logAdsAction(input: LogAdsActionInput): number {
  const info = insertStmt.run({
    action: input.action,
    ad_account_id: input.ad_account_id ?? null,
    campaign_id: input.campaign_id ?? null,
    user_id: input.user_id ?? null,
    user_email: input.user_email ?? null,
    payload_json: input.payload === undefined ? null : JSON.stringify(input.payload),
    response_json: input.response === undefined ? null : JSON.stringify(input.response),
    success: input.success ? 1 : 0,
    error_message: input.error_message ?? null,
    fbtrace_id: input.fbtrace_id ?? null,
  });
  return Number(info.lastInsertRowid);
}

export function listAdsActionLog(filter: {
  campaign_id?: string;
  ad_account_id?: string;
  limit?: number;
} = {}): AdsActionLogRow[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.campaign_id) {
    where.push("campaign_id = @campaign_id");
    params.campaign_id = filter.campaign_id;
  }
  if (filter.ad_account_id) {
    where.push("ad_account_id = @ad_account_id");
    params.ad_account_id = filter.ad_account_id;
  }
  return db
    .prepare(
      `SELECT * FROM ads_action_log
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC LIMIT ${filter.limit ?? 100}`,
    )
    .all(params) as AdsActionLogRow[];
}
