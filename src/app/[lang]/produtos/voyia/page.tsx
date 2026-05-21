import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'
import BrazilOnlyPricingModal from '@/components/BrazilOnlyPricingModal'
import WhatsAppCta from '@/components/whatsapp/WhatsAppCta'
import AnimatedChatMock from '@/components/voyia/AnimatedChatMock'
import AsaasCheckoutButton from '@/components/asaas/AsaasCheckoutButton'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import { WHATSAPP_MODAL_LABELS } from '@/lib/whatsapp-modal-labels'

/** Mapeia o nome do plano Voyia (vindo do dict) para o slug do PLAN_CATALOG. */
const VOYIA_PLAN_KEYS: Record<string, string> = {
  Starter: 'voyia-starter',
  Profissional: 'voyia-profissional',
  Business: 'voyia-business',
}

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/voyia'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.productsPages.voyia.metadata.title,
    description: dict.productsPages.voyia.metadata.description,
    alternates: {
      canonical: `${origin}/produtos/voyia`,
      languages: buildHreflangAlternates('/produtos/voyia'),
    },
  }
}

export default async function VoyiaPage({ params }: PageProps<'/[lang]/produtos/voyia'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.productsPages.voyia
  const brOnly = lang === 'pt-BR'
  const brNotice = dict.brazilOnlyNotice
  const recaptchaSiteKey = getRecaptchaSiteKey()
  const modalLabels = WHATSAPP_MODAL_LABELS[lang]

  return (
    <main id="main-content" role="main">
      {!brOnly && (
        <BrazilOnlyPricingModal
          storageKey="brazil-only-voyia"
          title={brNotice.modalTitle}
          body={brNotice.modalBody}
          ctaContact={brNotice.ctaContact}
          ctaClose={brNotice.ctaClose}
        />
      )}
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)' }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {t.hero.badge}
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                {t.hero.titlePrefix} <span className="text-green-400">{t.hero.titleHighlight}</span>
              </h1>
              <p className="mt-5 text-xl text-green-300 font-semibold">{t.hero.subtitle}</p>
              <p className="mt-5 text-lg leading-8 text-gray-300">{t.hero.lead}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <WhatsAppCta
                  label={t.hero.ctaPrimary}
                  prefillMessage="Olá! Vi a página do Voyia e quero solicitar uma demonstração."
                  ctaContext="voyia-hero-primary"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-6 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-green-500/20"
                />
                <a href="#planos" className="inline-flex items-center gap-2 border border-gray-600 hover:border-green-400 text-white px-6 py-3.5 rounded-lg font-semibold transition-colors text-base">
                  {t.hero.ctaSecondary}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400">
                {t.hero.bullets.map((b) => (
                  <span key={b} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500/10 to-purple-600/10 rounded-3xl border border-green-500/20 p-1 shadow-2xl">
                <div className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8">
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-800">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-3 text-xs text-gray-500 font-mono">voyia.com.br/inbox</span>
                  </div>
                  <AnimatedChatMock messages={t.hero.mockMessages} inputPlaceholder={t.hero.mockInput} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-green-400 mb-2">{stat.value}</div>
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
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-green-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
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
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.25)] transition-all duration-300">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.howItWorks.heading}</h2>
            <p className="text-lg text-gray-300">{t.howItWorks.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.howItWorks.steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 h-full">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-black font-bold flex items-center justify-center mb-4">{i + 1}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {brOnly ? (
        <>
          {/* Planos (apenas Brasil) */}
          <section id="planos" className="py-24 bg-voyia-dark">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.pricing.heading}</h2>
                <p className="text-lg text-gray-300">{t.pricing.subheading}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {t.pricing.plans.map((plan) => (
                  <div key={plan.name} className={`relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 flex flex-col ${plan.featured ? 'bg-gradient-to-b from-green-500/10 to-voyia-gray border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'bg-voyia-gray border-gray-700'}`}>
                    {plan.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {t.pricing.popularBadge}
                      </span>
                    )}
                    <div className="text-3xl mb-3">{plan.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mb-5 min-h-[2.5rem]">{plan.tagline}</p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-white">{t.pricing.currency} {plan.price}</span>
                      <span className="text-sm text-gray-400">/{t.pricing.priceSuffix}</span>
                    </div>
                    <p className="text-xs text-green-400 font-semibold mb-6">{t.pricing.annualHint} {t.pricing.currency} {plan.annualPrice}/{t.pricing.priceSuffix}</p>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start text-sm text-gray-300">
                          <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {VOYIA_PLAN_KEYS[plan.name] ? (
                      <AsaasCheckoutButton
                        planKey={VOYIA_PLAN_KEYS[plan.name]}
                        planLabel={`${plan.name} — R$ ${plan.price}/mês`}
                        label={t.pricing.ctaLabel}
                        className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${plan.featured ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                      />
                    ) : (
                      <WhatsAppCta
                        label={t.pricing.ctaLabel}
                        prefillMessage={`Olá! Quero contratar o plano ${plan.name} do Voyia.`}
                        ctaContext={`voyia-plan-${plan.name.toLowerCase()}`}
                        locale={lang}
                        recaptchaSiteKey={recaptchaSiteKey}
                        modalLabels={modalLabels}
                        className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${plan.featured ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-10 max-w-3xl mx-auto">{t.pricing.note}</p>
            </div>
          </section>

          {/* Custo de mensagens — apenas Brasil */}
          <section className="py-24 bg-black">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.messageCosts.heading}</h2>
                <p className="text-lg text-gray-300">{t.messageCosts.subheading}</p>
              </div>
              <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/40">
                      <tr>
                        {t.messageCosts.headers.map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {t.messageCosts.rows.map((row) => (
                        <tr key={row.category} className="hover:bg-black/20">
                          <td className="px-4 py-3 text-white font-semibold">{row.category}</td>
                          <td className="px-4 py-3 text-gray-300">{row.initiator}</td>
                          <td className="px-4 py-3 text-gray-300 font-mono">{row.cost}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{row.obs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">{t.messageCosts.note}</p>
            </div>
          </section>

          {/* White-Label para Agências — section separada (apenas Brasil) */}
          <section id="white-label" className="py-24 bg-voyia-dark">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/15 via-voyia-gray to-green-500/10 border border-purple-500/30 p-10 lg:p-14">
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(147,51,234,0.45), transparent 50%)" }} />
                <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                  <div className="lg:col-span-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                      🏷️ Programa exclusivo
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.whiteLabel.heading}</h2>
                    <p className="text-base text-gray-200 leading-relaxed mb-6">{t.whiteLabel.lead}</p>
                    <ul className="space-y-2.5 mb-6">
                      {t.whiteLabel.bullets.map((b) => (
                        <li key={b} className="flex items-start text-sm text-gray-200">
                          <svg className="w-4 h-4 text-purple-300 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-3">
                    <WhatsAppCta
                      label={t.whiteLabel.ctaPrimary}
                      prefillMessage="Olá! Quero saber mais sobre o programa White-Label do Voyia para agências."
                      ctaContext="voyia-white-label-primary"
                      locale={lang}
                      recaptchaSiteKey={recaptchaSiteKey}
                      modalLabels={modalLabels}
                      className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-purple-500/30"
                    />
                    <WhatsAppCta
                      label={t.whiteLabel.ctaSecondary}
                      prefillMessage="Olá! Sou de uma agência e quero conversar sobre o Voyia White-Label."
                      ctaContext="voyia-white-label-secondary"
                      locale={lang}
                      recaptchaSiteKey={recaptchaSiteKey}
                      modalLabels={modalLabels}
                      className="inline-flex items-center justify-center gap-2 border border-gray-500 hover:border-purple-400 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Locales não-BR — sem preço, com banner explicativo */
        <section id="planos" className="py-24 bg-voyia-dark">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-voyia-gray to-voyia-gray p-10 lg:p-14 text-center">
              <span className="text-4xl mb-4 block">🇧🇷</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{brNotice.sectionTitle}</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">{brNotice.sectionBody}</p>
              <WhatsAppCta
                label={brNotice.ctaContact}
                prefillMessage="Olá! Vi a página do Voyia e quero saber mais."
                ctaContext="voyia-br-only"
                locale={lang}
                recaptchaSiteKey={recaptchaSiteKey}
                modalLabels={modalLabels}
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition-colors"
              />
            </div>
          </div>
        </section>
      )}

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
                  <svg className="w-5 h-5 text-green-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-5 text-gray-300 leading-relaxed text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/20 via-voyia-gray to-purple-600/10 border border-green-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(34,197,94,0.4), transparent 50%)' }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.ctaPrimary}
                  prefillMessage={`Olá! Vi a página do Voyia e quero saber mais.`}
                  ctaContext="voyia-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-green-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
