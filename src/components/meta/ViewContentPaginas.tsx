"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackClient } from "@/lib/meta/track-client";

/**
 * Dispara `ViewContent` (Pixel + CAPI) ao abrir qualquer página de produto ou serviço.
 *
 * Por que existe: a campanha de conversão da Meta otimiza por ViewContent, mas o evento
 * só era disparado em /produtos/voyia — os anúncios de Moodle levam para
 * /produtos/hospedagem-moodle, /servicos/moodle etc., que nunca geravam o evento, e a
 * campanha ficou 3 dias sem nenhum sinal para aprender (set/2026).
 *
 * Montado uma vez no layout: cobre páginas novas sem precisar lembrar de incluir nada.
 * O Voyia fica de fora porque tem o próprio `ViewContentVoyia` (com preço e planos);
 * disparar aqui também contaria a visita em dobro. Páginas-índice (/produtos, /servicos)
 * não são conteúdo de oferta e também ficam de fora.
 */

const ROTA = /\/(produtos|servicos)\/([a-z0-9-]+)\/?$/;
const COM_VIEWCONTENT_PROPRIO = new Set(["voyia"]);

export default function ViewContentPaginas({ locale }: { locale: string }) {
  const pathname = usePathname();
  // Guarda a última rota disparada: 1 evento por página visitada, mesmo com o
  // effect rodando 2x no Strict Mode em dev.
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    const m = pathname?.match(ROTA);
    if (!m) return;
    const [, tipo, slug] = m;
    if (COM_VIEWCONTENT_PROPRIO.has(slug) || ultima.current === pathname) return;
    ultima.current = pathname;

    void trackClient({
      eventName: "ViewContent",
      customData: {
        content_name: slug,
        content_category: tipo === "produtos" ? "produto" : "servico",
        content_type: "product",
        content_ids: [slug],
        locale,
      },
    });
  }, [pathname, locale]);

  return null;
}
