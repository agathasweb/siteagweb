import { NextRequest, NextResponse } from "next/server";
import { listRetryCandidates, updateCapiRetry, pruneOldCapiLogs } from "@/lib/db/capi-log";
import { capiEndpoint, isPixelEnabled } from "@/lib/meta/config";

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

  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!isPixelEnabled() || !token) {
    return NextResponse.json({ ok: false, error: "meta_disabled" });
  }

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();

  const candidates = listRetryCandidates(100);
  let retriedSuccess = 0;
  let retriedFailed = 0;

  for (const row of candidates) {
    if (!row.payload_json) {
      // Sem payload original — marca como failed permanente bumpando attempts até 3.
      updateCapiRetry(row.id, "failed", null, null, "no_payload");
      retriedFailed++;
      continue;
    }
    let eventData: unknown;
    try {
      eventData = JSON.parse(row.payload_json);
    } catch {
      updateCapiRetry(row.id, "failed", null, null, "payload_parse_error");
      retriedFailed++;
      continue;
    }

    const payload = {
      data: [eventData],
      ...(testCode ? { test_event_code: testCode } : {}),
    };

    try {
      const res = await fetch(
        `${capiEndpoint()}?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        fbtrace_id?: string;
        error?: { message?: string };
      };
      if (res.ok && !json.error) {
        updateCapiRetry(row.id, "sent", json.fbtrace_id ?? null, res.status, null);
        retriedSuccess++;
      } else {
        const msg = json.error?.message ?? `HTTP ${res.status}`;
        // Se ainda não esgotamos as 3 tentativas, mantém retry_pending.
        const nextStatus = row.attempts + 1 >= 3 ? "failed" : "retry_pending";
        updateCapiRetry(row.id, nextStatus, json.fbtrace_id ?? null, res.status, msg);
        retriedFailed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch_failed";
      const nextStatus = row.attempts + 1 >= 3 ? "failed" : "retry_pending";
      updateCapiRetry(row.id, nextStatus, null, null, msg);
      retriedFailed++;
    }
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
