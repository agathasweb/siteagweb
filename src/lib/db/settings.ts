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
} as const;
