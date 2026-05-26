import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getSubscriptionByAsaasId,
  updateSubscriptionStatus,
  markConfirmationEmailSent,
  markMetaEventSent,
  metaEventAlreadySent,
  type SubscriptionStatus,
  type SubscriptionRow,
} from "@/lib/db/subscriptions";
import { getPlan } from "@/lib/asaas/plans";
import {
  sendEmail,
  trafegoConfirmationEmail,
  voyiaConfirmationEmail,
  teamNotificationEmail,
} from "@/lib/email";
import { sendCapiEvent } from "@/lib/meta/capi";
import { newEventId } from "@/lib/meta/event-id";
import { predictedLtv } from "@/lib/meta/ltv";

export const dynamic = "force-dynamic";

/**
 * Webhook da ASAAS — recebe eventos de pagamento.
 *
 * Configure em: ASAAS → Configurações → Integrações → Webhooks, apontando
 * para https://<domínio>/api/asaas/webhook e definindo o token de
 * autenticação (header `asaas-access-token`) igual a ASAAS_WEBHOOK_TOKEN.
 *
 * Eventos tratados:
 *  - PAYMENT_CONFIRMED / PAYMENT_RECEIVED → marca pago + dispara e-mails
 *  - PAYMENT_OVERDUE                      → marca OVERDUE
 *  - SUBSCRIPTION_DELETED / PAYMENT_REFUNDED → marca CANCELED
 */

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    status?: string;
    value?: number;
  };
  subscription?: { id: string };
}

const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL?.trim() || "webmaster@agathas.com.br";

export async function POST(req: Request) {
  const h = await headers();

  // Autenticação do webhook — só a ASAAS conhece o token configurado.
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  const provided = h.get("asaas-access-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AsaasWebhookEvent;
  try {
    body = (await req.json()) as AsaasWebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const subscriptionId = body.payment?.subscription ?? body.subscription?.id;
  if (!subscriptionId) {
    // Evento sem assinatura associada — ignora silenciosamente (200 pra não reenfileirar)
    return NextResponse.json({ ok: true, ignored: "no_subscription" });
  }

  const sub = getSubscriptionByAsaasId(subscriptionId);
  if (!sub) {
    return NextResponse.json({ ok: true, ignored: "subscription_not_tracked" });
  }

  const event = body.event;
  let newStatus: SubscriptionStatus | null = null;
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    newStatus = event === "PAYMENT_RECEIVED" ? "RECEIVED" : "CONFIRMED";
  } else if (event === "PAYMENT_OVERDUE") {
    newStatus = "OVERDUE";
  } else if (
    event === "SUBSCRIPTION_DELETED" ||
    event === "PAYMENT_REFUNDED" ||
    event === "PAYMENT_DELETED"
  ) {
    newStatus = "CANCELED";
  }

  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: `event_${event}` });
  }

  updateSubscriptionStatus(subscriptionId, newStatus);

  // Dispara e-mails de confirmação só uma vez, no primeiro pago.
  const isPaid = newStatus === "CONFIRMED" || newStatus === "RECEIVED";
  if (isPaid && !sub.confirmation_email_sent) {
    const plan = getPlan(sub.plan_key);
    const planName = plan?.name ?? sub.plan_key;

    let customerEmail: { subject: string; html: string };
    if (sub.category === "voyia" && sub.account_token) {
      const accountUrl = `${process.env.VOYIA_SIGNUP_URL?.trim() || "https://voyia.com.br/criar-conta"}?token=${sub.account_token}`;
      customerEmail = voyiaConfirmationEmail({
        customerName: sub.customer_name,
        planName,
        accountUrl,
      });
    } else {
      customerEmail = trafegoConfirmationEmail({
        customerName: sub.customer_name,
        planName,
      });
    }

    // E-mail pro cliente (com BCC pra equipe não perder nada)
    await sendEmail({
      to: sub.customer_email,
      subject: customerEmail.subject,
      html: customerEmail.html,
    });

    // Notificação interna pra equipe Agathas
    const team = teamNotificationEmail({
      planName,
      customerName: sub.customer_name,
      customerEmail: sub.customer_email,
      customerPhone: sub.customer_phone,
      value: sub.value,
    });
    await sendEmail({ to: TEAM_EMAIL, subject: team.subject, html: team.html });

    markConfirmationEmailSent(subscriptionId);
  }

  // Eventos Meta de receita — disparados UMA vez por subscription quando a
  // primeira parcela vira CONFIRMED/RECEIVED. Idempotência via colunas
  // `meta_*_sent_at` evita reenvio em retries do webhook (ASAAS pode chamar 2x).
  if (isPaid) {
    await dispatchPurchaseAndSubscribe(sub);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}

/**
 * Envia Subscribe + Purchase via CAPI usando os dados de attribution salvos
 * no checkout. Os 2 eventos têm `event_id` distintos pra Meta tratá-los como
 * conversões independentes (campanhas podem otimizar pra um ou outro).
 *
 * - `Subscribe` carrega `predicted_ltv = value × 12` (LTV anual estimado).
 * - `Purchase` carrega só o `value` do ciclo.
 *
 * Para `Purchase` reusamos o `meta_event_id` original do InitiateCheckout —
 * isso PERMITE ao Meta correlacionar a jornada toda do usuário (mesmo browser
 * que iniciou o checkout é o que comprou). O `Subscribe` ganha event_id novo
 * porque é semanticamente diferente (assinatura ativada).
 */
async function dispatchPurchaseAndSubscribe(sub: SubscriptionRow): Promise<void> {
  const plan = getPlan(sub.plan_key);
  const planName = plan?.name ?? sub.plan_key;

  const baseUserData = {
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
    clientIp: null, // webhook é server-to-server, sem IP do user
    clientUserAgent: null,
  };

  const baseCustomData = {
    content_name: planName,
    content_category: sub.category,
    content_ids: [sub.plan_key],
    content_type: "product",
    currency: "BRL",
    value: sub.value,
    num_items: 1,
  };

  // event_source_url do webhook é a URL onde o user iniciou o checkout —
  // sem essa info, manda pra raiz do domínio principal.
  const eventSourceUrl = "https://agathas.com.br/produtos/voyia";

  // ----- Purchase -----
  if (!metaEventAlreadySent(sub.asaas_subscription_id, "Purchase")) {
    const purchaseEventId = sub.meta_event_id ?? newEventId();
    const res = await sendCapiEvent({
      eventName: "Purchase",
      eventId: purchaseEventId,
      eventSourceUrl,
      actionSource: "website",
      userData: baseUserData,
      subscriptionId: sub.id,
      customData: baseCustomData,
    });
    if (res.ok) markMetaEventSent(sub.asaas_subscription_id, "Purchase");
  }

  // ----- Subscribe -----
  if (!metaEventAlreadySent(sub.asaas_subscription_id, "Subscribe")) {
    const res = await sendCapiEvent({
      eventName: "Subscribe",
      eventId: newEventId(),
      eventSourceUrl,
      actionSource: "website",
      userData: baseUserData,
      subscriptionId: sub.id,
      customData: {
        ...baseCustomData,
        // LTV anualizado por ciclo — Meta otimiza pelo valor recorrente esperado.
        predicted_ltv: predictedLtv(sub.value, sub.cycle),
      },
    });
    if (res.ok) markMetaEventSent(sub.asaas_subscription_id, "Subscribe");
  }
}
