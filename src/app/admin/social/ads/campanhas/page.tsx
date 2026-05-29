import Link from "next/link";
import { listCampaigns, type CampaignStatus } from "@/lib/db/ads-campaigns";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import CampaignActions from "./CampaignActions";

export const metadata = {
  title: "Campanhas | Ads | Painel Admin",
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
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ARCHIVED: "Arquivada",
  DELETED: "Deletada",
};
const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Alcance",
};

function isStatus(v: string | undefined): v is CampaignStatus {
  return v === "ACTIVE" || v === "PAUSED" || v === "ARCHIVED" || v === "DELETED";
}

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const contaFilter = typeof sp.conta === "string" ? sp.conta : undefined;
  const statusFilter = isStatus(sp.status) ? sp.status : undefined;

  const accounts = listManagedAdsAccounts();
  const campaigns = listCampaigns({
    ad_account_id: contaFilter,
    status: statusFilter,
    limit: 200,
  });

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/social/ads" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Campanhas</h1>
          </div>
          <Link
            href="/admin/social/ads/nova"
            className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nova
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social/ads" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/social/ads/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/ads/nova" className="text-gray-400 hover:text-white">Nova campanha</Link>
          <span className="text-voyia-blue font-semibold">Campanhas</span>
          <Link href="/admin/social/ads/dashboard" className="text-gray-400 hover:text-white">Analytics</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            <Link
              href="/admin/social/ads/campanhas"
              className={`px-3 py-1.5 rounded text-xs font-medium ${!contaFilter ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"}`}
            >
              Todas contas
            </Link>
            {accounts.map((a) => (
              <Link
                key={a.id}
                href={`?conta=${a.ad_account_id}`}
                className={`px-3 py-1.5 rounded text-xs font-medium ${contaFilter === a.ad_account_id ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"}`}
              >
                {a.name}
              </Link>
            ))}
          </div>
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            {(["", "ACTIVE", "PAUSED"] as const).map((s) => (
              <Link
                key={s || "all"}
                href={contaFilter ? `?conta=${contaFilter}${s ? `&status=${s}` : ""}` : (s ? `?status=${s}` : "/admin/social/ads/campanhas")}
                className={`px-3 py-1.5 rounded text-xs font-medium ${(statusFilter ?? "") === s ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"}`}
              >
                {s ? STATUS_LABEL[s] : "Todas"}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Nenhuma campanha encontrada com esses filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Conta</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Obj.</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Budget/d</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Cap</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Gasto</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Impr.</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Cliques</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">CTR</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">CPC</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Conv.</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {campaigns.map((c) => {
                    const accName = accounts.find((a) => a.ad_account_id === c.ad_account_id)?.name ?? c.ad_account_id;
                    const capUsedPct = c.spend_cap_brl > 0 ? (c.spent_brl / c.spend_cap_brl) * 100 : 0;
                    return (
                      <tr key={c.id} className="hover:bg-black/20">
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/social/ads/campanhas/${c.external_id}`}
                            className="text-white hover:text-voyia-blue font-medium text-xs"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-gray-400 text-[10px]">{accName.replace("Agathas Web - Principal", "Agathas").replace("Voyia - AGWEB", "Voyia")}</td>
                        <td className="px-3 py-2.5 text-gray-300 text-xs">{OBJECTIVE_LABEL[c.objective] ?? c.objective}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${STATUS_STYLE[c.status] ?? STATUS_STYLE.ARCHIVED}`}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{c.daily_budget_brl ? `R$ ${fmtBRL(c.daily_budget_brl)}` : "—"}</td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="text-gray-300 text-xs">R$ {fmtBRL(c.spend_cap_brl)}</div>
                          {capUsedPct > 0 && (
                            <div className={`text-[9px] ${capUsedPct >= 80 ? "text-red-400" : capUsedPct >= 50 ? "text-yellow-400" : "text-gray-500"}`}>
                              {capUsedPct.toFixed(0)}% usado
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-white text-xs">R$ {fmtBRL(c.spent_brl)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{fmt(c.impressions)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{fmt(c.clicks)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{(c.ctr).toFixed(2)}%</td>
                        <td className="px-3 py-2.5 text-right text-gray-300 text-xs">R$ {fmtBRL(c.cpc_brl)}</td>
                        <td className="px-3 py-2.5 text-right text-green-300 text-xs">{fmt(c.conversions)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <CampaignActions external_id={c.external_id} status={c.status} />
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
