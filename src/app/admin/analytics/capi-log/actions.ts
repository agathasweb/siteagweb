"use server";

import { auth } from "@/auth";
import {
  listRetryCandidates,
  updateCapiRetry,
  pruneOldCapiLogs,
} from "@/lib/db/capi-log";
import { getCapiTargets, replayCapiLog } from "@/lib/meta/capi";

export interface RetryResult {
  ok: boolean;
  retriedSuccess?: number;
  retriedFailed?: number;
  pruned?: number;
  error?: string;
}

/**
 * Ação server-side pra triggerar retry manual a partir do /admin/analytics/capi-log.
 *
 * Mesma lógica do cron /api/cron/meta-retry, mas autenticada via sessão admin
 * (não precisa de CRON_SECRET). Útil pra rodar imediatamente após reconfigurar
 * algo no Pixel/CAPI e ver o resultado.
 */
export async function triggerMetaRetryAction(): Promise<RetryResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };

  if (getCapiTargets().length === 0) return { ok: false, error: "meta_disabled" };

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
    const permanent = r.error === "no_payload" || r.error === "payload_parse_error" || r.error === "pixel_not_configured";
    const nextStatus = permanent || row.attempts + 1 >= 3 ? "failed" : "retry_pending";
    updateCapiRetry(row.id, nextStatus, r.fbtrace_id, r.status, r.error);
    retriedFailed++;
  }

  const pruned = pruneOldCapiLogs();
  return { ok: true, retriedSuccess, retriedFailed, pruned };
}
