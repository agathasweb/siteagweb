import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/blog'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.pages.blog.metadata.title,
    description: dict.pages.blog.metadata.description,
    alternates: {
      canonical: `${origin}/blog`,
      languages: buildHreflangAlternates('/blog'),
    },
  }
}

export default async function BlogPage({ params }: PageProps<'/[lang]/blog'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.pages.blog

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-voyia-gray rounded-2xl p-12 border border-gray-700 max-w-2xl mx-auto">
              <span className="text-6xl mb-6 block">📝</span>
              <h2 className="text-2xl font-bold text-white mb-4">{t.comingSoon.title}</h2>
              <p className="text-gray-300">{t.comingSoon.body}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
