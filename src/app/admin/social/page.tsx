import Link from "next/link";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { listScheduledPosts, getScheduledStats } from "@/lib/db/social-scheduled";
import { listPublishedPosts } from "@/lib/db/social-published";

export const metadata = {
  title: "Social | Painel Admin",
  robots: { index: false, follow: false },
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const ms = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").getTime() - Date.now();
  const min = Math.round(ms / 60000);
  if (min < -60 * 24) return `há ${Math.round(-min / 1440)}d`;
  if (min < -60) return `há ${Math.round(-min / 60)}h`;
  if (min < 0) return `há ${-min}min`;
  if (min < 60) return `em ${min}min`;
  if (min < 60 * 24) return `em ${Math.round(min / 60)}h`;
  return `em ${Math.round(min / 1440)}d`;
}

const TYPE_LABEL: Record<string, string> = {
  feed_image: "Feed (imagem)",
  feed_video: "Feed (vídeo)",
  reel: "Reel",
  carousel: "Carrossel",
  story_image: "Story (imagem)",
  story_video: "Story (vídeo)",
  linkedin_text: "LinkedIn (texto)",
  linkedin_image: "LinkedIn (imagem)",
  linkedin_video: "LinkedIn (vídeo)",
};

const STATUS_STYLE: Record<string, string> = {
  rascunho: "bg-gray-800 text-gray-300 border-gray-600",
  agendado: "bg-blue-900/40 text-blue-200 border-blue-500/40",
  publicando: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40",
  publicado: "bg-green-900/40 text-green-200 border-green-500/40",
  falhou: "bg-red-900/40 text-red-200 border-red-500/40",
  cancelado: "bg-gray-800 text-gray-400 border-gray-600",
};

export default async function SocialOverviewPage() {
  const accounts = listSocialAccounts();
  const stats = getScheduledStats();
  const upcoming = listScheduledPosts({ status: "agendado", limit: 8 }).reverse(); // mais próximos primeiro
  const recentPublished = listPublishedPosts(null, 6);

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white">
              ← Voltar ao painel
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Social — Agendador & Relatórios</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/social/relatorios-pdf"
              className="inline-flex items-center gap-2 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm"
            >
              📄 Relatórios PDF
            </Link>
            <Link
              href="/admin/social/agendar"
              className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Novo agendamento
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <span className="text-voyia-blue font-semibold">Visão geral</span>
          <Link href="/admin/social/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/agendar" className="text-gray-400 hover:text-white">Agendar</Link>
          <Link href="/admin/social/agendamentos" className="text-gray-400 hover:text-white">Agendamentos</Link>
          <Link href="/admin/social/biblioteca" className="text-gray-400 hover:text-white">Biblioteca</Link>
          <Link href="/admin/social/ads" className="text-gray-400 hover:text-white">Ads</Link>
          <Link href="/admin/social/relatorios-pdf" className="text-gray-400 hover:text-white">Relatórios PDF</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Contas */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Contas conectadas</h2>
          {accounts.length === 0 ? (
            <div className="bg-voyia-gray rounded-xl border border-yellow-500/40 p-6 text-center">
              <p className="text-gray-300 mb-3">Nenhuma conta cadastrada ainda.</p>
              <Link
                href="/admin/social/contas"
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold"
              >
                Descobrir contas automaticamente →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/social/relatorios/${a.id}`}
                  className="bg-voyia-gray rounded-xl border border-gray-700 p-5 hover:border-voyia-blue/50 transition-colors block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {a.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.profile_picture_url}
                        alt={a.username}
                        className="w-12 h-12 rounded-full border border-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-400">
                        {a.username[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-semibold truncate">{a.display_name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {a.provider === "instagram" ? "📷" : "💼"} @{a.username}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Seguidores</div>
                      <div className="text-white font-bold">{fmt(a.followers_count)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Mídias</div>
                      <div className="text-white font-bold">{fmt(a.media_count)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Stats cards */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Status dos agendamentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {([
              { label: "Rascunhos", v: stats.rascunho, cls: "text-gray-300" },
              { label: "Agendados", v: stats.agendado, cls: "text-blue-300" },
              { label: "Publicando", v: stats.publicando, cls: "text-yellow-300" },
              { label: "Publicados", v: stats.publicado, cls: "text-green-300" },
              { label: "Falharam", v: stats.falhou, cls: "text-red-300" },
            ] as const).map((s) => (
              <div key={s.label} className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className={`text-3xl font-bold ${s.cls}`}>{fmt(s.v)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Próximos agendamentos */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Próximas publicações</h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            {upcoming.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Nenhum post agendado.{" "}
                <Link href="/admin/social/agendar" className="text-voyia-blue hover:underline">
                  Criar o primeiro →
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Quando</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Conta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Legenda</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {upcoming.map((p) => {
                    const acc = accounts.find((a) => a.id === p.account_id);
                    return (
                      <tr key={p.id} className="hover:bg-black/20">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-white text-xs">{fmtDateTime(p.scheduled_at)}</div>
                          <div className="text-[10px] text-gray-500">{fmtRelative(p.scheduled_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">@{acc?.username ?? "?"}</td>
                        <td className="px-4 py-3 text-gray-300">{TYPE_LABEL[p.type] ?? p.type}</td>
                        <td className="px-4 py-3 text-gray-300 text-xs truncate max-w-[300px]">
                          {p.caption?.slice(0, 80) || <span className="text-gray-600">(sem legenda)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${STATUS_STYLE[p.status]}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Últimos publicados */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Últimos publicados</h2>
          {recentPublished.length === 0 ? (
            <div className="bg-voyia-gray rounded-xl border border-gray-700 p-6 text-center text-sm text-gray-500">
              Nenhum post sincronizado ainda. Aguarde 1h ou rode o sync manualmente.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentPublished.map((p) => (
                <a
                  key={p.id}
                  href={p.permalink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-voyia-gray rounded-lg border border-gray-700 overflow-hidden hover:border-voyia-blue/50 transition-colors"
                >
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail_url}
                      alt=""
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-800" />
                  )}
                  <div className="p-2">
                    <div className="text-[10px] text-gray-400 uppercase">{p.type}</div>
                    <div className="text-xs text-white flex justify-between mt-1">
                      <span>❤️ {fmt(p.likes)}</span>
                      <span>💬 {fmt(p.comments)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
