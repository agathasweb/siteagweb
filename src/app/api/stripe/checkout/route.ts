import { NextResponse } from "next/server";
import { stripe, stripeReady } from "@/lib/stripe/client";
import { ITENS, PRECOS, ehItem, moedaDoLocale, idiomaDaMoeda, contaSkrUrl, skrInterno } from "@/lib/skrender/venda";
import { getOriginForLocale, isLocale } from "@/lib/i18n";

/**
 * Abre o Stripe Checkout do SK Render (exterior). Recebe o token da conta (do fragmento da página, nunca da URL),
 * confere a conta na API interna do SK Render e manda o cliente para a página de pagamento da Stripe.
 * Identificação no webhook: metadata.conta (id da carteira), nunca o token.
 */
export async function POST(req: Request) {
  if (!stripeReady()) return NextResponse.json({ error: "Checkout unavailable." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as { token?: string; item?: string; lang?: string };
  const lang = String(b.lang || "");
  const moeda = isLocale(lang) ? moedaDoLocale(lang) : null;
  if (!moeda || !ehItem(b.item) || !/^[\w-]{20,40}$/.test(String(b.token || ""))) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const idioma = idiomaDaMoeda(moeda);
  let conta: { conta: string; nome: string; email: string | null; stripeCustomer: string | null; plano: { stripe: boolean } | null };
  try {
    conta = await skrInterno("conta", { token: b.token });
  } catch {
    return NextResponse.json({ error: idioma === "es" ? "Cuenta no encontrada." : "Account not found." }, { status: 404 });
  }
  const item = ITENS[b.item];
  if (item.assinatura && conta.plano) {
    return NextResponse.json({ error: idioma === "es" ? "Ya tienes una suscripción activa." : "You already have an active subscription." }, { status: 409 });
  }
  const origem = getOriginForLocale(lang as Parameters<typeof getOriginForLocale>[0]);
  const nome = idioma === "es"
    ? (item.assinatura ? `SK Render · ${item.renders} renders al mes` : `SK Render · paquete de ${item.renders} renders`)
    : (item.assinatura ? `SK Render · ${item.renders} renders per month` : `SK Render · ${item.renders} render pack`);
  const meta = { conta: conta.conta, item: b.item, moeda, idioma };
  const sessao = await stripe<{ url: string; id: string }>("POST", "/checkout/sessions", {
    mode: item.assinatura ? "subscription" : "payment",
    locale: idioma,
    client_reference_id: conta.conta,
    ...(conta.stripeCustomer ? { customer: conta.stripeCustomer } : { customer_email: conta.email || undefined, ...(item.assinatura ? {} : { customer_creation: "always" }) }),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: moeda,
        unit_amount: PRECOS[moeda][b.item],
        product_data: { name: nome, description: idioma === "es" ? "Render con IA para SketchUp y Revit" : "AI rendering for SketchUp and Revit" },
        ...(item.assinatura ? { recurring: { interval: "month" } } : {}),
      },
    }],
    metadata: meta,
    ...(item.assinatura ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
    success_url: `${origem}/sk-render/obrigado?item=${b.item}&s={CHECKOUT_SESSION_ID}`,
    cancel_url: contaSkrUrl(idioma),
  });
  return NextResponse.json({ url: sessao.url });
}
