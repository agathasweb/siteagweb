/**
 * Predicted LTV — valor anualizado da assinatura, usado no evento `Subscribe`
 * pra Meta otimizar campanhas pelo valor recorrente esperado.
 *
 * Lógica por ciclo ASAAS:
 *   MONTHLY      → value × 12  (mensal × 12 meses)
 *   QUARTERLY    → value × 4   (trimestral × 4)
 *   SEMIANNUALLY → value × 2   (semestral × 2)
 *   YEARLY       → value × 1   (já é anual)
 *
 * Para ciclos desconhecidos, retorna o próprio value (postura conservadora).
 */
export function predictedLtv(value: number, cycle: string): number {
  switch (cycle?.toUpperCase()) {
    case "MONTHLY":
      return Math.round(value * 12 * 100) / 100;
    case "QUARTERLY":
      return Math.round(value * 4 * 100) / 100;
    case "SEMIANNUALLY":
      return Math.round(value * 2 * 100) / 100;
    case "YEARLY":
      return value;
    default:
      return value;
  }
}
