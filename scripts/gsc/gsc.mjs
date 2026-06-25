#!/usr/bin/env node
// Ferramenta de consulta à Google Search Console API (zero dependências).
// Autentica via service account (JWT RS256 assinado com o crypto nativo) e fala
// com a API REST. Cobre: listar propriedades, inspecionar uma URL e auditar o
// sitemap inteiro agrupando por status de indexação.
//
// Uso:
//   node scripts/gsc/gsc.mjs sites
//   node scripts/gsc/gsc.mjs inspect <url> [--site=sc-domain:agathas.com.br]
//   node scripts/gsc/gsc.mjs audit [--site=sc-domain:agathas.com.br] [--sitemap=URL] [--limit=N]
//
// Chave do service account: env GSC_SA_KEY ou ~/.config/gsc/agathas-sa.json

import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SC_BASE = "https://searchconsole.googleapis.com";
const DEFAULT_SITE = "sc-domain:agathas.com.br";

// ---------- auth ----------
function loadKey() {
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

async function getAccessToken(key) {
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

async function api(token, url, init = {}) {
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

// ---------- sitemap ----------
function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

async function fetchAllUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl);
  if (!res.ok) die(`Sitemap ${sitemapUrl} -> HTTP ${res.status}`);
  const xml = await res.text();
  // sitemap index?
  if (/<sitemapindex/i.test(xml)) {
    const children = extractLocs(xml);
    const all = [];
    for (const child of children) {
      const sub = await fetch(child);
      if (sub.ok) all.push(...extractLocs(await sub.text()));
    }
    return all;
  }
  return extractLocs(xml);
}

// ---------- comandos ----------
async function cmdSites(token) {
  const data = await api(token, `${SC_BASE}/webmasters/v3/sites`);
  const entries = data.siteEntry || [];
  if (!entries.length) {
    console.log("Nenhuma propriedade acessível por este service account.");
    console.log("→ Adicione o e-mail do SA como usuário no GSC (Configurações → Usuários e permissões).");
    return;
  }
  console.log("Propriedades acessíveis:");
  for (const e of entries) console.log(`  ${e.permissionLevel.padEnd(18)} ${e.siteUrl}`);
}

async function inspectUrl(token, site, url) {
  const data = await api(token, `${SC_BASE}/v1/urlInspection/index:inspect`, {
    method: "POST",
    body: JSON.stringify({ inspectionUrl: url, siteUrl: site, languageCode: "pt-BR" }),
  });
  return data.inspectionResult?.indexStatusResult || {};
}

async function cmdInspect(token, site, url) {
  if (!url) die("Uso: inspect <url> [--site=...]");
  const r = await inspectUrl(token, site, url);
  console.log(`URL: ${url}`);
  console.log(`  Veredito:        ${r.verdict || "—"}`);
  console.log(`  Cobertura:       ${r.coverageState || "—"}`);
  console.log(`  Robots:          ${r.robotsTxtState || "—"}`);
  console.log(`  Indexação:       ${r.indexingState || "—"}`);
  console.log(`  Canônica Google: ${r.googleCanonical || "—"}`);
  console.log(`  Canônica user:   ${r.userCanonical || "—"}`);
  console.log(`  Último crawl:    ${r.lastCrawlTime || "—"}`);
}

async function cmdAudit(token, site, sitemapUrl, limit) {
  const host = site.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const sm = sitemapUrl || `https://${host}/sitemap.xml`;
  console.log(`Auditando ${site}\nSitemap: ${sm}\n`);
  let urls = await fetchAllUrls(sm);
  urls = [...new Set(urls)];
  if (limit) urls = urls.slice(0, limit);
  console.log(`${urls.length} URLs para inspecionar (cota API: 2.000/dia)...\n`);

  const groups = new Map(); // coverageState -> [{url, verdict, googleCanonical, userCanonical}]
  let done = 0;
  const CONCURRENCY = 5;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const r = await inspectUrl(token, site, url);
          return { url, ...r };
        } catch (err) {
          return { url, coverageState: `ERRO: ${err.message}` };
        }
      }),
    );
    for (const r of results) {
      const key = r.coverageState || r.verdict || "Desconhecido";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    done += batch.length;
    process.stdout.write(`\r  inspecionadas: ${done}/${urls.length}`);
  }
  process.stdout.write("\n\n");

  // relatório
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log("═══ RESUMO POR STATUS ═══");
  for (const [state, items] of sorted) console.log(`  ${String(items.length).padStart(4)}  ${state}`);
  console.log("");

  // detalhe dos que NÃO estão indexados (verdict != PASS) — o que importa
  console.log("═══ URLs NÃO INDEXADAS (detalhe acionável) ═══");
  let anyBad = false;
  for (const [state, items] of sorted) {
    const bad = items.filter((r) => r.verdict !== "PASS");
    if (!bad.length) continue;
    anyBad = true;
    console.log(`\n▼ ${state} (${bad.length})`);
    for (const r of bad) {
      let extra = "";
      if (r.googleCanonical && r.userCanonical && r.googleCanonical !== r.userCanonical) {
        extra = `  [Google canônica: ${r.googleCanonical}]`;
      }
      console.log(`   ${r.url}${extra}`);
    }
  }
  if (!anyBad) console.log("  🎉 Todas as URLs do sitemap estão indexadas (verdict PASS).");
}

// ---------- util ----------
function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
    else positional.push(a);
  }
  return { positional, flags };
}

// ---------- main ----------
async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  const site = flags.site || DEFAULT_SITE;

  if (!cmd || cmd === "help") {
    console.log(
      [
        "GSC tool — comandos:",
        "  sites                      lista propriedades acessíveis pelo service account",
        "  inspect <url> [--site=]    inspeciona uma URL (status + motivo + canônica)",
        "  audit [--site=] [--sitemap=URL] [--limit=N]   inspeciona o sitemap inteiro",
        "",
        `Site padrão: ${DEFAULT_SITE}`,
      ].join("\n"),
    );
    return;
  }

  const key = loadKey();
  const token = await getAccessToken(key);

  if (cmd === "sites") return cmdSites(token);
  if (cmd === "inspect") return cmdInspect(token, site, positional[0]);
  if (cmd === "audit") return cmdAudit(token, site, flags.sitemap, flags.limit ? Number(flags.limit) : 0);
  die(`Comando desconhecido: ${cmd}`);
}

main().catch((err) => die(err.message));
