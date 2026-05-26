import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Ads — folha da hierarquia (Campaign → AdSet → Ad).
 *
 * 2 caminhos suportados:
 *  A) BOOST de post existente do feed IG/FB — passa `object_story_id`
 *     (formato `<page_id>_<post_id>`) ou `instagram_actor_id` + `effective_authorization_category`
 *     (campanha vira "boost post" 1-clique).
 *  B) CRIATIVO NOVO — sobe imagem via /act_xxx/adimages → recebe hash →
 *     monta `object_story_spec` com link_data { image_hash, link, message, ... }.
 *
 * Pro MVP cobrimos os 2 caminhos.
 */

export interface CreateAdInput {
  ad_account_id: string;
  adset_id: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  /** Caminho A: boost. Formato: <page_id>_<post_id> */
  object_story_id?: string;
  /** Caminho B: creative novo */
  creative?: {
    page_id: string;            // FB page id (sempre obrigatório no Ads)
    instagram_actor_id?: string; // IG user id (pra mostrar @username)
    image_hash?: string;         // hash retornado por uploadAdImage
    video_id?: string;           // hash retornado por uploadAdVideo
    link: string;                // URL destino (com UTMs!)
    message: string;             // texto principal
    name?: string;               // título (40 chars)
    description?: string;        // descrição (30 chars)
    call_to_action?: { type: string; value?: { link?: string } };
  };
}

export type CallToActionType =
  | "LEARN_MORE"
  | "SHOP_NOW"
  | "SIGN_UP"
  | "SUBSCRIBE"
  | "GET_OFFER"
  | "CONTACT_US"
  | "BOOK_TRAVEL"
  | "DOWNLOAD"
  | "WHATSAPP_MESSAGE"
  | "SEND_MESSAGE"
  | "APPLY_NOW";

export interface AdCreated {
  ok: boolean;
  id?: string;
  error?: string;
  fbtrace_id?: string;
}

export async function createAd(input: CreateAdInput): Promise<AdCreated> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };

  let creative_id: string | null = null;

  // Cria o creative primeiro (ambos caminhos)
  if (input.object_story_id) {
    // Caminho A: boost — basta passar object_story_id no creative
    const cr = await metaGraph.post<{ id?: string }>(
      token,
      `${input.ad_account_id}/adcreatives`,
      {
        name: `${input.name} - creative`,
        object_story_id: input.object_story_id,
      },
    );
    if (!cr.ok || !cr.json.id) return { ok: false, error: cr.error ?? "creative_boost_failed" };
    creative_id = cr.json.id;
  } else if (input.creative) {
    const link_data: Record<string, unknown> = {
      link: input.creative.link,
      message: input.creative.message,
    };
    if (input.creative.name) link_data.name = input.creative.name;
    if (input.creative.description) link_data.description = input.creative.description;
    if (input.creative.image_hash) link_data.image_hash = input.creative.image_hash;
    if (input.creative.call_to_action) link_data.call_to_action = input.creative.call_to_action;

    const object_story_spec: Record<string, unknown> = {
      page_id: input.creative.page_id,
    };
    if (input.creative.instagram_actor_id) {
      object_story_spec.instagram_actor_id = input.creative.instagram_actor_id;
    }
    if (input.creative.video_id) {
      object_story_spec.video_data = {
        video_id: input.creative.video_id,
        message: input.creative.message,
        call_to_action: input.creative.call_to_action,
      };
    } else {
      object_story_spec.link_data = link_data;
    }

    const cr = await metaGraph.post<{ id?: string }>(
      token,
      `${input.ad_account_id}/adcreatives`,
      {
        name: `${input.name} - creative`,
        object_story_spec: JSON.stringify(object_story_spec),
      },
    );
    if (!cr.ok || !cr.json.id) return { ok: false, error: cr.error ?? "creative_new_failed", fbtrace_id: cr.fbtrace_id };
    creative_id = cr.json.id;
  } else {
    return { ok: false, error: "missing_creative_or_boost" };
  }

  // Cria o Ad referenciando o creative
  const r = await metaGraph.post<{ id?: string }>(
    token,
    `${input.ad_account_id}/ads`,
    {
      name: input.name,
      adset_id: input.adset_id,
      creative: JSON.stringify({ creative_id }),
      status: input.status,
    },
  );
  if (!r.ok || !r.json.id) return { ok: false, error: r.error ?? "ad_create_failed", fbtrace_id: r.fbtrace_id };
  return { ok: true, id: r.json.id, fbtrace_id: r.fbtrace_id };
}

/**
 * Upload de imagem pra biblioteca de ad images da conta.
 * Recebe URL absoluta (pública) — Meta faz fetch da imagem.
 *
 * Retorna o `hash` que é referenciado no creative (image_hash).
 */
export async function uploadAdImage(
  ad_account_id: string,
  publicImageUrl: string,
): Promise<{ ok: boolean; hash?: string; error?: string }> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };

  // Meta Ad Images suporta upload via URL com filename + url no body multipart.
  // Mais simples: POST com `url` (Meta busca a imagem).
  const r = await metaGraph.post<{ images?: Record<string, { hash: string }> }>(
    token,
    `${ad_account_id}/adimages`,
    { url: publicImageUrl },
  );
  if (!r.ok) return { ok: false, error: r.error };
  const images = r.json.images ?? {};
  const first = Object.values(images)[0];
  if (!first?.hash) return { ok: false, error: "no_hash_returned" };
  return { ok: true, hash: first.hash };
}

/**
 * Alternativa: upload de imagem local em `public/uploads/...` lendo o arquivo.
 * Útil quando a Meta não consegue fazer fetch (ex: behind auth).
 */
export async function uploadAdImageFromPath(
  ad_account_id: string,
  relativePath: string, // ex.: /uploads/social/2026-05/abc.jpg
): Promise<{ ok: boolean; hash?: string; error?: string }> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };

  const absPath = join(process.cwd(), "public", relativePath.replace(/^\//, ""));
  let bytes: Buffer;
  try {
    bytes = readFileSync(absPath);
  } catch {
    return { ok: false, error: "file_not_found" };
  }

  const fd = new FormData();
  fd.append("filename", new Blob([new Uint8Array(bytes)]), relativePath.split("/").pop() ?? "image.jpg");
  fd.append("access_token", token);

  const res = await fetch(`https://graph.facebook.com/v21.0/${ad_account_id}/adimages`, {
    method: "POST",
    body: fd,
  });
  const json = (await res.json().catch(() => ({}))) as {
    images?: Record<string, { hash: string }>;
    error?: { message?: string };
  };
  if (!res.ok || json.error) {
    return { ok: false, error: json.error?.message ?? `http_${res.status}` };
  }
  const first = Object.values(json.images ?? {})[0];
  if (!first?.hash) return { ok: false, error: "no_hash_returned" };
  return { ok: true, hash: first.hash };
}

/** Lista posts orgânicos do feed do IG da conta (pra opção de boost). */
export async function listBoostableIgPosts(
  ig_user_id: string,
  limit = 20,
): Promise<Array<{ id: string; caption?: string; media_type?: string; permalink?: string; thumbnail_url?: string; timestamp?: string }>> {
  const token = getSocialAccessToken();
  if (!token) return [];
  const r = await metaGraph.get<{ data?: Array<{ id: string; caption?: string; media_type?: string; permalink?: string; thumbnail_url?: string; media_url?: string; timestamp?: string }> }>(
    token,
    `${ig_user_id}/media`,
    {
      fields: "id,caption,media_type,permalink,thumbnail_url,media_url,timestamp",
      limit,
    },
  );
  if (!r.ok) return [];
  return (r.json.data ?? []).map((m) => ({
    id: m.id,
    caption: m.caption,
    media_type: m.media_type,
    permalink: m.permalink,
    thumbnail_url: m.thumbnail_url ?? m.media_url,
    timestamp: m.timestamp,
  }));
}

/**
 * Para boost de IG post, Meta usa um sistema diferente do FB post — o ad
 * precisa de `instagram_permalink_url` OU usar Branded Content / dark posts.
 * O caminho mais simples + universal é: criar dark post no FB Page com o
 * mesmo conteúdo e bootar — mas mantemos o boost direto de IG via
 * `instagram_actor_id` + creative_source=POST.
 *
 * Esse helper pega o ID interno do IG post pra usar em creative.
 */
export function igPermalinkToActor(permalink: string): string | null {
  // permalink format: https://www.instagram.com/p/<shortcode>/ — não tem o id direto.
  // Quem usa esse permalink no creative? object_story_spec.instagram_actor_id +
  // o media_id direto via id retornado pela query. O caller passa o ig_media_id.
  if (!permalink) return null;
  return permalink;
}
