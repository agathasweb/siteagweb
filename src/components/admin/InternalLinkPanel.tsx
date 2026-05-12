"use client";

import { useState, useTransition } from "react";
import { searchInternalLinksAction } from "@/app/admin/posts/actions";
import type { Locale } from "@/lib/i18n";
import type { InternalLinkSuggestion } from "@/lib/db/posts";

interface Props {
  postId: number | null;
  locale: Locale;
}

export default function InternalLinkPanel({ postId, locale }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InternalLinkSuggestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<number | null>(null);

  function handleSearch() {
    if (!query.trim()) return;
    startTransition(async () => {
      const items = await searchInternalLinksAction(postId, locale, query);
      setResults(items);
    });
  }

  async function copyMarkdown(item: InternalLinkSuggestion) {
    const markdown = `[${item.title}](/blog/${item.slug})`;
    await navigator.clipboard.writeText(markdown);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  }

  async function copyHtml(item: InternalLinkSuggestion) {
    const html = `<a href="/blog/${item.slug}">${item.title}</a>`;
    await navigator.clipboard.writeText(html);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <details className="bg-voyia-gray rounded-2xl border border-gray-700">
      <summary className="px-6 py-4 cursor-pointer hover:bg-black/20 transition-colors">
        <span className="text-lg font-semibold text-white">
          🔗 Sugestões de links internos
        </span>
        <span className="text-xs text-gray-400 ml-3">
          Encontrar posts relacionados para linkar no conteúdo (boost de SEO).
        </span>
      </summary>

      <div className="p-6 border-t border-gray-700 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por título, resumo ou palavra-chave…"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          />
          <button
            type="button"
            disabled={pending || !query.trim()}
            onClick={handleSearch}
            className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            {pending ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((item) => (
              <li
                key={item.id}
                className="bg-black/30 border border-gray-700 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{item.title}</p>
                  {item.excerpt && (
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                      {item.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-voyia-blue font-mono mt-1">
                    /blog/{item.slug}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => copyMarkdown(item)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    {copied === item.id ? "✓" : "MD"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyHtml(item)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    HTML
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : query && !pending ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum post encontrado para "{query}".
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Dica de SEO: cada post deve ter 2-5 links internos para outros posts
            relevantes. Aumenta tempo no site, distribui PageRank e melhora
            crawlability.
          </p>
        )}
      </div>
    </details>
  );
}
