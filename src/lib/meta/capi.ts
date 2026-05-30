import "server-only";
import { capiEndpoint, META_PIXEL_ID } from "./config";
import { buildMetaUserData, type RawUserData } from "./user-data";
import { recordCapiEvent } from "@/lib/db/capi-log";

/**
 * Alvo de envio do CAPI: um pixel + seu token + test code próprios.
 *
 * Modo espelho — todo evento é enviado para TODOS os targets configurados.
 * Cada BM atribui só os cliques dos próprios anúncios (via fbc/fbclid), então
 * espelhar não gera dupla contagem: é redundância de cobertura entre os BMs.
 *
 * Cada par (pixel, token) vem do .env:
 *  - site:      NEXT_PUBLIC_META_PIXEL_ID   + META_CAPI_ACCESS_TOKEN   (+ META_CAPI_TEST_EVENT_CODE)
 *  - mensagens: NEXT_PUBLIC_META_PIXEL_ID_2 + META_CAPI_ACCESS_TOKEN_2 (+ META_CAPI_TEST_EVENT_CODE_2)
 */
export interface CapiTarget {
  pixelId: string;
  token: string;
  label: "site" | "mensagens";
  testCode?: string;
}

export function getCapiTargets(): CapiTarget[] {
  const targets: CapiTarget[] = [];
  const siteId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const siteToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (siteId && siteToken) {
    targets.push({
      pixelId: siteId,
      token: siteToken,
      label: "site",
      testCode: process.env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined,
    });
  }
  const msgId = process.env.NEXT_PUBLIC_META_PIXEL_ID_2?.trim();
  const msgToken = process.env.META_CAPI_ACCESS_TOKEN_2?.trim();
  if (msgId && msgToken) {
    targets.push({
      pixelId: msgId,
      token: msgToken,
      label: "mensagens",
      testCode: process.env.META_CAPI_TEST_EVENT_CODE_2?.trim() || undefined,
    });
  }
  return targets;
}

/** Resolve o target de um pixel específico — usado pelo retry. */
export function getCapiTargetByPixel(pixelId: string): CapiTarget | null {
  return getCapiTargets().find((t) => t.pixelId === pixelId) ?? null;
}

/**
 * Conversions API client — POST direto na Graph API da Meta.
 *
 * Usado tanto pelo proxy /api/meta/capi (eventos disparados no client) quanto
 * pelas rotas server-side (webhook ASAAS, verify-account, captureLead).
 *
 * Falhas são logadas mas nunca propagadas — tracking jamais derruba o fluxo
 * de negócio (uma compra confirmada vale mais que um Purchase no Meta).
 */

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Contact"
  | "Lead"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Subscribe"
  | "Purchase"
  | "CompleteRegistration";

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity?: number; item_price?: number }>;
  num_items?: number;
  predicted_ltv?: number;
  /** Catch-all pra campos custom (ex.: plan_key, locale, lead_source). */
  [key: string]: unknown;
}

export interface SendCapiEventInput {
  eventName: MetaStandardEvent;
  eventId: string;
  /** URL completa da página onde o evento ocorreu. */
  eventSourceUrl?: string | null;
  /** "website" (default), "email", "phone_call", "chat", "physical_store", "system_generated", "other". */
  actionSource?:
    | "website"
    | "email"
    | "phone_call"
    | "chat"
    | "physical_store"
    | "system_generated"
    | "other";
  userData: RawUserData;
  customData?: MetaCustomData;
  /** Override do timestamp (UNIX seconds) — usar pra eventos atrasados (webhook). */
  eventTimeSeconds?: number;
  /** FKs opcionais pra correlacionar com lead/subscription no log de auditoria. */
  leadId?: number | null;
  subscriptionId?: number | null;
}

interface CapiPayload {
  data: Array<{
    event_name: string;
    event_time: number;
    event_id: string;
    event_source_url?: string;
    action_source: string;
    user_data: ReturnType<typeof buildMetaUserData>;
    custom_data?: MetaCustomData;
  }>;
  test_event_code?: string;
}

export interface CapiResult {
  ok: boolean;
  status: number;
  fbtrace_id?: string;
  error?: string;
}

export async function sendCapiEvent(input: SendCapiEventInput): Promise<CapiResult> {
  const targets = getCapiTargets();
  if (targets.length === 0) {
    // Meta desligado — não é erro, só não envia. Em dev/sandbox vai cair aqui.
    return { ok: false, status: 0, error: "meta_disabled" };
  }

  // user_data e o corpo do evento são idênticos para todos os pixels — construir
  // uma vez e enviar para cada target (modo espelho).
  const eventData = {
    event_name: input.eventName,
    event_time: input.eventTimeSeconds ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: input.actionSource ?? "website",
    user_data: buildMetaUserData(input.userData),
    ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
    ...(input.customData ? { custom_data: input.customData } : {}),
  };
  const logPayload = JSON.stringify(eventData);

  let anyOk = false;
  let lastStatus = 0;
  let lastTrace: string | undefined;
  let lastError: string | undefined;

  for (const t of targets) {
    const payload: CapiPayload = {
      data: [eventData],
      ...(t.testCode ? { test_event_code: t.testCode } : {}),
    };
    try {
      const res = await fetch(
        `${capiEndpoint(t.pixelId)}?access_token=${encodeURIComponent(t.token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        events_received?: number;
        fbtrace_id?: string;
        error?: { message?: string; code?: number };
      };
      if (!res.ok || json.error) {
        const msg = json.error?.message ?? `HTTP ${res.status}`;
        console.error(
          `[meta-capi:${t.label}] ${input.eventName} (${input.eventId}) FAILED:`,
          msg,
          json.fbtrace_id ? `trace=${json.fbtrace_id}` : "",
        );
        logCapiSafe({
          event_name: input.eventName,
          event_id: input.eventId,
          pixel_id: t.pixelId,
          status: "failed",
          fbtrace_id: json.fbtrace_id ?? null,
          http_status: res.status,
          error: msg,
          test_mode: !!t.testCode,
          lead_id: input.leadId ?? null,
          subscription_id: input.subscriptionId ?? null,
          payload_json: logPayload,
        });
        lastStatus = res.status;
        lastTrace = json.fbtrace_id;
        lastError = msg;
        continue;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[meta-capi:${t.label}] ${input.eventName} (${input.eventId}) OK trace=${json.fbtrace_id ?? "-"}${
            t.testCode ? " [TEST]" : ""
          }`,
        );
      }
      logCapiSafe({
        event_name: input.eventName,
        event_id: input.eventId,
        pixel_id: t.pixelId,
        status: "sent",
        fbtrace_id: json.fbtrace_id ?? null,
        http_status: res.status,
        test_mode: !!t.testCode,
        lead_id: input.leadId ?? null,
        subscription_id: input.subscriptionId ?? null,
        payload_json: logPayload,
      });
      anyOk = true;
      lastStatus = res.status;
      lastTrace = json.fbtrace_id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch_failed";
      console.error(`[meta-capi:${t.label}] ${input.eventName} (${input.eventId}) THROW:`, msg);
      logCapiSafe({
        event_name: input.eventName,
        event_id: input.eventId,
        pixel_id: t.pixelId,
        status: "retry_pending", // erro de rede → vale retry
        error: msg,
        test_mode: !!t.testCode,
        lead_id: input.leadId ?? null,
        subscription_id: input.subscriptionId ?? null,
        payload_json: logPayload,
      });
      lastError = msg;
    }
  }

  return anyOk
    ? { ok: true, status: lastStatus, fbtrace_id: lastTrace }
    : { ok: false, status: lastStatus, fbtrace_id: lastTrace, error: lastError ?? "all_targets_failed" };
}

/**
 * Reenvia um evento já logado (retry) para o pixel correto, identificado pelo
 * `pixel_id` do log. Logs antigos sem pixel_id caem no target primário (site).
 * Compartilhado pelo cron /api/cron/meta-retry e pelo retry manual do admin.
 */
export async function replayCapiLog(row: {
  pixel_id: string | null;
  payload_json: string | null;
}): Promise<{ ok: boolean; status: number; fbtrace_id: string | null; error: string | null }> {
  if (!row.payload_json) return { ok: false, status: 0, fbtrace_id: null, error: "no_payload" };
  let eventData: unknown;
  try {
    eventData = JSON.parse(row.payload_json);
  } catch {
    return { ok: false, status: 0, fbtrace_id: null, error: "payload_parse_error" };
  }
  const targets = getCapiTargets();
  const target = row.pixel_id ? targets.find((t) => t.pixelId === row.pixel_id) : targets[0];
  if (!target) return { ok: false, status: 0, fbtrace_id: null, error: "pixel_not_configured" };

  const payload: CapiPayload = {
    data: [eventData as CapiPayload["data"][number]],
    ...(target.testCode ? { test_event_code: target.testCode } : {}),
  };
  try {
    const res = await fetch(
      `${capiEndpoint(target.pixelId)}?access_token=${encodeURIComponent(target.token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      fbtrace_id?: string;
      error?: { message?: string };
    };
    if (res.ok && !json.error) {
      return { ok: true, status: res.status, fbtrace_id: json.fbtrace_id ?? null, error: null };
    }
    return {
      ok: false,
      status: res.status,
      fbtrace_id: json.fbtrace_id ?? null,
      error: json.error?.message ?? `HTTP ${res.status}`,
    };
  } catch (err) {
    return { ok: false, status: 0, fbtrace_id: null, error: err instanceof Error ? err.message : "fetch_failed" };
  }
}

/** Log nunca pode quebrar o envio — se SQLite estiver com erro, só ignora. */
function logCapiSafe(input: Parameters<typeof recordCapiEvent>[0]): void {
  try {
    recordCapiEvent(input);
  } catch (err) {
    console.error("[capi-log] insert failed:", err instanceof Error ? err.message : err);
  }
}

/** Helper: extrai pixel id pra logs/diagnóstico. */
export function activePixelId(): string {
  return META_PIXEL_ID;
}
