"use client";

import { useState, useTransition } from "react";
import {
  pingWebSubAction,
  syncStaticPagesAction,
  type WebSubTestResult,
  type SyncStaticPagesResult,
} from "./actions";

interface Props {
  feedUrls: string[];
}

export default function GoogleWebSubForm({ feedUrls }: Props) {
  const [pending, startTransition] = useTransition();
  const [webSubResult, setWebSubResult] = useState<WebSubTestResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncStaticPagesResult | null>(null);

  function handlePingWebSub() {
    startTransition(async () => {
      const res = await pingWebSubAction();
      setWebSubResult(res);
    });
  }

  function handleSyncStatic() {
    if (!confirm("Vai notificar IndexNow + WebSub sobre todas as páginas institucionais nos 4 domínios (~64 URLs). Continuar?")) return;
    startTransition(async () => {
      const res = await syncStaticPagesAction();
      setSyncResult(res);
    });
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Google Search Console (sem GCP) <span className="text-xs text-green-400 font-normal">· WebSub + Sitemap</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Sincronização com Google <strong>sem depender de projeto GCP</strong> nem service account.
            Funciona via três canais que o Google honra:
          </p>
          <ul className="text-xs text-gray-400 mt-2 space-y-1 ml-4 list-disc">
            <li><strong className="text-white">Sitemap.xml dinâmico</strong> com <code>lastmod</code> preciso — Google crawla com mais frequência URLs marcadas como recentes.</li>
            <li><strong className="text-white">RSS feed</strong> (<code>/blog/feed.xml</code>) por domínio — Google indexa feeds rapidamente, descobrindo posts novos.</li>
            <li><strong className="text-white">WebSub push</strong> — hubs públicos (Google/Superfeedr) recebem ping anônimo quando o feed muda e o Google é notificado para re-crawl.</li>
          </ul>
        </div>
        <span className="text-xs px-2 py-1 rounded border bg-green-900/30 border-green-500/40 text-green-300 whitespace-nowrap">
          ativo
        </span>
      </div>

      <div className="bg-black/20 rounded-lg p-4 text-xs space-y-2">
        <p className="text-white font-semibold">Para registrar no Search Console (uma vez, sem GCP):</p>
        <ol className="list-decimal ml-5 space-y-1 text-gray-400">
          <li>
            Entre em{" "}
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-voyia-blue underline">
              search.google.com/search-console
            </a>
            {" "}com qualquer conta Google.
          </li>
          <li>
            <strong className="text-white">Adicionar propriedade → Domínio</strong> → digite{" "}
            <code className="text-voyia-blue">agathas.com.br</code> (repita para agathas.com, agathas.es, agathas.co.uk).
          </li>
          <li>Google pede um registro <strong className="text-white">TXT no DNS</strong> — adicione no Cloudflare e clique &quot;Verificar&quot;. <em>Não envolve GCP.</em></li>
          <li>
            Após verificar: <strong className="text-white">Sitemaps → Adicionar novo sitemap</strong> → cole{" "}
            <code className="text-voyia-blue">sitemap.xml</code>. Google passa a crawlar.
          </li>
          <li>Pronto. A partir daí, este painel notifica WebSub automaticamente quando você publica posts.</li>
        </ol>
      </div>

      <div className="bg-black/20 rounded-lg p-3 text-xs">
        <p className="text-gray-400 mb-2">Feeds que serão pingados (1 por domínio):</p>
        <ul className="space-y-1">
          {feedUrls.map((url) => (
            <li key={url} className="font-mono text-voyia-blue break-all">{url}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePingWebSub}
          disabled={pending}
          className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
        >
          {pending ? "Pingando…" : "Pingar WebSub agora"}
        </button>
        <button
          type="button"
          onClick={handleSyncStatic}
          disabled={pending}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
        >
          {pending ? "Sincronizando…" : "Sincronizar páginas institucionais"}
        </button>
      </div>

      {webSubResult && (
        <div className={`rounded-lg px-4 py-3 text-sm ${webSubResult.ok ? "bg-green-900/30 border border-green-500/40 text-green-200" : "bg-yellow-900/30 border border-yellow-500/40 text-yellow-200"}`}>
          <p className="font-semibold mb-2">
            {webSubResult.ok ? "✓ Hubs receberam ping" : "⚠ Algum hub falhou"}
          </p>
          <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {webSubResult.results.map((r, i) => (
              <div key={i} className={r.ok ? "text-green-200" : "text-yellow-200"}>
                {r.ok ? "✓" : "✗"}{" "}
                <code className="text-gray-300">{new URL(r.hub).host}</code>
                {" → "}
                <code className="text-gray-400">{new URL(r.feed).host}</code>
                {r.status && <span className="text-gray-500 ml-1">({r.status})</span>}
                {r.error && <span className="text-red-300 ml-1">— {r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {syncResult && (
        <div className="bg-black/20 rounded-lg p-4 text-sm space-y-2">
          <p className="text-gray-300">
            <strong>{syncResult.totalUrls}</strong> URLs enviadas:
          </p>
          <ul className="text-xs space-y-1 ml-2">
            <li className={syncResult.indexNowOk ? "text-green-300" : "text-yellow-300"}>
              IndexNow (Bing/Yandex): {syncResult.indexNowOk ? "✓ ok" : "⚠ parcial/erro"}
            </li>
            <li className={syncResult.webSubOk ? "text-green-300" : "text-yellow-300"}>
              WebSub (Google): {syncResult.webSubOk ? "✓ ok" : "⚠ parcial/erro"}
            </li>
          </ul>
          {syncResult.errors.length > 0 && (
            <div className="text-xs text-red-300 mt-2 space-y-0.5">
              {syncResult.errors.map((e) => (
                <p key={e}>• {e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
