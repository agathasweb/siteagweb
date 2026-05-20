import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getSubscriptionByAsaasId,
  updateSubscriptionStatus,
  markConfirmationEmailSent,
  type SubscriptionStatus,
} from "@/lib/db/subscriptions";
import { getPlan } from "@/lib/asaas/plans";
import {
  sendEmail,
  trafegoConfirmationEmail,
  voyiaConfirmationEmail,
  teamNotificationEmail,
} from "@/lib/email";

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

  return NextResponse.json({ ok: true, status: newStatus });
}
