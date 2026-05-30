/**
 * Configuração centralizada do Meta Pixel + Conversions API.
 *
 * - `PIXEL_ID` pode ser lido no client (NEXT_PUBLIC_*).
 * - `ACCESS_TOKEN` e `TEST_EVENT_CODE` são server-only — protegidos pelo
 *   guard "server-only" em capi.ts.
 *
 * Versão da Graph API fixa em v21.0 (LTS atual da Meta — Nov/2024 a Nov/2026).
 * Quando vencer, basta bumpar aqui.
 */

export const META_API_VERSION = "v21.0";

const PIXEL_RE = /^\d{10,20}$/;

export interface ClientPixel {
  id: string;
  /** Rótulo de campanha — só pra documentação/diagnóstico. */
  label: "site" | "mensagens";
}

/**
 * Pixels carregados no client (NEXT_PUBLIC_*). Modo espelho: todos disparam
 * o funil completo; cada BM atribui só os cliques dos próprios anúncios.
 *
 * Ordem: site (primário) primeiro, mensagens em seguida.
 */
export function getClientPixels(): ClientPixel[] {
  const out: ClientPixel[] = [];
  const site = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const messages = process.env.NEXT_PUBLIC_META_PIXEL_ID_2?.trim();
  if (site && PIXEL_RE.test(site)) out.push({ id: site, label: "site" });
  if (messages && PIXEL_RE.test(messages)) out.push({ id: messages, label: "mensagens" });
  return out;
}

/** ID do pixel primário (site) — back-compat com chamadas single-pixel. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

export function isPixelEnabled(): boolean {
  return getClientPixels().length > 0;
}

/** Endpoint canônico do CAPI pra um pixel específico. */
export function capiEndpoint(pixelId: string): string {
  return `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;
}
