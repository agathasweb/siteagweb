"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deletePostInlineAction,
  deletePostsBulkAction,
  translatePostsBulkAction,
  publishPostsBulkAction,
  indexPostsBulkAction,
} from "./actions";

interface PostRow {
  id: number;
  slug: string;
  status: string;
  source_locale: string;
  updated_at: string;
  title: string | null;
  cover_image: string | null;
  available_locales: string[];
  indexed_at: string | null;
  indexed_status: string | null;
  is_stale_index: boolean;
}

const ALL_LOCALES = ["pt-BR", "es", "en-US", "en-GB"];

interface Props {
  posts: PostRow[];
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-900/30 border-yellow-500/40 text-yellow-300",
  scheduled: "bg-blue-900/30 border-blue-500/40 text-blue-300",
  published: "bg-green-900/30 border-green-500/40 text-green-300",
  archived: "bg-gray-800 border-gray-600 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  archived: "Arquivado",
};

export default function PostsTable({ posts }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [bulkMsg, setBulkMsg] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);

  const allSelected = posts.length > 0 && selected.size === posts.length;
  const someSelected = selected.size > 0 && selected.size < posts.length;

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  }

  function deleteOne(post: PostRow) {
    const label = post.title || post.slug;
    if (!confirm(`Apagar o post "${label}"?\n\nEsta ação remove o post, todas as traduções e FAQs. Irreversível.`)) return;
    setDeletingId(post.id);
    startTransition(async () => {
      await deletePostInlineAction(post.id);
      setDeletingId(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      router.refresh();
    });
  }

  function deleteBulk() {
    if (selected.size === 0) return;
    if (!confirm(`Apagar ${selected.size} post(s) selecionado(s)?\n\nEsta ação é irreversível.`)) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      await deletePostsBulkAction(ids);
      setSelected(new Set());
      setBulkMsg({ kind: "ok", text: `🗑 ${ids.length} post(s) apagado(s).` });
      router.refresh();
    });
  }

  function translateBulk() {
    if (selected.size === 0) return;
    if (!confirm(`Traduzir ${selected.size} post(s) para todos os idiomas faltantes?\n\nUsa a API DeepSeek (custo por tradução). Pode demorar 30-60s por post.`)) return;
    const ids = Array.from(selected);
    setBulkMsg(null);
    startTransition(async () => {
      const res = await translatePostsBulkAction(ids);
      const parts = [`🌐 ${res.translated} tradução(ões) criada(s)`];
      if (res.skipped > 0) parts.push(`${res.skipped} pulada(s) (já existia)`);
      if (res.errors.length > 0) parts.push(`⚠ ${res.errors.length} erro(s): ${res.errors.slice(0, 3).map((e) => `#${e.postId}/${e.locale}`).join(", ")}${res.errors.length > 3 ? "…" : ""}`);
      setBulkMsg({ kind: res.errors.length > 0 ? "warn" : "ok", text: parts.join(" · ") });
      router.refresh();
    });
  }

  function publishBulk() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const draftsInSelection = posts.filter((p) => selected.has(p.id) && p.status !== "published").length;
    if (draftsInSelection === 0) {
      setBulkMsg({ kind: "warn", text: "Todos os posts selecionados já estão publicados." });
      return;
    }
    if (!confirm(`Publicar ${draftsInSelection} post(s)?\n\nVai mudar o status para "Publicado" e definir published_at = agora. Os outros já publicados serão ignorados.`)) return;
    setBulkMsg(null);
    startTransition(async () => {
      const res = await publishPostsBulkAction(ids);
      const parts = [`📤 ${res.published} publicado(s)`];
      if (res.alreadyPublished > 0) parts.push(`${res.alreadyPublished} já estava(m) publicado(s)`);
      if (res.notFound > 0) parts.push(`⚠ ${res.notFound} não encontrado(s)`);
      setBulkMsg({ kind: "ok", text: parts.join(" · ") });
      router.refresh();
    });
  }

  function indexBulk() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (!confirm(`Indexar ${selected.size} post(s) no IndexNow?\n\nSubmete URLs ao Bing/Yandex/Seznam/Naver/Yep (e em breve Google). Posts não-publicados ou já indexados sem alteração serão pulados.`)) return;
    setBulkMsg(null);
    startTransition(async () => {
      const res = await indexPostsBulkAction(ids);
      const parts = [`🔍 ${res.submitted} submetido(s)`, `${res.totalUrls} URL(s)`];
      if (res.skipped > 0) parts.push(`${res.skipped} pulado(s) (já indexado, sem alteração)`);
      if (res.notPublished > 0) parts.push(`${res.notPublished} não publicado(s)`);
      if (res.error) parts.push(`⚠ ${res.error}`);
      if (res.hostResults.length > 0) {
        const hostSummary = res.hostResults.map((h) => `${h.host}:${h.ok ? "✓" : "✗" + (h.status ? `(${h.status})` : "")}`).join(" ");
        parts.push(hostSummary);
      }
      setBulkMsg({
        kind: res.error || res.hostResults.some((h) => !h.ok) ? "warn" : "ok",
        text: parts.join(" · "),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 bg-voyia-gray border border-gray-600 rounded-xl px-5 py-3 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm text-white">
              <strong>{selected.size}</strong> post{selected.size > 1 ? "s" : ""} selecionado{selected.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-gray-300 hover:text-white px-3 py-1.5"
                disabled={pending}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={translateBulk}
                disabled={pending}
                title="Traduzir para todos os idiomas faltantes (DeepSeek)"
                className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🌐 Traduzir
              </button>
              <button
                type="button"
                onClick={publishBulk}
                disabled={pending}
                title="Mudar status para Publicado"
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                📤 Publicar
              </button>
              <button
                type="button"
                onClick={indexBulk}
                disabled={pending}
                title="Submeter URLs ao IndexNow (Bing/Yandex/Seznam/Naver/Yep)"
                className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🔍 Indexar
              </button>
              <button
                type="button"
                onClick={deleteBulk}
                disabled={pending}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                🗑 Excluir
              </button>
            </div>
          </div>
          {pending && (
            <p className="text-xs text-yellow-300 mt-2 animate-pulse">Processando — pode demorar (especialmente Traduzir).</p>
          )}
        </div>
      )}

      {bulkMsg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            bulkMsg.kind === "ok"
              ? "bg-green-900/30 border-green-500/40 text-green-200"
              : bulkMsg.kind === "warn"
                ? "bg-yellow-900/30 border-yellow-500/40 text-yellow-100"
                : "bg-red-900/30 border-red-500/40 text-red-200"
          } flex items-start justify-between gap-3`}
        >
          <span className="flex-1">{bulkMsg.text}</span>
          <button
            type="button"
            onClick={() => setBulkMsg(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-black/30 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="rounded border-gray-500 cursor-pointer"
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-4 py-3 w-20">Capa</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" title="Idiomas com tradução existente">Idiomas</th>
              <th className="px-4 py-3" title="Estado de indexação no IndexNow">Indexação</th>
              <th className="px-4 py-3">Atualizado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const isSelected = selected.has(post.id);
              const isDeleting = deletingId === post.id;
              return (
                <tr
                  key={post.id}
                  className={`border-b border-gray-700 last:border-0 transition-colors ${
                    isSelected ? "bg-red-950/20" : "hover:bg-black/20"
                  } ${isDeleting ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(post.id)}
                      className="rounded border-gray-500 cursor-pointer"
                      aria-label={`Selecionar ${post.slug}`}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {post.cover_image ? (
                      <a
                        href={`/admin/posts/${post.id}`}
                        className="block"
                        title="Editar (trocar capa no editor)"
                      >
                        <img
                          src={post.cover_image}
                          alt={post.title ?? ""}
                          className="w-16 h-10 object-cover rounded border border-gray-600 hover:border-voyia-blue transition-colors"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <a
                        href={`/admin/posts/${post.id}`}
                        className="w-16 h-10 rounded border border-dashed border-gray-600 hover:border-voyia-blue flex items-center justify-center text-xs text-gray-500 hover:text-voyia-blue transition-colors"
                        title="Sem capa — clique para adicionar"
                      >
                        + capa
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-white font-medium">
                    <div>{post.title ?? <span className="text-gray-500">(sem título)</span>}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{post.slug}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block text-xs px-2 py-1 border rounded ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}
                    >
                      {STATUS_LABELS[post.status] ?? post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    <div className="flex gap-1 flex-wrap">
                      {ALL_LOCALES.map((loc) => {
                        const has = post.available_locales.includes(loc);
                        const isSource = loc === post.source_locale;
                        return (
                          <span
                            key={loc}
                            title={`${loc}${isSource ? " (origem)" : ""}${has ? "" : " — falta"}`}
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              has
                                ? isSource
                                  ? "bg-voyia-blue/30 text-white border border-voyia-blue/50"
                                  : "bg-green-900/30 text-green-300 border border-green-500/30"
                                : "bg-gray-800 text-gray-600 border border-gray-700"
                            }`}
                          >
                            {loc.split("-")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {!post.indexed_at ? (
                      <span className="text-gray-500">○ não indexado</span>
                    ) : post.is_stale_index ? (
                      <span
                        className="text-yellow-300"
                        title={`Indexado em ${new Date(post.indexed_at).toLocaleString("pt-BR")}, mas alterado depois`}
                      >
                        ⚠ desatualizado
                      </span>
                    ) : (
                      <span
                        className="text-green-300"
                        title={`Indexado em ${new Date(post.indexed_at).toLocaleString("pt-BR")} via ${post.indexed_status ?? "?"}`}
                      >
                        ✓ indexado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-sm">
                    {new Date(post.updated_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-4">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-voyia-blue hover:text-purple-300 text-sm font-semibold"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteOne(post)}
                        disabled={pending || isDeleting}
                        className="text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
                      >
                        {isDeleting ? "…" : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
