/**
 * Gerador de event_id compartilhado entre Pixel (client) e CAPI (server).
 *
 * A Meta usa essa string pra deduplicar eventos que chegam pelos dois canais
 * — sem ela, um Purchase via Pixel + um Purchase via CAPI viram 2 conversões.
 *
 * Formato: UUID v4 (36 chars). Funciona no client (Web Crypto) e no server.
 */

export function newEventId(): string {
  // crypto.randomUUID() existe no Node 19+ e no browser moderno (Chrome 92+).
  // Como o browserslist do projeto exige Chrome 111+, sempre teremos.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback paranoico — pseudo-UUID v4 baseado em Math.random.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
