"use client";

import { useEffect } from "react";
import {
  getFbclidFromLocation,
  persistFbcFromFbclid,
  persistUtmsFromLocation,
} from "@/lib/meta/attribution";

/**
 * Garante que o cookie `_fbc` seja persistido quando o usuário cair na página
 * via anúncio Meta (`?fbclid=`). O Pixel base code já faz isso quando carrega,
 * mas se o fbq demorar (mobile lento / ad-block), perdemos o click ID.
 *
 * Este componente é client-only e roda 1 vez por carregamento de página —
 * idempotente: se já existe `_fbc` com o mesmo fbclid, não sobrescreve o
 * timestamp original (preserva o "primeiro toque").
 *
 * Também serve como pull p/ futuros parceiros: gclid (Google), ttclid (TikTok)
 * podem entrar aqui sem novo componente.
 */
export default function AttributionCapture() {
  useEffect(() => {
    const fbclid = getFbclidFromLocation();
    if (fbclid) persistFbcFromFbclid(fbclid);
    // First-touch UTM attribution (cookie 90d).
    persistUtmsFromLocation();
  }, []);

  return null;
}
