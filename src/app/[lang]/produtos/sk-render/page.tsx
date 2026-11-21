import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { isLocale, buildPageMetadata } from '@/lib/i18n'
import JsonLd from '@/components/JsonLd'
import { pageSchemas } from '@/lib/structured-data'
import { SK_RENDER_TEXTOS, skRenderUrl } from '@/lib/sk-render-textos'
import type { Locale } from '@/lib/i18n'

/**
 * SK Render — plugin de render com IA para SketchUp (repo ~/DDEV/sk-render).
 * Página de apresentação: a conta, o download e a compra de crédito ficam em skrender.agathas.com.br.
 * Existe para o produto aparecer no site da empresa (pedido do Gutto, 18/11/2026).
 */

const PATH = '/produtos/sk-render'
const COR = '#e08a5b'

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/sk-render'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const t = SK_RENDER_TEXTOS[lang]
  return buildPageMetadata({ lang, path: PATH, title: t.metadata.title, description: t.metadata.description })
}

function Botao({ label, lang }: { label: string; lang: Locale }) {
  return (
    <a
      href={skRenderUrl(lang)}
      className="inline-flex items-center gap-2 bg-[#b5643a] hover:bg-[#c97547] text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-[#b5643a]/20"
    >
      {label}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </a>
  )
}

export default async function SkRenderPage({ params }: PageProps<'/[lang]/produtos/sk-render'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = SK_RENDER_TEXTOS[lang]

  return (
    <main id="main-content" role="main">
      <JsonLd data={pageSchemas({ lang, path: PATH, title: t.metadata.title, description: t.metadata.description, kind: 'SoftwareApplication', faq: t.faq })} />

      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/25 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6" style={{ borderColor: `${COR}66`, color: COR }}>{t.badge}</span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              {t.titlePrefix} <span style={{ color: COR }}>{t.titleHighlight}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">{t.lead}</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Botao label={t.cta} lang={lang} />
              <p className="text-sm text-gray-400">{t.ctaNote}</p>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            {([['antes', t.before], ['depois', t.after]] as const).map(([arquivo, legenda]) => (
              <figure key={arquivo} className="rounded-2xl overflow-hidden border border-gray-800 bg-voyia-gray/40">
                <Image src={`/assets/sk-render/${arquivo}.jpg`} alt={legenda} width={1400} height={980} className="w-full h-auto" priority={arquivo === 'depois'} />
                <figcaption className="px-4 py-3 text-sm text-gray-300 text-center">{legenda}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-12">{t.stepsHeading}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.steps.map((s, i) => (
              <li key={s.title} className="bg-black/40 rounded-2xl p-6 border border-gray-800">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-4" style={{ backgroundColor: '#b5643a' }}>{i + 1}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-12">{t.featuresHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.features.map((f) => (
              <div key={f.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-10">{t.pricingHeading}</h2>
          <ul className="space-y-3">
            {t.pricing.map((linha) => (
              <li key={linha} className="flex items-start gap-3 text-gray-200">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COR }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>{linha}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 bg-black">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-10">{t.faqHeading}</h2>
          <div className="space-y-4">
            {t.faq.map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-800 bg-voyia-gray/40 p-5">
                <summary className="cursor-pointer font-semibold text-white">{item.q}</summary>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-voyia-dark border-t border-gray-800">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.finalHeading}</h2>
          <p className="mt-4 text-lg text-gray-300">{t.finalBody}</p>
          <div className="mt-8 flex justify-center"><Botao label={t.cta} lang={lang} /></div>
          <p className="mt-8 text-xs text-gray-500">{t.trademark}</p>
        </div>
      </section>
    </main>
  )
}
