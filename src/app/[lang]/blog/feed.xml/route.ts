import { NextResponse } from "next/server";
import { isLocale, getOriginForLocale, htmlLangAttr, type Locale } from "@/lib/i18n";
import { listPublishedPostsForBlog, type BlogCardData } from "@/lib/db/posts";

export const runtime = "nodejs";
// Revalidação a cada 1h — feeds podem ser cachados sem problema
export const revalidate = 3600;

const FEED_LIMIT = 50;

const FEED_TITLE: Record<Locale, string> = {
  "pt-BR": "Blog Agathas Web — Tecnologia, Moodle e Marketing Digital",
  es: "Blog Agathas Web — Tecnología, Moodle y Marketing Digital",
  "en-US": "Agathas Web Blog — Technology, Moodle and Digital Marketing",
  "en-GB": "Agathas Web Blog — Technology, Moodle and Digital Marketing",
};

const FEED_DESC: Record<Locale, string> = {
  "pt-BR": "Artigos, tutoriais e insights sobre desenvolvimento web, Moodle EAD, marketing digital, tráfego pago e tendências de tecnologia.",
  es: "Artículos, tutoriales e insights sobre desarrollo web, Moodle EAD, marketing digital, tráfico pago y tendencias de tecnología.",
  "en-US": "Articles, tutorials and insights about web development, Moodle LMS, digital marketing, paid traffic and technology trends.",
  "en-GB": "Articles, tutorials and insights about web development, Moodle LMS, digital marketing, paid traffic and technology trends.",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(iso: string): string {
  // RSS 2.0 exige RFC-822 (Date.toUTCString já entrega o formato correto)
  return new Date(iso).toUTCString();
}

function buildItem(post: BlogCardData, origin: string): string {
  const url = `${origin}/blog/${post.slug}`;
  const pubDate = post.published_at ? toRfc822(post.published_at) : "";
  const desc = post.excerpt ?? "";
  const author = post.author_name ?? "Agathas Web";
  const category = post.category_name
    ? `<category>${escapeXml(post.category_name)}</category>`
    : "";
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(desc)}</description>
      <dc:creator>${escapeXml(author)}</dc:creator>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${category}
    </item>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ lang: string }> }) {
  const { lang } = await ctx.params;
  if (!isLocale(lang)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const origin = getOriginForLocale(lang);
  const feedUrl = `${origin}/blog/feed.xml`;
  const { items } = listPublishedPostsForBlog(lang, 1, FEED_LIMIT);

  const lastBuildDate = items[0]?.published_at
    ? toRfc822(items[0].published_at)
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE[lang])}</title>
    <link>${escapeXml(`${origin}/blog`)}</link>
    <description>${escapeXml(FEED_DESC[lang])}</description>
    <language>${htmlLangAttr[lang]}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items.map((p) => buildItem(p, origin)).join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
