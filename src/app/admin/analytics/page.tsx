import Link from "next/link";
import {
  getOverview,
  getFunnel,
  getAttributionBreakdown,
  planPerformance,
  topOriginPages,
  periodToDays,
  type Period,
} from "@/lib/db/analytics";
import { capiCountsByEvent } from "@/lib/db/capi-log";
import { getPlan } from "@/lib/asaas/plans";

export const metadata = {
  title: "Analytics | Painel Admin",
  robots: { index: false, follow: false },
};

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
};

function isPeriod(v: string | undefined): v is Period {
  return v === "today" || v === "7d" || v === "30d";
}

function fmtNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/admin/analytics">) {
  const sp = await searchParams;
  const rawPeriod = typeof sp.period === "string" ? sp.period : "7d";
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : "7d";
  const days = periodToDays(period);

  const overview = getOverview(days);
  const funnel = getFunnel(days);
  const attribution = getAttributionBreakdown(days);
  const plans = planPerformance(days);
  const origins = topOriginPages(days, 8);
  const capiCounts = capiCountsByEvent(days);

  const attributionTotal =
    attribution.meta_ads + attribution.google_ads + attribution.utm_other + attribution.direct;
  const totalCapi = capiCounts.reduce((a, b) => a + b.total, 0);
  const sentCapi = capiCounts.reduce((a, b) => a + b.sent, 0);
  const capiSuccessRate = totalCapi === 0 ? 1 : sentCapi / totalCapi;

  const cards: Array<{ label: string; value: string; sub?: string; emoji: string }> = [
    { label: "PageViews", value: fmtNumber(overview.pageviews), emoji: "👁️" },
    { label: "Visualizações VOYIA", value: fmtNumber(overview.view_content), emoji: "🎯" },
    { label: "Leads (WhatsApp)", value: fmtNumber(overview.leads), emoji: "📨" },
    { label: "Checkouts iniciados", value: fmtNumber(overview.checkouts), emoji: "🛒" },
    {
      label: "Subscribes confirmados",
      value: fmtNumber(overview.subscribes),
      sub: `R$ ${fmtBRL(overview.revenue_brl)}`,
      emoji: "✅",
    },
    {
      label: "Ativos agora",
      value: fmtNumber(overview.active_subscriptions),
      sub: "Total histórico",
      emoji: "💎",
    },
  ];

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white">
              ← Voltar ao painel
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Analytics & Conversões</h1>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            {(["today", "7d", "30d"] as const).map((p) => (
              <Link
                key={p}
                href={`/admin/analytics?period=${p}`}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-voyia-blue text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>
        </div>
        {/* Subnav */}
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm">
          <span className="text-voyia-blue font-semibold">Visão geral</span>
          <Link
            href={`/admin/analytics/attribution?period=${period}`}
            className="text-gray-400 hover:text-white"
          >
            Atribuição
          </Link>
          <Link
            href={`/admin/analytics/capi-log?period=${period}`}
            className="text-gray-400 hover:text-white"
          >
            Health CAPI
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* ---------- Cards ---------- */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            {PERIOD_LABELS[period]} · resumo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((c) => (
              <div
                key={c.label}
                className="bg-voyia-gray rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                {c.sub && <div className="text-xs text-green-400 mt-0.5">{c.sub}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Funil ---------- */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Funil VOYIA — conversão por etapa
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            {(() => {
              const max = funnel[0]?.count || 1;
              return (
                <div className="space-y-3">
                  {funnel.map((step) => {
                    const widthPct = (step.count / max) * 100;
                    return (
                      <div key={step.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-white">{step.name}</span>
                          <span className="text-gray-300">
                            {fmtNumber(step.count)}
                            {step.conversion_rate !== null && (
                              <span
                                className={`ml-2 text-xs ${
                                  step.conversion_rate >= 0.1
                                    ? "text-green-400"
                                    : step.conversion_rate >= 0.02
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                }`}
                              >
                                ({fmtPct(step.conversion_rate)} da anterior)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-voyia-blue to-green-500 rounded-full transition-all"
                            style={{ width: `${Math.max(widthPct, 0.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <p className="text-xs text-gray-500 mt-4">
              ViewContent vem do Pixel/CAPI ao abrir /produtos/voyia. Contact é o
              clique no WhatsApp. Lead é o submit do form. InitiateCheckout é o
              start do ASAAS. Subscribe é o pagamento confirmado.
            </p>
          </div>
        </section>

        {/* ---------- Grid 2 colunas: Atribuição + Health ---------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Atribuição */}
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
              Atribuição de leads + checkouts
            </h3>
            {attributionTotal === 0 ? (
              <p className="text-sm text-gray-500">Sem dados no período.</p>
            ) : (
              <div className="space-y-3">
                {(
                  [
                    { key: "meta_ads", label: "Meta Ads (fbclid)", color: "bg-blue-500" },
                    { key: "google_ads", label: "Google Ads (gclid)", color: "bg-yellow-500" },
                    { key: "utm_other", label: "Outras UTMs", color: "bg-purple-500" },
                    { key: "direct", label: "Direto / orgânico", color: "bg-gray-500" },
                  ] as const
                ).map((src) => {
                  const count = attribution[src.key];
                  const pct = (count / attributionTotal) * 100;
                  return (
                    <div key={src.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white">{src.label}</span>
                        <span className="text-gray-300">
                          {fmtNumber(count)} <span className="text-xs text-gray-500">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${src.color} rounded-full`}
                          style={{ width: `${Math.max(pct, 0.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href={`/admin/analytics/attribution?period=${period}`}
              className="inline-block mt-4 text-xs text-voyia-blue hover:underline"
            >
              Ver detalhamento por UTM →
            </Link>
          </div>

          {/* CAPI Health */}
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">
              Health Meta CAPI
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{fmtNumber(totalCapi)}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{fmtNumber(sentCapi)}</div>
                <div className="text-xs text-gray-400">Sucesso</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div
                  className={`text-2xl font-bold ${
                    capiSuccessRate >= 0.95
                      ? "text-green-400"
                      : capiSuccessRate >= 0.8
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {(capiSuccessRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Taxa</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {capiCounts.slice(0, 6).map((c) => (
                <div key={c.event_name} className="flex items-center justify-between">
                  <span className="text-gray-300">{c.event_name}</span>
                  <span className="text-gray-400">
                    {c.sent}/{c.total}
                    {c.failed > 0 && (
                      <span className="ml-1 text-red-400">· {c.failed} falha</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={`/admin/analytics/capi-log?period=${period}`}
              className="inline-block mt-4 text-xs text-voyia-blue hover:underline"
            >
              Ver log completo →
            </Link>
          </div>
        </section>

        {/* ---------- Performance por plano ---------- */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Performance por plano
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Iniciados</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Pagos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Conversão</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Receita (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                        Sem checkouts no período.
                      </td>
                    </tr>
                  ) : (
                    plans.map((p) => {
                      const plan = getPlan(p.plan_key);
                      return (
                        <tr key={p.plan_key} className="hover:bg-black/20">
                          <td className="px-4 py-3 text-white font-medium">
                            {plan?.name ?? p.plan_key}
                          </td>
                          <td className="px-4 py-3 text-gray-300 capitalize">{p.category}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{p.total}</td>
                          <td className="px-4 py-3 text-right text-green-300 font-semibold">{p.paid}</td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {fmtPct(p.conversion_rate)}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-mono">
                            {fmtBRL(p.mrr_brl)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------- Top origin pages ---------- */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Páginas que mais geram leads
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            {origins.length === 0 ? (
              <p className="text-sm text-gray-500">Sem leads com origem registrada no período.</p>
            ) : (
              <ul className="space-y-2">
                {origins.map((o) => (
                  <li key={o.origin_page} className="flex items-center justify-between text-sm">
                    <code className="text-gray-300 text-xs truncate max-w-[80%]">
                      {o.origin_page}
                    </code>
                    <span className="text-white font-semibold">{fmtNumber(o.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
