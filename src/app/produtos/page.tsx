import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Produtos - Soluções Prontas e Inovadoras | Agathas Web Brasil',
  description: 'Conheça os produtos inovadores da Agathas Web: Hospedagem Moodle especializada, Hospedagem Gerenciada, Voyia (WhatsApp Cloud API) e SGA (Sistema de Gestão de Alunos).',
  alternates: {
    canonical: 'https://agathasweb.com.br/produtos',
    languages: { 'pt-BR': 'https://agathasweb.com.br/produtos', 'en-US': 'https://agathasweb.com/products', 'es-ES': 'https://agathas.es/productos' }
  }
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-voyia-blue mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const products = [
  {
    title: 'Hospedagem Moodle',
    description: 'Hospedagem especializada e otimizada exclusivamente para plataformas Moodle. Servidores configurados para máxima performance e segurança.',
    features: ['Planos de 500 até +50.000 alunos', 'Backups automáticos diários', 'Monitoramento 24/7', 'Suporte técnico via WhatsApp'],
    href: '/produtos/hospedagem-moodle',
    cta: 'Conheça os Planos',
    image: '/assets/Moodle.webp'
  },
  {
    title: 'Hospedagem Gerenciada',
    description: 'Hospedagem otimizada e segura para sites, sistemas web e e-mails corporativos. Infraestrutura robusta e gerenciamento completo.',
    features: ['Sites institucionais e e-commerce', 'E-mails corporativos ilimitados', 'SSL gratuito (Let\'s Encrypt)', 'Backups e monitoramento contínuo'],
    href: '/produtos/hospedagem-gerenciada',
    cta: 'Ver Detalhes',
    image: '/assets/cloud.webp'
  },
  {
    title: 'Voyia',
    description: 'Plataforma completa de gestão da API Oficial do WhatsApp Cloud API. Automação, multiatendimento e campanhas de marketing em uma única solução.',
    features: ['Disparos em massa de campanhas', 'Chatbot inteligente e automações', 'Sistema de multiatendentes', 'Métricas e relatórios completos'],
    href: '/produtos/voyia',
    cta: 'Conhecer Voyia',
    image: '/assets/voyia.webp'
  },
  {
    title: 'SGA - Sistema de Gestão de Alunos',
    description: 'Sistema web 100% responsivo para gestão inteligente de plataformas Moodle. Automatize processos e melhore o engajamento dos alunos.',
    features: ['Gestão inteligente de cursos', 'Envio automático de credenciais', 'Importação em massa de alunos', 'Relatórios de engajamento automatizados'],
    href: '/produtos/sga',
    cta: 'Descobrir SGA',
    image: '/assets/logo_sga.webp',
    featured: true
  }
]

export default function ProdutosPage() {
  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Nossos <span className="text-voyia-blue">Produtos</span></h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Soluções prontas e inovadoras desenvolvidas com nossa expertise de mais de 15 anos. Acelere seu negócio com produtos que realmente funcionam.</p>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {products.map((product) => (
              <div key={product.title} className={`group rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)] ${product.featured ? 'bg-gradient-to-br from-purple-900/20 via-voyia-gray to-voyia-gray border-purple-500/30' : 'bg-voyia-gray border-gray-700'}`}>
                {product.featured && <div className="mb-4"><span className="bg-voyia-blue/20 text-voyia-blue px-3 py-1 rounded-full text-xs font-semibold">DIFERENCIAL MOODLE</span></div>}
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
