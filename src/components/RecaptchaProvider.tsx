"use client";

import { useEffect } from "react";

interface Grecaptcha {
  ready: (cb: () => void) => void;
  execute: (key: string, opts: { action: string }) => Promise<string>;
}

function getGrecaptcha(): Grecaptcha | undefined {
  return (window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha;
}

// Promessa única de carregamento — idempotente. Resetada em falha p/ permitir retry.
let loadPromise: Promise<Grecaptcha | null> | null = null;

/**
 * Injeta o script do reCAPTCHA v3 sob demanda. Idempotente: chamadas
 * concorrentes compartilham a mesma promessa. Resolve com o objeto
 * `grecaptcha` já pronto (ou null se a key faltar / o script falhar).
 *
 * Carregar sob demanda (em vez de em todo page load) tira ~730 KiB de JS,
 * ~40 KiB de CSS e ~1,2s de CPU do carregamento inicial.
 */
export function loadRecaptcha(siteKey: string): Promise<Grecaptcha | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const existing = getGrecaptcha();
    if (existing) {
      existing.ready(() => resolve(existing));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.onload = () => {
      const g = getGrecaptcha();
      if (g) {
        g.ready(() => resolve(g));
      } else {
        loadPromise = null;
        resolve(null);
      }
    };
    script.onerror = () => {
      loadPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/**
 * Pré-carrega o reCAPTCHA v3 na primeira interação do usuário, mantendo-o
 * fora do caminho crítico do carregamento inicial. Não renderiza nada.
 *
 * Se siteKey for null, não faz nada — formulários detectam a ausência e
 * enviam sem token (o servidor ignora verify se também não tiver secret).
 */
export default function RecaptchaProvider({ siteKey }: { siteKey: string | null }) {
  useEffect(() => {
    if (!siteKey) return;
    const trigger = () => loadRecaptcha(siteKey);
    for (const ev of INTERACTION_EVENTS) {
      window.addEventListener(ev, trigger, { once: true, passive: true });
    }
    return () => {
      for (const ev of INTERACTION_EVENTS) {
        window.removeEventListener(ev, trigger);
      }
    };
  }, [siteKey]);

  return null;
}

/**
 * Executa reCAPTCHA v3 e retorna o token. Garante o carregamento do script
 * (caso a interação inicial não tenha disparado) e aguarda ficar pronto.
 * Helper p/ usar em onClick / onSubmit de client components.
 */
export async function executeRecaptcha(
  siteKey: string,
  action: string,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const g = await loadRecaptcha(siteKey);
  if (!g) return null;
  try {
    return await g.execute(siteKey, { action });
  } catch {
    return null;
  }
}
