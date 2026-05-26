import "server-only";
import { db } from "./index";

export type SocialProvider = "instagram" | "linkedin";

export interface SocialAccountRow {
  id: number;
  provider: SocialProvider;
  display_name: string;
  username: string;
  profile_picture_url: string | null;
  ig_user_id: string | null;
  fb_page_id: string | null;
  linkedin_org_urn: string | null;
  linkedin_person_urn: string | null;
  linkedin_token: string | null;
  linkedin_token_expires_at: string | null;
  followers_count: number;
  media_count: number;
  ativo: number;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSocialAccount {
  provider: SocialProvider;
  display_name: string;
  username: string;
  profile_picture_url?: string | null;
  ig_user_id?: string | null;
  fb_page_id?: string | null;
  linkedin_org_urn?: string | null;
  linkedin_person_urn?: string | null;
  linkedin_token?: string | null;
  linkedin_token_expires_at?: string | null;
  followers_count?: number;
  media_count?: number;
}

const insertStmt = db.prepare(`
  INSERT INTO social_accounts (
    provider, display_name, username, profile_picture_url,
    ig_user_id, fb_page_id,
    linkedin_org_urn, linkedin_person_urn, linkedin_token, linkedin_token_expires_at,
    followers_count, media_count
  ) VALUES (
    @provider, @display_name, @username, @profile_picture_url,
    @ig_user_id, @fb_page_id,
    @linkedin_org_urn, @linkedin_person_urn, @linkedin_token, @linkedin_token_expires_at,
    @followers_count, @media_count
  )
`);

export function createSocialAccount(input: CreateSocialAccount): number {
  const info = insertStmt.run({
    ...input,
    profile_picture_url: input.profile_picture_url ?? null,
    ig_user_id: input.ig_user_id ?? null,
    fb_page_id: input.fb_page_id ?? null,
    linkedin_org_urn: input.linkedin_org_urn ?? null,
    linkedin_person_urn: input.linkedin_person_urn ?? null,
    linkedin_token: input.linkedin_token ?? null,
    linkedin_token_expires_at: input.linkedin_token_expires_at ?? null,
    followers_count: input.followers_count ?? 0,
    media_count: input.media_count ?? 0,
  });
  return Number(info.lastInsertRowid);
}

export function listSocialAccounts(): SocialAccountRow[] {
  return db
    .prepare(`SELECT * FROM social_accounts WHERE ativo = 1 ORDER BY provider, username`)
    .all() as SocialAccountRow[];
}

export function getSocialAccount(id: number): SocialAccountRow | null {
  return (db
    .prepare(`SELECT * FROM social_accounts WHERE id = ?`)
    .get(id) as SocialAccountRow | undefined) ?? null;
}

export function getSocialAccountByIgUserId(igUserId: string): SocialAccountRow | null {
  return (db
    .prepare(`SELECT * FROM social_accounts WHERE provider = 'instagram' AND ig_user_id = ?`)
    .get(igUserId) as SocialAccountRow | undefined) ?? null;
}

export function updateSocialAccountSnapshot(
  id: number,
  patch: {
    profile_picture_url?: string | null;
    followers_count?: number;
    media_count?: number;
    last_sync_at?: string;
  },
): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.profile_picture_url !== undefined) {
    sets.push("profile_picture_url = @profile_picture_url");
    params.profile_picture_url = patch.profile_picture_url;
  }
  if (patch.followers_count !== undefined) {
    sets.push("followers_count = @followers_count");
    params.followers_count = patch.followers_count;
  }
  if (patch.media_count !== undefined) {
    sets.push("media_count = @media_count");
    params.media_count = patch.media_count;
  }
  if (patch.last_sync_at !== undefined) {
    sets.push("last_sync_at = @last_sync_at");
    params.last_sync_at = patch.last_sync_at;
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  db.prepare(
    `UPDATE social_accounts SET ${sets.join(", ")} WHERE id = @id`,
  ).run(params);
}

/**
 * Soft delete — marca como inativa (ativo=0) em vez de deletar do banco.
 *
 * Razão: o "Descobrir contas" é idempotente e re-cria qualquer conta IG que o
 * token enxerga. Se fizéssemos DELETE, ao clicar "Descobrir" de novo as contas
 * removidas voltariam. Mantendo o registro com ativo=0, `getSocialAccountByIgUserId`
 * ainda acha → discoverAccountsAction respeita a decisão do admin.
 *
 * Para "trazer de volta" uma conta inativa, use `reactivateSocialAccount`.
 */
export function deleteSocialAccount(id: number): void {
  db.prepare(
    `UPDATE social_accounts SET ativo = 0, updated_at = datetime('now') WHERE id = ?`,
  ).run(id);
}

/** Reativa uma conta previamente removida. */
export function reactivateSocialAccount(id: number): void {
  db.prepare(
    `UPDATE social_accounts SET ativo = 1, updated_at = datetime('now') WHERE id = ?`,
  ).run(id);
}

/** Lista inclui inativas — útil pra tela "removidas" do admin. */
export function listAllSocialAccounts(): SocialAccountRow[] {
  return db
    .prepare(`SELECT * FROM social_accounts ORDER BY ativo DESC, provider, username`)
    .all() as SocialAccountRow[];
}
