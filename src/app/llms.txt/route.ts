import { headers } from "next/headers";
import { buildLlmsTxt } from "@/lib/ai-context";
import { getLocaleFromHost } from "@/lib/i18n";

export const runtime = "nodejs";

// Ver src/lib/ai-context.ts. O domínio define o idioma, como no robots e no RSS.
export async function GET() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const body = await buildLlmsTxt(getLocaleFromHost(host));
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
