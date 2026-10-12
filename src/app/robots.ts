import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getLocaleFromHost, getOriginForLocale } from "@/lib/i18n";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);

  // Robôs de busca e de resposta das IAs nomeados de propósito: ser lido e
  // citado pelo ChatGPT/Claude/Perplexity/Gemini/Copilot é canal de venda (o
  // ChatGPT trouxe 3 leads do Voyia em 8 visitas em out/2026, contra 0 do pago).
  // Quem casa com um grupo próprio ignora o "*", então o disallow se repete.
  // ⚠️ Em agathas.es o Cloudflare responde 403 ao GPTBot e ao ClaudeBot
  // ANTES do robots — a liberação de lá é no painel do Cloudflare.
  const disallow = ["/admin/", "/api/", "/blog/busca"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "Claude-SearchBot",
          "Claude-User",
          "ClaudeBot",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "bingbot",
          "DuckAssistBot",
          "meta-externalagent",
        ],
        allow: ["/", "/llms.txt", "/pricing.md"],
        disallow,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
