"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { captureWhatsAppLeadAction } from "./actions";
import { buildWhatsAppUrl } from "@/lib/contact";
import { executeRecaptcha } from "@/components/RecaptchaProvider";
import { maskPhone, validatePhone, validateEmail, validateName } from "@/lib/phone";
import { trackClient } from "@/lib/meta/track-client";
import { newEventId } from "@/lib/meta/event-id";
import { snapshotAttribution } from "@/lib/meta/attribution";

interface Props {
  /** Texto do botão. */
  label: string;
  /** Mensagem prefilled no WhatsApp (opcional). */
  prefillMessage?: string;
  /** Contexto pra rastrear de onde veio o lead. */
  ctaContext?: string;
  /** Locale do usuário pra registro. */
  locale?: string;
  /** Site key reCAPTCHA (null = sem verify). */
  recaptchaSiteKey: string | null;
  /** Classes CSS extras pro botão (cor primária, etc.). */
  className?: string;
  /** Tradução dos labels do modal. */
  modalLabels?: Partial<ModalLabels>;
  /** Se true, mostra só ícone (sem texto). Útil pro botão flutuante. */
  iconOnly?: boolean;
  /** ARIA label (obrigatório se iconOnly). */
  ariaLabel?: string;
}

interface ModalLabels {
  modalTitle: string;
  modalLead: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  privacy: string;
  cancel: string;
  submit: string;
  recaptchaNote: string;
}

const DEFAULT_LABELS: ModalLabels = {
  modalTitle: "Antes de conversarmos no WhatsApp",
  modalLead: "Deixe seus dados pra eu já chegar com contexto. Leva 15 segundos.",
  name: "Nome",
  namePlaceholder: "Seu nome completo",
  email: "E-mail",
  emailPlaceholder: "voce@empresa.com",
  phone: "WhatsApp",
  phonePlaceholder: "(XX) XXXXX-XXXX",
  privacy: "Aceito que meus dados sejam usados para contato sobre esta solicitação.",
  cancel: "Cancelar",
  submit: "Abrir WhatsApp",
  recaptchaNote: "Protegido por reCAPTCHA do Google.",
};

export default function WhatsAppCta({
  label,
  prefillMessage,
  ctaContext,
  locale,
  recaptchaSiteKey,
  className,
  modalLabels,
  iconOnly,
  ariaLabel,
}: Props) {
  const L = { ...DEFAULT_LABELS, ...modalLabels };
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [phoneValue, setPhoneValue] = useState("");

  // Portal target (document.body) só existe no client após mount — pattern
  // padrão SSR-safe, daí o setState em effect ser necessário.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Trava o scroll do body quando modal aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset campos/erros quando o modal fecha — UX limpa na próxima abertura
  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setError(null);
      setPhoneValue("");
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const data = new FormData(e.currentTarget);

    // Validação client-side robusta — antes do reCAPTCHA e antes da action.
    // Mesma lib roda no servidor (anti-bypass).
    const nameRaw = String(data.get("name") ?? "");
    const emailRaw = String(data.get("email") ?? "");
    const phoneRaw = String(data.get("phone") ?? "");

    const nameCheck = validateName(nameRaw);
    const emailCheck = validateEmail(emailRaw);
    const phoneCheck = validatePhone(phoneRaw);

    const errors: Record<string, string> = {};
    if (!nameCheck.ok && nameCheck.error) errors.name = nameCheck.error;
    if (!emailCheck.ok && emailCheck.error) errors.email = emailCheck.error;
    if (!phoneCheck.ok && phoneCheck.error) errors.phone = phoneCheck.error;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const name = nameCheck.normalized!;
    const email = emailCheck.normalized!;
    const phone = phoneCheck.normalized!;

    const privacy = data.get("privacy") === "on";
    if (!privacy) {
      setFieldErrors({ privacy: "Aceite a política." });
      return;
    }

    let token: string | null = null;
    if (recaptchaSiteKey) {
      token = await executeRecaptcha(recaptchaSiteKey, "whatsapp_cta");
      if (!token) {
        setError("Falha na verificação anti-bot. Recarregue a página.");
        return;
      }
    }

    // Gera event_id ÚNICO e compartilhado entre Pixel (client) e CAPI (server).
    // Sem isso, o Lead chega 2x no Meta (uma via pixel, outra via action) e a
    // deduplicação não acontece.
    const leadEventId = newEventId();
    const attribution = snapshotAttribution();

    startTransition(async () => {
      const res = await captureWhatsAppLeadAction({
        name,
        email,
        phone,
        locale: locale ?? null,
        originPage: typeof window !== "undefined" ? window.location.pathname : null,
        ctaContext: ctaContext ?? null,
        recaptchaToken: token,
        metaEventId: leadEventId,
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
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setError(res.error ?? "Erro ao salvar.");
        return;
      }
      // Pixel client com o MESMO event_id da action server.
      // O CAPI server é disparado dentro de captureWhatsAppLeadAction.
      void trackClient({
        eventName: "Lead",
        eventId: leadEventId,
        userData: { email, phone, fullName: name },
        customData: {
          content_name: ctaContext ?? "whatsapp_cta",
          content_category: ctaContext?.startsWith("voyia") ? "voyia" : "agathas",
          lead_source: "whatsapp",
        },
      });
      // Sucesso → redireciona pro WhatsApp em nova aba
      const url = buildWhatsAppUrl(prefillMessage);
      window.open(url, "_blank", "noopener,noreferrer");
      setOpen(false);
    });
  }

  /** Contact é o evento "intent" — clique no botão antes do submit do form. */
  function handleOpenClick() {
    void trackClient({
      eventName: "Contact",
      customData: {
        content_name: ctaContext ?? "whatsapp_cta",
        content_category: ctaContext?.startsWith("voyia") ? "voyia" : "agathas",
        contact_channel: "whatsapp",
      },
    });
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenClick}
        aria-label={iconOnly ? (ariaLabel ?? "WhatsApp") : undefined}
        className={
          className ??
          "inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base"
        }
      >
        {iconOnly ? (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        ) : (
          <>💬 {label}</>
        )}
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-voyia-gray rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-gray-700 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{L.modalTitle}</h3>
                <p className="text-sm text-gray-400 mt-1">{L.modalLead}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none -mt-1"
                aria-label={L.cancel}
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="wa-name" className="block text-sm font-medium text-gray-300 mb-1">
                  {L.name} <span className="text-red-400">*</span>
                </label>
                <input
                  id="wa-name" name="name" type="text" required autoFocus
                  placeholder={L.namePlaceholder}
                  aria-invalid={!!fieldErrors.name}
                  className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
                    fieldErrors.name ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="wa-phone" className="block text-sm font-medium text-gray-300 mb-1">
                  {L.phone} <span className="text-red-400">*</span>
                </label>
                <input
                  id="wa-phone" name="phone" type="tel" required
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(maskPhone(e.target.value))}
                  placeholder={L.phonePlaceholder}
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!fieldErrors.phone}
                  className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
                    fieldErrors.phone ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label htmlFor="wa-email" className="block text-sm font-medium text-gray-300 mb-1">
                  {L.email} <span className="text-red-400">*</span>
                </label>
                <input
                  id="wa-email" name="email" type="email" required
                  placeholder={L.emailPlaceholder}
                  aria-invalid={!!fieldErrors.email}
                  className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
                    fieldErrors.email ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="wa-privacy" name="privacy" type="checkbox" required
                  className="mt-1 rounded border-gray-500 text-voyia-blue"
                />
                <label htmlFor="wa-privacy" className="text-xs text-gray-300 leading-snug">
                  {L.privacy}
                </label>
              </div>
              {fieldErrors.privacy && <p className="text-xs text-red-400">{fieldErrors.privacy}</p>}

              {error && (
                <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="text-sm text-gray-300 hover:text-white px-4 py-2"
                >
                  {L.cancel}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black px-5 py-2.5 rounded-lg font-bold transition-colors text-sm"
                >
                  {pending ? "Enviando…" : `💬 ${L.submit}`}
                </button>
              </div>

              {recaptchaSiteKey && (
                <p className="text-[10px] text-gray-500 text-center">{L.recaptchaNote}</p>
              )}
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
