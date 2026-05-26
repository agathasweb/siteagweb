"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { maskPhone, validatePhone, maskCpfCnpj, validateCpfCnpj } from "@/lib/phone";
import { trackPixelEvent } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";
import { snapshotAttribution } from "@/lib/meta/attribution";

interface Props {
  /** Identificador do plano (deve casar com PLAN_CATALOG no servidor). */
  planKey: string;
  /** Nome do plano para exibição no modal. */
  planLabel: string;
  /** Texto do botão. */
  label: string;
  /** Classes CSS do botão. */
  className?: string;
  /** Labels traduzidas. */
  labels?: Partial<CheckoutLabels>;
  /**
   * Aviso exibido no topo do modal — ex.: regras de pagamento do plano
   * (cartão obrigatório, formas aceitas, etc.).
   */
  notice?: string;
  /** Texto explicativo do rodapé (formas de pagamento). Default: Pix/cartão/boleto. */
  footerNote?: string;
}

interface CheckoutLabels {
  modalTitle: string;
  modalLead: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  cancel: string;
  submit: string;
  loading: string;
  error: string;
}

const DEFAULT_LABELS: CheckoutLabels = {
  modalTitle: "Assinar plano",
  modalLead: "Preencha seus dados e te levamos direto pro checkout seguro da ASAAS.",
  name: "Nome completo",
  email: "E-mail",
  cpfCnpj: "CPF ou CNPJ",
  phone: "Celular (WhatsApp)",
  cancel: "Cancelar",
  submit: "Ir para o pagamento",
  loading: "Criando assinatura…",
  error: "Erro ao iniciar checkout. Tente novamente em alguns segundos.",
};

/**
 * Botão que abre um modal de dados, cria uma assinatura ASAAS via API
 * interna e redireciona o cliente para o checkout hospedado.
 *
 * Espera que /api/asaas/checkout esteja configurado com ASAAS_API_KEY.
 */
export default function AsaasCheckoutButton({
  planKey,
  planLabel,
  label,
  className,
  labels,
  notice,
  footerNote,
}: Props) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [docValue, setDocValue] = useState("");
  const [docError, setDocError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset estado ao fechar
  useEffect(() => {
    if (!open) {
      setError(null);
      setPhoneValue("");
      setPhoneError(null);
      setDocValue("");
      setDocError(null);
      setEmailValue("");
    }
  }, [open]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPhoneError(null);
    setDocError(null);
    const data = new FormData(e.currentTarget);

    // CPF/CNPJ — valida dígitos verificadores antes de bater na ASAAS
    // (evita roundtrip e dá mensagem clara em vez de erro genérico).
    const docCheck = validateCpfCnpj(docValue);
    if (!docCheck.ok) {
      setDocError(docCheck.error ?? "CPF/CNPJ inválido.");
      return;
    }

    // Telefone é opcional, mas se preenchido precisa ser válido (mesma
    // regra dos CTAs WhatsApp — bloqueia números repetidos/sequenciais).
    // ASAAS espera o número LOCAL (DDD + número), sem o DDI 55 — o 55 na
    // frente atrapalha o autopreenchimento do checkout.
    let phone = "";
    if (phoneValue.trim()) {
      const check = validatePhone(phoneValue);
      if (!check.ok) {
        setPhoneError(check.error ?? "WhatsApp inválido.");
        return;
      }
      phone =
        check.country === "BR"
          ? check.normalized!.replace(/^\+55/, "")
          : check.normalized!.replace(/\D/g, "");
    }

    const customerName = String(data.get("name") ?? "").trim();
    const customerEmail = emailValue.trim().toLowerCase();
    if (!customerName || !customerEmail) {
      setError(L.error);
      return;
    }

    // event_id único compartilhado Pixel client ↔ CAPI server.
    // Persistido na subscription pra evitar reenvio do mesmo evento se o
    // checkout for retentado (idempotência cross-request).
    const eventId = newEventId();
    const attribution = snapshotAttribution();

    const payload = {
      planKey,
      name: customerName,
      email: customerEmail,
      cpfCnpj: docCheck.normalized!,
      phone,
      // Meta attribution — vai pro server persistir e usar nos eventos do webhook.
      metaEventId: eventId,
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
    };

    // Pixel client INITIATECHECKOUT — dispara antes do redirect. O CAPI server
    // mirror acontece dentro da route /api/asaas/checkout com o mesmo event_id.
    trackPixelEvent("InitiateCheckout", eventId, {
      content_name: planLabel,
      content_category: "voyia",
      content_ids: [planKey],
      content_type: "product",
      num_items: 1,
    });

    startTransition(async () => {
      try {
        const res = await fetch("/api/asaas/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
        if (!json.ok || !json.checkoutUrl) {
          setError(json.error ?? L.error);
          return;
        }
        window.location.href = json.checkoutUrl;
      } catch {
        setError(L.error);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && mounted &&
        createPortal(
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
                  <p className="text-sm text-gray-400 mt-1">
                    <strong className="text-white">{planLabel}</strong> — {L.modalLead}
                  </p>
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
                {notice && (
                  <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg px-3 py-2.5 text-xs text-blue-100 leading-relaxed">
                    {notice}
                  </div>
                )}
                <div>
                  <label htmlFor="asaas-name" className="block text-sm font-medium text-gray-300 mb-1">{L.name} *</label>
                  <input id="asaas-name" name="name" type="text" required autoFocus
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="asaas-email" className="block text-sm font-medium text-gray-300 mb-1">{L.email} *</label>
                  <input id="asaas-email" name="email" type="email" required
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value.toLowerCase())}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm lowercase focus:ring-2 focus:ring-voyia-blue focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="asaas-cpf" className="block text-sm font-medium text-gray-300 mb-1">{L.cpfCnpj} *</label>
                  <input id="asaas-cpf" name="cpfCnpj" type="text" required
                    value={docValue}
                    onChange={(e) => setDocValue(maskCpfCnpj(e.target.value))}
                    inputMode="numeric"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    aria-invalid={!!docError}
                    className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
                      docError ? "border-red-500" : "border-gray-600"
                    }`} />
                  {docError && <p className="text-xs text-red-400 mt-1">{docError}</p>}
                </div>
                <div>
                  <label htmlFor="asaas-phone" className="block text-sm font-medium text-gray-300 mb-1">{L.phone}</label>
                  <input id="asaas-phone" name="phone" type="tel"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(maskPhone(e.target.value))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(XX) XXXXX-XXXX"
                    aria-invalid={!!phoneError}
                    className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent ${
                      phoneError ? "border-red-500" : "border-gray-600"
                    }`} />
                  {phoneError && <p className="text-xs text-red-400 mt-1">{phoneError}</p>}
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setOpen(false)} disabled={pending}
                    className="text-sm text-gray-300 hover:text-white px-4 py-2">{L.cancel}</button>
                  <button type="submit" disabled={pending}
                    className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold transition-colors text-sm">
                    {pending ? L.loading : L.submit}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {footerNote ?? "Pagamento processado por ASAAS. Você escolhe Pix, cartão ou boleto na próxima etapa."}
                </p>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
