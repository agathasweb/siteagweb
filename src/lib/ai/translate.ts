import "server-only";
import type { Locale } from "@/lib/i18n";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";

const LOCALE_NAMES: Record<Locale, string> = {
  "pt-BR": "Portuguese (Brazil)",
  es: "Spanish (Spain)",
  "en-US": "English (United States)",
  "en-GB": "English (United Kingdom)",
};

const ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

function getApiKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.deepseekApiKey);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  const fromEnv = process.env.DEEPSEEK_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return null;
}

function getModel(): string {
  const fromDb = getSetting(SETTINGS_KEYS.deepseekModel);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  return DEFAULT_MODEL;
}

export interface TranslatableFields {
  title: string;
  excerpt?: string | null;
  content_html: string;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface TranslationResult extends TranslatableFields {
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

const SYSTEM_PROMPT = `You are a professional translator for a Brazilian tech company (Agathas Web) that operates in 4 markets: Brazil, Spain, USA, and UK.

Your task is to translate blog post content while preserving:
- All HTML tags and structure intact (<p>, <h1>-<h6>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <code>, <pre>, <blockquote>, <img>)
- HTML attributes unchanged (href, src, alt, class, id)
- Brand names exactly as written: "Agathas Web", "Voyia", "SGA", "Moodle"
- Technical terms that don't translate: "API", "SDK", "CTO", "ERP", "SaaS", "EAD"
- Tone: professional, confident, B2B-oriented
- SEO intent: keep meta titles under 60 chars and meta descriptions under 160 chars

You will receive a JSON object with translatable fields. Return a JSON object with the exact same keys, but values translated into the target language. Output ONLY the JSON object, no markdown fences, no commentary, no <think> tags.`;

function buildUserPrompt(
  sourceLocale: Locale,
  targetLocale: Locale,
  fields: TranslatableFields,
): string {
  const payload = {
    title: fields.title,
    excerpt: fields.excerpt ?? null,
    content_html: fields.content_html,
    meta_title: fields.meta_title ?? null,
    meta_description: fields.meta_description ?? null,
  };
  return `Translate the following blog post fields from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}.

Source JSON:
${JSON.stringify(payload, null, 2)}

Return ONLY the translated JSON with the same shape. Do not wrap in markdown fences. Do not add commentary.`;
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function extractJson(raw: string): unknown {
  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Resposta do DeepSeek não pôde ser interpretada como JSON.");
  }
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
  error?: { message: string };
}

export async function translatePost(
  sourceLocale: Locale,
  targetLocale: Locale,
  fields: TranslatableFields,
): Promise<TranslationResult> {
  if (sourceLocale === targetLocale) {
    return {
      title: fields.title,
      excerpt: fields.excerpt ?? null,
      content_html: fields.content_html,
      meta_title: fields.meta_title ?? null,
      meta_description: fields.meta_description ?? null,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY não configurada. Configure no /admin/settings ou no .env.local.",
    );
  }
  const model = getModel();

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(sourceLocale, targetLocale, fields) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `DeepSeek API retornou ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as DeepSeekResponse;
  if (data.error) {
    throw new Error(`DeepSeek API error: ${data.error.message}`);
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API não retornou conteúdo na resposta.");
  }

  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Resposta de tradução não é um objeto JSON válido.");
  }

  const obj = parsed as Record<string, unknown>;
  const get = (key: string): string | null => {
    const value = obj[key];
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return null;
    return value;
  };
  const required = (key: string): string => {
    const value = get(key);
    if (!value) throw new Error(`Campo "${key}" ausente ou vazio na tradução.`);
    return value;
  };

  return {
    title: required("title"),
    content_html: required("content_html"),
    excerpt: get("excerpt"),
    meta_title: get("meta_title"),
    meta_description: get("meta_description"),
  };
}

export interface DeepSeekStatus {
  configured: boolean;
  model: string;
  source: "db" | "env" | "none";
  reachable?: boolean;
  error?: string;
}

export async function checkDeepSeek(apiKeyOverride?: string): Promise<DeepSeekStatus> {
  const keyFromDb = getSetting(SETTINGS_KEYS.deepseekApiKey);
  const source: "db" | "env" | "none" = apiKeyOverride
    ? "db"
    : keyFromDb && keyFromDb.trim()
      ? "db"
      : process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim()
        ? "env"
        : "none";
  const apiKey = (apiKeyOverride ?? getApiKey() ?? "").trim();
  const model = getModel();

  if (!apiKey) {
    return { configured: false, model, source };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return {
        configured: true,
        model,
        source,
        reachable: false,
        error: `${response.status}: ${text.slice(0, 200)}`,
      };
    }
    return { configured: true, model, source, reachable: true };
  } catch (err) {
    return {
      configured: true,
      model,
      source,
      reachable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
