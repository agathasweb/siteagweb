/**
 * TikTok Pixel do Salomão. Só existe nas páginas do Salomão (público de escolas): o base code é
 * injetado aqui, sob demanda, pelo <SalomaoPixel/> — nunca no layout do site.
 *
 * Os eventos levam o mesmo event_id do Pixel/CAPI da Meta; quando a Events API do TikTok entrar,
 * o servidor espelha com esse id e o TikTok deduplica.
 */

type Ttq = {
  load: (id: string, opts?: Record<string, unknown>) => void;
  page: () => void;
  track: (evento: string, dados?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  identify: (dados: Record<string, string>) => void;
};

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

export function tiktokPixelSalomao(): string | null {
  const id = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_SALOMAO?.trim() || "DBI8KGBC77UFSQ3BTOD0";
  return /^[A-Z0-9]{15,25}$/.test(id) ? id : null;
}

/** Base code oficial do TikTok (fila `ttq` + events.js), seguido de load + page. */
export function carregarTikTokPixel(pixelId: string): void {
  if (typeof window === "undefined" || window.ttq) return;
  /* eslint-disable */
  // Snippet oficial, mantido como o TikTok entrega.
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"], ttq.setAndDefer = function (t: any, e: string) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++)ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t: string) {
      for (
        var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)ttq.setAndDefer(e, ttq.methods[n]); return e
    }, ttq.load = function (e: string, n?: any) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; var s = d.createElement("script")
        ; s.type = "text/javascript", s.async = !0, s.src = r + "?sdkid=" + e + "&lib=" + t; var p = d.getElementsByTagName("script")[0]; p.parentNode!.insertBefore(s, p)
    };
  })(window, document, "ttq");
  /* eslint-enable */
  window.ttq!.load(pixelId);
  window.ttq!.page();
}

/** Evento padrão do TikTok (ViewContent, InitiateCheckout, SubmitForm…). Sem pixel carregado, não faz nada. */
export function trackTikTok(evento: string, eventId: string, dados?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.track(evento, dados ?? {}, { event_id: eventId });
}

/** Advanced matching: o pixel do TikTok aplica SHA-256 no navegador antes de enviar. */
export function identificarTikTok(email?: string | null, telefone?: string | null): void {
  if (typeof window === "undefined" || !window.ttq) return;
  const dados: Record<string, string> = {};
  if (email) dados.email = email.trim().toLowerCase();
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos) dados.phone_number = `+${digitos.startsWith("55") ? digitos : `55${digitos}`}`;
  if (Object.keys(dados).length) window.ttq.identify(dados);
}
