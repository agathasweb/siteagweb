"use client";

import { useState } from "react";
import UnsplashSearch from "./UnsplashSearch";

interface Props {
  name: string;
  initial: string | null;
  postSlug: string;
  defaultQuery?: string;
}

export default function CoverImageField({ name, initial, postSlug, defaultQuery }: Props) {
  const [url, setUrl] = useState<string>(initial ?? "");
  const [attribution, setAttribution] = useState<string | null>(null);

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
        <UnsplashSearch
          postSlug={postSlug}
          defaultQuery={defaultQuery}
          onPicked={(path, _alt, attr) => {
            setUrl(path);
            setAttribution(attr);
          }}
        />
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

      {attribution && (
        <p className="text-xs text-gray-400 italic bg-black/20 px-3 py-2 rounded">
          📷 {attribution} — cole essa atribuição no alt text ou no rodapé do post se quiser dar crédito explícito.
        </p>
      )}
    </div>
  );
}
