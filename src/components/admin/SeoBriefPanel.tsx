"use client";

import { useState, useTransition } from "react";
import { generateSeoBriefAction, type SeoBriefResult } from "@/app/admin/posts/actions";
import type { SeoBrief } from "@/lib/ai/brief";
import type { Locale } from "@/lib/i18n";

interface Props {
  focusKeyword: string;
  locale: Locale;
  articleType: string;
  onApply?: (data: {
    title?: string;
    secondaryKeywords?: string;
    excerpt?: string;
  }) => void;
}

export default function SeoBriefPanel({ focusKeyword, locale, articleType, onApply }: Props) {
  const [pending, startTransition] = useTransition();
  const [brief, setBrief] = useState<SeoBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    if (!focusKeyword.trim()) {
      setError("Preencha a palavra-chave principal antes de gerar o briefing.");
      return;
    }
    setError(null);
    setBrief(null);
    startTransition(async () => {
      const result: SeoBriefResult = await generateSeoBriefAction(
        focusKeyword,
        locale,
        articleType,
      );
      if (!result.ok || !result.brief) {
        setError(result.error ?? "Erro ao gerar briefing.");
        return;
      }
      setBrief(result.brief);
    });
  }

  function handleApplyTitle() {
    if (!brief?.suggestedTitle || !onApply) return;
    onApply({ title: brief.suggestedTitle });
  }

  function handleApplyKeywords() {
    if (!brief?.lsiKeywords || !onApply) return;
    onApply({ secondaryKeywords: brief.lsiKeywords.join(", ") });
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-purple-200">
            ✨ Briefing SEO com IA
          </h3>
          <p className="text-xs text-purple-300/70 mt-0.5">
            Gera outline, keywords LSI, PAA e orientações de E-E-A-T baseados na keyword principal.
          </p>
        </div>
        <button
          type="button"
          disabled={pending || !focusKeyword.trim()}
          onClick={handleGenerate}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {pending ? "Gerando…" : "Gerar briefing"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-300 bg-red-900/20 border border-red-500/30 rounded px-3 py-2">{error}</p>
      )}

      {!brief && !pending && !error && focusKeyword.trim() && (
        <p className="text-xs text-gray-500">
          Clique em &ldquo;Gerar briefing&rdquo; para obter um plano de conteúdo otimizado para &ldquo;{focusKeyword}&rdquo;.
        </p>
      )}

      {!brief && !pending && !error && !focusKeyword.trim() && (
        <p className="text-xs text-gray-500">
          Preencha a palavra-chave principal (campo acima) para ativar o gerador de briefing.
        </p>
      )}

      {pending && (
        <div className="flex items-center gap-2 text-xs text-purple-300">
          <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          Consultando DeepSeek…
        </div>
      )}

      {brief && (
        <div className="space-y-4 text-sm">
          {/* Título sugerido */}
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Título sugerido</span>
              {onApply && (
                <button
                  type="button"
                  onClick={handleApplyTitle}
                  className="text-xs text-purple-300 hover:text-white underline"
                >
                  Usar este título
                </button>
              )}
            </div>
            <p className="text-white font-medium">{brief.suggestedTitle}</p>
            <p className="text-xs text-gray-500 mt-1">{brief.suggestedTitle.length} chars</p>
          </div>

          {/* Outline */}
          <div className="bg-black/30 rounded-lg p-4">
            <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-3">
              Estrutura de headings recomendada
            </span>
            <ol className="space-y-2">
              {brief.outline.map((item, idx) => (
                <li key={idx} className={`flex gap-2 ${item.level === "h3" ? "ml-5" : ""}`}>
                  <span className={`flex-shrink-0 font-mono text-xs px-1.5 py-0.5 rounded ${
                    item.level === "h2" ? "bg-voyia-blue/20 text-voyia-blue" : "bg-gray-700 text-gray-400"
                  }`}>
                    {item.level.toUpperCase()}
                  </span>
                  <div>
                    <span className="text-white">{item.text}</span>
                    {item.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* LSI Keywords */}
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold">
                Keywords LSI / Secundárias ({brief.lsiKeywords.length})
              </span>
              {onApply && (
                <button
                  type="button"
                  onClick={handleApplyKeywords}
                  className="text-xs text-purple-300 hover:text-white underline"
                >
                  Aplicar todas
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {brief.lsiKeywords.map((kw) => (
                <span key={kw} className="px-2 py-1 bg-purple-900/30 border border-purple-500/30 text-purple-200 text-xs rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Tamanho de conteúdo */}
          <div className="bg-black/30 rounded-lg p-4">
            <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-2">
              Volume de conteúdo recomendado
            </span>
            <p className="text-white">
              <span className="font-bold">{brief.wordCountRecommendation.min.toLocaleString()}</span>
              {" — "}
              <span className="font-bold">{brief.wordCountRecommendation.max.toLocaleString()}</span>
              {" palavras"}
            </p>
            <p className="text-xs text-gray-400 mt-1">{brief.wordCountRecommendation.reason}</p>
          </div>

          {/* People Also Ask */}
          <div className="bg-black/30 rounded-lg p-4">
            <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-3">
              People Also Ask (FAQ sugerido)
            </span>
            <ul className="space-y-2">
              {brief.peopleAlsoAsk.map((q, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-gray-300">
                  <span className="text-purple-400 font-bold flex-shrink-0">Q{idx + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Use estas perguntas como FAQs no editor (seção FAQ → schema FAQPage para rich results).
            </p>
          </div>

          {/* Intro + Conclusão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-lg p-4">
              <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-2">
                Dica para a introdução
              </span>
              <p className="text-xs text-gray-300">{brief.introTip}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-2">
                Dica para a conclusão
              </span>
              <p className="text-xs text-gray-300">{brief.conclusionTip}</p>
            </div>
          </div>

          {/* E-E-A-T */}
          <div className="bg-black/30 rounded-lg p-4">
            <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold block mb-3">
              Sinais de E-E-A-T (Experiência, Expertise, Autoridade, Confiança)
            </span>
            <ul className="space-y-2">
              {brief.eeatTips.map((tip, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-gray-300">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
