import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Plataforma Moodle - Agathas Web | Especialistas em EAD',
  description: 'Certificação Internacional em Desenvolvimento Moodle. Gestão, temas, plugins, hospedagem gerenciada e sustentação de plataformas educacionais EAD.',
  alternates: { canonical: 'https://agathasweb.com.br/servicos/moodle' }
}

export default function MoodlePage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/40 rounded-full text-sm font-semibold text-orange-300 mb-8">🎓 Certificação Internacional Moodle</span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Plataforma <span className="text-orange-400">Moodle</span></h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Somos especialistas certificados internacionalmente em desenvolvimento Moodle. Gestão completa, desenvolvimento de temas e plugins, novas features e hospedagem otimizada.</p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { title: 'Gestão de Plataformas', desc: 'Administração completa do seu Moodle: atualizações, segurança, performance e suporte técnico especializado.', icon: '⚙️' },
              { title: 'Temas & Plugins', desc: 'Desenvolvimento sob medida de temas responsivos e plugins personalizados para atender suas necessidades.', icon: '🎨' },
              { title: 'Hospedagem Otimizada', desc: 'Servidores configurados exclusivamente para Moodle com máxima performance, backups diários e monitoramento 24/7.', icon: '☁️' },
              { title: 'Integração de Sistemas', desc: 'Conectamos seu Moodle a sistemas de gestão, pagamento, videoconferência e outras ferramentas essenciais.', icon: '🔗' },
              { title: 'Treinamento & Suporte', desc: 'Capacitação para sua equipe e suporte técnico contínuo para garantir o melhor uso da plataforma.', icon: '📚' },
              { title: 'Migração & Atualização', desc: 'Migração segura entre versões e servidores, garantindo zero perda de dados e mínimo downtime.', icon: '🚀' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
              Solicitar Orçamento
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
