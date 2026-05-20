// Centraliza dados de contato pra evitar hardcoding espalhado.

/** Número WhatsApp API Oficial, formato wa.me (só dígitos, com DDI). */
export const WHATSAPP_NUMBER = "5562969001469";

/** Versão formatada human-readable. Sincronizar com /messages/*.json. */
export const WHATSAPP_DISPLAY = "+55 62 9690-1469";

/**
 * Monta URL wa.me com mensagem prefilled URL-encoded.
 * @example buildWhatsAppUrl("Olá, vi o site!") → https://wa.me/55...?text=Ol%C3%A1...
 */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
