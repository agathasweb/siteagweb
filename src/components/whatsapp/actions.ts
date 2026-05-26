"use server";

import { headers } from "next/headers";
import { createLead, markLeadMetaSent } from "@/lib/db/leads";
import { verifyRecaptcha, isRecaptchaConfigured } from "@/lib/recaptcha";
import { isLocale } from "@/lib/i18n";
import { validateName, validateEmail, validatePhone } from "@/lib/phone";
import { sendCapiEvent } from "@/lib/meta/capi";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";

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
  // Meta attribution — payload vindo do client junto do submit. Sem isso, o
  // Lead via CAPI perde fbp/fbc e cai pra Event Match Quality menor.
  metaEventId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  eventSourceUrl?: string | null;
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

  let leadId: number;
  try {
    leadId = createLead({
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
      fbp: input.fbp ?? null,
      fbc: input.fbc ?? null,
      fbclid: input.fbclid ?? null,
      gclid: input.gclid ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_term: input.utm_term ?? null,
      utm_content: input.utm_content ?? null,
      meta_event_id: input.metaEventId ?? null,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao salvar." };
  }

  // CAPI Lead (server) — fire-and-forget com mesmo event_id do Pixel client.
  // Não bloqueia a UX nem propaga falha (já está salvo no banco).
  if (input.metaEventId) {
    const ctx = input.ctaContext ?? "whatsapp_cta";
    const geo = extractGeoFromHeaders(h);
    void sendCapiEvent({
      eventName: "Lead",
      eventId: input.metaEventId,
      eventSourceUrl: input.eventSourceUrl ?? input.originPage ?? null,
      actionSource: "website",
      leadId,
      userData: {
        email,
        phone,
        fullName: name,
        city: geo.city,
        state: geo.state,
        zip: geo.zip,
        country: (geo.country ?? "br").toLowerCase(),
        fbp: input.fbp ?? null,
        fbc: input.fbc ?? null,
        clientIp: ip,
        clientUserAgent: userAgent,
      },
      customData: {
        content_name: ctx,
        content_category: ctx.startsWith("voyia") ? "voyia" : "agathas",
        lead_source: "whatsapp",
      },
    }).then((res) => {
      if (res.ok) markLeadMetaSent(leadId);
    });
  }

  return { ok: true };
}
