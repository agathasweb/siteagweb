import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";

/**
 * Ad Sets — nível intermediário da hierarquia Meta Ads.
 *
 * Aqui mora a maior parte da estratégia:
 *  - Orçamento diário (em CENTAVOS)
 *  - Segmentação (geo + age + gender + interests + custom_audiences)
 *  - Otimização (LINK_CLICKS, OFFSITE_CONVERSIONS, etc.)
 *  - Billing event (IMPRESSIONS, LINK_CLICKS)
 *  - Conexão com Pixel pra otimizar conversões
 *
 * Default optimization_goal por objective:
 *   OUTCOME_TRAFFIC      → LINK_CLICKS
 *   OUTCOME_ENGAGEMENT   → POST_ENGAGEMENT
 *   OUTCOME_LEADS        → LEAD_GENERATION
 *   OUTCOME_SALES        → OFFSITE_CONVERSIONS (via Pixel)
 *   OUTCOME_AWARENESS    → REACH
 */

export interface AdSetTargeting {
  /**
   * Geo: array de country codes (BR), regions (ex BR-SP), cities (key id Meta), zip.
   * Mais simples e comum: `geo_locations: { countries: ["BR"] }`.
   */
  geo_locations: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string; radius?: number; distance_unit?: "mile" | "kilometer" }>;
    zips?: Array<{ key: string }>;
  };
  age_min?: number;        // mínimo 13
  age_max?: number;        // máximo 65 (Meta trata 65+ como 65)
  genders?: number[];      // [1]=H, [2]=M, omit=todos
  /** Interesses — array de { id, name } obtidos de /search?type=adinterest */
  interests?: Array<{ id: string; name: string }>;
  /** Comportamentos — array de { id, name } */
  behaviors?: Array<{ id: string; name: string }>;
  /** Custom audiences (visitantes do site, lookalikes) — formato { id }. */
  custom_audiences?: Array<{ id: string }>;
  /** Excluir audiências */
  excluded_custom_audiences?: Array<{ id: string }>;
  /** Idiomas (locales Facebook IDs). Default pra BR é português */
  locales?: number[];
  /** Plataformas onde o anúncio aparece. Default = todos. */
  publisher_platforms?: Array<"facebook" | "instagram" | "audience_network" | "messenger" | "threads">;
  facebook_positions?: string[];
  instagram_positions?: string[];
  /** Targeting otimizado da Meta (Advantage+ Audience). */
  targeting_automation?: { advantage_audience?: 0 | 1 };
}

export type OptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "POST_ENGAGEMENT"
  | "PAGE_LIKES"
  | "LANDING_PAGE_VIEWS"
  | "OFFSITE_CONVERSIONS"
  | "LEAD_GENERATION"
  | "QUALITY_LEAD"
  | "THRUPLAY"
  | "VIDEO_VIEWS";

export type BillingEvent = "IMPRESSIONS" | "LINK_CLICKS" | "THRUPLAY";

export interface CreateAdSetInput {
  ad_account_id: string;           // act_xxx
  campaign_id: string;             // ID Meta da campaign
  name: string;
  status: "ACTIVE" | "PAUSED";
  /** Em CENTAVOS. */
  daily_budget_cents: number;
  /** ISO ou timestamp Meta. */
  start_time?: string;
  end_time?: string;
  optimization_goal: OptimizationGoal;
  billing_event: BillingEvent;
  /** Para OFFSITE_CONVERSIONS ou LANDING_PAGE_VIEWS, precisa do Pixel ID + event_name. */
  pixel_id?: string;
  conversion_event?: string;       // ex.: "Purchase", "Lead"
  /** Página FB (obrigatória pra promote_page) e IG user ID (opcional). */
  promoted_page_id?: string;
  promoted_ig_user_id?: string;
  /** Targeting completo (JSON). */
  targeting: AdSetTargeting;
}

export interface AdSetCreated {
  ok: boolean;
  id?: string;
  error?: string;
  fbtrace_id?: string;
}

export async function createAdSet(input: CreateAdSetInput): Promise<AdSetCreated> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };
  if (input.daily_budget_cents < 1000) {
    // Mín R$ 10/dia — Meta refuta abaixo disso.
    return { ok: false, error: "daily_budget_too_low" };
  }

  const body: Record<string, string> = {
    campaign_id: input.campaign_id,
    name: input.name,
    status: input.status,
    daily_budget: String(input.daily_budget_cents),
    optimization_goal: input.optimization_goal,
    billing_event: input.billing_event,
    targeting: JSON.stringify(input.targeting),
  };

  if (input.start_time) body.start_time = input.start_time;
  if (input.end_time) body.end_time = input.end_time;

  // Promoted object — obrigatório dependendo do optimization_goal
  if (input.optimization_goal === "OFFSITE_CONVERSIONS" || input.optimization_goal === "LANDING_PAGE_VIEWS") {
    if (input.pixel_id && input.conversion_event) {
      body.promoted_object = JSON.stringify({
        pixel_id: input.pixel_id,
        custom_event_type: input.conversion_event,
      });
    } else if (input.pixel_id) {
      body.promoted_object = JSON.stringify({ pixel_id: input.pixel_id });
    }
  } else if (input.optimization_goal === "PAGE_LIKES" && input.promoted_page_id) {
    body.promoted_object = JSON.stringify({ page_id: input.promoted_page_id });
  } else if (
    (input.optimization_goal === "POST_ENGAGEMENT" ||
      input.optimization_goal === "LINK_CLICKS" ||
      input.optimization_goal === "REACH" ||
      input.optimization_goal === "IMPRESSIONS") &&
    input.promoted_page_id
  ) {
    // Página é a entidade promovida quando não é conversão direta
    body.promoted_object = JSON.stringify({ page_id: input.promoted_page_id });
  }

  const r = await metaGraph.post<{ id?: string }>(
    token,
    `${input.ad_account_id}/adsets`,
    body,
  );
  if (!r.ok || !r.json.id) {
    return { ok: false, error: r.error ?? "create_failed", fbtrace_id: r.fbtrace_id };
  }
  return { ok: true, id: r.json.id, fbtrace_id: r.fbtrace_id };
}

/** Sugere optimization_goal + billing_event sensatos para cada objetivo. */
export function defaultsForObjective(objective: string): {
  optimization_goal: OptimizationGoal;
  billing_event: BillingEvent;
} {
  switch (objective) {
    case "OUTCOME_TRAFFIC":     return { optimization_goal: "LINK_CLICKS", billing_event: "LINK_CLICKS" };
    case "OUTCOME_ENGAGEMENT":  return { optimization_goal: "POST_ENGAGEMENT", billing_event: "IMPRESSIONS" };
    case "OUTCOME_LEADS":       return { optimization_goal: "LEAD_GENERATION", billing_event: "IMPRESSIONS" };
    case "OUTCOME_SALES":       return { optimization_goal: "OFFSITE_CONVERSIONS", billing_event: "IMPRESSIONS" };
    case "OUTCOME_AWARENESS":   return { optimization_goal: "REACH", billing_event: "IMPRESSIONS" };
    default:                    return { optimization_goal: "LINK_CLICKS", billing_event: "IMPRESSIONS" };
  }
}

/** Busca interesses pelo nome (pra autocomplete no wizard). */
export async function searchInterests(query: string): Promise<Array<{ id: string; name: string; audience_size_lower?: number }>> {
  const token = getSocialAccessToken();
  if (!token) return [];

  const r = await metaGraph.get<{ data?: Array<{ id: string; name: string; audience_size_lower_bound?: number }> }>(
    token,
    "search",
    { type: "adinterest", q: query, limit: 20 },
  );
  if (!r.ok) return [];
  return (r.json.data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    audience_size_lower: i.audience_size_lower_bound,
  }));
}

/** Busca cidades pelo nome (pra geo targeting). */
export async function searchCities(query: string): Promise<Array<{ key: string; name: string; country_code: string; region: string }>> {
  const token = getSocialAccessToken();
  if (!token) return [];
  const r = await metaGraph.get<{ data?: Array<{ key: string; name: string; country_code: string; region: string }> }>(
    token,
    "search",
    { type: "adgeolocation", q: query, location_types: '["city"]', limit: 15 },
  );
  if (!r.ok) return [];
  return r.json.data ?? [];
}
