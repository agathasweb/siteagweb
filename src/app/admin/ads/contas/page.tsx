import Link from "next/link";
import { listAllAdsAccounts } from "@/lib/db/ads-accounts";
import DiscoverAdsButton from "./DiscoverAdsButton";
import ToggleAccountSwitch from "./ToggleAccountSwitch";

export const metadata = {
  title: "Contas Ads | Painel Admin",
  robots: { index: false, follow: false },
};

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: "ATIVA", cls: "bg-green-900/40 text-green-200 border-green-500/40" },
  2: { label: "DESABILITADA", cls: "bg-orange-900/40 text-orange-200 border-orange-500/40" },
  3: { label: "FECHADA", cls: "bg-red-900/40 text-red-200 border-red-500/40" },
  7: { label: "PENDENTE", cls: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40" },
  101: { label: "ANY_INVALID", cls: "bg-red-900/40 text-red-200 border-red-500/40" },
};

export default async function ContasAdsPage() {
  const accounts = listAllAdsAccounts();

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/ads" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Ad Accounts</h1>
          </div>
          <DiscoverAdsButton />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/ads" className="text-gray-400 hover:text-white">Visão geral</Link>
          <span className="text-voyia-blue font-semibold">Contas de anúncio</span>
          <Link href="/admin/ads/contas-instagram" className="text-gray-400 hover:text-white">Contas Instagram</Link>
          <Link href="/admin/ads/nova" className="text-gray-400 hover:text-white">Nova campanha</Link>
          <Link href="/admin/ads/campanhas" className="text-gray-400 hover:text-white">Campanhas</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4 text-sm text-blue-100 space-y-1">
          <p>
            <strong>Como funciona:</strong> O token Voyia tem acesso a 13 ad accounts (suas + clientes).
            Ative apenas <strong>Agathas Web - Principal</strong> e <strong>Voyia - AGWEB</strong> pra
            elas aparecerem no painel de campanhas. As outras ficam ignoradas.
          </p>
          <p>
            <strong>Importante:</strong> Ativar/desativar aqui é só local — não desabilita nada no Meta.
          </p>
        </div>

        <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
          {accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Clique em <em>&quot;Descobrir ad accounts&quot;</em> acima pra puxar a lista da Meta.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Gerenciar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Business</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Gasto histórico</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {accounts.map((a) => {
                  const s = STATUS_LABEL[a.account_status] ?? STATUS_LABEL[101];
                  return (
                    <tr key={a.id} className={`hover:bg-black/20 ${a.ativo === 0 ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 text-center">
                        <ToggleAccountSwitch ad_account_id={a.ad_account_id} initial={a.ativo === 1} />
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{a.ad_account_id}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{a.business_name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs">R$ {fmtBRL(a.amount_spent)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">R$ {fmtBRL(a.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
