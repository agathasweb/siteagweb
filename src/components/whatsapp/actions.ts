"use server";

import { headers } from "next/headers";
import { createLead, markLeadMetaSent } from "@/lib/db/leads";
import { sendCapiEvent } from "@/lib/meta/capi";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";
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
  ctaContext?: string | null; // ex: "voyia-hero", "contato-final"
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

  /*
   * CAPI "Lead" — pelo MESMO caminho do formulário de contato.
   *
   * O modal exige nome, e-mail e telefone antes de abrir a conversa: quem chega
   * aqui preencheu um formulário, e a decisão da Agathas é mandar o tráfego para
   * o site e alimentar o pixel, não despejar o cliente direto no WhatsApp.
   *
   * Por que ESTE caminho e não o CAPI do YESHUA (que era quem disparava antes):
   * o YESHUA mandava para outro pixel, e apontá-lo para o pixel do site faria o
   * formulário de contato contar DUAS vezes — lá o Pixel do navegador e este
   * CAPI já cobrem o evento com o mesmo `event_id` e a Meta deduplica, enquanto
   * o YESHUA entraria com um `event_id` próprio. Um caminho por evento.
   *
   * Aqui o navegador NÃO dispara `Lead` (clicar no botão não é conversão), então
   * este envio é o único — não há par para deduplicar, e não há duplicação.
   *
   * Fire-and-forget: o lead já está salvo, e o WhatsApp abre sem esperar a Meta.
   */
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
        content_name: input.ctaContext ?? "whatsapp",
        content_category: "agathas",
        lead_source: "whatsapp_cta",
      },
    }).then((res) => {
      if (res.ok) markLeadMetaSent(leadId);
    });
  }

  return { ok: true };
}
