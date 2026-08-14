import "server-only";
import crypto from "node:crypto";
import { db } from "./index";

/**
 * Proteção contra brute force no /admin/login.
 *
 * Cada tentativa (sucesso ou falha) vira uma linha em `login_attempts`. O
 * bloqueio é calculado em cima da janela recente de falhas — não existe tabela
 * de "IPs banidos" pra manter, o bloqueio expira sozinho conforme as falhas
 * saem da janela.
 *
 * São duas travas independentes:
 *
 *  - **Por IP** — o caso normal: alguém martelando senha de um lugar só.
 *  - **Por e-mail** — cobre ataque distribuído (botnet trocando de IP a cada
 *    tentativa contra a mesma conta). Limite mais folgado, senão um atacante
 *    tranca o admin de fora usando o e-mail dele de propósito.
 *
 * A punição é progressiva: quanto mais falhas na janela, mais tempo preso.
 * O relógio conta a partir da **última** falha, então insistir durante o
 * bloqueio só estende o castigo.
 */

const WINDOW_MINUTES = 30;

/** Escada de bloqueio por IP: [falhas na janela, minutos de bloqueio]. */
const IP_TIERS: Array<[number, number]> = [
  [5, 5],
  [10, 30],
  [20, 120],
];

/** Escada por e-mail — mais tolerante, é a trava anti-distribuído. */
const EMAIL_TIERS: Array<[number, number]> = [
  [20, 15],
  [40, 60],
];

/** Tentativas mais velhas que isso são descartadas na limpeza. */
const RETENTION_HOURS = 72;

export interface LockoutState {
  blocked: boolean;
  /** Segundos restantes até liberar (0 quando não está bloqueado). */
  retryAfterSeconds: number;
  /** Falhas na janela — o que disparou o bloqueio. */
  failures: number;
  scope: "ip" | "email" | null;
}

const FREE: LockoutState = { blocked: false, retryAfterSeconds: 0, failures: 0, scope: null };

export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * IP real do cliente. A ordem importa: Cloudflare é quem fala com o mundo,
 * então `cf-connecting-ip` é a fonte confiável; `x-forwarded-for` só entra
 * como fallback (e só o primeiro item, que é o cliente).
 */
export function getClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

function windowStartIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString().replace("T", " ").slice(0, 19);
}

interface FailureRow {
  failures: number;
  last_at: string | null;
}

function countFailures(column: "ip" | "email_hash", value: string): FailureRow {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS failures, MAX(created_at) AS last_at
         FROM login_attempts
        WHERE ${column} = ?
          AND success = 0
          AND created_at >= ?`,
    )
    .get(value, windowStartIso(WINDOW_MINUTES)) as FailureRow | undefined;

  return { failures: row?.failures ?? 0, last_at: row?.last_at ?? null };
}

function evaluate(
  row: FailureRow,
  tiers: Array<[number, number]>,
  scope: "ip" | "email",
): LockoutState {
  if (!row.last_at) return FREE;

  // Maior tier atingido — a escada está em ordem crescente.
  let blockMinutes = 0;
  for (const [threshold, minutes] of tiers) {
    if (row.failures >= threshold) blockMinutes = minutes;
  }
  if (blockMinutes === 0) return FREE;

  // `created_at` é gravado com datetime('now'), que é UTC sem timezone.
  const lastAt = new Date(row.last_at.replace(" ", "T") + "Z").getTime();
  const freeAt = lastAt + blockMinutes * 60_000;
  const remaining = Math.ceil((freeAt - Date.now()) / 1000);

  if (remaining <= 0) return FREE;
  return { blocked: true, retryAfterSeconds: remaining, failures: row.failures, scope };
}

/**
 * Estado do bloqueio para este IP + e-mail. Chamada antes de conferir a senha —
 * bloqueado é bloqueado mesmo que a senha esteja certa.
 */
export function checkLoginLockout(ip: string, email: string | null): LockoutState {
  const byIp = evaluate(countFailures("ip", ip), IP_TIERS, "ip");
  if (byIp.blocked) return byIp;

  if (email) {
    const byEmail = evaluate(countFailures("email_hash", hashEmail(email)), EMAIL_TIERS, "email");
    if (byEmail.blocked) return byEmail;
  }

  return FREE;
}

export function recordLoginAttempt(params: {
  ip: string;
  email: string | null;
  success: boolean;
  userAgent?: string | null;
}): void {
  db.prepare(
    `INSERT INTO login_attempts (ip, email_hash, success, user_agent)
     VALUES (?, ?, ?, ?)`,
  ).run(
    params.ip,
    params.email ? hashEmail(params.email) : null,
    params.success ? 1 : 0,
    params.userAgent?.slice(0, 300) ?? null,
  );

  // Login certo zera o contador do IP: quem acertou a senha não fica de castigo
  // pelas tentativas anteriores. As falhas por e-mail continuam valendo, senão
  // bastaria acertar uma conta qualquer pra limpar a trava distribuída.
  if (params.success) {
    db.prepare(`DELETE FROM login_attempts WHERE ip = ? AND success = 0`).run(params.ip);
  }
}

/** Descarta tentativas antigas. Roda oportunisticamente a cada login. */
export function pruneLoginAttempts(): void {
  const cutoff = new Date(Date.now() - RETENTION_HOURS * 3_600_000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  db.prepare(`DELETE FROM login_attempts WHERE created_at < ?`).run(cutoff);
}

/** "5 minutos" / "2 minutos e 30 segundos" — pra mensagem do formulário. */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const minPart = `${min} minuto${min === 1 ? "" : "s"}`;
  if (rest === 0 || min >= 10) return minPart;
  return `${minPart} e ${rest} segundo${rest === 1 ? "" : "s"}`;
}
