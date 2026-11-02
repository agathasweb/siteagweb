"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

const MARCOS = [25, 50, 75, 90] as const;

/**
 * Medição das páginas do Salomão (02/11/2026). Em 7 dias de anúncio foram ~1.330 visitas e nenhum
 * contato, sem como saber até onde as pessoas liam. Aqui:
 *
 * - Microsoft Clarity (gravação de sessão + mapa de calor), só se `clarityId` vier configurado
 *   (CLARITY_PROJECT_ID no .env da produção). Cada página leva a tag `lp` (produto/oferta/conheça).
 * - Rolagem: ao passar de 25/50/75/90% da página, uma vez por visita, vai
 *   (a) `Rolagem` como evento customizado SÓ para o pixel do Salomão (vira público "leu 75%" para
 *   remarketing de quem se interessou de verdade) e (b) evento `rolagem_75` no Clarity (filtro das
 *   gravações). Não é evento padrão: não mexe na otimização das campanhas.
 */
export default function MedicaoSalomao({ clarityId, pixelId, pagina }: { clarityId: string | null; pixelId: string | null; pagina: string }) {
  useEffect(() => {
    if (!clarityId || typeof window === "undefined") return;
    if (!window.clarity) {
      const fila = function (...args: unknown[]) { (fila.q = fila.q || []).push(args); } as NonNullable<Window["clarity"]>;
      window.clarity = fila;
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`;
      document.head.appendChild(s);
    }
    window.clarity("set", "lp", pagina);
  }, [clarityId, pagina]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enviados = new Set<number>();
    let agendado = false;
    const medir = () => {
      agendado = false;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = (window.scrollY / total) * 100;
      for (const m of MARCOS) {
        if (pct < m || enviados.has(m)) continue;
        enviados.add(m);
        if (pixelId && typeof window.fbq === "function") {
          window.fbq("trackSingleCustom", pixelId, "Rolagem", { percentual: m, pagina });
        }
        window.clarity?.("event", `rolagem_${m}`);
      }
      if (enviados.size === MARCOS.length) window.removeEventListener("scroll", aoRolar);
    };
    const aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(medir);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [pixelId, pagina]);

  return null;
}
