import Link from "next/link";
import {
  listRecentCapiLogs,
  capiCountsByEvent,
  type CapiLogRow,
} from "@/lib/db/capi-log";
import { periodToDays, type Period } from "@/lib/db/analytics";
import RetryButton from "./RetryButton";

export const metadata = {
  title: "Health CAPI | Analytics | Painel Admin",
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

function fmtDate(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const STATUS_STYLE: Record<CapiLogRow["status"], string> = {
  sent: "bg-green-900/40 text-green-200 border-green-500/40",
  failed: "bg-red-900/40 text-red-200 border-red-500/40",
  retry_pending: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40",
};

const STATUS_LABEL: Record<CapiLogRow["status"], string> = {
  sent: "Enviado",
  failed: "Falhou",
  retry_pending: "Aguardando retry",
};

export default async function CapiLogPage({
  searchParams,
}: PageProps<"/admin/analytics/capi-log">) {
  const sp = await searchParams;
  const rawPeriod = typeof sp.period === "string" ? sp.period : "7d";
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : "7d";
  const days = periodToDays(period);

  const counts = capiCountsByEvent(days);
  const recent = listRecentCapiLogs(100);

  const total = counts.reduce((a, b) => a + b.total, 0);
  const sent = counts.reduce((a, b) => a + b.sent, 0);
  const failed = counts.reduce((a, b) => a + b.failed, 0);
  const pending = counts.reduce((a, b) => a + b.retry_pending, 0);
  const successRate = total === 0 ? 1 : sent / total;

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/admin/analytics" className="text-xs text-gray-400 hover:text-white">
              ← Voltar à visão geral
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Health Meta CAPI</h1>
          </div>
          <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
            {(["today", "7d", "30d"] as const).map((p) => (
              <Link
                key={p}
                href={`/admin/analytics/capi-log?period=${p}`}
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
          <Link
            href={`/admin/analytics/attribution?period=${period}`}
            className="text-gray-400 hover:text-white"
          >
            Atribuição
          </Link>
          <span className="text-voyia-blue font-semibold">Health CAPI</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Resumo */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Total enviado</div>
              <div className="text-3xl font-bold text-white">{total}</div>
            </div>
            <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Sucesso</div>
              <div className="text-3xl font-bold text-green-400">{sent}</div>
            </div>
            <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Falhas / pendentes</div>
              <div className="text-3xl font-bold text-red-400">
                {failed}
                {pending > 0 && (
                  <span className="text-sm text-yellow-400 ml-2">+{pending} pend.</span>
                )}
              </div>
            </div>
            <div className="bg-voyia-gray rounded-xl p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Taxa de sucesso</div>
              <div
                className={`text-3xl font-bold ${
                  successRate >= 0.95
                    ? "text-green-400"
                    : successRate >= 0.8
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {(successRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </section>

        {/* Contagem por evento + retry button */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
              Eventos enviados — {PERIOD_LABELS[period]}
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left pb-2">Evento</th>
                  <th className="text-right pb-2">Total</th>
                  <th className="text-right pb-2">Sucesso</th>
                  <th className="text-right pb-2">Falhou</th>
                  <th className="text-right pb-2">Pendente</th>
                </tr>
              </thead>
              <tbody>
                {counts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-4 text-sm">Sem eventos no período.</td></tr>
                ) : (
                  counts.map((c) => (
                    <tr key={c.event_name} className="border-t border-gray-800">
                      <td className="py-2 text-white font-medium">{c.event_name}</td>
                      <td className="py-2 text-right text-gray-300">{c.total}</td>
                      <td className="py-2 text-right text-green-300">{c.sent}</td>
                      <td className="py-2 text-right text-red-300">{c.failed || "—"}</td>
                      <td className="py-2 text-right text-yellow-300">{c.retry_pending || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-voyia-gray rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
              Ações
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Retentar agora reenvia todos os eventos com status <code>failed</code> ou{" "}
              <code>retry_pending</code> das últimas 24h (máx. 3 tentativas) e
              remove logs &gt; 90 dias.
            </p>
            <RetryButton />
            <div className="mt-6 pt-4 border-t border-gray-800">
              <h4 className="text-xs uppercase text-gray-500 mb-2">Cron externo recomendado</h4>
              <code className="text-[10px] text-gray-400 block bg-black/40 p-2 rounded break-all">
                GET /api/cron/meta-retry<br/>
                Authorization: Bearer $CRON_SECRET
              </code>
              <p className="text-[10px] text-gray-500 mt-1">A cada 15min</p>
            </div>
          </div>
        </section>

        {/* Tabela log recente */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
            Últimos 100 disparos
          </h2>
          <div className="bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Quando</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Evento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">HTTP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">fbtrace_id</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Erro</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Try</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500 text-sm">
                        Sem registros ainda. Eventos aparecerão aqui assim que disparados.
                      </td>
                    </tr>
                  ) : (
                    recent.map((r) => (
                      <tr key={r.id} className="hover:bg-black/20">
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">{fmtDate(r.created_at)}</td>
                        <td className="px-4 py-2.5 text-white font-medium text-xs">
                          {r.event_name}
                          {r.test_mode === 1 && (
                            <span className="ml-1 text-[10px] text-yellow-400">[TEST]</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${STATUS_STYLE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{r.http_status ?? "—"}</td>
                        <td className="px-4 py-2.5 text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                          {r.fbtrace_id ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-300 truncate max-w-[200px]">
                          {r.error ?? ""}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-gray-400">{r.attempts}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
