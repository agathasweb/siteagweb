#!/usr/bin/env node
// Revisão mensal do acervo: cruza o banco de posts com o Search Console e
// devolve as filas de trabalho. É o laço de feedback que faltava — sem ele o
// acervo só cresce, não melhora.
//
// Uso:
//   node scripts/seo/review.mjs                 # janela de 28 dias
//   node scripts/seo/review.mjs --days=90
//   node scripts/seo/review.mjs --db=data/prod-snapshot.db
//
// Seis filas: reescrever título/meta · reforçar · consolidar duplicados ·
// arquivar · sem link comercial · órfãos.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openDb, publishedPosts, extractLinks, norm, similarity, REPO, contarPalavras } from "./db.mjs";
import { DEFAULT_SITE, getAccessToken, searchAnalytics, dateRange, parseArgs, urlPath, fmt } from "../gsc/lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const DIAS = Number(flags.days || 28);
const SITE = flags.site || DEFAULT_SITE;
const cfg = JSON.parse(readFileSync(join(REPO, "scripts", "seo", "clusters.json"), "utf8"));

const { db, path, origem, idade } = openDb(flags.db);
const posts = publishedPosts(db);
const porSlug = new Map(posts.map((p) => [p.slug, p]));

console.log(`═══ REVISÃO DE ACERVO — ${new Date().toLocaleDateString("pt-BR")} ═══`);
console.log(`${posts.length} posts publicados · ${origem}${idade > 7 ? ` (${idade} dias)` : ""}`);
console.log(`Banco: ${path}\n`);

// ---------- Search Console ----------
let porPost = new Map();
let totais = null;
try {
  const token = await getAccessToken();
  const { startDate, endDate } = dateRange(DIAS);
  console.log(`Search Console: ${startDate} a ${endDate} (${DIAS} dias)\n`);
  [totais] = await searchAnalytics(token, SITE, { startDate, endDate, dimensions: [] });
  const rows = await searchAnalytics(token, SITE, { startDate, endDate, dimensions: ["page"], rowLimit: 5000 });
  for (const r of rows) {
    const p = urlPath(r.keys[0]);
    if (!p.startsWith("/blog/")) continue;
    const slug = p.slice("/blog/".length);
    const atual = porPost.get(slug);
    // fragmentos (#secao) chegam como URLs separadas — somam no mesmo post
    if (atual) {
      atual.clicks += r.clicks;
      atual.impressions += r.impressions;
      atual.position = Math.min(atual.position, r.position);
    } else {
      porPost.set(slug, { clicks: r.clicks, impressions: r.impressions, position: r.position, ctr: r.ctr });
    }
  }
  for (const v of porPost.values()) v.ctr = v.impressions ? v.clicks / v.impressions : 0;
} catch (err) {
  console.log(`⚠ Search Console indisponível (${err.message}). Só as filas estruturais serão geradas.\n`);
}

if (totais) {
  console.log("─── Placar do período ───");
  console.log(
    `  ${totais.clicks} cliques · ${totais.impressions} impressões · CTR ${(totais.ctr * 100).toFixed(2)}% · posição média ${totais.position.toFixed(1)}\n`,
  );
}

function fila(titulo, itens, render, comoAgir) {
  console.log(`\n═══ ${titulo} (${itens.length}) ═══`);
  if (!itens.length) return console.log("  nada a fazer.");
  console.log(`  ↳ ${comoAgir}\n`);
  for (const i of itens) console.log(render(i));
}

// ---------- 1. reescrever título/meta: impressão alta, ninguém clica ----------
const reescrever = [...porPost.entries()]
  .filter(([slug, m]) => porSlug.has(slug) && m.impressions >= 200 && m.ctr < 0.01)
  .sort((a, b) => b[1].impressions - a[1].impressions);
fila(
  "REESCREVER TÍTULO E META",
  reescrever,
  ([slug, m]) => `  ${fmt.int(m.impressions)} imp ${fmt.int(m.clicks)} cl ctr ${(m.ctr * 100).toFixed(2)}% pos ${m.position.toFixed(1)}  ${slug}`,
  "O Google mostra e ninguém clica: ou o título não promete o que a busca quer, ou a intenção da consulta não é a do post. Reescreva meta_title/meta_description em /admin/posts/<id>.",
);

// ---------- 2. reforçar: posição 8-20 ----------
const reforcar = [...porPost.entries()]
  .filter(([slug, m]) => porSlug.has(slug) && m.position >= 8 && m.position <= 20 && m.impressions >= 30)
  .sort((a, b) => a[1].position - b[1].position);
fila(
  "REFORÇAR (posição 8-20 — a um passo da primeira página)",
  reforcar,
  ([slug, m]) => `  pos ${m.position.toFixed(1)} ${fmt.int(m.impressions)} imp  ${slug}`,
  "Amplie o post (seções que faltam, FAQ, dados novos) e aponte 2-3 links internos de outros posts para ele.",
);

// ---------- 3. consolidar duplicados ----------
const dupes = [];
for (let i = 0; i < posts.length; i++) {
  for (let j = i + 1; j < posts.length; j++) {
    const a = posts[i];
    const b = posts[j];
    const fkA = norm(a.focus_keyword);
    const fkB = norm(b.focus_keyword);
    const mesmaFk = fkA && fkA === fkB;
    const titSim = similarity(a.title, b.title);
    if (mesmaFk || titSim >= 0.65) {
      const mA = porPost.get(a.slug) || { impressions: 0, clicks: 0 };
      const mB = porPost.get(b.slug) || { impressions: 0, clicks: 0 };
      // Vence quem tem mais impressão; empate (os dois invisíveis) vai para o
      // post mais completo, que é o melhor destino do 301.
      const vencedor =
        mA.impressions === mB.impressions
          ? contarPalavras(a.content_html) >= contarPalavras(b.content_html)
            ? a
            : b
          : mA.impressions > mB.impressions
            ? a
            : b;
      const perdedor = vencedor === a ? b : a;
      dupes.push({ vencedor, perdedor, motivo: mesmaFk ? `mesma focus keyword "${a.focus_keyword}"` : `títulos ${(titSim * 100).toFixed(0)}% parecidos` });
    }
  }
}
fila(
  "CONSOLIDAR DUPLICADOS",
  dupes,
  (d) => `  manter: ${d.vencedor.slug}\n  fundir: ${d.perdedor.slug}\n         (${d.motivo})\n`,
  "Passe o conteúdo único do perdedor para o vencedor e crie um 301 do perdedor → vencedor (redirect na Cloudflare). Duas URLs na mesma consulta dividem força em vez de somar.",
);

// ---------- 4. arquivar: invisível há muito tempo ----------
const invisiveis = posts
  .filter((p) => {
    const m = porPost.get(p.slug);
    return !m || m.impressions < 5;
  })
  .map((p) => p.slug);
console.log(`\n═══ CONGELAR (invisíveis: menos de 5 impressões em ${DIAS} dias) (${invisiveis.length}) ═══`);
console.log("  ↳ Não invista mais: sem revisão, sem tradução, sem link novo. Deixe no ar (custo zero) e siga.\n");
console.log(`  ${invisiveis.slice(0, 25).join(", ")}${invisiveis.length > 25 ? `, … +${invisiveis.length - 25}` : ""}`);

// ---------- 5. sem link comercial ----------
const moneyPages = new Set(cfg.money_pages);
const semComercial = [];
const entrantes = new Map();
for (const p of posts) {
  const { blog, comercial } = extractLinks(p.content_html);
  const temMoney = comercial.some((c) => moneyPages.has(c));
  if (!temMoney) {
    const m = porPost.get(p.slug);
    semComercial.push({ slug: p.slug, imp: m?.impressions || 0 });
  }
  for (const b of blog) entrantes.set(b, (entrantes.get(b) || 0) + 1);
}
semComercial.sort((a, b) => b.imp - a.imp);
fila(
  "SEM LINK PARA PÁGINA QUE VENDE",
  semComercial.slice(0, 40),
  (x) => `  ${fmt.int(x.imp)} imp  ${x.slug}`,
  "Prioridade é de cima para baixo (mais impressões primeiro): acrescente 2 links contextuais e o bloco 'como a Agathas resolve' apontando para a money_page do tema.",
);
if (semComercial.length > 40) console.log(`  … +${semComercial.length - 40} posts (a cauda pode esperar).`);

// ---------- 6. órfãos ----------
const orfaos = posts.filter((p) => !entrantes.has(`/blog/${p.slug}`));
fila(
  "ÓRFÃOS (nenhum outro post linka para eles)",
  orfaos.slice(0, 40).map((p) => ({ slug: p.slug, palavras: contarPalavras(p.content_html) })),
  (x) => `  ${String(x.palavras).padStart(5)}w  ${x.slug}`,
  "Ao publicar o próximo post do mesmo tema, linke 2 destes. Órfão só recebe visita pelo sitemap.",
);
if (orfaos.length > 40) console.log(`  … +${orfaos.length - 40} órfãos.`);

// ---------- placar de arquitetura ----------
const comComercial = posts.length - semComercial.length;
console.log("\n\n═══ PLACAR DE ARQUITETURA ═══");
console.log(`  posts com link para página que vende:  ${comComercial}/${posts.length} (${((comComercial / posts.length) * 100).toFixed(0)}%)`);
console.log(`  posts órfãos:                          ${orfaos.length}/${posts.length}`);
console.log(`  pares duplicados:                      ${dupes.length}`);
console.log("\n  Meta: 100% com link comercial, zero órfãos, zero duplicados.");
