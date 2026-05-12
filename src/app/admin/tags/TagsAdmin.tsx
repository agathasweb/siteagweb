"use client";

import { useState, useTransition } from "react";
import {
  renameTagAction,
  deleteTagAction,
  mergeTagsAction,
} from "./actions";

export interface TagItem {
  id: number;
  slug: string;
  name: string;
  post_count: number;
}

interface Props {
  initial: TagItem[];
}

export default function TagsAdmin({ initial }: Props) {
  const [tags, setTags] = useState<TagItem[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mergeSource, setMergeSource] = useState<number | null>(null);

  function handleRename(id: number, newName: string) {
    const original = tags.find((t) => t.id === id);
    if (!original || newName === original.name) return;
    setError(null);
    startTransition(async () => {
      try {
        await renameTagAction(id, newName);
        setTags((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, name: newName, slug: newName.toLowerCase().replace(/\s+/g, "-") }
              : t,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Apagar tag? Vínculos com posts serão removidos.")) return;
    startTransition(async () => {
      try {
        await deleteTagAction(id);
        setTags((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function handleMerge(targetId: number) {
    if (mergeSource === null || mergeSource === targetId) return;
    const source = tags.find((t) => t.id === mergeSource);
    const target = tags.find((t) => t.id === targetId);
    if (!source || !target) return;
    if (
      !confirm(
        `Mesclar "${source.name}" em "${target.name}"? Todos os posts da primeira passam para a segunda e a primeira é apagada.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await mergeTagsAction(mergeSource, targetId);
        setTags((prev) =>
          prev
            .filter((t) => t.id !== mergeSource)
            .map((t) =>
              t.id === targetId
                ? { ...t, post_count: t.post_count + source.post_count }
                : t,
            ),
        );
        setMergeSource(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  return (
    <div>
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 text-sm text-red-200 mb-4">
          {error}
        </div>
      )}

      {mergeSource !== null && (
        <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-3 text-sm text-yellow-100 mb-4 flex items-center justify-between">
          <span>
            Selecionando destino para mesclar{" "}
            <strong>"{tags.find((t) => t.id === mergeSource)?.name}"</strong>… Clique
            em <strong>"Mesclar aqui"</strong> na tag de destino.
          </span>
          <button
            type="button"
            onClick={() => setMergeSource(null)}
            className="text-xs underline"
          >
            Cancelar
          </button>
        </div>
      )}

      {tags.length === 0 ? (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-8 text-center text-gray-500 text-sm">
          Nenhuma tag ainda. Tags são criadas automaticamente quando você as digita
          no campo "Tags" ao criar um post.
        </div>
      ) : (
        <table className="w-full bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
          <thead>
            <tr className="border-b border-gray-700 bg-black/30 text-left text-xs uppercase text-gray-400">
              <th className="px-5 py-3">Tag</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3 text-center">Posts</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                pending={pending}
                onRename={handleRename}
                onDelete={() => handleDelete(tag.id)}
                onStartMerge={() => setMergeSource(tag.id)}
                onSelectMergeTarget={() => handleMerge(tag.id)}
                isMergeSource={mergeSource === tag.id}
                mergeMode={mergeSource !== null && mergeSource !== tag.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TagRow({
  tag,
  pending,
  onRename,
  onDelete,
  onStartMerge,
  onSelectMergeTarget,
  isMergeSource,
  mergeMode,
}: {
  tag: TagItem;
  pending: boolean;
  onRename: (id: number, name: string) => void;
  onDelete: () => void;
  onStartMerge: () => void;
  onSelectMergeTarget: () => void;
  isMergeSource: boolean;
  mergeMode: boolean;
}) {
  const [name, setName] = useState(tag.name);

  return (
    <tr
      className={`border-b border-gray-700 last:border-0 ${
        isMergeSource ? "bg-yellow-900/10" : "hover:bg-black/20"
      }`}
    >
      <td className="px-5 py-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onRename(tag.id, name)}
          className="bg-transparent border-0 border-b border-transparent hover:border-gray-600 focus:border-voyia-blue text-white text-sm w-full focus:outline-none"
        />
      </td>
      <td className="px-5 py-3 text-gray-400 text-xs font-mono">{tag.slug}</td>
      <td className="px-5 py-3 text-center">
        <span className="text-xs px-2 py-1 bg-black/40 rounded text-gray-300 font-mono">
          {tag.post_count}
        </span>
      </td>
      <td className="px-5 py-3 text-right space-x-2">
        {mergeMode ? (
          <button
            type="button"
            onClick={onSelectMergeTarget}
            disabled={pending}
            className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded"
          >
            Mesclar aqui
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onStartMerge}
              disabled={pending || isMergeSource}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
            >
              Mesclar…
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="text-xs bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded"
            >
              Apagar
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
