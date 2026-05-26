import Link from "next/link";
import { listPublishedPosts } from "@/lib/db/social-published";
import { listSocialAccounts } from "@/lib/db/social-accounts";

export const metadata = {
  title: "Biblioteca | Social | Painel Admin",
  robots: { index: false, follow: false },
};

const TYPE_LABEL: Record<string, string> = {
  feed_image: "Feed",
  feed_video: "Feed vídeo",
  reel: "Reel",
  carousel: "Carrossel",
  story: "Story",
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const sp = await searchParams;
  const accountFilter = sp.account ? Number(sp.account) : null;

  const accounts = listSocialAccounts();
  const posts = listPublishedPosts(accountFilter, 100);

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
            ← Voltar à visão geral
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Biblioteca de posts publicados</h1>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/social/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/agendar" className="text-gray-400 hover:text-white">Agendar</Link>
          <Link href="/admin/social/agendamentos" className="text-gray-400 hover:text-white">Agendamentos</Link>
          <span className="text-voyia-blue font-semibold">Biblioteca</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        {/* Filtro por conta */}
        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1 w-fit">
          <Link
            href="/admin/social/biblioteca"
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              !accountFilter ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Todas
          </Link>
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`?account=${a.id}`}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                accountFilter === a.id ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              @{a.username}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-8 text-center text-sm text-gray-500">
            Nenhum post sincronizado ainda. O cron <code>/api/cron/social-sync</code> roda a cada hora;
            ou rode manualmente em <Link href="/admin/social" className="text-voyia-blue hover:underline">visão geral</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((p) => {
              const acc = accounts.find((a) => a.id === p.account_id);
              return (
                <a
                  key={p.id}
                  href={p.permalink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden hover:border-voyia-blue/50 transition-colors block"
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
                    <div className="w-full aspect-square bg-gray-800 flex items-center justify-center text-4xl">
                      🎞️
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase mb-2">
                      <span>{TYPE_LABEL[p.type] ?? p.type}</span>
                      <span>@{acc?.username ?? "?"}</span>
                    </div>
                    <div className="text-xs text-gray-300 line-clamp-2 mb-2 min-h-[2rem]">
                      {p.caption ?? <span className="text-gray-600">(sem legenda)</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-gray-300">
                      <div title="Curtidas">❤️ {fmt(p.likes)}</div>
                      <div title="Comentários">💬 {fmt(p.comments)}</div>
                      <div title="Salvos">🔖 {fmt(p.saves)}</div>
                      <div title="Views">👁️ {fmt(p.views)}</div>
                      <div title="Reach">📡 {fmt(p.reach)}</div>
                      <div title="Engaj. total" className="text-green-300">⚡ {fmt(p.engagement_total)}</div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2">{fmtDate(p.published_at)}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
