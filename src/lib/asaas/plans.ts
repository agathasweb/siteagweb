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
  // Estes `value` são enviados à ASAAS na criação da assinatura (checkout),
  // portanto refletem o preço efetivamente cobrado por ciclo — mudar aqui E no
  // `productsPages.voyia.pricing` dos 4 dicionários. Tabela desde 29/09/2026
  // (fim da promoção de lançamento). Assinaturas antigas seguem com o valor
  // com que foram criadas na ASAAS: esta tabela só vale para as novas.
  // Starter e Profissional têm taxa de instalação, negociada com vendas.
  "voyia-starter": {
    name: "Voyia — Starter",
    value: 149,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Starter",
    category: "voyia",
  },
  "voyia-profissional": {
    name: "Voyia — Profissional",
    value: 349,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Profissional",
    category: "voyia",
  },
  "voyia-business": {
    name: "Voyia — Business",
    value: 749,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Business",
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
