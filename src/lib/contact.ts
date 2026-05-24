// Centraliza dados de contato pra evitar hardcoding espalhado.

/** Número WhatsApp API Oficial (só dígitos, com DDI). */
export const WHATSAPP_NUMBER = "5562969001469";

/** Versão formatada human-readable. Sincronizar com /messages/*.json. */
export const WHATSAPP_DISPLAY = "+55 62 9690-1469";

/**
 * Monta URL de click-to-chat com mensagem prefilled URL-encoded.
 * Usa api.whatsapp.com/send com phone= explícito — wa.me/ tem histórico de
 * misparsear números BR de 13 dígitos (libphonenumber engole o 9 inicial).
 */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}&text=${encodeURIComponent(message)}`;
}
