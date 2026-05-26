"use client";

import { useEffect, useRef } from "react";
import { trackClient } from "@/lib/meta/track-client";

interface Props {
  /** Valor de referência (preço do plano Profissional em BR). */
  referenceValue: number;
  currency: string;
  /** Locale atual — vai como custom data pra filtros de audiência. */
  locale: string;
}

/**
 * Dispara `ViewContent` (Pixel + CAPI) ao montar a página VOYIA.
 *
 * Idempotência client: usa um ref pra garantir 1 evento por mount, mesmo com
 * React Strict Mode rodando o effect 2x em dev.
 *
 * Content IDs cobrem os 3 planos pra Meta entender o catálogo todo no
 * evento (útil pra catalog matching futuro / DPA).
 */
export default function ViewContentVoyia({ referenceValue, currency, locale }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackClient({
      eventName: "ViewContent",
      customData: {
        content_name: "Voyia",
        content_category: "voyia",
        content_type: "product_group",
        content_ids: ["voyia-starter", "voyia-profissional", "voyia-business"],
        currency,
        value: referenceValue,
        locale,
      },
    });
  }, [referenceValue, currency, locale]);

  return null;
}
