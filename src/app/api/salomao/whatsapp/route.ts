import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { decidirRecaptcha, verifyRecaptcha } from "@/lib/recaptcha";
import { registrarRecusaRecaptcha } from "@/lib/db/recaptcha-recusas";
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
  const decisao = decidirRecaptcha(rc);
  if (!rc.ok) {
    console.warn(`[salomao-whatsapp] reCAPTCHA ${decisao}: score=${rc.score ?? "-"} host=${rc.hostname ?? "-"} erros=${(rc.errors ?? []).join(",")}`);
  }
  if (decisao === "recusado") {
    registrarRecusaRecaptcha({ rota: "salomao_whatsapp", rc, nome: b.nome, telefone: b.telefone, escola: b.escola, pagina: h.get("referer"), ip, userAgent: h.get("user-agent") });
    return NextResponse.json({ ok: false, error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." }, { status: 403 });
  }
  // Nota baixa não barra (o navegador do Instagram costuma levar nota baixa): o lead entra marcado e a equipe decide.
  const suspeito = decisao === "suspeito";

  const nome = validateName(String(b.nome ?? ""));
  // E-mail é opcional: 3 escolas abriram o formulário em 30–31/10 e nenhuma enviou. Quem preenche, é validado.
  const emailBruto = String(b.email ?? "").trim();
  const email = emailBruto ? validateEmail(emailBruto) : ({ ok: true, normalized: "" } as ReturnType<typeof validateEmail>);
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
    email: email.normalized ?? "",
    phone: fone.normalized!,
    service: SERVICO,
    message: `${suspeito ? `⚠️ Suspeito: reCAPTCHA nota ${rc.score ?? "indisponível"}. Pode ser gente: confira antes de descartar.\n` : ""}Quer falar com um especialista do Salomão (botão: ${origem}).${escola ? `\nEscola: ${escola}` : ""}`,
    origin_page: pagina,
    recaptcha_score: rc.score ?? null,
    ip: ip ?? null,
    user_agent: userAgent,
    tags: suspeito ? "salomao whatsapp suspeito" : "salomao whatsapp",
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
  if (metaEventId && !suspeito) {
    const geo = extractGeoFromHeaders(h);
    void sendCapiEvent({
      eventName: "Lead",
      eventId: metaEventId,
      produto: "salomao",
      eventSourceUrl: opcional(b.eventSourceUrl, 1000) ?? pagina,
      actionSource: "website",
      leadId,
      userData: {
        email: email.normalized || null,
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
      email: email.normalized || null,
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
