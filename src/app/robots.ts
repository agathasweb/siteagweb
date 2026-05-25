import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getLocaleFromHost, getOriginForLocale } from "@/lib/i18n";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);

  // GPTBot/ClaudeBot/Google-Extended caem na regra User-agent: * por padrão.
  // Em agathas.es, Cloudflare prepend bloqueia explicitamente AI bots — não
  // duplicamos aqui pra evitar conflito (Allow vs Disallow do mesmo bot).
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/blog/busca"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
