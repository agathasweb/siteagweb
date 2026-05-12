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
  openGraphLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { getPostBySlug, listPublishedSlugs, type PostDetail } from "@/lib/db/posts";
import { listPostTags, listPostFaqs } from "@/lib/db/taxonomy";

export async function generateStaticParams() {
  const rows = listPublishedSlugs();
  return rows.map((row) => ({ lang: row.locale, slug: row.slug }));
}

export const dynamicParams = true;

function isoDurationFromSeconds(sec: number | null | undefined): string | undefined {
  if (!sec || sec <= 0) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = ["PT"];
  if (h) parts.push(`${h}H`);
  if (m) parts.push(`${m}M`);
  if (s || (!h && !m)) parts.push(`${s}S`);
  return parts.join("");
}

function buildRobots(post: PostDetail): Metadata["robots"] {
  const noindex = post.noindex === 1;
  const nofollow = post.nofollow === 1;
  return {
    index: !noindex,
    follow: !nofollow,
    googleBot: {
      index: !noindex,
      follow: !nofollow,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = getPostBySlug(slug, lang);
  if (!post) return {};
  const origin = getOriginForLocale(lang);
  const canonical = post.canonical_url ?? `${origin}/blog/${post.slug}`;
  const ogImageUrl = post.cover_image
    ? post.cover_image.startsWith("http")
      ? post.cover_image
      : `${origin}${post.cover_image}`
    : undefined;

  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    robots: buildRobots(post),
    alternates: {
      canonical,
      languages: buildHreflangAlternates(`/blog/${post.slug}`),
    },
    openGraph: {
      type: "article",
      locale: openGraphLocale[lang],
      url: canonical,
      title: post.og_title ?? post.meta_title ?? post.title,
      description: post.og_description ?? post.meta_description ?? post.excerpt ?? undefined,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: post.cover_image_width ?? 1200,
              height: post.cover_image_height ?? 630,
              alt: post.cover_image_alt ?? post.title,
            },
          ]
        : undefined,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
      section: post.category_name ?? undefined,
    },
    twitter: {
      card: post.twitter_card_type,
      site: "@agathasweb",
      creator: "@agathasweb",
      title: post.og_title ?? post.meta_title ?? post.title,
      description: post.og_description ?? post.meta_description ?? post.excerpt ?? undefined,
      images: ogImageUrl ? [ogImageUrl] : undefined,
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

function buildArticleSchema(post: PostDetail, lang: Locale, origin: string) {
  const url = post.canonical_url ?? `${origin}/blog/${post.slug}`;
  const imageUrl = post.cover_image
    ? post.cover_image.startsWith("http")
      ? post.cover_image
      : `${origin}${post.cover_image}`
    : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": post.article_type,
    headline: post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    inLanguage: htmlLangAttr[lang],
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    publisher: {
      "@type": "Organization",
      name: "Agathas Web",
      url: origin,
      logo: {
        "@type": "ImageObject",
        url: `${origin}/assets/logo_white.png`,
        width: 250,
        height: 60,
      },
    },
    wordCount: post.word_count ?? undefined,
    timeRequired: post.reading_time_min ? `PT${post.reading_time_min}M` : undefined,
    keywords: post.focus_keyword ?? undefined,
    articleSection: post.category_name ?? undefined,
  };

  if (post.author_name) {
    schema.author = {
      "@type": "Person",
      name: post.author_name,
      email: post.author_email ?? undefined,
      description: post.author_bio ?? undefined,
      image: post.author_avatar ?? undefined,
    };
  } else {
    schema.author = { "@type": "Organization", name: "Agathas Web", url: origin };
  }

  if (imageUrl) {
    schema.image = {
      "@type": "ImageObject",
      url: imageUrl,
      width: post.cover_image_width ?? undefined,
      height: post.cover_image_height ?? undefined,
    };
  }

  return schema;
}

function buildBreadcrumbSchema(post: PostDetail, lang: Locale, origin: string, dictBlog: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: htmlLangAttr[lang] === "pt-BR" ? "Início" : "Home", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: dictBlog, item: `${origin}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${origin}/blog/${post.slug}` },
    ],
  };
}

function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

function buildVideoSchema(post: PostDetail) {
  if (!post.video_url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.title,
    description: post.meta_description ?? post.excerpt ?? post.title,
    thumbnailUrl: post.video_thumbnail ?? post.cover_image ?? undefined,
    uploadDate: post.published_at ?? post.created_at,
    duration: isoDurationFromSeconds(post.video_duration_sec),
    embedUrl: post.video_url,
  };
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
  const origin = getOriginForLocale(lang);
  const tags = listPostTags(post.id);
  const faqs = listPostFaqs(post.id, lang);

  const schemas = [
    buildArticleSchema(post, lang, origin),
    buildBreadcrumbSchema(post, lang, origin, t.hero.titleHighlight),
    buildFaqSchema(faqs),
    buildVideoSchema(post),
  ].filter(Boolean);

  return (
    <main id="main-content" role="main">
      <article className="bg-voyia-dark">
        <header className="relative bg-black py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
          <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs text-gray-400">
              <ol className="inline-flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-white">{lang === "pt-BR" ? "Início" : "Home"}</Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href="/blog" className="hover:text-white">{t.hero.titleHighlight}</Link>
                </li>
                {post.category_name && (
                  <>
                    <li aria-hidden="true">›</li>
                    <li className="text-voyia-blue">{post.category_name}</li>
                  </>
                )}
              </ol>
            </nav>

            {post.published_at && (
              <time
                dateTime={post.published_at}
                className="text-xs uppercase tracking-wide text-voyia-blue font-semibold"
              >
                {t.publishedOn} {formatDate(post.published_at, lang)}
                {post.reading_time_min ? ` · ${post.reading_time_min} min` : ""}
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

            {post.author_name && (
              <p className="mt-6 text-sm text-gray-400">
                {t.byAuthor}{" "}
                <span className="text-white font-medium">{post.author_name}</span>
              </p>
            )}
          </div>
        </header>

        {post.cover_image && (
          <div className="relative mx-auto max-w-5xl px-6 lg:px-8 -mt-12">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 bg-black">
              <Image
                src={post.cover_image}
                alt={post.cover_image_alt ?? post.title}
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

          {faqs.length > 0 && (
            <section className="mt-16 pt-8 border-t border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === "pt-BR" ? "Perguntas frequentes" : lang === "es" ? "Preguntas frecuentes" : "Frequently asked questions"}
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="bg-voyia-gray rounded-lg border border-gray-700 p-4"
                  >
                    <summary className="font-semibold text-white cursor-pointer">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-gray-300 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 bg-voyia-blue/10 border border-voyia-blue/30 text-voyia-blue text-xs rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

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

      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          // JSON.stringify produz string segura; conteúdo vem do DB controlado pelo admin.
          // eslint-disable-next-line @typescript-eslint/naming-convention
          {...{ dangerouslySetInnerHTML: { __html: JSON.stringify(schema) } }}
        />
      ))}
    </main>
  );
}

function PostContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-voyia-blue hover:prose-a:text-purple-300 prose-strong:text-white"
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {...{ dangerouslySetInnerHTML: { __html: html } }}
    />
  );
}
