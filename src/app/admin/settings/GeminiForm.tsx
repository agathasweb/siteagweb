"use client";

import { useState, useTransition } from "react";
import {
  saveGeminiSettingsAction,
  clearGeminiKeyAction,
  testGeminiAction,
  type TestResult,
} from "./actions";
import type { GeminiStatus } from "@/lib/ai/gemini";

interface Props {
  initial: GeminiStatus;
  maskedKey: string | null;
}

// Todos rodam no free tier do Gemini; a cota diária varia por modelo.
const MODELS = [
  { value: "gemini-2.5-flash", label: "gemini-2.5-flash (recomendado — melhor equilíbrio no free tier)" },
  { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite (cota gratuita maior, qualidade menor)" },
  { value: "gemini-3.5-flash-lite", label: "gemini-3.5-flash-lite (mais rápido da geração 3.5)" },
  { value: "gemini-3.7-flash", label: "gemini-3.7-flash (mais capaz, cota gratuita menor)" },
];

export default function GeminiForm({ initial, maskedKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [testing, startTesting] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [keepKey, setKeepKey] = useState<boolean>(initial.configured);
  const [keyInput, setKeyInput] = useState<string>("");

  function handleSave(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      try {
        formData.set("keep_key", keepKey ? "1" : "0");
        await saveGeminiSettingsAction(formData);
        setFeedback({
          kind: "success",
          text: keepKey
            ? "Modelo salvo. Chave existente mantida."
            : keyInput
              ? "Chave e modelo salvos."
              : "Chave removida. Modelo salvo.",
        });
        setKeyInput("");
        setKeepKey(keyInput.length > 0 || keepKey);
      } catch (err) {
        setFeedback({
          kind: "error",
          text: err instanceof Error ? err.message : "Erro ao salvar.",
        });
      }
    });
  }

  function handleClear() {
    if (!confirm("Remover a chave salva? A tradução IA deixará de funcionar até você configurar de novo.")) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        await clearGeminiKeyAction();
        setFeedback({ kind: "success", text: "Chave removida." });
        setKeepKey(false);
        setTestResult(null);
      } catch (err) {
        setFeedback({
          kind: "error",
          text: err instanceof Error ? err.message : "Erro ao remover.",
        });
      }
    });
  }

  function handleTest() {
    setFeedback(null);
    startTesting(async () => {
      const result = await testGeminiAction();
      setTestResult(result);
    });
  }

  const sourceLabel =
    initial.source === "db"
      ? "salva no banco de dados"
      : initial.source === "env"
        ? "carregada do .env (variável de ambiente)"
        : "não configurada";

  return (
    <form
      action={handleSave}
      className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Google Gemini (tradução automática)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Usado pelo painel de posts pra traduzir os 4 idiomas e gerar o
            briefing de SEO. O free tier cobre o uso normal do painel (há
            limite por minuto e por dia). Gere sua chave gratuita em{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-voyia-blue hover:text-purple-300 underline"
            >
              aistudio.google.com/apikey
            </a>
            .
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
        <p>
          Origem da chave:{" "}
          <span className="text-white font-medium">{sourceLabel}</span>
        </p>
        <p>
          Chave atual:{" "}
          <span className="text-white font-mono">{maskedKey ?? "—"}</span>
        </p>
      </div>

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
        <label
          htmlFor="gemini_api_key"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          API key
        </label>
        <input
          id="gemini_api_key"
          name="gemini_api_key"
          type="password"
          autoComplete="off"
          value={keyInput}
          onChange={(e) => {
            setKeyInput(e.target.value);
            if (e.target.value.length > 0) setKeepKey(false);
          }}
          placeholder={
            initial.configured
              ? "Deixe em branco para manter a chave atual"
              : "AIza..."
          }
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
            Manter a chave atual (só atualizar o modelo)
          </label>
        )}
      </div>

      <div>
        <label
          htmlFor="gemini_model"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Modelo
        </label>
        <select
          id="gemini_model"
          name="gemini_model"
          defaultValue={initial.model}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {testResult && (
        <div
          className={`rounded-lg p-4 border text-sm ${
            testResult.status.reachable
              ? "bg-green-900/30 border-green-500/40 text-green-200"
              : "bg-red-900/30 border-red-500/40 text-red-200"
          }`}
        >
          <p className="font-semibold">
            {testResult.status.reachable
              ? "✓ Conexão OK com a API do Gemini"
              : "✗ Não foi possível conectar"}
          </p>
          <p className="text-xs mt-1 opacity-80">
            modelo: <span className="font-mono">{testResult.status.model}</span>
            {testResult.status.error && (
              <>
                {" "}
                · erro: <span className="font-mono">{testResult.status.error}</span>
              </>
            )}
          </p>
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
