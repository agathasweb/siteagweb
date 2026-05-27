import "server-only";
import { db } from "@/lib/db/index";
import {
  getSocialAccount,
  type SocialAccountRow,
} from "@/lib/db/social-accounts";
import {
  listDailyInsights,
  listAudience,
  type DailyInsightRow,
  type AudienceRow,
} from "@/lib/db/social-insights";
import {
  listPublishedPosts,
  topPublishedPostsByEngagement,
  topPublishedPostsByEngagementOfTypes,
  type PublishedPostRow,
} from "@/lib/db/social-published";

/**
 * Agregações de dados para o relatório PDF de Redes Sociais.
 *
 * Estratégia: 1 fetch por seção, todos rodando em paralelo no caller via
 * Promise.all. O input do relatório recebe a estrutura completa abaixo —
 * o template PDF só renderiza, sem queries.
 */

export interface SocialReportData {
  account: SocialAccountRow;
  period: { since: string; until: string; days: number };
  kpis: SocialKpis;
  growth: DailyInsightRow[];
  reach: DailyInsightRow[];
  engagementByType: Array<{ type: string; count: number; avg_engagement: number; total_engagement: number }>;
  // Lista única (uso interno em recomendações e fallbacks)
  topPosts: PublishedPostRow[];
  // Listas separadas por tipo — preenchem as 3 seções do PDF com até 6 cards cada
  topFeed: PublishedPostRow[];
  topReels: PublishedPostRow[];
  topStories: PublishedPostRow[];
  bestTimeHeatmap: Array<{ weekday: number; hour: number; avg_engagement: number; count: number }>;
  demographics: {
    genderAge: AudienceRow[];
    cities: AudienceRow[];
    countries: AudienceRow[];
  };
  postingFrequency: Array<{ week_start: string; count: number }>;
  recommendations: string[];
}

export interface SocialKpis {
  followers: number;
  followers_delta: number;
  followers_delta_pct: number;
  total_reach: number;
  reach_avg_daily: number;
  total_engagement: number;
  engagement_rate: number;            // engagement / reach (%)
  total_posts: number;
  profile_visits: number;
  website_clicks: number;
}

export interface BuildSocialOptions {
  accountId: number;
  /** Preset por dias ou range customizado via from/to (YYYY-MM-DD). */
  sinceDays?: number;
  from?: string;
  to?: string;
}

export function buildSocialReportData(
  input: BuildSocialOptions | number,
  daysLegacy?: number,
): SocialReportData {
  // Compat com chamadas antigas (accountId, days)
  const opts: BuildSocialOptions = typeof input === "number"
    ? { accountId: input, sinceDays: daysLegacy ?? 30 }
    : input;

  const account = getSocialAccount(opts.accountId);
  if (!account) throw new Error("account_not_found");

  // Range efetivo (Date objects)
  let since: Date;
  let until: Date;
  if (opts.from && opts.to) {
    since = new Date(opts.from + "T00:00:00Z");
    until = new Date(opts.to + "T23:59:59Z");
  } else {
    until = new Date();
    since = new Date(until.getTime() - (opts.sinceDays ?? 30) * 86400_000);
  }
  const sinceDays = Math.max(
    1,
    Math.ceil((until.getTime() - since.getTime()) / 86400_000),
  );

  const insights = listDailyInsights(opts.accountId, sinceDays).filter((i) => {
    const d = new Date(i.date + "T00:00:00Z");
    return d >= since && d <= until;
  });
  // Meta API retorna published_at em ISO completo (`2026-04-29T14:04:45+0000`).
  // Antes tentávamos `.replace(" ", "T") + "Z"` que gerava string inválida pra
  // posts que já vinham com T+offset — resultado: Invalid Date, filtro descartava
  // TODOS os posts e KPIs ficavam zerados.
  const posts = listPublishedPosts(opts.accountId, 1000).filter((p) => {
    const d = new Date(p.published_at);
    if (isNaN(d.getTime())) return false;
    return d >= since && d <= until;
  });
  const topPosts = topPublishedPostsByEngagement(opts.accountId, sinceDays, 10);
  // Listas separadas por tipo — até 6 de cada (yeshua-style), evita seções vazias
  const topFeed = topPublishedPostsByEngagementOfTypes(
    opts.accountId,
    sinceDays,
    ["feed_image", "feed_video", "carousel"],
    6,
    "engagement",
  );
  const topReels = topPublishedPostsByEngagementOfTypes(
    opts.accountId,
    sinceDays,
    ["reel"],
    6,
    "engagement",
  );
  const topStories = topPublishedPostsByEngagementOfTypes(
    opts.accountId,
    sinceDays,
    ["story", "story_image", "story_video"],
    6,
    "date",
  );

  // ---------- KPIs ----------
  // ATENÇÃO: o campo `social_insights_daily.followers_count` na verdade
  // armazena o GANHO DIÁRIO de seguidores (retorno da métrica `follower_count`
  // da Meta), NÃO o total acumulado. Logo:
  //   - "Seguidores ganhos no período" = SOMA dos followers_count diários
  //   - "Seguidores totais atuais"      = account.followers_count (snapshot)
  const followers = account.followers_count;
  const followers_delta = insights.reduce((s, i) => s + (i.followers_count ?? 0), 0);
  const followers_start = followers - followers_delta;
  const followers_delta_pct = followers_start > 0 ? (followers_delta / followers_start) * 100 : 0;

  const total_reach = insights.reduce((s, i) => s + i.reach, 0);
  const reach_avg_daily = insights.length ? total_reach / insights.length : 0;
  const total_engagement = posts.reduce(
    (s, p) => s + p.likes + p.comments + p.shares + p.saves,
    0,
  );
  const engagement_rate = total_reach > 0 ? (total_engagement / total_reach) * 100 : 0;
  const profile_visits = insights.reduce((s, i) => s + i.profile_views, 0);
  const website_clicks = insights.reduce((s, i) => s + i.website_clicks, 0);

  const kpis: SocialKpis = {
    followers,
    followers_delta,
    followers_delta_pct,
    total_reach,
    reach_avg_daily,
    total_engagement,
    engagement_rate,
    total_posts: posts.length,
    profile_visits,
    website_clicks,
  };

  // ---------- Engagement by type ----------
  const typeMap = new Map<string, { count: number; total: number }>();
  for (const p of posts) {
    const k = p.type;
    const eng = p.likes + p.comments + p.shares + p.saves;
    const cur = typeMap.get(k) ?? { count: 0, total: 0 };
    typeMap.set(k, { count: cur.count + 1, total: cur.total + eng });
  }
  const engagementByType = Array.from(typeMap.entries()).map(([type, v]) => ({
    type,
    count: v.count,
    total_engagement: v.total,
    avg_engagement: v.count > 0 ? v.total / v.count : 0,
  })).sort((a, b) => b.avg_engagement - a.avg_engagement);

  // ---------- Best time heatmap ----------
  // Engagement médio agrupado por (weekday × hour). 7 dias × 24 horas.
  const heat: Map<string, { sum: number; count: number }> = new Map();
  for (const p of posts) {
    const d = new Date(p.published_at);
    const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
    const eng = p.likes + p.comments + p.shares + p.saves;
    const cur = heat.get(key) ?? { sum: 0, count: 0 };
    heat.set(key, { sum: cur.sum + eng, count: cur.count + 1 });
  }
  const bestTimeHeatmap: SocialReportData["bestTimeHeatmap"] = [];
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      const cur = heat.get(`${w}-${h}`);
      bestTimeHeatmap.push({
        weekday: w,
        hour: h,
        avg_engagement: cur ? cur.sum / cur.count : 0,
        count: cur?.count ?? 0,
      });
    }
  }

  // ---------- Demographics ----------
  const demographics = {
    genderAge: listAudience(opts.accountId, "gender_age"),
    cities: listAudience(opts.accountId, "city"),
    countries: listAudience(opts.accountId, "country"),
  };

  // ---------- Posting frequency (por semana) ----------
  const weekCounts = new Map<string, number>();
  for (const p of posts) {
    const d = new Date(p.published_at);
    // Segunda como início da semana
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.getTime() + diff * 86400_000);
    const key = monday.toISOString().slice(0, 10);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }
  const postingFrequency = Array.from(weekCounts.entries())
    .map(([week_start, count]) => ({ week_start, count }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start));

  // ---------- Recomendações automáticas ----------
  const recommendations: string[] = [];
  if (kpis.engagement_rate < 1.0 && kpis.total_engagement > 0) {
    recommendations.push("Taxa de engajamento abaixo de 1% — considere usar conteúdos mais interativos (perguntas, enquetes, carrosséis).");
  }
  if (kpis.followers_delta < 0) {
    recommendations.push(`Perda líquida de ${Math.abs(kpis.followers_delta)} seguidores no período — revise tipo de conteúdo e frequência.`);
  }
  const reels = engagementByType.find((e) => e.type === "reel");
  const feed = engagementByType.find((e) => e.type === "feed_image" || e.type === "feed_video");
  if (reels && feed && reels.avg_engagement > feed.avg_engagement * 1.5) {
    recommendations.push("Reels performam significativamente melhor que feed (×" + (reels.avg_engagement / Math.max(feed.avg_engagement, 1)).toFixed(1) + ") — aumente a cadência de Reels.");
  }
  if (kpis.total_posts < sinceDays / 7 * 3) {
    recommendations.push("Frequência de publicação baixa para o período. Recomenda-se ao menos 3-5 posts/semana para manter alcance.");
  }
  if (topPosts.length > 0 && topPosts[0].views > 0) {
    recommendations.push(`Post de maior performance teve ${topPosts[0].views.toLocaleString("pt-BR")} views — analise o que funcionou e replique o formato.`);
  }
  if (kpis.profile_visits > 0 && kpis.website_clicks / kpis.profile_visits < 0.05) {
    recommendations.push("Taxa de cliques do perfil para o site abaixo de 5% — otimize o CTA no link da bio.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Métricas saudáveis no período. Continue a frequência atual e teste novos formatos para escalar.");
  }

  return {
    account,
    period: { since: since.toISOString(), until: until.toISOString(), days: sinceDays },
    topFeed,
    topReels,
    topStories,
    kpis,
    growth: insights,
    reach: insights,
    engagementByType,
    topPosts,
    bestTimeHeatmap,
    demographics,
    postingFrequency,
    recommendations,
  };
}

// Suppress import warning
export const _db_ref = db;
