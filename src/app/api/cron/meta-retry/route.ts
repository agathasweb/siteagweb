import { NextRequest, NextResponse } from "next/server";
import { listRetryCandidates, updateCapiRetry, pruneOldCapiLogs } from "@/lib/db/capi-log";
import { getCapiTargets, replayCapiLog } from "@/lib/meta/capi";

export const dynamic = "force-dynamic";

/**
 * Cron de manutenção da integração Meta CAPI.
 *
 * Duas funções idempotentes:
 *  1. RETRY — pega eventos com status `failed` ou `retry_pending` das últimas
 *     24h que ainda têm `attempts < 3` e tenta reenviar com o payload original.
 *     Por que 24h: a Meta tolera eventos com até 7 dias de atraso, mas a janela
 *     de matching/dedup deteriora rápido. 24h é o "sweet spot" entre não
 *     descartar e não trazer benefício marginal pra eventos antigos.
 *  2. PRUNE — deleta logs com `created_at` > 90 dias (retenção fixa).
 *
 * Autenticação: Bearer `CRON_SECRET` (mesmo padrão do publish-scheduled).
 *
 * Pode ser chamado:
 *  - Manualmente pelo /admin/analytics/capi-log (botão "Retentar agora")
 *  - Por um cron externo (Vercel Cron, GitHub Actions, etc.) com Authorization
 *    header. Recomendação: rodar a cada 15min.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getCapiTargets().length === 0) {
    return NextResponse.json({ ok: false, error: "meta_disabled" });
  }

  const candidates = listRetryCandidates(100);
  let retriedSuccess = 0;
  let retriedFailed = 0;

  for (const row of candidates) {
    const r = await replayCapiLog(row);
    if (r.ok) {
      updateCapiRetry(row.id, "sent", r.fbtrace_id, r.status, null);
      retriedSuccess++;
      continue;
    }
    // Erros permanentes não dependem de nova tentativa.
    const permanent = r.error === "no_payload" || r.error === "payload_parse_error" || r.error === "pixel_not_configured";
    const nextStatus = permanent || row.attempts + 1 >= 3 ? "failed" : "retry_pending";
    updateCapiRetry(row.id, nextStatus, r.fbtrace_id, r.status, r.error);
    retriedFailed++;
  }

  const pruned = pruneOldCapiLogs();

  return NextResponse.json({
    ok: true,
    retried: candidates.length,
    retriedSuccess,
    retriedFailed,
    pruned,
  });
}
