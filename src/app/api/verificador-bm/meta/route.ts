import { NextResponse } from "next/server";
import { verificarMeta, ErroVerificacao, ipDa, limiteExcedido } from "@/lib/verificador-bm";

export const dynamic = "force-dynamic";

/**
 * POST /api/verificador-bm/meta  body: { cnpj, code, waba_id? }
 * Troca o `code` do Embedded Signup do app do Voyia e lê BM/WABA/números.
 */
export async function POST(req: Request) {
  if (limiteExcedido(`meta:${ipDa(req)}`, 5)) {
    return NextResponse.json({ message: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body?.cnpj || !body?.code) {
    return NextResponse.json({ message: "CNPJ e autorização da Meta são obrigatórios." }, { status: 400 });
  }
  try {
    return NextResponse.json(await verificarMeta(String(body.cnpj), String(body.code), body.waba_id || undefined));
  } catch (err) {
    if (err instanceof ErroVerificacao) return NextResponse.json({ message: err.message }, { status: 400 });
    console.error("[verificador-bm] meta:", err);
    return NextResponse.json({ message: "Erro ao consultar a Meta." }, { status: 500 });
  }
}
