import "server-only";
import { updateSubscriptionValue } from "@/lib/asaas/client";
import { getPlan } from "@/lib/asaas/plans";
import { registrarUsoCupom } from "@/lib/db/cupons";
import { contarPagamentoComCupom, encerrarCupom, marcarCupomEsgotado, marcarEscolaCriada } from "@/lib/db/salomao";
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
          plano: getPlan(sub.plan_key)?.salomao?.plano ?? "250",
          periodicidade: getPlan(sub.plan_key)?.salomao?.periodicidade ?? "mensal",
          admin_nome: sub.salomao_admin_nome ?? sub.customer_name,
          admin_email: sub.salomao_admin_email ?? sub.customer_email,
          cliente_email: sub.customer_email,
        });
        marcarEscolaCriada(sub.asaas_subscription_id, r.escola_id);
        // vagas do cupom contadas aqui, de forma atômica: se acabaram, a partir da próxima cobrança vale o cheio
        if (r.criada && sub.cupom_codigo && sub.cupom_meses_restantes !== null && !registrarUsoCupom(sub.cupom_codigo)) {
          // grava "sem desconto a partir de agora" ANTES de falar com a ASAAS: se ela falhar, o cron refaz
          marcarCupomEsgotado(sub);
          await voltarAoValorCheio(sub);
          return;
        }
      } else if (event !== "RETRY") {
        await enviarEvento(sub.asaas_subscription_id, "pagamento_confirmado");
      }

      let restantes = sub.cupom_meses_restantes;
      if (payment?.id && restantes !== null && restantes > 0) {
        restantes = contarPagamentoComCupom(sub, payment.id);
      }
      // 0 (e não NULL) = desconto acabou mas o valor cheio ainda não foi aplicado na ASAAS: tenta agora
      if (restantes === 0) await voltarAoValorCheio(sub);
    } else if (event === "SUBSCRIPTION_DELETED") {
      await enviarEvento(sub.asaas_subscription_id, "assinatura_cancelada");
    } else if (event === "PAYMENT_OVERDUE") {
      await enviarEvento(sub.asaas_subscription_id, "pagamento_atrasado", payment?.dueDate);
    } else if (event === "PAYMENT_REFUNDED" || event.startsWith("PAYMENT_CHARGEBACK")) {
      // dinheiro devolvido/contestado: entra na régua a partir de hoje (somente leitura no 10º dia)
      await enviarEvento(sub.asaas_subscription_id, "pagamento_atrasado", new Date().toISOString().slice(0, 10));
    }
  } catch (err) {
    console.error(`[webhook] Salomão: falha ao sincronizar ${sub.asaas_subscription_id} (${event}):`, err);
  }
}

/** Valor cheio na ASAAS primeiro; só então encerra o cupom no banco (se a ASAAS falhar, o cron tenta de novo). */
async function voltarAoValorCheio(sub: SubscriptionRow): Promise<void> {
  if (!sub.valor_cheio) return;
  await updateSubscriptionValue(sub.asaas_subscription_id, sub.valor_cheio);
  encerrarCupom(sub);
}
