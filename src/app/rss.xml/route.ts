import { headers } from "next/headers";
import { listPublishedPosts } from "@/lib/db/posts";
import {
  getLocaleFromHost,
  getOriginForLocale,
  htmlLangAttr,
} from "@/lib/i18n";

export const runtime = "nodejs";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);
  const language = htmlLangAttr[locale];

  const posts = listPublishedPosts(locale).slice(0, 50);

  const items = posts
    .map((post) => {
      const url = `${origin}/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date(post.updated_at).toUTCString();
      return `
    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.excerpt ? `<description>${escape(post.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Agathas Web — Blog</title>
    <link>${origin}/blog</link>
    <description>Artigos sobre tecnologia, Moodle, marketing digital e desenvolvimento web.</description>
    <language>${language}</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}
