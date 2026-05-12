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
