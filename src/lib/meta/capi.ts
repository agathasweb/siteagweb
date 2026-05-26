import "server-only";
import { capiEndpoint, isPixelEnabled, META_PIXEL_ID } from "./config";
import { buildMetaUserData, type RawUserData } from "./user-data";
import { recordCapiEvent } from "@/lib/db/capi-log";

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
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!isPixelEnabled() || !token) {
    // Meta desligado — não é erro, só não envia. Em dev/sandbox vai cair aqui.
    return { ok: false, status: 0, error: "meta_disabled" };
  }

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();

  const eventData = {
    event_name: input.eventName,
    event_time: input.eventTimeSeconds ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: input.actionSource ?? "website",
    user_data: buildMetaUserData(input.userData),
    ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
    ...(input.customData ? { custom_data: input.customData } : {}),
  };

  const payload: CapiPayload = {
    data: [eventData],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  // Payload pro log de auditoria — guarda hashes (que já não são PII em claro)
  // + custom_data + URL. Permite reprocessar em retry sem refetch do user_data.
  const logPayload = JSON.stringify(eventData);

  try {
    const res = await fetch(`${capiEndpoint()}?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string; code?: number };
    };
    if (!res.ok || json.error) {
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      console.error(
        `[meta-capi] ${input.eventName} (${input.eventId}) FAILED:`,
        msg,
        json.fbtrace_id ? `trace=${json.fbtrace_id}` : "",
      );
      logCapiSafe({
        event_name: input.eventName,
        event_id: input.eventId,
        status: "failed",
        fbtrace_id: json.fbtrace_id ?? null,
        http_status: res.status,
        error: msg,
        test_mode: !!testCode,
        lead_id: input.leadId ?? null,
        subscription_id: input.subscriptionId ?? null,
        payload_json: logPayload,
      });
      return { ok: false, status: res.status, fbtrace_id: json.fbtrace_id, error: msg };
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[meta-capi] ${input.eventName} (${input.eventId}) OK trace=${json.fbtrace_id ?? "-"}${
          testCode ? " [TEST]" : ""
        }`,
      );
    }
    logCapiSafe({
      event_name: input.eventName,
      event_id: input.eventId,
      status: "sent",
      fbtrace_id: json.fbtrace_id ?? null,
      http_status: res.status,
      test_mode: !!testCode,
      lead_id: input.leadId ?? null,
      subscription_id: input.subscriptionId ?? null,
      payload_json: logPayload,
    });
    return { ok: true, status: res.status, fbtrace_id: json.fbtrace_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error(`[meta-capi] ${input.eventName} (${input.eventId}) THROW:`, msg);
    logCapiSafe({
      event_name: input.eventName,
      event_id: input.eventId,
      status: "retry_pending", // erro de rede → vale retry
      error: msg,
      test_mode: !!testCode,
      lead_id: input.leadId ?? null,
      subscription_id: input.subscriptionId ?? null,
      payload_json: logPayload,
    });
    return { ok: false, status: 0, error: msg };
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
