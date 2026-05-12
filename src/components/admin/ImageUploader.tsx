"use client";

import { useState } from "react";

export interface UploadedImage {
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
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  label?: string;
}

export default function ImageUploader({ postSlug, value, onChange, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("post_slug", postSlug || "post");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onChange(data as UploadedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {value ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-600 bg-black/40">
            <img
              src={value.path_medium}
              alt={label ?? "Imagem"}
              className="w-full max-h-80 object-contain"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              Remover
            </button>
          </div>
          <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Dimensões: <span className="text-gray-200 font-mono">{value.width} × {value.height}</span>
            </span>
            <span>
              Tamanho: <span className="text-gray-200 font-mono">{(value.bytes / 1024).toFixed(0)} KB</span>
            </span>
            <span>
              4 variantes WebP geradas (original, 1600, 800, 400)
            </span>
          </div>
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-white">URLs geradas</summary>
            <ul className="mt-2 space-y-1 font-mono">
              <li>orig: <span className="text-gray-300">{value.path}</span></li>
              <li>1600: <span className="text-gray-300">{value.path_large}</span></li>
              <li> 800: <span className="text-gray-300">{value.path_medium}</span></li>
              <li> 400: <span className="text-gray-300">{value.path_thumb}</span></li>
            </ul>
          </details>
        </div>
      ) : (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploading
              ? "border-voyia-blue bg-voyia-blue/10"
              : "border-gray-600 hover:border-voyia-blue hover:bg-voyia-blue/5"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {uploading ? (
            <div className="text-voyia-blue">
              <p className="font-semibold">Convertendo para WebP…</p>
              <p className="text-xs text-gray-400 mt-1">
                Gerando 4 variantes responsivas
              </p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-white font-medium">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG, WebP, AVIF ou GIF · até 12 MB · será convertida automaticamente para
                WebP em 4 tamanhos
              </p>
            </>
          )}
        </label>
      )}
      {error && (
        <p className="text-sm text-red-300 mt-2">⚠ {error}</p>
      )}
    </div>
  );
}
