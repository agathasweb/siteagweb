import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Artigos sobre Tecnologia, Moodle e Marketing Digital | Agathas Web',
  description: 'Leia artigos sobre desenvolvimento web, Moodle EAD, marketing digital, tráfego pago e tendências de tecnologia no blog da Agathas Web.',
  alternates: { canonical: 'https://agathasweb.com.br/blog' }
}

export default function BlogPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Nosso <span className="text-voyia-blue">Blog</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Artigos, tutoriais e insights sobre tecnologia, Moodle, marketing digital e desenvolvimento web.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-voyia-gray rounded-2xl p-12 border border-gray-700 max-w-2xl mx-auto">
              <span className="text-6xl mb-6 block">📝</span>
              <h2 className="text-2xl font-bold text-white mb-4">Em breve!</h2>
              <p className="text-gray-300">Estamos trabalhando em novos conteúdos incríveis para você. Volte em breve para conferir nossos artigos sobre tecnologia, Moodle e marketing digital.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
