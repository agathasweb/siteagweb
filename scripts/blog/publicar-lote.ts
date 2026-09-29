/**
 * Publicação em lote dos posts semanais, direto no servidor — sem login no /admin.
 *
 * Usa as MESMAS funções do painel (validação e import do /admin/posts/import, capa do
 * Unsplash processada em WebP, tradução com o Gemini, publicação + IndexNow/WebSub), só
 * que chamadas por linha de comando. Existe porque a sessão do Claude Code não tem a
 * senha do admin e porque subir 9 posts pela interface é trabalho braçal.
 *
 * Roda no servidor, empacotado com esbuild (ver scripts/blog/README.md):
 *   node publicar-lote.mjs validar   <arquivo.json ...>
 *   node publicar-lote.mjs importar  <arquivo.json ...>        (entra como rascunho)
 *   node publicar-lote.mjs capa-buscar <slug> "<busca em inglês>"   (lista 6 candidatas)
 *   node publicar-lote.mjs capa-aplicar <slug> <n>                   (aplica a candidata n)
 *   node publicar-lote.mjs traduzir  <slug ...>                (es, en-US, en-GB)
 *   node publicar-lote.mjs publicar  <slug ...>
 *   node publicar-lote.mjs status    <slug ...>
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { validatePostsJson, importPosts } from "@/lib/posts-import";
import { searchUnsplash, fetchImageBuffer, trackDownload } from "@/lib/unsplash";
import { processImageToWebp } from "@/lib/images";
import { translatePostDistinct } from "@/lib/ai/translate";
import { sanitizeHtml } from "@/lib/content";
import { locales, type Locale } from "@/lib/i18n";
import { buildPostUrls } from "@/lib/indexer";
import { submitUrlsForIndexing } from "@/lib/seo-sync";
import { db } from "@/lib/db/index";
import { getPostById, getPostBySlug, publishPostById, updatePost, upsertTranslation } from "@/lib/db/posts";

type TRow = {
  locale: Locale;
  title: string;
  excerpt: string | null;
  content_html: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
};

const candidatasPath = (slug: string) => `/tmp/capas-${slug}.json`;

function idDoSlug(slug: string): number {
  const row = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!row) throw new Error(`Post não encontrado: ${slug}`);
  return row.id;
}

/** Autor dos posts do blog: o mesmo dos publicados mais recentes. */
function autorPadrao(): number | null {
  const row = db
    .prepare("SELECT author_id FROM posts WHERE author_id IS NOT NULL ORDER BY created_at DESC LIMIT 1")
    .get() as { author_id: number } | undefined;
  return row?.author_id ?? null;
}

/**
 * O Gemini do plano gratuito devolve 503 ("high demand") e 429 com frequência. É
 * passageiro: esperar e repetir resolve, e desistir no primeiro erro deixava o post
 * sem tradução no meio do lote.
 */
async function comRetentativa<T>(rotulo: string, fn: () => Promise<T>, tentativas = 6): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const passageiro = /\b(503|429|500)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|fetch failed|JSON/i.test(msg);
      if (!passageiro || i >= tentativas) throw err;
      const espera = 30 * i;
      console.log(`${rotulo}: Gemini indisponível (tentativa ${i}/${tentativas}), nova tentativa em ${espera}s`);
      await new Promise((r) => setTimeout(r, espera * 1000));
    }
  }
}

function lerLote(arquivos: string[]): unknown[] {
  return arquivos.map((f) => JSON.parse(readFileSync(f, "utf8")));
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "validar":
    case "importar": {
      const lote = lerLote(args);
      const v = validatePostsJson(lote);
      if (!v.ok) {
        console.log(JSON.stringify(v.errors, null, 2));
        process.exit(1);
      }
      console.log(`validação OK: ${v.posts.length} post(s)`);
      if (cmd === "validar") return;
      const r = await importPosts(v.posts, autorPadrao(), { autoCover: false });
      console.log(JSON.stringify({ ok: r.ok, created: r.created, errors: r.errors }, null, 2));
      if (!r.ok) process.exit(1);
      return;
    }

    case "capa-buscar": {
      const [slug, busca] = args;
      idDoSlug(slug);
      const r = await searchUnsplash(busca, 6);
      if (!r.ok || !r.photos?.length) throw new Error(r.error ?? "sem resultados");
      writeFileSync(candidatasPath(slug), JSON.stringify(r.photos));
      r.photos.forEach((p, i) =>
        console.log(`${i}\t${p.width}x${p.height}\t${p.thumb_url ?? ""}\t${(p.alt_description ?? p.description ?? "").slice(0, 90)}`),
      );
      return;
    }

    case "capa-aplicar": {
      const [slug, n] = args;
      const id = idDoSlug(slug);
      if (!existsSync(candidatasPath(slug))) throw new Error("rode capa-buscar antes");
      const fotos = JSON.parse(readFileSync(candidatasPath(slug), "utf8"));
      const foto = fotos[Number(n)];
      if (!foto) throw new Error(`candidata ${n} não existe`);
      const buffer = await fetchImageBuffer(foto.download_url);
      const img = await processImageToWebp(buffer, { postSlug: slug, originalName: "unsplash.jpg", kind: "post" });
      void trackDownload(foto.download_location); // exigido pelos termos do Unsplash
      updatePost(id, { cover_image: img.path_large });
      console.log(`${slug}: capa ${img.path_large} (foto de ${foto.photographer?.name ?? "?"} no Unsplash)`);
      return;
    }

    case "traduzir": {
      // Mesma lógica de translatePostsBulkAction: só cria o idioma que falta, e o en-GB
      // é gerado depois do en-US para divergir dele (senão o Google trata como duplicata).
      for (const slug of args) {
        const id = idDoSlug(slug);
        const detail = getPostById(id)!;
        const post = detail.post as { source_locale: Locale };
        const trads = detail.translations as TRow[];
        const origem = trads.find((t) => t.locale === post.source_locale)!;
        const irmaos = trads.map((t) => ({ locale: t.locale, title: t.title, meta_title: t.meta_title, meta_description: t.meta_description }));
        for (const alvo of locales.filter((l) => l !== post.source_locale)) {
          if (trads.some((t) => t.locale === alvo)) {
            console.log(`${slug} ${alvo}: já existe`);
            continue;
          }
          const irmaoLocale = alvo === "en-GB" ? "en-US" : alvo === "en-US" ? "en-GB" : null;
          const irmao = irmaoLocale ? irmaos.find((r) => r.locale === irmaoLocale) : undefined;
          const t = await comRetentativa(`${slug} ${alvo}`, () => translatePostDistinct(
            post.source_locale,
            alvo,
            {
              title: origem.title,
              excerpt: origem.excerpt,
              content_html: origem.content_html,
              meta_title: origem.meta_title,
              meta_description: origem.meta_description,
              og_title: origem.og_title,
              og_description: origem.og_description,
            },
            { avoidSibling: irmao ? { locale: irmao.locale, title: irmao.title, metaTitle: irmao.meta_title, metaDescription: irmao.meta_description } : null },
          ));
          upsertTranslation(id, {
            locale: alvo,
            title: t.title,
            excerpt: t.excerpt,
            content_html: sanitizeHtml(t.content_html),
            meta_title: t.meta_title,
            meta_description: t.meta_description,
            og_title: t.og_title,
            og_description: t.og_description,
            translation_source: "ai-gemini",
          });
          irmaos.push({ locale: alvo, title: t.title, meta_title: t.meta_title, meta_description: t.meta_description });
          console.log(`${slug} ${alvo}: ${t.title}`);
        }
      }
      return;
    }

    case "publicar": {
      for (const slug of args) {
        const id = idDoSlug(slug);
        const ok = publishPostById(id);
        const detail = getPostById(id)!;
        const urls = buildPostUrls(slug, (detail.translations as TRow[]).map((t) => t.locale));
        const sync = await submitUrlsForIndexing(urls);
        console.log(`${slug}: ${ok ? "publicado" : "já estava publicado"} · ${urls.length} URL(s) avisadas${sync.errors.length ? " · " + sync.errors.join(" | ") : ""}`);
      }
      return;
    }

    case "status": {
      for (const slug of args) {
        const p = getPostBySlug(slug, "pt-BR" as Locale) as unknown as Record<string, unknown> | undefined;
        const id = idDoSlug(slug);
        const langs = (getPostById(id)!.translations as TRow[]).map((t) => t.locale).join(",");
        console.log(`${slug}\t${(p?.status as string) ?? "?"}\t${(p?.cover_image as string) ?? "sem capa"}\t${langs}`);
      }
      return;
    }

    default:
      console.log("comandos: validar | importar | capa-buscar | capa-aplicar | traduzir | publicar | status");
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
