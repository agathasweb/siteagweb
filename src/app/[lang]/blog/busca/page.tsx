import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  htmlLangAttr,
  type Locale,
} from "@/lib/i18n";
import { searchPosts } from "@/lib/db/posts";
import JsonLd from "@/components/JsonLd";

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/busca">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const origin = getOriginForLocale(lang);
  const title =
    lang === "pt-BR"
      ? "Busca | Blog Agathas Web"
      : lang === "es"
        ? "Búsqueda | Blog Agathas Web"
        : "Search | Blog Agathas Web";
  return {
    title,
    alternates: {
      canonical: `${origin}/blog/busca`,
      languages: buildHreflangAlternates("/blog/busca"),
    },
    robots: { index: false },
  };
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(htmlLangAttr[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

// Permite apenas <mark> do snippet FTS5; todo o resto é escaped.
function sanitizeSnippet(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}

const labels = {
  heading: { "pt-BR": "Busca", es: "Búsqueda", "en-US": "Search", "en-GB": "Search" },
  placeholder: { "pt-BR": "Pesquisar posts…", es: "Buscar posts…", "en-US": "Search posts…", "en-GB": "Search posts…" },
  button: { "pt-BR": "Buscar", es: "Buscar", "en-US": "Search", "en-GB": "Search" },
  results: { "pt-BR": "resultado(s) para", es: "resultado(s) para", "en-US": "result(s) for", "en-GB": "result(s) for" },
  empty: { "pt-BR": "Nenhum resultado encontrado.", es: "No se encontraron resultados.", "en-US": "No results found.", "en-GB": "No results found." },
  prev: { "pt-BR": "Anterior", es: "Anterior", "en-US": "Previous", "en-GB": "Previous" },
  next: { "pt-BR": "Próxima", es: "Siguiente", "en-US": "Next", "en-GB": "Next" },
  readMore: { "pt-BR": "Ler mais", es: "Leer más", "en-US": "Read more", "en-GB": "Read more" },
  home: { "pt-BR": "Início", es: "Inicio", "en-US": "Home", "en-GB": "Home" },
  blog: { "pt-BR": "Blog", es: "Blog", "en-US": "Blog", "en-GB": "Blog" },
} as const;

type LabelKey = keyof typeof labels;
function tl(key: LabelKey, lang: Locale): string {
  return (labels[key] as Record<string, string>)[lang] ?? (labels[key] as Record<string, string>)["en-US"];
}

export default async function BuscaPage({
  params,
  searchParams,
}: PageProps<"/[lang]/blog/busca">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const pageNum = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);

  const result = query ? searchPosts(lang, query, pageNum, PAGE_SIZE) : null;
  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  const origin = getOriginForLocale(lang);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tl("home", lang), item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: tl("blog", lang), item: `${origin}/blog` },
      { "@type": "ListItem", position: 3, name: tl("heading", lang), item: `${origin}/blog/busca` },
    ],
  };

  const buildUrl = (p: number) =>
    `/blog/busca?q=${encodeURIComponent(query)}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">{tl("home", lang)}</Link>
            <span className="mx-2">›</span>
            <Link href="/blog" className="hover:text-white">{tl("blog", lang)}</Link>
            <span className="mx-2">›</span>
            <span className="text-voyia-blue">{tl("heading", lang)}</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-8">
            {tl("heading", lang)}
          </h1>

          <form method="get" action={`/${lang}/blog/busca`} className="flex gap-2 max-w-xl mx-auto">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={tl("placeholder", lang)}
              className="flex-1 rounded-xl border border-gray-700 bg-voyia-gray px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-voyia-blue text-sm"
              autoFocus
              aria-label={tl("placeholder", lang)}
            />
            <button
              type="submit"
              className="rounded-xl bg-voyia-blue px-5 py-3 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
            >
              {tl("button", lang)}
            </button>
          </form>

          {query && result && (
            <p className="mt-4 text-sm text-gray-400">
              {result.total} {tl("results", lang)} &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </section>

      {result && (
        <section className="py-12 bg-voyia-dark">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            {result.items.length === 0 ? (
              <p className="text-center text-gray-400">{tl("empty", lang)}</p>
            ) : (
              <ul className="space-y-6">
                {result.items.map((post) => (
                  <li key={post.id}>
                    <article className="flex gap-5 bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 p-5">
                      {post.cover_image && (
                        <div className="relative w-32 shrink-0 rounded-xl overflow-hidden bg-black/40">
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            unoptimized
                            sizes="128px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {post.published_at && (
                          <time className="text-xs uppercase tracking-wide text-voyia-blue font-semibold">
                            {formatDate(post.published_at, lang)}
                          </time>
                        )}
                        <h2 className="text-base font-semibold text-white mt-1 mb-1 line-clamp-2">
                          {post.title}
                        </h2>
                        {post.snippet && (
                          <p
                            className="text-sm text-gray-400 line-clamp-2 mb-3 [&_mark]:bg-purple-500/30 [&_mark]:text-purple-200 [&_mark]:rounded [&_mark]:px-0.5"
                            dangerouslySetInnerHTML={{ __html: sanitizeSnippet(post.snippet) }}
                          />
                        )}
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-sm text-voyia-blue hover:text-purple-300 font-semibold"
                        >
                          {tl("readMore", lang)} →
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginação">
                {pageNum > 1 && (
                  <Link
                    href={buildUrl(pageNum - 1)}
                    className="px-4 py-2 bg-voyia-gray border border-gray-700 rounded text-white text-sm hover:bg-voyia-gray/80"
                    rel="prev"
                  >
                    ← {tl("prev", lang)}
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-400">
                  {pageNum} / {totalPages}
                </span>
                {pageNum < totalPages && (
                  <Link
                    href={buildUrl(pageNum + 1)}
                    className="px-4 py-2 bg-voyia-gray border border-gray-700 rounded text-white text-sm hover:bg-voyia-gray/80"
                    rel="next"
                  >
                    {tl("next", lang)} →
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>
      )}

      <JsonLd data={breadcrumbSchema} />
    </main>
  );
}
