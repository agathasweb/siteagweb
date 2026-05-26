import "server-only";

/**
 * Cliente da Meta Graph API com rate limit adaptativo.
 *
 * Inspirado no MetaApiClient.php do yeshua-dev (Laravel) — port enxuto pra
 * Next.js. Funcionalidades:
 *
 *  - Monitora headers `x-business-use-case-usage` e `x-app-usage` da Meta
 *  - Throttle preventivo quando o uso passa de 75% (espera 5s)
 *  - Retry automático em HTTP 429 com backoff exponencial (até 3x)
 *  - Timeout de 60s por request, com retry em timeout de rede
 *
 * Uso:
 *   const r = await metaGraph.get(token, `${igUserId}/media`, { fields, limit });
 *   if (!r.ok) throw new Error(r.error);
 *   const data = r.json.data;
 */

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

const THROTTLE_THRESHOLD = 75;
const MAX_RETRIES = 3;
const MIN_BACKOFF_SECONDS = 2;
const REQUEST_TIMEOUT_MS = 60_000;

export interface MetaGraphResult<T = unknown> {
  ok: boolean;
  status: number;
  json: T;
  error?: string;
  fbtrace_id?: string;
}

interface UsageHeader {
  call_count?: number;
  total_cputime?: number;
  total_time?: number;
}

class MetaGraphClient {
  private lastThrottleAt = 0;

  /** GET na Graph API. Aceita endpoint relativo OU URL absoluta (pagination). */
  async get<T = unknown>(
    token: string,
    endpoint: string,
    params: Record<string, string | number> = {},
  ): Promise<MetaGraphResult<T>> {
    const url = endpoint.startsWith("https://")
      ? endpoint
      : `${META_GRAPH_BASE}/${endpoint.replace(/^\//, "")}`;
    return this.request<T>(token, url, "GET", params, null);
  }

  /** POST na Graph API (publicação, comentários, etc.). */
  async post<T = unknown>(
    token: string,
    endpoint: string,
    body: Record<string, string | number | boolean>,
  ): Promise<MetaGraphResult<T>> {
    const url = endpoint.startsWith("https://")
      ? endpoint
      : `${META_GRAPH_BASE}/${endpoint.replace(/^\//, "")}`;
    return this.request<T>(token, url, "POST", {}, body);
  }

  private async request<T>(
    token: string,
    url: string,
    method: "GET" | "POST",
    params: Record<string, string | number>,
    body: Record<string, string | number | boolean> | null,
  ): Promise<MetaGraphResult<T>> {
    await this.throttleIfNeeded();

    let attempt = 0;
    while (true) {
      try {
        const ctl = new AbortController();
        const tid = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);

        const fullUrl = new URL(url);
        // Append params (não duplicar se já vieram no URL de pagination)
        for (const [k, v] of Object.entries(params)) {
          if (!fullUrl.searchParams.has(k)) fullUrl.searchParams.set(k, String(v));
        }
        // Token sempre via header pra não logar em access logs do servidor.
        const init: RequestInit = {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: ctl.signal,
          cache: "no-store",
        };
        if (method === "POST" && body) {
          init.body = JSON.stringify(body);
        }

        const res = await fetch(fullUrl.toString(), init);
        clearTimeout(tid);

        // Headers de rate limit — sinaliza throttle preventivo no próximo call.
        this.parseRateLimitHeaders(res.headers);

        if (res.status === 429) {
          attempt++;
          if (attempt >= MAX_RETRIES) {
            const json = (await res.json().catch(() => ({}))) as T;
            return { ok: false, status: 429, json, error: "rate_limit_exhausted" };
          }
          const wait = Math.max(MIN_BACKOFF_SECONDS * Math.pow(2, attempt - 1), 2);
          console.warn(`[meta-graph] 429 — retry em ${wait}s (tentativa ${attempt}/${MAX_RETRIES})`);
          await sleep(wait * 1000);
          continue;
        }

        const json = (await res.json().catch(() => ({}))) as T & {
          error?: { message?: string };
          fbtrace_id?: string;
        };

        const err = (json as { error?: { message?: string } }).error?.message;
        return {
          ok: res.ok && !err,
          status: res.status,
          json,
          error: err,
          fbtrace_id: (json as { fbtrace_id?: string }).fbtrace_id,
        };
      } catch (err) {
        // Timeout ou erro de rede — retry com backoff.
        attempt++;
        if (attempt >= MAX_RETRIES) {
          const msg = err instanceof Error ? err.message : "fetch_failed";
          return {
            ok: false,
            status: 0,
            json: {} as T,
            error: msg,
          };
        }
        const wait = Math.min(5 * attempt, 30);
        console.warn(`[meta-graph] timeout/erro — retry em ${wait}s (tentativa ${attempt}/${MAX_RETRIES})`);
        await sleep(wait * 1000);
      }
    }
  }

  private parseRateLimitHeaders(headers: Headers): void {
    // x-app-usage — uso global do app
    try {
      const appUsage = headers.get("x-app-usage");
      if (appUsage) {
        const parsed = JSON.parse(appUsage) as UsageHeader;
        const max = Math.max(
          parsed.call_count ?? 0,
          parsed.total_cputime ?? 0,
          parsed.total_time ?? 0,
        );
        if (max >= THROTTLE_THRESHOLD) this.lastThrottleAt = Date.now();
      }
    } catch {
      // ignore
    }
    // x-business-use-case-usage — uso por business id (ads/insights)
    try {
      const bizUsage = headers.get("x-business-use-case-usage");
      if (bizUsage) {
        const parsed = JSON.parse(bizUsage) as Record<string, UsageHeader[]>;
        for (const arr of Object.values(parsed)) {
          for (const item of arr) {
            const max = Math.max(
              item.call_count ?? 0,
              item.total_cputime ?? 0,
              item.total_time ?? 0,
            );
            if (max >= THROTTLE_THRESHOLD) this.lastThrottleAt = Date.now();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private async throttleIfNeeded(): Promise<void> {
    if (!this.lastThrottleAt) return;
    const sinceMs = Date.now() - this.lastThrottleAt;
    if (sinceMs < 5000) {
      const wait = 5000 - sinceMs;
      console.warn(`[meta-graph] throttle preventivo: dormindo ${wait}ms`);
      await sleep(wait);
    }
    this.lastThrottleAt = 0;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Singleton — uma instância por processo Node.
declare global {
  // eslint-disable-next-line no-var
  var __metaGraphClient: MetaGraphClient | undefined;
}

export const metaGraph: MetaGraphClient =
  globalThis.__metaGraphClient ?? new MetaGraphClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__metaGraphClient = metaGraph;
}

export function getSocialAccessToken(): string {
  return process.env.META_SOCIAL_ACCESS_TOKEN?.trim() || "";
}
