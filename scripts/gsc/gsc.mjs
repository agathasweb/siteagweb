#!/usr/bin/env node
// Ferramenta de consulta à Google Search Console API (zero dependências).
// Autenticação e helpers ficam em ./lib.mjs (compartilhados com scripts/seo/).
//
// Uso:
//   node scripts/gsc/gsc.mjs sites
//   node scripts/gsc/gsc.mjs inspect <url> [--site=sc-domain:agathas.com.br]
//   node scripts/gsc/gsc.mjs audit [--site=...] [--sitemap=URL] [--limit=N]
//   node scripts/gsc/gsc.mjs perf [--site=...] [--days=90] [--limit=30]
//   node scripts/gsc/gsc.mjs gaps [--site=...] [--days=90] [--min-impressions=20]
//
// Chave do service account: env GSC_SA_KEY ou ~/.config/gsc/agathas-sa.json

import {
  SC_BASE,
  DEFAULT_SITE,
  die,
  loadKey,
  getAccessToken,
  api,
  searchAnalytics,
  dateRange,
  parseArgs,
  fmt,
} from "./lib.mjs";

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

// ---------- perf: relatório de desempenho ----------
async function cmdPerf(token, site, days, limit) {
  const { startDate, endDate } = dateRange(days);
  console.log(`Desempenho de ${site} — ${startDate} a ${endDate} (${days} dias)\n`);

  const [tot] = await searchAnalytics(token, site, { startDate, endDate, dimensions: [] });
  if (!tot) return console.log("Sem dados no período.");
  console.log("═══ TOTAL ═══");
  console.log(
    `  ${tot.clicks} cliques · ${tot.impressions} impressões · CTR ${fmt.pct(tot.ctr).trim()} · posição média ${tot.position.toFixed(1)}\n`,
  );

  const pages = await searchAnalytics(token, site, { startDate, endDate, dimensions: ["page"], rowLimit: 1000 });
  const clean = pages.filter((r) => !r.keys[0].includes("#"));
  console.log(`═══ TOP ${limit} PÁGINAS ═══`);
  console.log("  cliq.  impr.   pos    ctr   url");
  for (const r of clean.slice(0, limit)) {
    console.log(`  ${fmt.int(r.clicks)} ${fmt.int(r.impressions)} ${fmt.pos(r.position)} ${fmt.pct(r.ctr)}  ${r.keys[0]}`);
  }

  const queries = await searchAnalytics(token, site, { startDate, endDate, dimensions: ["query"], rowLimit: 1000 });
  console.log(`\n═══ TOP ${limit} CONSULTAS ═══`);
  console.log("  cliq.  impr.   pos    ctr   consulta");
  for (const r of queries.slice(0, limit)) {
    console.log(`  ${fmt.int(r.clicks)} ${fmt.int(r.impressions)} ${fmt.pos(r.position)} ${fmt.pct(r.ctr)}  ${r.keys[0]}`);
  }

  // Páginas comerciais — o indicador que importa para o negócio
  const comercial = clean.filter((r) => /\/(produtos|servicos)\//.test(r.keys[0]));
  const cCl = comercial.reduce((s, r) => s + r.clicks, 0);
  const cIm = comercial.reduce((s, r) => s + r.impressions, 0);
  console.log(`\n═══ PÁGINAS COMERCIAIS (produtos/serviços) ═══`);
  console.log(`  ${cCl} cliques · ${cIm} impressões · ${comercial.length} páginas com dados`);
  console.log("  cliq.  impr.   pos    ctr   url");
  for (const r of comercial.sort((a, b) => b.impressions - a.impressions)) {
    console.log(`  ${fmt.int(r.clicks)} ${fmt.int(r.impressions)} ${fmt.pos(r.position)} ${fmt.pct(r.ctr)}  ${r.keys[0]}`);
  }
}

// ---------- gaps: consultas a um passo da primeira página ----------
async function cmdGaps(token, site, days, minImp, minPos, maxPos, limit) {
  const { startDate, endDate } = dateRange(days);
  console.log(`Oportunidades de ${site} — ${startDate} a ${endDate}`);
  console.log(`Filtro: posição ${minPos}–${maxPos}, mínimo ${minImp} impressões\n`);

  const rows = await searchAnalytics(token, site, {
    startDate,
    endDate,
    dimensions: ["query", "page"],
    rowLimit: 25000,
  });
  const gaps = rows
    .filter((r) => r.impressions >= minImp && r.position >= minPos && r.position <= maxPos)
    .filter((r) => !r.keys[1].includes("#"))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);

  if (!gaps.length) return console.log("Nenhuma consulta nessa faixa. Afrouxe --min-impressions ou aumente --days.");

  console.log("  impr.  cliq.   pos   consulta → página que rankeia");
  for (const r of gaps) {
    const path = r.keys[1].replace(/^https?:\/\/[^/]+/, "");
    console.log(`  ${fmt.int(r.impressions)} ${fmt.int(r.clicks)} ${fmt.pos(r.position)}   ${r.keys[0]}\n${" ".repeat(26)}→ ${path}`);
  }
  console.log(`\n${gaps.length} oportunidades. Use-as como pauta: scripts/seo/pauta.mjs já consome esta mesma consulta.`);
}

// ---------- main ----------
async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  const site = flags.site || DEFAULT_SITE;
  const days = flags.days ? Number(flags.days) : 90;

  if (!cmd || cmd === "help") {
    console.log(
      [
        "GSC tool — comandos:",
        "  sites                      lista propriedades acessíveis pelo service account",
        "  inspect <url> [--site=]    inspeciona uma URL (status + motivo + canônica)",
        "  audit [--site=] [--sitemap=URL] [--limit=N]   inspeciona o sitemap inteiro",
        "  perf [--site=] [--days=90] [--limit=30]       desempenho: totais, páginas, consultas",
        "  gaps [--site=] [--days=90] [--min-impressions=20] [--min-pos=8] [--max-pos=30]",
        "                             consultas a um passo da primeira página",
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
  if (cmd === "perf") return cmdPerf(token, site, days, flags.limit ? Number(flags.limit) : 30);
  if (cmd === "gaps") {
    return cmdGaps(
      token,
      site,
      days,
      flags["min-impressions"] ? Number(flags["min-impressions"]) : 20,
      flags["min-pos"] ? Number(flags["min-pos"]) : 8,
      flags["max-pos"] ? Number(flags["max-pos"]) : 30,
      flags.limit ? Number(flags.limit) : 60,
    );
  }
  die(`Comando desconhecido: ${cmd}`);
}

main().catch((err) => die(err.message));
