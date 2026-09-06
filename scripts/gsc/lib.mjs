// Base compartilhada da Google Search Console API (zero dependências).
// Autentica via service account (JWT RS256 assinado com o crypto nativo).
// Usado por scripts/gsc/gsc.mjs e pelas ferramentas de SEO em scripts/seo/.
//
// Chave do service account: env GSC_SA_KEY ou ~/.config/gsc/agathas-sa.json

import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
export const SC_BASE = "https://searchconsole.googleapis.com";
export const DEFAULT_SITE = "sc-domain:agathas.com.br";

export function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

export function loadKey() {
  const path = process.env.GSC_SA_KEY || join(homedir(), ".config", "gsc", "agathas-sa.json");
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    die(
      `Chave do service account não encontrada em ${path}\n` +
        `Coloque o JSON ali (ou aponte GSC_SA_KEY) — veja scripts/gsc/README.md`,
    );
  }
  const key = JSON.parse(raw);
  if (!key.client_email || !key.private_key) die("JSON inválido: faltam client_email/private_key.");
  return key;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getAccessToken(key = loadKey()) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URI, iat: now, exp: now + 3600 }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = b64url(createSign("RSA-SHA256").update(signingInput).sign(key.private_key));
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) die(`Falha ao obter token (${res.status}): ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function api(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return data;
}

/**
 * Consulta o relatório de desempenho (Search Analytics).
 * `body` aceita startDate, endDate, dimensions, rowLimit, dimensionFilterGroups...
 * Retorna sempre um array de linhas (vazio se não houver dados).
 */
export async function searchAnalytics(token, site, body) {
  const url = `${SC_BASE}/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const data = await api(token, url, { method: "POST", body: JSON.stringify(body) });
  return data.rows || [];
}

/**
 * Janela de datas terminando 2 dias atrás (o GSC não tem dado dos últimos ~2 dias).
 */
export function dateRange(days = 90) {
  const day = 86_400_000;
  const endDate = new Date(Date.now() - 2 * day).toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - (days + 2) * day).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
    else if (a.startsWith("--")) flags[a.slice(2)] = "true";
    else positional.push(a);
  }
  return { positional, flags };
}

/** Normaliza uma URL do GSC para o path do site (ex.: /blog/slug). */
export function urlPath(u) {
  try {
    return new URL(u).pathname.replace(/\/$/, "") || "/";
  } catch {
    return u;
  }
}

export const fmt = {
  int: (n) => String(Math.round(n)).padStart(5),
  pos: (n) => n.toFixed(1).padStart(5),
  pct: (n) => `${(n * 100).toFixed(1)}%`.padStart(6),
};
