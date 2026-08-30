import "server-only";
import type { Locale } from "@/lib/i18n";
import { geminiGenerateJson } from "./gemini";
export { checkGemini, type GeminiStatus } from "./gemini";

const LOCALE_NAMES: Record<Locale, string> = {
  "pt-BR": "Portuguese (Brazil)",
  es: "Spanish (Spain)",
  "en-US": "English (United States)",
  "en-GB": "English (United Kingdom)",
};

// Contexto de mercado por locale. Injetado no prompt para que a IA LOCALIZE
// (moeda, órgãos reguladores, ortografia, exemplos) em vez de só traduzir.
// É o que faz en-US e en-GB divergirem o suficiente para o Google indexar as
// duas — em vez de tratá-las como duplicata e deixar o uk "rastreada não indexada".
const MARKET_CONTEXT: Record<Locale, string> = {
  "pt-BR":
    "Market: Brazil. Currency: Brazilian real (R$). Institutions/regulators: Receita Federal (tax), ANPD (LGPD), Banco Central, Procon. Date format DD/MM/AAAA. Brazilian Portuguese spelling and idioms. Use Brazil-native examples/references (PIX, CNPJ) where relevant.",
  es: "Market: Spain. Currency: euro (€). Institutions/regulators: AEAT (tax), AEPD (RGPD/GDPR), Banco de España, OCU. Date format DD/MM/AAAA. Castilian Spanish spelling and idioms. Use Spain-native examples/references where relevant.",
  "en-US":
    "Market: United States. Currency: US dollar ($). Institutions/regulators: IRS (tax), FTC, SEC, CCPA and US state privacy laws. Date format MM/DD/YYYY. American English spelling (color, organize, -ize, license). Frame examples, figures and references for a US business audience.",
  "en-GB":
    "Market: United Kingdom. Currency: pound sterling (£). Institutions/regulators: HMRC (tax), ICO (UK GDPR / Data Protection Act 2018), FCA, Companies House. Date format DD/MM/YYYY. British English spelling (colour, organise, -ise, licence). Frame examples, figures and references for a UK business audience.",
};

export interface TranslatableFields {
  title: string;
  excerpt?: string | null;
  content_html: string;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
}

export interface TranslationResult extends TranslatableFields {
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
}

/** Variante irmã (mesma língua, outro mercado) que a tradução NÃO pode duplicar. */
export interface SiblingVariant {
  locale: Locale;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface TranslateOptions {
  /**
   * Quando definido, força o resultado a divergir dessa variante irmã em
   * título/meta (ex.: ao gerar en-GB, passar o en-US existente). Evita que o
   * Google trate as duas como duplicata.
   */
  avoidSibling?: SiblingVariant | null;
}

const SYSTEM_PROMPT = `You are a professional localiser for a Brazilian tech company (Agathas Web) that operates in 4 markets: Brazil, Spain, USA, and UK.

Your task is to LOCALISE blog post content (not word-for-word translate) while preserving:
- All HTML tags and structure intact (<p>, <h1>-<h6>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <code>, <pre>, <blockquote>, <img>)
- HTML attributes unchanged (href, src, alt, class, id)
- Brand names exactly as written: "Agathas Web", "Voyia", "SGA", "Moodle"
- Technical terms that don't translate: "API", "SDK", "CTO", "ERP", "SaaS", "EAD"
- Tone: professional, confident, B2B-oriented
- SEO intent: keep meta titles under 60 chars and meta descriptions under 160 chars

LOCALISATION rules (this is the important part):
- Adapt currency, units, dates and number formats to the target market's conventions.
- Replace institutions, regulators and examples with the local equivalents for that market.
- Use the spelling and idioms native to the target locale.
- The "title", "meta_title", "meta_description", "og_title" and "og_description" MUST read naturally for the local market and MUST NOT be a literal, word-identical translation. Give them a locally-native angle so that different market variants of the SAME language (e.g. US English vs UK English) are clearly distinct from each other — never differing only by spelling.
- Preserve the factual meaning and article structure. Do NOT invent fake local statistics, prices or data; when a source figure has no local equivalent, keep it and add a short local framing instead.

You will receive a JSON object with translatable fields. Return a JSON object with the exact same keys, but values localised into the target market. Output ONLY the JSON object, no markdown fences, no commentary, no <think> tags.`;

function buildUserPrompt(
  sourceLocale: Locale,
  targetLocale: Locale,
  fields: TranslatableFields,
  sibling?: SiblingVariant | null,
): string {
  const payload = {
    title: fields.title,
    excerpt: fields.excerpt ?? null,
    content_html: fields.content_html,
    meta_title: fields.meta_title ?? null,
    meta_description: fields.meta_description ?? null,
    og_title: fields.og_title ?? null,
    og_description: fields.og_description ?? null,
  };

  const siblingBlock =
    sibling && sibling.title
      ? `

DIFFERENTIATE FROM SIBLING VARIANT — CRITICAL:
A same-language variant of this post already exists for the ${LOCALE_NAMES[sibling.locale]} market:
  title: ${JSON.stringify(sibling.title)}
  meta_title: ${JSON.stringify(sibling.metaTitle ?? null)}
  meta_description: ${JSON.stringify(sibling.metaDescription ?? null)}
Your "title", "meta_title", "meta_description", "og_title" and "og_description" MUST be clearly different from the sibling above — different wording and angle adapted to the ${LOCALE_NAMES[targetLocale]} market, NOT a spelling-only variation. Search engines must see the two market variants as distinct pages. The body must also reflect the ${LOCALE_NAMES[targetLocale]} market (currency, regulators, spelling, examples).`
      : "";

  return `Localise the following blog post fields from ${LOCALE_NAMES[sourceLocale]} into the ${LOCALE_NAMES[targetLocale]} market.

Target market context:
${MARKET_CONTEXT[targetLocale]}

Source JSON:
${JSON.stringify(payload, null, 2)}${siblingBlock}

Return ONLY the localised JSON with the same shape. Do not wrap in markdown fences. Do not add commentary.`;
}

export async function translatePost(
  sourceLocale: Locale,
  targetLocale: Locale,
  fields: TranslatableFields,
  opts?: TranslateOptions,
): Promise<TranslationResult> {
  if (sourceLocale === targetLocale) {
    return {
      title: fields.title,
      excerpt: fields.excerpt ?? null,
      content_html: fields.content_html,
      meta_title: fields.meta_title ?? null,
      meta_description: fields.meta_description ?? null,
      og_title: fields.og_title ?? null,
      og_description: fields.og_description ?? null,
    };
  }

  const parsed = await geminiGenerateJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(sourceLocale, targetLocale, fields, opts?.avoidSibling),
    temperature: 0.4,
    maxOutputTokens: 32768,
    label: "tradução",
  });
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
    og_title: get("og_title"),
    og_description: get("og_description"),
  };
}

function normalizeTitle(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Como `translatePost`, mas garante que o título não colida com a variante irmã
 * informada em `opts.avoidSibling`. Se a IA ainda devolver um título idêntico
 * (normalizado), refaz UMA vez. Use ao gerar a 2ª variante inglesa (en-GB após
 * en-US) para blindar contra duplicata no Google.
 */
export async function translatePostDistinct(
  sourceLocale: Locale,
  targetLocale: Locale,
  fields: TranslatableFields,
  opts?: TranslateOptions,
): Promise<TranslationResult> {
  const first = await translatePost(sourceLocale, targetLocale, fields, opts);
  const sibling = opts?.avoidSibling;
  if (!sibling || !sibling.title) return first;
  if (normalizeTitle(first.title) !== normalizeTitle(sibling.title)) return first;
  // Colisão: tenta de novo (a temperatura + o bloco de divergência costumam
  // resolver na 2ª). Se colidir de novo, devolve o segundo mesmo assim.
  return translatePost(sourceLocale, targetLocale, fields, opts);
}
