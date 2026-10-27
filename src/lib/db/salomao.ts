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
  // relê do banco: o `sub` do webhook pode estar desatualizado (avisos repetidos chegam juntos)
  const atual = db.prepare("SELECT cupom_meses_restantes, cupom_pagamentos FROM subscriptions WHERE id = ?").get(sub.id) as
    | { cupom_meses_restantes: number | null; cupom_pagamentos: string | null }
    | undefined;
  if (!atual || atual.cupom_meses_restantes === null) return null;
  const vistos: string[] = JSON.parse(atual.cupom_pagamentos || "[]");
  if (vistos.includes(paymentId)) return atual.cupom_meses_restantes;
  const restantes = Math.max(0, atual.cupom_meses_restantes - 1);
  db.prepare("UPDATE subscriptions SET cupom_meses_restantes = ?, cupom_pagamentos = ?, updated_at = datetime('now') WHERE id = ?")
    .run(restantes, JSON.stringify([...vistos, paymentId]), sub.id);
  return restantes;
}

/** Vagas do cupom acabaram: 0 = valor cheio pendente na ASAAS (o cron e o próximo webhook aplicam). */
export function marcarCupomEsgotado(sub: SubscriptionRow): void {
  db.prepare("UPDATE subscriptions SET cupom_meses_restantes = 0, updated_at = datetime('now') WHERE id = ?").run(sub.id);
}

export function encerrarCupom(sub: SubscriptionRow): void {
  db.prepare("UPDATE subscriptions SET cupom_meses_restantes = NULL, value = ?, updated_at = datetime('now') WHERE id = ?")
    .run(sub.valor_cheio, sub.id);
}

/**
 * Pendências do Salomão para a rotina agendada: escola paga e ainda não criada (Salomão fora do ar) ou
 * cupom encerrado cuja volta ao valor cheio falhou na ASAAS (cupom_meses_restantes = 0, ainda não NULL).
 */
export function pendentesDeCriacao(): SubscriptionRow[] {
  return db
    .prepare(
      `SELECT * FROM subscriptions WHERE category = 'salomao' AND status IN ('CONFIRMED','RECEIVED')
         AND (salomao_escola_id IS NULL OR cupom_meses_restantes = 0) ORDER BY id LIMIT 20`,
    )
    .all() as SubscriptionRow[];
}
