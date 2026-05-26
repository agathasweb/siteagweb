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

/** ID público do Pixel (15-16 dígitos). Sem isso, Pixel não carrega. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

export function isPixelEnabled(): boolean {
  return /^\d{10,20}$/.test(META_PIXEL_ID);
}

/** Endpoint canônico do CAPI pra um pixel específico. */
export function capiEndpoint(pixelId: string = META_PIXEL_ID): string {
  return `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;
}
