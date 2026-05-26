"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import {
  createSocialAccount,
  getSocialAccountByIgUserId,
  updateSocialAccountSnapshot,
  deleteSocialAccount,
  listSocialAccounts,
} from "@/lib/db/social-accounts";
import { cancelScheduledPost } from "@/lib/db/social-scheduled";

/**
 * Descobre automaticamente todas as contas IG ligadas ao token social.
 *
 * Chama `/me/accounts` (lista de páginas FB) e expande
 * `instagram_business_account` em cada uma. Cria/atualiza no DB local.
 */
export async function discoverAccountsAction(): Promise<{
  ok: boolean;
  found: number;
  created: number;
  updated: number;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, found: 0, created: 0, updated: 0, error: "unauthorized" };

  const token = getSocialAccessToken();
  if (!token) return { ok: false, found: 0, created: 0, updated: 0, error: "no_social_token" };

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
    return { ok: false, found: 0, created: 0, updated: 0, error: r.error };
  }

  let created = 0;
  let updated = 0;
  let found = 0;

  for (const page of r.json.data ?? []) {
    const ig = page.instagram_business_account;
    if (!ig?.id) continue;
    found++;

    const existing = getSocialAccountByIgUserId(ig.id);
    if (existing) {
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

  revalidatePath("/admin/social", "layout");
  return { ok: true, found, created, updated };
}

export async function deleteAccountAction(id: number): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  deleteSocialAccount(id);
  revalidatePath("/admin/social", "layout");
  return { ok: true };
}

export async function cancelScheduledAction(id: number): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  cancelScheduledPost(id);
  revalidatePath("/admin/social", "layout");
  return { ok: true };
}

export async function listAccountsAction() {
  const session = await auth();
  if (!session?.user) return [];
  return listSocialAccounts();
}
