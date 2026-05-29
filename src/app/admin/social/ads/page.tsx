import Link from "next/link";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import { listCampaigns, spendSummary } from "@/lib/db/ads-campaigns";
import SyncButton from "./SyncButton";

export const metadata = {
  title: "Ads | Painel Admin",
  robots: { index: false, follow: false },
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}
function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-900/40 text-green-200 border-green-500/40",
  PAUSED: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40",
  ARCHIVED: "bg-gray-800 text-gray-400 border-gray-700",
  DELETED: "bg-red-900/40 text-red-300 border-red-500/40",
};

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Alcance",
  OUTCOME_APP_PROMOTION: "App",
};

export default async function AdsOverviewPage() {
  const accounts = listManagedAdsAccounts();
  const campaigns = listCampaigns({ limit: 10 });

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
              ← Voltar ao Social
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Ads — Campanhas de Tráfego</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/social/ads/dashboard"
              className="inline-flex items-center gap-2 bg-voyia-gray hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              📊 Analytics
            </Link>
            <SyncButton />
            <Link
              href="/admin/social/ads/nova"
              className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Nova campanha
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <span className="text-voyia-blue font-semibold">Visão geral</span>
          <Link href="/admin/social/ads/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/ads/nova" className="text-gray-400 hover:text-white">Nova campanha</Link>
          <Link href="/admin/social/ads/campanhas" className="text-gray-400 hover:text-white">Campanhas</Link>
          <Link href="/admin/social/ads/dashboard" className="text-gray-400 hover:text-white">Analytics</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {accounts.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-xl p-6">
            <p className="text-yellow-100 mb-3">
              Nenhuma ad account ativa ainda. O token Voyia tem acesso a várias contas —
              ative só as que quer gerenciar aqui (Agathas Web Principal e Voyia AGWEB).
            </p>
            <Link
              href="/admin/social/ads/contas"
              className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold"
            >
              Configurar contas →
            </Link>
          </div>
        )}

        {/* Cards das contas gerenciadas */}
        {accounts.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Contas gerenciadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((a) => {
                const sum = spendSummary(a.ad_account_id);
                return (
                  <div key={a.id} className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">{a.name}</div>
                        <code className="text-[10px] text-gray-500">{a.ad_account_id}</code>
                      </div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${a.account_status === 1 ? "bg-green-900/40 text-green-200 border-green-500/40" : "bg-red-900/40 text-red-200 border-red-500/40"}`}>
                        {a.account_status === 1 ? "ATIVA" : "INATIVA"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-400">Gasto local (30d)</div>
                        <div className="text-white font-bold">R$ {fmtBRL(sum.total_spent)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Ativas</div>
                        <div className="text-green-300 font-bold">{sum.active_count}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Pausadas</div>
                        <div className="text-yellow-300 font-bold">{sum.paused_count}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-gray-500 flex items-center justify-between">
                      <span>Gasto histórico Meta: R$ {fmtBRL(a.amount_spent)}</span>
                      <Link
                        href={`/admin/social/ads/campanhas?conta=${a.ad_account_id}`}
                        className="text-voyia-blue hover:underline"
                      >
                        Ver campanhas →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lista de campanhas recentes */}
        {accounts.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Campanhas mais recentes</h2>
            <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
              {campaigns.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma campanha local ainda. As campanhas da Meta aparecem aqui após o próximo
                  sync (~15min) ou após você criar a primeira pelo painel.{" "}
                  <Link href="/admin/social/ads/nova" className="text-voyia-blue hover:underline">
                    Criar →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Objetivo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Budget/dia</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Cap</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Gasto</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">CTR</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-black/20">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/social/ads/campanhas/${c.external_id}`}
                              className="text-white hover:text-voyia-blue font-medium"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-xs">{OBJECTIVE_LABEL[c.objective] ?? c.objective}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${STATUS_STYLE[c.status] ?? STATUS_STYLE.ARCHIVED}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.daily_budget_brl ? `R$ ${fmtBRL(c.daily_budget_brl)}` : "—"}</td>
                          <td className="px-4 py-3 text-right text-gray-300">R$ {fmtBRL(c.spend_cap_brl)}</td>
                          <td className="px-4 py-3 text-right text-white">R$ {fmtBRL(c.spent_brl)}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{(c.ctr * 100).toFixed(2)}%</td>
                          <td className="px-4 py-3 text-right text-green-300">{fmt(c.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
