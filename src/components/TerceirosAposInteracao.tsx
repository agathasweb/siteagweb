"use client";

import { useEffect } from "react";

const EVENTOS = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove", "wheel"] as const;

/**
 * Baixa os scripts de anúncios (Google Ads/GTM, pixel do Facebook) só na PRIMEIRA interação do visitante
 * (toque, rolagem, tecla ou mouse). Decisão de 27/10/2026: velocidade máxima no celular.
 *
 * As filas (`fbq`, `gtag`/`dataLayer`) são criadas antes, no <head>, então nenhum evento se perde:
 * PageView, ViewContent, conversões etc. ficam na fila e saem quando o script chega.
 * Trade-off aceito: quem entra e sai sem interagir não é contado pelos anúncios.
 * Exceção: quem chega por anúncio (fbclid/gclid ou utm_source de Meta/Google) carrega logo após a pintura,
 * senão a campanha otimizada por "visualização da página de destino" não enxerga quem não tocou na tela.
 */
const DE_ANUNCIO = /^(facebook|fb|meta|instagram|ig|google|googleads|adwords)$/i;

function veioDeAnuncio(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.has("fbclid") || q.has("gclid") || DE_ANUNCIO.test(q.get("utm_source") ?? "");
  } catch {
    return false;
  }
}

export default function TerceirosAposInteracao({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    if (!scripts.length) return;
    let feito = false;
    const carregar = () => {
      if (feito) return;
      feito = true;
      for (const ev of EVENTOS) window.removeEventListener(ev, carregar);
      for (const src of scripts) {
        if (document.querySelector(`script[src="${src}"]`)) continue;
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
      }
    };
    for (const ev of EVENTOS) window.addEventListener(ev, carregar, { passive: true, once: true });
    const timer = veioDeAnuncio() ? window.setTimeout(carregar, 800) : undefined;
    return () => {
      window.clearTimeout(timer);
      for (const ev of EVENTOS) window.removeEventListener(ev, carregar);
    };
  }, [scripts]);

  return null;
}
