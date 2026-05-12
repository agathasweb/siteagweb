#!/usr/bin/env node
// Cria um post de demonstração nos 4 idiomas para validar o blog.
import Database from "better-sqlite3";
import { join } from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "agathas.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const slug = "bem-vindos-ao-blog";
const existing = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug);
if (existing) {
  console.log(`Post "${slug}" já existe (id=${existing.id}). Nada a fazer.`);
  process.exit(0);
}

const tx = db.transaction(() => {
  const result = db.prepare(`
    INSERT INTO posts (slug, status, source_locale, published_at)
    VALUES (?, 'published', 'pt-BR', datetime('now'))
  `).run(slug);
  const postId = Number(result.lastInsertRowid);

  const translations = [
    {
      locale: "pt-BR",
      title: "Bem-vindos ao blog da Agathas Web",
      excerpt: "Compartilhamos aqui artigos sobre desenvolvimento, Moodle, marketing digital e tecnologia.",
      content_html: `<p>Olá! É com prazer que inauguramos o blog da <strong>Agathas Web</strong>.</p>
<h2>O que você vai encontrar por aqui</h2>
<p>Conteúdos práticos sobre desenvolvimento de software, plataformas Moodle, gestão de tráfego pago e tendências de tecnologia para empresas brasileiras e internacionais.</p>
<p>Fique à vontade para nos seguir no LinkedIn e Instagram para acompanhar tudo em primeira mão.</p>`,
      meta_title: "Bem-vindos ao blog da Agathas Web",
      meta_description: "Inauguração do blog da Agathas Web — artigos sobre tecnologia, Moodle e marketing digital.",
    },
    {
      locale: "es",
      title: "Bienvenidos al blog de Agathas Web",
      excerpt: "Compartimos aquí artículos sobre desarrollo, Moodle, marketing digital y tecnología.",
      content_html: `<p>¡Hola! Es un placer inaugurar el blog de <strong>Agathas Web</strong>.</p>
<h2>Qué encontrarás aquí</h2>
<p>Contenidos prácticos sobre desarrollo de software, plataformas Moodle, gestión de tráfico de pago y tendencias de tecnología para empresas en España y el extranjero.</p>
<p>Síguenos en LinkedIn e Instagram para no perderte nada.</p>`,
      meta_title: "Bienvenidos al blog de Agathas Web",
      meta_description: "Inauguración del blog de Agathas Web — artículos sobre tecnología, Moodle y marketing digital.",
    },
    {
      locale: "en-US",
      title: "Welcome to the Agathas Web blog",
      excerpt: "We share articles on development, Moodle, digital marketing, and technology.",
      content_html: `<p>Hello! We're delighted to launch the <strong>Agathas Web</strong> blog.</p>
<h2>What you'll find here</h2>
<p>Practical content on software development, Moodle platforms, paid traffic management, and technology trends for businesses in the US and abroad.</p>
<p>Follow us on LinkedIn and Instagram to keep up with everything first-hand.</p>`,
      meta_title: "Welcome to the Agathas Web blog",
      meta_description: "Launching the Agathas Web blog — articles on technology, Moodle, and digital marketing.",
    },
    {
      locale: "en-GB",
      title: "Welcome to the Agathas Web blog",
      excerpt: "We share articles on development, Moodle, digital marketing and technology.",
      content_html: `<p>Hello! We're delighted to launch the <strong>Agathas Web</strong> blog.</p>
<h2>What you'll find here</h2>
<p>Practical content on software development, Moodle platforms, paid traffic management and technology trends for businesses in the UK and abroad.</p>
<p>Follow us on LinkedIn and Instagram to keep up with everything first-hand.</p>`,
      meta_title: "Welcome to the Agathas Web blog",
      meta_description: "Launching the Agathas Web blog — articles on technology, Moodle and digital marketing.",
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO post_translations (post_id, locale, title, excerpt, content_html, meta_title, meta_description, translation_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')
  `);
  for (const t of translations) {
    stmt.run(postId, t.locale, t.title, t.excerpt, t.content_html, t.meta_title, t.meta_description);
  }

  return postId;
});

const id = tx();
console.log(`Post de demo criado (id=${id}, slug=${slug}) em 4 idiomas.`);
