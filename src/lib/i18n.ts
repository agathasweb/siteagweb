import "server-only";
import type { Metadata } from "next";

export const locales = ["pt-BR", "es", "en-US", "en-GB"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export const localeToDomain: Record<Locale, string> = {
  "pt-BR": "agathas.com.br",
  es: "agathas.es",
  "en-US": "agathasweb.com",
  "en-GB": "uk.agathasweb.com",
};

export const domainToLocale: Record<string, Locale> = {
  "agathas.com.br": "pt-BR",
  "www.agathas.com.br": "pt-BR",
  "agathas.es": "es",
  "www.agathas.es": "es",
  "agathasweb.com": "en-US",
  "www.agathasweb.com": "en-US",
  "uk.agathasweb.com": "en-GB",
};

export const htmlLangAttr: Record<Locale, string> = {
  "pt-BR": "pt-BR",
  es: "es-ES",
  "en-US": "en-US",
  "en-GB": "en-GB",
};

export const openGraphLocale: Record<Locale, string> = {
  "pt-BR": "pt_BR",
  es: "es_ES",
  "en-US": "en_US",
  "en-GB": "en_GB",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleFromHost(host: string | null | undefined): Locale {
  if (!host) return defaultLocale;
  const cleanHost = host.split(":")[0].toLowerCase();
  return domainToLocale[cleanHost] ?? defaultLocale;
}

export function getOriginForLocale(locale: Locale): string {
  return `https://${localeToDomain[locale]}`;
}

export function buildHreflangAlternates(path: string): Record<string, string> {
  const normalizedPath = path === "/" ? "" : path.replace(/\/$/, "");
  return {
    "pt-BR": `${getOriginForLocale("pt-BR")}${normalizedPath || "/"}`,
    "es-ES": `${getOriginForLocale("es")}${normalizedPath || "/"}`,
    "en-US": `${getOriginForLocale("en-US")}${normalizedPath || "/"}`,
    "en-GB": `${getOriginForLocale("en-GB")}${normalizedPath || "/"}`,
    "x-default": `${getOriginForLocale("pt-BR")}${normalizedPath || "/"}`,
  };
}

// Nome público do site por locale (espelha dict.common.siteName) — usado em
// og:site_name quando montamos metadados fora do contexto do dicionário.
export const siteNameByLocale: Record<Locale, string> = {
  "pt-BR": "Agathas Web Brasil",
  es: "Agathas Web España",
  "en-US": "Agathas Web USA",
  "en-GB": "Agathas Web UK",
};

const TWITTER_HANDLE = "@agathasweb";

type PageMetadataInput = {
  lang: Locale;
  /** Caminho da página relativo ao domínio (ex.: "/privacidade"; raiz = "/"). */
  path: string;
  title: string;
  description: string;
  /** Imagem OG relativa ao origin (ou URL absoluta). Default: og-image-home. */
  ogImagePath?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  /** Canônica explícita (paginação, tag→categoria etc.). Default: origin+path. */
  canonical?: string;
  /** Caminho usado para hreflang quando difere de `path`. */
  hreflangPath?: string;
};

// Monta metadados completos da PÁGINA (title, description, canonical/hreflang,
// Open Graph e Twitter Card). O Next faz merge raso: se a página não define
// `openGraph`, herda o do layout — e og:url/og:title/og:description ficam os da
// home. Por isso cada página precisa declarar seu próprio bloco OG; este helper
// centraliza isso para manter consistência entre as 4 propriedades.
export function buildPageMetadata({
  lang,
  path,
  title,
  description,
  ogImagePath = "/assets/og-image-home.png",
  ogType = "website",
  noindex,
  canonical,
  hreflangPath,
}: PageMetadataInput): Metadata {
  const origin = getOriginForLocale(lang);
  const url = canonical ?? `${origin}${path}`;
  const ogImage = ogImagePath.startsWith("http") ? ogImagePath : `${origin}${ogImagePath}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildHreflangAlternates(hreflangPath ?? path),
    },
    openGraph: {
      type: ogType,
      locale: openGraphLocale[lang],
      url,
      siteName: siteNameByLocale[lang],
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title,
      description,
      images: [ogImage],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
