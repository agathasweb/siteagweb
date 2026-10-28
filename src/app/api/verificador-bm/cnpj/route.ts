import { NextResponse } from "next/server";
import { consultarCnpj, ErroVerificacao, ipDa, limiteExcedido } from "@/lib/verificador-bm";

export const dynamic = "force-dynamic";

/** POST /api/verificador-bm/cnpj  body: { cnpj } — etapa 1 do verificador de BM. */
export async function POST(req: Request) {
  if (limiteExcedido(`cnpj:${ipDa(req)}`, 10)) {
    return NextResponse.json({ message: "Muitas consultas. Aguarde um minuto." }, { status: 429 });
  }
  const { cnpj } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await consultarCnpj(String(cnpj || "")));
  } catch (err) {
    if (err instanceof ErroVerificacao) return NextResponse.json({ message: err.message }, { status: 400 });
    console.error("[verificador-bm] cnpj:", err);
    return NextResponse.json({ message: "Erro ao consultar o CNPJ." }, { status: 500 });
  }
}
