import "server-only";
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Inspeção de URL do Google Search Console — o estado REAL do post no Google.
 *
 * O botão antigo do admin ("Indexar") só avisava o IndexNow (Bing/Yandex…) e o hub WebSub
 * do feed, e marcava o post como "indexado" — o que não dizia nada sobre o Google. Esta
 * consulta pergunta ao próprio Google. Cota: 2.000 inspeções/dia por propriedade.
 *
 * Service account `gsc-reader@bkp-php` (permissão Completa nas 4 propriedades desde
 * 29/09/2026). Chave: env GSC_SA_KEY (caminho) ou ~/.config/gsc/agathas-sa.json — fora
 * do repositório e fora da pasta pública.
 */

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

export interface UrlInspection {
  /** PASS = indexada; NEUTRAL = fora do índice sem erro; FAIL = erro. */
  verdict: string | null;
  /** Texto do Google, no idioma pedido (ex.: "Enviada e indexada"). */
  coverageState: string | null;
  lastCrawlTime: string | null;
}

let cache: { token: string; exp: number } | null = null;

function loadKey(): ServiceAccountKey {
  const path = process.env.GSC_SA_KEY || join(homedir(), ".config", "gsc", "agathas-sa.json");
  let key: ServiceAccountKey;
  try {
    key = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`Chave do Search Console não encontrada em ${path}.`);
  }
  if (!key.client_email || !key.private_key) throw new Error("Chave do Search Console inválida.");
  return key;
}

const b64url = (v: string | Buffer) =>
  Buffer.from(v).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cache && cache.exp - 60 > now) return cache.token;
  const key = loadKey();
  const input = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URI, iat: now, exp: now + 3600 }),
  )}`;
  const assertion = `${input}.${b64url(createSign("RSA-SHA256").update(input).sign(key.private_key))}`;
  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) throw new Error(`Token do Search Console recusado: ${data.error_description ?? res.status}`);
  cache = { token: data.access_token, exp: now + 3600 };
  return data.access_token;
}

/** `site` no formato da propriedade (ex.: "sc-domain:agathas.com.br"). */
export async function inspectUrl(url: string, site: string): Promise<UrlInspection> {
  const token = await getToken();
  const res = await fetch(INSPECT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: site, languageCode: "pt-BR" }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } };
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(`Search Console ${res.status}: ${data.error?.message ?? "erro"}`);
  const r = data.inspectionResult?.indexStatusResult ?? {};
  return { verdict: r.verdict ?? null, coverageState: r.coverageState ?? null, lastCrawlTime: r.lastCrawlTime ?? null };
}
