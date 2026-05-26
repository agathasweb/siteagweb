import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";

/**
 * Campanhas Meta — operações no nível superior da hierarquia.
 *
 * Hierarquia Meta Ads:
 *   AdAccount (act_xxx) → Campaign → AdSet → Ad
 *
 * Esse módulo trata só Campaign. AdSet em adsets.ts, Ad em ads.ts.
 *
 * Objetivos suportados (ODAX — novo modelo da Meta v18+):
 *  - OUTCOME_AWARENESS   (alcance/reconhecimento)
 *  - OUTCOME_TRAFFIC     (cliques pro site)
 *  - OUTCOME_ENGAGEMENT  (curtidas/comentários/views)
 *  - OUTCOME_LEADS       (formulários de lead, mensagens)
 *  - OUTCOME_APP_PROMOTION
 *  - OUTCOME_SALES       (compras via Pixel)
 *
 * SAFETY:
 *  - `lifetime_spend_cap` em CENTAVOS é OBRIGATÓRIO em createCampaign.
 *  - Status default PAUSED — Meta a respeita até troca explícita.
 */

export type CampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

export type CampaignStatusMeta = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface CreateCampaignInput {
  ad_account_id: string;             // act_xxx
  name: string;
  objective: CampaignObjective;
  status: "ACTIVE" | "PAUSED";       // recomendado PAUSED
  /** Teto absoluto em CENTAVOS — Meta para campanha quando atinge. */
  spend_cap_cents: number;
  /** Buying type — AUCTION é o default. */
  buying_type?: "AUCTION";
  /** Special ad categories (housing, credit, employment) — null pra normal. */
  special_ad_categories?: string[];
}

export interface CampaignCreated {
  ok: boolean;
  id?: string;
  error?: string;
  fbtrace_id?: string;
  raw?: unknown;
}

/** POST /act_xxx/campaigns — cria campanha com spend_cap obrigatório. */
export async function createCampaign(input: CreateCampaignInput): Promise<CampaignCreated> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };
  if (!input.spend_cap_cents || input.spend_cap_cents < 5000) {
    // Mínimo R$ 50 (5000 centavos) por segurança.
    return { ok: false, error: "spend_cap_cents_too_low" };
  }

  // Meta exige `special_ad_categories` como JSON array stringificado quando
  // enviado via form-data ou JSON com Content-Type: application/json. Aqui
  // serializamos manualmente pra compatibilidade.
  const body: Record<string, string | number | boolean> = {
    name: input.name,
    objective: input.objective,
    status: input.status,
    buying_type: input.buying_type ?? "AUCTION",
    spend_cap: String(input.spend_cap_cents),
    special_ad_categories: JSON.stringify(input.special_ad_categories ?? []),
  };

  const r = await metaGraph.post<{ id?: string }>(
    token,
    `${input.ad_account_id}/campaigns`,
    body,
  );

  if (!r.ok || !r.json.id) {
    return { ok: false, error: r.error ?? "create_failed", fbtrace_id: r.fbtrace_id, raw: r.json };
  }
  return { ok: true, id: r.json.id, fbtrace_id: r.fbtrace_id, raw: r.json };
}

export interface CampaignRaw {
  id: string;
  name?: string;
  status?: CampaignStatusMeta;
  effective_status?: string;
  objective?: string;
  buying_type?: string;
  daily_budget?: string;        // centavos
  lifetime_budget?: string;     // centavos
  spend_cap?: string;           // centavos
  start_time?: string;
  stop_time?: string;
  created_time?: string;
  updated_time?: string;
}

/** Lista campanhas de uma ad account. */
export async function listCampaignsFromMeta(
  ad_account_id: string,
  options: { fields?: string; limit?: number; effective_status?: CampaignStatusMeta[] } = {},
): Promise<CampaignRaw[]> {
  const token = getSocialAccessToken();
  if (!token) return [];

  const fields =
    options.fields ??
    "id,name,status,effective_status,objective,buying_type,daily_budget,lifetime_budget,spend_cap,start_time,stop_time,created_time,updated_time";
  const params: Record<string, string | number> = { fields, limit: options.limit ?? 50 };
  if (options.effective_status) {
    params.effective_status = JSON.stringify(options.effective_status);
  }

  const r = await metaGraph.get<{ data?: CampaignRaw[] }>(
    token,
    `${ad_account_id}/campaigns`,
    params,
  );
  if (!r.ok) {
    console.error("[meta-ads:campaigns] list:", r.error);
    return [];
  }
  return r.json.data ?? [];
}

/** Pausa, reativa ou arquiva campanha. Delete é separado (DELETE HTTP). */
export async function setCampaignStatus(
  campaign_id: string,
  status: "ACTIVE" | "PAUSED" | "ARCHIVED",
): Promise<{ ok: boolean; error?: string; fbtrace_id?: string }> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };

  const r = await metaGraph.post<{ success?: boolean }>(
    token,
    campaign_id,
    { status },
  );
  if (!r.ok) return { ok: false, error: r.error, fbtrace_id: r.fbtrace_id };
  return { ok: true, fbtrace_id: r.fbtrace_id };
}

/** Edita budget diário ou spend cap de uma campanha existente. */
export async function updateCampaignBudget(
  campaign_id: string,
  patch: { daily_budget_cents?: number; spend_cap_cents?: number },
): Promise<{ ok: boolean; error?: string }> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };

  const body: Record<string, string> = {};
  if (patch.daily_budget_cents !== undefined) body.daily_budget = String(patch.daily_budget_cents);
  if (patch.spend_cap_cents !== undefined) body.spend_cap = String(patch.spend_cap_cents);

  const r = await metaGraph.post<{ success?: boolean }>(token, campaign_id, body);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

/** Deleta a campanha (DELETE HTTP — equivalente a status=DELETED). */
export async function deleteCampaign(
  campaign_id: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getSocialAccessToken();
  if (!token) return { ok: false, error: "no_social_token" };
  // Graph API: POST com method=DELETE OU status=DELETED. Vamos pela 2ª via.
  const r = await metaGraph.post<{ success?: boolean }>(token, campaign_id, {
    status: "DELETED",
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}
