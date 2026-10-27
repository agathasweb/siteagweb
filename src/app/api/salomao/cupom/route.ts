import { NextResponse } from "next/server";
import { aplicarDesconto, validarCupom } from "@/lib/db/cupons";
import { getPlan } from "@/lib/asaas/plans";

/** GET /api/salomao/cupom?codigo=&plano= — mostra o preço com desconto antes de pagar. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = getPlan(url.searchParams.get("plano") ?? "");
  if (!plan || plan.category !== "salomao") return NextResponse.json({ ok: false, motivo: "Plano inválido." }, { status: 404 });
  if (plan.salomao?.periodicidade !== "mensal") {
    return NextResponse.json({ ok: false, motivo: "O cupom vale só no plano mensal." });
  }
  const v = validarCupom(url.searchParams.get("codigo") ?? "", "salomao");
  if (!v.ok) return NextResponse.json({ ok: false, motivo: v.motivo });
  return NextResponse.json({ ok: true, valor: aplicarDesconto(plan.value, v.cupom.percentual), meses: v.cupom.meses, percentual: v.cupom.percentual });
}
