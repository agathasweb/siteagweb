/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AdsReportData } from "../data-ads";
import { PALETTE, LineChart, FunnelChart, HBars, DonutChart } from "../charts";

/**
 * Relatório Ads — modelo validado (port do yeshua-dev meta-ads-pdf-v2).
 *
 * KPI cards coloridos (azul/verde/roxo/ciano), tabelas com badges,
 * box dedicado de ROAS REAL cruzando Meta + ASAAS.
 */

const styles = StyleSheet.create({
  page: { padding: 24, paddingBottom: 36, fontSize: 9, color: PALETTE.textDark, backgroundColor: "#ffffff" },
  headerBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `1 solid ${PALETTE.grayLight}` },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: PALETTE.textDark },
  headerSubtitle: { fontSize: 10, color: PALETTE.textMuted, marginTop: 2 },
  headerRight: { textAlign: "right" },
  headerLabel: { fontSize: 7, color: PALETTE.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  headerPeriod: { fontSize: 11, fontWeight: "bold", color: PALETTE.textDark, marginTop: 1 },
  headerAccount: { fontSize: 10, color: "#2563eb", fontWeight: "bold", marginTop: 4 },
  headerGenAt: { fontSize: 7, color: PALETTE.textMuted, marginTop: 2 },
  h3: { fontSize: 12, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6, paddingBottom: 4, borderBottom: `1 solid ${PALETTE.grayLight}` },
  kpiRow: { flexDirection: "row", marginBottom: 6, gap: 6 },
  kpiCard: { flex: 1, padding: 10, borderRadius: 5, border: "1 solid" },
  kpiLabel: { fontSize: 7, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: "bold", color: PALETTE.textDark },
  kpiValueSm: { fontSize: 14, fontWeight: "bold", color: PALETTE.textDark },
  kpiSub: { fontSize: 7, color: PALETTE.textMuted, marginTop: 2 },
  roasBox: { backgroundColor: "#fffbeb", borderLeft: `3 solid #d97706`, borderRadius: 5, padding: 12, marginBottom: 12 },
  roasLabel: { fontSize: 8, color: "#d97706", textTransform: "uppercase", fontWeight: "bold", letterSpacing: 1, marginBottom: 5 },
  chartBox: { border: `1 solid ${PALETTE.grayLight}`, borderRadius: 6, padding: 10, marginBottom: 14 },
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${PALETTE.grayLight}`, paddingVertical: 4 },
  trHead: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 5, paddingHorizontal: 4 },
  th: { fontSize: 7, fontWeight: "bold", color: PALETTE.textMuted, textTransform: "uppercase", paddingHorizontal: 4 },
  td: { fontSize: 8, color: "#374151", paddingHorizontal: 4 },
  badge: { fontSize: 7, fontWeight: "bold", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  rec: { flexDirection: "row", marginBottom: 5, padding: 6, backgroundColor: "#eff6ff", borderLeft: `2 solid #2563eb`, borderRadius: 3 },
  recNum: { width: 14, fontSize: 9, fontWeight: "bold", color: "#2563eb" },
  recText: { flex: 1, fontSize: 8, lineHeight: 1.4, color: PALETTE.textDark },
  footer: { position: "absolute", bottom: 14, left: 24, right: 24, fontSize: 6, color: PALETTE.textMuted, textAlign: "center", paddingTop: 5, borderTop: `0.5 solid ${PALETTE.grayLight}` },
});

const KPI_COLORS = {
  blue: { bg: "#eff6ff", border: "#dbeafe", label: "#2563eb" },
  green: { bg: "#f0fdf4", border: "#dcfce7", label: "#16a34a" },
  purple: { bg: "#faf5ff", border: "#f3e8ff", label: "#9333ea" },
  cyan: { bg: "#ecfeff", border: "#cffafe", label: "#0891b2" },
  amber: { bg: "#fffbeb", border: "#fef3c7", label: "#d97706" },
  red: { bg: "#fef2f2", border: "#fecaca", label: "#dc2626" },
  gray: { bg: "#f9fafb", border: "#e5e7eb", label: "#4b5563" },
};

function KpiCard({
  label, value, sub, color = "gray", small = false,
}: {
  label: string; value: string; sub?: string; color?: keyof typeof KPI_COLORS; small?: boolean;
}) {
  const c = KPI_COLORS[color];
  return (
    <View style={[styles.kpiCard, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.kpiLabel, { color: c.label }]}>{label}</Text>
      <Text style={small ? styles.kpiValueSm : styles.kpiValue}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_ENGAGEMENT: "Engaj.", OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas", OUTCOME_AWARENESS: "Alcance", OUTCOME_APP_PROMOTION: "App",
};

const STATUS_BG: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#dcfce7", color: "#16a34a" },
  PAUSED: { bg: "#f3f4f6", color: "#4b5563" },
  ARCHIVED: { bg: "#f3f4f6", color: "#9ca3af" },
  DELETED: { bg: "#fee2e2", color: "#dc2626" },
};

function fmtBR(n: number): string { return n.toLocaleString("pt-BR"); }
function fmtBRL(n: number): string { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function AdsReportDocument({ data }: { data: AdsReportData }) {
  const { accounts, scope, account, period, kpis, dailySpend, campaigns, funnel, topAds, demographics, recommendations } = data;
  const scopeLabel = scope === "single" ? (account?.name ?? "?") : `Todas as contas (${accounts.length})`;

  const hasDailySpend = dailySpend.length > 0 && dailySpend.some((d) => d.spent > 0);
  const hasCampaigns = campaigns.length > 0;
  const hasFunnel = funnel.impressions > 0 || funnel.clicks > 0 || funnel.subscribes > 0;
  const hasTopAds = topAds.length > 0;
  const hasDemographics =
    demographics.age.length > 0 ||
    demographics.gender.length > 0 ||
    demographics.region.length > 0 ||
    demographics.platform.length > 0;

  const GENDER_COLORS = ["#2563eb", "#ec4899", "#9ca3af", "#06b6d4"];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.headerTitle}>Relatório de Desempenho</Text>
            <Text style={styles.headerSubtitle}>Meta Ads (Facebook + Instagram)</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Período Analisado</Text>
            <Text style={styles.headerPeriod}>
              {new Date(period.since).toLocaleDateString("pt-BR")} a{" "}
              {new Date(period.until).toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.headerGenAt}>Gerado em {new Date().toLocaleString("pt-BR")}</Text>
            <Text style={styles.headerAccount}>{scopeLabel}</Text>
          </View>
        </View>

        {/* ROAS REAL EM DESTAQUE */}
        <View style={styles.roasBox}>
          <Text style={styles.roasLabel}>ROAS Real — cruzamento Meta + ASAAS</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Gasto Meta</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>R$ {fmtBRL(kpis.total_spent)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Receita confirmada</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#16a34a" }}>R$ {fmtBRL(kpis.real_revenue)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>ROAS</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: kpis.real_roas >= 1 ? "#16a34a" : "#dc2626" }}>
                {kpis.real_roas.toFixed(2)}x
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Conversões</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{fmtBR(kpis.total_conversions)}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 6, color: PALETTE.textMuted, marginTop: 4, fontStyle: "italic" }}>
            Receita inclui apenas subscriptions confirmadas atribuídas a Meta via fbclid ou utm_source.
          </Text>
        </View>

        {/* KPIs principais (4 cards coloridos) */}
        <View style={styles.kpiRow}>
          <KpiCard label="Investimento" value={`R$ ${fmtBRL(kpis.total_spent)}`} color="blue" />
          <KpiCard label="Impressões" value={fmtBR(kpis.total_impressions)} color="purple" />
          <KpiCard label="Cliques" value={fmtBR(kpis.total_clicks)} sub={`CTR ${kpis.ctr.toFixed(2)}%`} color="green" />
          <KpiCard label="CPC médio" value={`R$ ${fmtBRL(kpis.cpc)}`} sub={`CPM R$ ${fmtBRL(kpis.cpm)}`} color="cyan" />
        </View>
        <View style={[styles.kpiRow, { marginBottom: 14 }]}>
          <KpiCard label="CPA" value={kpis.cpa > 0 ? `R$ ${fmtBRL(kpis.cpa)}` : "—"} sub="Custo por conversão" color="amber" small />
          <KpiCard label="Alcance" value={fmtBR(kpis.reach)} sub={`Freq. ${kpis.frequency.toFixed(2)}x`} color="purple" small />
          <KpiCard label="Conv. Meta" value={fmtBR(kpis.reported_conversions)} sub="Reportadas Pixel" color="gray" small />
          <KpiCard
            label="Campanhas"
            value={fmtBR(campaigns.length)}
            sub={`${campaigns.filter((c) => c.status === "ACTIVE").length} ativas`}
            color="gray"
            small
          />
        </View>

        {/* GASTO DIÁRIO */}
        {hasDailySpend && (
          <View style={styles.chartBox} wrap={false}>
            <Text style={styles.h3}>Investimento Diário</Text>
            <LineChart
              data={dailySpend.map((d) => ({ x: d.date.slice(5), y: d.spent }))}
              color="#d97706"
              label="gasto"
              showArea={true}
            />
          </View>
        )}

        {hasDailySpend && (
          <View style={styles.chartBox} wrap={false}>
            <Text style={styles.h3}>Cliques Diários</Text>
            <LineChart
              data={dailySpend.map((d) => ({ x: d.date.slice(5), y: d.clicks }))}
              color="#2563eb"
              label="cliques"
              showArea={true}
            />
          </View>
        )}

        {/* TABELA DE CAMPANHAS */}
        {hasCampaigns && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={styles.h3}>Performance por Campanha</Text>
            <View>
              <View style={styles.trHead}>
                <Text style={[styles.th, { width: 130 }]}>Nome</Text>
                <Text style={[styles.th, { width: 50 }]}>Objetivo</Text>
                <Text style={[styles.th, { width: 50 }]}>Status</Text>
                <Text style={[styles.th, { width: 60, textAlign: "right" }]}>Gasto</Text>
                <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Cap</Text>
                <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Impr.</Text>
                <Text style={[styles.th, { width: 40, textAlign: "right" }]}>Cliques</Text>
                <Text style={[styles.th, { width: 35, textAlign: "right" }]}>CTR</Text>
                <Text style={[styles.th, { width: 45, textAlign: "right" }]}>CPC</Text>
                <Text style={[styles.th, { width: 35, textAlign: "right" }]}>Conv.</Text>
              </View>
              {campaigns.slice(0, 25).map((c) => {
                const sb = STATUS_BG[c.status] ?? STATUS_BG.PAUSED;
                return (
                  <View key={c.id} style={styles.tr}>
                    <Text style={[styles.td, { width: 130 }]}>{c.name.slice(0, 28)}</Text>
                    <Text style={[styles.td, { width: 50 }]}>{OBJECTIVE_LABEL[c.objective] ?? c.objective.slice(0, 8)}</Text>
                    <View style={{ width: 50 }}>
                      <View style={[styles.badge, { backgroundColor: sb.bg, alignSelf: "flex-start" }]}>
                        <Text style={{ fontSize: 6, color: sb.color, fontWeight: "bold" }}>{c.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: 60, textAlign: "right" }]}>R$ {fmtBRL(c.spent_brl)}</Text>
                    <Text style={[styles.td, { width: 50, textAlign: "right", color: PALETTE.textMuted }]}>R$ {fmtBRL(c.spend_cap_brl)}</Text>
                    <Text style={[styles.td, { width: 50, textAlign: "right" }]}>{fmtBR(c.impressions)}</Text>
                    <Text style={[styles.td, { width: 40, textAlign: "right" }]}>{fmtBR(c.clicks)}</Text>
                    <Text style={[styles.td, { width: 35, textAlign: "right" }]}>{c.ctr.toFixed(1)}%</Text>
                    <Text style={[styles.td, { width: 45, textAlign: "right" }]}>R$ {fmtBRL(c.cpc_brl)}</Text>
                    <Text style={[styles.td, { width: 35, textAlign: "right", color: "#16a34a", fontWeight: "bold" }]}>{fmtBR(c.conversions)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* FUNIL */}
        {hasFunnel && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={styles.h3}>Funil de Conversão Completo</Text>
            <Text style={{ fontSize: 7, color: PALETTE.textMuted, marginBottom: 8 }}>
              Da impressão à venda confirmada. Drop-off em cada etapa mostra onde otimizar.
            </Text>
            <FunnelChart
              steps={[
                { name: "Impressões", value: funnel.impressions },
                { name: "Cliques", value: funnel.clicks },
                { name: "Visitas no site (Pixel)", value: funnel.page_views },
                { name: "Leads capturados", value: funnel.leads },
                { name: "Checkouts iniciados", value: funnel.initiate_checkout },
                { name: "Assinaturas confirmadas", value: funnel.subscribes },
              ]}
            />
          </View>
        )}

        {/* DEMOGRAFIA & LOCALIZAÇÃO */}
        {hasDemographics && (
          <View break>
            <Text style={styles.h3}>Público & Localização</Text>
            <Text style={{ fontSize: 7, color: PALETTE.textMuted, marginBottom: 8 }}>
              Quem viu e clicou nos anúncios — base para refinar a segmentação. Valores em visualizações (impressões).
            </Text>

            {/* Idade + Gênero lado a lado */}
            <View style={{ flexDirection: "row", gap: 14, marginBottom: 12 }}>
              {demographics.age.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6 }}>Faixa etária</Text>
                  <HBars data={demographics.age.map((a) => ({ name: a.bucket, value: a.value }))} width={250} color="#2563eb" />
                </View>
              )}
              {demographics.gender.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6 }}>Gênero</Text>
                  <DonutChart
                    data={demographics.gender.map((g, i) => ({ name: g.bucket, value: g.value, color: GENDER_COLORS[i % GENDER_COLORS.length] }))}
                  />
                </View>
              )}
            </View>

            {/* Localização (regiões) */}
            {demographics.region.length > 0 && (
              <View style={{ marginBottom: 12 }} wrap={false}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6 }}>Localização — Top regiões</Text>
                <HBars data={demographics.region.map((r) => ({ name: r.bucket, value: r.value }))} width={510} color="#16a34a" />
              </View>
            )}

            {/* Plataforma + Dispositivo lado a lado */}
            <View style={{ flexDirection: "row", gap: 14 }}>
              {demographics.platform.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6 }}>Plataforma</Text>
                  <HBars data={demographics.platform.map((p) => ({ name: p.bucket, value: p.value }))} width={250} color="#9333ea" />
                </View>
              )}
              {demographics.device.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6 }}>Dispositivo</Text>
                  <HBars data={demographics.device.map((d) => ({ name: d.bucket, value: d.value }))} width={250} color="#0891b2" />
                </View>
              )}
            </View>
          </View>
        )}

        {/* TOP CAMPANHAS POR ROAS */}
        {hasTopAds && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={styles.h3}>Top Campanhas por ROAS</Text>
            <Text style={{ fontSize: 7, color: PALETTE.textMuted, marginBottom: 6 }}>
              ROAS estimado por distribuição proporcional ao gasto.
            </Text>
            <View>
              <View style={styles.trHead}>
                <Text style={[styles.th, { flex: 3 }]}>Campanha</Text>
                <Text style={[styles.th, { width: 70, textAlign: "right" }]}>Gasto</Text>
                <Text style={[styles.th, { width: 70, textAlign: "right" }]}>Conv. Meta</Text>
                <Text style={[styles.th, { width: 70, textAlign: "right" }]}>ROAS est.</Text>
              </View>
              {topAds.map((a, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 3 }]}>{a.campaign.slice(0, 55)}</Text>
                  <Text style={[styles.td, { width: 70, textAlign: "right" }]}>R$ {fmtBRL(a.spent)}</Text>
                  <Text style={[styles.td, { width: 70, textAlign: "right" }]}>{fmtBR(a.conversions)}</Text>
                  <Text style={[styles.td, { width: 70, textAlign: "right", fontWeight: "bold", color: a.roas >= 1 ? "#16a34a" : "#dc2626" }]}>
                    {a.roas.toFixed(2)}x
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* RECOMENDAÇÕES */}
        {recommendations.length > 0 && (
          <View style={{ marginTop: 4 }} wrap={false}>
            <Text style={styles.h3}>Insights & Recomendações</Text>
            {recommendations.map((r, i) => (
              <View key={i} style={styles.rec}>
                <Text style={styles.recNum}>{i + 1}.</Text>
                <Text style={styles.recText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          Relatório gerado a partir do Meta Marketing API consolidado com Pixel + CAPI + ASAAS · agathasweb.com
        </Text>
      </Page>
    </Document>
  );
}
