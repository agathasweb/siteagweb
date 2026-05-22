import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "node:crypto";
import {
  createCustomer,
  createSubscription,
  listSubscriptionPayments,
} from "@/lib/asaas/client";
import { getPlan } from "@/lib/asaas/plans";
import { recordSubscription } from "@/lib/db/subscriptions";

interface CheckoutBody {
  planKey: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
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
    recordSubscription({
      asaas_subscription_id: subscription.id,
      asaas_customer_id: customer.id,
      plan_key: body.planKey,
      category: plan.category,
      customer_name: body.name,
      customer_email: body.email.toLowerCase(),
      customer_phone: body.phone ?? null,
      value: plan.value,
      cycle: plan.cycle,
      billing_type: plan.billingType,
      account_token: accountToken,
    });

    const payments = await listSubscriptionPayments(subscription.id);
    const first = payments.data[0];
    if (!first?.invoiceUrl) {
      return NextResponse.json(
        { ok: false, error: "Pagamento não disponibilizado pela ASAAS ainda" },
        { status: 502 },
      );
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
