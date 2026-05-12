const WORDS_PER_MINUTE = 200;

export function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(input: string): number {
  const text = stripHtml(input);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingTimeMinutes(input: string): number {
  const words = countWords(input);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  return matches ? matches.length : Math.max(1, text.split(/\s+/).length > 0 ? 1 : 0);
}

function countSyllables(word: string): number {
  const clean = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
  if (!clean) return 0;
  const groups = clean.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (clean.endsWith("e") && count > 1) count -= 1;
  return Math.max(1, count);
}

export interface ReadabilityAnalysis {
  words: number;
  sentences: number;
  syllables: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  /** Flesch Reading Ease (0-100). >70 fácil, 50-70 médio, <50 difícil. */
  fleschScore: number;
  level: "very_easy" | "easy" | "fairly_easy" | "standard" | "fairly_difficult" | "difficult" | "very_difficult";
  /** Recommended actions for the writer. */
  suggestions: string[];
}

function levelFromFlesch(score: number): ReadabilityAnalysis["level"] {
  if (score >= 90) return "very_easy";
  if (score >= 80) return "easy";
  if (score >= 70) return "fairly_easy";
  if (score >= 60) return "standard";
  if (score >= 50) return "fairly_difficult";
  if (score >= 30) return "difficult";
  return "very_difficult";
}

export function analyzeReadability(html: string): ReadabilityAnalysis {
  const text = stripHtml(html);
  const wordList = text.split(/\s+/).filter(Boolean);
  const words = wordList.length;
  const sentences = Math.max(1, countSentences(text));
  const syllables = wordList.reduce((acc, w) => acc + countSyllables(w), 0);

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = words > 0 ? syllables / words : 0;
  const fleschScore =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const clamped = Math.max(0, Math.min(100, fleschScore));

  const suggestions: string[] = [];
  if (avgWordsPerSentence > 22) {
    suggestions.push(
      `Frases muito longas (${avgWordsPerSentence.toFixed(1)} palavras/frase). Tente quebrar em 15-20.`,
    );
  }
  if (avgSyllablesPerWord > 1.8) {
    suggestions.push("Palavras complexas demais — considere sinônimos mais simples onde fizer sentido.");
  }
  if (words < 300) {
    suggestions.push("Conteúdo muito curto para SEO (< 300 palavras). Ideal: 800-2500.");
  } else if (words > 3500) {
    suggestions.push("Conteúdo muito longo (> 3500 palavras). Considere dividir em série.");
  }
  if (clamped < 50 && suggestions.length === 0) {
    suggestions.push("Texto difícil de ler — encurte frases e use palavras mais comuns.");
  }

  return {
    words,
    sentences,
    syllables,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    fleschScore: clamped,
    level: levelFromFlesch(clamped),
    suggestions,
  };
}

export const READABILITY_LEVEL_LABELS: Record<ReadabilityAnalysis["level"], string> = {
  very_easy: "Muito fácil (5º ano)",
  easy: "Fácil (6º ano)",
  fairly_easy: "Razoavelmente fácil (7º ano)",
  standard: "Padrão (8-9º ano)",
  fairly_difficult: "Razoavelmente difícil (ensino médio)",
  difficult: "Difícil (universitário)",
  very_difficult: "Muito difícil (acadêmico)",
};
