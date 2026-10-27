import { NextRequest, NextResponse } from "next/server";
import { pendentesDeCriacao } from "@/lib/db/salomao";
import { getSubscriptionByAsaasId } from "@/lib/db/subscriptions";
import { sincronizarSalomao } from "@/lib/salomao/sincronizar";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/salomao-pendentes — refaz a criação das escolas do Salomão já pagas que não foram
 * criadas (o Salomão estava fora do ar quando o webhook chegou). Rodar a cada 10 min. Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resultado: Array<{ assinatura: string; criada: boolean }> = [];
  for (const sub of pendentesDeCriacao()) {
    await sincronizarSalomao(sub, "RETRY", sub.status);
    resultado.push({ assinatura: sub.asaas_subscription_id, criada: !!getSubscriptionByAsaasId(sub.asaas_subscription_id)?.salomao_escola_id });
  }

  return NextResponse.json({ ok: true, resultado });
}
