"use client";

import { useState, useEffect } from "react";
import WhatsAppCta from "./WhatsAppCta";

interface Props {
  locale: string;
  recaptchaSiteKey: string | null;
  /** Strings i18n. */
  labels: {
    tooltip: string;
    aria: string;
    modal: {
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
    };
  };
}

/**
 * Botão flutuante de WhatsApp global. Aparece em todas as páginas públicas.
 * Reutiliza o WhatsAppCta — clica → modal de captura → redirect.
 *
 * Aparece com fade-in só depois do primeiro scroll de 200px (não polui o hero).
 */
export default function FloatingWhatsAppButton({ locale, recaptchaSiteKey, labels }: Props) {
  const [visible, setVisible] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    onScroll(); // checa estado inicial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      {tooltipOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-gray-700 pointer-events-none">
          {labels.tooltip}
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-black/90 border-r border-b border-gray-700 rotate-45" />
        </div>
      )}

      <WhatsAppCta
        label=""
        iconOnly
        ariaLabel={labels.aria}
        ctaContext="floating-whatsapp"
        locale={locale}
        recaptchaSiteKey={recaptchaSiteKey}
        modalLabels={labels.modal}
        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-400 text-white shadow-2xl shadow-green-500/40 hover:scale-110 transition-all"
      />
    </div>
  );
}
