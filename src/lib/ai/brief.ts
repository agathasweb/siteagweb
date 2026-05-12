import "server-only";
import type { Locale } from "@/lib/i18n";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";

const ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

function getApiKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.deepseekApiKey);
  if (fromDb?.trim()) return fromDb.trim();
  const fromEnv = process.env.DEEPSEEK_API_KEY;
  if (fromEnv?.trim()) return fromEnv.trim();
  return null;
}

function getModel(): string {
  return getSetting(SETTINGS_KEYS.deepseekModel)?.trim() ?? DEFAULT_MODEL;
}

export interface SeoBrief {
  suggestedTitle: string;
  outline: Array<{ level: "h2" | "h3"; text: string; note?: string }>;
  lsiKeywords: string[];
  wordCountRecommendation: { min: number; max: number; reason: string };
  peopleAlsoAsk: string[];
  introTip: string;
  conclusionTip: string;
  eeatTips: string[];
}

const SYSTEM_PROMPT = `You are an expert SEO content strategist for Agathas Web, a Brazilian tech company with 4 domains:
- agathas.com.br (pt-BR) — web development, Moodle, digital marketing
- agathas.es (es) — same services in Spanish
- agathasweb.com (en-US) — US market
- uk.agathasweb.com (en-GB) — UK market

Your job is to generate a comprehensive SEO content brief in JSON format.

Rules:
- Respond ONLY with valid JSON, no markdown fences, no commentary
- All text must be in the locale language specified
- Be specific, actionable, and based on real SEO best practices
- Prioritize E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
- Consider Google's Helpful Content guidelines
- LSI keywords should be natural semantic variations, not keyword-stuffed variations`;

function buildPrompt(keyword: string, locale: Locale, articleType: string): string {
  const localeNames: Record<Locale, string> = {
    "pt-BR": "Brazilian Portuguese",
    es: "Spanish",
    "en-US": "American English",
    "en-GB": "British English",
  };

  return `Generate a detailed SEO content brief for the following:

Focus keyword: "${keyword}"
Language/Locale: ${localeNames[locale]}
Article type: ${articleType}
Domain context: Agathas Web — B2B tech services (web development, Moodle LMS, digital marketing, managed hosting)

Return a JSON object with exactly this structure:
{
  "suggestedTitle": "string — an SEO-optimized H1 title including the keyword (30-65 chars)",
  "outline": [
    { "level": "h2" | "h3", "text": "string — the heading text", "note": "string — brief explanation of what to cover in this section (optional)" }
  ],
  "lsiKeywords": ["string", ...],
  "wordCountRecommendation": {
    "min": number,
    "max": number,
    "reason": "string — why this length is ideal for this topic/intent"
  },
  "peopleAlsoAsk": ["string", ...],
  "introTip": "string — specific advice for the introduction paragraph",
  "conclusionTip": "string — specific advice for the conclusion",
  "eeatTips": ["string", ...]
}

Requirements:
- outline: 4-8 items mixing h2 and h3 headings that create a logical, comprehensive structure
- lsiKeywords: 6-10 semantically related terms/phrases (NOT keyword stuffing variations — real semantic LSI)
- wordCountRecommendation: realistic range based on search intent and competition for this topic
- peopleAlsoAsk: 4-6 real questions users search related to this keyword
- eeatTips: 3-5 specific ways to demonstrate expertise and trustworthiness for this topic

Output ONLY the JSON. No markdown. No explanation.`;
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string | null } }>;
  error?: { message: string };
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseJson(raw: string): unknown {
  const clean = stripFences(raw);
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("Resposta da IA não pôde ser interpretada como JSON.");
  }
}

export async function generateSeoBrief(
  keyword: string,
  locale: Locale,
  articleType: string,
): Promise<SeoBrief> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY não configurada. Configure no /admin/settings.");
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(keyword, locale, articleType) },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  if (data.error) throw new Error(`DeepSeek error: ${data.error.message}`);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("IA não retornou conteúdo.");

  const parsed = parseJson(content);
  if (!parsed || typeof parsed !== "object") throw new Error("JSON inválido da IA.");

  return parsed as SeoBrief;
}
