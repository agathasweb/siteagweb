"use server";

import { headers } from "next/headers";
import { createLead, markLeadMetaSent } from "@/lib/db/leads";
import { verifyRecaptcha, isRecaptchaConfigured } from "@/lib/recaptcha";
import { isLocale } from "@/lib/i18n";
import { sendCapiEvent } from "@/lib/meta/capi";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactSubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface ContactInput {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message?: string | null;
  privacy: boolean;
  locale?: string | null;
  recaptchaToken?: string | null;
  originPage?: string | null;
  // Attribution + dedup do Pixel (Lead dispara no SUBMIT do formulário).
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

export async function submitContactAction(
  input: ContactInput,
): Promise<ContactSubmitResult> {
  // Validação básica
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").trim() || null;
  const service = (input.service ?? "").trim() || null;
  const message = (input.message ?? "").trim() || null;
  const locale = input.locale && isLocale(input.locale) ? input.locale : null;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Nome obrigatório.";
  if (!email || !EMAIL_RE.test(email)) fieldErrors.email = "E-mail inválido.";
  if (!input.privacy) fieldErrors.privacy = "Aceite a política de privacidade.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Verifique os campos.", fieldErrors };
  }

  // Headers (IP, user-agent) — só pra registrar
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    null;
  const userAgent = h.get("user-agent") || null;

  // reCAPTCHA — só verifica se está configurado. Sem keys, aceita silencioso
  // (modo dev / setup inicial). Em prod com keys salvas, é obrigatório.
  let recaptchaScore: number | null = null;
  if (isRecaptchaConfigured()) {
    const token = input.recaptchaToken ?? "";
    const verify = await verifyRecaptcha(token, "contact_form", ip ?? undefined);
    if (!verify.ok) {
      return {
        ok: false,
        error:
          verify.errors?.includes("missing_token")
            ? "Verificação anti-bot falhou (token ausente). Recarregue a página."
            : `Verificação anti-bot rejeitou (score: ${verify.score?.toFixed(2) ?? "n/d"}). Se você é humano, tente novamente.`,
      };
    }
    recaptchaScore = verify.score ?? null;
  }

  let leadId: number;
  try {
    leadId = createLead({
      source: "contact_form",
      name,
      email,
      phone,
      service,
      message,
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
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar.",
    };
  }

  // CAPI "Lead" — disparado no SUBMIT do formulário (conversão de lead do site).
  // Mesmo event_id do Pixel client (dedup). Fire-and-forget: já está salvo.
  if (input.metaEventId) {
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
        content_name: service ?? "contato",
        content_category: "agathas",
        lead_source: "contact_form",
      },
    }).then((res) => {
      if (res.ok) markLeadMetaSent(leadId);
    });
  }

  return { ok: true };
}
