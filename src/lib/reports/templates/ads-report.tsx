/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AdsReportData } from "../data-ads";
import {
  PALETTE,
  KPICard,
  LineChart,
  FunnelChart,
  HBars,
} from "../charts";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bgPage,
    padding: 30,
    fontSize: 9,
    color: PALETTE.textDark,
  },
  cover: {
    backgroundColor: "#0a0a0a",
    padding: 0,
  },
  coverInner: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 40,
  },
  coverTag: {
    fontSize: 9,
    color: "#fbbf24",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#a1a1aa",
    marginBottom: 24,
  },
  coverMeta: {
    fontSize: 10,
    color: "#d4d4d8",
    marginTop: 4,
  },
  coverBrand: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brandLogo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  brandTag: {
    fontSize: 8,
    color: "#a1a1aa",
  },
  h1: {
    fontSize: 14,
    fontWeight: "bold",
    color: PALETTE.textDark,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: `1 solid ${PALETTE.grayLight}`,
  },
  h2: {
    fontSize: 10,
    fontWeight: "bold",
    color: PALETTE.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  table: {
    borderTop: `1 solid ${PALETTE.grayLight}`,
  },
  tr: {
    flexDirection: "row",
    borderBottom: `1 solid ${PALETTE.grayLight}`,
    paddingVertical: 4,
  },
  th: {
    fontSize: 7,
    color: PALETTE.textMuted,
    textTransform: "uppercase",
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  td: {
    fontSize: 8,
    color: PALETTE.textDark,
    paddingHorizontal: 4,
  },
  pageFooter: {
    position: "absolute",
    bottom: 14,
    left: 30,
    right: 30,
    fontSize: 7,
    color: PALETTE.textMuted,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTop: `0.5 solid ${PALETTE.grayLight}`,
  },
  recItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  recBullet: {
    width: 12,
    fontSize: 10,
    color: PALETTE.warn,
  },
  recText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
    color: PALETTE.textDark,
  },
  roasBox: {
    backgroundColor: "#fef3c7",
    borderLeft: `3 solid ${PALETTE.warn}`,
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
});

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ARCHIVED: "Arquivada",
  DELETED: "Deletada",
};

function fmtBR(n: number): string { return n.toLocaleString("pt-BR"); }
function fmtBRL(n: number): string { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function PageFooter({ pageLabel, scope }: { pageLabel: string; scope: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Agathas Web · Relatório de Tráfego Pago · {scope}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      <Text>{pageLabel}</Text>
    </View>
  );
}

export function AdsReportDocument({ data }: { data: AdsReportData }) {
  const { accounts, scope, account, period, kpis, dailySpend, campaigns, funnel, topAds, recommendations } = data;
  const scopeLabel = scope === "single" ? (account?.name ?? "?") : `Todas as contas (${accounts.length})`;

  const hasDailySpend = dailySpend.length > 0 && dailySpend.some((d) => d.spent > 0);
  const hasCampaigns = campaigns.length > 0;
  const hasFunnel = funnel.impressions > 0 || funnel.clicks > 0 || funnel.subscribes > 0;
  const hasTopAds = topAds.length > 0;

  return (
    <Document>
      {/* ===== Cover ===== */}
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={styles.coverInner}>
          <Text style={styles.coverTag}>Relatório de Tráfego Pago</Text>
          <Text style={styles.coverTitle}>{scopeLabel}</Text>
          <Text style={styles.coverSubtitle}>Meta Ads (Facebook + Instagram)</Text>

          <View style={{ flexDirection: "row", marginTop: 18, gap: 14 }}>
            <View>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>Período</Text>
              <Text style={styles.coverMeta}>{fmtDate(period.since)} → {fmtDate(period.until)}</Text>
              <Text style={[styles.coverMeta, { color: "#71717a", marginTop: 2 }]}>
                {period.days} dias
              </Text>
            </View>
            <View style={{ marginLeft: 30 }}>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>Investido</Text>
              <Text style={[styles.coverMeta, { fontSize: 22, fontWeight: "bold", color: "#ffffff" }]}>
                R$ {fmtBRL(kpis.total_spent)}
              </Text>
            </View>
            <View style={{ marginLeft: 30 }}>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>ROAS real</Text>
              <Text style={[styles.coverMeta, { fontSize: 22, fontWeight: "bold", color: kpis.real_roas >= 1 ? "#22c55e" : "#ef4444" }]}>
                {kpis.real_roas.toFixed(2)}x
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.coverBrand}>
          <View>
            <Text style={styles.brandLogo}>AGATHAS WEB</Text>
            <Text style={styles.brandTag}>Tráfego, IA e Performance</Text>
          </View>
          <Text style={styles.brandTag}>
            Emitido em {new Date().toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </Page>

      {/* ===== KPIs + ROAS Real ===== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Resumo executivo</Text>
        <Text style={{ fontSize: 8, color: PALETTE.textMuted, marginBottom: 12 }}>
          Indicadores principais consolidados das campanhas Meta Ads no período.
        </Text>

        {/* Highlight do ROAS real */}
        <View style={styles.roasBox}>
          <Text style={{ fontSize: 8, color: PALETTE.warn, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            ROAS REAL — cruzamento Meta + ASAAS
          </Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Gasto Meta</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: PALETTE.textDark }}>
                R$ {fmtBRL(kpis.total_spent)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Receita confirmada</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: PALETTE.accent }}>
                R$ {fmtBRL(kpis.real_revenue)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>ROAS</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: kpis.real_roas >= 1 ? PALETTE.accent : PALETTE.danger }}>
                {kpis.real_roas.toFixed(2)}x
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: PALETTE.textMuted }}>Conversões</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: PALETTE.textDark }}>
                {fmtBR(kpis.total_conversions)}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 6, color: PALETTE.textMuted, marginTop: 4, fontStyle: "italic" }}>
            Receita conta apenas subscriptions com status CONFIRMED/RECEIVED atribuídas a Meta (fbclid ou utm_source).
          </Text>
        </View>

        <View style={styles.cardRow}>
          <KPICard label="Impressões" value={fmtBR(kpis.total_impressions)} color={PALETTE.primary} />
          <KPICard label="Cliques" value={fmtBR(kpis.total_clicks)} sub={`CTR ${kpis.ctr.toFixed(2)}%`} color={PALETTE.accent} />
          <KPICard label="CPC médio" value={`R$ ${fmtBRL(kpis.cpc)}`} sub={`CPM R$ ${fmtBRL(kpis.cpm)}`} color="#3b82f6" />
        </View>
        <View style={styles.cardRow}>
          <KPICard label="CPA" value={kpis.cpa > 0 ? `R$ ${fmtBRL(kpis.cpa)}` : "—"} sub="Custo por conversão" color={PALETTE.warn} />
          <KPICard label="Alcance" value={fmtBR(kpis.reach)} sub={`Freq. ${kpis.frequency.toFixed(2)}x`} color="#a855f7" />
          <KPICard label="Conv. Meta" value={fmtBR(kpis.reported_conversions)} sub="Reportadas pela Meta" color={PALETTE.danger} />
        </View>

        {hasDailySpend ? (
          <>
            <Text style={styles.h2}>Gasto diário</Text>
            <LineChart
              data={dailySpend.map((d) => ({ x: d.date.slice(5), y: d.spent }))}
              color={PALETTE.warn}
              label="gasto"
            />

            <Text style={styles.h2}>Cliques diários</Text>
            <LineChart
              data={dailySpend.map((d) => ({ x: d.date.slice(5), y: d.clicks }))}
              color={PALETTE.primary}
              label="cliques"
            />
          </>
        ) : (
          <View style={{ padding: 8, backgroundColor: PALETTE.bgCard, borderRadius: 3, marginTop: 8 }}>
            <Text style={{ fontSize: 8, color: PALETTE.textMuted, fontStyle: "italic" }}>
              Sem dados de gasto diário sincronizados no período. Aguarde o próximo sync
              (a cada 15min) ou clique em &quot;↻ Sync agora&quot; no /admin/social/ads.
            </Text>
          </View>
        )}

        <PageFooter pageLabel="Resumo & Gasto" scope={scopeLabel} />
      </Page>

      {/* ===== Página unificada: Campanhas + Funil + Top Ads (com wrap) ===== */}
      {(hasCampaigns || hasFunnel || hasTopAds) && (
        <Page size="A4" style={styles.page} wrap>
          {hasCampaigns && (
            <View style={{ marginBottom: 16 }} wrap={false}>
              <Text style={styles.h1}>Performance por campanha</Text>
              <Text style={{ fontSize: 8, color: PALETTE.textMuted, marginBottom: 8 }}>
                {campaigns.length} campanhas no período, ordenadas por gasto.
              </Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, { width: 130 }]}>Nome</Text>
                  <Text style={[styles.th, { width: 60 }]}>Objetivo</Text>
                  <Text style={[styles.th, { width: 50 }]}>Status</Text>
                  <Text style={[styles.th, { width: 60, textAlign: "right" }]}>Gasto</Text>
                  <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Cap</Text>
                  <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Impr.</Text>
                  <Text style={[styles.th, { width: 40, textAlign: "right" }]}>Cliques</Text>
                  <Text style={[styles.th, { width: 35, textAlign: "right" }]}>CTR</Text>
                  <Text style={[styles.th, { width: 45, textAlign: "right" }]}>CPC</Text>
                  <Text style={[styles.th, { width: 35, textAlign: "right" }]}>Conv.</Text>
                </View>
                {campaigns.slice(0, 20).map((c) => (
                  <View key={c.id} style={styles.tr}>
                    <Text style={[styles.td, { width: 130 }]}>{c.name.slice(0, 28)}</Text>
                    <Text style={[styles.td, { width: 60 }]}>{OBJECTIVE_LABEL[c.objective] ?? c.objective.slice(0, 8)}</Text>
                    <Text style={[styles.td, { width: 50, color: c.status === "ACTIVE" ? PALETTE.accent : PALETTE.textMuted }]}>{STATUS_LABEL[c.status] ?? c.status}</Text>
                    <Text style={[styles.td, { width: 60, textAlign: "right" }]}>R$ {fmtBRL(c.spent_brl)}</Text>
                    <Text style={[styles.td, { width: 50, textAlign: "right", color: PALETTE.textMuted }]}>R$ {fmtBRL(c.spend_cap_brl)}</Text>
                    <Text style={[styles.td, { width: 50, textAlign: "right" }]}>{fmtBR(c.impressions)}</Text>
                    <Text style={[styles.td, { width: 40, textAlign: "right" }]}>{fmtBR(c.clicks)}</Text>
                    <Text style={[styles.td, { width: 35, textAlign: "right" }]}>{c.ctr.toFixed(1)}%</Text>
                    <Text style={[styles.td, { width: 45, textAlign: "right" }]}>R$ {fmtBRL(c.cpc_brl)}</Text>
                    <Text style={[styles.td, { width: 35, textAlign: "right", color: PALETTE.accent }]}>{fmtBR(c.conversions)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {hasFunnel && (
            <View style={{ marginBottom: 16 }} wrap={false}>
              <Text style={styles.h1}>Funil de conversão</Text>
              <Text style={{ fontSize: 8, color: PALETTE.textMuted, marginBottom: 8 }}>
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

          {hasTopAds && (
            <View wrap={false}>
              <Text style={styles.h1}>Top campanhas por ROAS</Text>
              <Text style={{ fontSize: 8, color: PALETTE.textMuted, marginBottom: 8 }}>
                ROAS distribuído proporcionalmente ao gasto. Sinal direcional — atribuição exata
                requer touch tracking adicional.
              </Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, { width: 250 }]}>Campanha</Text>
                  <Text style={[styles.th, { width: 80, textAlign: "right" }]}>Gasto</Text>
                  <Text style={[styles.th, { width: 80, textAlign: "right" }]}>Conv. Meta</Text>
                  <Text style={[styles.th, { width: 80, textAlign: "right" }]}>ROAS est.</Text>
                </View>
                {topAds.map((a, i) => (
                  <View key={i} style={styles.tr}>
                    <Text style={[styles.td, { width: 250 }]}>{a.campaign.slice(0, 50)}</Text>
                    <Text style={[styles.td, { width: 80, textAlign: "right" }]}>R$ {fmtBRL(a.spent)}</Text>
                    <Text style={[styles.td, { width: 80, textAlign: "right" }]}>{fmtBR(a.conversions)}</Text>
                    <Text style={[styles.td, { width: 80, textAlign: "right", fontWeight: "bold", color: a.roas >= 1 ? PALETTE.accent : PALETTE.danger }]}>
                      {a.roas.toFixed(2)}x
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <PageFooter pageLabel="Campanhas & funil" scope={scopeLabel} />
        </Page>
      )}

      {/* ===== Recommendations ===== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Insights & recomendações</Text>
        <Text style={{ fontSize: 8, color: PALETTE.textMuted, marginBottom: 12 }}>
          Análises automáticas baseadas em performance vs benchmarks da indústria.
        </Text>

        {recommendations.map((rec, i) => (
          <View key={i} style={styles.recItem}>
            <Text style={styles.recBullet}>▸</Text>
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}

        <Text style={[styles.h1, { marginTop: 20 }]}>Próximos passos sugeridos</Text>
        <View style={styles.recItem}>
          <Text style={styles.recBullet}>1.</Text>
          <Text style={styles.recText}>
            Revisar as 3 campanhas com menor ROAS — pausar ou ajustar criativo/segmentação.
          </Text>
        </View>
        <View style={styles.recItem}>
          <Text style={styles.recBullet}>2.</Text>
          <Text style={styles.recText}>
            Identificar a melhor campanha por ROAS e duplicar com orçamento +20%.
          </Text>
        </View>
        <View style={styles.recItem}>
          <Text style={styles.recBullet}>3.</Text>
          <Text style={styles.recText}>
            Testar 2 novos criativos por semana (foto vs vídeo, headlines diferentes) pra
            evitar fadiga.
          </Text>
        </View>
        <View style={styles.recItem}>
          <Text style={styles.recBullet}>4.</Text>
          <Text style={styles.recText}>
            Criar audiência custom de visitantes /produtos/voyia últimos 30 dias e
            campanha de retargeting com oferta especial.
          </Text>
        </View>

        <View style={{ marginTop: 32, paddingTop: 14, borderTop: `0.5 solid ${PALETTE.grayLight}` }}>
          <Text style={{ fontSize: 7, color: PALETTE.textMuted, textAlign: "center" }}>
            Este relatório foi gerado a partir do Meta Marketing API consolidado com dados do
            Pixel + Conversions API e tabela de assinaturas ASAAS do painel Agathas Web.
          </Text>
        </View>

        <PageFooter pageLabel="Recomendações" scope={scopeLabel} />
      </Page>

      {/* Suppress unused import */}
      <Page size="A4" style={[styles.page, { display: "none" }]}>
        <HBars data={[]} />
      </Page>
    </Document>
  );
}
