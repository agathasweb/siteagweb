import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLatestVoyiaSubscriptionByEmail } from "@/lib/db/subscriptions";
import {
  getSubscriptionDetail,
  listSubscriptionPayments,
  type AsaasCreditCardSummary,
} from "@/lib/asaas/client";

export const dynamic = "force-dynamic";

/**
 * Painel "Assinatura" do voyia-dev — dados de cobrança da assinatura ASAAS.
 *
 * O voyia-dev só conhece o e-mail da empresa (o mesmo do checkout). Aqui
 * resolvemos a assinatura Voyia mais recente por e-mail e consultamos a ASAAS
 * ao vivo para status, valor, ciclo, próxima cobrança e resumo do cartão.
 *
 * Segurança: header `x-voyia-key` precisa bater com VOYIA_API_KEY (segredo
 * compartilhado). NUNCA expõe o número completo do cartão — só os 4 últimos
 * dígitos e a bandeira, exatamente como a ASAAS já devolve mascarado.
 *
 * GET /api/asaas/subscription-info?email=XXX
 *   → { available, status, planKey, value, cycle, billingType, nextDueDate,
 *       card: { last4, brand } | null }
 */

function authorized(h: Headers): boolean {
  const expected = process.env.VOYIA_API_KEY?.trim();
  if (!expected) return false;
  return h.get("x-voyia-key") === expected;
}

/** Só os 4 últimos + bandeira. Descarta qualquer token do cartão. */
function sanitizeCard(
  card?: AsaasCreditCardSummary,
): { last4: string; brand: string } | null {
  if (!card?.creditCardNumber) return null;
  const last4 = card.creditCardNumber.replace(/\D/g, "").slice(-4);
  if (!last4) return null;
  return { last4, brand: card.creditCardBrand ?? "" };
}

export async function GET(req: Request) {
  const h = await headers();
  if (!authorized(h)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = new URL(req.url).searchParams.get("email")?.trim() ?? "";
  if (!email) {
    return NextResponse.json(
      { available: false, error: "missing_email" },
      { status: 400 },
    );
  }

  const sub = getLatestVoyiaSubscriptionByEmail(email);
  if (!sub) {
    return NextResponse.json({ available: false });
  }

  try {
    const detail = await getSubscriptionDetail(sub.asaas_subscription_id);

    // A ASAAS NÃO devolve o cartão no detalhe da assinatura — só em pagamentos
    // efetivamente capturados (CONFIRMED/RECEIVED). Buscamos o pagamento com
    // cartão MAIS RECENTE para refletir o cartão atual (relevante após troca).
    let card = sanitizeCard(detail.creditCard);
    if (!card && (detail.billingType === "CREDIT_CARD" || !detail.billingType)) {
      try {
        const payments = await listSubscriptionPayments(sub.asaas_subscription_id);
        const withCard = (payments.data ?? [])
          .filter((p) => p.creditCard?.creditCardNumber)
          .sort((a, b) => (b.dateCreated ?? "").localeCompare(a.dateCreated ?? ""))[0];
        card = sanitizeCard(withCard?.creditCard);
      } catch {
        /* fallback opcional — segue sem cartão */
      }
    }

    return NextResponse.json({
      available: true,
      status: detail.status ?? sub.status,
      planKey: sub.plan_key,
      value: detail.value ?? sub.value,
      cycle: detail.cycle ?? sub.cycle,
      billingType: detail.billingType ?? sub.billing_type,
      nextDueDate: detail.nextDueDate ?? null,
      card,
    });
  } catch {
    // ASAAS indisponível — devolve o que temos localmente, sem cartão.
    return NextResponse.json({
      available: true,
      status: sub.status,
      planKey: sub.plan_key,
      value: sub.value,
      cycle: sub.cycle,
      billingType: sub.billing_type,
      nextDueDate: null,
      card: null,
      degraded: true,
    });
  }
}
