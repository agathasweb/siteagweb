import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/servicos'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.services.index.metadata.title,
    description: dict.services.index.metadata.description,
    alternates: {
      canonical: `${origin}/servicos`,
      languages: buildHreflangAlternates('/servicos'),
    },
  }
}

const SERVICE_ICONS = {
  moodle: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253',
  trafego: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  development: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  consultoria: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
} as const

const SERVICE_LINKS = {
  moodle: '/servicos/moodle',
  trafego: '/servicos/trafego-pago',
  development: '/servicos/desenvolvimento',
  consultoria: '/servicos/consultoria',
} as const

const CheckIcon = () => (
  <svg className="w-5 h-5 text-voyia-blue mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

export default async function ServicosPage({ params }: PageProps<'/[lang]/servicos'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.services.index
  const origin = getOriginForLocale(lang)

  const services = (['moodle', 'trafego', 'development', 'consultoria'] as const).map((key) => ({
    key,
    title: t.items[key].title,
    description: t.items[key].description,
    features: t.items[key].features,
    href: SERVICE_LINKS[key],
    iconPath: SERVICE_ICONS[key],
  }))

  return (
    <main id="main-content" role="main">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">
              {t.hero.lead}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 sm:py-32 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.key} className="group bg-voyia-gray rounded-2xl p-8 border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)]">
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[5deg]">
                  <div className="w-16 h-16 bg-voyia-blue rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.iconPath} />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={service.href}
                  aria-label={dict.common.learnMoreAbout.replace('{topic}', service.title)}
                  className="inline-flex items-center justify-center w-full bg-voyia-blue hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.learnMore}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": t.schemaServiceType,
        "provider": { "@type": "Organization", "name": dict.common.siteName, "url": origin },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": t.schemaCatalogName,
          "itemListElement": services.map(s => ({
            "@type": "Offer",
            "itemOffered": { "@type": "Service", "name": s.title, "description": s.description }
          }))
        }
      })}} />
    </main>
  )
}
