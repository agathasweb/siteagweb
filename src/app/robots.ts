import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getLocaleFromHost, getOriginForLocale } from "@/lib/i18n";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/blog/busca"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    // Google/Bing aceitam feeds RSS como "sitemaps" complementares para
    // descoberta rápida de novos posts. Listar os dois cobre ambos os
    // caminhos: sitemap.xml (estrutural) + feed.xml (cronológico).
    sitemap: [`${origin}/sitemap.xml`, `${origin}/blog/feed.xml`],
    host: origin,
  };
}
