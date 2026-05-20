"use client";

import { useState, useTransition } from "react";
import {
  saveUnsplashSettingsAction,
  clearUnsplashKeyAction,
  testUnsplashAction,
  type UnsplashTestResult,
} from "./actions";
import type { UnsplashStatus } from "@/lib/unsplash";

interface Props {
  initial: UnsplashStatus;
  maskedKey: string | null;
}

export default function UnsplashForm({ initial, maskedKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [testing, startTesting] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<UnsplashTestResult | null>(null);
  const [keepKey, setKeepKey] = useState<boolean>(initial.configured);
  const [keyInput, setKeyInput] = useState<string>("");

  function handleSave(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      try {
        formData.set("keep_key", keepKey ? "1" : "0");
        await saveUnsplashSettingsAction(formData);
        setFeedback({
          kind: "success",
          text: keepKey
            ? "Configuração mantida — nada para salvar."
            : keyInput
              ? "Chave salva."
              : "Chave removida.",
        });
        setKeyInput("");
        setKeepKey(keyInput.length > 0 || keepKey);
      } catch (err) {
        setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Erro." });
      }
    });
  }

  function handleClear() {
    if (!confirm("Remover a chave Unsplash salva? A busca de imagens deixará de funcionar.")) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        await clearUnsplashKeyAction();
        setFeedback({ kind: "success", text: "Chave removida." });
        setKeepKey(false);
        setTestResult(null);
      } catch (err) {
        setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Erro." });
      }
    });
  }

  function handleTest() {
    setFeedback(null);
    startTesting(async () => {
      const result = await testUnsplashAction();
      setTestResult(result);
    });
  }

  const sourceLabel =
    initial.source === "db" ? "salva no banco de dados"
      : initial.source === "env" ? "carregada do .env"
      : "não configurada";

  return (
    <form action={handleSave} className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-6 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Unsplash (busca de imagens)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Usada pelo editor de post pra buscar imagens grátis pra capa.
            Crie uma conta gratuita em{" "}
            <a
              href="https://unsplash.com/developers"
              target="_blank"
              rel="noreferrer"
              className="text-voyia-blue hover:text-purple-300 underline"
            >
              unsplash.com/developers
            </a>
            , crie um app (demo level basta — 50 req/h) e cole o Access Key abaixo.
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
            initial.configured
              ? "bg-green-900/30 border-green-500/40 text-green-300"
              : "bg-yellow-900/30 border-yellow-500/40 text-yellow-300"
          }`}
        >
          {initial.configured ? "configurada" : "não configurada"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300 bg-black/20 rounded-lg p-4">
        <p>Origem: <span className="text-white font-medium">{sourceLabel}</span></p>
        <p>Chave atual: <span className="text-white font-mono">{maskedKey ?? "—"}</span></p>
      </div>

      {feedback && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          feedback.kind === "success"
            ? "bg-green-900/30 border-green-500/40 text-green-200"
            : "bg-red-900/30 border-red-500/40 text-red-200"
        }`}>
          {feedback.text}
        </div>
      )}

      <div>
        <label htmlFor="unsplash_access_key" className="block text-sm font-medium text-gray-300 mb-2">
          Access Key
        </label>
        <input
          id="unsplash_access_key"
          name="unsplash_access_key"
          type="password"
          autoComplete="off"
          value={keyInput}
          onChange={(e) => {
            setKeyInput(e.target.value);
            if (e.target.value.length > 0) setKeepKey(false);
          }}
          placeholder={initial.configured ? "Deixe em branco para manter a chave atual" : "Cole sua Access Key aqui"}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
        />
        {initial.configured && (
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={keepKey}
              onChange={(e) => setKeepKey(e.target.checked)}
              disabled={keyInput.length > 0}
              className="rounded border-gray-500 text-voyia-blue focus:ring-voyia-blue"
            />
            Manter a chave atual
          </label>
        )}
      </div>

      {testResult && (
        <div className={`rounded-lg p-4 border text-sm ${
          testResult.status.reachable
            ? "bg-green-900/30 border-green-500/40 text-green-200"
            : "bg-red-900/30 border-red-500/40 text-red-200"
        }`}>
          <p className="font-semibold">
            {testResult.status.reachable ? "✓ Conexão OK com a API Unsplash" : "✗ Não foi possível conectar"}
          </p>
          {testResult.status.error && (
            <p className="text-xs mt-1 opacity-80 font-mono">erro: {testResult.status.error}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={!initial.configured || testing || pending}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {testing ? "Testando…" : "Testar conexão"}
          </button>
          {initial.configured && initial.source === "db" && (
            <button
              type="button"
              onClick={handleClear}
              disabled={pending}
              className="text-red-300 hover:text-red-200 text-sm transition-colors"
            >
              Remover chave salva
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
