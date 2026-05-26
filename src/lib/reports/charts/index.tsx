/* eslint-disable jsx-a11y/alt-text */
import { View, Text, Svg, Line, Polyline, Rect, Circle, Path } from "@react-pdf/renderer";

/**
 * Componentes SVG reutilizáveis para os relatórios PDF.
 *
 * Todos usam @react-pdf/renderer (compatível com Svg primitivo). Paleta
 * alinhada com a identidade visual Agathas/Voyia.
 */

export const PALETTE = {
  primary: "#6d28d9",       // voyia-blue
  accent: "#22c55e",        // green-500
  warn: "#f59e0b",          // amber-500
  danger: "#ef4444",        // red-500
  gray: "#6b7280",
  grayLight: "#e5e7eb",
  textDark: "#111827",
  textMuted: "#6b7280",
  bgCard: "#f9fafb",
  bgGrid: "#e5e7eb",
  bgPage: "#ffffff",
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n).toString();
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

// ============================================================================
// LineChart — séries temporais
// ============================================================================

export function LineChart({
  data,
  width = 480,
  height = 160,
  color = PALETTE.primary,
  label,
  showArea = true,
}: {
  data: Array<{ x: string; y: number }>;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  showArea?: boolean;
}) {
  if (data.length === 0) {
    return (
      <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 10, color: PALETTE.textMuted }}>
          Sem dados de {label ?? "série"} no período.
        </Text>
      </View>
    );
  }

  const padding = { top: 12, right: 12, bottom: 22, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(...ys, 1);
  const minY = Math.min(...ys, 0);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pts = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - ((d.y - minY) / (maxY - minY || 1)) * innerH;
    return { x, y };
  });
  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `${polyPoints} ${padding.left + innerW},${padding.top + innerH} ${padding.left},${padding.top + innerH}`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const value = minY + (maxY - minY) * (1 - p);
    return { value, y: padding.top + innerH * p };
  });

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {/* Y axis grid */}
      {yTicks.map((t, i) => (
        <Line
          key={i}
          x1={padding.left}
          y1={t.y}
          x2={padding.left + innerW}
          y2={t.y}
          stroke={PALETTE.bgGrid}
          strokeWidth={0.5}
        />
      ))}
      {yTicks.map((t, i) => (
        <Text
          key={`t${i}`}
          x={padding.left - 4}
          y={t.y + 3}
          style={{ fontSize: 7, fill: PALETTE.textMuted, textAnchor: "end" }}
        >
          {fmtCompact(Math.round(t.value))}
        </Text>
      ))}

      {showArea && (
        <Polyline points={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
      )}
      <Polyline points={polyPoints} fill="none" stroke={color} strokeWidth={1.5} />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={1.5} fill={color} />
      ))}
      {data.length > 0 && (
        <>
          <Text
            x={padding.left}
            y={height - 6}
            style={{ fontSize: 7, fill: PALETTE.textMuted }}
          >
            {data[0].x}
          </Text>
          <Text
            x={padding.left + innerW}
            y={height - 6}
            style={{ fontSize: 7, fill: PALETTE.textMuted, textAnchor: "end" }}
          >
            {data[data.length - 1].x}
          </Text>
        </>
      )}
    </Svg>
  );
}

// ============================================================================
// BarChart — vertical bars
// ============================================================================

export function BarChart({
  data,
  width = 480,
  height = 160,
  color = PALETTE.primary,
}: {
  data: Array<{ x: string; y: number }>;
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;
  const padding = { top: 12, right: 12, bottom: 30, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const slotW = innerW / data.length;
  const barW = slotW * 0.6;

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {[0, 0.5, 1].map((p, i) => (
        <Line
          key={i}
          x1={padding.left}
          y1={padding.top + innerH * p}
          x2={padding.left + innerW}
          y2={padding.top + innerH * p}
          stroke={PALETTE.bgGrid}
          strokeWidth={0.5}
        />
      ))}
      {data.map((d, i) => {
        const h = (d.y / maxY) * innerH;
        const x = padding.left + slotW * i + (slotW - barW) / 2;
        const y = padding.top + innerH - h;
        return (
          <View key={i}>
            <Rect x={x} y={y} width={barW} height={h} fill={color} />
            <Text
              x={x + barW / 2}
              y={y - 3}
              style={{ fontSize: 7, fill: PALETTE.textDark, textAnchor: "middle" }}
            >
              {fmtCompact(d.y)}
            </Text>
            <Text
              x={x + barW / 2}
              y={padding.top + innerH + 10}
              style={{ fontSize: 7, fill: PALETTE.textMuted, textAnchor: "middle" }}
            >
              {d.x.length > 12 ? d.x.slice(0, 11) + "…" : d.x}
            </Text>
          </View>
        );
      })}
    </Svg>
  );
}

// ============================================================================
// HBars — horizontal bars (rankings)
// ============================================================================

export function HBars({
  data,
  width = 480,
  rowHeight = 18,
  color = PALETTE.primary,
}: {
  data: Array<{ name: string; value: number }>;
  width?: number;
  rowHeight?: number;
  color?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const labelW = 110;
  const valueW = 50;
  const barW = width - labelW - valueW - 16;

  return (
    <View>
      {data.map((d, i) => {
        const w = (d.value / max) * barW;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ width: labelW, fontSize: 8, color: PALETTE.textDark }}>
              {d.name.length > 18 ? d.name.slice(0, 17) + "…" : d.name}
            </Text>
            <View style={{ width: barW, height: rowHeight - 6, backgroundColor: PALETTE.grayLight, marginRight: 6 }}>
              <View style={{ width: w, height: "100%", backgroundColor: color }} />
            </View>
            <Text style={{ width: valueW, fontSize: 8, color: PALETTE.textDark, textAlign: "right" }}>
              {fmt(d.value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// DonutChart — distribuição percentual
// ============================================================================

export function DonutChart({
  data,
  size = 110,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  size?: number;
}) {
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 5;
  const innerR = r * 0.55;

  let acc = 0;
  const segments = data.map((d) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);
    return {
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`,
      color: d.color,
      pct: (d.value / total) * 100,
      name: d.name,
    };
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {segments.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
      </Svg>
      <View style={{ marginLeft: 12 }}>
        {segments.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            <View style={{ width: 8, height: 8, backgroundColor: s.color, marginRight: 6 }} />
            <Text style={{ fontSize: 8, color: PALETTE.textDark }}>
              {s.name}: {s.pct.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// FunnelChart — visualização do funil
// ============================================================================

export function FunnelChart({
  steps,
  width = 480,
}: {
  steps: Array<{ name: string; value: number }>;
  width?: number;
}) {
  if (steps.length === 0) return null;
  const max = Math.max(...steps.map((s) => s.value), 1);
  const colors = [PALETTE.primary, "#7c3aed", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff"];
  return (
    <View style={{ width }}>
      {steps.map((s, i) => {
        const w = (s.value / max) * width;
        const dropoff = i > 0 ? ((steps[i - 1].value - s.value) / Math.max(steps[i - 1].value, 1)) * 100 : 0;
        const conversion = i > 0 ? (s.value / Math.max(steps[i - 1].value, 1)) * 100 : 100;
        return (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 9, color: PALETTE.textDark, fontWeight: "bold" }}>
                {s.name}
              </Text>
              <Text style={{ fontSize: 9, color: PALETTE.textDark }}>
                {fmt(s.value)}{i > 0 && ` (${conversion.toFixed(1)}% da anterior)`}
              </Text>
            </View>
            <View style={{ height: 16, backgroundColor: PALETTE.grayLight }}>
              <View style={{ width: w, height: "100%", backgroundColor: colors[i % colors.length] }} />
            </View>
            {i > 0 && dropoff > 0 && (
              <Text style={{ fontSize: 7, color: PALETTE.danger, marginTop: 1 }}>
                Drop-off: −{dropoff.toFixed(1)}%
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// Heatmap — dia da semana × hora
// ============================================================================

export function Heatmap({
  cells,
  width = 480,
}: {
  cells: Array<{ weekday: number; hour: number; avg_engagement: number; count: number }>;
  width?: number;
}) {
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const cellW = (width - 30) / 24;
  const cellH = 14;
  const max = Math.max(...cells.map((c) => c.avg_engagement), 1);

  function colorFor(v: number): string {
    if (v === 0) return PALETTE.grayLight;
    const intensity = Math.min(v / max, 1);
    // gradient from light purple to deep purple
    const r = Math.round(229 - intensity * (229 - 109));
    const g = Math.round(213 - intensity * (213 - 40));
    const b = Math.round(255 - intensity * (255 - 217));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <View>
      {/* Hour labels (top) */}
      <View style={{ flexDirection: "row", marginBottom: 2, marginLeft: 18 }}>
        {[0, 6, 12, 18, 23].map((h) => (
          <Text
            key={h}
            style={{ fontSize: 6, color: PALETTE.textMuted, position: "absolute", left: 18 + h * cellW }}
          >
            {String(h).padStart(2, "0")}h
          </Text>
        ))}
      </View>
      <View style={{ marginTop: 8 }}>
        {[1, 2, 3, 4, 5, 6, 0].map((w, rowIdx) => (
          <View key={w} style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
            <Text style={{ width: 18, fontSize: 7, color: PALETTE.textMuted }}>{dayLabels[w]}</Text>
            {Array.from({ length: 24 }, (_, h) => {
              const c = cells.find((c) => c.weekday === w && c.hour === h);
              const v = c?.avg_engagement ?? 0;
              return (
                <View
                  key={h}
                  style={{
                    width: cellW - 0.5,
                    height: cellH,
                    backgroundColor: colorFor(v),
                    marginRight: 0.5,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// KPICard — usado nos cabeçalhos de seções
// ============================================================================

export function KPICard({
  label,
  value,
  sub,
  delta,
  color = PALETTE.primary,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: number; positiveIsGood?: boolean };
  color?: string;
}) {
  const isPositive = delta ? delta.value >= 0 : false;
  const positiveIsGood = delta?.positiveIsGood ?? true;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return (
    <View
      style={{
        padding: 8,
        backgroundColor: PALETTE.bgCard,
        borderRadius: 4,
        borderLeft: `3 solid ${color}`,
        flex: 1,
        marginRight: 6,
      }}
    >
      <Text style={{ fontSize: 7, color: PALETTE.textMuted, textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "bold", color: PALETTE.textDark }}>
        {value}
      </Text>
      {(sub || delta) && (
        <View style={{ flexDirection: "row", marginTop: 2 }}>
          {sub && (
            <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>{sub}</Text>
          )}
          {delta && (
            <Text
              style={{
                fontSize: 7,
                color: isGood ? PALETTE.accent : PALETTE.danger,
                marginLeft: sub ? 6 : 0,
              }}
            >
              {isPositive ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
