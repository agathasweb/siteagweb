import { NextResponse } from "next/server";
import { listarBms, avaliarBm, ErroVerificacao, ipDa, limiteExcedido } from "@/lib/verificador-bm";

export const dynamic = "force-dynamic";

/**
 * POST /api/verificador-bm/meta
 *   { cnpj, code? | accessToken? } → { sessao, bms }  (login do Facebook; lista as BMs)
 *   { sessao, bmId }               → resultado da verificação da BM escolhida
 */
export async function POST(req: Request) {
  if (limiteExcedido(`meta:${ipDa(req)}`, 10)) {
    return NextResponse.json({ message: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    if (body?.sessao && body?.bmId) {
      return NextResponse.json(await avaliarBm(String(body.sessao), String(body.bmId)));
    }
    if (!body?.cnpj || (!body?.code && !body?.accessToken)) {
      return NextResponse.json({ message: "CNPJ e autorização da Meta são obrigatórios." }, { status: 400 });
    }
    return NextResponse.json(await listarBms(String(body.cnpj), {
      code: body.code ? String(body.code) : undefined,
      accessToken: body.accessToken ? String(body.accessToken) : undefined,
    }));
  } catch (err) {
    if (err instanceof ErroVerificacao) {
      console.warn(`[verificador-bm] meta recusado: ${err.message}`);
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    console.error("[verificador-bm] meta:", err);
    return NextResponse.json({ message: "Erro ao consultar a Meta." }, { status: 500 });
  }
}
