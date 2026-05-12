"use client";

import { useState, useTransition } from "react";
import {
  upsertTranslationAction,
  translateAction,
  type TranslateActionResult,
} from "../actions";
import type { Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "🇧🇷 Português",
  es: "🇪🇸 Español",
  "en-US": "🇺🇸 English (US)",
  "en-GB": "🇬🇧 English (UK)",
};

const LOCALES: Locale[] = ["pt-BR", "es", "en-US", "en-GB"];

export interface TranslationData {
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  source: string;
  exists: boolean;
}

interface Props {
  postId: number;
  sourceLocale: Locale;
  initial: Record<Locale, TranslationData>;
}

export default function PostEditor({ postId, sourceLocale, initial }: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>(sourceLocale);
  const [data, setData] = useState<Record<Locale, TranslationData>>(initial);
  const [saving, startSaving] = useTransition();
  const [translating, startTranslating] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const current = data[activeLocale];

  function updateField<K extends keyof TranslationData>(
    key: K,
    value: TranslationData[K],
  ) {
    setData((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], [key]: value },
    }));
  }

  function handleSave() {
    setFeedback(null);
    startSaving(async () => {
      try {
        const form = new FormData();
        form.set("locale", activeLocale);
        form.set("title", current.title);
        form.set("excerpt", current.excerpt);
        form.set("content", current.content);
        form.set("meta_title", current.meta_title);
        form.set("meta_description", current.meta_description);
        await upsertTranslationAction(postId, form);
        setData((prev) => ({
          ...prev,
          [activeLocale]: { ...prev[activeLocale], exists: true, source: "manual" },
        }));
        setFeedback({
          kind: "success",
          text: `Tradução em ${LOCALE_LABELS[activeLocale]} salva.`,
        });
      } catch (err) {
        setFeedback({
          kind: "error",
          text: err instanceof Error ? err.message : "Erro ao salvar.",
        });
      }
    });
  }

  function handleTranslate() {
    setFeedback(null);
    startTranslating(async () => {
      const result: TranslateActionResult = await translateAction(
        postId,
        activeLocale,
      );
      if (!result.ok || !result.translation) {
        setFeedback({
          kind: "error",
          text: result.error ?? "Falha ao traduzir.",
        });
        return;
      }
      setData((prev) => ({
        ...prev,
        [activeLocale]: {
          ...prev[activeLocale],
          title: result.translation!.title,
          excerpt: result.translation!.excerpt ?? "",
          content: result.translation!.content_html,
          meta_title: result.translation!.meta_title ?? "",
          meta_description: result.translation!.meta_description ?? "",
          exists: true,
          source: "ai-deepseek",
        },
      }));
      setFeedback({
        kind: "success",
        text: `Tradução gerada e salva em ${LOCALE_LABELS[activeLocale]}.`,
      });
    });
  }

  const isSource = activeLocale === sourceLocale;
  const sourceData = data[sourceLocale];
  const canTranslate = !isSource && sourceData.exists && sourceData.title.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
        <nav className="flex flex-wrap border-b border-gray-700 bg-black/30">
          {LOCALES.map((locale) => {
            const isActive = locale === activeLocale;
            const item = data[locale];
            const isSrc = locale === sourceLocale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-voyia-blue text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {LOCALE_LABELS[locale]}
                {isSrc && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-voyia-blue/30 text-voyia-blue rounded">
                    origem
                  </span>
                )}
                {!isSrc && item.exists && item.source === "ai-deepseek" && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-900/40 text-purple-300 rounded">
                    IA
                  </span>
                )}
                {!isSrc && item.exists && item.source === "manual" && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-900/40 text-green-300 rounded">
                    manual
                  </span>
                )}
                {!isSrc && !item.exists && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">
                    vazio
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 space-y-4">
          {!isSource && (
            <div className="flex items-center justify-between bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
              <div>
                <p className="text-sm text-purple-200 font-medium">
                  Traduzir automaticamente com DeepSeek
                </p>
                <p className="text-xs text-purple-300/70 mt-1">
                  Usa a versão em {LOCALE_LABELS[sourceLocale]} como origem e
                  preenche os campos desta aba.
                </p>
              </div>
              <button
                type="button"
                disabled={!canTranslate || translating || saving}
                onClick={handleTranslate}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {translating ? "Traduzindo…" : "✨ Traduzir com IA"}
              </button>
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-lg px-4 py-3 text-sm border ${
                feedback.kind === "success"
                  ? "bg-green-900/30 border-green-500/40 text-green-200"
                  : "bg-red-900/30 border-red-500/40 text-red-200"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={current.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resumo
            </label>
            <textarea
              rows={3}
              value={current.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conteúdo (Markdown ou HTML)
            </label>
            <textarea
              rows={18}
              value={current.content}
              onChange={(e) => updateField("content", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta título
              </label>
              <input
                type="text"
                maxLength={70}
                value={current.meta_title}
                onChange={(e) => updateField("meta_title", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta descrição
              </label>
              <textarea
                rows={2}
                maxLength={170}
                value={current.meta_description}
                onChange={(e) =>
                  updateField("meta_description", e.target.value)
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={saving || translating}
              onClick={handleSave}
              className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {saving
                ? "Salvando…"
                : `Salvar tradução em ${LOCALE_LABELS[activeLocale]}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
