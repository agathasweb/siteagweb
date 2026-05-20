import "server-only";
import { db } from "./index";

export type LeadSource = "contact_form" | "whatsapp_cta" | "quote_request" | "other";
export type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "spam";

export interface LeadRow {
  id: number;
  source: LeadSource;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string | null;
  origin_page: string | null;
  status: LeadStatus;
  recaptcha_score: number | null;
  ip: string | null;
  user_agent: string | null;
  locale: string | null;
  notes: string | null;
  created_at: string;
  contacted_at: string | null;
}

export interface CreateLeadInput {
  source: LeadSource;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message?: string | null;
  origin_page?: string | null;
  recaptcha_score?: number | null;
  ip?: string | null;
  user_agent?: string | null;
  locale?: string | null;
}

const insertLeadStmt = db.prepare(`
  INSERT INTO leads (
    source, name, email, phone, service, message, origin_page,
    recaptcha_score, ip, user_agent, locale
  ) VALUES (
    @source, @name, @email, @phone, @service, @message, @origin_page,
    @recaptcha_score, @ip, @user_agent, @locale
  )
`);

export function createLead(input: CreateLeadInput): number {
  const info = insertLeadStmt.run({
    source: input.source,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    service: input.service ?? null,
    message: input.message ?? null,
    origin_page: input.origin_page ?? null,
    recaptcha_score: input.recaptcha_score ?? null,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
    locale: input.locale ?? null,
  });
  return Number(info.lastInsertRowid);
}

const listLeadsStmt = db.prepare(`
  SELECT * FROM leads
  ORDER BY created_at DESC
  LIMIT ?
`);

export function listLeads(limit = 500): LeadRow[] {
  return listLeadsStmt.all(limit) as LeadRow[];
}

const countByStatusStmt = db.prepare(`
  SELECT status, COUNT(*) AS c FROM leads GROUP BY status
`);

export function countLeadsByStatus(): Record<string, number> {
  const rows = countByStatusStmt.all() as { status: string; c: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.c]));
}

const updateStatusStmt = db.prepare(`
  UPDATE leads
  SET status = @status,
      contacted_at = CASE WHEN @status = 'contacted' AND contacted_at IS NULL THEN datetime('now') ELSE contacted_at END,
      notes = COALESCE(@notes, notes)
  WHERE id = @id
`);

export function updateLeadStatus(
  id: number,
  status: LeadStatus,
  notes?: string | null,
): void {
  updateStatusStmt.run({ id, status, notes: notes ?? null });
}

const deleteLeadStmt = db.prepare(`DELETE FROM leads WHERE id = ?`);

export function deleteLead(id: number): void {
  deleteLeadStmt.run(id);
}
