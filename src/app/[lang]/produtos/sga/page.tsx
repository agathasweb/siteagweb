import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/sga'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.productsPages.sga.metadata.title,
    description: dict.productsPages.sga.metadata.description,
    alternates: {
      canonical: `${origin}/produtos/sga`,
      languages: buildHreflangAlternates('/produtos/sga'),
    },
  }
}

export default async function SGAPage({ params }: PageProps<'/[lang]/produtos/sga'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.productsPages.sga

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="bg-voyia-blue/20 text-voyia-blue px-4 py-2 rounded-full text-sm font-semibold mb-8 inline-block">{t.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl"><span className="text-voyia-blue">{t.hero.titleHighlight}</span> {t.hero.titleSuffix}</h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">{t.cta}</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
