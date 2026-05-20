import type { AsaasCycle, AsaasBillingType } from "./client";

/**
 * Catálogo de planos do site, mapeados para parâmetros da assinatura ASAAS.
 *
 * `key` é o identificador interno (slug) usado pelo front. Mantenha-o
 * estável — alterar quebra cobranças e webhooks já criados.
 *
 * Regras de tráfego pago (definidas pelo negócio):
 *  - Mensal     → assinatura recorrente SOMENTE via cartão de crédito;
 *                 permanência mínima de 6 meses (aceite de termos obrigatório).
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
  | "voyia-business";

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
  /**
   * Permanência mínima em meses. Quando definido, o checkout exige aceite
   * explícito de termos antes de prosseguir (ASAAS não tem campo nativo
   * para isso — é uma obrigação contratual).
   */
  minCommitmentMonths?: number;
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
    description: "Gestão de tráfego Essencial — assinatura mensal (cartão de crédito, permanência mínima 6 meses)",
    category: "trafego",
    minCommitmentMonths: 6,
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
    description: "Gestão de tráfego Performance — assinatura mensal (cartão de crédito, permanência mínima 6 meses)",
    category: "trafego",
    minCommitmentMonths: 6,
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
  "voyia-starter": {
    name: "Voyia — Starter",
    value: 197,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Starter",
    category: "voyia",
  },
  "voyia-profissional": {
    name: "Voyia — Profissional",
    value: 397,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Profissional",
    category: "voyia",
  },
  "voyia-business": {
    name: "Voyia — Business",
    value: 697,
    cycle: "MONTHLY",
    billingType: "UNDEFINED",
    description: "Voyia WhatsApp API — plano Business",
    category: "voyia",
  },
};

export function getPlan(key: string): PlanConfig | null {
  return PLAN_CATALOG[key as PlanKey] ?? null;
}
