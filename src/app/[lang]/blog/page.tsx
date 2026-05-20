import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  type Locale,
} from "@/lib/i18n";
import {
  listPublishedPostsForBlog,
  listFeaturedPostsForBlog,
  listCategoriesWithPostCount,
  listPopularTags,
} from "@/lib/db/posts";
import BlogSearchBox from "@/components/blog/BlogSearchBox";
import CategoryChips from "@/components/blog/CategoryChips";
import PostCard from "@/components/blog/PostCard";
import TagCloud from "@/components/blog/TagCloud";
import RecentPostsList from "@/components/blog/RecentPostsList";
import BlogPagination from "@/components/blog/BlogPagination";
import JsonLd from "@/components/JsonLd";

const PAGE_SIZE = 9;

// Strings inline (4 locales) — manter aqui evita inflar os dicts em 4 arquivos
// só pelas seções novas da landing /blog. Pode migrar pra dict depois se quiser.
const STRINGS: Record<Locale, {
  searchPlaceholder: string;
  searchAria: string;
  categories: string;
  featured: string;
  latestPosts: string;
  popularTags: string;
  recentPosts: string;
  pageX: (n: number) => string;
  prev: string;
  next: string;
  pageNav: string;
  rssTitle: string;
}> = {
  "pt-BR": {
    searchPlaceholder: "Buscar no blog…",
    searchAria: "Buscar artigos",
    categories: "Categorias",
    featured: "Em destaque",
    latestPosts: "Últimos artigos",
    popularTags: "Tags populares",
    recentPosts: "Posts recentes",
    pageX: (n) => `Página ${n}`,
    prev: "Anterior",
    next: "Próximo",
    pageNav: "Paginação",
    rssTitle: "Feed RSS do blog",
  },
  es: {
    searchPlaceholder: "Buscar en el blog…",
    searchAria: "Buscar artículos",
    categories: "Categorías",
    featured: "Destacados",
    latestPosts: "Últimos artículos",
    popularTags: "Tags populares",
    recentPosts: "Posts recientes",
    pageX: (n) => `Página ${n}`,
    prev: "Anterior",
    next: "Siguiente",
    pageNav: "Paginación",
    rssTitle: "Feed RSS del blog",
  },
  "en-US": {
    searchPlaceholder: "Search the blog…",
    searchAria: "Search articles",
    categories: "Categories",
    featured: "Featured",
    latestPosts: "Latest articles",
    popularTags: "Popular tags",
    recentPosts: "Recent posts",
    pageX: (n) => `Page ${n}`,
    prev: "Previous",
    next: "Next",
    pageNav: "Pagination",
    rssTitle: "Blog RSS feed",
  },
  "en-GB": {
    searchPlaceholder: "Search the blog…",
    searchAria: "Search articles",
    categories: "Categories",
    featured: "Featured",
    latestPosts: "Latest articles",
    popularTags: "Popular tags",
    recentPosts: "Recent posts",
    pageX: (n) => `Page ${n}`,
    prev: "Previous",
    next: "Next",
    pageNav: "Pagination",
    rssTitle: "Blog RSS feed",
  },
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  const s = STRINGS[lang];
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);
  const path = pageNum > 1 ? `/blog?page=${pageNum}` : `/blog`;
  return {
    title:
      pageNum > 1
        ? `${dict.pages.blog.metadata.title} — ${s.pageX(pageNum)}`
        : dict.pages.blog.metadata.title,
    description: dict.pages.blog.metadata.description,
    alternates: {
      canonical: `${origin}${path}`,
      languages: buildHreflangAlternates("/blog"),
      types: {
        "application/rss+xml": `${origin}/blog/feed.xml`,
      },
    },
    robots: pageNum > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: PageProps<"/[lang]/blog">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.pages.blog;
  const s = STRINGS[lang];
  const origin = getOriginForLocale(lang);

  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);
  const isFirstPage = pageNum === 1;

  // Featured só na página 1
  const featured = isFirstPage ? listFeaturedPostsForBlog(lang, 2) : [];
  const latest = listPublishedPostsForBlog(lang, pageNum, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(latest.total / PAGE_SIZE));
  const categories = isFirstPage ? listCategoriesWithPostCount(lang) : [];
  const tags = listPopularTags(lang, 30);
  // Sidebar "recentes" = top 5 (sempre da página 1, não da página atual)
  const recent = isFirstPage
    ? latest.items.slice(0, 5)
    : listPublishedPostsForBlog(lang, 1, 5).items;

  const hasAnyPosts = featured.length > 0 || latest.items.length > 0;

  // JSON-LD ItemList — ajuda rich results na SERP
  const itemListJsonLd = hasAnyPosts
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: dict.pages.blog.metadata.title,
        itemListElement: [...featured, ...latest.items].map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${origin}/blog/${p.slug}`,
          name: p.title,
        })),
      }
    : null;

  return (
    <main id="main-content" role="main">
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}

      {/* Hero com busca */}
      <section className="relative overflow-hidden bg-black py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 30% 20%, rgba(147,51,234,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(34,197,94,0.1), transparent 45%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">
            {t.hero.titlePrefix}{" "}
            <span className="text-voyia-blue">{t.hero.titleHighlight}</span>
          </h1>
          <p className="text-lg leading-8 text-gray-300 max-w-2xl mx-auto mb-8">
            {t.hero.lead}
          </p>
          <BlogSearchBox placeholder={s.searchPlaceholder} ariaLabel={s.searchAria} />
        </div>
      </section>

      {/* Categorias — só na página 1 (em pages 2+, redundante e ruim pra SEO) */}
      {isFirstPage && <CategoryChips categories={categories} heading={s.categories} />}

      {/* Empty state */}
      {!hasAnyPosts ? (
        <section className="py-24 bg-voyia-dark">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <div className="bg-voyia-gray rounded-2xl p-12 border border-gray-700 max-w-2xl mx-auto">
              <span className="text-6xl mb-6 block">📝</span>
              <h2 className="text-2xl font-bold text-white mb-4">{t.comingSoon.title}</h2>
              <p className="text-gray-300">{t.comingSoon.body}</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && (
            <section className="py-12 bg-voyia-dark">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span> {s.featured}
                </h2>
                <div className={`grid gap-6 ${featured.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                  {featured.map((p) => (
                    <PostCard key={p.id} post={p} locale={lang} variant="featured" />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Layout 2-col: Últimos posts + Sidebar */}
          <section className="py-12 bg-voyia-dark">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna principal */}
                <div className="lg:col-span-2">
                  <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-white">{s.latestPosts}</h2>
                    {totalPages > 1 && (
                      <span className="text-sm text-gray-400">
                        {s.pageX(pageNum)} / {totalPages}
                      </span>
                    )}
                  </div>
                  {latest.items.length === 0 ? (
                    <p className="text-gray-400">—</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {latest.items.map((p) => (
                          <PostCard key={p.id} post={p} locale={lang} />
                        ))}
                      </div>
                      <BlogPagination
                        currentPage={pageNum}
                        totalPages={totalPages}
                        basePath="/blog"
                        labels={{ previous: s.prev, next: s.next, page: s.pageNav }}
                      />
                    </>
                  )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                  {recent.length > 0 && (
                    <RecentPostsList posts={recent} locale={lang} heading={s.recentPosts} />
                  )}
                  {tags.length > 0 && (
                    <TagCloud tags={tags} heading={s.popularTags} />
                  )}
                </aside>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
