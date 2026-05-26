import "server-only";
import { db } from "./index";

export interface DailyInsightRow {
  id: number;
  account_id: number;
  date: string;
  followers_count: number;
  reach: number;
  impressions: number;
  profile_views: number;
  website_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  follower_count_delta: number;
}

export interface UpsertDailyInsight {
  account_id: number;
  date: string;
  followers_count?: number;
  reach?: number;
  impressions?: number;
  profile_views?: number;
  website_clicks?: number;
  email_clicks?: number;
  phone_clicks?: number;
}

const upsertStmt = db.prepare(`
  INSERT INTO social_insights_daily (
    account_id, date, followers_count, reach, impressions,
    profile_views, website_clicks, email_clicks, phone_clicks
  ) VALUES (
    @account_id, @date, @followers_count, @reach, @impressions,
    @profile_views, @website_clicks, @email_clicks, @phone_clicks
  )
  ON CONFLICT(account_id, date) DO UPDATE SET
    followers_count = excluded.followers_count,
    reach = excluded.reach,
    impressions = excluded.impressions,
    profile_views = excluded.profile_views,
    website_clicks = excluded.website_clicks,
    email_clicks = excluded.email_clicks,
    phone_clicks = excluded.phone_clicks
`);

export function upsertDailyInsight(input: UpsertDailyInsight): void {
  upsertStmt.run({
    ...input,
    followers_count: input.followers_count ?? 0,
    reach: input.reach ?? 0,
    impressions: input.impressions ?? 0,
    profile_views: input.profile_views ?? 0,
    website_clicks: input.website_clicks ?? 0,
    email_clicks: input.email_clicks ?? 0,
    phone_clicks: input.phone_clicks ?? 0,
  });

  // Recalcula delta vs dia anterior — pra plotar crescimento sem cálculo client.
  db.prepare(
    `UPDATE social_insights_daily
       SET follower_count_delta = followers_count - COALESCE((
         SELECT followers_count FROM social_insights_daily
         WHERE account_id = @account_id AND date < @date
         ORDER BY date DESC LIMIT 1
       ), followers_count)
     WHERE account_id = @account_id AND date = @date`,
  ).run({ account_id: input.account_id, date: input.date });
}

export function listDailyInsights(
  accountId: number,
  sinceDays: number,
): DailyInsightRow[] {
  return db
    .prepare(
      `SELECT * FROM social_insights_daily
       WHERE account_id = ?
         AND date > date('now', '-' || ? || ' days')
       ORDER BY date ASC`,
    )
    .all(accountId, sinceDays) as DailyInsightRow[];
}

// ---------- Audiência (demografia) ----------

export interface AudienceRow {
  id: number;
  account_id: number;
  dimension: string;
  bucket: string;
  value: number;
  captured_at: string;
}

const upsertAudienceStmt = db.prepare(`
  INSERT INTO social_audience (account_id, dimension, bucket, value)
  VALUES (@account_id, @dimension, @bucket, @value)
  ON CONFLICT(account_id, dimension, bucket) DO UPDATE SET
    value = excluded.value,
    captured_at = datetime('now')
`);

export function upsertAudienceSlice(
  account_id: number,
  dimension: string,
  bucket: string,
  value: number,
): void {
  upsertAudienceStmt.run({ account_id, dimension, bucket, value });
}

export function listAudience(
  accountId: number,
  dimension: string,
): AudienceRow[] {
  return db
    .prepare(
      `SELECT * FROM social_audience
       WHERE account_id = ? AND dimension = ?
       ORDER BY value DESC LIMIT 20`,
    )
    .all(accountId, dimension) as AudienceRow[];
}
