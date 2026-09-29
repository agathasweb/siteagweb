"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "../../contato/actions";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import { trackClient } from "@/lib/meta/track-client";
import { dispararConversaoGoogle } from "@/lib/google/conversion";
import { newEventId } from "@/lib/meta/event-id";
import { snapshotAttribution } from "@/lib/meta/attribution";
import type { Locale } from "@/lib/i18n";

export interface AnaliseLabels {
  name: string;
  email: string;
  phone: string;
  agency: string;
  agencyPlaceholder: string;
  profile: string;
  profiles: string[];
  clients: string;
  accounts: string;
  ranges: string[];
  modules: string;
  notes: string;
  notesPlaceholder: string;
  privacy: string;
  privacyLink: string;
  submit: string;
  sending: string;
  required: string;
  successTitle: string;
  successText: string;
  error: string;
}

interface Props {
  t: AnaliseLabels;
  /** Nomes dos módulos da própria página — as opções nunca divergem do que é vendido. */
  modules: string[];
  locale: Locale;
  recaptchaSiteKey: string | null;
}

/**
 * Pedido de análise do YESHUA.
 *
 * O YESHUA não tem preço de tabela: a proposta depende do tamanho da carteira, das contas de
 * anúncio e dos módulos. Por isso o formulário pergunta exatamente isso, e o pedido segue o
 * mesmo caminho do /contato (lead no site → YESHUA avisa a equipe na hora). As respostas de
 * qualificação vão no corpo da mensagem, que é o que aparece no aviso de lead novo.
 */
export default function AnaliseForm({ t, modules, locale, recaptchaSiteKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});
    const data = new FormData(e.currentTarget);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    // Sem telefone a equipe não consegue marcar a reunião — aqui ele é obrigatório.
    const faltando: Record<string, string> = {};
    if (!name) faltando.name = t.required;
    if (!email) faltando.email = t.required;
    if (!phone) faltando.phone = t.required;
    if (data.get("privacy") !== "on") faltando.privacy = t.required;
    if (Object.keys(faltando).length) {
      setFieldErrors(faltando);
      return;
    }

    let token: string | null = null;
    if (recaptchaSiteKey) {
      token = await executeRecaptcha(recaptchaSiteKey, "contact_form");
      if (!token) {
        setErro(t.error);
        return;
      }
    }

    const modulos = data.getAll("modules").map(String);
    const mensagem = [
      "[Pedido de análise — YESHUA]",
      `Agência: ${String(data.get("agency") ?? "").trim() || "—"}`,
      `Perfil: ${String(data.get("profile") ?? "") || "—"}`,
      `Clientes ativos: ${String(data.get("clients") ?? "") || "—"}`,
      `Contas de anúncio: ${String(data.get("accounts") ?? "") || "—"}`,
      `Módulos de interesse: ${modulos.length ? modulos.join(", ") : "—"}`,
      `Observações: ${String(data.get("notes") ?? "").trim() || "—"}`,
    ].join("\n");

    // event_id ÚNICO compartilhado entre Pixel (client) e CAPI (server) p/ dedup.
    const leadEventId = newEventId();
    const attribution = snapshotAttribution();

    startTransition(async () => {
      const res = await submitContactAction({
        name,
        email,
        phone,
        service: "yeshua",
        message: mensagem,
        privacy: true,
        locale,
        recaptchaToken: token,
        originPage: typeof window !== "undefined" ? window.location.pathname : null,
        metaEventId: leadEventId,
        externalId: attribution.externalId,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        fbclid: attribution.fbclid,
        gclid: attribution.gclid,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
        eventSourceUrl: attribution.eventSourceUrl,
      });

      if (res.ok) {
        dispararConversaoGoogle({ eventId: leadEventId, email, telefone: phone });
        void trackClient({
          eventName: "Lead",
          eventId: leadEventId,
          userData: { email, phone, fullName: name },
          customData: { content_name: "yeshua", content_category: "agathas", lead_source: "contact_form" },
        });
        setEnviado(true);
      } else {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setErro(res.error ?? t.error);
      }
    });
  }

  if (enviado) {
    return (
      <div role="status" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-white mb-3">{t.successTitle}</h3>
        <p className="text-gray-200 max-w-xl mx-auto leading-relaxed">{t.successText}</p>
      </div>
    );
  }

  const campo =
    "w-full rounded-lg border border-gray-700 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400";
  const rotulo = "block text-sm font-medium text-gray-300 mb-2";
  const erroCampo = (k: string) =>
    fieldErrors[k] ? <p className="mt-1 text-xs text-red-400">{fieldErrors[k]}</p> : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-2xl border border-gray-700 bg-voyia-gray p-6 sm:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="an-name" className={rotulo}>{t.name} *</label>
          <input id="an-name" name="name" type="text" autoComplete="name" className={campo} />
          {erroCampo("name")}
        </div>
        <div>
          <label htmlFor="an-agency" className={rotulo}>{t.agency}</label>
          <input id="an-agency" name="agency" type="text" autoComplete="organization" placeholder={t.agencyPlaceholder} className={campo} />
        </div>
        <div>
          <label htmlFor="an-email" className={rotulo}>{t.email} *</label>
          <input id="an-email" name="email" type="email" autoComplete="email" className={campo} />
          {erroCampo("email")}
        </div>
        <div>
          <label htmlFor="an-phone" className={rotulo}>{t.phone} *</label>
          <input id="an-phone" name="phone" type="tel" autoComplete="tel" placeholder="(62) 99999-9999" className={campo} />
          {erroCampo("phone")}
        </div>
        <div>
          <label htmlFor="an-profile" className={rotulo}>{t.profile}</label>
          <select id="an-profile" name="profile" className={campo} defaultValue="">
            <option value="" disabled>—</option>
            {t.profiles.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="an-clients" className={rotulo}>{t.clients}</label>
            <select id="an-clients" name="clients" className={campo} defaultValue="">
              <option value="" disabled>—</option>
              {t.ranges.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="an-accounts" className={rotulo}>{t.accounts}</label>
            <select id="an-accounts" name="accounts" className={campo} defaultValue="">
              <option value="" disabled>—</option>
              {t.ranges.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <fieldset>
        <legend className={rotulo}>{t.modules}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => (
            <label key={m} className="flex items-center gap-3 rounded-lg border border-gray-700 bg-black/30 px-4 py-3 text-sm text-gray-200 cursor-pointer hover:border-amber-400/60 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-500/10">
              <input type="checkbox" name="modules" value={m} className="h-4 w-4 accent-amber-500" />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="an-notes" className={rotulo}>{t.notes}</label>
        <textarea id="an-notes" name="notes" rows={4} placeholder={t.notesPlaceholder} className={campo} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-gray-400">
          <input type="checkbox" name="privacy" className="mt-1 h-4 w-4 accent-amber-500" />
          <span>{t.privacy}{" "}<a href="/privacidade" target="_blank" rel="noopener" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">{t.privacyLink}</a>.</span>
        </label>
        {erroCampo("privacy")}
      </div>

      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black px-8 py-3.5 rounded-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
