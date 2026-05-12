import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/lib/i18n";

const LOCALE_NAMES: Record<Locale, string> = {
  "pt-BR": "Portuguese (Brazil)",
  es: "Spanish (Spain)",
  "en-US": "English (United States)",
  "en-GB": "English (United Kingdom)",
};

const MODEL = "claude-sonnet-4-6";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Adicione no .env.local.",
    );
  }
  if (!clientInstance) {
    clientInstance = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return clientInstance;
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

You will receive a JSON object with translatable fields. Return a JSON object with the exact same keys, but values translated into the target language. Output only the JSON, no markdown fences, no commentary.`;

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

Return ONLY the translated JSON with the same shape. Do not wrap in markdown fences.`;
}

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
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

  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      { role: "user", content: buildUserPrompt(sourceLocale, targetLocale, fields) },
    ],
  });

  const text = extractText(message);
  const parsed = parseJson(text);

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
