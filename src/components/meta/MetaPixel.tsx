import Script from "next/script";
import { META_PIXEL_ID, isPixelEnabled } from "@/lib/meta/config";

/**
 * Injeta o base code do Meta Pixel UMA vez, no `<head>`.
 *
 * Segurança: META_PIXEL_ID é validado pelo regex `^\d{10,20}$` em
 * `isPixelEnabled()` — não há input externo no snippet. Mesmo padrão do GTM
 * em layout.tsx (snippet oficial documentado pela Meta).
 *
 * O `init` dispara um `PageView` automaticamente — eventos subsequentes vão
 * via `trackPixelEvent()` em pixel.ts, sempre com `event_id` explícito pra
 * deduplicar com o CAPI.
 */
export default function MetaPixel() {
  if (!isPixelEnabled()) return null;

  // Sanidade extra: re-checa o formato antes da interpolação (defense-in-depth).
  // isPixelEnabled() já garantiu — esse if é só pra TypeScript narrowing + hook.
  const id = META_PIXEL_ID;
  if (!/^\d{10,20}$/.test(id)) return null;

  const snippet =
    "!function(f,b,e,v,n,t,s)" +
    "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};" +
    "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';" +
    "n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];" +
    "s.parentNode.insertBefore(t,s)}(window, document,'script'," +
    "'https://connect.facebook.net/en_US/fbevents.js');" +
    `fbq('init','${id}');fbq('track','PageView');`;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        // Snippet oficial Meta — ID já validado por regex acima (apenas dígitos).
        dangerouslySetInnerHTML={{ __html: snippet }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
