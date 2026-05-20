"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePostMetaAction, type SaveResult } from "../actions";
import CoverImageField from "@/components/admin/CoverImageField";
import type { Locale } from "@/lib/i18n";

interface PostRow {
  id: number;
  slug: string;
  status: string;
  source_locale: string;
  cover_image: string | null;
  category_id: number | null;
  article_type: string;
  noindex: number;
  nofollow: number;
  featured: number;
  canonical_url: string | null;
  scheduled_at: string | null;
  video_url: string | null;
  video_duration_sec: number | null;
  video_thumbnail: string | null;
  published_at: string | null;
}

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface Props {
  post: PostRow;
  categories: Category[];
  sourceLocale: Locale;
  defaultCoverQuery: string;
}

const ARTICLE_TYPES = [
  { value: "BlogPosting", label: "BlogPosting — post de blog" },
  { value: "Article", label: "Article — artigo genérico" },
  { value: "NewsArticle", label: "NewsArticle — notícia/jornalismo" },
  { value: "TechArticle", label: "TechArticle — tutorial técnico" },
  { value: "HowTo", label: "HowTo — guia passo a passo (rich result!)" },
  { value: "Course", label: "Course — conteúdo de curso" },
  { value: "Recipe", label: "Recipe — receita" },
];

export default function MetaForm({ post, categories, sourceLocale, defaultCoverQuery }: Props) {
  const boundAction = updatePostMetaAction.bind(null, post.id);
  const [state, formAction, pending] = useActionState<SaveResult | null, FormData>(
    boundAction,
    null,
  );

  // Auto-hide toast após 4s. Sincronizar visibilidade com savedAt requer
  // setState em effect (padrão suportado, mas a regra nova do React 19
  // alerta por padrão; ok porque o effect só dispara quando savedAt muda).
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    if (state?.ok && state.savedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastVisible(true);
      const t = setTimeout(() => setToastVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state?.ok, state?.savedAt]);

  return (
    <form action={formAction} className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5 relative">
      {/* Toast de sucesso */}
      {toastVisible && state?.ok && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg shadow-green-500/30 z-10 animate-pulse">
          ✓ Configurações salvas
        </div>
      )}

      {/* Banner de erro */}
      {state?.ok === false && state.error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200">
          ❌ {state.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Configurações do post</h2>
          <p className="text-sm text-gray-400 mt-0.5">Campos globais — afetam todos os idiomas.</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-white font-semibold transition-colors"
        >
          {pending ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>

      {/* Linha 1: Slug + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
          <input
            name="slug" type="text" required pattern="[a-z0-9-]+"
            defaultValue={post.slug}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select name="status" defaultValue={post.status} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendado</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Linha 2: Tipo de artigo + Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de artigo (Schema.org)</label>
          <select name="article_type" defaultValue={post.article_type} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
            {ARTICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
          <select name="category_id" defaultValue={post.category_id ?? ""} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
            <option value="">— Sem categoria —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha 3: Imagem de capa + Data agendada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imagem de capa</label>
          <CoverImageField
            name="cover_image"
            initial={post.cover_image}
            postSlug={post.slug}
            defaultQuery={defaultCoverQuery}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Data agendada</label>
          <input
            name="scheduled_at" type="datetime-local"
            defaultValue={post.scheduled_at?.slice(0, 16) ?? ""}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
        </div>
      </div>

      {/* Linha 4: Vídeo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">URL do vídeo (embed)</label>
          <input
            name="video_url" type="url"
            defaultValue={post.video_url ?? ""}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duração (segundos)</label>
          <input
            name="video_duration_sec" type="number" min="0"
            defaultValue={post.video_duration_sec ?? ""}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail do vídeo (URL)</label>
        <input
          name="video_thumbnail" type="url"
          defaultValue={post.video_thumbnail ?? ""}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
          placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">URL canônica (override)</label>
        <input
          name="canonical_url" type="url"
          defaultValue={post.canonical_url ?? ""}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
          placeholder="Deixe vazio para usar a URL natural"
        />
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
          <input type="checkbox" name="featured" defaultChecked={!!post.featured}
            className="rounded border-gray-500 text-voyia-blue" />
          <span className="text-sm text-white">⭐ Post em destaque</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
          <input type="checkbox" name="noindex" defaultChecked={!!post.noindex}
            className="rounded border-gray-500 text-red-500" />
          <span className="text-sm text-white">🚫 noindex</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
          <input type="checkbox" name="nofollow" defaultChecked={!!post.nofollow}
            className="rounded border-gray-500 text-yellow-500" />
          <span className="text-sm text-white">🚫 nofollow</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-1">
        <p>Idioma de origem: <span className="text-white font-mono">{sourceLocale}</span></p>
        <p>Publicado em: <span className="text-white">{post.published_at ? new Date(post.published_at).toLocaleString("pt-BR") : "—"}</span></p>
      </div>
    </form>
  );
}
