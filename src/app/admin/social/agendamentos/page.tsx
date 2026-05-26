import Link from "next/link";
import { listScheduledPosts, type ScheduledStatus } from "@/lib/db/social-scheduled";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import CancelButton from "./CancelButton";

export const metadata = {
  title: "Agendamentos | Social | Painel Admin",
  robots: { index: false, follow: false },
};

const TYPE_LABEL: Record<string, string> = {
  feed_image: "📷 Feed (img)",
  feed_video: "🎬 Feed (vid)",
  reel: "🎞️ Reel",
  carousel: "🎠 Carrossel",
  story_image: "🖼️ Story (img)",
  story_video: "📹 Story (vid)",
  linkedin_text: "💼 LinkedIn",
  linkedin_image: "💼 LinkedIn (img)",
  linkedin_video: "💼 LinkedIn (vid)",
};

const STATUS_STYLE: Record<ScheduledStatus, string> = {
  rascunho: "bg-gray-800 text-gray-300 border-gray-600",
  agendado: "bg-blue-900/40 text-blue-200 border-blue-500/40",
  publicando: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40",
  publicado: "bg-green-900/40 text-green-200 border-green-500/40",
  falhou: "bg-red-900/40 text-red-200 border-red-500/40",
  cancelado: "bg-gray-800 text-gray-500 border-gray-700",
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = typeof sp.status === "string" ? sp.status : "";

  const rows = listScheduledPosts({
    status: (statusFilter || undefined) as ScheduledStatus | undefined,
    limit: 200,
  });
  const accounts = listSocialAccounts();

  const FILTERS: Array<{ value: string; label: string }> = [
    { value: "", label: "Todos" },
    { value: "agendado", label: "Agendados" },
    { value: "publicando", label: "Publicando" },
    { value: "publicado", label: "Publicados" },
    { value: "falhou", label: "Falhas" },
    { value: "cancelado", label: "Cancelados" },
  ];

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Agendamentos</h1>
          </div>
          <Link
            href="/admin/social/agendar"
            className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Novo
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/social/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/agendar" className="text-gray-400 hover:text-white">Agendar</Link>
          <span className="text-voyia-blue font-semibold">Agendamentos</span>
          <Link href="/admin/social/biblioteca" className="text-gray-400 hover:text-white">Biblioteca</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        {/* Filtros */}
        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1 w-fit">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `?status=${f.value}` : "/admin/social/agendamentos"}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === f.value || (f.value === "" && !statusFilter)
                  ? "bg-voyia-blue text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Nenhum agendamento {statusFilter ? `com status "${statusFilter}"` : ""}.{" "}
              <Link href="/admin/social/agendar" className="text-voyia-blue hover:underline">
                Criar agora →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Quando</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Conta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Legenda</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Try</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rows.map((p) => {
                    const acc = accounts.find((a) => a.id === p.account_id);
                    const canCancel = p.status === "agendado" || p.status === "rascunho";
                    return (
                      <tr key={p.id} className="hover:bg-black/20">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-white text-xs">{fmtDateTime(p.scheduled_at)}</div>
                          {p.published_at && (
                            <div className="text-[10px] text-green-400">
                              publicado: {fmtDateTime(p.published_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">@{acc?.username ?? "?"}</td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{TYPE_LABEL[p.type] ?? p.type}</td>
                        <td className="px-4 py-3 text-gray-300 text-xs truncate max-w-[250px]">
                          {p.caption?.slice(0, 60) || <span className="text-gray-600">(sem legenda)</span>}
                          {p.error_message && (
                            <div className="text-[10px] text-red-300 mt-0.5 truncate">
                              ⚠ {p.error_message.slice(0, 80)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${STATUS_STYLE[p.status]}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.attempts}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {p.permalink && (
                            <a
                              href={p.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-voyia-blue hover:underline mr-3"
                            >
                              Ver post
                            </a>
                          )}
                          {canCancel && <CancelButton id={p.id} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
