"use client";

import { useState } from "react";

interface Props {
  name: string;
  initialUrl: string | null;
  slugHint: string;
}

interface UploadResponse {
  path: string;
  path_thumb: string;
  path_medium: string;
  path_large: string;
  width: number;
  height: number;
  bytes: number;
}

export default function AvatarUploader({ name, initialUrl, slugHint }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "avatar");
      form.set("post_slug", slugHint || "avatar");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json()) as UploadResponse | { error?: string };
      if (!res.ok || !("path_thumb" in data)) {
        throw new Error(("error" in data && data.error) || `HTTP ${res.status}`);
      }
      // Avatar usa o thumb (400×400) — tamanho ideal para schema.org/Person.image
      setUrl(data.path_thumb);
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
    <div className="space-y-3">
      <input type="hidden" name={name} value={url ?? ""} />

      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {url ? (
            <img
              src={url}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-600 bg-black/40"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 bg-black/40 flex items-center justify-center text-3xl text-gray-500">
              👤
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`block border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
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
              <p className="text-sm text-voyia-blue font-medium">Enviando…</p>
            ) : (
              <>
                <p className="text-sm text-white font-medium">
                  {url ? "Trocar avatar" : "Enviar avatar"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Arraste ou clique · JPEG/PNG/WebP/AVIF · até 12 MB · cropado em 400×400 WebP
                </p>
              </>
            )}
          </label>

          {url && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <code className="text-gray-400 font-mono truncate flex-1">{url}</code>
              <button
                type="button"
                onClick={() => setUrl(null)}
                className="text-red-400 hover:text-red-300 shrink-0"
              >
                Remover
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-300 mt-2">⚠ {error}</p>}
        </div>
      </div>
    </div>
  );
}
