#!/usr/bin/env node
// Contexto para escrever um post: autor, voz, taxonomia, checagem de colisão e
// sugestão de links internos. Substitui os `docker exec ... sqlite3` do post.md
// (que exigiam o container de pé e não funcionavam no gerador autônomo).
//
// Uso:
//   node scripts/seo/consulta.mjs autor
//   node scripts/seo/consulta.mjs voz [n]
//   node scripts/seo/consulta.mjs taxonomia
//   node scripts/seo/consulta.mjs checar <slug> "<focus keyword>"
//   node scripts/seo/consulta.mjs links "<tema ou palavra-chave>" [n]
//   node scripts/seo/consulta.mjs orfaos [n]

import { openDb, publishedPosts, norm, similarity, extractLinks } from "./db.mjs";
import { parseArgs } from "../gsc/lib.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const { positional, flags } = parseArgs(rest);
const { db, origem } = openDb(flags.db);

function autor() {
  const u = db
    .prepare(
      `SELECT id, name, email, bio, avatar_url, social_links FROM users
        WHERE email = (SELECT value FROM settings WHERE key='admin.email') OR id = 1
        LIMIT 1`,
    )
    .get();
  if (!u) return console.log("Nenhum autor encontrado.");
  console.log(`Autor: ${u.name} <${u.email}>`);
  console.log(`Bio:   ${u.bio || "(vazia — avise o usuário antes de escrever em 1ª pessoa)"}`);
  console.log(`Links: ${u.social_links || "—"}`);
}

function voz(n = 3) {
  const rows = db
    .prepare(
      `SELECT p.slug, t.title, t.content_html
         FROM posts p JOIN post_translations t ON t.post_id = p.id AND t.locale = p.source_locale
        WHERE p.status = 'published' ORDER BY p.published_at DESC LIMIT ?`,
    )
    .all(n);
  for (const r of rows) {
    console.log(`\n─── /blog/${r.slug} — ${r.title}`);
    console.log(String(r.content_html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 700), "…");
  }
}

function taxonomia() {
  console.log("Categorias:");
  for (const c of db
    .prepare(
      `SELECT c.slug, COALESCE(ct.name, c.slug) AS nome, COUNT(p.id) AS n
         FROM categories c
         LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'pt-BR'
         LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
        GROUP BY c.id ORDER BY n DESC`,
    )
    .all())
    console.log(`  ${String(c.n).padStart(4)}  ${c.slug.padEnd(26)} ${c.nome}`);

  console.log("\nTags mais usadas:");
  for (const t of db
    .prepare(
      `SELECT t.slug, t.name, COUNT(pt.post_id) AS n
         FROM tags t LEFT JOIN post_tags pt ON pt.tag_id = t.id
        GROUP BY t.id ORDER BY n DESC LIMIT 25`,
    )
    .all())
    console.log(`  ${String(t.n).padStart(4)}  ${t.slug.padEnd(30)} ${t.name}`);
}

/** O slug está livre? A focus keyword colide com algum post? */
function checar(slug, keyword) {
  if (!slug) return console.log("Uso: checar <slug> \"<focus keyword>\"");
  const posts = publishedPosts(db);
  const colisaoSlug = posts.find((p) => p.slug === slug);
  console.log(`Slug "${slug}": ${colisaoSlug ? "❌ JÁ EXISTE — escolha outro" : "✓ livre"}`);

  if (!keyword) return;
  const nk = norm(keyword);
  const iguais = posts.filter((p) => norm(p.focus_keyword) === nk);
  const parecidos = posts.filter((p) => !iguais.includes(p) && similarity(p.focus_keyword, keyword) >= 0.6);
  if (iguais.length) {
    console.log(`\n❌ Focus keyword "${keyword}" JÁ USADA:`);
    for (const p of iguais) console.log(`     /blog/${p.slug} — ${p.title}`);
    console.log("   → Atualize esse post em vez de criar um concorrente interno.");
    console.log("     (o import recusa; só passa com \"allow_keyword_overlap\": true, e isso precisa ser decisão consciente)");
  } else if (parecidos.length) {
    console.log(`\n⚠ Focus keywords parecidas (revise o ângulo para não canibalizar):`);
    for (const p of parecidos) console.log(`     "${p.focus_keyword}" — /blog/${p.slug}`);
  } else {
    console.log(`Focus keyword "${keyword}": ✓ livre`);
  }
}

/** Posts publicados mais próximos do tema — candidatos a link interno. */
function links(tema, n = 8) {
  if (!tema) return console.log('Uso: links "<tema>" [n]');
  const posts = publishedPosts(db);
  const entrantes = new Map();
  for (const p of posts) for (const b of extractLinks(p.content_html).blog) entrantes.set(b, (entrantes.get(b) || 0) + 1);

  const ranked = posts
    .map((p) => ({
      p,
      score: Math.max(similarity(p.title, tema), similarity(p.focus_keyword, tema)),
      recebidos: entrantes.get(`/blog/${p.slug}`) || 0,
    }))
    .filter((x) => x.score > 0.1)
    .sort((a, b) => b.score - a.score || a.recebidos - b.recebidos)
    .slice(0, Number(n));

  if (!ranked.length) return console.log("Nenhum post próximo. Linke a página-pilar do cluster e 2 posts da mesma categoria.");
  console.log(`Candidatos a link interno para "${tema}":`);
  for (const x of ranked) {
    console.log(`  ${(x.score * 100).toFixed(0)}%  [${x.p.title}](/blog/${x.p.slug})   ${x.recebidos === 0 ? "← ÓRFÃO: prefira este" : `(${x.recebidos} links recebidos)`}`);
  }
  console.log("\nRegra: linke 2-3 destes NO POST NOVO e edite 2 posts antigos para linkarem o novo.");
}

function orfaos(n = 20) {
  const posts = publishedPosts(db);
  const entrantes = new Set();
  for (const p of posts) for (const b of extractLinks(p.content_html).blog) entrantes.add(b);
  const lista = posts.filter((p) => !entrantes.has(`/blog/${p.slug}`)).slice(0, Number(n));
  console.log(`Órfãos (sem nenhum link interno recebido) — mostrando ${lista.length}:`);
  for (const p of lista) console.log(`  /blog/${p.slug} — ${p.title}`);
}

console.log(`# fonte: ${origem}\n`);
switch (cmd) {
  case "autor": autor(); break;
  case "voz": voz(Number(positional[0] || 3)); break;
  case "taxonomia": taxonomia(); break;
  case "checar": checar(positional[0], positional.slice(1).join(" ")); break;
  case "links": links(positional[0], positional[1]); break;
  case "orfaos": orfaos(positional[0]); break;
  default:
    console.log("Comandos: autor | voz [n] | taxonomia | checar <slug> \"<keyword>\" | links \"<tema>\" [n] | orfaos [n]");
}
