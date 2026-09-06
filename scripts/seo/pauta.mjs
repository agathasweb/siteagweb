#!/usr/bin/env node
// Monta a fila de pauta do mês. Substitui o Google Trends como fonte primária:
// a pauta nasce do mapa de clusters (o que a Agathas vende) e das consultas que
// o próprio site já quase rankeia, não do que está em alta no país.
//
// Uso:
//   node scripts/seo/pauta.mjs                 # fila do mês corrente
//   node scripts/seo/pauta.mjs --posts=12      # tamanho da fila
//   node scripts/seo/pauta.mjs --sem-gsc       # só clusters (offline)
//   node scripts/seo/pauta.mjs --out=/caminho/pauta.tsv
//
// Saída: tabela no terminal + arquivo TSV consumido por `gerar-posts-agweb --pauta`.

import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { openDb, publishedPosts, norm, similarity, REPO } from "./db.mjs";
import { DEFAULT_SITE, getAccessToken, searchAnalytics, dateRange, parseArgs, urlPath } from "../gsc/lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const cfg = JSON.parse(readFileSync(join(REPO, "scripts", "seo", "clusters.json"), "utf8"));
const TOTAL = Number(flags.posts || cfg.cotas.posts_por_mes || 10);
const MES = flags.mes || new Date().toISOString().slice(0, 7);
const SITE = flags.site || DEFAULT_SITE;
const DIAS = Number(flags.days || 90);
const SAIDA = flags.out || join(homedir(), "Área de trabalho", `pauta-${MES}.tsv`);

// ---------- 1. o que já existe ----------
const { db, path, origem, idade } = openDb(flags.db);
const posts = publishedPosts(db);
console.log(`Acervo: ${posts.length} posts publicados — ${origem}${idade > 7 ? ` (${idade} dias de idade; rode scripts/seo/snapshot.mjs)` : ""}`);
console.log(`Banco: ${path}\n`);

const publicados = posts.map((p) => ({
  slug: p.slug,
  fk: norm(p.focus_keyword),
  titulo: p.title,
}));

/** Um tema já foi coberto? Compara focus keyword e título. */
function jaCoberto(focusKeyword, tema) {
  const fk = norm(focusKeyword);
  for (const p of publicados) {
    if (p.fk && fk && (p.fk === fk || similarity(p.fk, fk) >= 0.75)) return p.slug;
    if (similarity(p.titulo, tema) >= 0.6) return p.slug;
  }
  return null;
}

// ---------- 2. fila de clusters ----------
const filaCluster = [];
const coberto = [];
for (const c of [...cfg.clusters].sort((a, b) => a.prioridade - b.prioridade)) {
  for (const item of c.posts) {
    const dono = jaCoberto(item.focus_keyword, item.tema);
    const linha = {
      fonte: "cluster",
      cluster: c.slug,
      prioridade: c.prioridade,
      tema: item.tema,
      categoria: item.category_slug || c.category_slug,
      money_page: item.money_page || c.money_page,
      intencao: item.intencao,
      focus_keyword: item.focus_keyword,
    };
    if (dono) coberto.push({ ...linha, dono });
    else filaCluster.push(linha);
  }
}

// ---------- 3. oportunidades do Search Console ----------
const bloqueio = (cfg.filtro_gsc?.bloquear_regex || []).map((r) => new RegExp(r, "i"));
let filaGsc = [];
if (!flags["sem-gsc"]) {
  try {
    const token = await getAccessToken();
    const { startDate, endDate } = dateRange(DIAS);
    const rows = await searchAnalytics(token, SITE, {
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 25000,
    });
    const minImp = Number(flags["min-impressions"] || 20);
    const cand = rows
      .filter((r) => r.impressions >= minImp && r.position >= 8 && r.position <= 30)
      .filter((r) => !r.keys[1].includes("#"))
      .filter((r) => !bloqueio.some((re) => re.test(r.keys[0])))
      .sort((a, b) => b.impressions - a.impressions);

    const vistos = new Set();
    for (const r of cand) {
      const q = r.keys[0];
      const nq = norm(q);
      // dedupe: variações da mesma consulta viram uma pauta só
      if ([...vistos].some((v) => similarity(v, nq) >= 0.6)) continue;
      // já coberto pelo acervo ou já está na fila de cluster?
      if (jaCoberto(q, q)) continue;
      if (filaCluster.some((f) => similarity(f.focus_keyword, nq) >= 0.6)) continue;
      vistos.add(nq);

      const pagina = urlPath(r.keys[1]);
      // A qual cluster essa consulta pertence? Página que rankeia > termos do
      // cluster > nenhum (aí a pauta vira consultoria, e o humano corrige).
      const clusterAfim =
        cfg.clusters.find((c) => c.money_page === pagina) ||
        cfg.clusters.find((c) => (c.termos || []).some((t) => nq.includes(norm(t)))) ||
        cfg.clusters.find((c) => c.posts.some((p) => similarity(p.focus_keyword, nq) >= 0.5));
      filaGsc.push({
        fonte: "gsc",
        cluster: clusterAfim?.slug || "—",
        prioridade: 2,
        tema: `${q} — responder essa dúvida em profundidade e apoiar a página que já rankeia (${pagina}, posição ${r.position.toFixed(0)}, ${r.impressions} impressões em ${DIAS} dias)`,
        categoria: clusterAfim?.category_slug || "tecnologia",
        money_page: /^\/(produtos|servicos)\//.test(pagina) ? pagina : clusterAfim?.money_page || "/servicos/consultoria",
        intencao: "informacional",
        focus_keyword: q,
        _imp: r.impressions,
        _pos: r.position,
      });
    }
  } catch (err) {
    console.log(`⚠ Search Console indisponível (${err.message}). Seguindo só com clusters.\n`);
  }
}

// ---------- 4. aplica as cotas ----------
const nCluster = Math.max(1, Math.round(TOTAL * cfg.cotas.cluster));
const nGsc = Math.round(TOTAL * cfg.cotas.gsc);
const nNoticia = Math.max(0, TOTAL - nCluster - nGsc);

const fila = [
  ...filaCluster.slice(0, nCluster),
  ...filaGsc.slice(0, nGsc),
  ...Array.from({ length: nNoticia }, () => ({
    fonte: "noticia",
    cluster: "—",
    tema: "[PREENCHER] notícia da semana que toque um gatilho permitido (veja clusters.json → noticia.gatilhos_permitidos)",
    categoria: "tecnologia",
    money_page: "/servicos/consultoria",
    intencao: "informacional",
    focus_keyword: "",
  })),
];

// ---------- 5. saída ----------
const larg = { fonte: 8, cat: 22, mp: 33, int: 15 };
console.log(`═══ PAUTA ${MES} — ${fila.length} posts ═══\n`);
console.log(
  `${"fonte".padEnd(larg.fonte)}${"categoria".padEnd(larg.cat)}${"money_page".padEnd(larg.mp)}${"intenção".padEnd(larg.int)}tema`,
);
console.log("─".repeat(120));
for (const f of fila) {
  const extra = f._imp ? ` [${f._imp} imp · pos ${f._pos.toFixed(0)}]` : "";
  console.log(
    `${f.fonte.padEnd(larg.fonte)}${f.categoria.padEnd(larg.cat)}${f.money_page.padEnd(larg.mp)}${(f.intencao || "").padEnd(larg.int)}${f.tema.slice(0, 90)}${extra}`,
  );
}

const tsv = [
  "# pauta gerada por scripts/seo/pauta.mjs — consumida por: gerar-posts-agweb --pauta",
  `# mês ${MES} · ${fila.length} posts · cotas ${nCluster} cluster / ${nGsc} gsc / ${nNoticia} notícia`,
  "# colunas: fonte\ttema\tcategoria\tmoney_page\tintencao\tfocus_keyword",
  ...fila.map((f) => [f.fonte, f.tema, f.categoria, f.money_page, f.intencao, f.focus_keyword].join("\t")),
].join("\n");
writeFileSync(SAIDA, `${tsv}\n`, "utf8");

console.log(`\n✓ Pauta salva em: ${SAIDA}`);
console.log(`  Revise (principalmente as linhas [PREENCHER]) e rode:  gerar-posts-agweb --pauta\n`);

console.log("═══ SITUAÇÃO DOS CLUSTERS ═══");
for (const c of cfg.clusters) {
  const total = c.posts.length;
  const feitos = coberto.filter((x) => x.cluster === c.slug).length;
  const barra = "█".repeat(feitos) + "░".repeat(total - feitos);
  console.log(`  P${c.prioridade} ${barra} ${feitos}/${total}  ${c.nome}  →  ${c.money_page}`);
}
if (filaCluster.length === 0) console.log("\n  🎉 Todos os clusters do mapa foram publicados. Hora de editar clusters.json com a próxima leva.");
else console.log(`\n  ${filaCluster.length} posts de cluster ainda na fila (≈ ${Math.ceil(filaCluster.length / Math.max(1, nCluster))} meses).`);
