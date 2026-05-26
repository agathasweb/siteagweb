import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "node:crypto";
import {
  createCustomer,
  createSubscription,
  listSubscriptionPayments,
} from "@/lib/asaas/client";
import { getPlan } from "@/lib/asaas/plans";
import {
  recordSubscription,
  markMetaEventSent,
  metaEventAlreadySent,
} from "@/lib/db/subscriptions";
import { createLead } from "@/lib/db/leads";
import { sendCapiEvent } from "@/lib/meta/capi";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";

interface CheckoutBody {
  planKey: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  // Meta attribution vindo do client — persistido na subscription pra usar
  // depois no webhook (PAYMENT_CONFIRMED pode chegar dias depois).
  metaEventId?: string;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  eventSourceUrl?: string | null;
}

/**
 * POST /api/asaas/checkout
 *
 * Cria cliente + assinatura ASAAS, registra a assinatura no banco e devolve
 * a URL do checkout hospedado da ASAAS.
 *
 * Após o pagamento, a ASAAS redireciona o cliente para /pagamento/sucesso
 * (callback) e dispara o webhook /api/asaas/webhook para confirmação.
 */
export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const plan = getPlan(body.planKey);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plano não encontrado" }, { status: 404 });
  }
  if (!body.name || !body.email || !body.cpfCnpj) {
    return NextResponse.json({ ok: false, error: "Campos obrigatórios faltando" }, { status: 422 });
  }

  const h = await headers();
  const remoteIp =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    undefined;

  // Callback (redirect pós-pagamento) só é enviado se ASAAS_CALLBACK_URL
  // estiver definido. A ASAAS exige que esse domínio esteja cadastrado em
  // "Minha Conta → Informações → site" — em sandbox/localhost fica desligado.
  const callbackBase = process.env.ASAAS_CALLBACK_URL?.trim();

  // Voyia: token seguro para o cliente criar a conta após o pagamento.
  const accountToken =
    plan.category === "voyia" ? crypto.randomBytes(24).toString("hex") : null;

  try {
    const customer = await createCustomer({
      name: body.name,
      email: body.email,
      cpfCnpj: body.cpfCnpj.replace(/\D/g, ""),
      mobilePhone: body.phone?.replace(/\D/g, ""),
      externalReference: `plan:${plan.name}`,
    });

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().slice(0, 10);

    const subscription = await createSubscription({
      customer: customer.id,
      billingType: plan.billingType,
      value: plan.value,
      nextDueDate: dueDateStr,
      cycle: plan.cycle,
      description: plan.description,
      externalReference: body.planKey,
      remoteIp,
      callback: callbackBase
        ? {
            successUrl: `${callbackBase}/pagamento/sucesso?categoria=${plan.category}`,
            autoRedirect: true,
          }
        : undefined,
    });

    // Registra a assinatura no banco (status PENDING até o webhook confirmar).
    // CPF/CNPJ e attribution Meta são persistidos pra reuso no webhook —
    // quando PAYMENT_CONFIRMED chegar (pode ser dias depois), ainda teremos
    // o fbp/fbc do clique do anúncio e o event_id pra dedup com o Pixel.
    const cpfCnpjDigits = body.cpfCnpj.replace(/\D/g, "");
    const geoEarly = extractGeoFromHeaders(h);
    const subscriptionRowId = recordSubscription({
      asaas_subscription_id: subscription.id,
      asaas_customer_id: customer.id,
      plan_key: body.planKey,
      category: plan.category,
      customer_name: body.name,
      customer_email: body.email.toLowerCase(),
      customer_phone: body.phone ?? null,
      customer_cpf_cnpj: cpfCnpjDigits,
      customer_city: geoEarly.city,
      customer_state: geoEarly.state,
      customer_zip: geoEarly.zip,
      customer_country: (geoEarly.country ?? "br").toLowerCase(),
      value: plan.value,
      cycle: plan.cycle,
      billing_type: plan.billingType,
      account_token: accountToken,
      fbp: body.fbp ?? null,
      fbc: body.fbc ?? null,
      fbclid: body.fbclid ?? null,
      gclid: body.gclid ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_term: body.utm_term ?? null,
      utm_content: body.utm_content ?? null,
      meta_event_id: body.metaEventId ?? null,
    });

    // Todo cliente de assinatura também consta em /admin/leads com a tag
    // "cliente agweb". Falha aqui não pode derrubar o checkout.
    try {
      createLead({
        source: "quote_request",
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone ?? null,
        service: plan.name,
        message: `Cliente de assinatura — ${plan.name} (${plan.category}).`,
        origin_page: h.get("referer") ?? null,
        ip: remoteIp ?? null,
        user_agent: h.get("user-agent") ?? null,
        tags: "cliente agweb",
        subscription_id: subscriptionRowId,
      });
    } catch (leadErr) {
      console.error("[checkout] falha ao criar lead da assinatura:", leadErr);
    }

    const payments = await listSubscriptionPayments(subscription.id);
    const first = payments.data[0];
    if (!first?.invoiceUrl) {
      return NextResponse.json(
        { ok: false, error: "Pagamento não disponibilizado pela ASAAS ainda" },
        { status: 502 },
      );
    }

    // CAPI InitiateCheckout — mirror server do Pixel client. Mesmo event_id
    // garante dedup no Meta. Idempotente pra não duplicar se o user submeter 2x.
    if (body.metaEventId && !metaEventAlreadySent(subscription.id, "InitiateCheckout")) {
      void sendCapiEvent({
        eventName: "InitiateCheckout",
        eventId: body.metaEventId,
        eventSourceUrl: body.eventSourceUrl ?? h.get("referer") ?? null,
        actionSource: "website",
        subscriptionId: subscriptionRowId,
        userData: {
          email: body.email,
          phone: body.phone ?? null,
          fullName: body.name,
          externalId: cpfCnpjDigits || String(subscriptionRowId),
          city: geoEarly.city,
          state: geoEarly.state,
          zip: geoEarly.zip,
          country: (geoEarly.country ?? "br").toLowerCase(),
          fbp: body.fbp ?? null,
          fbc: body.fbc ?? null,
          clientIp: remoteIp ?? null,
          clientUserAgent: h.get("user-agent"),
        },
        customData: {
          content_name: plan.name,
          content_category: plan.category,
          content_ids: [body.planKey],
          content_type: "product",
          currency: "BRL",
          value: plan.value,
          num_items: 1,
        },
      }).then((res) => {
        if (res.ok) markMetaEventSent(subscription.id, "InitiateCheckout");
      });
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl: first.invoiceUrl,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
