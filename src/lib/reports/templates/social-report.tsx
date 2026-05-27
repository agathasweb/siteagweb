/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import type { SocialReportData } from "../data-social";
import type { PublishedPostRow } from "@/lib/db/social-published";
import { PALETTE, LineChart, HBars, DonutChart } from "../charts";

/**
 * Relatório Social — modelo validado (port do yeshua-dev social-print).
 *
 * Estrutura:
 *  1. Header compacto (título + período + conta)
 *  2. 4 KPI cards principais coloridos (Seguidores, Alcance, Ganhos, Engaj/dia)
 *  3. 6 KPI cards secundários (Impressões, Visitas Perfil, Curtidas, Coment, Shares, Salvos)
 *  4. Gráfico evolução (3 linhas: alcance + engajamento + visitas perfil)
 *  5. Doughnut Gênero + Bars Idade (lado a lado)
 *  6. Tabela Top Cidades
 *  7. Top Feed/Reels/Stories com THUMBNAILS (grid 3 colunas, 6 métricas por card)
 *  8. Recomendações
 */

const styles = StyleSheet.create({
  page: { padding: 24, paddingBottom: 36, fontSize: 9, color: PALETTE.textDark, backgroundColor: "#ffffff" },
  // Header
  headerBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `1 solid ${PALETTE.grayLight}` },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: PALETTE.textDark },
  headerSubtitle: { fontSize: 10, color: PALETTE.textMuted, marginTop: 2 },
  headerRight: { textAlign: "right" },
  headerLabel: { fontSize: 7, color: PALETTE.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  headerPeriod: { fontSize: 11, fontWeight: "bold", color: PALETTE.textDark, marginTop: 1 },
  headerAccount: { fontSize: 10, color: "#ec4899", fontWeight: "bold", marginTop: 4 },
  headerGenAt: { fontSize: 7, color: PALETTE.textMuted, marginTop: 2 },
  // Section headers
  h3: { fontSize: 12, fontWeight: "bold", color: PALETTE.textDark, marginBottom: 6, paddingBottom: 4, borderBottom: `1 solid ${PALETTE.grayLight}` },
  // KPI cards
  kpiRow: { flexDirection: "row", marginBottom: 6, gap: 6 },
  kpiCard: { flex: 1, padding: 8, borderRadius: 5, border: "1 solid" },
  kpiLabel: { fontSize: 7, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 },
  kpiValue: { fontSize: 16, fontWeight: "bold", color: PALETTE.textDark },
  kpiValueSm: { fontSize: 13, fontWeight: "bold", color: PALETTE.textDark },
  // Chart container
  chartBox: { border: `1 solid ${PALETTE.grayLight}`, borderRadius: 6, padding: 10, marginBottom: 14 },
  // Post grid
  postGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  postCard: { width: "32%", border: `1 solid ${PALETTE.grayLight}`, borderRadius: 5, padding: 6, marginBottom: 6 },
  postThumb: { width: "100%", borderRadius: 3, marginBottom: 4 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  postBadge: { fontSize: 6, fontWeight: "bold", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 8, color: "#ffffff" },
  postDate: { fontSize: 7, color: PALETTE.textMuted },
  postCaption: { fontSize: 7, color: "#4b5563", marginBottom: 3, height: 18, overflow: "hidden" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metricCol: { alignItems: "center", flex: 1 },
  metricValue: { fontSize: 8, fontWeight: "bold", color: PALETTE.textDark },
  metricValueGreen: { fontSize: 8, fontWeight: "bold", color: "#16a34a" },
  metricValuePurple: { fontSize: 8, fontWeight: "bold", color: "#9333ea" },
  metricValuePink: { fontSize: 8, fontWeight: "bold", color: "#ec4899" },
  metricLabel: { fontSize: 6, color: PALETTE.textMuted, marginTop: 1 },
  // Tables
  table: {},
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${PALETTE.grayLight}`, paddingVertical: 4 },
  trHead: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 5, paddingHorizontal: 4, marginBottom: 0 },
  th: { fontSize: 7, fontWeight: "bold", color: PALETTE.textMuted, textTransform: "uppercase" },
  td: { fontSize: 8, color: "#374151" },
  // Recommendations
  rec: { flexDirection: "row", marginBottom: 5, padding: 6, backgroundColor: "#faf5ff", borderLeft: `2 solid #9333ea`, borderRadius: 3 },
  recNum: { width: 14, fontSize: 9, fontWeight: "bold", color: "#9333ea" },
  recText: { flex: 1, fontSize: 8, lineHeight: 1.4, color: PALETTE.textDark },
  // Footer
  footer: { position: "absolute", bottom: 14, left: 24, right: 24, fontSize: 6, color: PALETTE.textMuted, textAlign: "center", paddingTop: 5, borderTop: `0.5 solid ${PALETTE.grayLight}` },
});

// KPI cards coloridos (yeshua-style)
const KPI_COLORS = {
  purple: { bg: "#faf5ff", border: "#f3e8ff", label: "#9333ea" },
  blue: { bg: "#eff6ff", border: "#dbeafe", label: "#2563eb" },
  green: { bg: "#f0fdf4", border: "#dcfce7", label: "#16a34a" },
  amber: { bg: "#fffbeb", border: "#fef3c7", label: "#d97706" },
  indigo: { bg: "#eef2ff", border: "#e0e7ff", label: "#4f46e5" },
  pink: { bg: "#fdf2f8", border: "#fce7f3", label: "#db2777" },
  gray: { bg: "#f9fafb", border: "#e5e7eb", label: "#4b5563" },
};

function KpiCard({
  label,
  value,
  color = "gray",
  small = false,
}: {
  label: string;
  value: string;
  color?: keyof typeof KPI_COLORS;
  small?: boolean;
}) {
  const c = KPI_COLORS[color];
  return (
    <View style={[styles.kpiCard, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.kpiLabel, { color: c.label }]}>{label}</Text>
      <Text style={small ? styles.kpiValueSm : styles.kpiValue}>{value}</Text>
    </View>
  );
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  feed_image: { label: "FEED", color: "#6b7280" },
  feed_video: { label: "VÍDEO", color: "#3b82f6" },
  reel: { label: "REEL", color: "#dc2626" },
  carousel: { label: "CARROSSEL", color: "#a855f7" },
  story: { label: "STORY", color: "#d97706" },
  story_image: { label: "STORY", color: "#d97706" },
  story_video: { label: "STORY", color: "#d97706" },
};

function fmtBR(n: number): string { return n.toLocaleString("pt-BR"); }
function fmtDate(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("pt-BR");
}

/**
 * PostCard — equivalente ao card visual de post no yeshua.
 *
 * Renderiza thumbnail + badge + data + legenda + 6 métricas.
 * Pra thumbnails usa o caminho LOCAL (cacheado) — URLs do Meta CDN expiram.
 */
function PostCard({ post, aspect = "4:5" }: { post: PublishedPostRow; aspect?: "1:1" | "4:5" | "9:16" }) {
  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.feed_image;
  // Aspect ratio = width/height. Valores < 1 são RETRATO (altura > largura):
  //   - 4:5 = 0.8   → feed Instagram moderno (recomendado pela Meta)
  //   - 9:16 = 0.5625 → reels e stories (vertical extremo)
  //   - 1:1 = 1.0   → feed clássico quadrado (fallback)
  const aspectRatio = aspect === "9:16" ? 9 / 16 : aspect === "4:5" ? 4 / 5 : 1;
  // Carrega o thumbnail como Buffer — react-pdf aceita Uint8Array via { data, format }
  // (caminhos com file:// ou strings absolutas falham silenciosamente em algumas versões).
  let thumbBuffer: Buffer | null = null;
  if (post.thumbnail_local) {
    const absPath = join(process.cwd(), "public", post.thumbnail_local.replace(/^\//, ""));
    if (existsSync(absPath)) {
      try {
        thumbBuffer = readFileSync(absPath);
      } catch {
        thumbBuffer = null;
      }
    }
  }
  return (
    <View style={styles.postCard} wrap={false}>
      {thumbBuffer && (
        <Image
          src={{ data: thumbBuffer, format: "jpg" }}
          style={[styles.postThumb, { aspectRatio }]}
        />
      )}
      <View style={styles.postMeta}>
        <View style={[styles.postBadge, { backgroundColor: badge.color }]}>
          <Text>{badge.label}</Text>
        </View>
        <Text style={styles.postDate}>{fmtDate(post.published_at)}</Text>
      </View>
      {post.caption && (
        <Text style={styles.postCaption}>{post.caption.slice(0, 90)}</Text>
      )}
      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{fmtBR(post.likes)}</Text>
          <Text style={styles.metricLabel}>Curtidas</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{fmtBR(post.comments)}</Text>
          <Text style={styles.metricLabel}>Coment.</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{fmtBR(post.shares)}</Text>
          <Text style={styles.metricLabel}>Shares</Text>
        </View>
      </View>
      <View style={[styles.metricsRow, { marginTop: 3, paddingTop: 3, borderTop: `0.5 solid ${PALETTE.grayLight}` }]}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValueGreen}>{fmtBR(post.engagement_total)}</Text>
          <Text style={styles.metricLabel}>Engaj.</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricValuePurple}>{fmtBR(post.follows)}</Text>
          <Text style={styles.metricLabel}>Follows</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricValuePink}>{fmtBR(post.profile_visits)}</Text>
          <Text style={styles.metricLabel}>Visitas</Text>
        </View>
      </View>
    </View>
  );
}

/** Mapeia bucket de gender pra label legível. */
function genderLabel(b: string): string {
  if (b === "M" || b.toLowerCase() === "male") return "Homens";
  if (b === "F" || b.toLowerCase() === "female") return "Mulheres";
  return b.toUpperCase();
}

export function SocialReportDocument({ data }: { data: SocialReportData }) {
  const { account, period, kpis, growth, topPosts, topFeed, topReels, topStories, demographics, recommendations } = data;

  // Dados pro doughnut de gênero
  const genderData = demographics.genderAge
    .filter((a) => ["M", "F", "U"].includes(a.bucket) || ["male", "female"].includes(a.bucket.toLowerCase()))
    .map((a, i) => ({
      name: genderLabel(a.bucket),
      value: a.value,
      color: ["#3b82f6", "#ec4899", "#9ca3af"][i] ?? "#9ca3af",
    }));

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.headerTitle}>Relatório de Desempenho</Text>
            <Text style={styles.headerSubtitle}>Social Orgânico — Instagram</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Período Analisado</Text>
            <Text style={styles.headerPeriod}>
              {new Date(period.since).toLocaleDateString("pt-BR")} a{" "}
              {new Date(period.until).toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.headerGenAt}>Gerado em {new Date().toLocaleString("pt-BR")}</Text>
            <Text style={styles.headerAccount}>@{account.username}</Text>
          </View>
        </View>

        {/* KPIs PRINCIPAIS */}
        <View style={styles.kpiRow}>
          <KpiCard label="Seguidores" value={fmtBR(kpis.followers)} color="purple" />
          <KpiCard label="Alcance Total" value={fmtBR(kpis.total_reach)} color="blue" />
          <KpiCard
            label="Seguidores Ganhos"
            value={`${kpis.followers_delta >= 0 ? "+" : ""}${fmtBR(kpis.followers_delta)}`}
            color="green"
          />
          <KpiCard
            label="Engajamento Médio/Dia"
            value={fmtBR(period.days > 0 ? Math.round(kpis.total_engagement / period.days) : 0)}
            color="amber"
          />
        </View>

        {/* KPIs SECUNDÁRIOS */}
        <View style={[styles.kpiRow, { marginBottom: 14 }]}>
          <KpiCard label="Impressões" value={fmtBR(kpis.total_reach)} color="indigo" small />
          <KpiCard label="Visitas Perfil" value={fmtBR(kpis.profile_visits)} color="pink" small />
          <KpiCard
            label="Curtidas"
            value={fmtBR(topPosts.reduce((s, p) => s + p.likes, 0))}
            color="gray"
            small
          />
          <KpiCard
            label="Comentários"
            value={fmtBR(topPosts.reduce((s, p) => s + p.comments, 0))}
            color="gray"
            small
          />
          <KpiCard
            label="Compartilh."
            value={fmtBR(topPosts.reduce((s, p) => s + p.shares, 0))}
            color="gray"
            small
          />
          <KpiCard
            label="Salvos"
            value={fmtBR(topPosts.reduce((s, p) => s + p.saves, 0))}
            color="gray"
            small
          />
        </View>

        {/* GRÁFICO EVOLUÇÃO (alcance + visitas perfil diárias) */}
        {growth.length > 0 && growth.some((g) => g.reach > 0 || g.profile_views > 0) && (
          <View style={styles.chartBox} wrap={false}>
            <Text style={styles.h3}>Alcance Diário</Text>
            <LineChart
              data={growth.map((g) => ({ x: g.date.slice(5), y: g.reach }))}
              color="#3b82f6"
              label="alcance"
              showArea={true}
            />
          </View>
        )}

        {/* Profile views diário não é mostrado porque a Meta API não expõe
            série diária real pra essa métrica (só total agregado). O número
            total aparece no KPI card no topo. */}

        {/* Crescimento de seguidores — só plotar se tiver dados não-nulos */}
        {growth.length > 0 && growth.some((g) => g.followers_count !== 0) && (
          <View style={styles.chartBox} wrap={false}>
            <Text style={styles.h3}>Ganhos de Seguidores por Dia</Text>
            <Text style={{ fontSize: 7, color: PALETTE.textMuted, marginBottom: 4 }}>
              Diferença líquida (novos − unfollows) por dia. Valores negativos = perda.
            </Text>
            <LineChart
              data={growth.map((g) => ({ x: g.date.slice(5), y: g.followers_count }))}
              color="#8b5cf6"
              label="ganhos"
              showArea={true}
            />
          </View>
        )}

        {/* AUDIÊNCIA: Gênero + Idade */}
        {(genderData.length > 0 || demographics.genderAge.length > 0) && (
          <View style={{ flexDirection: "row", gap: 14, marginBottom: 14 }} wrap={false}>
            {genderData.length > 0 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>Audiência por Gênero</Text>
                <DonutChart data={genderData} size={140} />
              </View>
            )}
            {demographics.genderAge.filter((a) => /^\d/.test(a.bucket)).length > 0 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>Audiência por Faixa Etária</Text>
                <HBars
                  data={demographics.genderAge
                    .filter((a) => /^\d/.test(a.bucket))
                    .slice(0, 8)
                    .map((a) => ({ name: a.bucket, value: a.value }))}
                  color="#8b5cf6"
                />
              </View>
            )}
          </View>
        )}

        {/* TOP CIDADES */}
        {demographics.cities.length > 0 && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={styles.h3}>Top Cidades da Audiência</Text>
            {(() => {
              const total = demographics.cities.reduce((s, c) => s + c.value, 0);
              return (
                <View style={styles.table}>
                  <View style={styles.trHead}>
                    <Text style={[styles.th, { flex: 3 }]}>Cidade</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>Quantidade</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>%</Text>
                  </View>
                  {demographics.cities.slice(0, 15).map((c) => (
                    <View key={c.id} style={styles.tr}>
                      <Text style={[styles.td, { flex: 3 }]}>{c.bucket}</Text>
                      <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>{fmtBR(c.value)}</Text>
                      <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                        {total > 0 ? ((c.value / total) * 100).toFixed(1) : "0.0"}%
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* TOP FEED */}
        {topFeed.length > 0 && (
          <View style={{ marginBottom: 14 }} break>
            <Text style={styles.h3}>Top Feed por Engajamento</Text>
            <View style={styles.postGrid}>
              {topFeed.map((p) => (
                <PostCard key={p.id} post={p} aspect="4:5" />
              ))}
            </View>
          </View>
        )}

        {/* TOP REELS */}
        {topReels.length > 0 && (
          <View style={{ marginBottom: 14 }} break>
            <Text style={styles.h3}>Top Reels por Engajamento</Text>
            <View style={styles.postGrid}>
              {topReels.map((p) => (
                <PostCard key={p.id} post={p} aspect="9:16" />
              ))}
            </View>
          </View>
        )}

        {/* TOP STORIES */}
        {topStories.length > 0 && (
          <View style={{ marginBottom: 14 }} break>
            <Text style={styles.h3}>Stories no Período</Text>
            <View style={styles.postGrid}>
              {topStories.map((p) => (
                <PostCard key={p.id} post={p} aspect="9:16" />
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
          Relatório gerado automaticamente pelo sistema Agathas Web · agathasweb.com
        </Text>
      </Page>
    </Document>
  );
}
