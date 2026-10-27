"use client";

import { useEffect, useState } from "react";

/**
 * Celular: barra fixa com o botão de compra. Aparece depois do topo e some quando o formulário
 * de compra está na tela (não duplica o botão nem cobre o formulário).
 */
export default function BarraCompra({ rotulo = "Assinar agora", detalhe }: { rotulo?: string; detalhe?: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("assinar");
    let noFormulario = false;
    const atualizar = () => {
      const v = window.scrollY > 520 && !noFormulario && window.innerWidth < 768;
      setVisivel(v);
      // o botão flutuante do WhatsApp sobe enquanto a barra está na tela (não cobre o botão de compra)
      if (v) document.documentElement.dataset.barraCompra = "1";
      else delete document.documentElement.dataset.barraCompra;
    };
    const obs = alvo
      ? new IntersectionObserver(([e]) => { noFormulario = e.isIntersecting; atualizar(); }, { threshold: 0.05 })
      : null;
    if (alvo && obs) obs.observe(alvo);
    window.addEventListener("scroll", atualizar, { passive: true });
    return () => { window.removeEventListener("scroll", atualizar); obs?.disconnect(); delete document.documentElement.dataset.barraCompra; };
  }, []);

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 md:hidden ${visivel ? "translate-y-0" : "translate-y-full"}`}
      aria-hidden={!visivel}>
      <div className="flex items-center gap-3">
        {detalhe && <p className="min-w-0 flex-1 text-xs leading-tight text-slate-600">{detalhe}</p>}
        <a href="#assinar" tabIndex={visivel ? 0 : -1} className="shrink-0 rounded-lg bg-[#d4a72c] px-5 py-3 text-sm font-bold text-[#1f2a44]">{rotulo}</a>
      </div>
    </div>
  );
}
