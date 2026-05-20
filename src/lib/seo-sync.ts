import "server-only";
import { submitToIndexNow, type IndexNowResult } from "@/lib/indexer";
import { pingWebSub, type WebSubResult } from "@/lib/google-websub";
import { locales, localeToDomain, type Locale } from "@/lib/i18n";

export interface SeoSyncResult {
  totalUrls: number;
  indexNow: IndexNowResult | null;
  webSub: WebSubResult | null;
  errors: string[];
}

/**
 * Dispara as URLs em paralelo para todos os engines configurados:
 *  - IndexNow → Bing, Yandex, Naver, Yep, Seznam (instantâneo, sem auth)
 *  - WebSub   → hubs do Google/Superfeedr re-puxam o feed RSS imediatamente,
 *               acelerando o discovery do Googlebot. Sem GCP, sem auth.
 *
 * IndexNow precisa da lista exata de URLs; WebSub só precisa saber que o
 * feed RSS mudou (1 ping por feed cobre todos os posts novos do domínio).
 *
 * Fail-soft: erro em um engine não afeta o outro.
 */
export async function submitUrlsForIndexing(urls: string[]): Promise<SeoSyncResult> {
  const errors: string[] = [];
  if (urls.length === 0) {
    return { totalUrls: 0, indexNow: null, webSub: null, errors: ["Nenhuma URL para indexar."] };
  }

  const unique = Array.from(new Set(urls));

  const [indexNow, webSub] = await Promise.all([
    submitToIndexNow(unique).catch((err): IndexNowResult => ({
      ok: false,
      hosts: [],
      error: err instanceof Error ? err.message : String(err),
    })),
    pingWebSub().catch((err): WebSubResult => ({
      ok: false,
      results: [],
      error: err instanceof Error ? err.message : String(err),
    })),
  ]);

  if (indexNow.error) errors.push(`IndexNow: ${indexNow.error}`);
  if (webSub.error) errors.push(`WebSub: ${webSub.error}`);

  return { totalUrls: unique.length, indexNow, webSub, errors };
}

/**
 * Versão "fire-and-forget" — chama submitUrlsForIndexing sem await.
 * Útil em server actions que não querem bloquear o redirect/response.
 */
export function submitUrlsForIndexingAsync(urls: string[], context: string): void {
  if (urls.length === 0) return;
  void submitUrlsForIndexing(urls)
    .then((result) => {
      if (result.errors.length > 0) {
        console.warn(`[seo-sync:${context}]`, result.errors.join(" | "));
      } else {
        console.log(
          `[seo-sync:${context}] ${result.totalUrls} URLs · IndexNow: ${result.indexNow?.ok ? "ok" : "skip"} · WebSub: ${result.webSub?.ok ? "ok" : "skip"}`,
        );
      }
    })
    .catch((err) => {
      console.error(`[seo-sync:${context}]`, err);
    });
}

/**
 * URLs institucionais (não-blog) de todos os 4 domínios — usado por
 * "Sincronizar páginas institucionais" no admin.
 */
const INSTITUTIONAL_PATHS = [
  "/",
  "/quem-somos",
  "/contato",
  "/blog",
  "/servicos",
  "/servicos/desenvolvimento",
  "/servicos/desenvolvimento-sites",
  "/servicos/moodle",
  "/servicos/trafego-pago",
  "/servicos/consultoria",
  "/produtos",
  "/produtos/hospedagem-moodle",
  "/produtos/hospedagem-gerenciada",
  "/produtos/aplicativo-moodle",
  "/produtos/voyia",
  "/produtos/sga",
];

export function buildInstitutionalUrls(): string[] {
  const urls: string[] = [];
  for (const locale of locales) {
    const domain = localeToDomain[locale as Locale];
    for (const path of INSTITUTIONAL_PATHS) {
      urls.push(`https://${domain}${path === "/" ? "" : path}`);
    }
  }
  return urls;
}
