"use client";

import { useEffect } from "react";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";

/**
 * Pixel exclusivo do Salomão nas páginas do produto (público de escolas). O fbq já vem do <MetaPixel/>
 * do layout; aqui só inicializa o pixel do Salomão e manda PageView/ViewContent só para ele.
 */
export default function SalomaoPixel({ pixelId }: { pixelId: string | null; valor?: number }) {
  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    let tentativas = 0;
    const iniciar = () => {
      if (typeof window.fbq !== "function") {
        if (tentativas++ < 20) setTimeout(iniciar, 250);
        return;
      }
      window.fbq("init", pixelId);
      // PageView só para ele (o do site já saiu antes deste init). O ViewContent do site é disparado
      // com fbq("track") depois daqui e já chega a todos os pixels, inclusive este — não duplicar.
      trackPixelEventSingle(pixelId, "PageView", newEventId());
    };
    iniciar();
  }, [pixelId]);

  return null;
}
