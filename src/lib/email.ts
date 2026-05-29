import "server-only";
import nodemailer from "nodemailer";

/**
 * Envio de e-mail transacional via SMTP.
 *
 * Produção: SMTP do HestiaCP (defina SMTP_* no .env).
 * Desenvolvimento: se SMTP_HOST não estiver definido, cai no Mailpit do
 * container DDEV (localhost:1025, sem auth) — todo e-mail é capturado e
 * visível no painel do Mailpit, nada sai de verdade.
 */

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  from: string;
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    // Fallback dev — Mailpit do DDEV
    return {
      host: "localhost",
      port: 1025,
      secure: false,
      user: null,
      pass: null,
      from: process.env.SMTP_FROM?.trim() || "Agathas Web <noreply@agathasweb.com>",
    };
  }
  return {
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() || null,
    pass: process.env.SMTP_PASS?.trim() || null,
    from: process.env.SMTP_FROM?.trim() || "Agathas Web <no-reply@agathas.com.br>",
  };
}

export function isSmtpConfigured(): boolean {
  return !!process.env.SMTP_HOST?.trim();
}

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(cfg: SmtpConfig): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  return cachedTransport;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Texto puro fallback (gerado do HTML se omitido). */
  text?: string;
  /** Sobrescreve o remetente padrão. */
  from?: string;
  /** Cópia oculta — usado pra notificar a equipe Agathas. */
  bcc?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = getSmtpConfig();
  try {
    const transport = getTransport(cfg);
    const info = await transport.sendMail({
      from: input.from ?? cfg.from,
      to: input.to,
      bcc: input.bcc,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToText(input.html),
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Verifica a conexão SMTP sem enviar e-mail. */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  const cfg = getSmtpConfig();
  try {
    await getTransport(cfg).verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ============================================================
// Templates
// ============================================================

const BRAND = {
  bg: "#0A0A0A",
  card: "#1A1A1A",
  accent: "#9333EA",
  green: "#22C55E",
  text: "#E5E7EB",
  muted: "#9CA3AF",
};

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:20px;font-weight:700;color:#fff;">Agathas Web</div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <h1 style="margin:16px 0 12px;font-size:22px;color:#fff;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;font-size:12px;color:${BRAND.muted};">
            Agathas Web · agathas.com.br · Este é um e-mail automático, não responda.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string, color = BRAND.green): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#000;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">${label}</a>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.text};">${text}</p>`;
}

/** E-mail de confirmação de pagamento — plano de tráfego pago. */
export function trafegoConfirmationEmail(opts: {
  customerName: string;
  planName: string;
}): { subject: string; html: string } {
  const subject = "Pagamento confirmado — Tráfego Pago Agathas Web";
  const html = layout(
    "Pagamento confirmado! 🎉",
    p(`Olá, <strong>${opts.customerName}</strong>!`) +
      p(`Recebemos a confirmação do pagamento do seu plano <strong>${opts.planName}</strong>. Seja bem-vindo(a) à gestão de tráfego da Agathas Web.`) +
      p("Nossa equipe vai entrar em contato em até <strong>1 dia útil</strong> pelo WhatsApp para iniciar o onboarding: alinhamento de objetivos, acessos às contas de anúncio e configuração técnica.") +
      p(`<span style="color:${BRAND.muted};font-size:13px;">Qualquer dúvida, fale com a gente no WhatsApp +55 62 9690-1469.</span>`),
  );
  return { subject, html };
}

/** E-mail de confirmação de pagamento — Voyia, com link de criação de conta. */
export function voyiaConfirmationEmail(opts: {
  customerName: string;
  planName: string;
  accountUrl: string;
}): { subject: string; html: string } {
  const subject = "Pagamento confirmado — crie sua conta Voyia";
  const html = layout(
    "Pagamento confirmado! 🎉",
    p(`Olá, <strong>${opts.customerName}</strong>!`) +
      p(`Recebemos a confirmação do pagamento do seu plano <strong>${opts.planName}</strong>. Agora é só criar a sua conta para começar a usar o Voyia.`) +
      `<div style="margin:24px 0;text-align:center;">${button(opts.accountUrl, "Criar minha conta Voyia")}</div>` +
      p(`<span style="color:${BRAND.muted};font-size:13px;">Este link é pessoal e válido para a sua assinatura. Não compartilhe.</span>`),
  );
  return { subject, html };
}

/** Notificação interna para a equipe Agathas sobre nova assinatura paga. */
export function teamNotificationEmail(opts: {
  planName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  value: number;
}): { subject: string; html: string } {
  const subject = `💰 Nova assinatura paga — ${opts.planName}`;
  const html = layout(
    "Nova assinatura confirmada",
    p(`<strong>Plano:</strong> ${opts.planName}`) +
      p(`<strong>Cliente:</strong> ${opts.customerName}`) +
      p(`<strong>E-mail:</strong> ${opts.customerEmail}`) +
      p(`<strong>Telefone:</strong> ${opts.customerPhone ?? "—"}`) +
      p(`<strong>Valor:</strong> R$ ${opts.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`),
  );
  return { subject, html };
}

/**
 * Alerta interno: cliente iniciou o checkout mas não concluiu o pagamento
 * (detectado pelo cron 30min após o início). Lead quente para recontato.
 */
export function abandonedCheckoutEmail(opts: {
  planName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  value: number;
  startedAt: string;
  invoiceUrl?: string | null;
}): { subject: string; html: string } {
  const subject = `🛒 Compra não finalizada — ${opts.customerName} (${opts.planName})`;
  const phoneDigits = (opts.customerPhone ?? "").replace(/\D/g, "");
  const waLink = phoneDigits
    ? `https://api.whatsapp.com/send?phone=${phoneDigits.startsWith("55") ? phoneDigits : "55" + phoneDigits}`
    : null;
  const html = layout(
    "Cliente iniciou o pagamento e não concluiu",
    p(`Um cliente iniciou o checkout há mais de 30 minutos e ainda <strong>não concluiu o pagamento</strong>. Vale entrar em contato enquanto o interesse está quente.`) +
      p(`<strong>Plano:</strong> ${opts.planName}`) +
      p(`<strong>Cliente:</strong> ${opts.customerName}`) +
      p(`<strong>E-mail:</strong> ${opts.customerEmail}`) +
      p(`<strong>Telefone:</strong> ${opts.customerPhone ?? "—"}`) +
      p(`<strong>Valor:</strong> R$ ${opts.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`) +
      p(`<strong>Início do checkout:</strong> ${opts.startedAt} (UTC)`) +
      (waLink || opts.invoiceUrl
        ? `<div style="margin:24px 0;text-align:center;">` +
          (waLink ? button(waLink, "Falar no WhatsApp") : "") +
          (opts.invoiceUrl
            ? ` ${button(opts.invoiceUrl, "Ver fatura em aberto", BRAND.accent)}`
            : "") +
          `</div>`
        : "") +
      p(`<span style="color:${BRAND.muted};font-size:13px;">O lead foi marcado com a tag "Compra não Finalizada" no admin e no VOYIA.</span>`),
  );
  return { subject, html };
}
