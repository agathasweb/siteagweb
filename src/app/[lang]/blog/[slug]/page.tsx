import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  htmlLangAttr,
  locales,
  type Locale,
} from "@/lib/i18n";
import { getPostBySlug, listPublishedSlugs } from "@/lib/db/posts";

export async function generateStaticParams() {
  const rows = listPublishedSlugs();
  return rows.map((row) => ({ lang: row.locale, slug: row.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = getPostBySlug(slug, lang);
  if (!post) return {};
  const origin = getOriginForLocale(lang);
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: {
      canonical: `${origin}/blog/${post.slug}`,
      languages: buildHreflangAlternates(`/blog/${post.slug}`),
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
      publishedTime: post.published_at ?? undefined,
    },
  };
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(htmlLangAttr[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function BlogPostPage({
  params,
}: PageProps<"/[lang]/blog/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  if (!locales.includes(lang as Locale)) notFound();

  const post = getPostBySlug(slug, lang);
  if (!post) notFound();

  const dict = await getDictionary(lang);
  const t = dict.pages.blog;

  return (
    <main id="main-content" role="main">
      <article className="bg-voyia-dark">
        <header className="relative bg-black py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
          <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
            {post.published_at && (
              <time
                dateTime={post.published_at}
                className="text-xs uppercase tracking-wide text-voyia-blue font-semibold"
              >
                {t.publishedOn} {formatDate(post.published_at, lang)}
              </time>
            )}
            <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                {post.excerpt}
              </p>
            )}
          </div>
        </header>

        {post.cover_image && (
          <div className="relative mx-auto max-w-5xl px-6 lg:px-8 -mt-12">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 bg-black">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
          <PostContent html={post.content_html} />
          <div className="mt-16 pt-8 border-t border-gray-700">
            <Link
              href="/blog"
              className="inline-flex items-center text-voyia-blue hover:text-purple-300 font-semibold transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {dict.common.viewAll}
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

function PostContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-voyia-blue hover:prose-a:text-purple-300 prose-strong:text-white"
      // Conteúdo HTML vem do admin autenticado; sanitização no write será adicionada na Fase 5.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {...{ dangerouslySetInnerHTML: { __html: html } }}
    />
  );
}
