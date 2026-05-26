"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getNumberSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import { createCampaign, type CampaignObjective } from "@/lib/meta-ads/campaigns";
import { createAdSet, defaultsForObjective, type AdSetTargeting } from "@/lib/meta-ads/adsets";
import { createAd, uploadAdImage, uploadAdImageFromPath } from "@/lib/meta-ads/ads";
import { upsertAdsCampaign } from "@/lib/db/ads-campaigns";
import { getAdsAccountById } from "@/lib/db/ads-accounts";
import { logAdsAction } from "@/lib/db/ads-action-log";
import { META_PIXEL_ID } from "@/lib/meta/config";

export interface CreateFullCampaignInput {
  ad_account_id: string;
  name: string;
  objective: CampaignObjective;
  status: "ACTIVE" | "PAUSED";
  daily_budget_brl: number;
  spend_cap_brl: number;
  start_time?: string;
  end_time?: string;
  // Targeting
  countries: string[];
  age_min: number;
  age_max: number;
  genders: number[];
  city_keys: string[];
  interest_ids: Array<{ id: string; name: string }>;
  // Creative
  creative_mode: "boost" | "new";
  ig_post_id?: string;        // pra boost (formato 17841... ou _ separado)
  page_id?: string;
  ig_user_id?: string;
  image_path?: string;        // /uploads/social/...
  message?: string;
  link?: string;
  headline?: string;
  description?: string;
  cta?: string;               // ex.: LEARN_MORE, SHOP_NOW
  // UTMs
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CreateFullCampaignResult {
  ok: boolean;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  error?: string;
  step?: string;
}

/**
 * Cria a stack completa (Campaign + AdSet + Ad) numa única action.
 *
 * Validações de safety obrigatórias:
 *  - spend_cap_brl >= getNumberSetting(adsMinSpendCapBrl, 50)
 *  - daily_budget_brl <= getNumberSetting(adsMaxDailyBudgetBrl, 500)
 *  - daily_budget_brl >= 10 (mínimo Meta)
 *
 * Tudo audit logado em ads_action_log.
 */
export async function createFullCampaignAction(
  input: CreateFullCampaignInput,
): Promise<CreateFullCampaignResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };
  const userEmail = session.user.email ?? null;

  // ---- Guard rails ----
  const minCap = getNumberSetting(SETTINGS_KEYS.adsMinSpendCapBrl, 50);
  const maxDaily = getNumberSetting(SETTINGS_KEYS.adsMaxDailyBudgetBrl, 500);
  if (input.spend_cap_brl < minCap) {
    return { ok: false, error: `Spend cap mínimo: R$ ${minCap.toFixed(2)}` };
  }
  if (input.daily_budget_brl > maxDaily) {
    return { ok: false, error: `Budget diário máximo: R$ ${maxDaily.toFixed(2)} (override em /admin/settings)` };
  }
  if (input.daily_budget_brl < 10) {
    return { ok: false, error: "Budget diário mínimo: R$ 10,00" };
  }

  const acc = getAdsAccountById(input.ad_account_id);
  if (!acc || acc.ativo !== 1) {
    return { ok: false, error: "Ad account não gerenciada" };
  }

  const audit = { ad_account_id: input.ad_account_id, user_email: userEmail };

  // ---- Step 1: Campaign ----
  const campR = await createCampaign({
    ad_account_id: input.ad_account_id,
    name: input.name,
    objective: input.objective,
    status: input.status,
    spend_cap_cents: Math.round(input.spend_cap_brl * 100),
  });
  logAdsAction({
    ...audit,
    action: "create_campaign",
    campaign_id: campR.id ?? null,
    payload: { name: input.name, objective: input.objective, status: input.status, spend_cap_brl: input.spend_cap_brl },
    response: campR,
    success: campR.ok,
    error_message: campR.error,
    fbtrace_id: campR.fbtrace_id ?? null,
  });
  if (!campR.ok || !campR.id) return { ok: false, error: campR.error ?? "campaign_creation_failed", step: "campaign" };
  const campaign_id = campR.id;

  // Persiste mirror local imediatamente
  upsertAdsCampaign({
    ad_account_id: input.ad_account_id,
    external_id: campaign_id,
    name: input.name,
    objective: input.objective,
    status: input.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
    daily_budget_brl: input.daily_budget_brl,
    spend_cap_brl: input.spend_cap_brl,
    start_time: input.start_time ?? null,
    stop_time: input.end_time ?? null,
    created_at_meta: new Date().toISOString(),
  });

  // ---- Step 2: AdSet ----
  const targeting: AdSetTargeting = {
    geo_locations: {
      countries: input.countries.length ? input.countries : ["BR"],
      ...(input.city_keys.length ? { cities: input.city_keys.map((key) => ({ key })) } : {}),
    },
    age_min: input.age_min,
    age_max: input.age_max,
    ...(input.genders.length ? { genders: input.genders } : {}),
    ...(input.interest_ids.length
      ? { interests: input.interest_ids.map((i) => ({ id: i.id, name: i.name })) }
      : {}),
    publisher_platforms: ["facebook", "instagram"],
    targeting_automation: { advantage_audience: 1 },
  };

  const defaults = defaultsForObjective(input.objective);
  const adsetR = await createAdSet({
    ad_account_id: input.ad_account_id,
    campaign_id,
    name: `${input.name} - Conjunto 1`,
    status: input.status,
    daily_budget_cents: Math.round(input.daily_budget_brl * 100),
    optimization_goal: defaults.optimization_goal,
    billing_event: defaults.billing_event,
    pixel_id: input.objective === "OUTCOME_SALES" || input.objective === "OUTCOME_LEADS" ? META_PIXEL_ID : undefined,
    conversion_event: input.objective === "OUTCOME_SALES" ? "Purchase" : input.objective === "OUTCOME_LEADS" ? "Lead" : undefined,
    promoted_page_id: input.page_id,
    promoted_ig_user_id: input.ig_user_id,
    start_time: input.start_time,
    end_time: input.end_time,
    targeting,
  });
  logAdsAction({
    ...audit,
    action: "create_adset",
    campaign_id,
    payload: { campaign_id, targeting, optimization_goal: defaults.optimization_goal },
    response: adsetR,
    success: adsetR.ok,
    error_message: adsetR.error,
    fbtrace_id: adsetR.fbtrace_id ?? null,
  });
  if (!adsetR.ok || !adsetR.id) {
    return { ok: false, error: adsetR.error ?? "adset_creation_failed", step: "adset", campaign_id };
  }
  const adset_id = adsetR.id;

  // ---- Step 3: Ad ----
  // Construir URL final com UTMs (integra com nosso CAPI/Pixel!)
  const utmParts: string[] = [];
  if (input.utm_source) utmParts.push(`utm_source=${encodeURIComponent(input.utm_source)}`);
  if (input.utm_medium) utmParts.push(`utm_medium=${encodeURIComponent(input.utm_medium)}`);
  if (input.utm_campaign) utmParts.push(`utm_campaign=${encodeURIComponent(input.utm_campaign)}`);
  let finalLink = input.link ?? "";
  if (utmParts.length && finalLink) {
    finalLink += (finalLink.includes("?") ? "&" : "?") + utmParts.join("&");
  }

  let adR: { ok: boolean; id?: string; error?: string; fbtrace_id?: string };
  if (input.creative_mode === "boost" && input.ig_post_id && input.page_id) {
    adR = await createAd({
      ad_account_id: input.ad_account_id,
      adset_id,
      name: `${input.name} - Anúncio (boost)`,
      status: input.status,
      object_story_id: `${input.page_id}_${input.ig_post_id}`,
    });
  } else if (input.creative_mode === "new" && input.page_id && input.image_path && input.message && finalLink) {
    // 1) sobe imagem pra biblioteca da ad account
    const publicBase = process.env.SOCIAL_PUBLIC_BASE_URL?.trim() || "https://agathas.com.br";
    const absUrl = input.image_path.startsWith("http") ? input.image_path : publicBase + input.image_path;
    let img = await uploadAdImage(input.ad_account_id, absUrl);
    if (!img.ok) {
      // fallback: enviar bytes (caso a Meta não consiga fetch)
      img = await uploadAdImageFromPath(input.ad_account_id, input.image_path);
    }
    if (!img.ok || !img.hash) {
      logAdsAction({
        ...audit,
        action: "upload_image",
        campaign_id,
        payload: { image_path: input.image_path },
        response: img,
        success: false,
        error_message: img.error,
      });
      return { ok: false, error: `Falha no upload da imagem: ${img.error}`, step: "image" };
    }

    adR = await createAd({
      ad_account_id: input.ad_account_id,
      adset_id,
      name: `${input.name} - Anúncio`,
      status: input.status,
      creative: {
        page_id: input.page_id,
        instagram_actor_id: input.ig_user_id,
        image_hash: img.hash,
        link: finalLink,
        message: input.message,
        name: input.headline,
        description: input.description,
        call_to_action: input.cta ? { type: input.cta, value: { link: finalLink } } : undefined,
      },
    });
  } else {
    return { ok: false, error: "Configuração de criativo incompleta", step: "ad" };
  }

  logAdsAction({
    ...audit,
    action: "create_ad",
    campaign_id,
    payload: { adset_id, mode: input.creative_mode },
    response: adR,
    success: adR.ok,
    error_message: adR.error,
    fbtrace_id: adR.fbtrace_id ?? null,
  });
  if (!adR.ok || !adR.id) {
    return { ok: false, error: adR.error ?? "ad_creation_failed", step: "ad", campaign_id, adset_id };
  }

  revalidatePath("/admin/social/ads", "layout");
  return { ok: true, campaign_id, adset_id, ad_id: adR.id };
}

/** Helper pra autocomplete no wizard. */
export async function searchInterestsAction(q: string) {
  const session = await auth();
  if (!session?.user || !q || q.length < 2) return [];
  const { searchInterests } = await import("@/lib/meta-ads/adsets");
  return searchInterests(q);
}

export async function searchCitiesAction(q: string) {
  const session = await auth();
  if (!session?.user || !q || q.length < 2) return [];
  const { searchCities } = await import("@/lib/meta-ads/adsets");
  return searchCities(q);
}

export async function listIgPostsAction(ig_user_id: string) {
  const session = await auth();
  if (!session?.user) return [];
  const { listBoostableIgPosts } = await import("@/lib/meta-ads/ads");
  return listBoostableIgPosts(ig_user_id);
}
