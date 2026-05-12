import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/hospedagem-moodle'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.productsPages.hospedagemMoodle.metadata.title,
    description: dict.productsPages.hospedagemMoodle.metadata.description,
    alternates: {
      canonical: `${origin}/produtos/hospedagem-moodle`,
      languages: buildHreflangAlternates('/produtos/hospedagem-moodle'),
    },
  }
}

export default async function HospedagemMoodlePage({ params }: PageProps<'/[lang]/produtos/hospedagem-moodle'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.productsPages.hospedagemMoodle

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t.hero.titlePrefix} <span className="text-orange-400">{t.hero.titleHighlight}</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-16">{t.plansTitle}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {t.plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 ${plan.featured ? 'bg-gradient-to-b from-voyia-blue/20 to-voyia-gray border-voyia-blue/50 shadow-[0_0_30px_rgba(147,51,234,0.15)]' : 'bg-voyia-gray border-gray-700'}`}>
                {plan.featured && <span className="bg-voyia-blue text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">{t.popularBadge}</span>}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-voyia-blue font-semibold mb-6">{plan.alunos}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center text-gray-300 text-sm">
                      <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contato" className={`block text-center py-3 rounded-lg font-semibold transition-colors ${plan.featured ? 'bg-voyia-blue hover:bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>{t.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
