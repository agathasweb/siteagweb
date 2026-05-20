import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const DOMAIN_TO_LOCALE: Record<string, string> = {
  "agathas.com.br": "pt-BR",
  "www.agathas.com.br": "pt-BR",
  "agathas.es": "es",
  "www.agathas.es": "es",
  "agathasweb.com": "en-US",
  "www.agathasweb.com": "en-US",
  "uk.agathasweb.com": "en-GB",
};

const LOCALES = new Set(["pt-BR", "es", "en-US", "en-GB"]);
const DEFAULT_LOCALE = "pt-BR";
const LOCALE_COOKIE = "NEXT_LOCALE";

function isProdHost(host: string | null): boolean {
  if (!host) return false;
  const cleanHost = host.split(":")[0].toLowerCase();
  return cleanHost in DOMAIN_TO_LOCALE;
}

function getLocaleFromHost(host: string | null): string {
  if (!host) return DEFAULT_LOCALE;
  const cleanHost = host.split(":")[0].toLowerCase();
  return DOMAIN_TO_LOCALE[cleanHost] ?? DEFAULT_LOCALE;
}

function getLocaleFromReferer(referer: string | null, currentHost: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    if (currentHost && url.host.split(":")[0].toLowerCase() !== currentHost.split(":")[0].toLowerCase()) {
      return null;
    }
    const first = url.pathname.split("/")[1];
    return LOCALES.has(first) ? first : null;
  } catch {
    return null;
  }
}

function rewriteLocale(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  // URL já contém o locale no path: apenas atualiza o cookie para
  // que próximas navegações sem prefixo permaneçam no mesmo idioma.
  if (LOCALES.has(firstSegment)) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  }

  // Em produção (um locale por domínio), faz rewrite silencioso
  // mantendo a URL limpa sem prefixo de locale.
  if (isProdHost(host)) {
    const locale = getLocaleFromHost(host);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-locale", locale);
    return response;
  }

  // Hosts de dev/preview (path-mode): redireciona para preservar o locale
  // atual do usuário. Ordem: cookie → referer → fallback.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const refererLocale = getLocaleFromReferer(request.headers.get("referer"), host);
  const locale =
    (cookieLocale && LOCALES.has(cookieLocale) ? cookieLocale : null) ??
    refererLocale ??
    DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url, 307);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export default auth((request) => {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  return rewriteLocale(request as NextRequest);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|.*\\..*).*)",
  ],
};
