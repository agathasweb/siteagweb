"use client";

import { useEffect } from "react";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";

/**
 * Pixel exclusivo do Salomão nas páginas do produto (público de escolas). O fbq já vem do <MetaPixel/>
 * do layout; aqui só inicializa o pixel do Salomão e manda PageView/ViewContent só para ele.
 */
export default function SalomaoPixel({ pixelId, valor }: { pixelId: string | null; valor: number }) {
  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    let tentativas = 0;
    const iniciar = () => {
      if (typeof window.fbq !== "function") {
        if (tentativas++ < 20) setTimeout(iniciar, 250);
        return;
      }
      window.fbq("init", pixelId);
      trackPixelEventSingle(pixelId, "PageView", newEventId());
      trackPixelEventSingle(pixelId, "ViewContent", newEventId(), {
        content_name: "Salomão", content_category: "salomao", content_type: "product", currency: "BRL", value: valor,
      });
    };
    iniciar();
  }, [pixelId, valor]);

  return null;
}
