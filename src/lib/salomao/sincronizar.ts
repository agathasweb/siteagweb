import "server-only";
import { updateSubscriptionValue } from "@/lib/asaas/client";
import { getPlan } from "@/lib/asaas/plans";
import { registrarUsoCupom } from "@/lib/db/cupons";
import { contarPagamentoComCupom, encerrarCupom, marcarEscolaCriada } from "@/lib/db/salomao";
import type { SubscriptionRow, SubscriptionStatus } from "@/lib/db/subscriptions";
import { criarEscola, enviarEvento } from "./api";

/**
 * Salomão: pago → cria a escola (1ª vez; conta o uso do cupom) ou avisa "pagamento_confirmado";
 * cada pagamento com cupom desconta um mês e, no fim, a assinatura volta ao valor cheio;
 * atraso → "pagamento_atrasado"; assinatura apagada → "assinatura_cancelada".
 */
export async function sincronizarSalomao(
  sub: SubscriptionRow,
  event: string,
  status: SubscriptionStatus,
  payment?: { id: string; dueDate?: string },
): Promise<void> {
  try {
    if (status === "CONFIRMED" || status === "RECEIVED") {
      if (!sub.salomao_escola_id) {
        const r = await criarEscola({
          assinatura_id: sub.asaas_subscription_id,
          nome: sub.salomao_escola_nome ?? sub.customer_name,
          slug: sub.salomao_slug ?? "",
          plano: (getPlan(sub.plan_key)?.salomao?.plano ?? "250"),
          periodicidade: (getPlan(sub.plan_key)?.salomao?.periodicidade ?? "mensal"),
          admin_nome: sub.salomao_admin_nome ?? sub.customer_name,
          admin_email: sub.salomao_admin_email ?? sub.customer_email,
          cliente_email: sub.customer_email,
        });
        marcarEscolaCriada(sub.asaas_subscription_id, r.escola_id);
        if (r.criada && sub.cupom_codigo) registrarUsoCupom(sub.cupom_codigo);
      } else {
        await enviarEvento(sub.asaas_subscription_id, "pagamento_confirmado");
      }
      if (payment?.id && sub.cupom_meses_restantes) {
        const restantes = contarPagamentoComCupom(sub, payment.id);
        if (restantes === 0 && sub.valor_cheio) {
          await updateSubscriptionValue(sub.asaas_subscription_id, sub.valor_cheio);
          encerrarCupom(sub);
        }
      }
    } else if (status === "OVERDUE") {
      await enviarEvento(sub.asaas_subscription_id, "pagamento_atrasado", payment?.dueDate);
    } else if (event === "SUBSCRIPTION_DELETED") {
      await enviarEvento(sub.asaas_subscription_id, "assinatura_cancelada");
    }
  } catch (err) {
    console.error(`[webhook] Salomão: falha ao sincronizar ${sub.asaas_subscription_id} (${event}):`, err);
  }
}
