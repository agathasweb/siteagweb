import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";
import { metaGraph } from "./client";
import {
  upsertPublishedPost,
  listPostsNeedingThumbnailCache,
  updatePublishedThumbnailLocal,
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

  // Limites reais da Meta Graph API v21:
  //  - follower_count: SÓ últimos 30 dias (excluindo hoje) — chamada única
  //  - reach + profile_views: até 2 anos de histórico, MAS limite de 30 dias
  //    por chamada — fazemos chunks
  const CHUNK_SECONDS = 30 * 86400;
  const endNow = Math.floor(Date.now() / 1000);

  // 1. follower_count — chamada única dos últimos 30 dias (excluindo hoje)
  {
    const since = endNow - 30 * 86400;
    const until = endNow - 86400; // exclui o dia de hoje
    const r1 = await metaGraph.get<{ data?: InsightValueObj[] }>(
      token,
      `${account.ig_user_id}/insights`,
      { metric: "follower_count", period: "day", since, until },
    );
    mergeResponse(r1, (row, name, value) => {
      if (name === "follower_count") row.followers_count = value;
    });
  }

  // 2. reach diário — aceita metric_type=time_series, retorna values[] por dia
  // 3. profile_views — SÓ aceita total_value (incompatível com time_series).
  //    Pra ter série diária precisaríamos 1 chamada por dia (caro em rate limit).
  //    Solução: total agregado por chunk de 30d, distribuído uniformemente.
  const startTotal = endNow - days * 86400;
  for (let s = startTotal; s < endNow; s += CHUNK_SECONDS) {
    const since = s;
    const until = Math.min(s + CHUNK_SECONDS, endNow);

    // reach — time_series
    const rReach = await metaGraph.get<{ data?: InsightValueObj[] }>(
      token,
      `${account.ig_user_id}/insights`,
      { metric: "reach", period: "day", since, until, metric_type: "time_series" },
    );
    mergeResponse(rReach, (row, name, value) => {
      if (name === "reach") row.reach = value;
    });

    // profile_views — total_value (chunk de até 30d)
    interface PvResp { data?: Array<{ name: string; total_value?: { value?: number } }> }
    const rPv = await metaGraph.get<PvResp>(
      token,
      `${account.ig_user_id}/insights`,
      { metric: "profile_views", period: "day", since, until, metric_type: "total_value" },
    );
    if (rPv.ok) {
      for (const m of rPv.json.data ?? []) {
        if (m.name !== "profile_views") continue;
        const total = m.total_value?.value ?? 0;
        if (total <= 0) continue;
        // Distribui o total uniformemente nos dias do chunk pra ter série diária aproximada
        const chunkDays = Math.max(1, Math.round((until - since) / 86400));
        const perDay = total / chunkDays;
        for (let i = 0; i < chunkDays; i++) {
          const dayTs = since + i * 86400;
          const date = new Date(dayTs * 1000).toISOString().slice(0, 10);
          const row = byDate.get(date) ?? {};
          row.profile_views = (row.profile_views ?? 0) + perDay;
          byDate.set(date, row);
        }
      }
    } else {
      errors.push(`profile_views: ${rPv.error}`);
    }
  }

  // 4. Persistir (arredonda profile_views que pode ter casa decimal pela distribuição)
  let synced = 0;
  for (const [date, row] of byDate) {
    try {
      upsertDailyInsight({
        account_id: account.id,
        date,
        ...row,
        profile_views: row.profile_views !== undefined ? Math.round(row.profile_views) : undefined,
      });
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

/**
 * Demografia da audiência (Meta Graph v21+).
 *
 * `audience_gender_age` foi deprecada em v18. Substituída por
 * `follower_demographics` com breakdown por dimensão (age, gender, city, country).
 *
 * Resposta tem este formato (v21):
 *   {
 *     "data": [{
 *       "total_value": {
 *         "breakdowns": [{
 *           "dimension_keys": ["age"],
 *           "results": [
 *             {"dimension_values": ["18-24"], "value": 301},
 *             ...
 *           ]
 *         }]
 *       }
 *     }]
 *   }
 */
export async function syncAudience(
  token: string,
  account: SocialAccountRow,
): Promise<{ ok: boolean; error?: string }> {
  if (!account.ig_user_id) return { ok: false, error: "no_ig_user_id" };

  interface AudienceResp {
    data?: Array<{
      total_value?: {
        breakdowns?: Array<{
          dimension_keys?: string[];
          results?: Array<{ dimension_values?: string[]; value?: number }>;
        }>;
      };
    }>;
  }

  const dimensions = ["age", "gender", "city", "country"] as const;
  const errors: string[] = [];

  for (const dim of dimensions) {
    const r = await metaGraph.get<AudienceResp>(
      token,
      `${account.ig_user_id}/insights`,
      {
        metric: "follower_demographics",
        period: "lifetime",
        breakdown: dim,
        metric_type: "total_value",
      },
    );
    if (!r.ok) {
      errors.push(`${dim}: ${r.error}`);
      continue;
    }
    const results = r.json.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    for (const item of results) {
      const bucket = item.dimension_values?.[0];
      const value = item.value ?? 0;
      if (!bucket || value <= 0) continue;
      try {
        upsertAudienceSlice(account.id, dim, bucket, value);
      } catch {
        // ignora bucket isolado
      }
    }
  }

  return {
    ok: errors.length < dimensions.length,
    error: errors.length ? errors.join("; ") : undefined,
  };
}

/**
 * Baixa thumbnails dos posts publicados pra cache local.
 *
 * URLs do Meta CDN (scontent.cdninstagram.com) são signed e expiram em
 * algumas horas. Pra os PDFs renderem com imagens, salvamos uma cópia em
 * public/uploads/social-thumbs/{provider}/{external_id}.jpg.
 *
 * Idempotente: pula posts que já têm thumbnail_local.
 */
export async function cacheThumbnails(limit = 50): Promise<{
  cached: number;
  errors: number;
}> {
  const posts = listPostsNeedingThumbnailCache(limit);
  let cached = 0;
  let errorCount = 0;
  const baseDir = join(process.cwd(), "public", "uploads", "social-thumbs");
  await mkdir(baseDir, { recursive: true });

  for (const p of posts) {
    if (!p.thumbnail_url) continue;
    try {
      const res = await fetch(p.thumbnail_url, { cache: "no-store" });
      if (!res.ok) {
        errorCount++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // hash do external_id pra evitar caminhos com chars especiais
      const safeId = crypto
        .createHash("sha1")
        .update(p.external_id)
        .digest("hex")
        .slice(0, 16);
      const ext = ".jpg"; // Meta CDN sempre serve JPG
      const filename = `${safeId}${ext}`;
      const filepath = join(baseDir, filename);
      await writeFile(filepath, buf);
      const publicPath = `/uploads/social-thumbs/${filename}`;
      updatePublishedThumbnailLocal(p.external_id, publicPath);
      cached++;
    } catch (err) {
      errorCount++;
      console.error(`[cacheThumbnails] ${p.external_id}:`, err instanceof Error ? err.message : err);
    }
  }
  return { cached, errors: errorCount };
}
