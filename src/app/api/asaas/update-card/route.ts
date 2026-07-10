import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLatestVoyiaSubscriptionByEmail } from "@/lib/db/subscriptions";
import {
  updateSubscriptionCreditCard,
  type AsaasCreditCardSummary,
} from "@/lib/asaas/client";

export const dynamic = "force-dynamic";

/**
 * Troca do cartão da assinatura Voyia (Fase 2). Consumido pelo voyia-dev.
 *
 * A ASAAS NÃO oferece página hospedada de troca de cartão; a única forma sem
 * cobrança imediata é `PUT /subscriptions/{id}/creditCard`. Logo, os dados do
 * cartão passam por aqui EM TRÂNSITO. Regras de PCI aplicadas:
 *   - nunca logar o corpo / número do cartão;
 *   - nada é persistido (o PAN é repassado à ASAAS e descartado);
 *   - resposta só devolve os 4 últimos dígitos + bandeira.
 *
 * Segurança: header `x-voyia-key` = VOYIA_API_KEY (segredo compartilhado).
 *
 * POST /api/asaas/update-card
 *   body: { email, remoteIp, creditCard{...}, holderInfo{...} }
 *   → { ok, card: { last4, brand } }
 */

function authorized(h: Headers): boolean {
  const expected = process.env.VOYIA_API_KEY?.trim();
  if (!expected) return false;
  return h.get("x-voyia-key") === expected;
}

function sanitizeCard(
  card?: AsaasCreditCardSummary,
): { last4: string; brand: string } | null {
  if (!card?.creditCardNumber) return null;
  const last4 = card.creditCardNumber.replace(/\D/g, "").slice(-4);
  if (!last4) return null;
  return { last4, brand: card.creditCardBrand ?? "" };
}

interface UpdateCardBody {
  email?: string;
  remoteIp?: string;
  creditCard?: {
    holderName?: string;
    number?: string;
    expiryMonth?: string;
    expiryYear?: string;
    ccv?: string;
  };
  holderInfo?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    postalCode?: string;
    addressNumber?: string;
    phone?: string;
    addressComplement?: string;
  };
}

export async function POST(req: Request) {
  const h = await headers();
  if (!authorized(h)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: UpdateCardBody;
  try {
    body = (await req.json()) as UpdateCardBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const cc = body.creditCard;
  const hi = body.holderInfo;
  const remoteIp = body.remoteIp?.trim();

  if (!email || !cc?.number || !cc.holderName || !cc.expiryMonth || !cc.expiryYear || !cc.ccv) {
    return NextResponse.json({ ok: false, error: "missing_card_fields" }, { status: 400 });
  }
  if (!hi?.name || !hi.cpfCnpj || !hi.postalCode || !hi.addressNumber || !hi.phone) {
    return NextResponse.json({ ok: false, error: "missing_holder_fields" }, { status: 400 });
  }

  const sub = getLatestVoyiaSubscriptionByEmail(email);
  if (!sub) {
    return NextResponse.json({ ok: false, error: "subscription_not_found" }, { status: 404 });
  }

  try {
    const updated = await updateSubscriptionCreditCard(sub.asaas_subscription_id, {
      creditCard: {
        holderName: cc.holderName,
        number: cc.number.replace(/\s/g, ""),
        expiryMonth: cc.expiryMonth,
        expiryYear: cc.expiryYear,
        ccv: cc.ccv,
      },
      creditCardHolderInfo: {
        name: hi.name,
        email: hi.email || sub.customer_email,
        cpfCnpj: hi.cpfCnpj.replace(/\D/g, ""),
        postalCode: hi.postalCode.replace(/\D/g, ""),
        addressNumber: hi.addressNumber,
        phone: hi.phone.replace(/\D/g, ""),
        ...(hi.addressComplement ? { addressComplement: hi.addressComplement } : {}),
      },
      // Fallback só se o voyia-dev não repassar o IP do cliente.
      remoteIp: remoteIp || (h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"),
    });

    return NextResponse.json({ ok: true, card: sanitizeCard(updated.creditCard) });
  } catch (err) {
    // A mensagem já vem tratada do client (descrição legível da ASAAS).
    // NÃO logamos o corpo — apenas a mensagem de erro, sem dados do cartão.
    const message = err instanceof Error ? err.message : "Falha ao atualizar o cartão.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
