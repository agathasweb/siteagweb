import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { moedaDoLocale, idiomaDaMoeda, contaSkrUrl } from "@/lib/skrender/venda";
import { TEXTOS_PAGAMENTO } from "@/lib/skrender/textos-pagamento";
import MedirCompraSkr from "@/components/skrender/MedirCompraSkr";

/** Volta do Stripe Checkout (SK Render no exterior). Os renders entram pelo webhook; aqui só agradece e mede. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/sk-render/obrigado">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const moeda = moedaDoLocale(lang);
  if (!moeda) redirect("https://skrender.agathas.com.br/conta");
  const idioma = idiomaDaMoeda(moeda);
  const t = TEXTOS_PAGAMENTO[idioma];
  const sp = await searchParams;
  const sessao = typeof sp.s === "string" ? sp.s.slice(0, 120) : "";
  return (
    <main className="min-h-[70vh] px-4 py-16 text-center text-white">
      <h1 className="mb-4 text-4xl font-bold">{t.tituloObrigado}</h1>
      <p className="mx-auto mb-8 max-w-md text-lg text-white/80">{t.obrigado}</p>
      <a href={contaSkrUrl(idioma)} className="inline-block rounded-xl bg-[#e08a5b] px-6 py-4 text-lg font-bold text-white">{t.irConta}</a>
      {sessao && <MedirCompraSkr sessao={sessao} />}
    </main>
  );
}
