import "server-only";
import { db } from "./index";

/**
 * Queries agregadas pro dashboard /admin/analytics.
 *
 * Fontes:
 *  - `capi_event_log`  → eventos web (PageView, ViewContent, Contact, etc.)
 *  - `leads`           → captures de form WhatsApp/contato
 *  - `subscriptions`   → checkouts ASAAS (InitiateCheckout) + ativações (Subscribe)
 *
 * Todas as funções aceitam `sinceDays` (1 = hoje, 7 = última semana, 30 = mês).
 */

export type Period = "today" | "7d" | "30d";

export function periodToDays(p: Period): number {
  return p === "today" ? 1 : p === "7d" ? 7 : 30;
}

// ---------- Overview cards ----------

export interface OverviewCounts {
  pageviews: number;
  view_content: number;
  contacts: number;
  leads: number;
  checkouts: number;
  subscribes: number;
  revenue_brl: number;
  active_subscriptions: number;
}

export function getOverview(sinceDays: number): OverviewCounts {
  const sql = (event: string) =>
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM capi_event_log
         WHERE event_name = ? AND status = 'sent'
           AND created_at > datetime('now', '-' || ? || ' days')`,
      )
      .get(event, sinceDays) as { c: number };

  const leads = db
    .prepare(
      `SELECT COUNT(*) AS c FROM leads
       WHERE created_at > datetime('now', '-' || ? || ' days')`,
    )
    .get(sinceDays) as { c: number };

  const checkouts = db
    .prepare(
      `SELECT COUNT(*) AS c FROM subscriptions
       WHERE created_at > datetime('now', '-' || ? || ' days')`,
    )
    .get(sinceDays) as { c: number };

  const paid = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(value), 0) AS v FROM subscriptions
       WHERE status IN ('CONFIRMED','RECEIVED')
         AND confirmed_at > datetime('now', '-' || ? || ' days')`,
    )
    .get(sinceDays) as { c: number; v: number };

  const active = db
    .prepare(
      `SELECT COUNT(*) AS c FROM subscriptions
       WHERE status IN ('CONFIRMED','RECEIVED')`,
    )
    .get() as { c: number };

  return {
    pageviews: sql("PageView").c,
    view_content: sql("ViewContent").c,
    contacts: sql("Contact").c,
    leads: leads.c,
    checkouts: checkouts.c,
    subscribes: paid.c,
    revenue_brl: paid.v,
    active_subscriptions: active.c,
  };
}

// ---------- Funil VOYIA ----------

export interface FunnelStep {
  name: string;
  count: number;
  /** Conversão vs a etapa anterior (0-1). null no primeiro passo. */
  conversion_rate: number | null;
}

export function getFunnel(sinceDays: number): FunnelStep[] {
  const o = getOverview(sinceDays);
  const stages: Array<{ name: string; count: number }> = [
    { name: "ViewContent", count: o.view_content },
    { name: "Contact", count: o.contacts },
    { name: "Lead", count: o.leads },
    { name: "InitiateCheckout", count: o.checkouts },
    { name: "Subscribe", count: o.subscribes },
  ];
  return stages.map((s, i) => ({
    ...s,
    conversion_rate:
      i === 0
        ? null
        : stages[i - 1].count === 0
          ? 0
          : s.count / stages[i - 1].count,
  }));
}

// ---------- Atribuição ----------

export interface AttributionBreakdown {
  meta_ads: number; // tem fbclid
  google_ads: number; // tem gclid
  utm_other: number; // tem utm_source mas não é meta/google
  direct: number; // nenhum
}

/**
 * Conta leads + subscriptions por fonte de tráfego baseado em
 * fbclid/gclid/utm_source. Estratégia de classificação:
 *  - fbclid presente → meta_ads (precedência máxima — clicou em anúncio Meta)
 *  - gclid presente → google_ads
 *  - utm_source presente (sem fbclid/gclid) → utm_other
 *  - nada → direct
 */
export function getAttributionBreakdown(sinceDays: number): AttributionBreakdown {
  const row = db
    .prepare(
      `WITH combined AS (
         SELECT fbclid, gclid, utm_source
           FROM leads
          WHERE created_at > datetime('now', '-' || ? || ' days')
         UNION ALL
         SELECT fbclid, gclid, utm_source
           FROM subscriptions
          WHERE created_at > datetime('now', '-' || ? || ' days')
       )
       SELECT
         SUM(CASE WHEN fbclid IS NOT NULL AND fbclid != '' THEN 1 ELSE 0 END) AS meta_ads,
         SUM(CASE WHEN (fbclid IS NULL OR fbclid = '') AND gclid IS NOT NULL AND gclid != '' THEN 1 ELSE 0 END) AS google_ads,
         SUM(CASE WHEN (fbclid IS NULL OR fbclid = '') AND (gclid IS NULL OR gclid = '') AND utm_source IS NOT NULL AND utm_source != '' THEN 1 ELSE 0 END) AS utm_other,
         SUM(CASE WHEN (fbclid IS NULL OR fbclid = '') AND (gclid IS NULL OR gclid = '') AND (utm_source IS NULL OR utm_source = '') THEN 1 ELSE 0 END) AS direct
       FROM combined`,
    )
    .get(sinceDays, sinceDays) as {
    meta_ads: number;
    google_ads: number;
    utm_other: number;
    direct: number;
  };
  return {
    meta_ads: row.meta_ads ?? 0,
    google_ads: row.google_ads ?? 0,
    utm_other: row.utm_other ?? 0,
    direct: row.direct ?? 0,
  };
}

export interface UtmRanking {
  value: string;
  count: number;
}

export function topUtms(
  field: "utm_source" | "utm_medium" | "utm_campaign",
  sinceDays: number,
  limit = 10,
): UtmRanking[] {
  return db
    .prepare(
      `SELECT ${field} AS value, COUNT(*) AS count
       FROM (
         SELECT ${field} FROM leads
          WHERE created_at > datetime('now', '-' || ? || ' days')
            AND ${field} IS NOT NULL AND ${field} != ''
         UNION ALL
         SELECT ${field} FROM subscriptions
          WHERE created_at > datetime('now', '-' || ? || ' days')
            AND ${field} IS NOT NULL AND ${field} != ''
       )
       GROUP BY value
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(sinceDays, sinceDays, limit) as UtmRanking[];
}

// ---------- Performance por plano ----------

export interface PlanPerformance {
  plan_key: string;
  category: string;
  total: number;
  paid: number;
  conversion_rate: number;
  mrr_brl: number;
}

export function planPerformance(sinceDays: number): PlanPerformance[] {
  return db
    .prepare(
      `SELECT
         plan_key,
         category,
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('CONFIRMED','RECEIVED') THEN 1 ELSE 0 END) AS paid,
         COALESCE(SUM(CASE WHEN status IN ('CONFIRMED','RECEIVED') THEN value ELSE 0 END), 0) AS mrr_brl
       FROM subscriptions
       WHERE created_at > datetime('now', '-' || ? || ' days')
       GROUP BY plan_key, category
       ORDER BY paid DESC, total DESC`,
    )
    .all(sinceDays)
    .map((r) => {
      const row = r as Omit<PlanPerformance, "conversion_rate">;
      return {
        ...row,
        conversion_rate: row.total === 0 ? 0 : row.paid / row.total,
      };
    });
}

// ---------- Top origin pages (de onde vêm os leads) ----------

export interface OriginPageStat {
  origin_page: string;
  count: number;
}

export function topOriginPages(sinceDays: number, limit = 10): OriginPageStat[] {
  return db
    .prepare(
      `SELECT origin_page, COUNT(*) AS count
       FROM leads
       WHERE origin_page IS NOT NULL AND origin_page != ''
         AND created_at > datetime('now', '-' || ? || ' days')
       GROUP BY origin_page
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(sinceDays, limit) as OriginPageStat[];
}

// ---------- Série temporal (eventos por dia, p/ gráfico de barras) ----------

export interface DailyCount {
  day: string; // YYYY-MM-DD
  count: number;
}

export function dailyCountsByEvent(eventName: string, sinceDays: number): DailyCount[] {
  return db
    .prepare(
      `SELECT
         substr(created_at, 1, 10) AS day,
         COUNT(*) AS count
       FROM capi_event_log
       WHERE event_name = ? AND status = 'sent'
         AND created_at > datetime('now', '-' || ? || ' days')
       GROUP BY day
       ORDER BY day ASC`,
    )
    .all(eventName, sinceDays) as DailyCount[];
}
