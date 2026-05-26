/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SocialReportData } from "../data-social";
import {
  PALETTE,
  KPICard,
  LineChart,
  HBars,
  Heatmap,
  BarChart,
} from "../charts";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bgPage,
    padding: 30,
    paddingBottom: 40,
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
    color: "#a78bfa",
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
  section: {
    marginBottom: 14,
  },
  hint: {
    fontSize: 8,
    color: PALETTE.textMuted,
    marginBottom: 8,
  },
  empty: {
    fontSize: 8,
    color: PALETTE.textMuted,
    fontStyle: "italic",
    padding: 8,
    backgroundColor: PALETTE.bgCard,
    borderRadius: 3,
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
    color: PALETTE.primary,
  },
  recText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
    color: PALETTE.textDark,
  },
});

const TYPE_LABEL: Record<string, string> = {
  feed_image: "Feed (imagem)",
  feed_video: "Feed (vídeo)",
  reel: "Reel",
  carousel: "Carrossel",
  story: "Story",
  story_image: "Story",
  story_video: "Story",
};

function fmtBR(n: number): string {
  return n.toLocaleString("pt-BR");
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function PageFooter({ pageLabel, accountUsername }: { pageLabel: string; accountUsername: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Agathas Web · Relatório Social · @{accountUsername}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      <Text>{pageLabel}</Text>
    </View>
  );
}

export function SocialReportDocument({ data }: { data: SocialReportData }) {
  const { account, period, kpis, growth, reach, engagementByType, topPosts, bestTimeHeatmap, demographics, postingFrequency, recommendations } = data;

  // Cálculos de "tem dados ou não"
  const hasGrowth = growth.length > 0 && growth.some((g) => g.followers_count > 0);
  const hasReach = reach.length > 0 && reach.some((r) => r.reach > 0);
  const hasEngagementByType = engagementByType.length > 0;
  const hasTopPosts = topPosts.length > 0;
  const hasHeatmapData = bestTimeHeatmap.some((c) => c.count > 0);
  const hasGenderAge = demographics.genderAge.length > 0;
  const hasCities = demographics.cities.length > 0;
  const hasCountries = demographics.countries.length > 0;
  const hasDemographics = hasGenderAge || hasCities || hasCountries;
  const hasPostingFreq = postingFrequency.length > 0;

  return (
    <Document>
      {/* ===== Cover ===== */}
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={styles.coverInner}>
          <Text style={styles.coverTag}>Relatório de Redes Sociais</Text>
          <Text style={styles.coverTitle}>@{account.username}</Text>
          <Text style={styles.coverSubtitle}>{account.display_name}</Text>
          <View style={{ flexDirection: "row", marginTop: 18, gap: 14 }}>
            <View>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>Período</Text>
              <Text style={styles.coverMeta}>{fmtDate(period.since)} → {fmtDate(period.until)}</Text>
              <Text style={[styles.coverMeta, { color: "#71717a", marginTop: 2 }]}>
                {period.days} dias
              </Text>
            </View>
            <View style={{ marginLeft: 30 }}>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>Seguidores</Text>
              <Text style={[styles.coverMeta, { fontSize: 14, fontWeight: "bold", color: "#ffffff" }]}>
                {fmtBR(kpis.followers)}
              </Text>
              {kpis.followers_delta !== 0 && (
                <Text style={[styles.coverMeta, { color: kpis.followers_delta > 0 ? "#22c55e" : "#ef4444", marginTop: 2 }]}>
                  {kpis.followers_delta > 0 ? "+" : ""}{kpis.followers_delta} ({kpis.followers_delta_pct.toFixed(1)}%)
                </Text>
              )}
            </View>
            <View style={{ marginLeft: 30 }}>
              <Text style={[styles.coverTag, { marginBottom: 4 }]}>Posts no período</Text>
              <Text style={[styles.coverMeta, { fontSize: 14, fontWeight: "bold", color: "#ffffff" }]}>
                {fmtBR(kpis.total_posts)}
              </Text>
              <Text style={[styles.coverMeta, { color: "#71717a", marginTop: 2 }]}>
                {(kpis.total_posts / Math.max(period.days / 7, 1)).toFixed(1)}/semana
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

      {/* ===== Página 2: KPIs + Crescimento + Alcance (com wrap) ===== */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.section}>
          <Text style={styles.h1}>Resumo executivo</Text>
          <Text style={styles.hint}>Indicadores principais do período de {period.days} dias.</Text>

          <View style={styles.cardRow}>
            <KPICard
              label="Seguidores"
              value={fmtBR(kpis.followers)}
              sub={`${kpis.followers_delta >= 0 ? "+" : ""}${kpis.followers_delta} no período`}
              delta={{ value: kpis.followers_delta_pct, positiveIsGood: true }}
              color={PALETTE.primary}
            />
            <KPICard
              label="Alcance total"
              value={fmtBR(kpis.total_reach)}
              sub={`Média ${fmtBR(Math.round(kpis.reach_avg_daily))}/dia`}
              color={PALETTE.accent}
            />
            <KPICard
              label="Engajamento"
              value={fmtBR(kpis.total_engagement)}
              sub={`Taxa ${kpis.engagement_rate.toFixed(2)}%`}
              color="#3b82f6"
            />
          </View>
          <View style={styles.cardRow}>
            <KPICard
              label="Posts publicados"
              value={fmtBR(kpis.total_posts)}
              sub={`${(kpis.total_posts / Math.max(period.days / 7, 1)).toFixed(1)}/semana`}
              color={PALETTE.warn}
            />
            <KPICard
              label="Visitas ao perfil"
              value={fmtBR(kpis.profile_visits)}
              color="#a855f7"
            />
            <KPICard
              label="Cliques no site"
              value={fmtBR(kpis.website_clicks)}
              sub={kpis.profile_visits > 0 ? `${((kpis.website_clicks / kpis.profile_visits) * 100).toFixed(1)}% do perfil` : undefined}
              color={PALETTE.danger}
            />
          </View>
        </View>

        {hasGrowth && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h2}>Crescimento de seguidores</Text>
            <LineChart
              data={growth.map((g) => ({ x: g.date.slice(5), y: g.followers_count }))}
              color={PALETTE.primary}
              label="seguidores"
            />
          </View>
        )}

        {hasReach && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h2}>Alcance diário</Text>
            <LineChart
              data={reach.map((r) => ({ x: r.date.slice(5), y: r.reach }))}
              color={PALETTE.accent}
              label="alcance"
            />
          </View>
        )}

        {!hasGrowth && !hasReach && (
          <View style={styles.section}>
            <Text style={styles.empty}>
              Sem insights diários sincronizados no período. Use o botão &quot;Backfill 90d&quot;
              em /admin/social pra puxar histórico completo da Meta.
            </Text>
          </View>
        )}

        {/* Engagement by type */}
        {hasEngagementByType && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>Engajamento por tipo de conteúdo</Text>
            <Text style={styles.hint}>
              Engajamento médio por post em cada formato. Reels tendem a ter melhor alcance orgânico.
            </Text>
            <BarChart
              data={engagementByType.map((e) => ({ x: TYPE_LABEL[e.type] ?? e.type, y: Math.round(e.avg_engagement) }))}
              color={PALETTE.primary}
            />
            <View style={[styles.table, { marginTop: 10 }]}>
              <View style={styles.tr}>
                <Text style={[styles.th, { width: 130 }]}>Tipo</Text>
                <Text style={[styles.th, { width: 80, textAlign: "right" }]}>Posts</Text>
                <Text style={[styles.th, { width: 110, textAlign: "right" }]}>Engaj. médio</Text>
                <Text style={[styles.th, { width: 110, textAlign: "right" }]}>Total</Text>
              </View>
              {engagementByType.map((e) => (
                <View key={e.type} style={styles.tr}>
                  <Text style={[styles.td, { width: 130 }]}>{TYPE_LABEL[e.type] ?? e.type}</Text>
                  <Text style={[styles.td, { width: 80, textAlign: "right" }]}>{e.count}</Text>
                  <Text style={[styles.td, { width: 110, textAlign: "right" }]}>{fmtBR(Math.round(e.avg_engagement))}</Text>
                  <Text style={[styles.td, { width: 110, textAlign: "right" }]}>{fmtBR(e.total_engagement)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top posts */}
        {hasTopPosts && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>Top posts por engajamento</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { width: 20 }]}>#</Text>
                <Text style={[styles.th, { width: 60 }]}>Tipo</Text>
                <Text style={[styles.th, { width: 200 }]}>Legenda</Text>
                <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Likes</Text>
                <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Coment.</Text>
                <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Reach</Text>
                <Text style={[styles.th, { width: 60, textAlign: "right" }]}>Engaj.</Text>
              </View>
              {topPosts.map((p, i) => (
                <View key={p.id} style={styles.tr}>
                  <Text style={[styles.td, { width: 20 }]}>{i + 1}</Text>
                  <Text style={[styles.td, { width: 60 }]}>{TYPE_LABEL[p.type] ?? p.type}</Text>
                  <Text style={[styles.td, { width: 200 }]}>
                    {(p.caption ?? "(sem legenda)").slice(0, 60)}
                  </Text>
                  <Text style={[styles.td, { width: 50, textAlign: "right" }]}>{fmtBR(p.likes)}</Text>
                  <Text style={[styles.td, { width: 50, textAlign: "right" }]}>{fmtBR(p.comments)}</Text>
                  <Text style={[styles.td, { width: 50, textAlign: "right" }]}>{fmtBR(p.reach)}</Text>
                  <Text style={[styles.td, { width: 60, textAlign: "right", fontWeight: "bold" }]}>
                    {fmtBR(p.engagement_total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Heatmap */}
        {hasHeatmapData && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>Melhor horário pra postar</Text>
            <Text style={styles.hint}>
              Engajamento médio por dia da semana × hora. Quanto mais escuro, melhor.
            </Text>
            <Heatmap cells={bestTimeHeatmap} />
          </View>
        )}

        {/* Demographics */}
        {hasDemographics && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>Demografia da audiência</Text>
            <View style={{ flexDirection: "row", marginTop: 4 }}>
              {hasGenderAge && (
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.h2}>Idade × gênero</Text>
                  <HBars
                    data={demographics.genderAge.slice(0, 10).map((d) => ({ name: d.bucket, value: d.value }))}
                    color={PALETTE.primary}
                  />
                </View>
              )}
              {hasCities && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>Top cidades</Text>
                  <HBars
                    data={demographics.cities.slice(0, 10).map((d) => ({ name: d.bucket, value: d.value }))}
                    color={PALETTE.accent}
                  />
                </View>
              )}
            </View>
            {hasCountries && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.h2}>Top países</Text>
                <HBars
                  data={demographics.countries.slice(0, 6).map((d) => ({ name: d.bucket, value: d.value }))}
                  color={PALETTE.warn}
                />
              </View>
            )}
          </View>
        )}

        {/* Posting frequency */}
        {hasPostingFreq && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h1}>Frequência de publicação</Text>
            <Text style={styles.hint}>
              Posts publicados por semana. Recomenda-se 3-5 posts/semana pra crescimento orgânico.
            </Text>
            <BarChart
              data={postingFrequency.map((w) => ({ x: w.week_start.slice(5), y: w.count }))}
              color={PALETTE.primary}
            />
          </View>
        )}

        {/* Recomendações */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.h1}>Insights & recomendações</Text>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recItem}>
              <Text style={styles.recBullet}>{i + 1}.</Text>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
          <View style={{ marginTop: 24, paddingTop: 14, borderTop: `0.5 solid ${PALETTE.grayLight}` }}>
            <Text style={{ fontSize: 7, color: PALETTE.textMuted, textAlign: "center" }}>
              Gerado automaticamente a partir da Meta Graph API + consolidado no painel
              interno Agathas Web. Métricas refletem o último sync disponível.
            </Text>
          </View>
        </View>

        <PageFooter pageLabel="Métricas & análise" accountUsername={account.username} />
      </Page>
    </Document>
  );
}
