"use client";

import { useState } from "react";
import AsaasCheckoutButton from "@/components/asaas/AsaasCheckoutButton";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import type { WhatsAppModalLabels } from "@/lib/whatsapp-modal-labels";

interface DictPlan {
  icon: string;
  name: string;
  /** "fixed" → checkout ASAAS; qualquer outro valor → orçamento via WhatsApp. */
  priceType: string;
  price: string;
  priceNote?: string;
  tagline: string;
  featured: boolean;
  features: string[];
}

interface PricingDict {
  popularBadge: string;
  ctaLabel: string;
  ctaQuote: string;
  currency: string;
  note: string;
}

interface Props {
  plans: DictPlan[];
  pricing: PricingDict;
  lang: string;
  recaptchaSiteKey: string | null;
  modalLabels: WhatsAppModalLabels;
}

type Period = "mensal" | "semestral" | "anual";

// Fatores de desconto: 12,5% no semestral, 20% no anual.
const SEMI = 6 * 0.875;
const ANNUAL = 12 * 0.8;

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function brlInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

// Esta section só renderiza no domínio BR — textos fixos em pt-BR.
const UI = {
  toggleHeading: "Escolha como prefere pagar",
  toggleSub: "Planos mensais no cartão; semestral e anual liberam Pix e boleto, com desconto.",
  periods: {
    mensal: { label: "Mensal", hint: "" },
    semestral: { label: "Semestral", hint: "-12,5%" },
    anual: { label: "Anual", hint: "-20%" },
  } as Record<Period, { label: string; hint: string }>,
  perMonth: "/mês",
  perSemester: "a cada 6 meses",
  perYear: "a cada 12 meses",
  equiv: (v: string) => `Equivale a R$ ${v}/mês`,
  discountTag: { semestral: "12,5% OFF", anual: "20% OFF" } as Record<string, string>,
  payMonthly: "💳 Somente cartão de crédito · permanência mínima de 6 meses",
  paySemester: "💳 Cartão, 🔢 Pix ou 📄 boleto · cobrança semestral",
  payYear: "💳 Cartão, 🔢 Pix ou 📄 boleto · cobrança anual",
  noticeMonthly:
    "Plano mensal: pagamento exclusivo via cartão de crédito, em assinatura recorrente da ASAAS. Permanência mínima de 6 meses. Para pagar com Pix ou boleto, escolha o plano Semestral ou Anual.",
  noticeSemester:
    "Plano semestral: cobrança a cada 6 meses com 12,5% de desconto já aplicado. Você escolhe Pix, boleto ou cartão de crédito no checkout da ASAAS.",
  noticeYear:
    "Plano anual: cobrança a cada 12 meses com 20% de desconto já aplicado. Você escolhe Pix, boleto ou cartão de crédito no checkout da ASAAS.",
  termsMonthly:
    "Li e aceito que o plano mensal é cobrado exclusivamente via cartão de crédito, em assinatura recorrente, e que há permanência mínima de 6 meses.",
  footerMonthly:
    "Pagamento exclusivo via cartão de crédito. Você informa os dados do cartão na etapa segura da ASAAS.",
  footerOther:
    "Pagamento processado pela ASAAS. Você escolhe Pix, boleto ou cartão na próxima etapa.",
};

export default function TrafegoPlans({ plans, pricing, lang, recaptchaSiteKey, modalLabels }: Props) {
  const [period, setPeriod] = useState<Period>("mensal");

  return (
    <div>
      {/* Toggle de período */}
      <div className="text-center mb-10">
        <p className="text-sm font-semibold text-white mb-1">{UI.toggleHeading}</p>
        <p className="text-xs text-gray-400 mb-5">{UI.toggleSub}</p>
        <div className="inline-flex bg-voyia-gray border border-gray-700 rounded-xl p-1 gap-1">
          {(Object.keys(UI.periods) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                period === p
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-black/30"
              }`}
            >
              {UI.periods[p].label}
              {UI.periods[p].hint && (
                <span className={`ml-1.5 text-xs ${period === p ? "text-blue-100" : "text-green-400"}`}>
                  {UI.periods[p].hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isQuote = plan.priceType !== "fixed";
          const slug = plan.name.toLowerCase();
          const monthlyBase = isQuote ? 0 : parseInt(plan.price, 10) || 0;

          // Preço e metadados do período selecionado
          let bigPrice = "";
          let priceCycleLabel = "";
          let equivLabel = "";
          let payInfo = "";
          let planKey = "";
          let modalNotice = "";
          let modalTerms: string | undefined;
          let modalFooter = UI.footerOther;
          let discountTag = "";

          if (!isQuote) {
            if (period === "mensal") {
              bigPrice = `${pricing.currency} ${brlInt(monthlyBase)}`;
              priceCycleLabel = UI.perMonth;
              payInfo = UI.payMonthly;
              planKey = `trafego-${slug}-mensal`;
              modalNotice = UI.noticeMonthly;
              modalTerms = UI.termsMonthly;
              modalFooter = UI.footerMonthly;
            } else if (period === "semestral") {
              const total = monthlyBase * SEMI;
              bigPrice = `${pricing.currency} ${brl(total)}`;
              priceCycleLabel = UI.perSemester;
              equivLabel = UI.equiv(brl(total / 6));
              payInfo = UI.paySemester;
              planKey = `trafego-${slug}-semestral`;
              modalNotice = UI.noticeSemester;
              discountTag = UI.discountTag.semestral;
            } else {
              const total = monthlyBase * ANNUAL;
              bigPrice = `${pricing.currency} ${brl(total)}`;
              priceCycleLabel = UI.perYear;
              equivLabel = UI.equiv(brl(total / 12));
              payInfo = UI.payYear;
              planKey = `trafego-${slug}-anual`;
              modalNotice = UI.noticeYear;
              discountTag = UI.discountTag.anual;
            }
          }

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                plan.featured
                  ? "bg-gradient-to-b from-blue-500/10 to-voyia-gray border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                  : "bg-voyia-gray border-gray-700"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {pricing.popularBadge}
                </span>
              )}
              {discountTag && (
                <span className="absolute -top-3 right-4 bg-green-500 text-black px-2.5 py-1 rounded-full text-xs font-bold">
                  {discountTag}
                </span>
              )}

              <div className="text-3xl mb-3">{plan.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-gray-400 mb-5 min-h-[2.5rem]">{plan.tagline}</p>

              <div className="mb-1">
                {isQuote ? (
                  <span className="text-2xl font-bold text-blue-300">{plan.price}</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">{bigPrice}</span>
                    <span className="text-sm text-gray-400"> {priceCycleLabel}</span>
                  </>
                )}
              </div>
              {!isQuote && equivLabel && (
                <p className="text-xs text-green-400 font-semibold mb-1">{equivLabel}</p>
              )}
              {plan.priceNote && <p className="text-xs text-gray-400 mb-3">{plan.priceNote}</p>}
              {!isQuote && (
                <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">{payInfo}</p>
              )}

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start text-sm text-gray-300">
                    <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isQuote ? (
                <WhatsAppCta
                  label={pricing.ctaQuote}
                  prefillMessage={`Olá! Quero contratar o plano ${plan.name} de Tráfego Pago.`}
                  ctaContext={`trafego-pago-plan-${slug}`}
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.featured ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                />
              ) : (
                <AsaasCheckoutButton
                  planKey={planKey}
                  planLabel={`${plan.name} — ${UI.periods[period].label} — ${bigPrice}`}
                  label={pricing.ctaLabel}
                  notice={modalNotice}
                  termsText={modalTerms}
                  footerNote={modalFooter}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.featured ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-500 mt-10 max-w-3xl mx-auto">{pricing.note}</p>
    </div>
  );
}
