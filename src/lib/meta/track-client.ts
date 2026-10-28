/**
 * Helper unificado pro client: dispara Pixel + envia evento ao proxy CAPI
 * compartilhando o MESMO event_id (chave da deduplicação).
 *
 * Use em handlers de UI (cliques, submits). Para eventos server-side (webhook,
 * verify-account) chame `sendCapiEvent()` direto em capi.ts.
 */

import { trackPixelEvent, trackPixelEventSingle } from "./pixel";
import { newEventId } from "./event-id";
import { snapshotAttribution } from "./attribution";
import type { MetaStandardEvent, MetaCustomData } from "./capi";

export interface TrackClientInput {
  eventName: MetaStandardEvent;
  /** Se omitido, gera um novo. Útil retornar pra encadear server-side. */
  eventId?: string;
  userData?: {
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    externalId?: string | null;
  };
  customData?: MetaCustomData;
  /** "salomao": o CAPI vai só para o pixel do Salomão, não para os pixels do site. */
  produto?: "salomao";
  /** Pixel único no navegador (trackSingle). Sem ele, vai para todos os inicializados. */
  pixelId?: string | null;
}

/**
 * Dispara o par Pixel+CAPI e retorna o eventId usado — útil quando o caller
 * vai persistir esse id no banco (ex.: checkout) pra reusar no webhook.
 */
export async function trackClient(input: TrackClientInput): Promise<string> {
  const eventId = input.eventId ?? newEventId();
  const attribution = snapshotAttribution();

  // 1. Pixel — síncrono, dispara já.
  if (input.pixelId) trackPixelEventSingle(input.pixelId, input.eventName, eventId, input.customData);
  else trackPixelEvent(input.eventName, eventId, input.customData);

  // 2. CAPI via proxy — fire-and-forget; falha no fetch não atrapalha o user.
  try {
    await fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive permite que a request sobreviva a um navigate logo em seguida
      // (ex.: InitiateCheckout dispara, depois a página redireciona pra ASAAS).
      keepalive: true,
      body: JSON.stringify({
        eventName: input.eventName,
        eventId,
        eventSourceUrl: attribution.eventSourceUrl,
        userData: {
          ...input.userData,
          fbp: attribution.fbp,
          fbc: attribution.fbc,
        },
        customData: input.customData,
        produto: input.produto,
      }),
    });
  } catch {
    // Silencioso — Pixel já disparou, CAPI é redundância.
  }

  return eventId;
}
