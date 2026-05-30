import "server-only";
import { db } from "./index";

export type CapiLogStatus = "sent" | "failed" | "retry_pending";

export interface CapiLogRow {
  id: number;
  event_name: string;
  event_id: string;
  pixel_id: string | null;
  status: CapiLogStatus;
  fbtrace_id: string | null;
  http_status: number | null;
  error: string | null;
  attempts: number;
  test_mode: number;
  lead_id: number | null;
  subscription_id: number | null;
  payload_json: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface RecordCapiInput {
  event_name: string;
  event_id: string;
  pixel_id?: string | null;
  status: CapiLogStatus;
  fbtrace_id?: string | null;
  http_status?: number | null;
  error?: string | null;
  attempts?: number;
  test_mode?: boolean;
  lead_id?: number | null;
  subscription_id?: number | null;
  payload_json?: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO capi_event_log (
    event_name, event_id, pixel_id, status, fbtrace_id, http_status, error,
    attempts, test_mode, lead_id, subscription_id, payload_json, sent_at
  ) VALUES (
    @event_name, @event_id, @pixel_id, @status, @fbtrace_id, @http_status, @error,
    @attempts, @test_mode, @lead_id, @subscription_id, @payload_json,
    CASE WHEN @status = 'sent' THEN datetime('now') ELSE NULL END
  )
`);

export function recordCapiEvent(input: RecordCapiInput): number {
  const info = insertStmt.run({
    event_name: input.event_name,
    event_id: input.event_id,
    pixel_id: input.pixel_id ?? null,
    status: input.status,
    fbtrace_id: input.fbtrace_id ?? null,
    http_status: input.http_status ?? null,
    error: input.error ?? null,
    attempts: input.attempts ?? 1,
    test_mode: input.test_mode ? 1 : 0,
    lead_id: input.lead_id ?? null,
    subscription_id: input.subscription_id ?? null,
    payload_json: input.payload_json ?? null,
  });
  return Number(info.lastInsertRowid);
}

/** Marca um log existente como reenviado com sucesso (usado pelo retry). */
const updateRetryStmt = db.prepare(`
  UPDATE capi_event_log
  SET status = @status,
      fbtrace_id = COALESCE(@fbtrace_id, fbtrace_id),
      http_status = @http_status,
      error = @error,
      attempts = attempts + 1,
      sent_at = CASE WHEN @status = 'sent' THEN datetime('now') ELSE sent_at END
  WHERE id = @id
`);

export function updateCapiRetry(
  id: number,
  status: CapiLogStatus,
  fbtrace_id: string | null,
  http_status: number | null,
  error: string | null,
): void {
  updateRetryStmt.run({ id, status, fbtrace_id, http_status, error });
}

/** Pega os candidatos a retry — failed ou retry_pending com attempts < 3 nas últimas 24h. */
export function listRetryCandidates(limit = 100): CapiLogRow[] {
  return db
    .prepare(
      `SELECT * FROM capi_event_log
       WHERE status IN ('failed', 'retry_pending')
         AND attempts < 3
         AND created_at > datetime('now', '-24 hours')
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .all(limit) as CapiLogRow[];
}

/** Limpa logs > 90 dias (retenção fixa). Retorna nº de registros deletados. */
export function pruneOldCapiLogs(): number {
  const info = db
    .prepare(`DELETE FROM capi_event_log WHERE created_at < datetime('now', '-90 days')`)
    .run();
  return info.changes;
}

// ---------- Agregações pro dashboard ----------

export interface CapiEventCounts {
  event_name: string;
  total: number;
  sent: number;
  failed: number;
  retry_pending: number;
}

export function capiCountsByEvent(sinceDays: number): CapiEventCounts[] {
  return db
    .prepare(
      `SELECT
         event_name,
         COUNT(*) AS total,
         SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) AS sent,
         SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status='retry_pending' THEN 1 ELSE 0 END) AS retry_pending
       FROM capi_event_log
       WHERE created_at > datetime('now', '-' || ? || ' days')
       GROUP BY event_name
       ORDER BY total DESC`,
    )
    .all(sinceDays) as CapiEventCounts[];
}

export function listRecentCapiLogs(limit = 100): CapiLogRow[] {
  return db
    .prepare(`SELECT * FROM capi_event_log ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as CapiLogRow[];
}
