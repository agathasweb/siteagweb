import type { AsaasCycle, AsaasBillingType } from "./client";

/**
 * Catálogo de planos do site, mapeados para parâmetros da assinatura ASAAS.
 *
 * `key` é o identificador interno (slug) usado pelo front. Mantenha-o
 * estável — alterar quebra cobranças e webhooks já criados.
 *
 * Os planos de gestão de tráfego saíram do catálogo em 08/09/2026, junto com a página
 * que os vendia: a agência deixou de divulgar o serviço. Não havia nenhuma assinatura de
 * tráfego no banco, então nada precisou ser preservado por compatibilidade.
 *
 * Valores em BRL. `value` é o montante cobrado por ciclo (já com desconto).
 */

export type PlanKey =
  // Voyia — assinatura SaaS mensal
  | "voyia-starter"
  | "voyia-profissional"
  | "voyia-business"
  // Planos personalizados (criados via API ASAAS) — preço e
  // ciclo definidos por assinatura; o `value` do catálogo é só placeholder,
  // o valor real cobrado fica na coluna `subscriptions.value`.
  | "voyia-personalizado";

export interface PlanConfig {
  /** Nome amigável (aparece no log/admin). */
  name: string;
  /** Valor cobrado por ciclo, em reais (já com desconto aplicado). */
  value: number;
  /** Ciclo de cobrança. */
  cycle: AsaasCycle;
  /**
   * Forma de pagamento permitida.
   * CREDIT_CARD → cliente paga só com cartão.
   * UNDEFINED   → cliente escolhe Pix, boleto ou cartão na ASAAS.
   */
  billingType: AsaasBillingType;
  /** Descrição que aparece na fatura ASAAS. */
  description: string;
  /** Categoria pra agrupamento em relatórios. */
  category: "voyia";
}

export const PLAN_CATALOG: Record<PlanKey, PlanConfig> = {
  // ----- Voyia -----
  // PROMOÇÃO "Rumo ao Hexa" (cupom RUMOAOHEXA):
  //   - Adesão de novas assinaturas até 31/07/2026.
  //   - Valor promocional garantido até 31/12/2026.
  // Estes `value` são enviados à ASAAS na criação da assinatura (checkout),
  // portanto refletem o preço efetivamente cobrado por ciclo.
  // Preços de tabela (pré-promoção): Starter 197 / Profissional 397 / Business 697.
  // AÇÃO FUTURA: após 31/07/2026 reverter para os preços de tabela em novas
  // assinaturas; em 31/12/2026 reajustar as assinaturas promocionais na ASAAS.
  "voyia-starter": {
    name: "Voyia — Starter",
    value: 99,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Starter (promo Rumo ao Hexa)",
    category: "voyia",
  },
  "voyia-profissional": {
    name: "Voyia — Profissional",
    value: 249,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Profissional (promo Rumo ao Hexa)",
    category: "voyia",
  },
  "voyia-business": {
    name: "Voyia — Business",
    value: 549,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Business (promo Rumo ao Hexa)",
    category: "voyia",
  },
  // ----- Planos personalizados (fluxo manual) -----
  // Servem apenas para dar um nome amigável na exibição (admin, e-mails, CAPI).
  // `value` aqui é placeholder; o preço real cobrado por ciclo é gravado em
  // `subscriptions.value` no momento do cadastro manual.
  "voyia-personalizado": {
    name: "Voyia — Plano Personalizado",
    value: 0,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — assinatura personalizada",
    category: "voyia",
  },
};

export function getPlan(key: string): PlanConfig | null {
  return PLAN_CATALOG[key as PlanKey] ?? null;
}
