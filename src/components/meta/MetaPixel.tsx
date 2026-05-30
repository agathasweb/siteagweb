import Script from "next/script";
import { getClientPixels } from "@/lib/meta/config";

/**
 * Injeta o base code do Meta Pixel UMA vez, no `<head>` — agora MULTI-PIXEL.
 *
 * Modo espelho: todos os pixels de `getClientPixels()` são inicializados e o
 * `fbq('track', ...)` dispara para TODOS eles (site + mensagens). Cada BM
 * atribui só os cliques dos próprios anúncios.
 *
 * Segurança: cada ID é validado pelo regex `^\d{10,20}$` em getClientPixels()
 * antes de entrar no snippet — não há input externo. Mesmo padrão do GTM.
 *
 * O `init` + `track('PageView')` dispara um PageView para todos os pixels;
 * eventos subsequentes vão via `trackPixelEvent()` em pixel.ts, sempre com
 * `event_id` explícito pra deduplicar com o CAPI.
 *
 * Estratégia: `lazyOnload` adia o download dos ~154KiB de fbevents.js para
 * o evento `load` da janela, fora do caminho crítico de LCP/FCP.
 */
export default function MetaPixel() {
  const pixels = getClientPixels();
  if (pixels.length === 0) return null;

  // Sanidade extra antes da interpolação (defense-in-depth). getClientPixels()
  // já validou o formato — esse filtro é redundante mas barato.
  const ids = pixels.map((p) => p.id).filter((id) => /^\d{10,20}$/.test(id));
  if (ids.length === 0) return null;

  // Snippet oficial sem a parte que injeta a tag <script> — o carregamento é
  // delegado ao <Script strategy="lazyOnload"> abaixo, que adia até window.load.
  // Inicializa cada pixel e dispara UM PageView (vai para todos os inicializados).
  const initLines = ids.map((id) => `fbq('init','${id}');`).join("");
  const stubSnippet =
    "!function(f,b,e,v,n,t,s)" +
    "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};" +
    "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';" +
    "n.queue=[]}(window, document,'script');" +
    `${initLines}fbq('track','PageView');`;

  return (
    <>
      <Script
        id="meta-pixel-stub"
        strategy="afterInteractive"
        // Snippet oficial Meta — ID já validado por regex acima (apenas dígitos).
        dangerouslySetInnerHTML={{ __html: stubSnippet }}
      />
      <Script
        id="meta-pixel-loader"
        strategy="lazyOnload"
        src="https://connect.facebook.net/en_US/fbevents.js"
      />
      <noscript>
        {ids.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        ))}
      </noscript>
    </>
  );
}
