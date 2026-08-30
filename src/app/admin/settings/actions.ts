"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import { checkGemini, DEFAULT_MODEL as DEFAULT_GEMINI_MODEL, type GeminiStatus } from "@/lib/ai/gemini";
import { checkUnsplash, type UnsplashStatus } from "@/lib/unsplash";
import { getIndexNowKey, getIndexNowKeySource, generateIndexNowKey } from "@/lib/indexer";
import { isRecaptchaConfigured, getRecaptchaSiteKey, getRecaptchaSecretKey, getRecaptchaKeySource } from "@/lib/recaptcha";
import { pingWebSub, getWebSubFeedUrls } from "@/lib/google-websub";
import { submitUrlsForIndexing, buildInstitutionalUrls } from "@/lib/seo-sync";

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

export async function saveGeminiSettingsAction(formData: FormData) {
  await requireAdmin();

  const apiKey = getString(formData, "gemini_api_key");
  const model = getString(formData, "gemini_model") || DEFAULT_GEMINI_MODEL;

  // Sentinel: campo vazio + checkbox "manter" significa não alterar a key.
  const keepExisting = getString(formData, "keep_key") === "1";
  if (!keepExisting) {
    setSetting(SETTINGS_KEYS.geminiApiKey, apiKey || null);
  }
  setSetting(SETTINGS_KEYS.geminiModel, model);

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function clearGeminiKeyAction() {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.geminiApiKey, null);
  revalidatePath("/admin/settings");
}

export interface TestResult {
  status: GeminiStatus;
  testedAt: string;
}

export async function testGeminiAction(): Promise<TestResult> {
  await requireAdmin();
  const status = await checkGemini();
  return { status, testedAt: new Date().toISOString() };
}

// ---------- Unsplash ----------

export async function saveUnsplashSettingsAction(formData: FormData) {
  await requireAdmin();
  const accessKey = getString(formData, "unsplash_access_key");
  const keepExisting = getString(formData, "keep_key") === "1";
  if (!keepExisting) {
    setSetting(SETTINGS_KEYS.unsplashAccessKey, accessKey || null);
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function clearUnsplashKeyAction() {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.unsplashAccessKey, null);
  revalidatePath("/admin/settings");
}

export interface UnsplashTestResult {
  status: UnsplashStatus;
  testedAt: string;
}

export async function testUnsplashAction(): Promise<UnsplashTestResult> {
  await requireAdmin();
  const status = await checkUnsplash();
  return { status, testedAt: new Date().toISOString() };
}

// ---------- IndexNow ----------

export interface IndexNowSettingsStatus {
  key: string | null; // chave em texto pleno (precisa pro user ver pra colar em outros lugares)
  source: "db" | "env" | "none";
  keyLocation: string | null; // URL onde o file fica acessível (host-specific)
}

export async function getIndexNowSettingsAction(): Promise<IndexNowSettingsStatus> {
  await requireAdmin();
  const key = getIndexNowKey();
  return {
    key,
    source: getIndexNowKeySource(),
    keyLocation: key ? `/api/indexnow/${key}` : null,
  };
}

export async function generateIndexNowKeyAction(): Promise<{ key: string }> {
  await requireAdmin();
  const key = generateIndexNowKey();
  setSetting(SETTINGS_KEYS.indexnowKey, key);
  revalidatePath("/admin/settings");
  return { key };
}

export async function clearIndexNowKeyAction(): Promise<void> {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.indexnowKey, null);
  revalidatePath("/admin/settings");
}

// ---------- reCAPTCHA v3 ----------

export interface RecaptchaSettingsStatus {
  configured: boolean;
  source: "db" | "env" | "none";
  siteKey: string | null;
  hasSecret: boolean;
}

export async function getRecaptchaSettingsAction(): Promise<RecaptchaSettingsStatus> {
  await requireAdmin();
  return {
    configured: isRecaptchaConfigured(),
    source: getRecaptchaKeySource(),
    siteKey: getRecaptchaSiteKey(),
    hasSecret: !!getRecaptchaSecretKey(),
  };
}

export async function saveRecaptchaSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const site = getString(formData, "recaptcha_site_key");
  const secret = getString(formData, "recaptcha_secret_key");
  const keepSecret = getString(formData, "keep_secret") === "1";
  setSetting(SETTINGS_KEYS.recaptchaSiteKey, site || null);
  if (!keepSecret) {
    setSetting(SETTINGS_KEYS.recaptchaSecretKey, secret || null);
  }
  revalidatePath("/admin/settings");
  revalidatePath("/[lang]/contato", "page");
}

export async function clearRecaptchaKeysAction(): Promise<void> {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.recaptchaSiteKey, null);
  setSetting(SETTINGS_KEYS.recaptchaSecretKey, null);
  revalidatePath("/admin/settings");
  revalidatePath("/[lang]/contato", "page");
}

// ---------- UI toggles ----------

export async function setFloatingWhatsappEnabledAction(enabled: boolean): Promise<void> {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.floatingWhatsappEnabled, enabled ? "true" : "false");
  revalidatePath("/admin/settings");
  // Layout aparece em todas as rotas públicas → invalidar layout do [lang]
  revalidatePath("/[lang]", "layout");
}

// ---------- Google WebSub (sem GCP) ----------

export interface WebSubInfo {
  feedUrls: string[];
}

export async function getWebSubInfoAction(): Promise<WebSubInfo> {
  await requireAdmin();
  return { feedUrls: getWebSubFeedUrls() };
}

export interface WebSubTestResult {
  ok: boolean;
  results: { hub: string; feed: string; ok: boolean; status?: number; error?: string }[];
  testedAt: string;
}

export async function pingWebSubAction(): Promise<WebSubTestResult> {
  await requireAdmin();
  const result = await pingWebSub();
  return {
    ok: result.ok,
    results: result.results,
    testedAt: new Date().toISOString(),
  };
}

// ---------- Sincronização manual de páginas institucionais ----------

export interface SyncStaticPagesResult {
  totalUrls: number;
  indexNowOk: boolean;
  webSubOk: boolean;
  errors: string[];
  testedAt: string;
}

/**
 * Notifica buscadores (IndexNow + WebSub) sobre todas as páginas
 * institucionais em todos os locales. IndexNow cobre Bing/Yandex; WebSub
 * sinaliza para Google atualizar o feed RSS (que linka a sitemap).
 *
 * Use após deploy ou quando o conteúdo das páginas mudou.
 */
export async function syncStaticPagesAction(): Promise<SyncStaticPagesResult> {
  await requireAdmin();
  const urls = buildInstitutionalUrls();
  const result = await submitUrlsForIndexing(urls);
  return {
    totalUrls: result.totalUrls,
    indexNowOk: result.indexNow?.ok ?? false,
    webSubOk: result.webSub?.ok ?? false,
    errors: result.errors,
    testedAt: new Date().toISOString(),
  };
}
