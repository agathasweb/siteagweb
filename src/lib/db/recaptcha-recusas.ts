import "server-only";
import { db } from "@/lib/db";
import type { RecaptchaVerifyResult } from "@/lib/recaptcha";

const MAX_POR_IP_HORA = 20;
const MAX_GERAL_HORA = 200;
const DIAS_RETENCAO = 90;

/**
 * Guarda a recusa no banco: o log do container some a cada deploy, e foi por isso que não deu
 * para saber se visitantes reais estavam sendo barrados na campanha de outubro/novembro de 2026.
 * Os tetos e a retenção impedem que um robô encha a tabela.
 */
export function registrarRecusaRecaptcha(o: {
  rota: string;
  rc: RecaptchaVerifyResult;
  nome?: unknown;
  telefone?: unknown;
  escola?: unknown;
  pagina?: string | null;
  ip?: string;
  userAgent?: string | null;
}): void {
  const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const ip = o.ip ?? null;
  const naHora = (filtro: string, ...args: string[]) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM recaptcha_recusas WHERE ${filtro} created_at >= datetime('now', '-1 hour')`).get(...args) as { n: number }).n;
  if (naHora("") >= MAX_GERAL_HORA) return;
  if (ip && naHora("ip = ? AND", ip) >= MAX_POR_IP_HORA) return;
  db.prepare(`DELETE FROM recaptcha_recusas WHERE created_at < datetime('now', '-${DIAS_RETENCAO} days')`).run();
  db.prepare(
    `INSERT INTO recaptcha_recusas (rota, score, erros, hostname, nome, telefone, escola, pagina, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    o.rota,
    o.rc.score ?? null,
    (o.rc.errors ?? []).join(",").slice(0, 300) || null,
    o.rc.hostname ?? null,
    texto(o.nome, 120),
    texto(o.telefone, 30),
    texto(o.escola, 160),
    texto(o.pagina, 500),
    ip,
    texto(o.userAgent, 400),
  );
}
