import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SGA - Sistema de Gestão de Alunos Moodle | Agathas Web',
  description: 'Sistema web responsivo para gestão inteligente de plataformas Moodle. Importação em massa, envio de credenciais, relatórios de engajamento automatizados.',
  alternates: { canonical: 'https://agathasweb.com.br/produtos/sga' }
}

export default function SGAPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="bg-voyia-blue/20 text-voyia-blue px-4 py-2 rounded-full text-sm font-semibold mb-8 inline-block">DIFERENCIAL MOODLE</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl"><span className="text-voyia-blue">SGA</span> - Sistema de Gestão de Alunos</h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Sistema web 100% responsivo para gestão inteligente de plataformas Moodle. Automatize processos e melhore o engajamento dos alunos.</p>
        </div>
      </section>
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Gestão de Cursos', desc: 'Organize e gerencie cursos, turmas e períodos letivos de forma intuitiva.', icon: '📚' },
              { title: 'Importação em Massa', desc: 'Importe milhares de alunos via planilha com criação automática de contas Moodle.', icon: '📥' },
              { title: 'Credenciais Automáticas', desc: 'Envio automático de login e senha por e-mail e WhatsApp para os alunos.', icon: '🔑' },
              { title: 'Relatórios de Engajamento', desc: 'Dashboards automatizados com métricas de acesso, progresso e conclusão.', icon: '📊' },
              { title: 'Multi-instância', desc: 'Gerencie múltiplas plataformas Moodle a partir de um único painel centralizado.', icon: '🔗' },
              { title: 'API Moodle Integrada', desc: 'Conexão direta com a API do Moodle para sincronização em tempo real.', icon: '⚡' }
            ].map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/contato" className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">Solicitar Demonstração</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
