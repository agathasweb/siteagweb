"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateJsonAction, importJsonAction, type ValidateResponse } from "./actions";

export default function ImportForm() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [autoCover, setAutoCover] = useState<boolean>(true);
  const [validating, startValidate] = useTransition();
  const [importing, startImport] = useTransition();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      setValidation(null);
      setImportMsg(null);
    };
    reader.readAsText(file);
  }

  function onValidate() {
    setImportMsg(null);
    startValidate(async () => {
      const res = await validateJsonAction(raw);
      setValidation(res);
    });
  }

  function onImport() {
    setImportMsg(null);
    startImport(async () => {
      const res = await importJsonAction(raw, { autoCover });
      if (res.parseError) {
        setImportMsg(`❌ JSON inválido: ${res.parseError}`);
        return;
      }
      if (!res.ok && res.validation) {
        setValidation({ ok: false, validation: res.validation });
        setImportMsg(`❌ Validação falhou — ${res.validation.errors.length} erro(s). Veja abaixo.`);
        return;
      }
      if (!res.ok && res.result) {
        setImportMsg(
          `❌ Erro na transação: ${res.result.errors.map((e) => e.message).join("; ")}`,
        );
        return;
      }
      if (res.ok && res.result) {
        const parts = [
          `✅ ${res.result.created.length} post(s) criado(s)`,
        ];
        if (res.result.coversFetched !== undefined && autoCover) {
          parts.push(`🖼 ${res.result.coversFetched} capa(s) Unsplash baixada(s)`);
        }
        if (res.result.coversFailed && res.result.coversFailed.length > 0) {
          parts.push(
            `⚠ ${res.result.coversFailed.length} capa(s) falharam: ${res.result.coversFailed
              .map((c) => `${c.slug} (${c.reason})`)
              .join("; ")}`,
          );
        }
        setImportMsg(parts.join(" · "));
        setRaw("");
        setValidation(null);
        router.refresh();
      }
    });
  }

  const canImport = validation?.ok && (validation.preview?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-white">
            JSON dos posts
          </label>
          <label className="text-xs text-voyia-blue hover:text-purple-300 cursor-pointer">
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            📁 Upload arquivo .json
          </label>
        </div>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setValidation(null);
            setImportMsg(null);
          }}
          spellCheck={false}
          rows={20}
          placeholder='{ "slug": "...", "source_locale": "pt-BR", "translations": [...] }'
          className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-xs"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onValidate}
              disabled={!raw.trim() || validating}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium border border-gray-600 transition-colors"
            >
              {validating ? "Validando…" : "1. Validar (dry-run)"}
            </button>
            <button
              type="button"
              onClick={onImport}
              disabled={!canImport || importing}
              className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              {importing ? (autoCover ? "Importando + baixando capas…" : "Importando…") : "2. Confirmar importação"}
            </button>
            <span className="text-xs text-gray-400">
              {raw.length > 0 ? `${(raw.length / 1024).toFixed(1)} KB` : "vazio"}
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer p-2 bg-black/20 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              checked={autoCover}
              onChange={(e) => setAutoCover(e.target.checked)}
              className="rounded border-gray-500 text-voyia-blue"
            />
            <span>🖼 Buscar capa no Unsplash automaticamente</span>
            <span className="text-xs text-gray-400">(para posts sem cover_image; usa focus_keyword)</span>
          </label>
        </div>
        {importMsg && (
          <div
            className={`text-sm rounded-lg px-4 py-3 border ${
              importMsg.startsWith("✅")
                ? "bg-green-900/30 border-green-500/40 text-green-200"
                : "bg-red-900/30 border-red-500/40 text-red-200"
            }`}
          >
            {importMsg}
          </div>
        )}
      </div>

      {validation?.parseError && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-2xl p-5 text-sm text-red-200">
          <strong>JSON inválido:</strong> {validation.parseError}
        </div>
      )}

      {validation?.validation && validation.validation.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-2xl p-5">
          <h3 className="text-red-200 font-semibold mb-3">
            ❌ {validation.validation.errors.length} erro(s) encontrado(s):
          </h3>
          <ul className="space-y-2 text-sm">
            {validation.validation.errors.map((e, idx) => (
              <li key={idx} className="text-red-100">
                <span className="text-red-300 font-mono text-xs">
                  [{e.postIndex >= 0 ? `#${e.postIndex}` : "—"}
                  {e.slug ? ` ${e.slug}` : ""} {e.path}]
                </span>{" "}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation?.ok && validation.preview && validation.preview.length > 0 && (
        <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-5">
          <h3 className="text-green-200 font-semibold mb-3">
            ✅ {validation.preview.length} post(s) válido(s) — pronto para importar:
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-xs uppercase text-gray-400">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Título (source)</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Locales</th>
                <th className="py-2 pr-3">Tags</th>
                <th className="py-2">FAQs</th>
              </tr>
            </thead>
            <tbody>
              {validation.preview.map((p, idx) => (
                <tr key={idx} className="border-b border-gray-800 last:border-0">
                  <td className="py-2 pr-3 text-gray-500 font-mono text-xs">{idx}</td>
                  <td className="py-2 pr-3 text-gray-200 font-mono text-xs">{p.slug}</td>
                  <td className="py-2 pr-3 text-white">{p.title}</td>
                  <td className="py-2 pr-3 text-gray-300">{p.status}</td>
                  <td className="py-2 pr-3 text-gray-300 font-mono text-xs">
                    {p.source_locale}
                  </td>
                  <td className="py-2 pr-3 text-gray-300 font-mono text-xs">
                    {p.locales.join(", ")}
                  </td>
                  <td className="py-2 pr-3 text-gray-300">{p.tagsCount}</td>
                  <td className="py-2 text-gray-300">{p.faqsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
