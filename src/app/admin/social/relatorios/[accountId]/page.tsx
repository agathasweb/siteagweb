import Link from "next/link";
import { notFound } from "next/navigation";
import { getSocialAccount, listSocialAccounts } from "@/lib/db/social-accounts";
import { listDailyInsights, listAudience } from "@/lib/db/social-insights";
import { topPublishedPostsByEngagement } from "@/lib/db/social-published";

export const metadata = {
  title: "Relatórios | Social | Painel Admin",
  robots: { index: false, follow: false },
};

type Period = "7d" | "30d" | "90d";

function isPeriod(v: string | undefined): v is Period {
  return v === "7d" || v === "30d" || v === "90d";
}

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };
const PERIOD_LABEL: Record<Period, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtCompact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// ----- Gráfico de linha SVG puro -----
function LineChart({
  data,
  width = 800,
  height = 200,
  color = "#3b82f6",
  label,
}: {
  data: Array<{ x: string; y: number }>;
  width?: number;
  height?: number;
  color?: string;
  label: string;
}) {
  if (data.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-8 text-center">
        Sem dados de {label} no período.
      </div>
    );
  }
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(...ys, 1);
  const minY = Math.min(...ys, 0);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - ((d.y - minY) / (maxY - minY || 1)) * innerH;
    return `${x},${y}`;
  });

  // Eixo Y — 4 ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const value = minY + ((maxY - minY) * i) / ticks;
    const y = padding.top + innerH - (i / ticks) * innerH;
    return { value, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={t.y}
            x2={padding.left + innerW}
            y2={t.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={t.y + 3}
            textAnchor="end"
            fill="#6b7280"
            fontSize="10"
          >
            {fmtCompact(Math.round(t.value))}
          </text>
        </g>
      ))}
      {/* Linha */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(" ")}
      />
      {/* Pontos */}
      {data.map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + innerH - ((d.y - minY) / (maxY - minY || 1)) * innerH;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={color}>
            <title>{d.x}: {fmt(d.y)}</title>
          </circle>
        );
      })}
      {/* Eixo X (primeira e última data) */}
      {data.length > 0 && (
        <>
          <text x={padding.left} y={height - 8} fill="#6b7280" fontSize="10">{data[0].x}</text>
          <text x={padding.left + innerW} y={height - 8} fill="#6b7280" fontSize="10" textAnchor="end">{data[data.length - 1].x}</text>
        </>
      )}
    </svg>
  );
}

// ----- Barras horizontais -----
function HBars({
  data,
  label,
  max,
}: {
  data: Array<{ name: string; value: number }>;
  label: string;
  max?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-4 text-center">
        Sem {label} ainda. Aguarde o próximo sync.
      </div>
    );
  }
  const m = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = (d.value / m) * 100;
        return (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-1/3 text-gray-300 truncate" title={d.name}>{d.name}</div>
            <div className="flex-1 bg-black/40 rounded h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-voyia-blue to-green-500"
                style={{ width: `${Math.max(pct, 0.5)}%` }}
              />
            </div>
            <div className="w-12 text-right text-gray-300">{fmt(d.value)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default async function RelatorioContaPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { accountId } = await params;
  const sp = await searchParams;
  const id = Number(accountId);
  if (!Number.isFinite(id)) notFound();
  const account = getSocialAccount(id);
  if (!account) notFound();

  const rawPeriod = typeof sp.period === "string" ? sp.period : "30d";
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : "30d";
  const days = PERIOD_DAYS[period];

  const insights = listDailyInsights(id, days);
  const topPosts = topPublishedPostsByEngagement(id, days, 10);
  const audienceGenderAge = listAudience(id, "gender_age");
  const audienceCity = listAudience(id, "city");
  const audienceCountry = listAudience(id, "country");

  const allAccounts = listSocialAccounts();

  // Pontos pros gráficos
  const followersSeries = insights.map((i) => ({ x: i.date.slice(5), y: i.followers_count }));
  const reachSeries = insights.map((i) => ({ x: i.date.slice(5), y: i.reach }));
  const profileViewsSeries = insights.map((i) => ({ x: i.date.slice(5), y: i.profile_views }));

  const totalDelta = insights.reduce((sum, i) => sum + (i.follower_count_delta ?? 0), 0);
  const totalReach = insights.reduce((sum, i) => sum + i.reach, 0);
  const totalProfileViews = insights.reduce((sum, i) => sum + i.profile_views, 0);

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              {account.profile_picture_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={account.profile_picture_url} alt="" className="w-8 h-8 rounded-full" />
              )}
              @{account.username}
              <span className="text-gray-400 font-normal text-sm">— {account.display_name}</span>
            </h1>
          </div>
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <Link
                key={p}
                href={`?period=${p}`}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  period === p ? "bg-voyia-blue text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {PERIOD_LABEL[p]}
              </Link>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/social/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <Link href="/admin/social/agendar" className="text-gray-400 hover:text-white">Agendar</Link>
          <Link href="/admin/social/agendamentos" className="text-gray-400 hover:text-white">Agendamentos</Link>
          <Link href="/admin/social/biblioteca" className="text-gray-400 hover:text-white">Biblioteca</Link>
          <span className="text-voyia-blue font-semibold">Relatórios @{account.username}</span>
        </div>
        {allAccounts.length > 1 && (
          <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-2 text-xs">
            <span className="text-gray-500">Outras contas:</span>
            {allAccounts.filter((a) => a.id !== account.id).map((a) => (
              <Link key={a.id} href={`/admin/social/relatorios/${a.id}?period=${period}`} className="text-voyia-blue hover:underline">
                @{a.username}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Cards de resumo */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Seguidores</div>
            <div className="text-3xl font-bold text-white">{fmt(account.followers_count)}</div>
            {totalDelta !== 0 && (
              <div className={`text-xs mt-1 ${totalDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                {totalDelta > 0 ? "+" : ""}{totalDelta} no período
              </div>
            )}
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Alcance total</div>
            <div className="text-3xl font-bold text-blue-300">{fmt(totalReach)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Visitas ao perfil</div>
            <div className="text-3xl font-bold text-purple-300">{fmt(totalProfileViews)}</div>
          </div>
          <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Posts no período</div>
            <div className="text-3xl font-bold text-green-300">{topPosts.length}</div>
          </div>
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Seguidores</h3>
            <LineChart data={followersSeries} color="#3b82f6" label="seguidores" />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Alcance diário</h3>
            <LineChart data={reachSeries} color="#22c55e" label="alcance" />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5 lg:col-span-2">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Visitas ao perfil</h3>
            <LineChart data={profileViewsSeries} color="#a855f7" label="visitas" />
          </div>
        </section>

        {/* Top posts */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Top 10 posts por engajamento
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            {topPosts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Sem posts no período. Aguarde o sync ou publique conteúdo.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Preview</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Legenda</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">❤️</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">💬</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">👁️</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">📡 Reach</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">⚡ Engaj.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {topPosts.map((p, i) => (
                    <tr key={p.id} className="hover:bg-black/20">
                      <td className="px-4 py-2 text-gray-400 font-bold">{i + 1}</td>
                      <td className="px-4 py-2">
                        {p.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-800" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-300 text-xs">{p.type}</td>
                      <td className="px-4 py-2 text-gray-300 text-xs truncate max-w-[200px]">
                        <a href={p.permalink ?? "#"} target="_blank" rel="noopener noreferrer" className="hover:text-voyia-blue">
                          {p.caption?.slice(0, 50) || "(sem legenda)"}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right text-white">{fmt(p.likes)}</td>
                      <td className="px-4 py-2 text-right text-white">{fmt(p.comments)}</td>
                      <td className="px-4 py-2 text-right text-white">{fmt(p.views)}</td>
                      <td className="px-4 py-2 text-right text-blue-300">{fmt(p.reach)}</td>
                      <td className="px-4 py-2 text-right text-green-300 font-semibold">{fmt(p.engagement_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Demografia */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Gênero & Idade</h3>
            <HBars
              data={audienceGenderAge.map((a) => ({ name: a.bucket, value: a.value }))}
              label="demografia"
            />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Top cidades</h3>
            <HBars
              data={audienceCity.slice(0, 10).map((a) => ({ name: a.bucket, value: a.value }))}
              label="cidades"
            />
          </div>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Top países</h3>
            <HBars
              data={audienceCountry.slice(0, 10).map((a) => ({ name: a.bucket, value: a.value }))}
              label="países"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
