"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import { maskCpfCnpj, maskPhone } from "@/lib/phone";
import { snapshotAttribution } from "@/lib/meta/attribution";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";
import { dadosTikTokCliente, identificarTikTok, trackTikTok } from "@/lib/tiktok/pixel";

/**
 * "Solicitar acesso demo": formulário em janela com reCAPTCHA v3. O pedido vira lead no YESHUA (push)
 * e e-mail para a equipe; a liberação é manual, em até 24 horas. A senha da demo nunca aparece aqui.
 */
export default function SolicitarDemo({ recaptchaSiteKey, pixelId, className }: { recaptchaSiteKey: string | null; pixelId: string | null; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [fone, setFone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const f = new FormData(e.currentTarget);
    startTransition(async () => {
      const token = recaptchaSiteKey ? await executeRecaptcha(recaptchaSiteKey, "salomao_demo") : null;
      const a = snapshotAttribution();
      // O mesmo event_id vai no Pixel e no CAPI do servidor: a Meta conta um Lead só.
      const eventId = newEventId();
      const tt = dadosTikTokCliente();
      try {
        const res = await fetch("/api/salomao/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: f.get("nome"), razaoSocial: f.get("razaoSocial"), cnpj, email: f.get("email"), telefone: fone,
            recaptchaToken: token, utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign,
            utm_term: a.utm_term, utm_content: a.utm_content,
            metaEventId: eventId, fbp: a.fbp, fbc: a.fbc, fbclid: a.fbclid, externalId: a.externalId, eventSourceUrl: a.eventSourceUrl,
            ttclid: tt.ttclid, ttp: tt.ttp,
          }),
        });
        const j = (await res.json()) as { ok: boolean; error?: string };
        if (!j.ok) return setErro(j.error ?? "Não foi possível enviar agora. Tente de novo.");
        trackPixelEventSingle(pixelId, "Lead", eventId, { content_name: "Salomão — acesso demo", content_category: "salomao" });
        identificarTikTok(String(f.get("email") ?? ""), fone);
        trackTikTok("SubmitForm", eventId, { contents: [{ content_id: "salomao-demo", content_name: "Salomão — acesso demo" }] });
        setEnviado(true);
      } catch {
        setErro("Não foi possível enviar agora. Tente de novo.");
      }
    });
  }

  const campo = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#d4a72c]/40";
  const rotulo = "block text-sm font-medium text-slate-700";

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        className={className ?? "rounded-lg border border-white/40 px-6 py-3.5 font-semibold text-white hover:border-white"}>
        Solicitar acesso demo
      </button>
      {aberto && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="demo-titulo"
          onClick={(e) => { if (e.target === e.currentTarget && !enviando) setAberto(false); }}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 text-slate-900 shadow-xl sm:rounded-2xl">
            {enviado ? (
              <div className="py-6 text-center">
                <h2 id="demo-titulo" className="text-xl font-bold text-[#1f2a44]">Pedido recebido!</h2>
                <p className="mt-3 text-slate-600">Vamos liberar o acesso de demonstração para a sua instituição em até <strong>24 horas</strong> e enviar os dados de entrada por e-mail.</p>
                <button type="button" onClick={() => setAberto(false)} className="mt-6 rounded-lg bg-[#1f2a44] px-6 py-3 font-semibold text-white">Fechar</button>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <h2 id="demo-titulo" className="text-xl font-bold text-[#1f2a44]">Solicitar acesso demo</h2>
                  <p className="mt-1 text-sm text-slate-600">Teste o Salomão com uma escola de exemplo. Liberamos o acesso em até 24 horas.</p>
                </div>
                <div><label htmlFor="demo-nome" className={rotulo}>Seu nome</label><input id="demo-nome" name="nome" required maxLength={120} autoComplete="name" className={campo} /></div>
                <div><label htmlFor="demo-razao" className={rotulo}>Razão social da instituição</label><input id="demo-razao" name="razaoSocial" required maxLength={160} autoComplete="organization" className={campo} /></div>
                <div><label htmlFor="demo-cnpj" className={rotulo}>CNPJ</label><input id="demo-cnpj" required inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(maskCpfCnpj(e.target.value))} className={campo} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="demo-email" className={rotulo}>E-mail</label><input id="demo-email" name="email" type="email" required autoComplete="email" className={campo} /></div>
                  <div><label htmlFor="demo-fone" className={rotulo}>Telefone (WhatsApp)</label><input id="demo-fone" required inputMode="tel" autoComplete="tel" value={fone} onChange={(e) => setFone(maskPhone(e.target.value))} className={campo} /></div>
                </div>
                {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setAberto(false)} disabled={enviando} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                  <button type="submit" disabled={enviando} className="rounded-lg bg-[#d4a72c] px-6 py-3 font-bold text-[#1f2a44] hover:bg-[#e0b84a] disabled:opacity-60">{enviando ? "Enviando…" : "Solicitar acesso"}</button>
                </div>
                <p className="text-xs text-slate-500">Protegido por reCAPTCHA. Usamos seus dados só para liberar o acesso e falar com você sobre o Salomão.</p>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
