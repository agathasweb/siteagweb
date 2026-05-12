import "server-only";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class"];

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
  });
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const html = await marked.parse(markdown, { gfm: true, breaks: true });
  return sanitizeHtml(html);
}

export function isProbablyMarkdown(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("<")) return false;
  return /^(#{1,6}\s|[-*]\s|\d+\.\s|>\s|```)/m.test(trimmed) || !trimmed.includes("<");
}
