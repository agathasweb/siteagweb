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
  { value: "story_image", label: "Story — Imagem", emoji: "🖼️", hint: "Imagens 9:16 — múltiplas mídias criam stories individuais por horário" },
  { value: "story_video", label: "Story — Vídeo", emoji: "📹", hint: "Vídeos 9:16 até 60s — múltiplas mídias criam stories individuais por horário" },
];

function nowPlusMinutes(min: number): string {
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
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([nowPlusMinutes(10)]);
  const [medias, setMedias] = useState<UploadedMedia[]>([]);

  const isStory = type === "story_image" || type === "story_video";
  const maxItems = type === "carousel" || isStory ? 10 : 1;
  const allowMultiple = type === "carousel" || isStory;
  const acceptFiles = type === "story_video"
    ? "video/mp4,video/quicktime"
    : type === "story_image" || type === "feed_image"
      ? "image/jpeg,image/png,image/webp"
      : "image/jpeg,image/png,image/webp,video/mp4,video/quicktime";

  const totalPosts = isStory
    ? medias.length * scheduleTimes.length
    : scheduleTimes.length;

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

  function moveMedia(idx: number, dir: -1 | 1) {
    setMedias((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addScheduleTime() {
    setScheduleTimes((prev) => [...prev, nowPlusMinutes(10 + prev.length * 60)]);
  }

  function removeScheduleTime(idx: number) {
    if (scheduleTimes.length <= 1) return;
    setScheduleTimes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateScheduleTime(idx: number, val: string) {
    setScheduleTimes((prev) => prev.map((t, i) => (i === idx ? val : t)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountId) { setError("Selecione uma conta."); return; }
    if (!medias.length) { setError("Faça upload da mídia."); return; }
    if (type === "carousel" && (medias.length < 2 || medias.length > 10)) {
      setError("Carrossel precisa de 2 a 10 itens.");
      return;
    }
    if (!scheduleTimes.length) { setError("Adicione pelo menos um horário."); return; }

    startTransition(async () => {
      // Stories: 1 post por (mídia × horário). Outros: 1 post por horário com todas as mídias.
      const entries: Array<{ media_urls: string[]; scheduled_at: string }> = [];
      for (const time of scheduleTimes) {
        if (isStory) {
          for (const m of medias) {
            entries.push({ media_urls: [m.url], scheduled_at: new Date(time).toISOString() });
          }
        } else {
          entries.push({ media_urls: medias.map((m) => m.url), scheduled_at: new Date(time).toISOString() });
        }
      }

      for (const entry of entries) {
        const r = await createScheduledAction({
          account_id: accountId,
          type,
          caption: isStory ? "" : caption,
          media_urls: entry.media_urls,
          scheduled_at: entry.scheduled_at,
        });
        if (!r.ok) {
          setError(r.error ?? "Erro ao agendar.");
          return;
        }
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
          Mídia
          {type === "carousel" && " (2-10 itens)"}
          {isStory && medias.length > 0 && (
            <span className="text-gray-400 font-normal ml-2">— {medias.length} arquivo{medias.length !== 1 ? "s" : ""}, arraste para reordenar</span>
          )}
        </label>
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 hover:border-voyia-blue/50 transition-colors">
          <input
            type="file"
            multiple={allowMultiple}
            accept={acceptFiles}
            disabled={uploading || medias.length >= maxItems}
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-voyia-blue file:text-white file:cursor-pointer file:text-xs"
          />
          {uploading && <p className="text-xs text-yellow-300 mt-2">Enviando…</p>}
          <p className="text-[10px] text-gray-500 mt-2">
            {isStory
              ? type === "story_video"
                ? "Vídeos mp4/mov até 100MB. Cada arquivo = 1 story."
                : "Imagens jpeg/png/webp até 8MB. Cada arquivo = 1 story."
              : "Imagens: jpeg/png/webp até 8MB · Vídeos: mp4/mov até 100MB."}
            {" "}Arquivos ficam em <code>/uploads/social/</code> e são apagados ao remover o agendamento.
          </p>
        </div>

        {/* Preview + reordenação */}
        {medias.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
            {medias.map((m, i) => (
              <div key={m.url} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-square">
                  {m.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" muted />
                  )}
                </div>
                {/* Número de ordem */}
                <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                {/* Botão remover */}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white w-5 h-5 rounded-full text-xs leading-none flex items-center justify-center"
                  aria-label="Remover"
                >
                  ×
                </button>
                {/* Reordenação (só quando múltiplos) */}
                {medias.length > 1 && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveMedia(i, -1)}
                      disabled={i === 0}
                      className="bg-black/70 hover:bg-black/90 disabled:opacity-30 text-white text-[10px] px-1.5 py-0.5 rounded"
                      aria-label="Mover para esquerda"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(i, 1)}
                      disabled={i === medias.length - 1}
                      className="bg-black/70 hover:bg-black/90 disabled:opacity-30 text-white text-[10px] px-1.5 py-0.5 rounded"
                      aria-label="Mover para direita"
                    >
                      ›
                    </button>
                  </div>
                )}
                <div className="px-1 py-0.5 text-[9px] text-gray-400 text-center truncate">
                  {Math.round(m.sizeBytes / 1024)}KB
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legenda — oculta para stories */}
      {!isStory && (
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
      )}

      {/* Horários de agendamento */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Horário{scheduleTimes.length > 1 ? "s" : ""} de publicação
          </label>
          <button
            type="button"
            onClick={addScheduleTime}
            className="text-xs text-voyia-blue hover:text-purple-400 border border-voyia-blue/40 hover:border-purple-400/60 rounded px-2.5 py-1 transition-colors"
          >
            + Adicionar horário
          </button>
        </div>
        <div className="space-y-2">
          {scheduleTimes.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-5 text-right">{i + 1}.</span>
              <input
                type="datetime-local"
                value={t}
                onChange={(e) => updateScheduleTime(i, e.target.value)}
                min={nowPlusMinutes(1)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                required
              />
              {scheduleTimes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScheduleTime(i)}
                  className="text-gray-500 hover:text-red-400 text-lg leading-none px-1"
                  aria-label="Remover horário"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-500">
            Cron publica a cada 1 minuto. Fuso horário do seu navegador.
          </p>
          {totalPosts > 1 && (
            <p className="text-xs text-voyia-blue font-medium">
              {totalPosts} post{totalPosts !== 1 ? "s" : ""} serão criados
              {isStory && medias.length > 1 && ` (${medias.length} mídias × ${scheduleTimes.length} horário${scheduleTimes.length !== 1 ? "s" : ""})`}
            </p>
          )}
        </div>
        {scheduleTimes.length > 0 && (
          <button
            type="button"
            onClick={() => updateScheduleTime(0, nowPlusMinutes(2))}
            className="mt-2 text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-voyia-blue/50 rounded px-3 py-1.5"
          >
            Publicar daqui 2 minutos (teste)
          </button>
        )}
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
          {pending
            ? "Agendando…"
            : totalPosts > 1
              ? `Agendar ${totalPosts} publicações`
              : "Agendar publicação"}
        </button>
      </div>
    </form>
  );
}
