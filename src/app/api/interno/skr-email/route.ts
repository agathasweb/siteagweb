import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendEmail } from "@/lib/email";

/**
 * E-mails do cadastro internacional do SK Render (21/11/2026): o SK Render não tem SMTP e chama esta rota com a
 * chave interna (x-skr-key = SKR_INTERNAL_KEY). Tipos: "codigo" (código de 6 dígitos) e "conta" (serial e links).
 */
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const url = (u: unknown) => (/^https:\/\/skrender\.agathas\.com\.br\//.test(String(u)) ? String(u) : "https://skrender.agathas.com.br/");

function autorizado(req: Request) {
  const k = process.env.SKR_INTERNAL_KEY?.trim() || "", v = req.headers.get("x-skr-key") || "";
  return k.length >= 24 && v.length === k.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(k));
}

const moldura = (corpo: string) => `<div style="font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f1b17;max-width:520px;margin:0 auto;padding:24px">
<p style="font-weight:800;color:#b5602f;margin:0 0 16px">SK Render</p>${corpo}
<p style="color:#8a8178;font-size:13px;margin-top:28px">Agathas Web · AGATHAS MANUTENCAO DE COMPUTADORES LTDA · CNPJ 10.573.571/0001-79</p></div>`;

export async function POST(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const es = b.lang === "es";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.para || ""))) return NextResponse.json({ error: "e-mail inválido" }, { status: 400 });
  const nome = esc(String(b.nome || "").split(" ")[0]);
  let subject: string, html: string;
  if (b.tipo === "codigo" && /^\d{6}$/.test(String(b.codigo))) {
    subject = es ? `Tu código de SK Render: ${b.codigo}` : `Your SK Render code: ${b.codigo}`;
    html = moldura(`<p>${es ? "Hola" : "Hi"}, ${nome}!</p><p>${es ? "Tu código para crear la cuenta es:" : "Your code to create the account is:"}</p>
<p style="font-size:32px;font-weight:800;letter-spacing:6px;margin:12px 0">${b.codigo}</p><p>${es ? "Vale por 10 minutos." : "Valid for 10 minutes."}</p>`);
  } else if (b.tipo === "conta") {
    subject = es ? "Tu cuenta de SK Render está lista" : "Your SK Render account is ready";
    html = moldura(`<p>${es ? "Hola" : "Hi"}, ${nome}!</p><p>${es ? "Tu cuenta está creada. Este es tu serial (lo pegas en el plugin la primera vez):" : "Your account is ready. This is your serial (paste it into the plugin the first time):"}</p>
<p style="font-size:20px;font-weight:800;font-family:monospace;margin:12px 0">${esc(b.serial)}</p>
<p><a href="${esc(url(b.download))}" style="display:inline-block;background:#b5602f;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">${es ? "Descargar el plugin" : "Download the plugin"}</a></p>
<p><a href="${esc(url(b.conta))}">${es ? "Abrir mi cuenta: comprar renders o suscribirme" : "Open my account: buy renders or subscribe"}</a></p>`);
  } else {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  const r = await sendEmail({ to: b.para, subject, html });
  if (!r.ok) { console.error("[skr-email]", r.error); return NextResponse.json({ error: "falha no envio" }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}
