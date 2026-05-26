/**
 * Wrapper client do Meta Pixel — dispara eventos com `event_id` explícito pra
 * deduplicar com o CAPI server.
 *
 * O base code do fbq é injetado pelo <MetaPixel/> no layout. Aqui só
 * encapsulamos as chamadas pra ter tipagem + checagem de existência.
 */

import type { MetaStandardEvent, MetaCustomData } from "./capi";

declare global {
  interface Window {
    fbq?: ((
      cmd: "init" | "track" | "trackCustom" | "consent",
      ...args: unknown[]
    ) => void) & {
      callMethod?: unknown;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
  }
}

export function isPixelReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

/**
 * Dispara um evento padrão Meta no client com event_id explícito.
 *
 * O mesmo `eventId` PRECISA ser enviado pelo servidor via CAPI pra Meta
 * deduplicar — caso contrário 1 conversão vira 2.
 */
export function trackPixelEvent(
  eventName: MetaStandardEvent,
  eventId: string,
  customData?: MetaCustomData,
): void {
  if (!isPixelReady()) return;
  window.fbq!("track", eventName, customData ?? {}, { eventID: eventId });
}

/** Evento customizado (não-padrão). Útil pra micro-conversões. */
export function trackPixelCustom(
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>,
): void {
  if (!isPixelReady()) return;
  window.fbq!("trackCustom", eventName, customData ?? {}, { eventID: eventId });
}
