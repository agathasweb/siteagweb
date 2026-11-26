// Centraliza dados de contato pra evitar hardcoding espalhado.

/**
 * Número WhatsApp API Oficial (só dígitos, com DDI). Desde 26/11/2026 todos os botões dos sites
 * (agathasweb.com, agathas.com.br, agathas.es, uk.agathasweb.com e Salomão) chamam no
 * +55 62 9690-1469, o número do atendimento por IA por produto no Voyia. O 9123-9558 saiu.
 */
export const WHATSAPP_NUMBER = "556296901469";

/** Versão formatada human-readable. Sincronizar com /messages/*.json. */
export const WHATSAPP_DISPLAY = "+55 62 9690-1469";

/**
 * Script de origem do lead do Voyia (uma linha em todas as páginas). A chave é PÚBLICA por
 * desenho (só registra cliques). Ver voyia-dev: conversion-tracking/tracker.script.ts.
 */
export const VOYIA_TRACKER = {
  src: "https://voyia.agathasweb.com/api/v1/public/tracking/tracker.js",
  client: "agathasweb",
  key: "vtk_64a8a7f6270a4f048001d74b53ae5fae",
};

/**
 * Monta URL de click-to-chat com mensagem prefilled URL-encoded.
 * Usa api.whatsapp.com/send com phone= explícito — wa.me/ tem histórico de
 * misparsear números BR de 13 dígitos (libphonenumber engole o 9 inicial).
 */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}&text=${encodeURIComponent(message)}`;
}
