import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/servicos/desenvolvimento'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.services.development.metadata.title,
    description: dict.services.development.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/desenvolvimento`,
      languages: buildHreflangAlternates('/servicos/desenvolvimento'),
    },
  }
}

export default async function DesenvolvimentoPage({ params }: PageProps<'/[lang]/servicos/desenvolvimento'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.services.development
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black min-h-[60vh] flex items-center py-20 sm:py-32">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-full text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{t.hero.badge}</span>
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              <span className="block mb-2">{t.hero.titleLine1}</span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">{t.hero.titleLine2}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-10 max-w-3xl mx-auto">
              {t.hero.leadPrefix} <span className="text-white font-semibold">{t.hero.leadHighlights[0]}</span>, <span className="text-white font-semibold">{t.hero.leadHighlights[1]}</span>,
              <span className="text-white font-semibold"> {t.hero.leadHighlights[2]}</span> {t.hero.leadConnector} <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold">{t.hero.leadEmphasis}</span>{t.hero.leadSuffix}
            </p>
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-12 max-w-2xl mx-auto">
              {t.stats.map((stat, idx) => {
                const gradient = idx === 0 ? 'from-blue-400 to-cyan-400' : idx === 1 ? 'from-cyan-400 to-green-400' : 'from-green-400 to-blue-400'
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</div>
                  </div>
                )
              })}
            </div>
            <Link href="/contato" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl">
              {t.cta}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 text-center">{t.sectionTitle}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 mx-auto rounded-full mb-16" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
