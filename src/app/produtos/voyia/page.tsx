import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Voyia - Gestão WhatsApp Cloud API | Agathas Web',
  description: 'Plataforma completa de gestão da API Oficial do WhatsApp Cloud API. Disparos em massa, multiatendimento, chatbot e relatórios em uma única solução.',
  alternates: { canonical: 'https://agathasweb.com.br/produtos/voyia' }
}

export default function VoyiaPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl"><span className="text-green-400">Voyia</span></h1>
          <p className="mt-4 text-xl text-green-300 font-semibold">Gestão WhatsApp Cloud API</p>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Plataforma empresarial para gestão da API Oficial do WhatsApp. Disparos em massa, multiatendimento, chatbot inteligente e métricas completas.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Disparos em Massa', desc: 'Envie campanhas de marketing para milhares de contatos com templates aprovados pela Meta.', icon: '📨' },
              { title: 'Multiatendimento', desc: 'Múltiplos atendentes em um único número com filas, transferências e métricas individuais.', icon: '👥' },
              { title: 'Chatbot Inteligente', desc: 'Automação de respostas, fluxos de atendimento e qualificação automática de leads.', icon: '🤖' },
              { title: 'CRM Integrado', desc: 'Gestão de contatos, tags, notas e histórico completo de conversas.', icon: '📋' },
              { title: 'Relatórios & Métricas', desc: 'Dashboards completos com taxas de entrega, leitura, resposta e performance da equipe.', icon: '📊' },
              { title: 'API & Webhooks', desc: 'Integração com seus sistemas via API REST e webhooks para automação total.', icon: '🔗' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(34,197,94,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">Conhecer Voyia</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
