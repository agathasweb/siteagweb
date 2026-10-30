"use client";

import type { ReactNode } from "react";
import { trackClient } from "@/lib/meta/track-client";
import { newEventId } from "@/lib/meta/event-id";
import { trackTikTok } from "@/lib/tiktok/pixel";

/**
 * WhatsApp das páginas do Salomão: conversa direta com mensagem pronta, sem o formulário do botão
 * genérico do site (que fala da agência e ia para o atendimento geral). Escola compra conversando:
 * é o CTA principal das landings.
 *
 * O clique conta como `Contact` no pixel do Salomão (+ CAPI, mesmo event_id) e no TikTok.
 */
const NUMERO = "5562991239558";

export function linkWhatsAppSalomao(origem: string): string {
  const texto = `Olá! Vim pela página do Salomão (${origem}) e quero conhecer o app para a minha escola.`;
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(texto)}`;
}

function registrarContato(pixelId: string | null, origem: string) {
  const eventId = newEventId();
  void trackClient({
    eventName: "Contact",
    eventId,
    pixelId,
    produto: "salomao",
    customData: { content_name: "Salomão — WhatsApp", content_category: "salomao", lead_source: `salomao_whatsapp_${origem}` },
  });
  trackTikTok("Contact", eventId, { contents: [{ content_id: "salomao-whatsapp", content_name: "Salomão — WhatsApp" }] });
}

export function BotaoWhatsApp({ pixelId, origem, className, children }: { pixelId: string | null; origem: string; className?: string; children?: ReactNode }) {
  return (
    <a href={linkWhatsAppSalomao(origem)} target="_blank" rel="noopener" onClick={() => registrarContato(pixelId, origem)}
      className={className ?? "inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]"}>
      <IconeWhatsApp className="h-5 w-5" />
      {children ?? "Tirar dúvidas no WhatsApp"}
    </a>
  );
}

/** Botão flutuante (o do site some nas páginas do Salomão — ver FloatingWhatsAppButton). */
export function WhatsAppFlutuanteSalomao({ pixelId }: { pixelId: string | null }) {
  return (
    <a href={linkWhatsAppSalomao("botão flutuante")} target="_blank" rel="noopener" aria-label="Falar com a equipe do Salomão no WhatsApp"
      onClick={() => registrarContato(pixelId, "flutuante")}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-2xl shadow-green-600/40 transition-all hover:scale-110 sm:h-16 sm:w-16 [html[data-barra-compra]_&]:bottom-24">
      <IconeWhatsApp className="h-7 w-7 sm:h-8 sm:w-8" />
    </a>
  );
}

function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 01-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 012.77 6.68c0 5.2-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0012.05.69C5.78.69.68 5.79.68 12.05c0 2 .52 3.96 1.52 5.68L.6 23.3l5.7-1.5a11.33 11.33 0 005.74 1.47h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.04z" />
    </svg>
  );
}
