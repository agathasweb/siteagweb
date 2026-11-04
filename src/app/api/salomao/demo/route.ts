import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { decidirRecaptcha, verifyRecaptcha } from "@/lib/recaptcha";
import { registrarRecusaRecaptcha } from "@/lib/db/recaptcha-recusas";
import { validatePhone } from "@/lib/phone";
import { createLead, markLeadMetaSent } from "@/lib/db/leads";
import { sendCapiEvent } from "@/lib/meta/capi";
import { sendTikTokEvent } from "@/lib/tiktok/events-api";
import { linksDemo, type LinksDemo } from "@/lib/salomao/api";
import { extractGeoFromHeaders } from "@/lib/meta/user-data";
import { db } from "@/lib/db";
import { sendEmail, salomaoDemoEquipeEmail, salomaoDemoSolicitadoEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAILS_POR_DIA = 3;

/** O Referer vem de quem chama: só entra no e-mail do visitante se for uma página do Salomão (senão, a página fixa). */
function paginaSalomao(pagina: string | null): string {
  try {
    const u = new URL(pagina ?? "");
    if (u.protocol === "https:" && /^(agathas\.com\.br|(oferta|conheca)\.salomao\.agathas\.com\.br)$/.test(u.hostname)) return u.origin + u.pathname;
  } catch {}
  return "https://agathas.com.br/produtos/salomao";
}

const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL?.trim() || "webmaster@agathas.com.br";

/**
 * POST /api/salomao/demo — pedido de acesso de demonstração (landing pages do Salomão).
 * reCAPTCHA v3 → lead no site, que espelha no YESHUA (push + e-mail + WhatsApp de plantão) →
 * links de entrada IMEDIATA na escola demo (diretor e família, ~1 h, gerados pela API do Salomão) →
 * e-mail para a equipe e para o interessado. Se o Salomão não responder, cai na liberação manual (24 h).
 * O Lead também vai pelo CAPI ao pixel do Salomão, com o mesmo event_id do Pixel do navegador:
 * quem bloqueia o Pixel (iPhone, bloqueador) continua contando como conversão.
 * O SubmitForm vai do mesmo jeito à Events API do TikTok (mesmo event_id do pixel dele).
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

  const rc = await verifyRecaptcha(String(b.recaptchaToken ?? ""), "salomao_demo", ip);
  const decisao = decidirRecaptcha(rc);
  if (!rc.ok) {
    console.warn(`[salomao-demo] reCAPTCHA ${decisao}: score=${rc.score ?? "-"} host=${rc.hostname ?? "-"} erros=${(rc.errors ?? []).join(",")}`);
  }
  if (decisao === "recusado") {
    registrarRecusaRecaptcha({ rota: "salomao_demo", rc, nome: b.nome, telefone: b.telefone, escola: b.escola, pagina: h.get("referer"), ip, userAgent: h.get("user-agent") });
    return NextResponse.json({ ok: false, error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." }, { status: 403 });
  }
  // Nota baixa não barra (o navegador do Instagram costuma levar nota baixa): o lead entra marcado e a equipe decide.
  // Até lá, sem conversão para a Meta e o TikTok e sem e-mail para o endereço informado.
  const suspeito = decisao === "suspeito";

  const nome = String(b.nome ?? "").trim().slice(0, 120);
  // Formulário curto (02/11/2026): razão social e CNPJ saíram — eram atrito para quem só quer ver o app
  // funcionando. Nome da escola + WhatsApp bastam; o e-mail é opcional (quem informa recebe os links).
  const escola = String(b.escola ?? b.razaoSocial ?? "").trim().slice(0, 160);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 190);
  const fone = validatePhone(String(b.telefone ?? ""));
  if (!nome || !escola) return NextResponse.json({ ok: false, error: "Preencha seu nome e o nome da escola." }, { status: 422 });
  if (email && !EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "Confira o e-mail (ou deixe em branco)." }, { status: 422 });
  if (!fone.ok) return NextResponse.json({ ok: false, error: fone.error ?? "Telefone inválido." }, { status: 422 });
  const telefone = fone.normalized!;
  const pagina = h.get("referer");
  const userAgent = h.get("user-agent");
  const opcional = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const metaEventId = opcional(b.metaEventId, 100);

  // limites: 5 pedidos por IP por hora; a confirmação vai no máximo 1 vez por e-mail a cada 24 h
  const SERVICO = "Salomão — acesso demo";
  const porIp = ip
    ? (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE service = ? AND ip = ? AND created_at >= datetime('now', '-1 hour')").get(SERVICO, ip) as { n: number }).n
    : 0;
  if (porIp >= 5) return NextResponse.json({ ok: false, error: "Muitos pedidos seguidos. Tente de novo mais tarde." }, { status: 429 });
  // pedidos anteriores deste e-mail nas últimas 24 h: o e-mail sai no máximo EMAILS_POR_DIA vezes por destinatário
  // (o formulário não vira canhão de e-mail contra a caixa de terceiros; acima disso os links só aparecem na tela)
  const pedidosDoEmail = !email ? 0 : (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE service = ? AND lower(email) = ? AND created_at >= datetime('now', '-1 day')")
    .get(SERVICO, email) as { n: number }).n;

  const leadId = createLead({
    source: "quote_request",
    name: nome,
    email,
    phone: telefone,
    service: SERVICO,
    message: `${suspeito ? `⚠️ Suspeito: reCAPTCHA nota ${rc.score ?? "indisponível"}. Pode ser gente: confira antes de descartar.\n` : ""}Pedido de acesso DEMO do Salomão.\nEscola: ${escola}`,
    origin_page: pagina,
    recaptcha_score: rc.score ?? null,
    ip: ip ?? null,
    user_agent: userAgent,
    tags: suspeito ? "salomao demo suspeito" : "salomao demo",
    fbp: opcional(b.fbp),
    fbc: opcional(b.fbc),
    fbclid: opcional(b.fbclid),
    utm_source: b.utm_source || null,
    utm_medium: b.utm_medium || null,
    utm_campaign: b.utm_campaign || null,
    utm_term: opcional(b.utm_term),
    utm_content: opcional(b.utm_content),
    meta_event_id: metaEventId,
  });

  // CAPI "Lead" — fire-and-forget: o lead já está salvo e o e-mail não pode esperar a Meta.
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
        email: email || null,
        phone: telefone,
        fullName: nome,
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
      customData: { content_name: SERVICO, content_category: "salomao", lead_source: "salomao_demo" },
    }).then((res) => {
      if (res.ok) markLeadMetaSent(leadId);
    });
  }

  if (metaEventId && !suspeito) {
    void sendTikTokEvent({
      evento: "SubmitForm",
      eventId: metaEventId,
      url: opcional(b.eventSourceUrl, 1000) ?? pagina,
      email: email || null,
      telefone,
      externalId: opcional(b.externalId, 100),
      ttclid: opcional(b.ttclid),
      ttp: opcional(b.ttp),
      ip: ip ?? null,
      userAgent,
      propriedades: { contents: [{ content_id: "salomao-demo", content_name: SERVICO }] },
    });
  }

  let links: LinksDemo | null = null;
  try {
    links = await linksDemo();
  } catch (err) {
    console.error("[salomao-demo] links de demonstração indisponíveis, fica a liberação manual:", err);
  }

  const equipe = salomaoDemoEquipeEmail({ nome, escola, email, telefone, pagina, liberadoNaHora: !!links });
  const confirmacao = salomaoDemoSolicitadoEmail(links, paginaSalomao(pagina));
  await Promise.allSettled([
    sendEmail({ to: TEAM_EMAIL, subject: `${suspeito ? "[Suspeito] " : ""}${equipe.subject}`, html: equipe.html }),
    // com links: até EMAILS_POR_DIA por endereço; sem links (liberação manual): a confirmação sai 1 vez por dia
    ...(suspeito || !email || pedidosDoEmail >= (links ? EMAILS_POR_DIA : 1) ? [] : [sendEmail({ to: email, subject: confirmacao.subject, html: confirmacao.html })]),
  ]);

  return NextResponse.json({ ok: true, demo: links ? { diretor: links.diretor, familia: links.familia, validadeMinutos: links.validade_minutos } : null });
}
