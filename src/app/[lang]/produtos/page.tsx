import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, buildPageMetadata } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/produtos',
    title: dict.productsPages.index.metadata.title,
    description: dict.productsPages.index.metadata.description,
  })
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-voyia-blue mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

export default async function ProdutosPage({ params }: PageProps<'/[lang]/produtos'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.productsPages.index

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span></h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {t.items.map((product) => (
              <div key={product.title} className={`group rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)] ${product.featured ? 'bg-gradient-to-br from-purple-900/20 via-voyia-gray to-voyia-gray border-purple-500/30' : 'bg-voyia-gray border-gray-700'}`}>
                {product.featured && <div className="mb-4"><span className="bg-voyia-blue/20 text-voyia-blue px-3 py-1 rounded-full text-xs font-semibold">{t.featuredBadge}</span></div>}
                <div className="mb-6 flex justify-center">
                  <Image src={product.image} alt={product.title} width={300} height={100} className="h-24 w-auto object-contain" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 text-center">{product.title}</h3>
                <p className="text-gray-300 mb-6 leading-relaxed text-center">{product.description}</p>
                <ul className="space-y-2 mb-8">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start"><CheckIcon /><span className="text-gray-300">{f}</span></li>
                  ))}
                </ul>
                <Link href={product.href} className="inline-flex items-center justify-center w-full bg-voyia-blue hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  {product.cta}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
