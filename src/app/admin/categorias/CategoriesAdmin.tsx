"use client";

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  saveCategoryTranslationAction,
  updateCategoryAction,
} from "./actions";

const LOCALES = [
  { code: "pt-BR", label: "🇧🇷 PT" },
  { code: "es", label: "🇪🇸 ES" },
  { code: "en-US", label: "🇺🇸 US" },
  { code: "en-GB", label: "🇬🇧 UK" },
] as const;

export interface CategoryWithTranslations {
  id: number;
  slug: string;
  color: string | null;
  created_at: string;
  translations: Record<string, { name: string; description: string | null }>;
}

interface Props {
  initial: CategoryWithTranslations[];
}

export default function CategoriesAdmin({ initial }: Props) {
  const [categories, setCategories] = useState<CategoryWithTranslations[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9333ea");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createCategoryAction(form);
        setNewName("");
        // Soft refresh — relies on Next revalidate triggering server re-render
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar.");
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Apagar categoria? Posts vinculados ficam sem categoria.")) return;
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao apagar.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">Nova categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome (PT-BR)</label>
            <input
              name="name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Desenvolvimento Web"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Slug</label>
            <input
              name="slug"
              type="text"
              placeholder="auto"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Cor</label>
            <input
              name="color"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-full h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-5 py-2 rounded text-sm font-semibold"
          >
            Criar
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Categorias existentes ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-8 text-center text-gray-500 text-sm">
            Nenhuma categoria ainda. Crie a primeira acima — recomendado 3-8 categorias amplas.
          </div>
        ) : (
          <ul className="space-y-3">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onDelete={() => handleDelete(cat.id)}
                pending={pending}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onDelete,
  pending,
}: {
  category: CategoryWithTranslations;
  onDelete: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [translations, setTranslations] = useState(category.translations);
  const [slug, setSlug] = useState(category.slug);
  const [color, setColor] = useState(category.color ?? "#9333ea");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSaveMeta() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("slug", slug);
        form.set("color", color);
        await updateCategoryAction(category.id, form);
        setFeedback("Slug e cor salvos.");
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function handleSaveTranslation(locale: string) {
    const t = translations[locale] ?? { name: "", description: null };
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveCategoryTranslationAction(
          category.id,
          locale,
          t.name,
          t.description,
        );
        setFeedback(`${locale} salvo.`);
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function updateTranslation(
    locale: string,
    field: "name" | "description",
    value: string,
  ) {
    setTranslations((prev) => {
      const existing = prev[locale] ?? { name: "", description: null };
      return {
        ...prev,
        [locale]: {
          ...existing,
          [field]: field === "description" ? (value || null) : value,
        },
      };
    });
  }

  return (
    <li className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full border border-gray-600"
            style={{ backgroundColor: category.color ?? "#444" }}
          />
          <span className="text-white font-medium">
            {category.translations["pt-BR"]?.name ?? category.slug}
          </span>
          <span className="text-xs text-gray-400 font-mono">/{category.slug}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {LOCALES.map((l) => (
            <span
              key={l.code}
              className={
                category.translations[l.code]?.name
                  ? "text-green-400"
                  : "text-gray-600"
              }
            >
              {l.label.split(" ")[0]}
            </span>
          ))}
          <span className="text-gray-500 ml-2">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="p-5 border-t border-gray-700 space-y-4 bg-black/20">
          {feedback && (
            <p className="text-xs text-voyia-blue">{feedback}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Cor</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-9 bg-gray-800 border border-gray-600 rounded cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveMeta}
              disabled={pending}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
            >
              Salvar
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase">Traduções</p>
            {LOCALES.map((l) => {
              const t = translations[l.code] ?? { name: "", description: null };
              return (
                <div key={l.code} className="grid grid-cols-[60px_1fr_2fr_auto] gap-2 items-center">
                  <span className="text-xs font-medium text-gray-300">{l.label}</span>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => updateTranslation(l.code, "name", e.target.value)}
                    placeholder="Nome da categoria"
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                  />
                  <input
                    type="text"
                    value={t.description ?? ""}
                    onChange={(e) => updateTranslation(l.code, "description", e.target.value)}
                    placeholder="Descrição opcional (SEO)"
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTranslation(l.code)}
                    disabled={pending}
                    className="text-xs bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-2 rounded font-semibold"
                  >
                    Salvar
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="text-xs bg-red-900/50 hover:bg-red-800 disabled:opacity-50 text-red-200 px-4 py-2 rounded font-semibold"
            >
              Apagar categoria
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
