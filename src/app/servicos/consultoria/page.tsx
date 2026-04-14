import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Consultoria Digital - CTO as a Service | Agathas Web',
  description: 'Consultoria especializada em tecnologia com atuação como CTO em empresas do Brasil e exterior. Transformamos estratégias em resultados concretos.',
  alternates: { canonical: 'https://agathasweb.com.br/servicos/consultoria' }
}

export default function ConsultoriaPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/40 rounded-full text-sm font-semibold text-purple-300 mb-8">💡 CTO as a Service</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Consultoria <span className="text-voyia-blue">Digital</span></h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Consultoria especializada em tecnologia com atuação como CTO em empresas do Brasil e exterior. Transformamos estratégias em resultados concretos.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'CTO as a Service', desc: 'Liderança técnica para sua empresa sem o custo de um CTO em tempo integral.', icon: '👨‍💼' },
              { title: 'Arquitetura de Sistemas', desc: 'Desenho de arquiteturas escaláveis, seguras e performáticas para seu negócio.', icon: '🏗️' },
              { title: 'Consultoria Moodle', desc: 'Orientação estratégica para implementação e otimização de plataformas EAD.', icon: '🎓' },
              { title: 'Estratégia Digital', desc: 'Planejamento de presença digital, marketing e transformação tecnológica.', icon: '🎯' },
              { title: 'Auditoria de Performance', desc: 'Análise completa de infraestrutura, código e processos para otimização.', icon: '🔍' },
              { title: 'Mentoria Técnica', desc: 'Acompanhamento e capacitação de equipes de desenvolvimento internas.', icon: '🧑‍🏫' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">Agendar Consultoria Gratuita</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
