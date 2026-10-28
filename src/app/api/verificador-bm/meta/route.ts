import { NextResponse } from "next/server";
import { verificarMeta, ErroVerificacao, ipDa, limiteExcedido } from "@/lib/verificador-bm";

export const dynamic = "force-dynamic";

/**
 * POST /api/verificador-bm/meta  body: { cnpj, code? | accessToken? }
 * Recebe a autorização do login do Facebook (app do Voyia) e lê BM/WABA/números.
 */
export async function POST(req: Request) {
  if (limiteExcedido(`meta:${ipDa(req)}`, 5)) {
    return NextResponse.json({ message: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body?.cnpj || (!body?.code && !body?.accessToken)) {
    return NextResponse.json({ message: "CNPJ e autorização da Meta são obrigatórios." }, { status: 400 });
  }
  try {
    return NextResponse.json(await verificarMeta(String(body.cnpj), {
      code: body.code ? String(body.code) : undefined,
      accessToken: body.accessToken ? String(body.accessToken) : undefined,
    }));
  } catch (err) {
    if (err instanceof ErroVerificacao) return NextResponse.json({ message: err.message }, { status: 400 });
    console.error("[verificador-bm] meta:", err);
    return NextResponse.json({ message: "Erro ao consultar a Meta." }, { status: 500 });
  }
}
