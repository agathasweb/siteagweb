import { NextResponse } from "next/server";
import { verificarEndereco } from "@/lib/salomao/api";

/** GET /api/salomao/disponibilidade?slug= — o checkout confere se o endereço da escola está livre. */
export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase().slice(0, 60);
  if (!slug) return NextResponse.json({ disponivel: false, motivo: "Informe o endereço." });
  try {
    return NextResponse.json(await verificarEndereco(slug));
  } catch {
    return NextResponse.json({ disponivel: false, motivo: "Não foi possível conferir agora." }, { status: 503 });
  }
}
