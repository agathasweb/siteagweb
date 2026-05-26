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

export async function discoverAdsAccountsAction(): Promise<{
  ok: boolean;
  found: number;
  errors: string[];
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, found: 0, errors: ["unauthorized"] };
  const r = await syncAdAccountsToDb();
  revalidatePath("/admin/social/ads/contas");
  return { ok: true, ...r };
}

export async function toggleAdsAccountAction(
  ad_account_id: string,
  ativo: boolean,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  setAdsAccountActive(ad_account_id, ativo);
  revalidatePath("/admin/social/ads", "layout");
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
  revalidatePath("/admin/social/ads", "layout");
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
  revalidatePath("/admin/social/ads", "layout");
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
  revalidatePath("/admin/social/ads", "layout");
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
  revalidatePath("/admin/social/ads", "layout");
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
  revalidatePath("/admin/social/ads", "layout");
  return { ok: true, totalUpdated, errors };
}
