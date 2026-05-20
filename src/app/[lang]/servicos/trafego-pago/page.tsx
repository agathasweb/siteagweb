import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'
import BrazilOnlyPricingModal from '@/components/BrazilOnlyPricingModal'
import WhatsAppCta from '@/components/whatsapp/WhatsAppCta'
import AnimatedDashboard from '@/components/trafego/AnimatedDashboard'
import TrafegoPlans from '@/components/trafego/TrafegoPlans'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import { WHATSAPP_MODAL_LABELS } from '@/lib/whatsapp-modal-labels'

const PREFILL: Record<string, string> = {
  'pt-BR': 'Olá! Vi a página de Tráfego Pago e quero solicitar uma análise gratuita.',
  es: '¡Hola! Vi la página de Tráfico Pago y quiero solicitar un análisis gratuito.',
  'en-US': 'Hi! I saw the Paid Traffic page and want a free analysis.',
  'en-GB': 'Hi! I saw the Paid Traffic page and want a free analysis.',
}

export async function generateMetadata({ params }: PageProps<'/[lang]/servicos/trafego-pago'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.services.trafegoPago.metadata.title,
    description: dict.services.trafegoPago.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/trafego-pago`,
      languages: buildHreflangAlternates('/servicos/trafego-pago'),
    },
  }
}

export default async function TrafegoPagoPage({ params }: PageProps<'/[lang]/servicos/trafego-pago'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.services.trafegoPago
  const brOnly = lang === 'pt-BR'
  const brNotice = dict.brazilOnlyNotice
  const recaptchaSiteKey = getRecaptchaSiteKey()
  const modalLabels = WHATSAPP_MODAL_LABELS[lang]

  return (
    <main id="main-content" role="main">
      {!brOnly && (
        <BrazilOnlyPricingModal
          storageKey="brazil-only-trafego"
          title={brNotice.modalTitle}
          body={brNotice.modalBody}
          ctaContact={brNotice.ctaContact}
          ctaClose={brNotice.ctaClose}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(34,197,94,0.15), transparent 45%)' }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                {t.hero.badge}
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                {t.hero.titlePrefix} <span className="text-blue-400">{t.hero.titleHighlight}</span>
              </h1>
              <p className="mt-5 text-xl text-blue-300 font-semibold">{t.hero.subtitle}</p>
              <p className="mt-5 text-lg leading-8 text-gray-300">{t.hero.lead}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <WhatsAppCta
                  label={t.hero.ctaPrimary}
                  prefillMessage={PREFILL[lang]}
                  ctaContext="trafego-pago-hero"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-blue-500/20"
                />
                <a href="#planos" className="inline-flex items-center gap-2 border border-gray-600 hover:border-blue-400 text-white px-6 py-3.5 rounded-lg font-semibold transition-colors text-base">
                  {t.hero.ctaSecondary}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400">
                {t.hero.bullets.map((b) => (
                  <span key={b} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <AnimatedDashboard
                title={t.hero.mockTitle}
                period={t.hero.mockPeriod}
                kpis={t.hero.mockKpis}
                chartLabel={t.hero.mockChartLabel}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Aviso "Não fazemos criativos" */}
      <section className="py-10 bg-yellow-500/10 border-y border-yellow-500/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <span className="text-3xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-yellow-300 mb-1">{t.noCreatives.heading}</h3>
            <p className="text-sm text-yellow-100/80 leading-relaxed">{t.noCreatives.body}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.differentials.heading}</h2>
            <p className="text-lg text-gray-300">{t.differentials.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.differentials.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-blue-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.features.heading}</h2>
            <p className="text-lg text-gray-300">{t.features.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] transition-all duration-300">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.howItWorks.heading}</h2>
            <p className="text-lg text-gray-300">{t.howItWorks.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.howItWorks.steps.map((step, i) => (
              <div key={step.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 h-full">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center mb-4">{i + 1}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      {brOnly ? (
        <section id="planos" className="py-24 bg-voyia-dark">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.pricing.heading}</h2>
              <p className="text-lg text-gray-300">{t.pricing.subheading}</p>
            </div>
            <TrafegoPlans
              plans={t.pricing.plans}
              pricing={t.pricing}
              lang={lang}
              recaptchaSiteKey={recaptchaSiteKey}
              modalLabels={modalLabels}
            />
          </div>
        </section>
      ) : (
        <section id="planos" className="py-24 bg-voyia-dark">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-voyia-gray to-voyia-gray p-10 lg:p-14 text-center">
              <span className="text-4xl mb-4 block">🇧🇷</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{brNotice.sectionTitle}</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">{brNotice.sectionBody}</p>
              <WhatsAppCta
                label={brNotice.ctaContact}
                prefillMessage={PREFILL[lang]}
                ctaContext="trafego-pago-br-only"
                locale={lang}
                recaptchaSiteKey={recaptchaSiteKey}
                modalLabels={modalLabels}
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition-colors"
              />
            </div>
          </div>
        </section>
      )}

      {/* Escopo: O que está incluso x não está */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.scope.heading}</h2>
            <p className="text-lg text-gray-300">{t.scope.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-voyia-gray rounded-2xl p-7 border border-green-500/30">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">✅</span>
                <h3 className="text-xl font-semibold text-green-300">{t.scope.includedHeading}</h3>
              </div>
              <ul className="space-y-3">
                {t.scope.included.map((item) => (
                  <li key={item} className="flex items-start text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-voyia-gray rounded-2xl p-7 border border-red-500/30">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">❌</span>
                <h3 className="text-xl font-semibold text-red-300">{t.scope.excludedHeading}</h3>
              </div>
              <ul className="space-y-3">
                {t.scope.excluded.map((item) => (
                  <li key={item} className="flex items-start text-sm text-gray-300">
                    <svg className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.faq.heading}</h2>
            <p className="text-lg text-gray-300">{t.faq.subheading}</p>
          </div>
          <div className="space-y-4">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-semibold hover:bg-black/20 transition-colors list-none">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 text-blue-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-5 text-gray-300 leading-relaxed text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 via-voyia-gray to-green-500/10 border border-blue-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(59,130,246,0.4), transparent 50%)' }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.ctaPrimary}
                  prefillMessage={PREFILL[lang]}
                  ctaContext="trafego-pago-final-primary"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-blue-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
