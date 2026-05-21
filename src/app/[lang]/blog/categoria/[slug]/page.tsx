import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "../../../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
} from "@/lib/i18n";
import {
  getCategoryBySlug,
  listPostsByCategory,
} from "@/lib/db/posts";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/blog/PostCard";

const PAGE_SIZE = 12;

// Renderizado sob demanda — o build roda em dev; SSG congelaria o banco de dev.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/blog/categoria/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const category = getCategoryBySlug(slug, lang);
  if (!category) return {};
  const origin = getOriginForLocale(lang);
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);
  const path = `/blog/categoria/${slug}`;
  const canonical = `${origin}${path}${pageNum > 1 ? `?page=${pageNum}` : ""}`;
  return {
    title: `${category.name} | Blog Agathas Web`,
    description: category.description ?? `Todos os posts na categoria ${category.name}.`,
    alternates: {
      canonical,
      languages: buildHreflangAlternates(path),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[lang]/blog/categoria/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const category = getCategoryBySlug(slug, lang);
  if (!category) notFound();

  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);
  const result = listPostsByCategory(slug, lang, pageNum, PAGE_SIZE);
  const dict = await getDictionary(lang);
  const t = dict.pages.blog;
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const origin = getOriginForLocale(lang);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: lang === "pt-BR" ? "Início" : "Home", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: t.hero.titleHighlight, item: `${origin}/blog` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${origin}/blog/categoria/${slug}` },
    ],
  };

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">{lang === "pt-BR" ? "Início" : "Home"}</Link>
            <span className="mx-2">›</span>
            <Link href="/blog" className="hover:text-white">{t.hero.titleHighlight}</Link>
            <span className="mx-2">›</span>
            <span className="text-voyia-blue">{category.name}</span>
          </nav>
          <span
            className="inline-block w-12 h-1 rounded-full mb-4"
            style={{ backgroundColor: category.color ?? "#9333ea" }}
            aria-hidden="true"
          />
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            {result.total}{" "}
            {result.total === 1 ? "post" : "posts"}
          </p>
        </div>
      </section>

      <section className="py-16 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {result.items.length === 0 ? (
            <p className="text-center text-gray-400">
              {lang === "pt-BR"
                ? "Nenhum post nesta categoria ainda."
                : lang === "es"
                  ? "Aún no hay posts en esta categoría."
                  : "No posts in this category yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.items.map((post) => (
                <PostCard key={post.id} post={post} locale={lang} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginação">
              {pageNum > 1 && (
                <Link
                  href={`/blog/categoria/${slug}${pageNum - 1 > 1 ? `?page=${pageNum - 1}` : ""}`}
                  className="px-4 py-2 bg-voyia-gray border border-gray-700 rounded text-white text-sm hover:bg-voyia-gray/80"
                  rel="prev"
                >
                  ← {lang === "pt-BR" ? "Anterior" : lang === "es" ? "Anterior" : "Previous"}
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-400">
                {pageNum} / {totalPages}
              </span>
              {pageNum < totalPages && (
                <Link
                  href={`/blog/categoria/${slug}?page=${pageNum + 1}`}
                  className="px-4 py-2 bg-voyia-gray border border-gray-700 rounded text-white text-sm hover:bg-voyia-gray/80"
                  rel="next"
                >
                  {lang === "pt-BR" ? "Próxima" : lang === "es" ? "Siguiente" : "Next"} →
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      <JsonLd data={breadcrumbSchema} />
    </main>
  );
}
