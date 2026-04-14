import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hospedagem Gerenciada - Sites, Sistemas e E-mails | Agathas Web',
  description: 'Hospedagem otimizada e segura para sites, sistemas web e e-mails corporativos. SSL gratuito, backups automáticos e monitoramento contínuo.',
  alternates: { canonical: 'https://agathasweb.com.br/produtos/hospedagem-gerenciada' }
}

export default function HospedagemGerenciadaPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Hospedagem <span className="text-cyan-400">Gerenciada</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Infraestrutura robusta e gerenciamento completo para seus sites, sistemas web e e-mails corporativos. Foque no seu negócio enquanto cuidamos da tecnologia.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Sites & E-commerce', desc: 'Hospedagem otimizada para WordPress, Laravel, Next.js e qualquer tecnologia web.', icon: '🌐' },
              { title: 'E-mails Corporativos', desc: 'E-mails ilimitados com seu domínio, antispam avançado e compatibilidade total.', icon: '📧' },
              { title: 'SSL Gratuito', desc: 'Certificados Let\'s Encrypt renovados automaticamente para todos os domínios.', icon: '🔒' },
              { title: 'Backups Diários', desc: 'Backups automáticos com retenção de 30 dias e restauração em minutos.', icon: '💾' },
              { title: 'CDN & Performance', desc: 'Distribuição global de conteúdo para carregamento ultra-rápido em qualquer lugar.', icon: '⚡' },
              { title: 'Suporte Especializado', desc: 'Equipe técnica disponível via WhatsApp para resolver qualquer questão rapidamente.', icon: '🛟' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">Solicitar Orçamento</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
