"use server";

import { headers } from "next/headers";
import { createLead } from "@/lib/db/leads";
import { verifyRecaptcha, isRecaptchaConfigured } from "@/lib/recaptcha";
import { isLocale } from "@/lib/i18n";
import { validateName, validateEmail, validatePhone } from "@/lib/phone";

export interface WhatsAppLeadResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface WhatsAppLeadInput {
  name: string;
  email: string;
  phone: string;
  locale?: string | null;
  originPage?: string | null;
  ctaContext?: string | null; // ex: "voyia-hero", "trafego-pago-final"
  recaptchaToken?: string | null;
}

export async function captureWhatsAppLeadAction(
  input: WhatsAppLeadInput,
): Promise<WhatsAppLeadResult> {
  const locale = input.locale && isLocale(input.locale) ? input.locale : null;

  // Mesma lib do client — defesa em profundidade contra requests forjados.
  const nameCheck = validateName(input.name ?? "");
  const emailCheck = validateEmail(input.email ?? "");
  const phoneCheck = validatePhone(input.phone ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!nameCheck.ok && nameCheck.error) fieldErrors.name = nameCheck.error;
  if (!emailCheck.ok && emailCheck.error) fieldErrors.email = emailCheck.error;
  if (!phoneCheck.ok && phoneCheck.error) fieldErrors.phone = phoneCheck.error;
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Verifique os campos.", fieldErrors };
  }

  const name = nameCheck.normalized!;
  const email = emailCheck.normalized!;
  const phone = phoneCheck.normalized!;

  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    null;
  const userAgent = h.get("user-agent") || null;

  let recaptchaScore: number | null = null;
  if (isRecaptchaConfigured()) {
    const token = input.recaptchaToken ?? "";
    const verify = await verifyRecaptcha(token, "whatsapp_cta", ip ?? undefined);
    if (!verify.ok) {
      return {
        ok: false,
        error: verify.errors?.includes("missing_token")
          ? "Verificação anti-bot falhou. Recarregue a página."
          : `Verificação anti-bot rejeitou. Se você é humano, tente novamente.`,
      };
    }
    recaptchaScore = verify.score ?? null;
  }

  try {
    createLead({
      source: "whatsapp_cta",
      name,
      email,
      phone,
      service: input.ctaContext ?? null,
      message: null,
      origin_page: input.originPage ?? null,
      recaptcha_score: recaptchaScore,
      ip,
      user_agent: userAgent,
      locale,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
}
