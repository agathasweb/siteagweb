import "server-only";

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
