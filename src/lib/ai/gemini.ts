import "server-only";
import { createSign } from "node:crypto";
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
 * Desde 22/11/2026, com VERTEX_SA_KEY (JSON da conta de serviço vertex-apps@agweb-ia-voyia em
 * base64) a chamada vai pelo Vertex AI, pós-pago na fatura do Google Cloud, com a etiqueta
 * app=agathas-site. Ali o modelo é VERTEX_MODEL (padrão gemini-3.8-flash), porque os modelos
 * antigos do free tier não existem no Vertex. Sem ela, vale a chave do AI Studio (admin ou .env).
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_MODEL = "gemini-2.5-flash";

export const VERTEX_DEFAULT_MODEL = "gemini-3.8-flash";

interface ContaVertex {
  client_email: string;
  private_key: string;
  project_id: string;
}

let contaVertex: ContaVertex | null | undefined;
let tokenVertex = { valor: "", expira: 0 };

function getContaVertex(): ContaVertex | null {
  if (contaVertex !== undefined) return contaVertex;
  const b64 = process.env.VERTEX_SA_KEY?.trim();
  contaVertex = b64 ? (JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as ContaVertex) : null;
  return contaVertex;
}

export function vertexAtivo(): boolean {
  return getContaVertex() !== null;
}

/** Token OAuth da conta de serviço (JWT assinado trocado no Google); vale 1 h, renovado com folga. */
async function getTokenVertex(): Promise<string> {
  if (tokenVertex.valor && Date.now() < tokenVertex.expira) return tokenVertex.valor;
  const sa = getContaVertex()!;
  const b64url = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: agora,
    exp: agora + 3600,
  })}`;
  const assinatura = createSign("RSA-SHA256").update(corpo).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${corpo}.${assinatura}`,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Vertex: autenticação falhou (${res.status}) ${json.error_description ?? ""}`);
  }
  tokenVertex = { valor: json.access_token, expira: Date.now() + ((json.expires_in ?? 3600) - 300) * 1000 };
  return tokenVertex.valor;
}

/** POST no generateContent: Vertex quando ativo, senão AI Studio com a chave. */
async function postGenerate(apiKey: string, model: string, body: Record<string, unknown>): Promise<Response> {
  if (vertexAtivo()) {
    const sa = getContaVertex()!;
    const loc = process.env.VERTEX_LOCATION?.trim() || "global";
    const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
    const projeto = process.env.VERTEX_PROJECT?.trim() || sa.project_id;
    return fetch(
      `https://${host}/v1/projects/${projeto}/locations/${loc}/publishers/google/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getTokenVertex()}` },
        body: JSON.stringify({ ...body, labels: { app: "agathas-site" } }),
      },
    );
  }
  return fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
}

export function getApiKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.geminiApiKey);
  if (fromDb?.trim()) return fromDb.trim();
  const fromEnv = process.env.GEMINI_API_KEY;
  if (fromEnv?.trim()) return fromEnv.trim();
  return null;
}

export function getModel(): string {
  if (vertexAtivo()) return process.env.VERTEX_MODEL?.trim() || VERTEX_DEFAULT_MODEL;
  return getSetting(SETTINGS_KEYS.geminiModel)?.trim() || DEFAULT_MODEL;
}

export function getKeySource(): "vertex" | "db" | "env" | "none" {
  if (vertexAtivo()) return "vertex";
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

  return postGenerate(apiKey, model, body);
}

/**
 * Faz uma chamada ao Gemini pedindo JSON e devolve o texto bruto da resposta.
 * Em 429 (cota do free tier), espera o `retryDelay` sugerido e tenta uma vez
 * mais — o suficiente pra atravessar o limite por minuto durante um lote.
 */
export async function geminiGenerate(opts: GeminiCallOptions): Promise<string> {
  const apiKey = getApiKey() ?? "";
  if (!apiKey && !vertexAtivo()) throw new Error(MISSING_KEY_MESSAGE);
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
  source: "vertex" | "db" | "env" | "none";
  reachable?: boolean;
  error?: string;
}

/** Ping usado pelo botão "Testar conexão" em /admin/settings. */
export async function checkGemini(apiKeyOverride?: string): Promise<GeminiStatus> {
  const source = getKeySource() === "vertex" ? "vertex" : apiKeyOverride ? "db" : getKeySource();
  const apiKey = (apiKeyOverride ?? getApiKey() ?? "").trim();
  const model = getModel();

  if (!apiKey && source !== "vertex") return { configured: false, model, source };

  try {
    const response = await postGenerate(apiKey, model, {
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 8 },
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
