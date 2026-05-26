import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignByExternalId } from "@/lib/db/ads-campaigns";
import { getAdsAccountById } from "@/lib/db/ads-accounts";
import { listAdsActionLog } from "@/lib/db/ads-action-log";
import { getCampaignDailyInsights } from "@/lib/meta-ads/insights";
import CampaignActions from "../CampaignActions";
import EditBudgetButton from "./EditBudgetButton";

export const metadata = {
  title: "Campanha | Ads | Painel Admin",
  robots: { index: false, follow: false },
};

function fmt(n: number): string { return n.toLocaleString("pt-BR"); }
function fmtBRL(n: number): string { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-900/40 text-green-200 border-green-500/40",
  PAUSED: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40",
  ARCHIVED: "bg-gray-800 text-gray-400 border-gray-700",
  DELETED: "bg-red-900/40 text-red-300 border-red-500/40",
};

// SVG line chart simples — same pattern do /admin/social/relatorios
function LineChart({
  data, color = "#3b82f6", height = 200, width = 800, label,
}: {
  data: Array<{ x: string; y: number }>;
  color?: string;
  height?: number;
  width?: number;
  label: string;
}) {
  if (data.length === 0) {
    return <div className="text-xs text-gray-500 italic py-6 text-center">Sem {label} no período.</div>;
  }
  const padding = { top: 16, right: 16, bottom: 24, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(...ys, 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.y / maxY) * innerH;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={padding.left} y1={padding.top + innerH * p} x2={padding.left + innerW} y2={padding.top + innerH * p} stroke="rgba(255,255,255,0.05)" />
          <text x={padding.left - 6} y={padding.top + innerH * p + 3} textAnchor="end" fill="#6b7280" fontSize="10">
            {fmt(Math.round(maxY * (1 - p)))}
          </text>
        </g>
      ))}
      <polyline fill="none" stroke={color} strokeWidth="2" points={points.join(" ")} />
      {data.map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + innerH - (d.y / maxY) * innerH;
        return <circle key={i} cx={x} cy={y} r="3" fill={color}><title>{d.x}: {fmt(d.y)}</title></circle>;
      })}
    </svg>
  );
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ external_id: string }>;
}) {
  const { external_id } = await params;
  const camp = getCampaignByExternalId(external_id);
  if (!camp) notFound();

  const account = getAdsAccountById(camp.ad_account_id);
  const dailyInsights = await getCampaignDailyInsights(external_id, "last_30d");
  const auditLog = listAdsActionLog({ campaign_id: external_id, limit: 20 });

  const capUsedPct = camp.spend_cap_brl > 0 ? (camp.spent_brl / camp.spend_cap_brl) * 100 : 0;

  const spendSeries = dailyInsights.map((i) => ({ x: i.date_start?.slice(5) ?? "?", y: i.spent_brl }));
  const clickSeries = dailyInsights.map((i) => ({ x: i.date_start?.slice(5) ?? "?", y: i.clicks }));
  const convSeries = dailyInsights.map((i) => ({ x: i.date_start?.slice(5) ?? "?", y: i.conversions }));

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href="/admin/social/ads/campanhas" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à lista
            </Link>
            <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-3 flex-wrap">
              {camp.name}
              <span className={`inline-block text-xs px-2 py-0.5 rounded border ${STATUS_STYLE[camp.status] ?? STATUS_STYLE.ARCHIVED}`}>
                {camp.status}
              </span>
            </h1>
            <div className="text-xs text-gray-400 mt-1">
              {OBJECTIVE_LABEL[camp.objective] ?? camp.objective} · {account?.name ?? camp.ad_account_id} · <code>{camp.external_id}</code>
            </div>
          </div>
          <CampaignActions external_id={external_id} status={camp.status} />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Cards de métricas */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Gasto</div>
            <div className="text-2xl font-bold text-white">R$ {fmtBRL(camp.spent_brl)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Spend cap</div>
            <div className="text-2xl font-bold text-yellow-300">R$ {fmtBRL(camp.spend_cap_brl)}</div>
            <div className={`text-[10px] mt-1 ${capUsedPct >= 80 ? "text-red-400" : capUsedPct >= 50 ? "text-yellow-400" : "text-gray-500"}`}>
              {capUsedPct.toFixed(0)}% atingido
            </div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Impressões</div>
            <div className="text-2xl font-bold text-white">{fmt(camp.impressions)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Cliques</div>
            <div className="text-2xl font-bold text-white">{fmt(camp.clicks)}</div>
            <div className="text-[10px] text-gray-500 mt-1">CTR {camp.ctr.toFixed(2)}%</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">CPC</div>
            <div className="text-2xl font-bold text-blue-300">R$ {fmtBRL(camp.cpc_brl)}</div>
            <div className="text-[10px] text-gray-500 mt-1">CPM R$ {fmtBRL(camp.cpm_brl)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Conversões</div>
            <div className="text-2xl font-bold text-green-300">{fmt(camp.conversions)}</div>
            {camp.conversions > 0 && camp.spent_brl > 0 && (
              <div className="text-[10px] text-gray-500 mt-1">Custo/conv R$ {fmtBRL(camp.spent_brl / camp.conversions)}</div>
            )}
          </div>
        </section>

        {/* Configuração + edit */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5 lg:col-span-2">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Configuração</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-gray-400">Budget diário</dt><dd className="text-white">{camp.daily_budget_brl ? `R$ ${fmtBRL(camp.daily_budget_brl)}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Spend cap absoluto</dt><dd className="text-yellow-300">R$ {fmtBRL(camp.spend_cap_brl)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Início</dt><dd className="text-gray-300">{fmtDateTime(camp.start_time)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Fim</dt><dd className="text-gray-300">{fmtDateTime(camp.stop_time)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Tipo</dt><dd className="text-gray-300">{camp.buying_type ?? "AUCTION"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Frequência</dt><dd className="text-gray-300">{camp.frequency.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Reach (únicos)</dt><dd className="text-gray-300">{fmt(camp.reach)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Último sync</dt><dd className="text-gray-300">{fmtDateTime(camp.last_sync_at)}</dd></div>
            </dl>
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Editar orçamento</h3>
            <EditBudgetButton
              external_id={external_id}
              current_daily={camp.daily_budget_brl}
              current_cap={camp.spend_cap_brl}
            />
            <p className="text-[10px] text-gray-500 mt-3">
              Spend cap só pode SUBIR. Pra baixar, delete a campanha e crie outra.
            </p>
          </div>
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Gasto diário</h3>
            <LineChart data={spendSeries} color="#3b82f6" label="gasto" />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Cliques diários</h3>
            <LineChart data={clickSeries} color="#22c55e" label="cliques" />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Conversões diárias</h3>
            <LineChart data={convSeries} color="#a855f7" label="conversões" />
          </div>
        </section>

        {/* Audit log */}
        <section>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Histórico de ações</h3>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            {auditLog.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">Sem ações registradas ainda.</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase">Quando</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase">Ação</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase">Usuário</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {auditLog.map((l) => (
                    <tr key={l.id} className="hover:bg-black/20">
                      <td className="px-4 py-2 text-gray-400 font-mono">{fmtDateTime(l.created_at)}</td>
                      <td className="px-4 py-2 text-gray-300">{l.action}</td>
                      <td className="px-4 py-2 text-gray-400">{l.user_email ?? "—"}</td>
                      <td className="px-4 py-2">
                        {l.success === 1 ? (
                          <span className="text-green-400">✓ OK</span>
                        ) : (
                          <span className="text-red-400">✗ {l.error_message ?? "falha"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
