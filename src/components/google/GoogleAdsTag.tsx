import Script from "next/script";

/**
 * Tag base do Google Ads (gtag.js) — a que registra a visita e sustenta o
 * remarketing e as conversões da conta.
 *
 * O ID vive em `NEXT_PUBLIC_GOOGLE_ADS_ID` com o mesmo desenho do GTM daqui: sem a
 * variável, nada é injetado. Isso evita que ambiente de desenvolvimento e preview
 * contaminem a conta com visita que não é de gente de verdade.
 *
 * O formato é validado antes da interpolação (mesmo cuidado do MetaPixel): o valor vem
 * de env, mas o snippet é HTML cru, e um ID torto viraria script quebrado no `<head>`
 * de todas as páginas.
 *
 * ATENÇÃO: esta tag sozinha NÃO registra conversão nenhuma — ela só conta visita. Cada
 * conversão precisa do disparo próprio (`gtag('event','conversion',{send_to:'AW-.../label'})`)
 * no envio do formulário e no clique do WhatsApp.
 *
 * Aqui fica só a fila (`dataLayer`/`gtag` + config). O gtag.js é baixado por <TerceirosAposInteracao>
 * na primeira interação do visitante (velocidade no celular); o que entrar na fila antes sai nessa hora.
 */
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
const ADS_ENABLED = !!ADS_ID && /^AW-\d{9,15}$/.test(ADS_ID);

/** URL do gtag.js para o carregador da primeira interação (null sem Google Ads configurado). */
export const GOOGLE_ADS_SCRIPT = ADS_ENABLED ? `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}` : null;

export default function GoogleAdsTag() {
  if (!ADS_ENABLED) return null;

  return (
    <>
      <Script
        id="google-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html:
            "window.dataLayer = window.dataLayer || [];" +
            "function gtag(){dataLayer.push(arguments);}" +
            "gtag('js', new Date());" +
            `gtag('config', '${ADS_ID}');`,
        }}
      />
    </>
  );
}
