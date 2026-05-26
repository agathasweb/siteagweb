import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import { upsertAdsAccount } from "@/lib/db/ads-accounts";

/**
 * Descoberta de ad accounts acessíveis pelo System User Token.
 *
 * Lista TODAS as contas (13 no caso da Agathas, incluindo clientes), mas o
 * admin escolhe explicitamente quais ativar para gestão via painel (flag
 * `ativo` em `ads_accounts`).
 */

export interface DiscoveredAdAccount {
  ad_account_id: string;          // act_xxxxx
  name: string;
  account_status: number;          // 1=ATIVA, 2=DISABLED, 3=CLOSED, 7=PENDING_REVIEW
  currency: string;
  timezone_name?: string;
  business?: { id: string; name: string };
  amount_spent: number;            // já em REAIS (Meta retorna em centavos)
  balance: number;                 // saldo pré-pago, já em REAIS
}

interface RawAdAccount {
  id: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  business?: { id: string; name: string };
  amount_spent?: string;
  balance?: string;
}

/** Lista todas as ad accounts acessíveis via me/adaccounts. */
export async function listAdAccountsFromMeta(): Promise<DiscoveredAdAccount[]> {
  const token = getSocialAccessToken();
  if (!token) return [];

  const r = await metaGraph.get<{ data?: RawAdAccount[] }>(
    token,
    "me/adaccounts",
    {
      fields: "id,name,account_status,currency,timezone_name,amount_spent,balance,business{id,name}",
      limit: 100,
    },
  );
  if (!r.ok) {
    console.error("[meta-ads:accounts] listAdAccounts falhou:", r.error);
    return [];
  }

  return (r.json.data ?? []).map((a) => ({
    ad_account_id: a.id,
    name: a.name ?? "(sem nome)",
    account_status: a.account_status ?? 0,
    currency: a.currency ?? "BRL",
    timezone_name: a.timezone_name,
    business: a.business,
    amount_spent: parseInt(a.amount_spent ?? "0", 10) / 100,
    balance: parseInt(a.balance ?? "0", 10) / 100,
  }));
}

/** Sincroniza o cache local de ad_accounts (upsert todas as descobertas). */
export async function syncAdAccountsToDb(): Promise<{
  found: number;
  errors: string[];
}> {
  const accounts = await listAdAccountsFromMeta();
  const errors: string[] = [];
  for (const a of accounts) {
    try {
      upsertAdsAccount({
        ad_account_id: a.ad_account_id,
        name: a.name,
        account_status: a.account_status,
        currency: a.currency,
        timezone_name: a.timezone_name ?? null,
        business_id: a.business?.id ?? null,
        business_name: a.business?.name ?? null,
        amount_spent: a.amount_spent,
        balance: a.balance,
      });
    } catch (err) {
      errors.push(
        `upsert ${a.ad_account_id}: ${err instanceof Error ? err.message : "?"}`,
      );
    }
  }
  return { found: accounts.length, errors };
}
