"use client";

import { useMemo } from "react";
import { countWords } from "@/lib/content-stats";

interface Props {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  focusKeyword: string;
  secondaryKeywords: string;
  coverImage: string | null;
  coverImageAlt: string;
  categoryId: string;
}

interface Check {
  label: string;
  ok: boolean;
  warn: boolean;
  points: number;
  tip?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractHeadings(html: string): { level: number; text: string }[] {
  const matches = [...html.matchAll(/<h([2-6])[^>]*>(.*?)<\/h\1>/gi)];
  return matches.map((m) => ({ level: parseInt(m[1]), text: stripHtml(m[2]) }));
}

function keywordDensity(text: string, kw: string): number {
  if (!kw || !text) return 0;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const kwNorm = kw.toLowerCase();
  const kwWords = kwNorm.split(/\s+/).length;
  let count = 0;
  for (let i = 0; i <= words.length - kwWords; i++) {
    if (words.slice(i, i + kwWords).join(" ") === kwNorm) count++;
  }
  return (count / words.length) * 100;
}

function hasKeywordInFirstParagraph(html: string, kw: string): boolean {
  const firstBlock = html.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, "").split(/<\/p>/i)[0] ?? "";
  return stripHtml(firstBlock).toLowerCase().includes(kw.toLowerCase());
}

function hasKeywordInH2(html: string, kw: string): boolean {
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map((m) => stripHtml(m[1]).toLowerCase());
  return h2s.some((h) => h.includes(kw.toLowerCase()));
}

function headingHierarchyOk(headings: { level: number }[]): boolean {
  let prevLevel = 1;
  for (const h of headings) {
    if (h.level > prevLevel + 1) return false;
    prevLevel = h.level;
  }
  return true;
}

export default function SeoScorePanel({
  title,
  slug,
  metaTitle,
  metaDescription,
  excerpt,
  content,
  focusKeyword,
  secondaryKeywords,
  coverImage,
  coverImageAlt,
  categoryId,
}: Props) {
  const { score, checks } = useMemo(() => {
    const kw = focusKeyword.trim().toLowerCase();
    const plainContent = stripHtml(content);
    const wordCount = countWords(content);
    const headings = extractHeadings(content);
    const density = kw ? keywordDensity(plainContent, kw) : 0;
    const titleLen = title.length;
    const metaTitleLen = (metaTitle || title).length;
    const metaDescLen = metaDescription.length;
    const excerptLen = excerpt.length;

    const checks: Check[] = [
      // — Keyword checks —
      {
        label: "Palavra-chave no título (H1)",
        ok: !!kw && title.toLowerCase().includes(kw),
        warn: !kw,
        points: 8,
        tip: "O H1 deve conter a keyword principal.",
      },
      {
        label: "Palavra-chave no slug",
        ok: !!kw && slug.includes(slugify(kw).split("-")[0]),
        warn: !kw,
        points: 5,
        tip: "O slug deve conter pelo menos parte da keyword.",
      },
      {
        label: "Palavra-chave na meta description",
        ok: !!kw && metaDescription.toLowerCase().includes(kw),
        warn: !kw,
        points: 8,
        tip: "O Google pode destacar em negrito termos da keyword na SERP.",
      },
      {
        label: "Palavra-chave no primeiro parágrafo",
        ok: !!kw && hasKeywordInFirstParagraph(content, kw),
        warn: !kw,
        points: 8,
        tip: "Aparecer cedo no conteúdo reforça relevância temática.",
      },
      {
        label: "Palavra-chave em algum H2",
        ok: !!kw && hasKeywordInH2(content, kw),
        warn: !kw,
        points: 5,
        tip: "Usar keyword em subtítulo reforça semântica para buscadores.",
      },
      {
        label: `Densidade da keyword (${density.toFixed(1)}%)`,
        ok: density >= 0.5 && density <= 2.5,
        warn: density > 2.5,
        points: 5,
        tip: density > 2.5 ? "Keyword stuffing detectado — reduza o uso." : "Ideal: 0.5% a 2.5% do total de palavras.",
      },
      // — Título / Meta —
      {
        label: `Título H1 (${titleLen} chars)`,
        ok: titleLen >= 30 && titleLen <= 70,
        warn: titleLen > 70,
        points: 5,
        tip: "Ideal: 30-60 caracteres. Acima de 70 será truncado na SERP.",
      },
      {
        label: `Meta description (${metaDescLen} chars)`,
        ok: metaDescLen >= 120 && metaDescLen <= 160,
        warn: metaDescLen > 0 && (metaDescLen < 80 || metaDescLen > 165),
        points: 8,
        tip: "Ideal: 120-160 chars. Afeta muito o CTR na SERP.",
      },
      {
        label: `Meta título (${metaTitleLen} chars)`,
        ok: metaTitleLen >= 30 && metaTitleLen <= 60,
        warn: metaTitleLen > 60,
        points: 5,
        tip: "Ideal: 30-60 chars. Depois de 60 o Google trunca.",
      },
      // — Conteúdo —
      {
        label: `Volume de conteúdo (${wordCount} palavras)`,
        ok: wordCount >= 800,
        warn: wordCount >= 400 && wordCount < 800,
        points: 10,
        tip: wordCount < 400 ? "Conteúdo muito curto. Mínimo 800 palavras para ranquear." : "Ideal para blog: 1000-2500 palavras.",
      },
      {
        label: "Estrutura de headings (H2/H3)",
        ok: headings.length >= 2 && headingHierarchyOk(headings),
        warn: headings.length === 1,
        points: 5,
        tip: `${headings.length} heading(s) encontrado(s). Use H2 para seções principais, H3 para subsecções. Não pule níveis.`,
      },
      {
        label: "Resumo (excerpt)",
        ok: excerptLen >= 80 && excerptLen <= 200,
        warn: excerptLen > 0 && excerptLen < 80,
        points: 5,
        tip: "Ideal: 120-160 chars. Usado em listagens e RSS.",
      },
      // — Imagem —
      {
        label: "Imagem de capa",
        ok: !!coverImage,
        warn: false,
        points: 5,
        tip: "Posts com imagem têm CTR muito maior em SERP e social.",
      },
      {
        label: "Alt text da capa com keyword",
        ok: !!coverImage && !!coverImageAlt && (!!kw ? coverImageAlt.toLowerCase().includes(kw) : coverImageAlt.length > 10),
        warn: !!coverImage && !coverImageAlt,
        points: 5,
        tip: "Alt text com keyword melhora SEO de imagens + acessibilidade.",
      },
      // — Estrutura —
      {
        label: "Categoria definida",
        ok: !!categoryId,
        warn: false,
        points: 5,
        tip: "Categoria melhora estrutura de site, breadcrumb e descoberta.",
      },
      {
        label: "Palavras-chave secundárias (LSI)",
        ok: secondaryKeywords.split(",").filter((k) => k.trim()).length >= 2,
        warn: secondaryKeywords.split(",").filter((k) => k.trim()).length === 1,
        points: 8,
        tip: "LSI keywords ajudam o Google a entender o contexto semântico. Use 3-5 termos relacionados.",
      },
    ];

    const maxPoints = checks.reduce((sum, c) => sum + c.points, 0);
    const earnedPoints = checks.reduce((sum, c) => sum + (c.ok ? c.points : 0), 0);
    const score = Math.round((earnedPoints / maxPoints) * 100);

    return { score, checks };
  }, [title, slug, metaTitle, metaDescription, excerpt, content, focusKeyword, secondaryKeywords, coverImage, coverImageAlt, categoryId]);

  const color = score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const ringColor = score >= 80 ? "stroke-green-400" : score >= 50 ? "stroke-yellow-400" : "stroke-red-400";
  const label = score >= 80 ? "Bom" : score >= 50 ? "Pode melhorar" : "Fraco";

  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="rounded-xl border border-gray-700 bg-black/20 p-5">
      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-20 h-20 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#374151" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              className={ringColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${color}`}>{score}</span>
            <span className="text-[9px] text-gray-400 leading-none">/ 100</span>
          </div>
        </div>
        <div>
          <p className={`text-lg font-bold ${color}`}>{label}</p>
          <p className="text-xs text-gray-400">Score SEO orgânico</p>
          <p className="text-xs text-gray-500 mt-1">
            {checks.filter((c) => c.ok).length}/{checks.length} critérios OK
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2 text-xs group">
            <span className={`mt-0.5 flex-shrink-0 font-bold ${check.ok ? "text-green-400" : check.warn ? "text-yellow-400" : "text-red-400"}`}>
              {check.ok ? "✓" : check.warn ? "△" : "✗"}
            </span>
            <span className={`flex-1 ${check.ok ? "text-gray-400" : check.warn ? "text-yellow-300" : "text-gray-300"}`}>
              {check.label}
              {!check.ok && check.tip && (
                <span className="block text-gray-500 text-[10px] mt-0.5">{check.tip}</span>
              )}
            </span>
            <span className={`flex-shrink-0 text-[10px] ${check.ok ? "text-green-500" : "text-gray-600"}`}>
              +{check.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
