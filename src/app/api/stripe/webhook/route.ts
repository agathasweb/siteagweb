import { NextResponse } from "next/server";
import { eventoAssinado } from "@/lib/stripe/client";
import { skrInterno } from "@/lib/skrender/venda";

/**
 * Webhook da Stripe (SK Render no exterior). Assinatura conferida no corpo cru. Responde 500 quando o SK Render
 * falha, para a Stripe tentar de novo; a API interna de lá é idempotente (id da sessão/fatura).
 *   checkout.session.completed → pacote: credita os renders | assinatura: ativa o plano
 *   invoice.paid (subscription_cycle) → renova (a cota que sobrou acumula)
 *   customer.subscription.deleted → encerra
 */
type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function POST(req: Request) {
  const corpo = await req.text();
  const ev = eventoAssinado<Obj>(corpo, req.headers.get("stripe-signature"));
  if (!ev) return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  const o: Obj = ev.data?.object || {};
  try {
    if (ev.type === "checkout.session.completed") {
      const m = o.metadata || {};
      if (!m.conta || !m.item) return NextResponse.json({ ignorado: true });
      const base = { conta: m.conta, item: m.item, valor: (o.amount_total || 0) / 100, moeda: o.currency, customer: o.customer || undefined };
      if (o.mode === "subscription") await skrInterno("assinar", { ...base, ref: o.subscription });
      else if (o.payment_status === "paid") await skrInterno("creditar", { ...base, ref: o.id });
    } else if (ev.type === "invoice.paid" && o.billing_reason === "subscription_cycle") {
      const sub = o.subscription || o.parent?.subscription_details?.subscription;
      if (sub) await skrInterno("renovar", { ref: sub, invoice: o.id, valor: (o.amount_paid || 0) / 100, moeda: o.currency });
    } else if (ev.type === "customer.subscription.deleted") {
      await skrInterno("encerrar", { ref: o.id });
    }
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error(`[stripe webhook] ${ev.type} ${o.id}:`, err instanceof Error ? err.message : err);
    // Conta/assinatura inexistente não adianta repetir; o resto a Stripe reenvia.
    if (status === 404 || status === 400) return NextResponse.json({ erro: true, status });
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
