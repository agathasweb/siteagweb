import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

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
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">{t.form.name}</label>
                    <input type="text" id="name" name="name" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder={t.form.namePlaceholder} />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">{t.form.email}</label>
                    <input type="email" id="email" name="email" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder={t.form.emailPlaceholder} />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">{t.form.phone}</label>
                  <input type="tel" id="phone" name="phone" className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder={t.form.phonePlaceholder} />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">{t.form.service}</label>
                  <select id="service" name="service" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent">
                    <option value="">{t.form.servicePlaceholder}</option>
                    <option value="desenvolvimento">{t.form.services.desenvolvimento}</option>
                    <option value="moodle">{t.form.services.moodle}</option>
                    <option value="trafego">{t.form.services.trafego}</option>
                    <option value="consultoria">{t.form.services.consultoria}</option>
                    <option value="hospedagem-moodle">{t.form.services.hospedagemMoodle}</option>
                    <option value="hospedagem-gerenciada">{t.form.services.hospedagemGerenciada}</option>
                    <option value="voyia">{t.form.services.voyia}</option>
                    <option value="outros">{t.form.services.outros}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">{t.form.message}</label>
                  <textarea id="message" name="message" rows={5} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder={t.form.messagePlaceholder} />
                </div>
                <div className="flex items-start space-x-2">
                  <input type="checkbox" id="privacy" name="privacy" required className="mt-1 rounded border-gray-300 text-voyia-blue focus:ring-voyia-blue" />
                  <label htmlFor="privacy" className="text-sm text-gray-300">{t.form.privacy}</label>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-voyia-blue to-purple-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
                  {t.form.submit}
                </button>
                <p className="text-xs text-gray-500 text-center">{t.form.submitNote}</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
