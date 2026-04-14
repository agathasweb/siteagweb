import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Criação de Sites Profissionais e Landing Pages | Agathas Web',
  description: 'Desenvolvimento de sites institucionais, hotsites e landing pages de alta conversão. Design moderno, responsivo e focado em resultados para sua empresa.',
  alternates: { canonical: 'https://agathasweb.com.br/servicos/desenvolvimento-sites' }
}

export default function DesenvolvimentoSitesPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-full text-sm font-semibold text-blue-300 mb-8">✨ Web Design de Alto Impacto</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Desenvolvimento de <span className="text-voyia-blue">Sites</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Criamos experiências digitais que convertem visitantes em clientes. Sites modernos, ultra-rápidos e totalmente otimizados para dispositivos móveis.</p>
        </div>
      </section>

      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Sites Institucionais', desc: 'Sua presença digital com autoridade. Design personalizado que transmite a essência e os valores da sua marca.', icon: '🏢' },
              { title: 'Landing Pages', desc: 'Páginas focadas em conversão para campanhas específicas. Otimizadas para Google Ads e Meta Ads.', icon: '🎯' },
              { title: 'Portais de Conteúdo', desc: 'Estruturas robustas para blogs e portais de notícias com excelente indexação no Google.', icon: '📰' },
              { title: 'Hotsites', desc: 'Sites temporários para lançamentos de produtos, eventos ou promoções sazonais.', icon: '🔥' },
              { title: 'Manutenção & Evolução', desc: 'Suporte contínuo para manter seu site sempre atualizado, seguro e performático.', icon: '🛠️' },
              { title: 'UI/UX Design', desc: 'Foco total na experiência do usuário para garantir navegação intuitiva e fluida.', icon: '🎨' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 bg-gradient-to-r from-voyia-blue/10 to-purple-900/10 border border-voyia-blue/30 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Por que escolher os sites da Agathas Web?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Velocidade', desc: 'Carregamento instantâneo' },
                { label: 'SEO', desc: 'Pronto para o Google' },
                { label: 'Responsivo', desc: 'Perfeito em celulares' },
                { label: 'Seguro', desc: 'Certificado SSL incluso' }
              ].map((feature) => (
                <div key={feature.label}>
                  <div className="text-voyia-blue font-bold text-lg mb-1">{feature.label}</div>
                  <div className="text-gray-400 text-sm">{feature.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
                Quero um site profissional
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
