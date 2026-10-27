import "server-only";
import { db } from "./index";
import type { SubscriptionRow } from "./subscriptions";

/** Dados da escola pedidos no checkout do Salomão, gravados junto da assinatura. */
export function salvarDadosSalomao(
  asaasSubscriptionId: string,
  dados: {
    escolaNome: string;
    slug: string;
    adminNome: string;
    adminEmail: string;
    cupomCodigo: string | null;
    cupomMeses: number | null;
    valorCheio: number;
  },
): void {
  db.prepare(
    `UPDATE subscriptions SET salomao_escola_nome = ?, salomao_slug = ?, salomao_admin_nome = ?, salomao_admin_email = ?,
       cupom_codigo = ?, cupom_meses_restantes = ?, cupom_pagamentos = '[]', valor_cheio = ?, updated_at = datetime('now')
     WHERE asaas_subscription_id = ?`,
  ).run(dados.escolaNome, dados.slug, dados.adminNome, dados.adminEmail, dados.cupomCodigo, dados.cupomMeses, dados.valorCheio, asaasSubscriptionId);
}

export function marcarEscolaCriada(asaasSubscriptionId: string, escolaId: number): void {
  db.prepare("UPDATE subscriptions SET salomao_escola_id = ?, updated_at = datetime('now') WHERE asaas_subscription_id = ?")
    .run(escolaId, asaasSubscriptionId);
}

/**
 * Conta um pagamento com desconto (uma vez por pagamento: CONFIRMED e RECEIVED do mesmo cartão chegam
 * separados). Devolve quantos meses de desconto ainda restam depois deste.
 */
export function contarPagamentoComCupom(sub: SubscriptionRow, paymentId: string): number | null {
  if (sub.cupom_meses_restantes === null || sub.cupom_meses_restantes === undefined) return null;
  const vistos: string[] = JSON.parse(sub.cupom_pagamentos || "[]");
  if (vistos.includes(paymentId)) return sub.cupom_meses_restantes;
  const restantes = Math.max(0, sub.cupom_meses_restantes - 1);
  db.prepare("UPDATE subscriptions SET cupom_meses_restantes = ?, cupom_pagamentos = ?, updated_at = datetime('now') WHERE id = ?")
    .run(restantes, JSON.stringify([...vistos, paymentId]), sub.id);
  return restantes;
}

export function encerrarCupom(sub: SubscriptionRow): void {
  db.prepare("UPDATE subscriptions SET cupom_meses_restantes = NULL, value = ?, updated_at = datetime('now') WHERE id = ?")
    .run(sub.valor_cheio, sub.id);
}

/** Assinaturas do Salomão já pagas cuja escola ainda não foi criada (Salomão estava fora do ar). */
export function pendentesDeCriacao(): SubscriptionRow[] {
  return db
    .prepare(
      `SELECT * FROM subscriptions WHERE category = 'salomao' AND salomao_escola_id IS NULL
         AND status IN ('CONFIRMED','RECEIVED') ORDER BY id LIMIT 20`,
    )
    .all() as SubscriptionRow[];
}
