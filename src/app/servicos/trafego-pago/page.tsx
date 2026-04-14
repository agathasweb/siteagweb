import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tráfego Pago - Gestão Profissional de Campanhas | Agathas Web',
  description: 'Gestão profissional de tráfego pago com sistema proprietário de análise e automação. Google Ads, Meta Ads, relatórios automatizados e API de Conversões.',
  alternates: { canonical: 'https://agathasweb.com.br/servicos/trafego-pago' }
}

export default function TrafegoPagoPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/40 rounded-full text-sm font-semibold text-green-300 mb-8">📊 Sistema Proprietário de Gestão</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Tráfego <span className="text-green-400">Pago</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Alta experiência em gestão de tráfego pago com sistema proprietário de análise e automação. Atendemos empresas diretas e agências como gestor terceirizado.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Google Ads', desc: 'Campanhas de pesquisa, display, shopping e YouTube otimizadas para máxima conversão.', icon: '🔍' },
              { title: 'Meta Ads', desc: 'Facebook e Instagram Ads com segmentação avançada e criativos de alta performance.', icon: '📱' },
              { title: 'API de Conversões', desc: 'Integração server-side com CAPI do Facebook para rastreamento preciso e otimização.', icon: '🔌' },
              { title: 'Relatórios Automatizados', desc: 'Dashboards em tempo real com métricas de performance, ROI e custos por aquisição.', icon: '📊' },
              { title: 'Automação de Marketing', desc: 'Workflows automatizados de nutrição de leads integrados com WhatsApp e e-mail.', icon: '🤖' },
              { title: 'Consultoria para Agências', desc: 'Atuamos como gestor terceirizado para agências que precisam de expertise técnica.', icon: '🤝' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(34,197,94,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">🚀 Solicitar Análise Gratuita</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
