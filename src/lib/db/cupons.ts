import "server-only";
import { db } from "./index";

/**
 * Cupons de desconto por produto (`categoria` = category do PLAN_CATALOG).
 * O desconto vale nos `meses` primeiros pagamentos; depois o webhook devolve o valor cheio.
 * `usos` só conta quando o 1º pagamento é confirmado ("as 50 primeiras escolas" = 50 que pagaram).
 */
export interface Cupom {
  codigo: string;
  categoria: string;
  percentual: number;
  meses: number;
  max_usos: number | null;
  usos: number;
  valido_ate: string | null;
  ativo: number;
}

export type CupomValidacao = { ok: true; cupom: Cupom } | { ok: false; motivo: string };

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function validarCupom(codigo: string, categoria: string): CupomValidacao {
  const c = db
    .prepare("SELECT * FROM cupons WHERE codigo = ?")
    .get(normalizarCodigo(codigo)) as Cupom | undefined;
  if (!c || !c.ativo || c.categoria !== categoria) return { ok: false, motivo: "Cupom inválido." };
  if (c.valido_ate && c.valido_ate < new Date().toISOString().slice(0, 10)) return { ok: false, motivo: "Este cupom expirou." };
  if (c.max_usos !== null && c.usos >= c.max_usos) return { ok: false, motivo: "As vagas deste cupom acabaram." };
  return { ok: true, cupom: c };
}

/** Valor com desconto, arredondado em centavos. */
export function aplicarDesconto(valor: number, percentual: number): number {
  return Math.round(valor * (1 - percentual / 100) * 100) / 100;
}

/**
 * Conta o uso de forma atômica, respeitando o limite (duas compras ao mesmo tempo não passam das 50 vagas).
 * Devolve false quando as vagas acabaram — quem chamou volta a assinatura ao valor cheio.
 */
export function registrarUsoCupom(codigo: string): boolean {
  const r = db
    .prepare("UPDATE cupons SET usos = usos + 1 WHERE codigo = ? AND (max_usos IS NULL OR usos < max_usos)")
    .run(normalizarCodigo(codigo));
  return r.changes > 0;
}

/** Vagas restantes (para o contador da página de oferta). null = sem limite. */
export function vagasRestantes(codigo: string): number | null {
  const c = db.prepare("SELECT max_usos, usos FROM cupons WHERE codigo = ?").get(normalizarCodigo(codigo)) as
    | { max_usos: number | null; usos: number }
    | undefined;
  if (!c || c.max_usos === null) return null;
  return Math.max(0, c.max_usos - c.usos);
}
