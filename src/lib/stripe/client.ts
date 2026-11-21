import "server-only";
import crypto from "node:crypto";

/**
 * Stripe da Agathas (conta BR acct_1SvH30CNvOLTepuB, liquida em BRL no ASAAS) pela API REST, sem SDK.
 * Usada na venda do SK Render no exterior (21/11/2026): dólar em agathasweb.com e euro em agathas.es.
 *   STRIPE_SECRET_KEY  (sk_test_… durante a revisão; sk_live_… depois da aprovação do Gutto)
 *   STRIPE_WEBHOOK_SECRET (whsec_… do endpoint /api/stripe/webhook)
 */
const key = () => process.env.STRIPE_SECRET_KEY?.trim() || "";
export const stripeReady = () => key().startsWith("sk_");
export const stripeModoTeste = () => key().startsWith("sk_test_");

type Valor = string | number | boolean | null | undefined | Valor[] | { [k: string]: Valor };

// Stripe recebe form-urlencoded com colchetes: line_items[0][price_data][currency]=usd
function achatar(obj: Valor, prefixo = "", out = new URLSearchParams()): URLSearchParams {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) obj.forEach((v, i) => achatar(v, `${prefixo}[${i}]`, out));
  else if (typeof obj === "object") for (const [k, v] of Object.entries(obj)) achatar(v, prefixo ? `${prefixo}[${k}]` : k, out);
  else out.append(prefixo, String(obj));
  return out;
}

export async function stripe<T = Record<string, unknown>>(metodo: "GET" | "POST", caminho: string, params?: Record<string, Valor>): Promise<T> {
  const corpo = params ? achatar(params).toString() : undefined;
  const url = `https://api.stripe.com/v1${caminho}${metodo === "GET" && corpo ? `?${corpo}` : ""}`;
  const r = await fetch(url, {
    method: metodo,
    headers: { authorization: `Bearer ${key()}`, "content-type": "application/x-www-form-urlencoded" },
    body: metodo === "POST" ? corpo : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${json.error?.message || "erro"}`);
  return json;
}

/** Confere o cabeçalho Stripe-Signature (HMAC-SHA256 de "t.corpo", tolerância de 5 min). */
export function eventoAssinado<T = Record<string, unknown>>(corpo: string, assinatura: string | null): T | null {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!segredo || !assinatura) return null;
  const partes = Object.fromEntries(assinatura.split(",").map((p) => p.split("=") as [string, string]).filter(([k]) => k === "t"));
  const t = Number(partes.t);
  const v1s = assinatura.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !v1s.length || Math.abs(Date.now() / 1000 - t) > 300) return null;
  const esperado = crypto.createHmac("sha256", segredo).update(`${t}.${corpo}`).digest("hex");
  const ok = v1s.some((v) => v.length === esperado.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(esperado)));
  return ok ? (JSON.parse(corpo) as T) : null;
}
