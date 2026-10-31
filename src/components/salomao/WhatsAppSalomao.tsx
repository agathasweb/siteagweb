"use client";

import { useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import { maskPhone } from "@/lib/phone";
import { snapshotAttribution } from "@/lib/meta/attribution";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";
import { dadosTikTokCliente, identificarTikTok, trackTikTok } from "@/lib/tiktok/pixel";

/**
 * WhatsApp das páginas do Salomão. Fala do produto e vai para o número do Salomão (não para o
 * atendimento geral da agência), mas passa pelo mesmo funil do resto do site: o botão abre um
 * formulário curto, o pedido vira lead (YESHUA + Voyia, via /api/salomao/whatsapp) e só então a
 * conversa abre. Sem isso, quem clicava e não mandava a mensagem sumia sem registro.
 *
 * Conversão: `Lead` no pixel do Salomão (+ CAPI no servidor, mesmo event_id) e `SubmitForm` no
 * TikTok. Clicar no botão não conta nada — só o envio com nome, e-mail e telefone.
 */
const NUMERO = "5562991239558";

function linkWhatsApp(origem: string, nome: string, escola: string): string {
  const quem = escola ? `${nome}, da ${escola}` : nome;
  const texto = `Olá! Sou ${quem}. Vim pela página do Salomão (${origem}) e quero conhecer o app para a minha escola.`;
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(texto)}`;
}

interface Props {
  pixelId: string | null;
  recaptchaSiteKey: string | null;
  origem: string;
}

function useModalWhatsApp({ pixelId, recaptchaSiteKey, origem }: Props) {
  const [aberto, setAberto] = useState(false);
  const [fone, setFone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [link, setLink] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function abrir() {
    setErro(null);
    setErros({});
    setLink(null);
    setAberto(true);
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setErros({});
    const f = new FormData(e.currentTarget);
    const nome = String(f.get("nome") ?? "").trim();
    const escola = String(f.get("escola") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    startTransition(async () => {
      const token = recaptchaSiteKey ? await executeRecaptcha(recaptchaSiteKey, "salomao_whatsapp") : null;
      const a = snapshotAttribution();
      // O mesmo event_id vai no Pixel e no CAPI do servidor: a Meta conta um Lead só.
      const eventId = newEventId();
      const tt = dadosTikTokCliente();
      try {
        const res = await fetch("/api/salomao/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome, escola, email, telefone: fone, origem, recaptchaToken: token,
            utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, utm_term: a.utm_term, utm_content: a.utm_content,
            metaEventId: eventId, fbp: a.fbp, fbc: a.fbc, fbclid: a.fbclid, externalId: a.externalId, eventSourceUrl: a.eventSourceUrl,
            ttclid: tt.ttclid, ttp: tt.ttp,
          }),
        });
        const j = (await res.json()) as { ok: boolean; error?: string; fieldErrors?: Record<string, string> };
        if (!j.ok) {
          setErros(j.fieldErrors ?? {});
          return setErro(j.error ?? "Não foi possível enviar agora. Tente de novo.");
        }
        trackPixelEventSingle(pixelId, "Lead", eventId, { content_name: "Salomão — WhatsApp", content_category: "salomao" });
        identificarTikTok(email, fone);
        trackTikTok("SubmitForm", eventId, { contents: [{ content_id: "salomao-whatsapp", content_name: "Salomão — WhatsApp" }] });

        const url = linkWhatsApp(origem, nome, escola);
        setLink(url);
        // Depois do await o navegador pode barrar a aba nova (popup): aí segue na mesma aba.
        // Sem a feature "noopener" aqui: com ela o window.open devolve null mesmo quando abre.
        const aba = window.open(url, "_blank");
        if (aba) aba.opener = null;
        else window.location.href = url;
      } catch {
        setErro("Não foi possível enviar agora. Tente de novo.");
      }
    });
  }

  const campo = (k: string) =>
    `mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 focus:border-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#d4a72c]/40 ${erros[k] ? "border-red-400" : "border-slate-300"}`;
  const rotulo = "block text-sm font-medium text-slate-700";
  const msg = (k: string) => (erros[k] ? <p className="mt-1 text-xs text-red-600">{erros[k]}</p> : null);

  const modal = aberto && typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="wa-salomao-titulo"
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) setAberto(false); }}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 text-slate-900 shadow-xl sm:rounded-2xl">
        {link ? (
          <div className="py-4 text-center">
            <h2 id="wa-salomao-titulo" className="text-xl font-bold text-[#1f2a44]">Pronto! Abrindo o WhatsApp…</h2>
            <p className="mt-3 text-slate-600">Se a conversa não abriu sozinha, toque no botão abaixo. Um especialista do Salomão responde por lá.</p>
            <a href={link} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">
              <IconeWhatsApp className="h-5 w-5" /> Abrir o WhatsApp
            </a>
            <button type="button" onClick={() => setAberto(false)} className="mt-3 block w-full text-sm text-slate-500 hover:text-slate-700">Fechar</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4" noValidate>
            <div>
              <h2 id="wa-salomao-titulo" className="text-xl font-bold text-[#1f2a44]">Falar com um especialista</h2>
              <p className="mt-1 text-sm text-slate-600">Deixe seus dados para o especialista já chegar no WhatsApp sabendo quem é você. Leva 15 segundos.</p>
            </div>
            <div><label htmlFor="wa-s-nome" className={rotulo}>Seu nome</label><input id="wa-s-nome" name="nome" required maxLength={120} autoComplete="name" autoFocus className={campo("nome")} />{msg("nome")}</div>
            <div><label htmlFor="wa-s-escola" className={rotulo}>Nome da escola <span className="font-normal text-slate-400">(opcional)</span></label><input id="wa-s-escola" name="escola" maxLength={160} autoComplete="organization" className={campo("escola")} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="wa-s-fone" className={rotulo}>WhatsApp</label><input id="wa-s-fone" required inputMode="tel" autoComplete="tel" placeholder="(62) 99999-9999" value={fone} onChange={(e) => setFone(maskPhone(e.target.value))} className={campo("telefone")} />{msg("telefone")}</div>
              <div><label htmlFor="wa-s-email" className={rotulo}>E-mail</label><input id="wa-s-email" name="email" type="email" required autoComplete="email" className={campo("email")} />{msg("email")}</div>
            </div>
            {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAberto(false)} disabled={enviando} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-6 py-3 font-bold text-[#0b3d1f] hover:bg-[#3ee07b] disabled:opacity-60">
                <IconeWhatsApp className="h-5 w-5" /> {enviando ? "Enviando…" : "Abrir o WhatsApp"}
              </button>
            </div>
            <p className="text-xs text-slate-500">Protegido por reCAPTCHA. Usamos seus dados só para falar com você sobre o Salomão.</p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return { abrir, modal };
}

export function BotaoWhatsApp({ pixelId, recaptchaSiteKey, origem, className, children }: Props & { className?: string; children?: ReactNode }) {
  const { abrir, modal } = useModalWhatsApp({ pixelId, recaptchaSiteKey, origem });
  return (
    <>
      <button type="button" onClick={abrir}
        className={className ?? "inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]"}>
        <IconeWhatsApp className="h-5 w-5" />
        {children ?? "Tirar dúvidas no WhatsApp"}
      </button>
      {modal}
    </>
  );
}

/** Botão flutuante (o do site some nas páginas do Salomão — ver FloatingWhatsAppButton). */
export function WhatsAppFlutuanteSalomao({ pixelId, recaptchaSiteKey }: Omit<Props, "origem">) {
  const { abrir, modal } = useModalWhatsApp({ pixelId, recaptchaSiteKey, origem: "botão flutuante" });
  return (
    <>
      <button type="button" onClick={abrir} aria-label="Falar com a equipe do Salomão no WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-2xl shadow-green-600/40 transition-all hover:scale-110 sm:h-16 sm:w-16 [html[data-barra-compra]_&]:bottom-24">
        <IconeWhatsApp className="h-7 w-7 sm:h-8 sm:w-8" />
      </button>
      {modal}
    </>
  );
}

function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 01-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 012.77 6.68c0 5.2-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0012.05.69C5.78.69.68 5.79.68 12.05c0 2 .52 3.96 1.52 5.68L.6 23.3l5.7-1.5a11.33 11.33 0 005.74 1.47h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.04z" />
    </svg>
  );
}
