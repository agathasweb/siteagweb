import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

function getLocaleFromHost(host: string | null): string {
  if (!host) return DEFAULT_LOCALE;
  const cleanHost = host.split(":")[0].toLowerCase();
  return DOMAIN_TO_LOCALE[cleanHost] ?? DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1];
  if (LOCALES.has(firstSegment)) {
    return NextResponse.next();
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const locale = getLocaleFromHost(host);

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.rewrite(url);
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|.*\\..*).*)",
  ],
};
