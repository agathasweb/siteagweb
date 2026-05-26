import "server-only";
import { metaGraph } from "./client";

/**
 * Publicação no Instagram via Graph API.
 *
 * Todos os tipos seguem o mesmo padrão de 2 passos:
 *  1. Cria um "container" (POST /{ig_user_id}/media) — retorna creation_id
 *  2. Publica o container (POST /{ig_user_id}/media_publish) — retorna media_id
 *
 * Para vídeo/reel há uma 3ª etapa entre 1 e 2: o vídeo precisa ser processado
 * pela Meta (status FINISHED) antes de publicar — fazemos polling.
 *
 * Carousel: cria N containers individuais → 1 container "CAROUSEL" pai → publish.
 *
 * Documentação:
 *  - https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
 *  - https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

export interface PublishResult {
  ok: boolean;
  ig_media_id?: string;
  permalink?: string;
  error?: string;
}

const VIDEO_POLL_MAX_ATTEMPTS = 30; // 30 × 5s = 2.5min máx
const VIDEO_POLL_INTERVAL_MS = 5000;

// ============================================================================
// 1. FEED — IMAGEM (single)
// ============================================================================

export async function publishInstagramImage(
  token: string,
  igUserId: string,
  imageUrl: string,
  caption: string,
  locationId?: string,
): Promise<PublishResult> {
  // Step 1: criar container
  const containerBody: Record<string, string> = { image_url: imageUrl, caption };
  if (locationId) containerBody.location_id = locationId;
  const created = await metaGraph.post<{ id?: string }>(
    token,
    `${igUserId}/media`,
    containerBody,
  );
  if (!created.ok || !created.json.id) {
    return { ok: false, error: created.error ?? "container_creation_failed" };
  }

  // Step 2: pequeno delay pra Meta indexar
  await sleep(5000);

  // Step 3: publicar
  return publishContainer(token, igUserId, created.json.id);
}

// ============================================================================
// 2. FEED — VÍDEO
// ============================================================================

export async function publishInstagramVideo(
  token: string,
  igUserId: string,
  videoUrl: string,
  caption: string,
  thumbnailUrl?: string,
): Promise<PublishResult> {
  const body: Record<string, string> = {
    media_type: "VIDEO",
    video_url: videoUrl,
    caption,
  };
  if (thumbnailUrl) body.thumb_offset = "0"; // se quiser cover custom usa thumbnail_url no IG mas só Reels suporta — vídeo de feed usa thumb_offset

  const created = await metaGraph.post<{ id?: string }>(
    token,
    `${igUserId}/media`,
    body,
  );
  if (!created.ok || !created.json.id) {
    return { ok: false, error: created.error ?? "video_container_failed" };
  }

  // Aguarda processamento
  const ready = await waitVideoReady(token, created.json.id);
  if (!ready.ok) return ready;

  return publishContainer(token, igUserId, created.json.id);
}

// ============================================================================
// 3. REEL
// ============================================================================

export async function publishInstagramReel(
  token: string,
  igUserId: string,
  videoUrl: string,
  caption: string,
  options: { coverUrl?: string; shareToFeed?: boolean } = {},
): Promise<PublishResult> {
  const body: Record<string, string | boolean> = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: options.shareToFeed ?? true,
  };
  if (options.coverUrl) body.cover_url = options.coverUrl;

  const created = await metaGraph.post<{ id?: string }>(
    token,
    `${igUserId}/media`,
    body,
  );
  if (!created.ok || !created.json.id) {
    return { ok: false, error: created.error ?? "reel_container_failed" };
  }

  const ready = await waitVideoReady(token, created.json.id);
  if (!ready.ok) return ready;

  return publishContainer(token, igUserId, created.json.id);
}

// ============================================================================
// 4. STORY (imagem ou vídeo)
// ============================================================================

export async function publishInstagramStory(
  token: string,
  igUserId: string,
  mediaUrl: string,
  mediaKind: "image" | "video",
): Promise<PublishResult> {
  const body: Record<string, string> = {
    media_type: "STORIES",
  };
  if (mediaKind === "image") {
    body.image_url = mediaUrl;
  } else {
    body.video_url = mediaUrl;
  }

  const created = await metaGraph.post<{ id?: string }>(
    token,
    `${igUserId}/media`,
    body,
  );
  if (!created.ok || !created.json.id) {
    return { ok: false, error: created.error ?? "story_container_failed" };
  }

  if (mediaKind === "video") {
    const ready = await waitVideoReady(token, created.json.id);
    if (!ready.ok) return ready;
  } else {
    await sleep(3000);
  }

  return publishContainer(token, igUserId, created.json.id);
}

// ============================================================================
// 5. CAROUSEL (até 10 itens — fotos e/ou vídeos misturados)
// ============================================================================

export interface CarouselItem {
  kind: "image" | "video";
  url: string;
}

export async function publishInstagramCarousel(
  token: string,
  igUserId: string,
  items: CarouselItem[],
  caption: string,
): Promise<PublishResult> {
  if (items.length < 2 || items.length > 10) {
    return { ok: false, error: "carousel_items_out_of_range" };
  }

  // Step 1: cria container pra cada item (com is_carousel_item=true)
  const childIds: string[] = [];
  for (const item of items) {
    const body: Record<string, string | boolean> = { is_carousel_item: true };
    if (item.kind === "image") {
      body.image_url = item.url;
    } else {
      body.media_type = "VIDEO";
      body.video_url = item.url;
    }
    const r = await metaGraph.post<{ id?: string }>(
      token,
      `${igUserId}/media`,
      body,
    );
    if (!r.ok || !r.json.id) {
      return { ok: false, error: `child_container_failed: ${r.error ?? "unknown"}` };
    }
    if (item.kind === "video") {
      const ready = await waitVideoReady(token, r.json.id);
      if (!ready.ok) return ready;
    }
    childIds.push(r.json.id);
  }

  await sleep(3000);

  // Step 2: cria container pai do carousel
  const parent = await metaGraph.post<{ id?: string }>(token, `${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
  });
  if (!parent.ok || !parent.json.id) {
    return { ok: false, error: parent.error ?? "carousel_parent_failed" };
  }

  await sleep(3000);

  // Step 3: publica
  return publishContainer(token, igUserId, parent.json.id);
}

// ============================================================================
// Internals
// ============================================================================

async function publishContainer(
  token: string,
  igUserId: string,
  creationId: string,
): Promise<PublishResult> {
  const r = await metaGraph.post<{ id?: string }>(
    token,
    `${igUserId}/media_publish`,
    { creation_id: creationId },
  );
  if (!r.ok || !r.json.id) {
    return { ok: false, error: r.error ?? "publish_failed" };
  }
  const mediaId = r.json.id;
  // Busca permalink (pode levar uns segundos pra ser indexado)
  const detail = await metaGraph.get<{ permalink?: string }>(
    token,
    `${mediaId}`,
    { fields: "permalink" },
  );
  return {
    ok: true,
    ig_media_id: mediaId,
    permalink: detail.json.permalink,
  };
}

/**
 * Aguarda vídeo/reel processar até `status_code = FINISHED`.
 * Aborta em IN_PROGRESS → ERROR ou após VIDEO_POLL_MAX_ATTEMPTS×INTERVAL.
 */
async function waitVideoReady(token: string, containerId: string): Promise<PublishResult> {
  for (let i = 0; i < VIDEO_POLL_MAX_ATTEMPTS; i++) {
    await sleep(VIDEO_POLL_INTERVAL_MS);
    const r = await metaGraph.get<{ status_code?: string; status?: string }>(
      token,
      containerId,
      { fields: "status_code,status" },
    );
    const code = r.json.status_code;
    if (code === "FINISHED") return { ok: true };
    if (code === "ERROR" || code === "EXPIRED") {
      return {
        ok: false,
        error: `video_processing_${code.toLowerCase()}: ${r.json.status ?? ""}`,
      };
    }
  }
  return { ok: false, error: "video_processing_timeout" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
