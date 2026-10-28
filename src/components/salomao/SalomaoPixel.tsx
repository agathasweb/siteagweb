"use client";

import { useEffect } from "react";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { trackClient } from "@/lib/meta/track-client";
import { newEventId } from "@/lib/meta/event-id";

/**
 * Pixel exclusivo do Salomão nas páginas do produto (público de escolas). O <MetaPixel/> do layout só
 * cria a fila do fbq nessas páginas (não inicializa os pixels do site); aqui o pixel do Salomão é
 * inicializado e recebe o PageView e o ViewContent (este também pelo CAPI, mesmo event_id).
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
      trackPixelEventSingle(pixelId, "PageView", newEventId());
      void trackClient({
        eventName: "ViewContent",
        pixelId,
        produto: "salomao",
        customData: { content_name: "salomao", content_category: "produto", content_type: "product", content_ids: ["salomao"] },
      });
    };
    iniciar();
  }, [pixelId]);

  return null;
}
