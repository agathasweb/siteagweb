import "server-only";
import { createHash } from "node:crypto";
import { tiktokPixelSalomao } from "./pixel";

/**
 * Events API do TikTok (servidor) para o pixel do Salomão — o equivalente ao CAPI da Meta.
 * Espelha os eventos do navegador com o mesmo event_id (o TikTok deduplica) e manda o que o
 * navegador nunca vê: o CompletePayment, confirmado pelo webhook do Asaas.
 *
 * Env (runtime): TIKTOK_EVENTS_TOKEN_SALOMAO (+ TIKTOK_TEST_EVENT_CODE_SALOMAO para testar
 * no Events Manager). Sem token, não envia nada.
 */

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export interface TikTokEventInput {
  evento: "ViewContent" | "InitiateCheckout" | "SubmitForm" | "CompletePayment";
  eventId: string;
  url?: string | null;
  email?: string | null;
  telefone?: string | null;
  externalId?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  propriedades?: Record<string, unknown>;
}

function sha256(v: string): string {
  return createHash("sha256").update(v, "utf8").digest("hex");
}

/** Telefone em E.164 (+55…) antes do hash, como o TikTok pede. */
function telefoneE164(fone: string): string | null {
  const d = fone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return `+${d.startsWith("55") && d.length >= 12 ? d : `55${d}`}`;
}

export async function sendTikTokEvent(input: TikTokEventInput): Promise<{ ok: boolean; erro?: string }> {
  const token = process.env.TIKTOK_EVENTS_TOKEN_SALOMAO?.trim();
  const pixelId = tiktokPixelSalomao();
  if (!token || !pixelId) return { ok: false, erro: "sem token/pixel" };

  const user: Record<string, string> = {};
  if (input.email) user.email = sha256(input.email.trim().toLowerCase());
  const fone = input.telefone ? telefoneE164(input.telefone) : null;
  if (fone) user.phone = sha256(fone);
  if (input.externalId) user.external_id = sha256(input.externalId.trim());
  if (input.ttclid) user.ttclid = input.ttclid;
  if (input.ttp) user.ttp = input.ttp;
  if (input.ip) user.ip = input.ip;
  if (input.userAgent) user.user_agent = input.userAgent;

  const testCode = process.env.TIKTOK_TEST_EVENT_CODE_SALOMAO?.trim();
  const body = {
    event_source: "web",
    event_source_id: pixelId,
    ...(testCode ? { test_event_code: testCode } : {}),
    data: [{
      event: input.evento,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      user,
      ...(input.url ? { page: { url: input.url } } : {}),
      properties: input.propriedades ?? {},
    }],
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
    if (!res.ok || j.code !== 0) {
      console.error(`[tiktok-events] ${input.evento} recusado: http=${res.status} code=${j.code} ${j.message ?? ""}`);
      return { ok: false, erro: j.message ?? `http ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[tiktok-events] ${input.evento} falhou:`, err);
    return { ok: false, erro: String(err) };
  }
}
