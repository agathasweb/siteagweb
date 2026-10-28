import { NextResponse } from "next/server";
import { consultarCnpj, extrairCnpjDoPdf, ErroVerificacao, ipDa, limiteExcedido } from "@/lib/verificador-bm";

export const dynamic = "force-dynamic";

const LIMITE_BYTES = 5 * 1024 * 1024;

/** POST /api/verificador-bm/cnpj-pdf  multipart: file (PDF do cartão CNPJ). */
export async function POST(req: Request) {
  if (limiteExcedido(`cnpj:${ipDa(req)}`, 10)) {
    return NextResponse.json({ message: "Muitas consultas. Aguarde um minuto." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ message: "Envie o cartão CNPJ em PDF." }, { status: 400 });
  }
  if (file.size > LIMITE_BYTES) {
    return NextResponse.json({ message: "PDF maior que 5 MB." }, { status: 400 });
  }
  try {
    const cnpj = await extrairCnpjDoPdf(await file.arrayBuffer());
    return NextResponse.json(await consultarCnpj(cnpj));
  } catch (err) {
    if (err instanceof ErroVerificacao) return NextResponse.json({ message: err.message }, { status: 400 });
    console.error("[verificador-bm] pdf:", err);
    return NextResponse.json({ message: "Não foi possível ler o PDF." }, { status: 400 });
  }
}
