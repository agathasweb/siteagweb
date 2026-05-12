"use client";

import { useState, useTransition } from "react";
import {
  createFaqAction,
  deleteFaqAction,
  saveFaqTranslationAction,
  reorderFaqsAction,
} from "../actions";
import type { Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "🇧🇷 PT",
  es: "🇪🇸 ES",
  "en-US": "🇺🇸 US",
  "en-GB": "🇬🇧 UK",
};
const LOCALES: Locale[] = ["pt-BR", "es", "en-US", "en-GB"];

export interface FaqItem {
  id: number;
  sort_order: number;
  translations: Record<string, { question: string; answer: string }>;
}

interface Props {
  postId: number;
  sourceLocale: Locale;
  initialFaqs: FaqItem[];
}

export default function FaqEditor({ postId, sourceLocale, initialFaqs }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createFaqAction(postId, faqs.length);
        setFaqs((prev) => [
          ...prev,
          { id, sort_order: prev.length, translations: {} },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar.");
      }
    });
  }

  function handleDelete(faqId: number) {
    if (!confirm("Remover esta pergunta? Apaga em todos os idiomas.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteFaqAction(postId, faqId);
        setFaqs((prev) => prev.filter((f) => f.id !== faqId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao remover.");
      }
    });
  }

  function handleMove(faqId: number, dir: -1 | 1) {
    const idx = faqs.findIndex((f) => f.id === faqId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= faqs.length) return;
    const reordered = [...faqs];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    setFaqs(reordered);
    startTransition(async () => {
      try {
        await reorderFaqsAction(postId, reordered.map((f) => f.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao reordenar.");
      }
    });
  }

  function updateTranslation(
    faqId: number,
    locale: Locale,
    field: "question" | "answer",
    value: string,
  ) {
    setFaqs((prev) =>
      prev.map((f) => {
        if (f.id !== faqId) return f;
        const existing = f.translations[locale] ?? { question: "", answer: "" };
        return {
          ...f,
          translations: { ...f.translations, [locale]: { ...existing, [field]: value } },
        };
      }),
    );
  }

  function handleSaveLocale(faqId: number, locale: Locale) {
    const faq = faqs.find((f) => f.id === faqId);
    const translation = faq?.translations[locale];
    if (!translation) return;
    setError(null);
    startTransition(async () => {
      try {
        await saveFaqTranslationAction(
          faqId,
          locale,
          translation.question,
          translation.answer,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-white">Perguntas frequentes (FAQ schema)</h2>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + Adicionar pergunta
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        FAQs viram <code className="text-voyia-blue text-xs">FAQPage</code> JSON-LD no post,
        ajudam muito em AI search (ChatGPT, Perplexity, Google AI Overviews) e podem aparecer
        como rich snippet no Google. Mantenha cada resposta entre 50-300 palavras.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 text-sm text-red-200 mb-4">
          {error}
        </div>
      )}

      {faqs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhuma pergunta ainda. Adicione 3-7 perguntas para maximizar a chance de
          aparecer no Google e ser citado por LLMs.
        </div>
      ) : (
        <ul className="space-y-4">
          {faqs.map((faq, idx) => (
            <li key={faq.id} className="bg-black/20 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-gray-400">
                  #{idx + 1} · ID {faq.id}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(faq.id, -1)}
                    disabled={idx === 0 || pending}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded text-white"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(faq.id, 1)}
                    disabled={idx === faqs.length - 1 || pending}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded text-white"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(faq.id)}
                    disabled={pending}
                    className="text-xs px-3 py-1 bg-red-900/50 hover:bg-red-800 disabled:opacity-30 rounded text-red-200"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <FaqLocaleTabs
                sourceLocale={sourceLocale}
                faq={faq}
                onChange={(locale, field, value) =>
                  updateTranslation(faq.id, locale, field, value)
                }
                onSave={(locale) => handleSaveLocale(faq.id, locale)}
                pending={pending}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqLocaleTabs({
  sourceLocale,
  faq,
  onChange,
  onSave,
  pending,
}: {
  sourceLocale: Locale;
  faq: FaqItem;
  onChange: (locale: Locale, field: "question" | "answer", value: string) => void;
  onSave: (locale: Locale) => void;
  pending: boolean;
}) {
  const [active, setActive] = useState<Locale>(sourceLocale);
  const t = faq.translations[active] ?? { question: "", answer: "" };

  return (
    <div>
      <nav className="flex flex-wrap gap-1 mb-3 border-b border-gray-700">
        {LOCALES.map((locale) => {
          const filled = !!faq.translations[locale]?.question;
          const isActive = locale === active;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => setActive(locale)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-voyia-blue text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {LOCALE_LABELS[locale]}
              {locale === sourceLocale && (
                <span className="ml-1 text-[9px] px-1 py-0.5 bg-voyia-blue/30 text-voyia-blue rounded">
                  origem
                </span>
              )}
              {filled && locale !== sourceLocale && (
                <span className="ml-1 text-green-400">●</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2">
        <input
          type="text"
          value={t.question}
          onChange={(e) => onChange(active, "question", e.target.value)}
          placeholder={
            active === "pt-BR"
              ? "Pergunta que o leitor faria…"
              : active === "es"
                ? "Pregunta que el lector haría…"
                : "Question a reader would ask…"
          }
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
        />
        <textarea
          rows={4}
          value={t.answer}
          onChange={(e) => onChange(active, "answer", e.target.value)}
          placeholder={
            active === "pt-BR"
              ? "Resposta direta e completa em 50-300 palavras…"
              : active === "es"
                ? "Respuesta directa y completa, 50-300 palabras…"
                : "Direct, complete answer in 50-300 words…"
          }
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSave(active)}
            disabled={pending || !t.question || !t.answer}
            className="text-xs bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-1.5 rounded font-semibold transition-colors"
          >
            Salvar {LOCALE_LABELS[active]}
          </button>
        </div>
      </div>
    </div>
  );
}
