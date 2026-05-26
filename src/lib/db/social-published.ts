import "server-only";
import { db } from "./index";

export interface PublishedPostRow {
  id: number;
  account_id: number;
  provider: string;
  external_id: string;
  type: string;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  thumbnail_local: string | null;
  media_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  reach: number;
  engagement_total: number;
  profile_visits: number;
  follows: number;
  avg_watch_time_ms: number | null;
  published_at: string;
  last_sync_at: string;
  created_at: string;
}

export interface UpsertPublishedPost {
  account_id: number;
  provider: string;
  external_id: string;
  type: string;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  reach?: number;
  engagement_total?: number;
  profile_visits?: number;
  follows?: number;
  avg_watch_time_ms?: number | null;
  published_at: string;
}

const upsertStmt = db.prepare(`
  INSERT INTO social_published_posts (
    account_id, provider, external_id, type, caption, permalink, thumbnail_url, media_url,
    likes, comments, shares, saves, views, reach, engagement_total,
    profile_visits, follows, avg_watch_time_ms, published_at, last_sync_at
  ) VALUES (
    @account_id, @provider, @external_id, @type, @caption, @permalink, @thumbnail_url, @media_url,
    @likes, @comments, @shares, @saves, @views, @reach, @engagement_total,
    @profile_visits, @follows, @avg_watch_time_ms, @published_at, datetime('now')
  )
  ON CONFLICT(provider, external_id) DO UPDATE SET
    caption = excluded.caption,
    permalink = COALESCE(excluded.permalink, social_published_posts.permalink),
    thumbnail_url = COALESCE(excluded.thumbnail_url, social_published_posts.thumbnail_url),
    media_url = COALESCE(excluded.media_url, social_published_posts.media_url),
    likes = excluded.likes,
    comments = excluded.comments,
    shares = excluded.shares,
    saves = excluded.saves,
    views = excluded.views,
    reach = excluded.reach,
    engagement_total = excluded.engagement_total,
    profile_visits = excluded.profile_visits,
    follows = excluded.follows,
    avg_watch_time_ms = excluded.avg_watch_time_ms,
    last_sync_at = datetime('now')
`);

export function upsertPublishedPost(input: UpsertPublishedPost): void {
  upsertStmt.run({
    ...input,
    likes: input.likes ?? 0,
    comments: input.comments ?? 0,
    shares: input.shares ?? 0,
    saves: input.saves ?? 0,
    views: input.views ?? 0,
    reach: input.reach ?? 0,
    engagement_total: input.engagement_total ?? 0,
    profile_visits: input.profile_visits ?? 0,
    follows: input.follows ?? 0,
    avg_watch_time_ms: input.avg_watch_time_ms ?? null,
  });
}

export function listPublishedPosts(
  accountId: number | null,
  limit = 50,
): PublishedPostRow[] {
  if (accountId) {
    return db
      .prepare(
        `SELECT * FROM social_published_posts
         WHERE account_id = ?
         ORDER BY published_at DESC LIMIT ?`,
      )
      .all(accountId, limit) as PublishedPostRow[];
  }
  return db
    .prepare(
      `SELECT * FROM social_published_posts ORDER BY published_at DESC LIMIT ?`,
    )
    .all(limit) as PublishedPostRow[];
}

/** Atualiza o caminho do thumbnail cacheado localmente. */
export function updatePublishedThumbnailLocal(external_id: string, localPath: string): void {
  db.prepare(
    `UPDATE social_published_posts SET thumbnail_local = ? WHERE external_id = ?`,
  ).run(localPath, external_id);
}

/** Lista posts que ainda não têm cache local de thumbnail. */
export function listPostsNeedingThumbnailCache(limit = 50): PublishedPostRow[] {
  return db
    .prepare(
      `SELECT * FROM social_published_posts
       WHERE thumbnail_url IS NOT NULL AND thumbnail_url != ''
         AND (thumbnail_local IS NULL OR thumbnail_local = '')
       ORDER BY published_at DESC LIMIT ?`,
    )
    .all(limit) as PublishedPostRow[];
}

export function topPublishedPostsByEngagement(
  accountId: number,
  sinceDays: number,
  limit = 10,
): PublishedPostRow[] {
  return db
    .prepare(
      `SELECT * FROM social_published_posts
       WHERE account_id = ?
         AND published_at > datetime('now', '-' || ? || ' days')
       ORDER BY engagement_total DESC, likes DESC
       LIMIT ?`,
    )
    .all(accountId, sinceDays, limit) as PublishedPostRow[];
}
