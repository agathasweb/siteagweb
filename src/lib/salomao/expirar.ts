import "server-only";
import { db } from "@/lib/db";
import { deletePayment, deleteSubscription, listSubscriptionPayments } from "@/lib/asaas/client";
import { updateSubscriptionStatus, type SubscriptionRow } from "@/lib/db/subscriptions";

/**
 * Salomão: assinatura do checkout que nunca foi paga não fica "sujando" o ASAAS (pedido do Gutto em 27/11/2026).
 *  - 12 h depois do checkout sem nenhum pagamento → exclui as cobranças em aberto e a assinatura no ASAAS.
 *  - Pagou uma → as outras assinaturas do Salomão nunca pagas da mesma pessoa (CPF/CNPJ ou e-mail) saem na hora.
 * Só mexe em assinatura do Salomão criada por este site (tabela subscriptions, category = 'salomao') e que nunca
 * teve pagamento (confirmed_at IS NULL): a conta ASAAS é a mesma dos boletos de clientes, nada de regra genérica.
 */
export const PRAZO_PAGAMENTO_HORAS = 12;
const PAGO = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

/** Exclui no ASAAS. Devolve false (e não exclui) se alguma cobrança já está paga lá (webhook perdido). */
async function excluirNoAsaas(sub: SubscriptionRow, motivo: string): Promise<boolean> {
  try {
    const { data } = await listSubscriptionPayments(sub.asaas_subscription_id);
    if (data.some((p) => PAGO.includes(p.status))) {
      console.warn(`[salomao-expirar] ${sub.asaas_subscription_id} tem pagamento no ASAAS e não consta aqui; conferir o webhook.`);
      return false;
    }
    for (const p of data) {
      if (p.status === "PENDING" || p.status === "OVERDUE") await deletePayment(p.id);
    }
    await deleteSubscription(sub.asaas_subscription_id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/404|not.?found|não encontrad/i.test(msg)) {
      console.error(`[salomao-expirar] falha ao excluir ${sub.asaas_subscription_id}: ${msg}`);
      return false;
    }
  }
  updateSubscriptionStatus(sub.asaas_subscription_id, "CANCELED");
  console.log(`[salomao-expirar] ${sub.asaas_subscription_id} (${sub.customer_name}) excluída do ASAAS: ${motivo}.`);
  return true;
}

/** Rotina agendada (a cada 10 min, junto do /api/cron/salomao-pendentes). */
export async function expirarNaoPagas(): Promise<string[]> {
  const vencidas = db
    .prepare(
      `SELECT * FROM subscriptions WHERE category = 'salomao' AND confirmed_at IS NULL AND status != 'CANCELED'
         AND created_at < datetime('now', ?) ORDER BY id LIMIT 20`,
    )
    .all(`-${PRAZO_PAGAMENTO_HORAS} hours`) as SubscriptionRow[];
  const feitas: string[] = [];
  for (const sub of vencidas) {
    if (await excluirNoAsaas(sub, `não paga em ${PRAZO_PAGAMENTO_HORAS} h`)) feitas.push(sub.asaas_subscription_id);
  }
  return feitas;
}

/** Chamado no webhook quando uma assinatura do Salomão recebe o 1º pagamento. */
export async function cancelarOutrasAbertas(paga: SubscriptionRow): Promise<string[]> {
  const doc = paga.customer_cpf_cnpj || null;
  const email = paga.customer_email?.toLowerCase() || null;
  if (!doc && !email) return [];
  const irmas = db
    .prepare(
      `SELECT * FROM subscriptions WHERE category = 'salomao' AND confirmed_at IS NULL AND status != 'CANCELED'
         AND id != ? AND created_at <= datetime('now')
         AND ((? IS NOT NULL AND customer_cpf_cnpj = ?) OR (? IS NOT NULL AND lower(customer_email) = ?))`,
    )
    .all(paga.id, doc, doc, email, email) as SubscriptionRow[];
  const feitas: string[] = [];
  for (const sub of irmas) {
    if (await excluirNoAsaas(sub, `a pessoa pagou a assinatura ${paga.asaas_subscription_id}`)) feitas.push(sub.asaas_subscription_id);
  }
  return feitas;
}
