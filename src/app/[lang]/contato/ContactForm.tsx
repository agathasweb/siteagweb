"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "./actions";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import type { Locale } from "@/lib/i18n";

interface FormDict {
  heading: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  service: string;
  servicePlaceholder: string;
  services: Record<string, string>;
  message: string;
  messagePlaceholder: string;
  privacy: string;
  submit: string;
  submitNote: string;
}

interface Props {
  t: FormDict;
  locale: Locale;
  recaptchaSiteKey: string | null;
}

const SERVICE_KEYS = [
  "desenvolvimento",
  "moodle",
  "trafego",
  "consultoria",
  "hospedagemMoodle",
  "hospedagemGerenciada",
  "voyia",
  "outros",
] as const;
const SERVICE_VALUE: Record<(typeof SERVICE_KEYS)[number], string> = {
  desenvolvimento: "desenvolvimento",
  moodle: "moodle",
  trafego: "trafego",
  consultoria: "consultoria",
  hospedagemMoodle: "hospedagem-moodle",
  hospedagemGerenciada: "hospedagem-gerenciada",
  voyia: "voyia",
  outros: "outros",
};

export default function ContactForm({ t, locale, recaptchaSiteKey }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);

    // Captura token reCAPTCHA antes da action
    let token: string | null = null;
    if (recaptchaSiteKey) {
      token = await executeRecaptcha(recaptchaSiteKey, "contact_form");
      if (!token) {
        setFeedback({ kind: "err", text: "Falha ao verificar reCAPTCHA. Recarregue a página." });
        return;
      }
    }

    startTransition(async () => {
      const res = await submitContactAction({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        service: String(data.get("service") ?? ""),
        message: String(data.get("message") ?? ""),
        privacy: data.get("privacy") === "on",
        locale,
        recaptchaToken: token,
        originPage: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (res.ok) {
        setFeedback({ kind: "ok", text: "✓ Mensagem enviada! Vou retornar em breve." });
        form.reset();
      } else {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setFeedback({ kind: "err", text: res.error ?? "Erro ao enviar." });
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">{t.name}</label>
          <input
            type="text" id="name" name="name" required
            aria-invalid={!!fieldErrors.name}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
              fieldErrors.name ? "border-red-500" : "border-gray-600"
            }`}
            placeholder={t.namePlaceholder}
          />
          {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">{t.email}</label>
          <input
            type="email" id="email" name="email" required
            aria-invalid={!!fieldErrors.email}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
              fieldErrors.email ? "border-red-500" : "border-gray-600"
            }`}
            placeholder={t.emailPlaceholder}
          />
          {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">{t.phone}</label>
        <input
          type="tel" id="phone" name="phone"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
          placeholder={t.phonePlaceholder}
        />
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">{t.service}</label>
        <select id="service" name="service" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent">
          <option value="">{t.servicePlaceholder}</option>
          {SERVICE_KEYS.map((k) => (
            <option key={k} value={SERVICE_VALUE[k]}>{t.services[k]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">{t.message}</label>
        <textarea
          id="message" name="message" rows={5}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
          placeholder={t.messagePlaceholder}
        />
      </div>

      <div className="flex items-start space-x-2">
        <input type="checkbox" id="privacy" name="privacy" required className="mt-1 rounded border-gray-300 text-voyia-blue focus:ring-voyia-blue" />
        <label htmlFor="privacy" className="text-sm text-gray-300">{t.privacy}</label>
      </div>
      {fieldErrors.privacy && <p className="text-xs text-red-400">{fieldErrors.privacy}</p>}

      {feedback && (
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-sm border ${
            feedback.kind === "ok"
              ? "bg-green-900/30 border-green-500/40 text-green-200"
              : "bg-red-900/30 border-red-500/40 text-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gradient-to-r from-voyia-blue to-purple-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300"
      >
        {pending ? "Enviando…" : t.submit}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {t.submitNote}
        {recaptchaSiteKey && (
          <>
            {" "}· Protegido por reCAPTCHA · <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacidade</a> · <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Termos</a>
          </>
        )}
      </p>
    </form>
  );
}
