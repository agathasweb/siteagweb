import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, buildPageMetadata } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/privacidade'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/privacidade',
    title: dict.pages.privacidade.metadata.title,
    description: dict.pages.privacidade.metadata.description,
  })
}

export default async function PrivacidadePage({ params }: PageProps<'/[lang]/privacidade'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.pages.privacidade

  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">{t.title} <span className="text-voyia-blue">{t.titleHighlight}</span></h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
          <p><strong>{t.lastUpdate}</strong> {t.lastUpdateDate}</p>
          <p>{t.intro}</p>
          {t.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-2xl font-bold text-white mt-8">{s.heading}</h2>
              <p>{s.body}</p>
            </div>
          ))}
          <h2 className="text-2xl font-bold text-white mt-8">{t.contactHeading}</h2>
          <p>{t.contactBefore}<a href="mailto:webmaster@agathas.com.br" className="text-voyia-blue hover:text-purple-300">webmaster@agathas.com.br</a>.</p>
        </div>
      </div>
    </main>
  )
}
