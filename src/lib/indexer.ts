import "server-only";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import { localeToDomain, type Locale } from "@/lib/i18n";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

export interface IndexNowResult {
  ok: boolean;
  hosts: { host: string; urls: number; ok: boolean; status?: number; error?: string }[];
  error?: string;
}

export function getIndexNowKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.indexnowKey);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  const fromEnv = process.env.INDEXNOW_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return null;
}

export function getIndexNowKeySource(): "db" | "env" | "none" {
  const fromDb = getSetting(SETTINGS_KEYS.indexnowKey);
  if (fromDb && fromDb.trim()) return "db";
  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) return "env";
  return "none";
}

export function generateIndexNowKey(): string {
  // IndexNow exige: 8-128 chars, [a-z A-Z 0-9 -]. 32 bytes hex = 64 chars.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constrói as URLs públicas de um post para cada locale onde existe tradução.
 * Cada locale tem domínio próprio (ver i18n.ts).
 */
export function buildPostUrls(slug: string, availableLocales: Locale[]): string[] {
  return availableLocales.map((loc) => {
    const domain = localeToDomain[loc];
    return `https://${domain}/blog/${slug}`;
  });
}

/**
 * Agrupa URLs por host. IndexNow exige um POST por host.
 */
function groupByHost(urls: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const url of urls) {
    try {
      const host = new URL(url).host;
      const arr = map.get(host) ?? [];
      arr.push(url);
      map.set(host, arr);
    } catch {
      // url inválida — skip
    }
  }
  return map;
}

/**
 * Submete uma lista de URLs ao IndexNow. Agrupa por host e faz 1 POST por host.
 * O `keyLocation` aponta para um endpoint do próprio host que retorna a key.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = getIndexNowKey();
  if (!key) {
    return {
      ok: false,
      hosts: [],
      error: "INDEXNOW_KEY não configurada. Gere em /admin/settings.",
    };
  }
  if (urls.length === 0) {
    return { ok: false, hosts: [], error: "Nenhuma URL para indexar." };
  }

  const grouped = groupByHost(urls);
  const hostResults: IndexNowResult["hosts"] = [];

  for (const [host, hostUrls] of grouped) {
    // keyLocation precisa estar no root pra IndexNow autorizar URLs em
    // qualquer path. Rewrite /key.txt → /api/indexnow/key resolve isso.
    const body = {
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: hostUrls,
    };
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // IndexNow: 200/202 = sucesso, 422 = key/host mismatch, 403 = key file não acessível
      const ok = res.status === 200 || res.status === 202;
      hostResults.push({
        host,
        urls: hostUrls.length,
        ok,
        status: res.status,
        error: ok ? undefined : await res.text().catch(() => `HTTP ${res.status}`),
      });
    } catch (err) {
      hostResults.push({
        host,
        urls: hostUrls.length,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = hostResults.every((h) => h.ok);
  return { ok: allOk, hosts: hostResults };
}
