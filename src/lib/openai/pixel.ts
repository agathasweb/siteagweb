/**
 * Pixel da OpenAI Ads (anúncios no ChatGPT), origem de dados "Agathas Web" criada em 21/11/2026 no
 * ads.openai.com › Conversões. Um pixel só para o site inteiro: a campanha de cada produto (SK Render,
 * Salomão) é quem atribui o clique, então o mesmo evento serve às duas.
 *
 * Eventos cadastrados na conta (base → nome no painel):
 *  - lead_created → "Lead"  (formulários e WhatsApp com cadastro)
 *  - registration_completed → "Cadastro"
 *  - order_created → "Compra"
 *
 * Sem `amount`: o SDK exige inteiro e a unidade (centavos ou micros) não está documentada; melhor
 * contar a conversão sem valor do que registrar valor errado.
 */

type Oaiq = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    oaiq?: Oaiq;
  }
}

export const OPENAI_PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID?.trim() || "72uMEcMkqCaAGt4ooaJvTL";

const TIPO = {
  lead_created: "customer_action",
  registration_completed: "customer_action",
  order_created: "contents",
} as const;

export type EventoOpenAi = keyof typeof TIPO;

/** Snippet oficial (fila `oaiq` + oaiq.min.js) seguido do init. Idempotente. */
export function carregarOpenAiPixel(pixelId: string = OPENAI_PIXEL_ID): void {
  if (typeof window === "undefined" || window.oaiq || !pixelId) return;
  const fila = function (...args: unknown[]) { fila.q!.push(args); } as Oaiq;
  fila.q = [];
  window.oaiq = fila;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
  const primeiro = document.getElementsByTagName("script")[0];
  if (primeiro?.parentNode) primeiro.parentNode.insertBefore(s, primeiro);
  else document.head.appendChild(s);
  window.oaiq("init", { pixelId, debug: false });
}

/** Conversão no pixel da OpenAI. O `eventId` é o mesmo dos outros pixels (deduplicação futura com a Conversions API). */
export function medirOpenAi(evento: EventoOpenAi, eventId?: string): void {
  if (typeof window === "undefined" || !window.oaiq) return;
  try {
    window.oaiq("measure", evento, { type: TIPO[evento] }, eventId ? { event_id: eventId } : undefined);
  } catch {
    // pixel nunca derruba o fluxo do usuário
  }
}
