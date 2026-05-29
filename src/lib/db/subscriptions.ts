import "server-only";
import { db } from "./index";

export type SubscriptionStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RECEIVED"
  | "OVERDUE"
  | "CANCELED";

export interface SubscriptionRow {
  id: number;
  asaas_subscription_id: string;
  asaas_customer_id: string;
  plan_key: string;
  category: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf_cnpj: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  customer_country: string | null;
  value: number;
  cycle: string;
  billing_type: string;
  status: SubscriptionStatus;
  account_token: string | null;
  account_created: number;
  confirmation_email_sent: number;
  // Meta attribution (capturado no checkout, reusado no webhook)
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  meta_event_id: string | null;
  meta_initiatecheckout_sent_at: string | null;
  meta_subscribe_sent_at: string | null;
  meta_purchase_sent_at: string | null;
  meta_completereg_sent_at: string | null;
  abandoned_flagged_at: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
}

export interface CreateSubscriptionRecord {
  asaas_subscription_id: string;
  asaas_customer_id: string;
  plan_key: string;
  category: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf_cnpj: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_zip?: string | null;
  customer_country?: string | null;
  value: number;
  cycle: string;
  billing_type: string;
  account_token: string | null;
  // Meta attribution opcional — preenchido pelo /api/asaas/checkout.
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  meta_event_id?: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO subscriptions (
    asaas_subscription_id, asaas_customer_id, plan_key, category,
    customer_name, customer_email, customer_phone, customer_cpf_cnpj,
    customer_city, customer_state, customer_zip, customer_country,
    value, cycle, billing_type, account_token,
    fbp, fbc, fbclid, gclid,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    meta_event_id
  ) VALUES (
    @asaas_subscription_id, @asaas_customer_id, @plan_key, @category,
    @customer_name, @customer_email, @customer_phone, @customer_cpf_cnpj,
    @customer_city, @customer_state, @customer_zip, @customer_country,
    @value, @cycle, @billing_type, @account_token,
    @fbp, @fbc, @fbclid, @gclid,
    @utm_source, @utm_medium, @utm_campaign, @utm_term, @utm_content,
    @meta_event_id
  )
`);

export function recordSubscription(input: CreateSubscriptionRecord): number {
  const info = insertStmt.run({
    ...input,
    customer_city: input.customer_city ?? null,
    customer_state: input.customer_state ?? null,
    customer_zip: input.customer_zip ?? null,
    customer_country: input.customer_country ?? null,
    fbp: input.fbp ?? null,
    fbc: input.fbc ?? null,
    fbclid: input.fbclid ?? null,
    gclid: input.gclid ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_term: input.utm_term ?? null,
    utm_content: input.utm_content ?? null,
    meta_event_id: input.meta_event_id ?? null,
  });
  return Number(info.lastInsertRowid);
}

/**
 * Marca um evento Meta como enviado pra evitar reenvio em retries do webhook.
 *
 * O `event` é o nome canônico Meta (ex.: "Subscribe", "Purchase").
 * Retorna `true` se o update aconteceu (primeira vez), `false` se já estava
 * marcado — o caller usa pra decidir se chama o CAPI.
 */
type MetaSentColumn =
  | "meta_initiatecheckout_sent_at"
  | "meta_subscribe_sent_at"
  | "meta_purchase_sent_at"
  | "meta_completereg_sent_at";

const META_EVENT_COLUMN: Record<string, MetaSentColumn> = {
  InitiateCheckout: "meta_initiatecheckout_sent_at",
  Subscribe: "meta_subscribe_sent_at",
  Purchase: "meta_purchase_sent_at",
  CompleteRegistration: "meta_completereg_sent_at",
};

/**
 * Checa idempotência ANTES de enviar o evento. Retorna true se já enviou —
 * o caller deve pular o CAPI. Não atualiza nada (use markMetaEventSent depois).
 */
export function metaEventAlreadySent(asaasId: string, eventName: string): boolean {
  const col = META_EVENT_COLUMN[eventName];
  if (!col) return false;
  const row = db
    .prepare(`SELECT ${col} AS sent FROM subscriptions WHERE asaas_subscription_id = ?`)
    .get(asaasId) as { sent: string | null } | undefined;
  return !!row?.sent;
}

export function markMetaEventSent(asaasId: string, eventName: string): void {
  const col = META_EVENT_COLUMN[eventName];
  if (!col) return;
  db.prepare(
    `UPDATE subscriptions SET ${col} = datetime('now'), updated_at = datetime('now') WHERE asaas_subscription_id = ?`,
  ).run(asaasId);
}

export function markMetaEventSentByToken(token: string, eventName: string): void {
  const col = META_EVENT_COLUMN[eventName];
  if (!col) return;
  db.prepare(
    `UPDATE subscriptions SET ${col} = datetime('now'), updated_at = datetime('now') WHERE account_token = ?`,
  ).run(token);
}

const byAsaasIdStmt = db.prepare(
  "SELECT * FROM subscriptions WHERE asaas_subscription_id = ?",
);
export function getSubscriptionByAsaasId(asaasId: string): SubscriptionRow | null {
  return (byAsaasIdStmt.get(asaasId) as SubscriptionRow | undefined) ?? null;
}

const byTokenStmt = db.prepare(
  "SELECT * FROM subscriptions WHERE account_token = ?",
);
export function getSubscriptionByToken(token: string): SubscriptionRow | null {
  if (!token) return null;
  return (byTokenStmt.get(token) as SubscriptionRow | undefined) ?? null;
}

const updateStatusStmt = db.prepare(`
  UPDATE subscriptions
  SET status = @status,
      updated_at = datetime('now'),
      confirmed_at = CASE
        WHEN @status IN ('CONFIRMED','RECEIVED') AND confirmed_at IS NULL
        THEN datetime('now') ELSE confirmed_at END
  WHERE asaas_subscription_id = @asaas_subscription_id
`);
export function updateSubscriptionStatus(
  asaasId: string,
  status: SubscriptionStatus,
): void {
  updateStatusStmt.run({ asaas_subscription_id: asaasId, status });
}

const deleteSubscriptionStmt = db.prepare(
  "DELETE FROM subscriptions WHERE id = ?",
);
export function deleteSubscription(id: number): void {
  deleteSubscriptionStmt.run(id);
}

const markEmailSentStmt = db.prepare(
  "UPDATE subscriptions SET confirmation_email_sent = 1, updated_at = datetime('now') WHERE asaas_subscription_id = ?",
);
export function markConfirmationEmailSent(asaasId: string): void {
  markEmailSentStmt.run(asaasId);
}

const markAccountCreatedStmt = db.prepare(
  "UPDATE subscriptions SET account_created = 1, updated_at = datetime('now') WHERE account_token = ?",
);
export function markAccountCreated(token: string): void {
  markAccountCreatedStmt.run(token);
}

/**
 * Assinaturas cujo checkout foi iniciado mas o pagamento NÃO foi concluído.
 *
 * Critério: status ainda não-pago (fora de CONFIRMED/RECEIVED), criada há mais
 * de `minutesAgo` minutos, ainda não sinalizada como abandonada, e dentro de
 * uma janela recente (`lookbackDays`) para não reprocessar registros antigos.
 */
export function listAbandonedCheckouts(
  minutesAgo = 30,
  lookbackDays = 7,
): SubscriptionRow[] {
  return db
    .prepare(
      `SELECT * FROM subscriptions
        WHERE status NOT IN ('CONFIRMED','RECEIVED')
          AND abandoned_flagged_at IS NULL
          AND created_at <= datetime('now', @cutoff)
          AND created_at >= datetime('now', @lookback)
        ORDER BY created_at ASC
        LIMIT 100`,
    )
    .all({
      cutoff: `-${minutesAgo} minutes`,
      lookback: `-${lookbackDays} days`,
    }) as SubscriptionRow[];
}

const markAbandonedStmt = db.prepare(
  "UPDATE subscriptions SET abandoned_flagged_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
);
/** Marca a assinatura como já sinalizada (evita notificação/tag duplicada). */
export function markAbandonedFlagged(id: number): void {
  markAbandonedStmt.run(id);
}

export interface ListSubscriptionsFilter {
  status?: SubscriptionStatus;
  category?: string;
}

export function listSubscriptions(filter: ListSubscriptionsFilter = {}): SubscriptionRow[] {
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (filter.status) {
    where.push("status = @status");
    params.status = filter.status;
  }
  if (filter.category) {
    where.push("category = @category");
    params.category = filter.category;
  }
  const sql =
    "SELECT * FROM subscriptions" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY created_at DESC LIMIT 500";
  return db.prepare(sql).all(params) as SubscriptionRow[];
}

export interface SubscriptionStats {
  total: number;
  pending: number;
  active: number; // CONFIRMED + RECEIVED
  overdue: number;
  canceled: number;
}

export function getSubscriptionStats(): SubscriptionStats {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status IN ('CONFIRMED','RECEIVED') THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) AS overdue,
         SUM(CASE WHEN status = 'CANCELED' THEN 1 ELSE 0 END) AS canceled
       FROM subscriptions`,
    )
    .get() as Record<string, number | null>;
  return {
    total: row.total ?? 0,
    pending: row.pending ?? 0,
    active: row.active ?? 0,
    overdue: row.overdue ?? 0,
    canceled: row.canceled ?? 0,
  };
}
