"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import { checkDeepSeek, type DeepSeekStatus } from "@/lib/ai/translate";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }
}

function getString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveDeepSeekSettingsAction(formData: FormData) {
  await requireAdmin();

  const apiKey = getString(formData, "deepseek_api_key");
  const model = getString(formData, "deepseek_model") || "deepseek-chat";

  // Sentinel: campo vazio + checkbox "manter" significa não alterar a key.
  const keepExisting = getString(formData, "keep_key") === "1";
  if (!keepExisting) {
    setSetting(SETTINGS_KEYS.deepseekApiKey, apiKey || null);
  }
  setSetting(SETTINGS_KEYS.deepseekModel, model);

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function clearDeepSeekKeyAction() {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.deepseekApiKey, null);
  revalidatePath("/admin/settings");
}

export interface TestResult {
  status: DeepSeekStatus;
  testedAt: string;
}

export async function testDeepSeekAction(): Promise<TestResult> {
  await requireAdmin();
  const status = await checkDeepSeek();
  return { status, testedAt: new Date().toISOString() };
}
