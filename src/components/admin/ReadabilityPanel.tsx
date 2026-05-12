"use client";

import { useMemo } from "react";
import {
  analyzeReadability,
  READABILITY_LEVEL_LABELS,
} from "@/lib/content-stats";

interface Props {
  content: string;
}

export default function ReadabilityPanel({ content }: Props) {
  const analysis = useMemo(() => analyzeReadability(content), [content]);

  if (analysis.words === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
        Escreva algo no editor para ver a análise de legibilidade.
      </div>
    );
  }

  const score = Math.round(analysis.fleschScore);
  const scoreColor =
    score >= 70 ? "text-green-300" : score >= 50 ? "text-yellow-300" : "text-red-300";
  const bgColor =
    score >= 70
      ? "from-green-900/30 to-green-900/10 border-green-500/40"
      : score >= 50
        ? "from-yellow-900/30 to-yellow-900/10 border-yellow-500/40"
        : "from-red-900/30 to-red-900/10 border-red-500/40";

  return (
    <div className={`bg-gradient-to-br ${bgColor} border rounded-lg p-4`}>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          Análise de legibilidade
        </h3>
        <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
      </div>
      <p className="text-xs text-gray-300 mb-3">
        {READABILITY_LEVEL_LABELS[analysis.level]}
      </p>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-300 mb-3">
        <div className="bg-black/20 rounded p-2">
          <p className="text-gray-400">Palavras</p>
          <p className="text-white font-mono">{analysis.words}</p>
        </div>
        <div className="bg-black/20 rounded p-2">
          <p className="text-gray-400">Frases</p>
          <p className="text-white font-mono">{analysis.sentences}</p>
        </div>
        <div className="bg-black/20 rounded p-2">
          <p className="text-gray-400">Pal/frase</p>
          <p className="text-white font-mono">
            {analysis.avgWordsPerSentence.toFixed(1)}
          </p>
        </div>
      </div>
      {analysis.suggestions.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-200">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-yellow-400">⚠</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
      {analysis.suggestions.length === 0 && (
        <p className="text-xs text-green-300">✓ Boa legibilidade para SEO + AEO.</p>
      )}
    </div>
  );
}
