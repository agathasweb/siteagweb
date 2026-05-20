import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import RecaptchaProvider from '@/components/RecaptchaProvider'
import ContactForm from './ContactForm'

export async function generateMetadata({ params }: PageProps<'/[lang]/contato'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.pages.contato.metadata.title,
    description: dict.pages.contato.metadata.description,
    alternates: {
      canonical: `${origin}/contato`,
      languages: buildHreflangAlternates('/contato'),
    },
  }
}

export default async function ContatoPage({ params }: PageProps<'/[lang]/contato'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.pages.contato
  const recaptchaSiteKey = getRecaptchaSiteKey()
  const infoItems = [
    { icon: '📍', title: t.info.address.title, lines: t.info.address.lines },
    { icon: '📱', title: t.info.whatsapp.title, lines: t.info.whatsapp.lines },
    { icon: '📧', title: t.info.email.title, lines: t.info.email.lines },
    { icon: '🕐', title: t.info.hours.title, lines: t.info.hours.lines },
  ]

  return (
    <main id="main-content" role="main">
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-voyia-blue to-voyia-blue bg-clip-text text-transparent">{t.hero.title}</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-8 text-white">{t.info.heading}</h2>
              <div className="space-y-6">
                {infoItems.map((info) => (
                  <div key={info.title} className="flex items-start">
                    <span className="text-2xl mr-4 mt-1">{info.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
                      {info.lines.map((line) => <p key={line} className="text-gray-300">{line}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-voyia-gray rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-white">{t.form.heading}</h2>
              <RecaptchaProvider siteKey={recaptchaSiteKey} />
              <ContactForm t={t.form} locale={lang} recaptchaSiteKey={recaptchaSiteKey} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
