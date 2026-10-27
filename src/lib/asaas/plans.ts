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
  | "voyia-personalizado"
  // Salomão — SaaS escolar. Mensal só no cartão (assinatura) ou anual antecipado; nunca boleto.
  | "salomao-250-mensal"
  | "salomao-250-anual"
  | "salomao-500-mensal"
  | "salomao-500-anual";

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
  category: "voyia" | "salomao";
  /** Salomão: faixa de alunos e periodicidade que vão para a API de criação da escola. */
  salomao?: { plano: "250" | "500"; periodicidade: "mensal" | "anual" };
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
  // ----- Salomão -----
  // Preços decididos em 27/10/2026: até 250 alunos R$ 249, até 500 R$ 499 (acima: orçamento).
  // Anual = 10 mensalidades. Cupom de lançamento só no mensal (ver src/lib/db/cupons.ts).
  "salomao-250-mensal": {
    name: "Salomão — até 250 alunos (mensal)",
    value: 249,
    cycle: "MONTHLY",
    billingType: "CREDIT_CARD",
    description: "Salomão — app da escola, até 250 alunos (mensal)",
    category: "salomao",
    salomao: { plano: "250", periodicidade: "mensal" },
  },
  "salomao-250-anual": {
    name: "Salomão — até 250 alunos (anual)",
    value: 2490,
    cycle: "YEARLY",
    billingType: "CREDIT_CARD",
    description: "Salomão — app da escola, até 250 alunos (anual)",
    category: "salomao",
    salomao: { plano: "250", periodicidade: "anual" },
  },
  "salomao-500-mensal": {
    name: "Salomão — até 500 alunos (mensal)",
    value: 499,
    cycle: "MONTHLY",
    billingType: "CREDIT_CARD",
    description: "Salomão — app da escola, até 500 alunos (mensal)",
    category: "salomao",
    salomao: { plano: "500", periodicidade: "mensal" },
  },
  "salomao-500-anual": {
    name: "Salomão — até 500 alunos (anual)",
    value: 4990,
    cycle: "YEARLY",
    billingType: "CREDIT_CARD",
    description: "Salomão — app da escola, até 500 alunos (anual)",
    category: "salomao",
    salomao: { plano: "500", periodicidade: "anual" },
  },
};

export function getPlan(key: string): PlanConfig | null {
  return PLAN_CATALOG[key as PlanKey] ?? null;
}
