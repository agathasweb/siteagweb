import Link from "next/link";
import { listManagedAdsAccounts, getAdsAccountById } from "@/lib/db/ads-accounts";
import { getAccountDailyInsights, type CampaignInsights } from "@/lib/meta-ads/insights";
import { getAdsBreakdowns, type BreakdownRow } from "@/lib/meta-ads/breakdowns";
import DashboardFilters from "./DashboardFilters";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata = {
  title: "Analytics | Ads | Painel Admin",
  robots: { index: false, follow: false },
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}
function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysToPreset(days: number): "last_7d" | "last_14d" | "last_30d" | "last_90d" {
  if (days <= 7) return "last_7d";
  if (days <= 14) return "last_14d";
  if (days <= 30) return "last_30d";
  return "last_90d";
}

// ── Line chart SVG (mesmo padrão da página de detalhe de campanha) ──
function LineChart({
  data,
  color = "#3b82f6",
  height = 180,
  width = 800,
  label,
  money = false,
}: {
  data: Array<{ x: string; y: number }>;
  color?: string;
  height?: number;
  width?: number;
  label: string;
  money?: boolean;
}) {
  if (data.length === 0) {
    return <div className="text-xs text-gray-500 italic py-8 text-center">Sem {label} no período.</div>;
  }
  const padding = { top: 16, right: 16, bottom: 24, left: 52 };
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
  const axisLabel = (v: number) => (money ? `R$${fmt(v)}` : fmt(v));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={padding.left} y1={padding.top + innerH * p} x2={padding.left + innerW} y2={padding.top + innerH * p} stroke="rgba(255,255,255,0.05)" />
          <text x={padding.left - 6} y={padding.top + innerH * p + 3} textAnchor="end" fill="#6b7280" fontSize="10">
            {axisLabel(Math.round(maxY * (1 - p)))}
          </text>
        </g>
      ))}
      <polyline fill="none" stroke={color} strokeWidth="2" points={points.join(" ")} />
      {data.map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + innerH - (d.y / maxY) * innerH;
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill={color}>
            <title>{d.x}: {money ? `R$ ${fmtBRL(d.y)}` : fmt(d.y)}</title>
          </circle>
        );
      })}
    </svg>
  );
}

// ── Barras horizontais (CSS) para breakdowns ──
const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#14b8a6", "#a855f7", "#eab308", "#64748b", "#f97316"];

function Bars({
  rows,
  metric = "impressions",
  emptyLabel,
}: {
  rows: BreakdownRow[];
  metric?: "impressions" | "clicks" | "spend_brl" | "conversions";
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <div className="text-xs text-gray-500 italic py-6 text-center">{emptyLabel}</div>;
  }
  const val = (r: BreakdownRow) => r[metric];
  const max = Math.max(...rows.map(val), 1);
  const total = rows.reduce((s, r) => s + val(r), 0);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const v = val(r);
        const pct = total > 0 ? (v / total) * 100 : 0;
        const display = metric === "spend_brl" ? `R$ ${fmtBRL(v)}` : fmt(v);
        return (
          <div key={r.key + i}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-gray-200 truncate pr-2" title={r.key}>{r.key}</span>
              <span className="text-gray-400 tabular-nums whitespace-nowrap">
                {display} <span className="text-gray-600">· {pct.toFixed(1)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(v / max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
      <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-1">{title}</h3>
      {hint && <p className="text-[11px] text-gray-500 mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}

function sumDaily(series: CampaignInsights[]) {
  return series.reduce(
    (acc, d) => {
      acc.spent += d.spent_brl;
      acc.impressions += d.impressions;
      acc.clicks += d.clicks;
      acc.reach += d.reach;
      acc.conversions += d.conversions;
      return acc;
    },
    { spent: 0, impressions: 0, clicks: 0, reach: 0, conversions: 0 },
  );
}

/** Agrega a série diária de várias contas por data. */
function aggregateDaily(seriesList: CampaignInsights[][]): CampaignInsights[] {
  const map = new Map<string, CampaignInsights>();
  for (const series of seriesList) {
    for (const d of series) {
      const date = d.date_start ?? "";
      if (!date) continue;
      const cur = map.get(date);
      if (cur) {
        cur.spent_brl += d.spent_brl;
        cur.impressions += d.impressions;
        cur.clicks += d.clicks;
        cur.reach += d.reach;
        cur.conversions += d.conversions;
      } else {
        map.set(date, { ...d });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.date_start ?? "").localeCompare(b.date_start ?? ""));
}

export default async function AdsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const accounts = listManagedAdsAccounts();
  const conta = sp.conta && getAdsAccountById(sp.conta) ? sp.conta : undefined;
  const days = Number(sp.days ?? "30");
  const preset = daysToPreset(Number.isFinite(days) ? days : 30);

  const tokenMissing = !process.env.META_SOCIAL_ACCESS_TOKEN?.trim();
  const targets = conta ? [conta] : accounts.map((a) => a.ad_account_id);

  // Série diária (1 chamada/conta) + breakdowns (6 chamadas/conta) em paralelo.
  const [dailySeriesList, breakdowns] = await Promise.all([
    Promise.all(targets.map((t) => getAccountDailyInsights(t, preset))),
    getAdsBreakdowns({ ad_account_id: conta, date_preset: preset }),
  ]);

  const daily = aggregateDaily(dailySeriesList);
  const totals = sumDaily(daily);
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spent / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spent / totals.impressions) * 1000 : 0;

  const scopeLabel = conta ? getAdsAccountById(conta)?.name ?? conta : `Todas as contas (${accounts.length})`;
  const hasData = totals.impressions > 0 || totals.clicks > 0;

  const pdfParams = new URLSearchParams();
  if (conta) pdfParams.set("ad_account_id", conta);
  pdfParams.set("days", String(Number.isFinite(days) ? days : 30));

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/ads" className="text-xs text-gray-400 hover:text-white">
              ← Voltar ao Ads
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Analytics — Dados de Campanhas</h1>
            <p className="text-xs text-gray-400 mt-0.5">{scopeLabel} · últimos {Number.isFinite(days) ? days : 30} dias</p>
          </div>
          <a
            href={`/api/admin/reports/ads?${pdfParams.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            📄 Exportar PDF
          </a>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/ads" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/ads/contas" className="text-gray-400 hover:text-white">Contas de anúncio</Link>
          <Link href="/admin/ads/contas-instagram" className="text-gray-400 hover:text-white">Contas Instagram</Link>
          <Link href="/admin/ads/campanhas" className="text-gray-400 hover:text-white">Campanhas</Link>
          <span className="text-voyia-blue font-semibold">Analytics</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <DashboardFilters accounts={accounts} />

        {tokenMissing && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 text-sm text-red-100">
            Token <code>META_SOCIAL_ACCESS_TOKEN</code> ausente — os dados analíticos vêm ao vivo da Meta e
            não podem ser carregados. Configure o token e recarregue.
          </div>
        )}

        {!tokenMissing && !hasData && (
          <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-xl p-4 text-sm text-yellow-100">
            Sem impressões registradas no período selecionado. Experimente um período maior ou verifique se há
            campanhas ativas na conta.
          </div>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Investimento</div>
            <div className="text-2xl font-bold text-white">R$ {fmtBRL(totals.spent)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Visualizações</div>
            <div className="text-2xl font-bold text-white">{fmt(totals.impressions)}</div>
            <div className="text-[10px] text-gray-500 mt-1">Alcance {fmt(totals.reach)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Cliques</div>
            <div className="text-2xl font-bold text-white">{fmt(totals.clicks)}</div>
            <div className="text-[10px] text-gray-500 mt-1">CTR {ctr.toFixed(2)}%</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">CPC</div>
            <div className="text-2xl font-bold text-blue-300">R$ {fmtBRL(cpc)}</div>
            <div className="text-[10px] text-gray-500 mt-1">CPM R$ {fmtBRL(cpm)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Conversões</div>
            <div className="text-2xl font-bold text-green-300">{fmt(totals.conversions)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Custo/conv.</div>
            <div className="text-2xl font-bold text-purple-300">
              {totals.conversions > 0 ? `R$ ${fmtBRL(totals.spent / totals.conversions)}` : "—"}
            </div>
          </div>
        </section>

        {/* Séries diárias */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Panel title="Visualizações por dia">
            <LineChart data={daily.map((d) => ({ x: d.date_start?.slice(5) ?? "?", y: d.impressions }))} color="#8b5cf6" label="visualizações" />
          </Panel>
          <Panel title="Cliques por dia">
            <LineChart data={daily.map((d) => ({ x: d.date_start?.slice(5) ?? "?", y: d.clicks }))} color="#22c55e" label="cliques" />
          </Panel>
          <Panel title="Investimento por dia">
            <LineChart data={daily.map((d) => ({ x: d.date_start?.slice(5) ?? "?", y: d.spent_brl }))} color="#f59e0b" label="gasto" money />
          </Panel>
        </section>

        {/* Demografia */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Faixa etária" hint="Visualizações por idade — onde o anúncio mais aparece.">
            <Bars rows={breakdowns.age} metric="impressions" emptyLabel="Sem dados de idade no período." />
          </Panel>
          <Panel title="Gênero" hint="Distribuição de visualizações por gênero.">
            <Bars rows={breakdowns.gender} metric="impressions" emptyLabel="Sem dados de gênero no período." />
          </Panel>
        </section>

        {/* Localização */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Localização — Estados/Regiões" hint="Top regiões por visualizações.">
            <Bars rows={breakdowns.region} metric="impressions" emptyLabel="Sem dados de região no período." />
          </Panel>
          <Panel title="Localização — Países" hint="Visualizações por país.">
            <Bars rows={breakdowns.country} metric="impressions" emptyLabel="Sem dados de país no período." />
          </Panel>
        </section>

        {/* Plataforma e dispositivo */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Plataforma" hint="Facebook, Instagram, Audience Network, Messenger.">
            <Bars rows={breakdowns.platform} metric="impressions" emptyLabel="Sem dados de plataforma no período." />
          </Panel>
          <Panel title="Dispositivo" hint="Aparelho onde o anúncio foi exibido.">
            <Bars rows={breakdowns.device} metric="impressions" emptyLabel="Sem dados de dispositivo no período." />
          </Panel>
        </section>

        {/* Cliques por segmento — utilidade de otimização */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Cliques por faixa etária" hint="Qual idade mais clica — útil pra ajustar segmentação.">
            <Bars rows={breakdowns.age} metric="clicks" emptyLabel="Sem cliques por idade no período." />
          </Panel>
          <Panel title="Cliques por região" hint="Onde o público mais engaja.">
            <Bars rows={breakdowns.region} metric="clicks" emptyLabel="Sem cliques por região no período." />
          </Panel>
        </section>

        <p className="text-[11px] text-gray-600 text-center">
          Dados ao vivo da Meta Marketing API (breakdowns por dimensão). Conversões contam eventos de
          Pixel/CAPI atribuídos. Para o relatório completo com ROAS real cruzado com vendas, use “Exportar PDF”.
        </p>
      </div>
    </main>
  );
}
