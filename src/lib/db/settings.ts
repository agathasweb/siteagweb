import "server-only";
import { db } from "./index";

const getStmt = db.prepare("SELECT value FROM settings WHERE key = ?");
const upsertStmt = db.prepare(`
  INSERT INTO settings (key, value, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
`);
const deleteStmt = db.prepare("DELETE FROM settings WHERE key = ?");

export function getSetting(key: string): string | null {
  const row = getStmt.get(key) as { value: string | null } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null): void {
  if (value === null || value === "") {
    deleteStmt.run(key);
    return;
  }
  upsertStmt.run(key, value);
}

export const SETTINGS_KEYS = {
  deepseekApiKey: "deepseek.api_key",
  deepseekModel: "deepseek.model",
  unsplashAccessKey: "unsplash.access_key",
  indexnowKey: "indexnow.key",
  recaptchaSiteKey: "recaptcha.site_key",
  recaptchaSecretKey: "recaptcha.secret_key",
  floatingWhatsappEnabled: "ui.floating_whatsapp_enabled",
  // Meta Ads — guard rails de orçamento (em reais)
  adsMaxDailyBudgetBrl: "meta_ads.max_daily_budget_brl",
  adsMinSpendCapBrl: "meta_ads.min_spend_cap_brl",
  adsMaxSpendCapBrl: "meta_ads.max_spend_cap_brl",
} as const;

/** Helper booleano: setting null/missing = default true. */
export function getBooleanSetting(key: string, defaultValue = true): boolean {
  const v = getSetting(key);
  if (v === null) return defaultValue;
  return v !== "false" && v !== "0";
}

/** Helper numérico: setting null/missing/inválido = default. */
export function getNumberSetting(key: string, defaultValue: number): number {
  const v = getSetting(key);
  if (v === null) return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}
