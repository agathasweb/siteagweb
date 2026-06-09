import type { AsaasCycle, AsaasBillingType } from "./client";

/**
 * Catálogo de planos do site, mapeados para parâmetros da assinatura ASAAS.
 *
 * `key` é o identificador interno (slug) usado pelo front. Mantenha-o
 * estável — alterar quebra cobranças e webhooks já criados.
 *
 * Regras de tráfego pago (definidas pelo negócio):
 *  - Mensal     → assinatura recorrente SOMENTE via cartão de crédito;
 *                 cancelável a qualquer momento (recomenda-se 3 meses para
 *                 topo de resultados).
 *  - Semestral  → cobrança a cada 6 meses, 12,5% de desconto, Pix/boleto/cartão.
 *  - Anual      → cobrança a cada 12 meses, 20% de desconto, Pix/boleto/cartão.
 *
 * Valores em BRL. `value` é o montante cobrado por ciclo (já com desconto).
 */

export type PlanKey =
  // Tráfego pago — 2 planos × 3 períodos
  | "trafego-essencial-mensal"
  | "trafego-essencial-semestral"
  | "trafego-essencial-anual"
  | "trafego-performance-mensal"
  | "trafego-performance-semestral"
  | "trafego-performance-anual"
  // Voyia — assinatura SaaS mensal
  | "voyia-starter"
  | "voyia-profissional"
  | "voyia-business"
  // Planos personalizados (fluxo manual no /admin/subscriptions) — preço e
  // ciclo definidos por assinatura; o `value` do catálogo é só placeholder,
  // o valor real cobrado fica na coluna `subscriptions.value`.
  | "voyia-personalizado"
  | "trafego-personalizado";

export interface PlanConfig {
  /** Nome amigável (aparece no log/admin). */
  name: string;
  /** Valor cobrado por ciclo, em reais (já com desconto aplicado). */
  value: number;
  /** Ciclo de cobrança. */
  cycle: AsaasCycle;
  /**
   * Forma de pagamento permitida.
   * CREDIT_CARD → cliente paga só com cartão (mensal de tráfego).
   * UNDEFINED   → cliente escolhe Pix, boleto ou cartão na ASAAS.
   */
  billingType: AsaasBillingType;
  /** Descrição que aparece na fatura ASAAS. */
  description: string;
  /** Categoria pra agrupamento em relatórios. */
  category: "trafego" | "voyia";
}

// Preços base mensais do tráfego pago (por rede contratada).
const TRAFEGO_BASE = { essencial: 499, performance: 749 } as const;
// 12,5% off no semestral, 20% off no anual.
const SEMI_FACTOR = 6 * 0.875;
const ANNUAL_FACTOR = 12 * 0.8;
const round2 = (n: number) => Math.round(n * 100) / 100;

export const PLAN_CATALOG: Record<PlanKey, PlanConfig> = {
  // ----- Tráfego Essencial -----
  "trafego-essencial-mensal": {
    name: "Tráfego Essencial — Mensal",
    value: TRAFEGO_BASE.essencial,
    cycle: "MONTHLY",
    billingType: "CREDIT_CARD",
    description: "Gestão de tráfego Essencial — assinatura mensal (cartão de crédito)",
    category: "trafego",
  },
  "trafego-essencial-semestral": {
    name: "Tráfego Essencial — Semestral",
    value: round2(TRAFEGO_BASE.essencial * SEMI_FACTOR),
    cycle: "SEMIANNUALLY",
    billingType: "UNDEFINED",
    description: "Gestão de tráfego Essencial — semestral (6 meses, 12,5% de desconto)",
    category: "trafego",
  },
  "trafego-essencial-anual": {
    name: "Tráfego Essencial — Anual",
    value: round2(TRAFEGO_BASE.essencial * ANNUAL_FACTOR),
    cycle: "YEARLY",
    billingType: "UNDEFINED",
    description: "Gestão de tráfego Essencial — anual (12 meses, 20% de desconto)",
    category: "trafego",
  },
  // ----- Tráfego Performance -----
  "trafego-performance-mensal": {
    name: "Tráfego Performance — Mensal",
    value: TRAFEGO_BASE.performance,
    cycle: "MONTHLY",
    billingType: "CREDIT_CARD",
    description: "Gestão de tráfego Performance — assinatura mensal (cartão de crédito)",
    category: "trafego",
  },
  "trafego-performance-semestral": {
    name: "Tráfego Performance — Semestral",
    value: round2(TRAFEGO_BASE.performance * SEMI_FACTOR),
    cycle: "SEMIANNUALLY",
    billingType: "UNDEFINED",
    description: "Gestão de tráfego Performance — semestral (6 meses, 12,5% de desconto)",
    category: "trafego",
  },
  "trafego-performance-anual": {
    name: "Tráfego Performance — Anual",
    value: round2(TRAFEGO_BASE.performance * ANNUAL_FACTOR),
    cycle: "YEARLY",
    billingType: "UNDEFINED",
    description: "Gestão de tráfego Performance — anual (12 meses, 20% de desconto)",
    category: "trafego",
  },
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
  "trafego-personalizado": {
    name: "Tráfego — Plano Personalizado",
    value: 0,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Gestão de tráfego — assinatura personalizada",
    category: "trafego",
  },
};

/** Plan keys reservados para assinaturas personalizadas (fluxo manual). */
export const MANUAL_PLAN_KEY: Record<"voyia" | "trafego", PlanKey> = {
  voyia: "voyia-personalizado",
  trafego: "trafego-personalizado",
};

export function getPlan(key: string): PlanConfig | null {
  return PLAN_CATALOG[key as PlanKey] ?? null;
}
