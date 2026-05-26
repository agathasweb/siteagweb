import Link from "next/link";
import { listAllSocialAccounts } from "@/lib/db/social-accounts";
import DiscoverButton from "./DiscoverButton";
import DeleteAccountButton from "./DeleteButton";
import ReactivateButton from "./ReactivateButton";

export const metadata = {
  title: "Contas | Social | Painel Admin",
  robots: { index: false, follow: false },
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ContasPage() {
  const all = listAllSocialAccounts();
  const accounts = all.filter((a) => a.ativo === 1);
  const removed = all.filter((a) => a.ativo === 0);

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Contas sociais</h1>
          </div>
          <DiscoverButton />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social" className="text-gray-400 hover:text-white">Visão geral</Link>
          <span className="text-voyia-blue font-semibold">Contas</span>
          <Link href="/admin/social/agendar" className="text-gray-400 hover:text-white">Agendar</Link>
          <Link href="/admin/social/agendamentos" className="text-gray-400 hover:text-white">Agendamentos</Link>
          <Link href="/admin/social/biblioteca" className="text-gray-400 hover:text-white">Biblioteca</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4 text-sm text-blue-100 space-y-2">
          <p>
            <strong>Como funciona:</strong> Clique em <em>&quot;Descobrir contas do Meta&quot;</em> e o sistema
            consulta as páginas Facebook ligadas ao seu System User Token e cadastra todas as
            contas Instagram Business/Creator associadas. É <strong>idempotente</strong> —
            roda quantas vezes quiser sem duplicar.
          </p>
          <p>
            <strong>Remover não afeta o Instagram</strong> — só esconde a conta deste painel.
            A conta continua intacta no Meta e o registro fica preservado no banco
            (apenas com <code>ativo=0</code>). Você pode reativar a qualquer momento na
            tabela abaixo. <strong>Re-clicar &quot;Descobrir&quot; NÃO reativa</strong> contas
            que você removeu — sua decisão é respeitada.
          </p>
        </div>

        <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
          {accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Nenhuma conta cadastrada ainda. Use o botão acima.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Conta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">IG User ID</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Seguidores</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Mídias</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Último sync</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-black/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.profile_picture_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                        )}
                        <div>
                          <div className="text-white font-medium">{a.display_name}</div>
                          <div className="text-xs text-gray-400">@{a.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{a.provider}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{a.ig_user_id ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-white">{fmt(a.followers_count)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(a.media_count)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDateTime(a.last_sync_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteAccountButton id={a.id} username={a.username} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Removidas — esconde se vazio */}
        {removed.length > 0 && (
          <details className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-black/20">
              Contas removidas ({removed.length}) — não aparecem no agendador
            </summary>
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Conta</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">IG User ID</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Seguidores</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {removed.map((a) => (
                  <tr key={a.id} className="hover:bg-black/20 opacity-60">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {a.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.profile_picture_url} alt="" className="w-8 h-8 rounded-full grayscale" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                        )}
                        <div>
                          <div className="text-white font-medium">{a.display_name}</div>
                          <div className="text-xs text-gray-500">@{a.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs font-mono">{a.ig_user_id ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{a.followers_count.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2 text-right">
                      <ReactivateButton id={a.id} username={a.username} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </main>
  );
}
