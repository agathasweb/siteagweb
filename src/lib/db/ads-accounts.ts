import "server-only";
import { db } from "./index";

export interface AdsAccountRow {
  id: number;
  ad_account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string | null;
  business_id: string | null;
  business_name: string | null;
  amount_spent: number;
  balance: number;
  ativo: number;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

const upsertStmt = db.prepare(`
  INSERT INTO ads_accounts (
    ad_account_id, name, account_status, currency, timezone_name,
    business_id, business_name, amount_spent, balance
  ) VALUES (
    @ad_account_id, @name, @account_status, @currency, @timezone_name,
    @business_id, @business_name, @amount_spent, @balance
  )
  ON CONFLICT(ad_account_id) DO UPDATE SET
    name = excluded.name,
    account_status = excluded.account_status,
    currency = excluded.currency,
    timezone_name = excluded.timezone_name,
    business_id = excluded.business_id,
    business_name = excluded.business_name,
    amount_spent = excluded.amount_spent,
    balance = excluded.balance,
    last_sync_at = datetime('now'),
    updated_at = datetime('now')
`);

export function upsertAdsAccount(input: {
  ad_account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name?: string | null;
  business_id?: string | null;
  business_name?: string | null;
  amount_spent?: number;
  balance?: number;
}): void {
  upsertStmt.run({
    ad_account_id: input.ad_account_id,
    name: input.name,
    account_status: input.account_status,
    currency: input.currency,
    timezone_name: input.timezone_name ?? null,
    business_id: input.business_id ?? null,
    business_name: input.business_name ?? null,
    amount_spent: input.amount_spent ?? 0,
    balance: input.balance ?? 0,
  });
}

export function listManagedAdsAccounts(): AdsAccountRow[] {
  return db
    .prepare(`SELECT * FROM ads_accounts WHERE ativo = 1 ORDER BY name`)
    .all() as AdsAccountRow[];
}

export function listAllAdsAccounts(): AdsAccountRow[] {
  return db
    .prepare(`SELECT * FROM ads_accounts ORDER BY ativo DESC, name`)
    .all() as AdsAccountRow[];
}

export function getAdsAccountById(adAccountId: string): AdsAccountRow | null {
  return (db
    .prepare(`SELECT * FROM ads_accounts WHERE ad_account_id = ?`)
    .get(adAccountId) as AdsAccountRow | undefined) ?? null;
}

export function setAdsAccountActive(adAccountId: string, ativo: boolean): void {
  db.prepare(
    `UPDATE ads_accounts SET ativo = ?, updated_at = datetime('now') WHERE ad_account_id = ?`,
  ).run(ativo ? 1 : 0, adAccountId);
}
