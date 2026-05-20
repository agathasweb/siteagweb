"use client";

import { useState } from "react";

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  thumb_url: string;
  preview_url: string;
  download_url: string;
  width: number;
  height: number;
  color: string;
  photographer: { name: string; username: string; profile_url: string };
  html_url: string;
  download_location: string;
}

interface PickedResult {
  path: string;
  path_thumb: string;
  path_medium: string;
  path_large: string;
  width: number;
  height: number;
  bytes: number;
}

interface Props {
  postSlug: string;
  onPicked: (path: string, alt: string, attribution: string) => void;
  /** Sugestão inicial de busca (ex: focus keyword). */
  defaultQuery?: string;
}

export default function UnsplashSearch({ postSlug, onPicked, defaultQuery = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setPhotos([]);
    try {
      const res = await fetch(`/api/admin/unsplash/search?q=${encodeURIComponent(query)}&per_page=12`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setPhotos(data.photos as UnsplashPhoto[]);
      if (data.photos.length === 0) {
        setError(`Nenhum resultado para "${query}".`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na busca.");
    } finally {
      setLoading(false);
    }
  }

  async function pickPhoto(photo: UnsplashPhoto) {
    setPicking(photo.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/unsplash/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          download_url: photo.download_url,
          download_location: photo.download_location,
          post_slug: postSlug || "post",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.detail ?? `HTTP ${res.status}`);
      }
      const picked = data as PickedResult;
      const alt = photo.alt_description || photo.description || "Imagem de capa";
      const attribution = `Foto por ${photo.photographer.name} no Unsplash (${photo.html_url})`;
      onPicked(picked.path_large, alt, attribution);
      setOpen(false);
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar imagem.");
    } finally {
      setPicking(null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (defaultQuery && photos.length === 0) {
            setTimeout(() => doSearch(), 100);
          }
        }}
        className="inline-flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        🔍 Buscar no Unsplash
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-voyia-gray rounded-2xl border border-gray-700 max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Buscar imagem no Unsplash</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-700 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                doSearch();
              }
            }}
            placeholder="Ex: WhatsApp business, mobile education, customer support…"
            autoFocus
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
          />
          <button
            type="button"
            onClick={doSearch}
            disabled={loading || !query.trim()}
            className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200 mb-4">
              {error}
            </div>
          )}
          {photos.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {photos.length} resultado(s) — clique para escolher. Atribuição automática.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPhoto(p)}
                    disabled={picking !== null}
                    className={`relative group overflow-hidden rounded-lg border border-gray-700 hover:border-voyia-blue transition-all ${
                      picking === p.id ? "opacity-50" : picking ? "opacity-30 cursor-not-allowed" : "hover:scale-[1.02]"
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    <img
                      src={p.thumb_url}
                      alt={p.alt_description || ""}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                      <p className="text-xs text-white truncate">📷 {p.photographer.name}</p>
                    </div>
                    {picking === p.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white font-semibold">
                        Baixando…
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Imagens © seus respectivos autores via Unsplash License. Atribuição
                ao fotógrafo é automaticamente salva na descrição do post.
              </p>
            </>
          )}
          {!loading && photos.length === 0 && !error && (
            <div className="text-center py-12 text-sm text-gray-400">
              Digite uma busca para encontrar imagens grátis na Unsplash.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
