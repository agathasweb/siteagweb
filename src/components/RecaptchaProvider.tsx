"use client";

import Script from "next/script";

interface Props {
  siteKey: string | null;
}

/**
 * Carrega o script global do reCAPTCHA v3. Renderiza nada visualmente.
 * Para executar e obter um token, use:
 *   await window.grecaptcha.execute(siteKey, { action: "..." })
 *
 * Se siteKey for null, não renderiza — formulários devem detectar a ausência
 * e enviar sem token (o servidor ignora verify se também não tiver secret).
 */
export default function RecaptchaProvider({ siteKey }: Props) {
  if (!siteKey) return null;
  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}

/**
 * Executa reCAPTCHA v3 e retorna o token. Espera o script carregar.
 * Helper p/ usar em onClick / onSubmit de client components.
 */
export async function executeRecaptcha(
  siteKey: string,
  action: string,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as {
    grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> };
  }).grecaptcha;
  if (!g) return null;
  return new Promise((resolve) => {
    g.ready(async () => {
      try {
        const token = await g.execute(siteKey, { action });
        resolve(token);
      } catch {
        resolve(null);
      }
    });
  });
}
