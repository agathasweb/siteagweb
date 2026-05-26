import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getSubscriptionByToken,
  markAccountCreated,
  markMetaEventSentByToken,
  metaEventAlreadySent,
} from "@/lib/db/subscriptions";
import { sendCapiEvent } from "@/lib/meta/capi";
import { newEventId } from "@/lib/meta/event-id";

export const dynamic = "force-dynamic";

/**
 * API consultada pelo voyia-dev para confirmar que o pagamento foi aprovado
 * antes de liberar a criação de conta.
 *
 * Segurança em duas camadas:
 *  1. O `token` em si é um segredo de 48 chars gerado no checkout.
 *  2. Header `x-voyia-key` precisa bater com VOYIA_API_KEY (segredo
 *     compartilhado entre agathas-dev e voyia-dev).
 *
 * GET  /api/asaas/verify-account?token=XXX
 *   → { valid, paid, accountCreated, customerName, customerEmail, planKey }
 *
 * POST /api/asaas/verify-account  body: { token }
 *   → marca account_created = 1 (chamar após o registro concluir no voyia-dev)
 */

function authorized(h: Headers): boolean {
  const expected = process.env.VOYIA_API_KEY?.trim();
  if (!expected) return false;
  return h.get("x-voyia-key") === expected;
}

const PAID = new Set(["CONFIRMED", "RECEIVED"]);

export async function GET(req: Request) {
  const h = await headers();
  if (!authorized(h)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ valid: false, error: "missing_token" }, { status: 400 });
  }

  const sub = getSubscriptionByToken(token);
  if (!sub || sub.category !== "voyia") {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    paid: PAID.has(sub.status),
    status: sub.status,
    accountCreated: sub.account_created === 1,
    customerName: sub.customer_name,
    customerEmail: sub.customer_email,
    customerPhone: sub.customer_phone,
    planKey: sub.plan_key,
  });
}

export async function POST(req: Request) {
  const h = await headers();
  if (!authorized(h)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const sub = getSubscriptionByToken(token);
  if (!sub || sub.category !== "voyia") {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 404 });
  }
  if (!PAID.has(sub.status)) {
    return NextResponse.json({ ok: false, error: "payment_not_confirmed" }, { status: 402 });
  }

  markAccountCreated(token);

  // CompleteRegistration via CAPI — server-to-server (voyia-dev → agathas-dev).
  // Idempotência via meta_completereg_sent_at evita reenvio se o voyia-dev
  // chamar POST 2x (ex.: retry de rede após criar a conta).
  if (!metaEventAlreadySent(sub.asaas_subscription_id, "CompleteRegistration")) {
    const res = await sendCapiEvent({
      eventName: "CompleteRegistration",
      eventId: newEventId(),
      eventSourceUrl: "https://voyia.com.br/criar-conta",
      actionSource: "system_generated",
      subscriptionId: sub.id,
      userData: {
        email: sub.customer_email,
        phone: sub.customer_phone,
        fullName: sub.customer_name,
        externalId: sub.customer_cpf_cnpj || String(sub.id),
        city: sub.customer_city,
        state: sub.customer_state,
        zip: sub.customer_zip,
        country: (sub.customer_country ?? "br").toLowerCase(),
        fbp: sub.fbp,
        fbc: sub.fbc,
      },
      customData: {
        content_name: sub.plan_key,
        content_category: "voyia",
        status: true,
      },
    });
    if (res.ok) markMetaEventSentByToken(token, "CompleteRegistration");
  }

  return NextResponse.json({ ok: true });
}
