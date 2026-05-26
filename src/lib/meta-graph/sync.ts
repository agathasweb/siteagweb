import "server-only";
import { metaGraph } from "./client";
import {
  upsertPublishedPost,
  type UpsertPublishedPost,
} from "@/lib/db/social-published";
import {
  upsertDailyInsight,
  upsertAudienceSlice,
} from "@/lib/db/social-insights";
import {
  updateSocialAccountSnapshot,
  type SocialAccountRow,
} from "@/lib/db/social-accounts";

/**
 * Sincroniza posts, insights e audiência da Graph API pro SQLite.
 *
 * Estratégia:
 *  - syncRecentPosts(account, days=30) — puxa últimos N dias de mídia + métricas
 *  - syncAccountInsights(account, days=30) — métricas diárias da conta
 *  - syncAudience(account) — demografia (snapshot)
 *  - syncAccountSnapshot(account) — followers_count, media_count, foto
 *
 * Tudo idempotente — upsert por (provider, external_id) ou (account, date).
 */

interface IgMediaItem {
  id: string;
  caption?: string;
  media_type?: string;          // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type?: string;  // FEED | REELS | STORY
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
}

interface InsightValueObj {
  name: string;
  values?: Array<{ value?: unknown }>;
}

/** Mapeia (media_type, media_product_type) pra um type interno consistente. */
function mapType(mediaType?: string, productType?: string): string {
  if (productType === "REELS") return "reel";
  if (productType === "STORY") return "story";
  if (mediaType === "CAROUSEL_ALBUM") return "carousel";
  if (mediaType === "VIDEO") return "feed_video";
  return "feed_image";
}

/**
 * Puxa posts recentes (feed + reels + stories) e atualiza social_published_posts.
 * Para cada post recente (< 48h), busca insights detalhados.
 */
export async function syncRecentPosts(
  token: string,
  account: SocialAccountRow,
  days = 30,
): Promise<{ synced: number; errors: string[] }> {
  if (!account.ig_user_id) return { synced: 0, errors: ["no_ig_user_id"] };

  const errors: string[] = [];
  let synced = 0;
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
  let endpoint: string | null = `${account.ig_user_id}/media`;
  let firstPage = true;

  type IgListResp = { data?: IgMediaItem[]; paging?: { next?: string } };
  while (endpoint) {
    const r: import("@/lib/meta-graph/client").MetaGraphResult<IgListResp> = firstPage
      ? await metaGraph.get<IgListResp>(token, endpoint, {
          fields:
            "id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url",
          limit: 50,
        })
      : await metaGraph.get<IgListResp>(token, endpoint);

    firstPage = false;

    if (!r.ok) {
      errors.push(`fetch_failed: ${r.error}`);
      break;
    }

    const items = r.json.data ?? [];
    for (const item of items) {
      if (!item.timestamp) continue;
      if (item.timestamp < cutoff) {
        endpoint = null;
        break;
      }
      const type = mapType(item.media_type, item.media_product_type);

      // Métricas individuais — só pra posts recentes (< 48h) pra economizar quota.
      const isRecent = new Date(item.timestamp).getTime() > Date.now() - 48 * 3600_000;
      const metrics = isRecent
        ? await fetchPostInsights(token, item.id, type)
        : null;

      const data: UpsertPublishedPost = {
        account_id: account.id,
        provider: "instagram",
        external_id: item.id,
        type,
        caption: item.caption ?? null,
        permalink: item.permalink ?? null,
        thumbnail_url: item.thumbnail_url ?? item.media_url ?? null,
        media_url: item.media_url ?? null,
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        published_at: item.timestamp,
      };
      if (metrics) Object.assign(data, metrics);

      try {
        upsertPublishedPost(data);
        synced++;
      } catch (err) {
        errors.push(`upsert_failed ${item.id}: ${err instanceof Error ? err.message : "?"}`);
      }
    }

    endpoint = (r.json.paging?.next as string | undefined) ?? null;
  }

  return { synced, errors };
}

async function fetchPostInsights(
  token: string,
  mediaId: string,
  type: string,
): Promise<Partial<UpsertPublishedPost>> {
  // Conjunto de métricas por tipo (limites da Graph API mudam frequentemente —
  // mantemos só os universais + extras de reel/story).
  let metricList = "views,reach,saved,shares,total_interactions,follows,profile_visits";
  if (type === "reel") metricList += ",ig_reels_avg_watch_time";
  if (type === "story") metricList = "views,reach,replies,follows,profile_visits";

  const r = await metaGraph.get<{ data?: InsightValueObj[] }>(
    token,
    `${mediaId}/insights`,
    { metric: metricList },
  );
  if (!r.ok) return {};

  const out: Partial<UpsertPublishedPost> = {};
  for (const m of r.json.data ?? []) {
    const v = m.values?.[0]?.value;
    const num = typeof v === "number" ? v : 0;
    switch (m.name) {
      case "views": out.views = num; break;
      case "reach": out.reach = num; break;
      case "saved": out.saves = num; break;
      case "shares": out.shares = num; break;
      case "total_interactions": out.engagement_total = num; break;
      case "follows": out.follows = num; break;
      case "profile_visits": out.profile_visits = num; break;
      case "ig_reels_avg_watch_time": out.avg_watch_time_ms = num; break;
      case "replies":
        out.engagement_total = (out.engagement_total ?? 0) + num;
        break;
    }
  }
  return out;
}

// ----------------------------------------------------------------------------

type DailyMetrics = Partial<{
  followers_count: number; reach: number; profile_views: number;
  website_clicks: number; email_clicks: number; phone_clicks: number;
}>;

/**
 * Métricas diárias da conta como um todo (followers_count, reach, etc.).
 *
 * Na Graph API v21 cada métrica tem requisitos diferentes:
 *  - `follower_count` é "time series" — não aceita `metric_type=total_value`
 *  - `reach`, `profile_views` aceitam `metric_type=total_value`
 *  - `website_clicks`, `email_contacts`, `phone_call_clicks` aceitam ambos
 *
 * Fazemos 2 chamadas separadas pra evitar o erro #100.
 */
export async function syncAccountInsights(
  token: string,
  account: SocialAccountRow,
  days = 30,
): Promise<{ synced: number; errors: string[] }> {
  if (!account.ig_user_id) return { synced: 0, errors: ["no_ig_user_id"] };

  const errors: string[] = [];
  const byDate = new Map<string, DailyMetrics>();

  // Helper que mescla resposta da Graph API no Map por data.
  const mergeResponse = (
    resp: import("@/lib/meta-graph/client").MetaGraphResult<{ data?: InsightValueObj[] }>,
    apply: (row: DailyMetrics, metricName: string, value: number) => void,
  ) => {
    if (!resp.ok) {
      errors.push(`insights_fetch: ${resp.error}`);
      return;
    }
    for (const metric of resp.json.data ?? []) {
      const values = (metric as { values?: Array<{ value?: number; end_time?: string }> }).values ?? [];
      for (const v of values) {
        if (!v.end_time || v.value === undefined) continue;
        const date = v.end_time.slice(0, 10);
        const row = byDate.get(date) ?? {};
        apply(row, metric.name, v.value);
        byDate.set(date, row);
      }
    }
  };

  // Meta API limita /insights a JANELAS DE 30 DIAS por chamada.
  // Pra cobrir 90 dias precisamos fazer 3 chunks em sequência.
  const CHUNK_DAYS = 30;
  const endNow = Math.floor(Date.now() / 1000);
  const startTotal = endNow - days * 86400;
  const chunks: Array<{ since: number; until: number }> = [];
  for (let s = startTotal; s < endNow; s += CHUNK_DAYS * 86400) {
    chunks.push({
      since: s,
      until: Math.min(s + CHUNK_DAYS * 86400, endNow),
    });
  }

  for (const { since, until } of chunks) {
    // 1. follower_count — time series (sem metric_type)
    const r1 = await metaGraph.get<{ data?: InsightValueObj[] }>(
      token,
      `${account.ig_user_id}/insights`,
      { metric: "follower_count", period: "day", since, until },
    );
    mergeResponse(r1, (row, name, value) => {
      if (name === "follower_count") row.followers_count = value;
    });

    // 2. reach + profile_views (requerem total_value em v18+)
    const r2 = await metaGraph.get<{ data?: InsightValueObj[] }>(
      token,
      `${account.ig_user_id}/insights`,
      {
        metric: "reach,profile_views",
        period: "day",
        since,
        until,
        metric_type: "total_value",
      },
    );
    mergeResponse(r2, (row, name, value) => {
      if (name === "reach") row.reach = value;
      else if (name === "profile_views") row.profile_views = value;
    });
  }

  // 3. Persistir
  let synced = 0;
  for (const [date, row] of byDate) {
    try {
      upsertDailyInsight({ account_id: account.id, date, ...row });
      synced++;
    } catch (err) {
      errors.push(`upsert ${date}: ${err instanceof Error ? err.message : "?"}`);
    }
  }

  return { synced, errors };
}

// ----------------------------------------------------------------------------

/** Snapshot atual: foto + followers_count + media_count. */
export async function syncAccountSnapshot(
  token: string,
  account: SocialAccountRow,
): Promise<{ ok: boolean; error?: string }> {
  if (!account.ig_user_id) return { ok: false, error: "no_ig_user_id" };

  const r = await metaGraph.get<{
    followers_count?: number;
    media_count?: number;
    profile_picture_url?: string;
  }>(token, account.ig_user_id, {
    fields: "followers_count,media_count,profile_picture_url",
  });
  if (!r.ok) return { ok: false, error: r.error };

  updateSocialAccountSnapshot(account.id, {
    followers_count: r.json.followers_count,
    media_count: r.json.media_count,
    profile_picture_url: r.json.profile_picture_url,
    last_sync_at: new Date().toISOString(),
  });
  return { ok: true };
}

// ----------------------------------------------------------------------------

/** Demografia (audience_gender_age, audience_city, audience_country). */
export async function syncAudience(
  token: string,
  account: SocialAccountRow,
): Promise<{ ok: boolean; error?: string }> {
  if (!account.ig_user_id) return { ok: false, error: "no_ig_user_id" };

  // IG Audience demographics — endpoint /insights com metric=engaged_audience_demographics
  // ou audience_demographics (depending on version). Usamos `audience_*` legacy
  // que ainda funciona em v21.
  const dimensions = [
    { metric: "audience_gender_age", dim: "gender_age" },
    { metric: "audience_city", dim: "city" },
    { metric: "audience_country", dim: "country" },
  ];

  for (const d of dimensions) {
    const r = await metaGraph.get<{ data?: Array<{ values?: Array<{ value?: Record<string, number> }> }> }>(
      token,
      `${account.ig_user_id}/insights`,
      { metric: d.metric, period: "lifetime" },
    );
    if (!r.ok) continue;
    const buckets = r.json.data?.[0]?.values?.[0]?.value ?? {};
    for (const [bucket, value] of Object.entries(buckets)) {
      try {
        upsertAudienceSlice(account.id, d.dim, bucket, value as number);
      } catch {
        // ignora bucket isolado
      }
    }
  }

  return { ok: true };
}
