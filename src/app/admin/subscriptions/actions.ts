"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
  deleteSubscription,
  recordSubscription,
  getSubscriptionByAsaasId,
  updateSubscriptionStatus,
  type SubscriptionStatus,
} from "@/lib/db/subscriptions";
import { deleteLeadsBySubscriptionId, createLead } from "@/lib/db/leads";
import {
  createCustomer,
  createSubscription,
  getSubscription,
  getCustomer,
  listSubscriptionPayments,
  type AsaasCycle,
  type AsaasBillingType,
} from "@/lib/asaas/client";
import { getPlan, MANUAL_PLAN_KEY } from "@/lib/asaas/plans";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

export async function deleteSubscriptionAction(id: number): Promise<void> {
  await requireAdmin();
  // Remove o lead "cliente agweb" vinculado antes de apagar a assinatura.
  deleteLeadsBySubscriptionId(id);
  deleteSubscription(id);
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/leads");
}

// ---------------------------------------------------------------------------
// Fluxo manual de assinaturas com preço personalizado
// ---------------------------------------------------------------------------

export interface ManualSubscriptionResult {
  ok: boolean;
  error?: string;
  /** Link de pagamento hospedado da ASAAS (enviar ao cliente). */
  checkoutUrl?: string;
  /**
   * Link de criação de conta Voyia (`criar-conta?token=…`). Só funciona após
   * o pagamento confirmar; é enviado automaticamente por e-mail no webhook.
   * Disponibilizado aqui apenas como referência para a equipe.
   */
  accountLink?: string | null;
  /** ID da assinatura na ASAAS (`sub_xxx`). */
  asaasSubscriptionId?: string;
  customerName?: string;
  status?: SubscriptionStatus;
}

const CYCLES: ReadonlySet<AsaasCycle> = new Set([
  "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUALLY", "YEARLY",
]);
const BILLING_TYPES: ReadonlySet<AsaasBillingType> = new Set([
  "BOLETO", "CREDIT_CARD", "PIX", "UNDEFINED",
]);

/** Aceita "549,90", "1.234,56", "549.90" ou "549" e devolve número em reais. */
function parseBRL(raw: string): number {
  let s = raw.trim().replace(/[^0-9.,]/g, "");
  if (s.includes(",")) {
    // formato pt-BR: ponto = milhar, vírgula = decimal
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function field(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Mapeia o status do pagamento ASAAS para o status interno da assinatura. */
function mapPaymentStatus(asaasStatus: string | undefined): SubscriptionStatus {
  switch (asaasStatus) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return asaasStatus === "CONFIRMED" ? "CONFIRMED" : "RECEIVED";
    case "OVERDUE":
      return "OVERDUE";
    case "REFUNDED":
    case "REFUND_REQUESTED":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

async function remoteIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    undefined
  );
}

function voyiaAccountLink(token: string): string {
  const base = process.env.VOYIA_SIGNUP_URL?.trim() || "https://voyia.com.br/criar-conta";
  return `${base}?token=${token}`;
}

/**
 * Cria uma assinatura ASAAS com preço personalizado e a registra localmente.
 *
 * O resto do ciclo de vida (webhook → status/e-mail/CAPI, conta Voyia via
 * token, exibição no admin) é o mesmo do checkout público — basta existir a
 * linha em `subscriptions` com o `asaas_subscription_id` correto.
 */
export async function createManualSubscriptionAction(
  form: FormData,
): Promise<ManualSubscriptionResult> {
  await requireAdmin();

  const name = field(form, "name");
  const email = field(form, "email").toLowerCase();
  const cpfCnpj = field(form, "cpfCnpj").replace(/\D/g, "");
  const phone = field(form, "phone").replace(/\D/g, "") || null;
  const category = field(form, "category") === "trafego" ? "trafego" : "voyia";
  const value = parseBRL(field(form, "value"));
  const cycle = field(form, "cycle") as AsaasCycle;
  const billingType = (field(form, "billingType") || "UNDEFINED") as AsaasBillingType;
  const description = field(form, "description") || getPlan(MANUAL_PLAN_KEY[category])!.description;
  const firstDueDate = field(form, "firstDueDate"); // YYYY-MM-DD (opcional)

  if (!name || !email || !cpfCnpj) {
    return { ok: false, error: "Nome, e-mail e CPF/CNPJ são obrigatórios." };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Valor inválido. Use algo como 549,90." };
  }
  if (!CYCLES.has(cycle)) {
    return { ok: false, error: "Ciclo inválido." };
  }
  if (!BILLING_TYPES.has(billingType)) {
    return { ok: false, error: "Forma de pagamento inválida." };
  }

  const planKey = MANUAL_PLAN_KEY[category];
  const accountToken = category === "voyia" ? crypto.randomBytes(24).toString("hex") : null;
  const callbackBase = process.env.ASAAS_CALLBACK_URL?.trim();

  try {
    const customer = await createCustomer({
      name,
      email,
      cpfCnpj,
      mobilePhone: phone ?? undefined,
      externalReference: `manual:${planKey}`,
    });

    let dueDateStr = firstDueDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDateStr = d.toISOString().slice(0, 10);
    }

    const subscription = await createSubscription({
      customer: customer.id,
      billingType,
      value,
      nextDueDate: dueDateStr,
      cycle,
      description,
      externalReference: planKey,
      remoteIp: await remoteIp(),
      callback: callbackBase
        ? { successUrl: `${callbackBase}/pagamento/sucesso?categoria=${category}`, autoRedirect: true }
        : undefined,
    });

    const rowId = recordSubscription({
      asaas_subscription_id: subscription.id,
      asaas_customer_id: customer.id,
      plan_key: planKey,
      category,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      customer_cpf_cnpj: cpfCnpj,
      value,
      cycle,
      billing_type: billingType,
      account_token: accountToken,
    });

    try {
      createLead({
        source: "quote_request",
        name,
        email,
        phone,
        service: getPlan(planKey)?.name ?? planKey,
        message: `Assinatura manual personalizada — ${getPlan(planKey)?.name} (${category}), R$ ${value.toFixed(2)}/${cycle}.`,
        tags: "cliente agweb",
        subscription_id: rowId,
      });
    } catch (leadErr) {
      console.error("[manual-sub] falha ao criar lead:", leadErr);
    }

    let checkoutUrl: string | undefined;
    try {
      const payments = await listSubscriptionPayments(subscription.id);
      checkoutUrl = payments.data[0]?.invoiceUrl;
    } catch (payErr) {
      console.error("[manual-sub] falha ao buscar link de pagamento:", payErr);
    }

    revalidatePath("/admin/subscriptions");
    return {
      ok: true,
      checkoutUrl,
      accountLink: accountToken ? voyiaAccountLink(accountToken) : null,
      asaasSubscriptionId: subscription.id,
      customerName: name,
      status: "PENDING",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado." };
  }
}

/**
 * Registra no banco uma assinatura que JÁ foi criada manualmente no painel
 * ASAAS. Busca value/cycle/billingType e os dados do cliente direto da ASAAS
 * para sincronizar webhook, conta Voyia e exibição no admin.
 *
 * Informe o ID da assinatura (`sub_xxx`) — não o link de fatura `/i/...`.
 */
export async function registerExistingSubscriptionAction(
  form: FormData,
): Promise<ManualSubscriptionResult> {
  await requireAdmin();

  const asaasSubscriptionId = field(form, "asaasSubscriptionId");
  const category = field(form, "category") === "trafego" ? "trafego" : "voyia";

  if (!/^sub_/.test(asaasSubscriptionId)) {
    return { ok: false, error: "Informe o ID da assinatura (começa com sub_), não o link /i/…" };
  }
  if (getSubscriptionByAsaasId(asaasSubscriptionId)) {
    return { ok: false, error: "Essa assinatura já está registrada no painel." };
  }

  const planKey = MANUAL_PLAN_KEY[category];
  const accountToken = category === "voyia" ? crypto.randomBytes(24).toString("hex") : null;

  try {
    const sub = await getSubscription(asaasSubscriptionId);
    const customer = await getCustomer(sub.customer);

    const rowId = recordSubscription({
      asaas_subscription_id: sub.id,
      asaas_customer_id: sub.customer,
      plan_key: planKey,
      category,
      customer_name: customer.name,
      customer_email: (customer.email || "").toLowerCase(),
      customer_phone: customer.mobilePhone ?? null,
      customer_cpf_cnpj: customer.cpfCnpj ?? null,
      value: sub.value,
      cycle: sub.cycle,
      billing_type: sub.billingType ?? "UNDEFINED",
      account_token: accountToken,
    });

    // Reflete o status atual do pagamento (caso a 1ª parcela já tenha sido paga
    // antes do registro). Eventos futuros chegam pelo webhook normalmente.
    let checkoutUrl: string | undefined;
    let status: SubscriptionStatus = "PENDING";
    try {
      const payments = await listSubscriptionPayments(sub.id);
      const first = payments.data[0];
      checkoutUrl = first?.invoiceUrl;
      status = mapPaymentStatus(first?.status);
      if (status !== "PENDING") updateSubscriptionStatus(sub.id, status);
    } catch (payErr) {
      console.error("[manual-sub] falha ao buscar pagamentos da assinatura:", payErr);
    }

    try {
      createLead({
        source: "quote_request",
        name: customer.name,
        email: (customer.email || "").toLowerCase(),
        phone: customer.mobilePhone ?? null,
        service: getPlan(planKey)?.name ?? planKey,
        message: `Assinatura manual registrada (já existente na ASAAS) — ${getPlan(planKey)?.name} (${category}), R$ ${sub.value.toFixed(2)}/${sub.cycle}.`,
        tags: "cliente agweb",
        subscription_id: rowId,
      });
    } catch (leadErr) {
      console.error("[manual-sub] falha ao criar lead:", leadErr);
    }

    revalidatePath("/admin/subscriptions");
    return {
      ok: true,
      checkoutUrl,
      accountLink: accountToken ? voyiaAccountLink(accountToken) : null,
      asaasSubscriptionId: sub.id,
      customerName: customer.name,
      status,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado." };
  }
}
