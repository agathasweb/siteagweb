import "server-only";
import type { Locale } from "@/lib/i18n";
import { geminiGenerateJson } from "./gemini";

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

export async function generateSeoBrief(
  keyword: string,
  locale: Locale,
  articleType: string,
): Promise<SeoBrief> {
  const parsed = await geminiGenerateJson({
    system: SYSTEM_PROMPT,
    user: buildPrompt(keyword, locale, articleType),
    temperature: 0.4,
    maxOutputTokens: 8192,
    label: "briefing SEO",
  });
  if (!parsed || typeof parsed !== "object") throw new Error("JSON inválido da IA.");

  return parsed as SeoBrief;
}
