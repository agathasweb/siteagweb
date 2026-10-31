import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validateEmail, validateName, validatePhone } from "@/lib/phone";
import { createLead, markLeadMetaSent } from "@/lib/db/leads";
import { sendCapiEvent } from "@/lib/meta/capi";
import { sendTikTokEvent } from "@/lib/tiktok/events-api";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";
import { db } from "@/lib/db";

const SERVICO = "Salomão — WhatsApp";

/**
 * POST /api/salomao/whatsapp — "Falar com um especialista" das páginas do Salomão.
 *
 * Antes o botão abria o WhatsApp direto e a escola chegava sem registro: quem não mandava a mensagem
 * sumia, e o anúncio não tinha conversão para aprender. Agora é o mesmo desenho do modal do resto do
 * site: reCAPTCHA v3 → lead no site (que espelha no YESHUA e no Voyia) → Lead no CAPI do pixel do
 * Salomão (mesmo event_id do Pixel do navegador) e SubmitForm na Events API do TikTok → o navegador
 * abre a conversa.
 */
export async function POST(req: Request) {
  let b: Record<string, string>;
  try {
    b = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const h = await headers();
  // Só o cf-connecting-ip é confiável atrás da Cloudflare (X-Forwarded-For vem do cliente). Fora da produção, o IP local.
  const ip = h.get("cf-connecting-ip") || (process.env.NODE_ENV !== "production" ? h.get("x-real-ip") : null) || undefined;

  const rc = await verifyRecaptcha(String(b.recaptchaToken ?? ""), "salomao_whatsapp", ip);
  if (!rc.ok) {
    console.warn(`[salomao-whatsapp] reCAPTCHA recusado: score=${rc.score ?? "-"} host=${rc.hostname ?? "-"} erros=${(rc.errors ?? []).join(",")}`);
    return NextResponse.json({ ok: false, error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." }, { status: 403 });
  }

  const nome = validateName(String(b.nome ?? ""));
  const email = validateEmail(String(b.email ?? ""));
  const fone = validatePhone(String(b.telefone ?? ""));
  const fieldErrors: Record<string, string> = {};
  if (!nome.ok) fieldErrors.nome = nome.error ?? "Informe seu nome.";
  if (!email.ok) fieldErrors.email = email.error ?? "E-mail inválido.";
  if (!fone.ok) fieldErrors.telefone = fone.error ?? "Telefone inválido.";
  if (Object.keys(fieldErrors).length) return NextResponse.json({ ok: false, error: "Verifique os campos.", fieldErrors }, { status: 422 });

  const opcional = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const escola = opcional(b.escola, 160);
  const origem = opcional(b.origem, 60) ?? "página";
  const metaEventId = opcional(b.metaEventId, 100);
  const pagina = h.get("referer");
  const userAgent = h.get("user-agent");

  // 5 por IP por hora: o formulário não vira canhão de leads falsos no YESHUA.
  const porIp = ip
    ? (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE service = ? AND ip = ? AND created_at >= datetime('now', '-1 hour')").get(SERVICO, ip) as { n: number }).n
    : 0;
  if (porIp >= 5) return NextResponse.json({ ok: false, error: "Muitos pedidos seguidos. Tente de novo mais tarde." }, { status: 429 });

  const leadId = createLead({
    source: "whatsapp_cta",
    name: nome.normalized!,
    email: email.normalized!,
    phone: fone.normalized!,
    service: SERVICO,
    message: `Quer falar com um especialista do Salomão (botão: ${origem}).${escola ? `\nEscola: ${escola}` : ""}`,
    origin_page: pagina,
    recaptcha_score: rc.score ?? null,
    ip: ip ?? null,
    user_agent: userAgent,
    tags: "salomao whatsapp",
    fbp: opcional(b.fbp),
    fbc: opcional(b.fbc),
    fbclid: opcional(b.fbclid),
    utm_source: opcional(b.utm_source),
    utm_medium: opcional(b.utm_medium),
    utm_campaign: opcional(b.utm_campaign),
    utm_term: opcional(b.utm_term),
    utm_content: opcional(b.utm_content),
    meta_event_id: metaEventId,
  });

  // Fire-and-forget: o lead já está salvo e o WhatsApp não pode esperar a Meta nem o TikTok.
  if (metaEventId) {
    const geo = extractGeoFromHeaders(h);
    void sendCapiEvent({
      eventName: "Lead",
      eventId: metaEventId,
      produto: "salomao",
      eventSourceUrl: opcional(b.eventSourceUrl, 1000) ?? pagina,
      actionSource: "website",
      leadId,
      userData: {
        email: email.normalized!,
        phone: fone.normalized!,
        fullName: nome.normalized!,
        externalId: opcional(b.externalId, 100),
        city: geo.city,
        state: geo.state,
        zip: geo.zip,
        country: (geo.country ?? "br").toLowerCase(),
        fbp: opcional(b.fbp),
        fbc: opcional(b.fbc),
        clientIp: ip ?? null,
        clientUserAgent: userAgent,
      },
      customData: { content_name: SERVICO, content_category: "salomao", lead_source: `salomao_whatsapp_${origem}` },
    }).then((res) => {
      if (res.ok) markLeadMetaSent(leadId);
    });

    void sendTikTokEvent({
      evento: "SubmitForm",
      eventId: metaEventId,
      url: opcional(b.eventSourceUrl, 1000) ?? pagina,
      email: email.normalized!,
      telefone: fone.normalized!,
      externalId: opcional(b.externalId, 100),
      ttclid: opcional(b.ttclid),
      ttp: opcional(b.ttp),
      ip: ip ?? null,
      userAgent,
      propriedades: { contents: [{ content_id: "salomao-whatsapp", content_name: SERVICO }] },
    });
  }

  return NextResponse.json({ ok: true });
}
