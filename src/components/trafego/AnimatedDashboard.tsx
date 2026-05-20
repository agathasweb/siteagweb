"use client";

import { useEffect, useState } from "react";

interface KPI {
  label: string;
  /** Valor final exibido (string formatada com "R$ 4.820"). */
  value: string;
  /** Variação destacada (ex: "↑ 12% vs. semana anterior"). */
  delta: string;
}

interface Props {
  title: string;
  period: string;
  kpis: readonly KPI[];
  chartLabel: string;
}

/** Extrai o número principal de uma string formatada (ex: "R$ 4.820" → 4820). */
function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Reaplica o template original ao novo número (preserva prefixo R$, sufixo x, vírgula etc). */
function formatLikeOriginal(original: string, n: number): string {
  // Detecta padrões comuns
  if (original.startsWith("R$")) {
    return `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
  }
  if (original.endsWith("x")) {
    return `${n.toFixed(1).replace(".", ",")}x`;
  }
  if (original.includes(",")) {
    return n.toFixed(2).replace(".", ",");
  }
  return Math.round(n).toString();
}

/**
 * Dashboard animado para a hero de tráfego pago. Loopa o ciclo:
 * 1. Conta números de 0 → valor final (1.4s)
 * 2. Pausa exibindo valores finais (3s)
 * 3. Barras do gráfico crescem em sequência (1.2s)
 * 4. Restart
 */
export default function AnimatedDashboard({ title, period, kpis, chartLabel }: Props) {
  // 0..1 — progresso da contagem dos KPIs
  const [progress, setProgress] = useState(0);
  // 0..bars.length — quantas barras já cresceram
  const [barsGrown, setBarsGrown] = useState(0);
  // ciclo atual (forçando re-render para reiniciar animações CSS)
  const [cycle, setCycle] = useState(0);

  const finalBars = [40, 55, 48, 65, 70, 82, 95];

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const countDuration = 1400;

    function tick(now: number) {
      if (cancelled) return;
      const elapsed = now - start;
      const t = Math.min(elapsed / countDuration, 1);
      // easeOutCubic — começa rápido, desacelera no fim (mais natural)
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);

    // Cresce barras uma por vez após contagem terminar
    const barTimers = finalBars.map((_, i) =>
      setTimeout(() => {
        if (!cancelled) setBarsGrown(i + 1);
      }, countDuration + 200 + i * 120),
    );

    // Reinicia ciclo 3s após barras terminarem
    const restart = setTimeout(() => {
      if (cancelled) return;
      setProgress(0);
      setBarsGrown(0);
      // Pequeno delay pro DOM aplicar reset antes de reanimar
      setTimeout(() => {
        if (!cancelled) setCycle((c) => c + 1);
      }, 60);
    }, countDuration + 200 + finalBars.length * 120 + 2800);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      barTimers.forEach(clearTimeout);
      clearTimeout(restart);
    };
  }, [cycle]);

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-3xl border border-blue-500/20 p-1 shadow-2xl">
      <div className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
          <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {title}
          </span>
          <span className="text-xs text-blue-400 font-mono">{period}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {kpis.map((kpi) => {
            const target = parseNumber(kpi.value);
            const displayed = target == null ? kpi.value : formatLikeOriginal(kpi.value, target * progress);
            return (
              <div
                key={kpi.label}
                className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 transition-all duration-300 hover:border-blue-500/40"
              >
                <div className="text-xs text-gray-400 mb-1">{kpi.label}</div>
                <div className="text-2xl font-bold text-white font-mono tabular-nums">{displayed}</div>
                <div
                  className={`text-xs font-semibold mt-1 transition-opacity duration-500 ${
                    progress > 0.85 ? "text-green-400 opacity-100" : "opacity-0"
                  }`}
                >
                  {kpi.delta}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <div className="text-xs text-gray-400 mb-3 flex justify-between">
            <span>{chartLabel}</span>
            <span
              className={`text-green-400 transition-opacity duration-500 ${
                barsGrown >= finalBars.length ? "opacity-100" : "opacity-0"
              }`}
            >
              ↑ tendência positiva
            </span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {finalBars.map((target, i) => {
              const grown = i < barsGrown;
              return (
                <div
                  key={`${cycle}-${i}`}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-700 ease-out"
                  style={{ height: grown ? `${target}%` : "4%" }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
