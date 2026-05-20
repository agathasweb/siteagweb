"use client";

import { useState, useTransition } from "react";
import {
  generateIndexNowKeyAction,
  clearIndexNowKeyAction,
  type IndexNowSettingsStatus,
} from "./actions";

interface Props {
  initial: IndexNowSettingsStatus;
}

export default function IndexNowForm({ initial }: Props) {
  const [state, setState] = useState<IndexNowSettingsStatus>(initial);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    if (state.key && !confirm("Já existe uma key. Gerar nova vai invalidar a anterior (e fazer o IndexNow rejeitar submissões antigas até atualizar). Continuar?")) return;
    startTransition(async () => {
      const res = await generateIndexNowKeyAction();
      setState({
        key: res.key,
        source: "db",
        keyLocation: `/api/indexnow/${res.key}`,
      });
    });
  }

  function handleClear() {
    if (!confirm("Remover a key IndexNow? O botão 'Indexar' em /admin/posts vai falhar até gerar uma nova.")) return;
    startTransition(async () => {
      await clearIndexNowKeyAction();
      setState({ key: null, source: "none", keyLocation: null });
    });
  }

  function copyKey() {
    if (!state.key) return;
    navigator.clipboard.writeText(state.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">IndexNow (indexação rápida)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Protocolo aberto usado por Bing, Yandex, Seznam, Naver, Yep (Google em adoção).
            Notifica buscadores em tempo real quando você publica/atualiza posts.
            Sem custo, sem auth complicada — só uma key única que precisa ser servida
            num URL público de cada domínio. Esse Next.js já serve em{" "}
            <code className="text-voyia-blue">/api/indexnow/&lt;sua-key&gt;</code>.
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
            state.key
              ? "bg-green-900/30 border-green-500/40 text-green-300"
              : "bg-yellow-900/30 border-yellow-500/40 text-yellow-300"
          }`}
        >
          {state.key ? "configurada" : "não configurada"}
        </span>
      </div>

      {state.key && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm bg-black/20 rounded-lg p-4">
            <div>
              <p className="text-gray-400 mb-1">Key (64 chars hex):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-white font-mono text-xs break-all">{state.key}</code>
                <button
                  type="button"
                  onClick={copyKey}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                >
                  {copied ? "✓ Copiada" : "📋 Copiar"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Key file URL (em cada domínio):</p>
              <ul className="space-y-1 text-xs">
                {[
                  "agathas.com.br",
                  "agathas.es",
                  "agathasweb.com",
                  "uk.agathasweb.com",
                ].map((host) => (
                  <li key={host} className="font-mono">
                    <span className="text-gray-500">https://</span>
                    <span className="text-white">{host}</span>
                    <span className="text-voyia-blue">{state.keyLocation}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Os 4 domínios já servem essa rota automaticamente — não precisa hospedar
                arquivo nenhum. Teste abrindo um dos URLs acima no navegador (deve retornar a key como texto).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          ⚠️ Para Google Search Console especificamente: a Indexing API só aceita
          JobPosting/BroadcastEvent desde 2022. Para blog, o caminho oficial é
          sitemap + submissão no painel GSC.
        </p>
        <div className="flex items-center gap-3">
          {state.key && state.source === "db" && (
            <button
              type="button"
              onClick={handleClear}
              disabled={pending}
              className="text-red-300 hover:text-red-200 text-sm transition-colors"
            >
              Remover key
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            {pending ? "Gerando…" : state.key ? "🔄 Gerar nova key" : "🔑 Gerar key"}
          </button>
        </div>
      </div>
    </div>
  );
}
