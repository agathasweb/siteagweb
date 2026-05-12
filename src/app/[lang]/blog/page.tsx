import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  htmlLangAttr,
  type Locale,
} from "@/lib/i18n";
import { listPublishedPosts } from "@/lib/db/posts";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  return {
    title: dict.pages.blog.metadata.title,
    description: dict.pages.blog.metadata.description,
    alternates: {
      canonical: `${origin}/blog`,
      languages: buildHreflangAlternates("/blog"),
    },
  };
}

function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(htmlLangAttr[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function BlogPage({
  params,
}: PageProps<"/[lang]/blog">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.pages.blog;
  const posts = listPublishedPosts(lang);

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t.hero.titlePrefix}{" "}
            <span className="text-voyia-blue">{t.hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">
            {t.hero.lead}
          </p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center">
              <div className="bg-voyia-gray rounded-2xl p-12 border border-gray-700 max-w-2xl mx-auto">
                <span className="text-6xl mb-6 block">📝</span>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t.comingSoon.title}
                </h2>
                <p className="text-gray-300">{t.comingSoon.body}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)]"
                >
                  {post.cover_image && (
                    <div className="relative aspect-video bg-black/40">
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.published_at && (
                      <time
                        dateTime={post.published_at}
                        className="text-xs uppercase tracking-wide text-voyia-blue font-semibold"
                      >
                        {formatDate(post.published_at, lang)}
                      </time>
                    )}
                    <h2 className="text-xl font-semibold text-white mt-2 mb-3">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                    )}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-voyia-blue hover:text-purple-300 text-sm font-semibold transition-colors"
                    >
                      {t.readMore}
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
