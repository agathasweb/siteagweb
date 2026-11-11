import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../../dictionaries'
import { isLocale, buildPageMetadata } from '@/lib/i18n'
import WhatsAppCta from '@/components/whatsapp/WhatsAppCta'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import { WHATSAPP_MODAL_LABELS } from '@/lib/whatsapp-modal-labels'
import JsonLd from '@/components/JsonLd'
import { pageSchemas } from '@/lib/structured-data'

/**
 * SaveMind World — jogo educativo de blocos (repo ~/DDEV/savemind-world).
 * Está em fase piloto: sem preço, o contato é a lista de interesse pelo WhatsApp.
 * Textos em productsPages.savemind (4 idiomas).
 */

const PATH = '/produtos/savemind-world'

const CHECK = 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'

/** Mesmo cubo de grama do ícone do jogo (apps/game/icon.svg). */
function Cubo({ className }: { className?: string }) {
  return (
    <svg viewBox="24 22 80 86" className={className} aria-hidden="true">
      <polygon points="64,22 104,44 64,66 24,44" fill="#6cc04a" />
      <polygon points="24,44 64,66 64,108 24,86" fill="#8c6239" />
      <polygon points="104,44 64,66 64,108 104,86" fill="#6b4a2b" />
      <circle cx="64" cy="44" r="9" fill="#fff6c8" />
    </svg>
  )
}

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/savemind-world'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: PATH,
    title: dict.productsPages.savemind.metadata.title,
    description: dict.productsPages.savemind.metadata.description,
  })
}

export default async function SaveMindWorldPage({ params }: PageProps<'/[lang]/produtos/savemind-world'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.productsPages.savemind
  const recaptchaSiteKey = getRecaptchaSiteKey()
  const modalLabels = WHATSAPP_MODAL_LABELS[lang]

  const cta = (label: string, prefill: string, context: string, className: string) => (
    <WhatsAppCta
      label={label}
      prefillMessage={prefill}
      ctaContext={context}
      locale={lang}
      recaptchaSiteKey={recaptchaSiteKey}
      modalLabels={modalLabels}
      className={className}
    />
  )
  const btnPrimario = 'inline-flex items-center gap-2 bg-[#6cc04a] hover:bg-[#82d45f] text-[#10240a] px-6 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-[#6cc04a]/20'

  return (
    <main id="main-content" role="main">
      <JsonLd
        data={pageSchemas({
          lang,
          path: PATH,
          title: t.metadata.title,
          description: t.metadata.description,
          kind: 'SoftwareApplication',
          faq: t.faq.items,
        })}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/40 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(95,176,240,0.35), transparent 40%), radial-gradient(circle at 85% 70%, rgba(108,192,74,0.25), transparent 45%)' }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#6cc04a]/10 border border-[#6cc04a]/40 text-[#a6e38a] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-[#6cc04a] animate-pulse" />
                {t.hero.badge}
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                {t.hero.titlePrefix} <span className="text-[#6cc04a]">{t.hero.titleHighlight}</span>
              </h1>
              <p className="mt-5 text-xl text-sky-300 font-semibold">{t.hero.subtitle}</p>
              <p className="mt-5 text-lg leading-8 text-gray-300">{t.hero.lead}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                {cta(t.hero.ctaPrimary, t.hero.prefill, 'savemind-hero', btnPrimario)}
                <a href="#funcionalidades" className="inline-flex items-center gap-2 border border-gray-600 hover:border-[#6cc04a] text-white px-6 py-3.5 rounded-lg font-semibold transition-colors text-base">
                  {t.hero.ctaSecondary}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400">
                {t.hero.bullets.map((b) => (
                  <span key={b} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#6cc04a]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d={CHECK} clipRule="evenodd" /></svg>
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
              <div className="aspect-square rounded-[2.5rem] bg-gradient-to-b from-[#5fb0f0] to-[#3a7fc0] p-10 shadow-2xl shadow-sky-500/20 flex items-center justify-center">
                <Cubo className="w-3/4 drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)] motion-safe:animate-[bounce_4s_ease-in-out_infinite]" />
              </div>
              <div className="absolute -left-4 top-8 rounded-xl bg-white text-[#1f3a5c] px-4 py-2 text-sm font-bold shadow-xl rotate-[-4deg]">{t.hero.floatTips[0]}</div>
              <div className="absolute -right-3 top-1/2 rounded-xl bg-[#fff6c8] text-[#5a4210] px-4 py-2 text-sm font-semibold shadow-xl rotate-[3deg]">{t.hero.floatTips[1]}</div>
              <div className="absolute left-6 -bottom-4 rounded-xl bg-[#10240a] border border-[#6cc04a]/50 text-[#a6e38a] px-4 py-2 text-sm font-semibold shadow-xl">{t.hero.floatTips[2]}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-[#6cc04a] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.advantages.heading}</h2>
            <p className="text-lg text-gray-300">{t.advantages.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.advantages.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-[#6cc04a]/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#6cc04a]/10 border border-[#6cc04a]/30 flex items-center justify-center mb-4 text-2xl" aria-hidden="true">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24 bg-voyia-dark scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.features.heading}</h2>
            <p className="text-lg text-gray-300">{t.features.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(95,176,240,0.3)] transition-all duration-300">
                <span className="text-3xl mb-4 block" aria-hidden="true">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Painel dos pais */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.parents.heading}</h2>
            <p className="text-lg text-gray-300 mb-8">{t.parents.subheading}</p>
            <ul className="space-y-3">
              {t.parents.items.map((f) => (
                <li key={f} className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-[#6cc04a] mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d={CHECK} clipRule="evenodd" /></svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure className="bg-voyia-gray rounded-3xl border border-gray-700 p-6 lg:p-8 shadow-2xl">
            <figcaption className="text-xs uppercase tracking-wider text-gray-500 mb-5">{t.parents.mockTitle}</figcaption>
            <div className="rounded-2xl bg-black/40 border border-gray-800 p-5 mb-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm text-gray-400">{t.parents.mockToday}</span>
                <span className="text-lg font-bold text-white">{t.parents.mockTime}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6cc04a] to-[#5fb0f0]" style={{ width: '70%' }} />
              </div>
            </div>
            <div className="space-y-4 mb-5">
              {t.parents.mockSubjects.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-300">{s.name}</span>
                    <span className="font-semibold text-white">{s.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-[#6cc04a]" style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#6cc04a]/10 border border-[#6cc04a]/30 px-5 py-4">
              <span className="text-sm text-gray-300">{t.parents.mockMissions}</span>
              <span className="font-bold text-[#a6e38a]">{t.parents.mockMissionsValue}</span>
            </div>
          </figure>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.howItWorks.heading}</h2>
            <p className="text-lg text-gray-300">{t.howItWorks.subheading}</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.howItWorks.steps.map((step, i) => (
              <li key={step.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-[#6cc04a] text-[#10240a] font-bold flex items-center justify-center mb-4">{i + 1}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-12 text-center">{t.audience.heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.audience.items.map((a) => (
              <div key={a.title} className="rounded-2xl p-7 border border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-transparent text-center">
                <span className="text-4xl block mb-4" aria-hidden="true">{a.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Piloto */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-3xl border border-[#6cc04a]/40 bg-gradient-to-br from-[#6cc04a]/10 via-voyia-gray to-voyia-gray p-10 lg:p-14 text-center">
            <Cubo className="w-16 mx-auto mb-6" />
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{t.pilot.heading}</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">{t.pilot.body}</p>
            {cta(t.pilot.cta, t.pilot.prefill, 'savemind-piloto', btnPrimario)}
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section className="py-24 bg-black">
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
                  <svg className="w-5 h-5 text-[#6cc04a] transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-5 text-gray-300 leading-relaxed text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/20 via-voyia-gray to-[#6cc04a]/10 border border-sky-500/30 p-10 lg:p-16 text-center">
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                {cta(t.finalCta.ctaPrimary, t.finalCta.prefill, 'savemind-final', btnPrimario)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
