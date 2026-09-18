"use client";

import { useState } from "react";
import WhatsAppCta from "./WhatsAppCta";
import type { WhatsAppModalLabels } from "@/lib/whatsapp-modal-labels";

interface Props {
  locale: string;
  recaptchaSiteKey: string | null;
  /** Strings i18n. */
  labels: {
    tooltip: string;
    aria: string;
    modal: WhatsAppModalLabels;
  };
}

/**
 * Botão flutuante de WhatsApp global. Aparece em todas as páginas públicas.
 * Reutiliza o WhatsAppCta — clica → modal de captura → redirect.
 *
 * Visível desde o carregamento, em todas as páginas e nos dois tamanhos de tela: o
 * botão só converte quem o enxerga, e o gate de scroll de 200px escondia justamente
 * quem entra pelo anúncio e decide na primeira dobra.
 */
export default function FloatingWhatsAppButton({ locale, recaptchaSiteKey, labels }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-40"
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
