import { NextResponse } from "next/server";
import { eventoAssinado, stripe } from "@/lib/stripe/client";
import { skrInterno } from "@/lib/skrender/venda";

/**
 * Webhook da Stripe (SK Render no exterior). Assinatura conferida no corpo cru. Responde 500 quando o SK Render
 * falha, para a Stripe tentar de novo; a API interna de lá é idempotente (id da sessão/fatura).
 *   checkout.session.completed → pacote: credita os renders | assinatura: ativa o plano
 *   invoice.paid (subscription_cycle) → renova (a cota que sobrou acumula)
 *   customer.subscription.deleted → encerra
 */
type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Quanto a cobrança vale em reais (a conta liquida em BRL): é o que o YESHUA soma na receita. Vem da
 * balance_transaction da cobrança. Se não der para descobrir, segue sem (o YESHUA não pode somar dólar como real).
 */
async function valorBrl(o: Obj): Promise<number | undefined> {
  try {
    let pi: string | undefined = typeof o.payment_intent === "string" ? o.payment_intent : undefined;
    if (!pi && o.object === "invoice") {
      const ps = await stripe<Obj>("GET", "/invoice_payments", { invoice: o.id, limit: 1 });
      pi = ps.data?.[0]?.payment?.payment_intent;
    } else if (!pi && o.invoice) {
      const ps = await stripe<Obj>("GET", "/invoice_payments", { invoice: o.invoice, limit: 1 });
      pi = ps.data?.[0]?.payment?.payment_intent;
    }
    if (!pi) return undefined;
    // A balance_transaction aparece alguns segundos depois da cobrança (testado em 21/11): até 4 tentativas.
    for (let i = 0; i < 4; i++) {
      const p = await stripe<Obj>("GET", `/payment_intents/${pi}`, { expand: ["latest_charge.balance_transaction"] });
      const bt = p.latest_charge?.balance_transaction;
      if (bt) return bt.currency === "brl" ? bt.amount / 100 : undefined;
      await new Promise((r) => setTimeout(r, 2500));
    }
    return undefined;
  } catch (err) {
    console.error("[stripe webhook] valor em reais:", err instanceof Error ? err.message : err);
    return undefined;
  }
}

export async function POST(req: Request) {
  const corpo = await req.text();
  const ev = eventoAssinado<Obj>(corpo, req.headers.get("stripe-signature"));
  if (!ev) return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  const o: Obj = ev.data?.object || {};
  try {
    if (ev.type === "checkout.session.completed") {
      const m = o.metadata || {};
      if (!m.conta || !m.item) return NextResponse.json({ ignorado: true });
      const base = { conta: m.conta, item: m.item, valor: (o.amount_total || 0) / 100, moeda: o.currency, customer: o.customer || undefined, valor_brl: await valorBrl(o) };
      if (o.mode === "subscription") await skrInterno("assinar", { ...base, ref: o.subscription });
      else if (o.payment_status === "paid") await skrInterno("creditar", { ...base, ref: o.id });
    } else if (ev.type === "invoice.paid" && o.billing_reason === "subscription_cycle") {
      const sub = o.subscription || o.parent?.subscription_details?.subscription;
      if (sub) await skrInterno("renovar", { ref: sub, invoice: o.id, valor: (o.amount_paid || 0) / 100, moeda: o.currency, valor_brl: await valorBrl(o) });
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
