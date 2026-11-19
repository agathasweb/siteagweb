import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, buildPageMetadata } from '@/lib/i18n'
import { APPS_PRIVACIDADE } from '@/lib/apps-privacidade'

// Política de privacidade de cada aplicativo publicado nas lojas (endereço exigido pela App Store e pela Google Play).
export async function generateMetadata({ params }: PageProps<'/[lang]/apps/[app]/privacidade'>): Promise<Metadata> {
  const { lang, app } = await params
  const p = APPS_PRIVACIDADE[app]
  if (!isLocale(lang) || !p) return {}
  return buildPageMetadata({
    lang,
    path: `/apps/${app}/privacidade`,
    title: `Política de privacidade do aplicativo ${p.nome}`,
    description: `Como o aplicativo ${p.nome} trata os dados dos alunos: quais dados, para quê, onde ficam e como pedir a exclusão.`,
    noindex: true,
  })
}

export default async function AppPrivacidadePage({ params }: PageProps<'/[lang]/apps/[app]/privacidade'>) {
  const { lang, app } = await params
  const p = APPS_PRIVACIDADE[app]
  if (!isLocale(lang) || !p) notFound()

  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Política de privacidade <span className="text-voyia-blue">{p.nome}</span>
        </h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
          <p><strong>Última atualização:</strong> {p.atualizado}</p>
          {p.secoes.map((s) => (
            <div key={s.titulo}>
              <h2 className="text-2xl font-bold text-white mt-8">{s.titulo}</h2>
              {s.paragrafos.map((t) => (
                <p key={t.slice(0, 40)}>{t}</p>
              ))}
            </div>
          ))}
          <h2 className="text-2xl font-bold text-white mt-8">Contato</h2>
          <p>
            Dúvidas sobre esta política ou sobre os seus dados:{' '}
            <a href={`mailto:${p.contato}`} className="text-voyia-blue hover:text-purple-300">{p.contato}</a>. Instituição:{' '}
            <a href={p.site} rel="noopener" className="text-voyia-blue hover:text-purple-300">{p.site.replace('https://', '')}</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
