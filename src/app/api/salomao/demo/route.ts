import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validateCpfCnpj, validatePhone } from "@/lib/phone";
import { createLead } from "@/lib/db/leads";
import { sendEmail, salomaoDemoEquipeEmail, salomaoDemoSolicitadoEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL?.trim() || "webmaster@agathas.com.br";

/**
 * POST /api/salomao/demo — pedido de acesso de demonstração (landing pages do Salomão).
 * reCAPTCHA v3 → lead no site, que espelha no YESHUA (push + e-mail + WhatsApp de plantão) →
 * e-mail para a equipe e confirmação para o interessado (liberação em até 24 h).
 */
export async function POST(req: Request) {
  let b: Record<string, string>;
  try {
    b = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || undefined;

  const rc = await verifyRecaptcha(String(b.recaptchaToken ?? ""), "salomao_demo", ip);
  if (!rc.ok) return NextResponse.json({ ok: false, error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." }, { status: 403 });

  const nome = String(b.nome ?? "").trim().slice(0, 120);
  const razaoSocial = String(b.razaoSocial ?? "").trim().slice(0, 160);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 190);
  const doc = validateCpfCnpj(String(b.cnpj ?? ""));
  const fone = validatePhone(String(b.telefone ?? ""));
  if (!nome || !razaoSocial || !EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "Preencha nome, razão social e e-mail." }, { status: 422 });
  if (!doc.ok || doc.normalized?.length !== 14) return NextResponse.json({ ok: false, error: "Informe um CNPJ válido." }, { status: 422 });
  if (!fone.ok) return NextResponse.json({ ok: false, error: fone.error ?? "Telefone inválido." }, { status: 422 });
  const telefone = fone.normalized!;
  const pagina = h.get("referer");

  createLead({
    source: "quote_request",
    name: nome,
    email,
    phone: telefone,
    service: "Salomão — acesso demo",
    message: `Pedido de acesso DEMO do Salomão (liberar em até 24 h).\nRazão social: ${razaoSocial}\nCNPJ: ${doc.normalized}`,
    origin_page: pagina,
    recaptcha_score: rc.score ?? null,
    ip: ip ?? null,
    user_agent: h.get("user-agent"),
    tags: "salomao demo",
    utm_source: b.utm_source || null,
    utm_medium: b.utm_medium || null,
    utm_campaign: b.utm_campaign || null,
  });

  const equipe = salomaoDemoEquipeEmail({ nome, razaoSocial, cnpj: doc.normalized!, email, telefone, pagina });
  const confirmacao = salomaoDemoSolicitadoEmail({ nome, instituicao: razaoSocial });
  await Promise.allSettled([
    sendEmail({ to: TEAM_EMAIL, subject: equipe.subject, html: equipe.html }),
    sendEmail({ to: email, subject: confirmacao.subject, html: confirmacao.html }),
  ]);

  return NextResponse.json({ ok: true });
}
