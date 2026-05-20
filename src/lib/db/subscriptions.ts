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
  value: number;
  cycle: string;
  billing_type: string;
  status: SubscriptionStatus;
  account_token: string | null;
  account_created: number;
  confirmation_email_sent: number;
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
  value: number;
  cycle: string;
  billing_type: string;
  account_token: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO subscriptions (
    asaas_subscription_id, asaas_customer_id, plan_key, category,
    customer_name, customer_email, customer_phone, value, cycle,
    billing_type, account_token
  ) VALUES (
    @asaas_subscription_id, @asaas_customer_id, @plan_key, @category,
    @customer_name, @customer_email, @customer_phone, @value, @cycle,
    @billing_type, @account_token
  )
`);

export function recordSubscription(input: CreateSubscriptionRecord): number {
  const info = insertStmt.run(input);
  return Number(info.lastInsertRowid);
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
