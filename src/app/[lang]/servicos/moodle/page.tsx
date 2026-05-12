import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/servicos/moodle'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.services.moodle.metadata.title,
    description: dict.services.moodle.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/moodle`,
      languages: buildHreflangAlternates('/servicos/moodle'),
    },
  }
}

export default async function MoodlePage({ params }: PageProps<'/[lang]/servicos/moodle'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.services.moodle

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/40 rounded-full text-sm font-semibold text-orange-300 mb-8">{t.hero.badge}</span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t.hero.titlePrefix} <span className="text-orange-400">{t.hero.titleHighlight}</span></h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {t.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
              {t.cta}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
