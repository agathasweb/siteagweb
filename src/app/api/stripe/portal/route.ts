import { NextResponse } from "next/server";
import { stripe, stripeReady } from "@/lib/stripe/client";
import { contaSkrUrl, skrInterno } from "@/lib/skrender/venda";

/** Portal do cliente da Stripe (cancelar assinatura, trocar cartão, recibos) para a conta do SK Render. */
export async function POST(req: Request) {
  if (!stripeReady()) return NextResponse.json({ error: "Unavailable." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as { token?: string; lang?: string };
  const idioma = b.lang === "es" ? "es" : "en";
  if (!/^[\w-]{20,40}$/.test(String(b.token || ""))) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  let conta: { stripeCustomer: string | null };
  try { conta = await skrInterno("conta", { token: b.token }); }
  catch { return NextResponse.json({ error: "Account not found." }, { status: 404 }); }
  if (!conta.stripeCustomer) return NextResponse.json({ error: idioma === "es" ? "No hay pagos con Stripe en esta cuenta." : "No Stripe payments on this account." }, { status: 404 });
  const s = await stripe<{ url: string }>("POST", "/billing_portal/sessions", { customer: conta.stripeCustomer, locale: idioma, return_url: contaSkrUrl(idioma) });
  return NextResponse.json({ url: s.url });
}
