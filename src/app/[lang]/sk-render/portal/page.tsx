import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { moedaDoLocale, idiomaDaMoeda, PRECOS, contaSkrUrl } from "@/lib/skrender/venda";
import { TEXTOS_PAGAMENTO } from "@/lib/skrender/textos-pagamento";
import PagamentoSkr from "@/components/skrender/PagamentoSkr";

/** SK Render no exterior (21/11/2026): portal da Stripe para gerenciar a assinatura. */
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: PageProps<"/[lang]/sk-render/portal">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const moeda = moedaDoLocale(lang);
  if (!moeda) redirect("https://skrender.agathas.com.br/conta");
  const idioma = idiomaDaMoeda(moeda);
  const t = TEXTOS_PAGAMENTO[idioma];
  return (
    <main className="min-h-[70vh] px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">{t.tituloPortal}</h1>
      <PagamentoSkr modo="portal" lang={lang} idioma={idioma} moeda={moeda} precos={PRECOS[moeda]} textos={{ ...t }} conta={contaSkrUrl(idioma)} />
    </main>
  );
}
