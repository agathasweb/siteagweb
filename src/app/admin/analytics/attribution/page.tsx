import Link from "next/link";
import {
  getAttributionBreakdown,
  topUtms,
  periodToDays,
  type Period,
} from "@/lib/db/analytics";

export const metadata = {
  title: "Atribuição | Analytics | Painel Admin",
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

export default async function AttributionPage({
  searchParams,
}: PageProps<"/admin/analytics/attribution">) {
  const sp = await searchParams;
  const rawPeriod = typeof sp.period === "string" ? sp.period : "7d";
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : "7d";
  const days = periodToDays(period);

  const breakdown = getAttributionBreakdown(days);
  const sources = topUtms("utm_source", days);
  const mediums = topUtms("utm_medium", days);
  const campaigns = topUtms("utm_campaign", days);

  const total =
    breakdown.meta_ads + breakdown.google_ads + breakdown.utm_other + breakdown.direct;

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/analytics" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Atribuição & UTMs</h1>
          </div>
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            {(["today", "7d", "30d"] as const).map((p) => (
              <Link
                key={p}
                href={`/admin/analytics/attribution?period=${p}`}
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
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm">
          <Link href={`/admin/analytics?period=${period}`} className="text-gray-400 hover:text-white">
            Visão geral
          </Link>
          <span className="text-voyia-blue font-semibold">Atribuição</span>
          <Link
            href={`/admin/analytics/capi-log?period=${period}`}
            className="text-gray-400 hover:text-white"
          >
            Health CAPI
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Resumo */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Distribuição por canal — leads + checkouts
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            {total === 0 ? (
              <p className="text-sm text-gray-500">Sem dados no período selecionado.</p>
            ) : (
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "meta_ads",
                      label: "Meta Ads",
                      hint: "Veio de um clique em anúncio Facebook/Instagram (fbclid)",
                      color: "bg-blue-500",
                    },
                    {
                      key: "google_ads",
                      label: "Google Ads",
                      hint: "Veio de um clique em anúncio Google (gclid)",
                      color: "bg-yellow-500",
                    },
                    {
                      key: "utm_other",
                      label: "Outras campanhas",
                      hint: "Tem UTMs mas não é Meta nem Google (e-mail, LinkedIn, parceiro)",
                      color: "bg-purple-500",
                    },
                    {
                      key: "direct",
                      label: "Direto / orgânico",
                      hint: "Tráfego sem parâmetros — SEO, link direto, redes sociais sem UTM",
                      color: "bg-gray-500",
                    },
                  ] as const
                ).map((src) => {
                  const count = breakdown[src.key];
                  const pct = (count / total) * 100;
                  return (
                    <div key={src.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white font-medium">{src.label}</span>
                        <span className="text-gray-300">
                          {fmtNumber(count)}{" "}
                          <span className="text-xs text-gray-500">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${src.color} rounded-full`}
                          style={{ width: `${Math.max(pct, 0.5)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{src.hint}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Top UTMs — 3 colunas */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Top UTMs (leads + checkouts)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(
              [
                { title: "Source", rows: sources, empty: "Nenhuma utm_source registrada." },
                { title: "Medium", rows: mediums, empty: "Nenhum utm_medium registrado." },
                { title: "Campaign", rows: campaigns, empty: "Nenhuma utm_campaign registrada." },
              ] as const
            ).map((g) => (
              <div key={g.title} className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
                <h3 className="text-white font-semibold mb-3">{g.title}</h3>
                {g.rows.length === 0 ? (
                  <p className="text-xs text-gray-500">{g.empty}</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {g.rows.map((r) => (
                      <li key={r.value} className="flex items-center justify-between">
                        <code className="text-gray-300 text-xs truncate max-w-[70%]">
                          {r.value}
                        </code>
                        <span className="text-white font-semibold">{fmtNumber(r.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Lembrete: marque seus anúncios e e-mails com{" "}
            <code className="text-gray-300">?utm_source=meta&amp;utm_medium=ads&amp;utm_campaign=voyia-q2</code>{" "}
            para esses números virem ricos. Atribuição é{" "}
            <span className="text-white">first-touch</span> com cookie de 90 dias.
          </p>
        </section>
      </div>
    </main>
  );
}
