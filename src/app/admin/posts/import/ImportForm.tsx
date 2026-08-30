"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateJsonAction, importJsonAction, type ValidateResponse } from "./actions";
import { translateAction } from "../actions";

// Idiomas-alvo da tradução automática (o source dos posts gerados é pt-BR).
const TRANSLATE_TARGETS = ["es", "en-US", "en-GB"] as const;

type Mode = "single" | "batch";

export default function ImportForm() {
  const [mode, setMode] = useState<Mode>("single");
  // Opções compartilhadas pelos dois modos.
  const [autoCover, setAutoCover] = useState<boolean>(true);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "single"
              ? "bg-voyia-blue text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
          }`}
        >
          📄 Único (colar / 1 arquivo)
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "batch"
              ? "bg-voyia-blue text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
          }`}
        >
          📚 Lote (vários arquivos / fila)
        </button>
      </div>

      <div className="bg-black/20 rounded-xl border border-gray-700 p-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={autoCover}
            onChange={(e) => setAutoCover(e.target.checked)}
            className="rounded border-gray-500 text-voyia-blue"
          />
          <span>🖼 Buscar capa no Unsplash automaticamente</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={autoTranslate}
            onChange={(e) => setAutoTranslate(e.target.checked)}
            className="rounded border-gray-500 text-voyia-blue"
          />
          <span>🌐 Traduzir ao importar (Gemini → ES, EN-US, EN-GB)</span>
        </label>
      </div>

      {mode === "single" ? (
        <SingleImport autoCover={autoCover} autoTranslate={autoTranslate} />
      ) : (
        <BatchImport autoCover={autoCover} autoTranslate={autoTranslate} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modo único — cola/upload de 1 JSON, com validação dry-run e preview */
/* ------------------------------------------------------------------ */

function SingleImport({
  autoCover,
  autoTranslate,
}: {
  autoCover: boolean;
  autoTranslate: boolean;
}) {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [translateMsg, setTranslateMsg] = useState<string | null>(null);
  const [validating, startValidate] = useTransition();
  const [importing, startImport] = useTransition();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      setValidation(null);
      setImportMsg(null);
      setTranslateMsg(null);
    };
    reader.readAsText(file);
  }

  function onValidate() {
    setImportMsg(null);
    setTranslateMsg(null);
    startValidate(async () => {
      const res = await validateJsonAction(raw);
      setValidation(res);
    });
  }

  function onImport() {
    setImportMsg(null);
    setTranslateMsg(null);
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
        const created = res.result.created;
        const parts = [`✅ ${created.length} post(s) criado(s)`];
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

        // Tradução automática — 1 post / 1 idioma por chamada (cada uma curta,
        // sem estourar timeout de proxy). Mostra progresso ao vivo.
        if (autoTranslate && created.length > 0) {
          const total = created.length * TRANSLATE_TARGETS.length;
          let done = 0;
          let fail = 0;
          for (const post of created) {
            for (const loc of TRANSLATE_TARGETS) {
              setTranslateMsg(
                `🌐 Traduzindo ${done + fail + 1}/${total} — ${post.slug} → ${loc}…`,
              );
              try {
                const tr = await translateAction(post.id, loc);
                if (tr.ok) done++;
                else fail++;
              } catch {
                fail++;
              }
            }
          }
          setTranslateMsg(
            fail === 0
              ? `🌐 Tradução concluída — ${done} tradução(ões) geradas (ES, EN-US, EN-GB).`
              : `🌐 Tradução: ${done} ok, ${fail} falha(s). Retraduza as que faltarem no editor do post.`,
          );
        }
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
            setTranslateMsg(null);
          }}
          spellCheck={false}
          rows={20}
          placeholder='{ "slug": "...", "source_locale": "pt-BR", "translations": [...] }'
          className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-xs"
        />
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
            {importing ? "Processando…" : "2. Confirmar importação"}
          </button>
          <span className="text-xs text-gray-400">
            {raw.length > 0 ? `${(raw.length / 1024).toFixed(1)} KB` : "vazio"}
          </span>
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
        {translateMsg && (
          <div className="text-sm rounded-lg px-4 py-3 border bg-blue-900/30 border-blue-500/40 text-blue-100">
            {translateMsg}
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

/* ------------------------------------------------------------------ */
/* Modo lote — arraste vários .json, fila processada um a um          */
/* ------------------------------------------------------------------ */

type QueueStatus =
  | "pending"
  | "validating"
  | "importing"
  | "translating"
  | "done"
  | "error";

interface QueueItem {
  id: string;
  fileName: string;
  raw: string;
  status: QueueStatus;
  message?: string;
  postsCreated?: number;
}

const STATUS_META: Record<QueueStatus, { label: string; cls: string }> = {
  pending: { label: "⏳ Na fila", cls: "text-gray-400" },
  validating: { label: "🔍 Validando…", cls: "text-yellow-300" },
  importing: { label: "📥 Importando…", cls: "text-blue-300" },
  translating: { label: "🌐 Traduzindo…", cls: "text-blue-300" },
  done: { label: "✅ Concluído", cls: "text-green-300" },
  error: { label: "❌ Erro", cls: "text-red-300" },
};

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo."));
    reader.readAsText(file);
  });
}

function BatchImport({
  autoCover,
  autoTranslate,
}: {
  autoCover: boolean;
  autoTranslate: boolean;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  function patchItem(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(
      (f) => f.name.toLowerCase().endsWith(".json") || f.type === "application/json",
    );
    if (arr.length === 0) return;
    const items: QueueItem[] = [];
    for (const f of arr) {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${f.name}-${f.size}-${items.length}-${queue.length}`;
      try {
        const text = await readFileText(f);
        items.push({ id, fileName: f.name, raw: text, status: "pending" });
      } catch {
        items.push({
          id,
          fileName: f.name,
          raw: "",
          status: "error",
          message: "Falha ao ler o arquivo.",
        });
      }
    }
    setQueue((q) => [...q, ...items]);
    setSummary(null);
  }

  function removeItem(id: string) {
    setQueue((q) => q.filter((it) => it.id !== id));
  }

  function clearFinished() {
    setQueue((q) => q.filter((it) => it.status !== "done"));
    setSummary(null);
  }

  function clearAll() {
    setQueue([]);
    setSummary(null);
  }

  async function processQueue() {
    if (processing) return;
    setProcessing(true);
    setSummary(null);

    // Snapshot dos itens pendentes/erro no momento do clique. Processa um a um.
    const toProcess = queue.filter(
      (it) => it.status === "pending" || it.status === "error",
    );
    let okCount = 0;
    let errCount = 0;
    let postsTotal = 0;

    for (const item of toProcess) {
      if (!item.raw.trim()) {
        patchItem(item.id, { status: "error", message: "Arquivo vazio." });
        errCount++;
        continue;
      }

      // 1. Validação (dry-run).
      patchItem(item.id, { status: "validating", message: undefined });
      const val = await validateJsonAction(item.raw);
      if (val.parseError) {
        patchItem(item.id, { status: "error", message: `JSON inválido: ${val.parseError}` });
        errCount++;
        continue;
      }
      if (!val.ok && val.validation) {
        const first = val.validation.errors[0];
        patchItem(item.id, {
          status: "error",
          message: `Validação falhou (${val.validation.errors.length} erro(s))${
            first ? `: ${first.slug ?? ""} ${first.path} — ${first.message}` : ""
          }`,
        });
        errCount++;
        continue;
      }

      // 2. Importação (transação própria por arquivo).
      patchItem(item.id, { status: "importing" });
      const res = await importJsonAction(item.raw, { autoCover });
      if (res.parseError) {
        patchItem(item.id, { status: "error", message: `JSON inválido: ${res.parseError}` });
        errCount++;
        continue;
      }
      if (!res.ok && res.validation) {
        patchItem(item.id, {
          status: "error",
          message: `Validação falhou — ${res.validation.errors.length} erro(s).`,
        });
        errCount++;
        continue;
      }
      if (!res.ok && res.result) {
        patchItem(item.id, {
          status: "error",
          message: `Erro na transação: ${res.result.errors.map((e) => e.message).join("; ")}`,
        });
        errCount++;
        continue;
      }
      if (!res.ok || !res.result) {
        patchItem(item.id, { status: "error", message: "Erro desconhecido na importação." });
        errCount++;
        continue;
      }

      const created = res.result.created;
      postsTotal += created.length;
      const parts = [`${created.length} post(s) criado(s)`];
      if (res.result.coversFetched !== undefined && autoCover) {
        parts.push(`${res.result.coversFetched} capa(s)`);
      }
      if (res.result.coversFailed && res.result.coversFailed.length > 0) {
        parts.push(`⚠ ${res.result.coversFailed.length} capa(s) falharam`);
      }

      // 3. Tradução automática (1 post / 1 idioma por chamada).
      if (autoTranslate && created.length > 0) {
        const total = created.length * TRANSLATE_TARGETS.length;
        let done = 0;
        let fail = 0;
        for (const post of created) {
          for (const loc of TRANSLATE_TARGETS) {
            patchItem(item.id, {
              status: "translating",
              message: `${parts.join(" · ")} · 🌐 ${done + fail + 1}/${total} (${post.slug} → ${loc})`,
            });
            try {
              const tr = await translateAction(post.id, loc);
              if (tr.ok) done++;
              else fail++;
            } catch {
              fail++;
            }
          }
        }
        parts.push(
          fail === 0
            ? `🌐 ${done} tradução(ões)`
            : `🌐 ${done} ok / ${fail} falha(s)`,
        );
      }

      patchItem(item.id, { status: "done", message: parts.join(" · "), postsCreated: created.length });
      okCount++;
    }

    setProcessing(false);
    setSummary(
      `Fila concluída — ${okCount} arquivo(s) ok, ${errCount} com erro · ${postsTotal} post(s) criado(s) no total.`,
    );
    router.refresh();
  }

  const pendingCount = queue.filter(
    (it) => it.status === "pending" || it.status === "error",
  ).length;

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-voyia-blue bg-voyia-blue/10"
            : "border-gray-600 bg-voyia-gray hover:border-gray-500"
        }`}
      >
        <input
          type="file"
          accept="application/json,.json"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-4xl">📚</span>
        <span className="text-white font-semibold">
          Arraste vários arquivos <code className="text-voyia-blue">.json</code> aqui
        </span>
        <span className="text-sm text-gray-400">
          ou clique para selecionar. Cada arquivo é importado de forma independente
          (transação própria) e processado um a um.
        </span>
      </label>

      {queue.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={processQueue}
                disabled={processing || pendingCount === 0}
                className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {processing ? "Processando fila…" : `▶ Processar fila (${pendingCount})`}
              </button>
              <span className="text-xs text-gray-400">
                {queue.length} arquivo(s) na lista
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFinished}
                disabled={processing}
                className="text-xs text-gray-300 hover:text-white px-3 py-2 rounded-lg border border-gray-700 disabled:opacity-50"
              >
                Limpar concluídos
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={processing}
                className="text-xs text-gray-300 hover:text-white px-3 py-2 rounded-lg border border-gray-700 disabled:opacity-50"
              >
                Limpar tudo
              </button>
            </div>
          </div>

          {summary && (
            <div className="text-sm rounded-lg px-4 py-3 border bg-blue-900/30 border-blue-500/40 text-blue-100">
              {summary}
            </div>
          )}

          <ul className="space-y-2">
            {queue.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <li
                  key={item.id}
                  className="bg-voyia-gray rounded-xl border border-gray-700 p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-mono text-sm truncate">
                        {item.fileName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(item.raw.length / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className={`text-xs mt-1 ${meta.cls}`}>
                      {meta.label}
                      {item.message ? ` — ${item.message}` : ""}
                    </div>
                  </div>
                  {!processing && item.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-500 hover:text-red-400 text-sm shrink-0"
                      title="Remover da fila"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
