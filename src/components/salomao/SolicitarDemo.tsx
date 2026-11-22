"use client";

import { useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import { maskPhone } from "@/lib/phone";
import { snapshotAttribution } from "@/lib/meta/attribution";
import { trackPixelEventSingle, trackPixelCustomSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";
import { dispararConversaoGoogle } from "@/lib/google/conversion";
import CamposQualificacao from "@/components/salomao/CamposQualificacao";
import { dadosTikTokCliente, identificarTikTok, trackTikTok } from "@/lib/tiktok/pixel";
import { medirOpenAi } from "@/lib/openai/pixel";

/**
 * "Testar a demonstração": formulário em janela com reCAPTCHA v3. O pedido vira lead no YESHUA (push) e
 * a demo abre NA HORA: a API devolve links de entrada (diretor e família) que também vão por e-mail. Se o
 * Salomão não responder, volta a mensagem de liberação manual (24 h). A senha da demo nunca aparece aqui.
 */
export default function SolicitarDemo({ recaptchaSiteKey, pixelId, className, children }: { recaptchaSiteKey: string | null; pixelId: string | null; className?: string; children?: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [fone, setFone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [demo, setDemo] = useState<{ diretor: string; familia: string; validadeMinutos: number } | null>(null);
  const [emailInformado, setEmailInformado] = useState(false);
  // Formulário em 2 passos (21/11/2026): 1º as três perguntas de toque, depois nome/escola/WhatsApp.
  const [qualif, setQualif] = useState<{ tipoEscola: string; alunos: string; papel: string } | null>(null);
  const [enviando, startTransition] = useTransition();

  /** Abrir o formulário também é medido: antes não dava para saber se a pessoa clicava e desistia. */
  function abrir() {
    setAberto(true);
    trackPixelCustomSingle(pixelId, "AbriuDemonstracao", newEventId(), { content_name: "Salomão — acesso demo", content_category: "salomao" });
    window.clarity?.("event", "abriu_demo");
  }

  function avancar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const tipoEscola = String(f.get("tipoEscola") ?? "");
    const alunos = String(f.get("alunos") ?? "");
    const papel = String(f.get("papel") ?? "");
    if (!tipoEscola || !alunos || !papel) return setErro("Responda as três perguntas para continuar.");
    setErro(null);
    setQualif({ tipoEscola, alunos, papel });
    window.clarity?.("event", "demo_passo2");
  }

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
            nome: f.get("nome"), escola: f.get("escola"), email: f.get("email"), telefone: fone,
            tipoEscola: qualif?.tipoEscola, alunos: qualif?.alunos, papel: qualif?.papel,
            recaptchaToken: token, utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign,
            utm_term: a.utm_term, utm_content: a.utm_content,
            metaEventId: eventId, fbp: a.fbp, fbc: a.fbc, fbclid: a.fbclid, gclid: a.gclid, externalId: a.externalId, eventSourceUrl: a.eventSourceUrl,
            ttclid: tt.ttclid, ttp: tt.ttp,
          }),
        });
        const j = (await res.json()) as { ok: boolean; qualificado?: boolean; error?: string; demo?: { diretor: string; familia: string; validadeMinutos: number } | null };
        if (!j.ok) return setErro(j.error ?? "Não foi possível enviar agora. Tente de novo.");
        // Todo envio (dentro ou fora da régua) vira "EnviouDemonstracao": sinal com volume para a Meta; o Lead segue só para o qualificado.
        trackPixelCustomSingle(pixelId, "EnviouDemonstracao", `${eventId}-env`, { content_name: "Salomão — acesso demo", content_category: "salomao", qualificado: j.qualificado ? "sim" : "nao" });
        // Só o lead na régua (escola particular + decisor) conta como conversão nas redes.
        if (j.qualificado) {
          trackPixelEventSingle(pixelId, "Lead", eventId, { content_name: "Salomão — acesso demo", content_category: "salomao" });
          identificarTikTok(String(f.get("email") ?? ""), fone);
          trackTikTok("SubmitForm", eventId, { contents: [{ content_id: "salomao-demo", content_name: "Salomão — acesso demo" }] });
          medirOpenAi("lead_created", eventId);
          dispararConversaoGoogle({ acao: "salomao", eventId, email: String(f.get("email") ?? ""), telefone: fone, valor: 150 });
        }
        setEmailInformado(!!String(f.get("email") ?? "").trim());
        setDemo(j.demo ?? null);
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
      <button type="button" onClick={abrir}
        className={className ?? "rounded-lg border border-white/40 px-6 py-3.5 font-semibold text-white hover:border-white"}>
        {children ?? "Testar a demonstração agora"}
      </button>
      {aberto && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="demo-titulo"
          onClick={(e) => { if (e.target === e.currentTarget && !enviando) setAberto(false); }}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 text-slate-900 shadow-xl sm:rounded-2xl">
            {enviado && demo ? (
              <div className="py-4 text-center">
                <h2 id="demo-titulo" className="text-xl font-bold text-[#1f2a44]">Pronto, sua demonstração está liberada!</h2>
                <p className="mt-3 text-slate-600">É uma escola de exemplo, com alunos fictícios. Escolha por onde começar:</p>
                <div className="mt-6 grid gap-3">
                  <a href={demo.diretor} target="_blank" rel="noopener" className="rounded-lg bg-[#1f2a44] px-6 py-3.5 font-bold text-white hover:bg-[#2a3a5e]">Entrar como diretor</a>
                  <a href={demo.familia} target="_blank" rel="noopener" className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Ver como família (app dos pais)</a>
                </div>
                <p className="mt-4 text-xs text-slate-500">Dica: no modo família, toque em &quot;Buscar na saída&quot; e veja o pedido chegar no painel do diretor. Os links valem por {demo.validadeMinutos} minutos{emailInformado ? " e também foram para o seu e-mail" : ""}.</p>
              </div>
            ) : enviado ? (
              <div className="py-6 text-center">
                <h2 id="demo-titulo" className="text-xl font-bold text-[#1f2a44]">Pedido recebido!</h2>
                <p className="mt-3 text-slate-600">Vamos liberar o acesso de demonstração para a sua escola em até <strong>24 horas</strong> e enviar os dados de entrada pelo WhatsApp{emailInformado ? " e por e-mail" : ""}.</p>
                <button type="button" onClick={() => setAberto(false)} className="mt-6 rounded-lg bg-[#1f2a44] px-6 py-3 font-semibold text-white">Fechar</button>
              </div>
            ) : !qualif ? (
              <form onSubmit={avancar} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b8891a]">Passo 1 de 2 · 3 toques</p>
                  <h2 id="demo-titulo" className="mt-1 text-xl font-bold text-[#1f2a44]">Testar o Salomão agora</h2>
                  <p className="mt-1 text-sm text-slate-600">Você entra como diretor numa escola de exemplo, na hora. Sem cartão e sem vendedor. Conte rapidinho sobre a sua escola:</p>
                </div>
                <CamposQualificacao prefixo="demo" classeRotulo={rotulo} />
                {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setAberto(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                  <button type="submit" className="rounded-lg bg-[#d4a72c] px-6 py-3 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Continuar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b8891a]">Passo 2 de 2 · último</p>
                  <h2 id="demo-titulo" className="mt-1 text-xl font-bold text-[#1f2a44]">Para onde mandamos o acesso?</h2>
                  <p className="mt-1 text-sm text-slate-600">O acesso abre aqui na tela assim que você enviar.</p>
                </div>
                <div><label htmlFor="demo-nome" className={rotulo}>Seu nome</label><input id="demo-nome" name="nome" required maxLength={120} autoComplete="name" autoFocus className={campo} /></div>
                <div><label htmlFor="demo-escola" className={rotulo}>Nome da escola</label><input id="demo-escola" name="escola" required maxLength={160} autoComplete="organization" className={campo} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="demo-fone" className={rotulo}>WhatsApp</label><input id="demo-fone" required inputMode="tel" autoComplete="tel" placeholder="(62) 99999-9999" value={fone} onChange={(e) => setFone(maskPhone(e.target.value))} className={campo} /></div>
                  <div><label htmlFor="demo-email" className={rotulo}>E-mail <span className="font-normal text-slate-400">(opcional)</span></label><input id="demo-email" name="email" type="email" autoComplete="email" className={campo} /></div>
                </div>
                {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => { setQualif(null); setErro(null); }} disabled={enviando} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Voltar</button>
                  <button type="submit" disabled={enviando} className="rounded-lg bg-[#d4a72c] px-6 py-3 font-bold text-[#1f2a44] hover:bg-[#e0b84a] disabled:opacity-60">{enviando ? "Liberando…" : "Entrar na demonstração"}</button>
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
