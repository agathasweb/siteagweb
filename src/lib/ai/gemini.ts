import "server-only";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";

/**
 * Cliente único do Google Gemini (API nativa `generateContent`).
 *
 * Usado pela tradução de posts (`./translate`) e pelo briefing de SEO
 * (`./brief`). A escolha pela API nativa (e não pelo endpoint
 * OpenAI-compatível) é proposital: `generationConfig.responseMimeType` garante
 * JSON puro na resposta.
 *
 * O raciocínio (thinking) fica LIGADO de propósito. Medido com
 * `thinkingBudget: 0`, o modelo reescrevia os `href` internos ao localizar
 * (`/lgpd` virava `/gdpr`, 3/3 amostras), quebrando os links das traduções;
 * com o raciocínio ligado o atributo se manteve intacto. O custo extra
 * (~1,5-2k tokens por chamada) não pesa: o free tier limita requisições, não
 * tokens.
 *
 * Chave gratuita em https://aistudio.google.com/apikey (free tier do Gemini).
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_MODEL = "gemini-2.5-flash";

export function getApiKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.geminiApiKey);
  if (fromDb?.trim()) return fromDb.trim();
  const fromEnv = process.env.GEMINI_API_KEY;
  if (fromEnv?.trim()) return fromEnv.trim();
  return null;
}

export function getModel(): string {
  return getSetting(SETTINGS_KEYS.geminiModel)?.trim() || DEFAULT_MODEL;
}

export function getKeySource(): "db" | "env" | "none" {
  if (getSetting(SETTINGS_KEYS.geminiApiKey)?.trim()) return "db";
  if (process.env.GEMINI_API_KEY?.trim()) return "env";
  return "none";
}

export const MISSING_KEY_MESSAGE =
  "GEMINI_API_KEY não configurada. Configure no /admin/settings ou no .env.local (chave gratuita em aistudio.google.com/apikey).";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

export interface GeminiCallOptions {
  system: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Rótulo usado nas mensagens de erro (ex.: "tradução"). */
  label?: string;
}

/** Extrai o retryDelay ("21s") sugerido pela API num 429 de cota. */
function parseRetryDelayMs(body: string): number | null {
  const match = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (!match) return null;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds)) return null;
  return Math.min(Math.ceil(seconds) + 1, 60) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  apiKey: string,
  model: string,
  opts: GeminiCallOptions,
): Promise<Response> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 32768,
      responseMimeType: "application/json",
    },
  };

  return fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Faz uma chamada ao Gemini pedindo JSON e devolve o texto bruto da resposta.
 * Em 429 (cota do free tier), espera o `retryDelay` sugerido e tenta uma vez
 * mais — o suficiente pra atravessar o limite por minuto durante um lote.
 */
export async function geminiGenerate(opts: GeminiCallOptions): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error(MISSING_KEY_MESSAGE);
  const model = getModel();
  const what = opts.label ? ` (${opts.label})` : "";

  let response = await callGemini(apiKey, model, opts);

  if (response.status === 429) {
    const text = await response.text();
    const delay = parseRetryDelayMs(text);
    if (delay === null) {
      throw new Error(
        `Cota do Gemini esgotada${what}. O free tier tem limite por minuto e por dia — tente de novo mais tarde ou troque o modelo em /admin/settings. Detalhe: ${text.slice(0, 300)}`,
      );
    }
    await sleep(delay);
    response = await callGemini(apiKey, model, opts);
  } else if (response.status >= 500) {
    // 503 UNAVAILABLE aparece de vez em quando quando o modelo está
    // sobrecarregado; uma segunda tentativa costuma passar.
    await sleep(5000);
    response = await callGemini(apiKey, model, opts);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API${what} retornou ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.error) {
    throw new Error(`Gemini API error${what}: ${data.error.message ?? data.error.status}`);
  }
  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueou o conteúdo${what} (${data.promptFeedback.blockReason}).`,
    );
  }

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) {
    const reason = candidate?.finishReason;
    if (reason === "MAX_TOKENS") {
      throw new Error(
        `Gemini cortou a resposta${what} por limite de tokens. Reduza o tamanho do post ou use um modelo com saída maior.`,
      );
    }
    throw new Error(
      `Gemini não retornou conteúdo${what}${reason ? ` (finishReason: ${reason})` : ""}.`,
    );
  }
  return text;
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Como `geminiGenerate`, mas já devolve o JSON parseado. Mesmo com
 * `responseMimeType: application/json`, o fallback de extração por chaves fica
 * como rede de segurança.
 */
export async function geminiGenerateJson(opts: GeminiCallOptions): Promise<unknown> {
  const raw = await geminiGenerate(opts);
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Resposta do Gemini não pôde ser interpretada como JSON.");
  }
}

export interface GeminiStatus {
  configured: boolean;
  model: string;
  source: "db" | "env" | "none";
  reachable?: boolean;
  error?: string;
}

/** Ping usado pelo botão "Testar conexão" em /admin/settings. */
export async function checkGemini(apiKeyOverride?: string): Promise<GeminiStatus> {
  const source = apiKeyOverride ? "db" : getKeySource();
  const apiKey = (apiKeyOverride ?? getApiKey() ?? "").trim();
  const model = getModel();

  if (!apiKey) return { configured: false, model, source };

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 8 },
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
