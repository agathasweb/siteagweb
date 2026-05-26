import "server-only";
import { db } from "./index";

export type ScheduledPostType =
  | "feed_image"
  | "feed_video"
  | "reel"
  | "carousel"
  | "story_image"
  | "story_video"
  | "linkedin_text"
  | "linkedin_image"
  | "linkedin_video";

export type ScheduledStatus =
  | "rascunho"
  | "agendado"
  | "publicando"
  | "publicado"
  | "falhou"
  | "cancelado";

export interface ScheduledPostRow {
  id: number;
  account_id: number;
  type: ScheduledPostType;
  caption: string | null;
  hashtags: string | null; // JSON
  media_urls: string | null; // JSON
  cover_url: string | null;
  location_id: string | null;
  scheduled_at: string;
  status: ScheduledStatus;
  ig_media_id: string | null;
  linkedin_post_urn: string | null;
  permalink: string | null;
  published_at: string | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledPost {
  account_id: number;
  type: ScheduledPostType;
  caption: string | null;
  hashtags: string[] | null;
  media_urls: string[];
  cover_url?: string | null;
  location_id?: string | null;
  scheduled_at: string;
  status?: ScheduledStatus;
}

const insertStmt = db.prepare(`
  INSERT INTO social_scheduled_posts (
    account_id, type, caption, hashtags, media_urls, cover_url,
    location_id, scheduled_at, status
  ) VALUES (
    @account_id, @type, @caption, @hashtags, @media_urls, @cover_url,
    @location_id, @scheduled_at, @status
  )
`);

export function createScheduledPost(input: CreateScheduledPost): number {
  const info = insertStmt.run({
    account_id: input.account_id,
    type: input.type,
    caption: input.caption,
    hashtags: input.hashtags ? JSON.stringify(input.hashtags) : null,
    media_urls: JSON.stringify(input.media_urls),
    cover_url: input.cover_url ?? null,
    location_id: input.location_id ?? null,
    scheduled_at: input.scheduled_at,
    status: input.status ?? "agendado",
  });
  return Number(info.lastInsertRowid);
}

export function listScheduledPosts(filter?: {
  status?: ScheduledStatus;
  account_id?: number;
  limit?: number;
}): ScheduledPostRow[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter?.status) {
    where.push("status = @status");
    params.status = filter.status;
  }
  if (filter?.account_id) {
    where.push("account_id = @account_id");
    params.account_id = filter.account_id;
  }
  const sql =
    "SELECT * FROM social_scheduled_posts" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY scheduled_at DESC LIMIT ${filter?.limit ?? 500}`;
  return db.prepare(sql).all(params) as ScheduledPostRow[];
}

export function getScheduledPost(id: number): ScheduledPostRow | null {
  return (db
    .prepare("SELECT * FROM social_scheduled_posts WHERE id = ?")
    .get(id) as ScheduledPostRow | undefined) ?? null;
}

/** Posts agendados que já passaram da hora — alvos do cron de publish. */
export function listDueScheduledPosts(limit = 20): ScheduledPostRow[] {
  return db
    .prepare(
      `SELECT * FROM social_scheduled_posts
       WHERE status = 'agendado' AND scheduled_at <= datetime('now')
       ORDER BY scheduled_at ASC LIMIT ?`,
    )
    .all(limit) as ScheduledPostRow[];
}

export function markScheduledPublishing(id: number): void {
  db.prepare(
    `UPDATE social_scheduled_posts
     SET status = 'publicando', attempts = attempts + 1, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(id);
}

export function markScheduledPublished(
  id: number,
  externalId: { ig_media_id?: string; linkedin_post_urn?: string },
  permalink: string | null,
): void {
  db.prepare(
    `UPDATE social_scheduled_posts
     SET status = 'publicado',
         ig_media_id = COALESCE(@ig, ig_media_id),
         linkedin_post_urn = COALESCE(@li, linkedin_post_urn),
         permalink = COALESCE(@permalink, permalink),
         published_at = datetime('now'),
         updated_at = datetime('now'),
         error_message = NULL
     WHERE id = @id`,
  ).run({
    id,
    ig: externalId.ig_media_id ?? null,
    li: externalId.linkedin_post_urn ?? null,
    permalink,
  });
}

export function markScheduledFailed(id: number, error: string): void {
  db.prepare(
    `UPDATE social_scheduled_posts
     SET status = 'falhou', error_message = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(error.slice(0, 1000), id);
}

export function cancelScheduledPost(id: number): void {
  db.prepare(
    `UPDATE social_scheduled_posts
     SET status = 'cancelado', updated_at = datetime('now')
     WHERE id = ? AND status IN ('rascunho','agendado')`,
  ).run(id);
}

export function updateScheduledPost(
  id: number,
  patch: Partial<CreateScheduledPost>,
): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.caption !== undefined) { sets.push("caption = @caption"); params.caption = patch.caption; }
  if (patch.hashtags !== undefined) { sets.push("hashtags = @hashtags"); params.hashtags = patch.hashtags ? JSON.stringify(patch.hashtags) : null; }
  if (patch.media_urls !== undefined) { sets.push("media_urls = @media_urls"); params.media_urls = JSON.stringify(patch.media_urls); }
  if (patch.cover_url !== undefined) { sets.push("cover_url = @cover_url"); params.cover_url = patch.cover_url; }
  if (patch.location_id !== undefined) { sets.push("location_id = @location_id"); params.location_id = patch.location_id; }
  if (patch.scheduled_at !== undefined) { sets.push("scheduled_at = @scheduled_at"); params.scheduled_at = patch.scheduled_at; }
  if (patch.status !== undefined) { sets.push("status = @status"); params.status = patch.status; }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  db.prepare(
    `UPDATE social_scheduled_posts SET ${sets.join(", ")} WHERE id = @id`,
  ).run(params);
}

export interface ScheduledStats {
  agendado: number;
  publicando: number;
  publicado: number;
  falhou: number;
  rascunho: number;
}

export function getScheduledStats(): ScheduledStats {
  const rows = db
    .prepare(
      `SELECT status, COUNT(*) AS c FROM social_scheduled_posts GROUP BY status`,
    )
    .all() as { status: ScheduledStatus; c: number }[];
  const out: ScheduledStats = {
    agendado: 0, publicando: 0, publicado: 0, falhou: 0, rascunho: 0,
  };
  for (const r of rows) {
    if (r.status === "cancelado") continue;
    out[r.status as keyof ScheduledStats] = r.c;
  }
  return out;
}
