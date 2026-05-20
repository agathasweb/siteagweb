import { NextResponse } from "next/server";
import { getIndexNowKey } from "@/lib/indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IndexNow exige que o servidor sirva a key num URL acessível. Esta rota
// retorna a key configurada se o path bater (verificação por igualdade exata).
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key: requested } = await ctx.params;
  const configured = getIndexNowKey();
  if (!configured) {
    return new NextResponse("indexnow_not_configured", { status: 404 });
  }
  if (requested !== configured) {
    return new NextResponse("invalid_key", { status: 404 });
  }
  return new NextResponse(configured, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
