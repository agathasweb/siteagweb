"use client";

import { useRef, useState } from "react";
import UnsplashSearch from "./UnsplashSearch";

interface Props {
  name: string;
  initial: string | null;
  postSlug: string;
  defaultQuery?: string;
  /** Razão de crop W:H (ex: "16:9"). Padrão 16:9 — combina com o aspect-video da página do post. */
  aspect?: string;
}

export default function CoverImageField({
  name,
  initial,
  postSlug,
  defaultQuery,
  aspect = "16:9",
}: Props) {
  const [url, setUrl] = useState<string>(initial ?? "");
  const [attribution, setAttribution] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("post_slug", postSlug || "post");
      form.set("kind", "post");
      form.set("aspect", aspect);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? data.error ?? `HTTP ${res.status}`);
      }
      setUrl(data.path_large as string);
      setAttribution(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        name={name}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm font-mono"
        placeholder="/uploads/posts/2026/.../cover.webp"
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed border border-purple-500/40 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {uploading ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Enviando…
              </>
            ) : (
              <>📤 Enviar imagem (WebP {aspect})</>
            )}
          </button>
          <UnsplashSearch
            postSlug={postSlug}
            defaultQuery={defaultQuery}
            onPicked={(path, _alt, attr) => {
              setUrl(path);
              setAttribution(attr);
            }}
          />
        </div>
        {url && (
          <div className="flex items-center gap-2">
            <img
              src={url}
              alt=""
              className="h-12 w-20 object-cover rounded border border-gray-600"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setAttribution(null);
              }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500">
        Upload converte automaticamente para WebP e gera variantes responsivas
        (1600/800/400 px) com crop {aspect} centrado em região saliente.
      </p>

      {uploadError && (
        <p className="text-xs text-red-300 bg-red-900/30 border border-red-500/30 rounded px-3 py-2">
          ⚠ {uploadError}
        </p>
      )}

      {attribution && (
        <p className="text-xs text-gray-400 italic bg-black/20 px-3 py-2 rounded">
          📷 {attribution} — cole essa atribuição no alt text ou no rodapé do post se quiser dar crédito explícito.
        </p>
      )}
    </div>
  );
}
