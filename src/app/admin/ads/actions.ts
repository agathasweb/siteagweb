"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { syncAdAccountsToDb } from "@/lib/meta-ads/accounts";
import { setAdsAccountActive } from "@/lib/db/ads-accounts";
import {
  setCampaignStatus,
  deleteCampaign as deleteCampaignMeta,
  updateCampaignBudget,
} from "@/lib/meta-ads/campaigns";
import {
  updateCampaignStatusLocal,
  getCampaignByExternalId,
} from "@/lib/db/ads-campaigns";
import { logAdsAction } from "@/lib/db/ads-action-log";
import { syncCampaignsMetricsToDb } from "@/lib/meta-ads/insights";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import {
  createSocialAccount,
  getSocialAccountByIgUserId,
  updateSocialAccountSnapshot,
  deleteSocialAccount,
  reactivateSocialAccount,
} from "@/lib/db/social-accounts";

export async function discoverAdsAccountsAction(): Promise<{
  ok: boolean;
  found: number;
  errors: string[];
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, found: 0, errors: ["unauthorized"] };
  const r = await syncAdAccountsToDb();
  revalidatePath("/admin/ads/contas");
  return { ok: true, ...r };
}

export async function toggleAdsAccountAction(
  ad_account_id: string,
  ativo: boolean,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  setAdsAccountActive(ad_account_id, ativo);
  revalidatePath("/admin/ads", "layout");
  return { ok: true };
}

async function userMeta(): Promise<{ user_id: number | null; user_email: string | null }> {
  const session = await auth();
  return {
    user_id: null, // Auth.js no projeto não expõe `id` direto — só email basta pra audit
    user_email: session?.user?.email ?? null,
  };
}

export async function pauseCampaignAction(
  external_id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };
  const camp = getCampaignByExternalId(external_id);
  const meta = await userMeta();

  const r = await setCampaignStatus(external_id, "PAUSED");
  logAdsAction({
    action: "pause_campaign",
    ad_account_id: camp?.ad_account_id ?? null,
    campaign_id: external_id,
    payload: { external_id, status: "PAUSED" },
    response: r,
    success: r.ok,
    error_message: r.error,
    fbtrace_id: r.fbtrace_id ?? null,
    ...meta,
  });
  if (r.ok) updateCampaignStatusLocal(external_id, "PAUSED");
  revalidatePath("/admin/ads", "layout");
  return { ok: r.ok, error: r.error };
}

export async function resumeCampaignAction(
  external_id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };
  const camp = getCampaignByExternalId(external_id);
  const meta = await userMeta();

  const r = await setCampaignStatus(external_id, "ACTIVE");
  logAdsAction({
    action: "resume_campaign",
    ad_account_id: camp?.ad_account_id ?? null,
    campaign_id: external_id,
    payload: { external_id, status: "ACTIVE" },
    response: r,
    success: r.ok,
    error_message: r.error,
    fbtrace_id: r.fbtrace_id ?? null,
    ...meta,
  });
  if (r.ok) updateCampaignStatusLocal(external_id, "ACTIVE");
  revalidatePath("/admin/ads", "layout");
  return { ok: r.ok, error: r.error };
}

export async function deleteCampaignAction(
  external_id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };
  const camp = getCampaignByExternalId(external_id);
  const meta = await userMeta();

  const r = await deleteCampaignMeta(external_id);
  logAdsAction({
    action: "delete_campaign",
    ad_account_id: camp?.ad_account_id ?? null,
    campaign_id: external_id,
    payload: { external_id },
    response: r,
    success: r.ok,
    error_message: r.error,
    ...meta,
  });
  if (r.ok) updateCampaignStatusLocal(external_id, "DELETED");
  revalidatePath("/admin/ads", "layout");
  return { ok: r.ok, error: r.error };
}

export async function updateCampaignBudgetAction(
  external_id: string,
  patch: { daily_budget_brl?: number; spend_cap_brl?: number },
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" };

  // Spend cap só pode SUBIR (segurança — admin não baixa por engano).
  const camp = getCampaignByExternalId(external_id);
  if (patch.spend_cap_brl !== undefined && camp && patch.spend_cap_brl < camp.spend_cap_brl) {
    return { ok: false, error: "spend_cap_only_increases" };
  }

  const cents: { daily_budget_cents?: number; spend_cap_cents?: number } = {};
  if (patch.daily_budget_brl !== undefined) cents.daily_budget_cents = Math.round(patch.daily_budget_brl * 100);
  if (patch.spend_cap_brl !== undefined) cents.spend_cap_cents = Math.round(patch.spend_cap_brl * 100);

  const meta = await userMeta();
  const r = await updateCampaignBudget(external_id, cents);
  logAdsAction({
    action: "edit_budget",
    ad_account_id: camp?.ad_account_id ?? null,
    campaign_id: external_id,
    payload: patch,
    response: r,
    success: r.ok,
    error_message: r.error,
    ...meta,
  });
  revalidatePath("/admin/ads", "layout");
  return { ok: r.ok, error: r.error };
}

/** Triggera sync manual de insights de TODAS contas gerenciadas. */
export async function syncInsightsNowAction(): Promise<{
  ok: boolean;
  totalUpdated: number;
  errors: string[];
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, totalUpdated: 0, errors: ["unauthorized"] };

  const accounts = listManagedAdsAccounts();
  let totalUpdated = 0;
  const errors: string[] = [];
  for (const a of accounts) {
    const r = await syncCampaignsMetricsToDb(a.ad_account_id, "last_30d");
    totalUpdated += r.updated;
    errors.push(...r.errors.map((e) => `${a.ad_account_id}: ${e}`));
  }
  revalidatePath("/admin/ads", "layout");
  return { ok: true, totalUpdated, errors };
}

/* ---------------------------------------------------------------------------
 * Contas Instagram/Facebook
 *
 * O wizard de nova campanha precisa do `ig_user_id` + `fb_page_id` pra montar
 * o criativo, então o cadastro de contas sociais vive aqui desde que o painel
 * /admin/social foi removido (agendamento e relatórios migraram pro Yeshua).
 * ------------------------------------------------------------------------ */

export async function discoverAccountsAction(): Promise<{
  ok: boolean;
  found: number;
  created: number;
  updated: number;
  skipped: number;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, found: 0, created: 0, updated: 0, skipped: 0, error: "unauthorized" };

  const token = getSocialAccessToken();
  if (!token) return { ok: false, found: 0, created: 0, updated: 0, skipped: 0, error: "no_social_token" };

  const r = await metaGraph.get<{
    data?: Array<{
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username: string;
        name?: string;
        followers_count?: number;
        media_count?: number;
        profile_picture_url?: string;
      };
    }>;
  }>(token, "me/accounts", {
    fields: "id,name,instagram_business_account{id,username,name,followers_count,media_count,profile_picture_url}",
    limit: 100,
  });

  if (!r.ok) {
    return { ok: false, found: 0, created: 0, updated: 0, skipped: 0, error: r.error };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let found = 0;

  for (const page of r.json.data ?? []) {
    const ig = page.instagram_business_account;
    if (!ig?.id) continue;
    found++;

    const existing = getSocialAccountByIgUserId(ig.id);
    if (existing) {
      if (existing.ativo === 0) {
        // Conta foi removida pelo admin — NÃO reativa automaticamente.
        skipped++;
        continue;
      }
      updateSocialAccountSnapshot(existing.id, {
        followers_count: ig.followers_count,
        media_count: ig.media_count,
        profile_picture_url: ig.profile_picture_url,
        last_sync_at: new Date().toISOString(),
      });
      updated++;
    } else {
      createSocialAccount({
        provider: "instagram",
        display_name: ig.name ?? page.name,
        username: ig.username,
        ig_user_id: ig.id,
        fb_page_id: page.id,
        profile_picture_url: ig.profile_picture_url,
        followers_count: ig.followers_count,
        media_count: ig.media_count,
      });
      created++;
    }
  }

  revalidatePath("/admin/ads", "layout");
  return { ok: true, found, created, updated, skipped };
}

export async function deleteAccountAction(id: number): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  deleteSocialAccount(id); // soft delete — marca ativo=0, mantém no DB
  revalidatePath("/admin/ads", "layout");
  return { ok: true };
}

export async function reactivateAccountAction(id: number): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  reactivateSocialAccount(id);
  revalidatePath("/admin/ads", "layout");
  return { ok: true };
}
