"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createScheduledAction } from "./actions";
import type { SocialAccountRow } from "@/lib/db/social-accounts";
import type { ScheduledPostType } from "@/lib/db/social-scheduled";

interface UploadedMedia {
  url: string;
  type: "image" | "video";
  sizeBytes: number;
}

const TYPE_OPTIONS: Array<{ value: ScheduledPostType; label: string; emoji: string; hint: string }> = [
  { value: "feed_image", label: "Feed — Imagem", emoji: "📷", hint: "Foto única no feed (máx 8MB)" },
  { value: "feed_video", label: "Feed — Vídeo", emoji: "🎬", hint: "Vídeo no feed (máx 100MB, recomendado MP4 H264)" },
  { value: "reel", label: "Reel", emoji: "🎞️", hint: "Vídeo vertical até 90s, otimizado pra alcance" },
  { value: "carousel", label: "Carrossel", emoji: "🎠", hint: "2 a 10 imagens/vídeos em sequência" },
  { value: "story_image", label: "Story — Imagem", emoji: "🖼️", hint: "Imagem 9:16, dura 24h" },
  { value: "story_video", label: "Story — Vídeo", emoji: "📹", hint: "Vídeo 9:16 até 60s" },
];

function nowPlusMinutes(min: number): string {
  // ISO sem zona, formato datetime-local: YYYY-MM-DDTHH:MM (timezone do browser)
  const d = new Date(Date.now() + min * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AgendarForm({ accounts }: { accounts: SocialAccountRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [accountId, setAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const [type, setType] = useState<ScheduledPostType>("feed_image");
  const [caption, setCaption] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [scheduledAt, setScheduledAt] = useState(nowPlusMinutes(10));
  const [medias, setMedias] = useState<UploadedMedia[]>([]);

  const needsMultiple = type === "carousel";
  const maxItems = type === "carousel" ? 10 : 1;
  const allowVideo = type !== "feed_image" && type !== "story_image" && type !== "carousel"
    ? true
    : type === "carousel"; // carousel aceita ambos

  async function handleUpload(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      const added: UploadedMedia[] = [];
      for (const file of Array.from(files)) {
        if (medias.length + added.length >= maxItems) break;
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/admin/social-upload", { method: "POST", body: fd });
        const j = (await r.json()) as { ok: boolean; url?: string; type?: "image" | "video"; sizeBytes?: number; error?: string };
        if (!j.ok || !j.url || !j.type) {
          setError(`Upload falhou: ${j.error}`);
          break;
        }
        added.push({ url: j.url, type: j.type, sizeBytes: j.sizeBytes ?? 0 });
      }
      setMedias((prev) => [...prev, ...added].slice(0, maxItems));
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(idx: number) {
    setMedias((prev) => prev.filter((_, i) => i !== idx));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountId) { setError("Selecione uma conta."); return; }
    if (!medias.length) { setError("Faça upload da mídia."); return; }
    if (needsMultiple && medias.length < 2) { setError("Carrossel precisa de 2 a 10 itens."); return; }

    const hashtags = hashtagsText
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#+/, "").trim())
      .filter(Boolean);

    startTransition(async () => {
      const r = await createScheduledAction({
        account_id: accountId,
        type,
        caption,
        hashtags,
        media_urls: medias.map((m) => m.url),
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      if (!r.ok) {
        setError(r.error ?? "Erro ao agendar.");
        return;
      }
      router.push("/admin/social/agendamentos");
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-xl p-6 text-center">
        <p className="text-yellow-100 mb-3">Você precisa cadastrar pelo menos 1 conta antes.</p>
        <a href="/admin/social/contas" className="text-voyia-blue hover:underline">Ir para Contas →</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Conta + tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Conta</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.provider === "instagram" ? "📷" : "💼"} @{a.username} ({a.display_name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de post</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as ScheduledPostType); setMedias([]); }}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {TYPE_OPTIONS.find((t) => t.value === type)?.hint}
          </p>
        </div>
      </div>

      {/* Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Mídia {needsMultiple ? "(2-10 itens)" : ""}
        </label>
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 hover:border-voyia-blue/50 transition-colors">
          <input
            type="file"
            multiple={needsMultiple}
            accept={allowVideo ? "image/jpeg,image/png,image/webp,video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp"}
            disabled={uploading || medias.length >= maxItems}
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-voyia-blue file:text-white file:cursor-pointer file:text-xs"
          />
          {uploading && <p className="text-xs text-yellow-300 mt-2">Enviando…</p>}
          <p className="text-[10px] text-gray-500 mt-2">
            Imagens: jpeg/png/webp até 8MB · Vídeos: mp4/mov até 100MB.
            Arquivos ficam em <code>/uploads/social/</code> do servidor e são apagados quando você remove o agendamento.
          </p>
        </div>

        {/* Preview da mídia */}
        {medias.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
            {medias.map((m, i) => (
              <div key={m.url} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-square">
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white w-6 h-6 rounded-full text-xs leading-none flex items-center justify-center"
                  aria-label="Remover"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                  {m.type} · {Math.round(m.sizeBytes / 1024)}KB
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Legenda <span className="text-xs text-gray-500">({caption.length}/2200)</span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          maxLength={2200}
          placeholder="Escreva a legenda do post…"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
        />
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hashtags <span className="text-xs text-gray-500">(separadas por espaço ou vírgula, sem #)</span>
        </label>
        <input
          type="text"
          value={hashtagsText}
          onChange={(e) => setHashtagsText(e.target.value)}
          placeholder="agathas voyia whatsapp ai"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Serão adicionadas automaticamente ao final da legenda com #.
        </p>
      </div>

      {/* Agendamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Publicar em</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={nowPlusMinutes(1)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Cron publica a cada 1 minuto. O sistema usa o seu fuso horário.
          </p>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <button
            type="button"
            onClick={() => setScheduledAt(nowPlusMinutes(2))}
            className="text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-voyia-blue/50 rounded px-3 py-2"
          >
            Publicar daqui 2 minutos (teste)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
        <a
          href="/admin/social"
          className="px-4 py-2.5 text-sm text-gray-300 hover:text-white"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          {pending ? "Agendando…" : "Agendar publicação"}
        </button>
      </div>
    </form>
  );
}
