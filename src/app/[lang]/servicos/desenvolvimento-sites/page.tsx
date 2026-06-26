import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, buildPageMetadata } from '@/lib/i18n'
import WhatsAppCta from '@/components/whatsapp/WhatsAppCta'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import { WHATSAPP_MODAL_LABELS } from '@/lib/whatsapp-modal-labels'

const PREFILL: Record<string, string> = {
  'pt-BR': 'Olá! Vi a página de Desenvolvimento de Sites e quero conversar sobre um projeto.',
  es: '¡Hola! Vi la página de Desarrollo de Sitios y quiero conversar sobre un proyecto.',
  'en-US': 'Hi! I saw the Website Development page and want to discuss a project.',
  'en-GB': 'Hi! I saw the Website Development page and want to discuss a project.',
}

export async function generateMetadata({ params }: PageProps<'/[lang]/servicos/desenvolvimento-sites'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/servicos/desenvolvimento-sites',
    title: dict.services.developmentSites.metadata.title,
    description: dict.services.developmentSites.metadata.description,
  })
}

export default async function DesenvolvimentoSitesPage({ params }: PageProps<'/[lang]/servicos/desenvolvimento-sites'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.services.developmentSites
  const recaptchaSiteKey = getRecaptchaSiteKey()
  const modalLabels = WHATSAPP_MODAL_LABELS[lang]

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-full text-sm font-semibold text-blue-300 mb-8">{t.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
        </div>
      </section>

      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 bg-gradient-to-r from-voyia-blue/10 to-purple-900/10 border border-voyia-blue/30 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{t.why.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.why.features.map((feature) => (
                <div key={feature.label}>
                  <div className="text-voyia-blue font-bold text-lg mb-1">{feature.label}</div>
                  <div className="text-gray-400 text-sm">{feature.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <WhatsAppCta
                label={t.cta}
                prefillMessage={PREFILL[lang]}
                ctaContext="dev-sites-cta"
                locale={lang}
                recaptchaSiteKey={recaptchaSiteKey}
                modalLabels={modalLabels}
                className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
