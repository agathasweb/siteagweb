import "server-only";
import { getSetting, SETTINGS_KEYS } from "@/lib/db/settings";

const VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";

/** Score mínimo (v3 retorna 0.0-1.0). Abaixo disso assumimos bot. */
export const RECAPTCHA_MIN_SCORE = 0.5;

export interface RecaptchaVerifyResult {
  ok: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  errors?: string[];
  raw?: unknown;
}

export function getRecaptchaSiteKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.recaptchaSiteKey);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  return process.env.RECAPTCHA_SITE_KEY?.trim() || null;
}

export function getRecaptchaSecretKey(): string | null {
  const fromDb = getSetting(SETTINGS_KEYS.recaptchaSecretKey);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  return process.env.RECAPTCHA_SECRET_KEY?.trim() || null;
}

export function getRecaptchaKeySource(): "db" | "env" | "none" {
  const dbS = getSetting(SETTINGS_KEYS.recaptchaSecretKey);
  if (dbS && dbS.trim()) return "db";
  if (process.env.RECAPTCHA_SECRET_KEY?.trim()) return "env";
  return "none";
}

export function isRecaptchaConfigured(): boolean {
  return !!getRecaptchaSiteKey() && !!getRecaptchaSecretKey();
}

/**
 * Verifica token reCAPTCHA v3 com a API do Google. Retorna score 0.0-1.0.
 * @param token  Token vindo do cliente (grecaptcha.execute)
 * @param expectedAction  Action declarada no cliente (ex: "contact_form")
 * @param remoteIp  IP do usuário (opcional, recomendado)
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  remoteIp?: string,
): Promise<RecaptchaVerifyResult> {
  const secret = getRecaptchaSecretKey();
  if (!secret) {
    return { ok: false, errors: ["recaptcha_not_configured"] };
  }
  if (!token || token.length < 10) {
    return { ok: false, errors: ["missing_token"] };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      return { ok: false, errors: [`http_${res.status}`] };
    }
    const data = (await res.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      hostname?: string;
      challenge_ts?: string;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return { ok: false, errors: data["error-codes"], raw: data };
    }
    if (expectedAction && data.action && data.action !== expectedAction) {
      return {
        ok: false,
        score: data.score,
        action: data.action,
        errors: [`action_mismatch:${data.action}`],
        raw: data,
      };
    }
    const score = data.score ?? 0;
    return {
      ok: score >= RECAPTCHA_MIN_SCORE,
      score,
      action: data.action,
      hostname: data.hostname,
      raw: data,
    };
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}
