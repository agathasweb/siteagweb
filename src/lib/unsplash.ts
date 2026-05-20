import "server-only";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";

const SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";

export interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  thumb_url: string;
  preview_url: string;
  download_url: string;
  width: number;
  height: number;
  color: string;
  photographer: {
    name: string;
    username: string;
    profile_url: string;
  };
  html_url: string;
  /** URL para hit do download tracker — Unsplash exige por TOS. */
  download_location: string;
}

export interface UnsplashSearchResult {
  ok: boolean;
  photos?: UnsplashPhoto[];
  total?: number;
  error?: string;
}

export interface UnsplashStatus {
  configured: boolean;
  source: "db" | "env" | "none";
  reachable?: boolean;
  error?: string;
}

function getAccessKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.unsplashAccessKey);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  const fromEnv = process.env.UNSPLASH_ACCESS_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return null;
}

function getKeySource(): "db" | "env" | "none" {
  const fromDb = getSetting(SETTINGS_KEYS.unsplashAccessKey);
  if (fromDb && fromDb.trim()) return "db";
  const fromEnv = process.env.UNSPLASH_ACCESS_KEY;
  if (fromEnv && fromEnv.trim()) return "env";
  return "none";
}

interface UnsplashApiPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  color: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
    raw: string;
  };
  links: {
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashApiPhoto[];
  errors?: string[];
}

function mapPhoto(p: UnsplashApiPhoto): UnsplashPhoto {
  return {
    id: p.id,
    description: p.description,
    alt_description: p.alt_description,
    thumb_url: p.urls.small,
    preview_url: p.urls.regular,
    // raw + ?w=1600 entrega exatamente o que precisamos pra processar via sharp
    download_url: `${p.urls.raw}&w=1600&fm=jpg&q=85`,
    width: p.width,
    height: p.height,
    color: p.color,
    photographer: {
      name: p.user.name,
      username: p.user.username,
      profile_url: `${p.user.links.html}?utm_source=agathas-web&utm_medium=referral`,
    },
    html_url: `${p.links.html}?utm_source=agathas-web&utm_medium=referral`,
    download_location: p.links.download_location,
  };
}

export async function searchUnsplash(
  query: string,
  perPage = 12,
): Promise<UnsplashSearchResult> {
  const key = getAccessKey();
  if (!key) {
    return {
      ok: false,
      error: "UNSPLASH_ACCESS_KEY não configurada. Adicione em /admin/settings.",
    };
  }
  const q = query.trim();
  if (!q) return { ok: false, error: "Query vazia." };

  const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=landscape`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        error: `Unsplash API ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as UnsplashSearchResponse;
    return {
      ok: true,
      photos: data.results.map(mapPhoto),
      total: data.total,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido.",
    };
  }
}

/**
 * Hit no endpoint download_location — Unsplash exige por TOS. Best-effort,
 * não bloqueia a pick se falhar.
 */
export async function trackDownload(downloadLocation: string): Promise<void> {
  const key = getAccessKey();
  if (!key) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    });
  } catch {
    // best-effort
  }
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function checkUnsplash(): Promise<UnsplashStatus> {
  const source = getKeySource();
  if (source === "none") return { configured: false, source };
  try {
    const res = await fetch(`${SEARCH_ENDPOINT}?query=test&per_page=1`, {
      headers: { Authorization: `Client-ID ${getAccessKey()!}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        configured: true,
        source,
        reachable: false,
        error: `${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { configured: true, source, reachable: true };
  } catch (err) {
    return {
      configured: true,
      source,
      reachable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
