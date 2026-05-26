"use server";

import { auth } from "@/auth";
import {
  listRetryCandidates,
  updateCapiRetry,
  pruneOldCapiLogs,
} from "@/lib/db/capi-log";
import { capiEndpoint, isPixelEnabled } from "@/lib/meta/config";

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

  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!isPixelEnabled() || !token) return { ok: false, error: "meta_disabled" };

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const candidates = listRetryCandidates(100);
  let retriedSuccess = 0;
  let retriedFailed = 0;

  for (const row of candidates) {
    if (!row.payload_json) {
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
  return { ok: true, retriedSuccess, retriedFailed, pruned };
}
