import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Serviços - Agathas Web Brasil | Desenvolvimento, Moodle, Tráfego Pago e Consultoria',
  description: 'Conheça os serviços da Agathas Web: Desenvolvimento Web sob medida, Plataformas Moodle EAD, Gestão de Tráfego Pago e Consultoria Digital especializada. Mais de 15 anos de experiência transformando negócios brasileiros.',
  alternates: {
    canonical: 'https://agathasweb.com.br/servicos',
    languages: { 'pt-BR': 'https://agathasweb.com.br/servicos', 'en-US': 'https://agathasweb.com/services', 'es-ES': 'https://agathas.es/servicios' }
  }
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-voyia-blue mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const services = [
  {
    title: 'Plataforma Moodle',
    description: 'Certificação Internacional em Desenvolvimento Moodle. Especialistas em gestão, desenvolvimento de temas e plugins, novas features e hospedagem gerenciada para plataformas educacionais.',
    features: ['Gestão de Plataformas Moodle', 'Desenvolvimento de Temas e Plugins', 'Hospedagem Gerenciada Especializada'],
    href: '/servicos/moodle',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    title: 'Tráfego Pago',
    description: 'Alta experiência em gestão de tráfego pago com sistema proprietário de análise e automação. Atendemos empresas diretas e agências de publicidade como gestor terceirizado.',
    features: ['Sistema Proprietário de Gestão', 'Relatórios e Análises Automatizadas', 'Integração com API de Conversões'],
    href: '/servicos/trafego-pago',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    title: 'Desenvolvimento',
    description: 'Desenvolvimento sob medida de soluções digitais completas. De sites institucionais a sistemas empresariais complexos, criamos produtos que realmente funcionam.',
    features: ['ERPs e Sistemas Web Personalizados', 'Aplicativos Mobile (iOS e Android)', 'E-Commerce e Landing Pages'],
    href: '/servicos/desenvolvimento',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    title: 'Consultoria Digital',
    description: 'Consultoria especializada em tecnologia com atuação como CTO em empresas do Brasil e exterior. Transformamos estratégias em resultados concretos.',
    features: ['CTO as a Service', 'Consultoria em Moodle e Desenvolvimento', 'Estratégias de Tráfego Pago'],
    href: '/servicos/consultoria',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
]

export default function ServicosPage() {
  return (
    <main id="main-content" role="main">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Nossos <span className="text-voyia-blue">Serviços</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">
              Soluções completas e personalizadas para impulsionar seu negócio no mundo digital. 
              Mais de 15 anos de experiência transformando ideias em resultados reais.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 sm:py-32 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.title} className="group bg-voyia-gray rounded-2xl p-8 border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)]">
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[5deg]">
                  <div className="w-16 h-16 bg-voyia-blue rounded-lg flex items-center justify-center">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={service.href} className="inline-flex items-center justify-center w-full bg-voyia-blue hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Saiba mais
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Serviços Digitais",
        "provider": { "@type": "Organization", "name": "Agathas Web Brasil", "url": "https://agathasweb.com.br" },
        "areaServed": { "@type": "Country", "name": "Brasil" },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Catálogo de Serviços Agathas Web",
          "itemListElement": services.map(s => ({
            "@type": "Offer",
            "itemOffered": { "@type": "Service", "name": s.title, "description": s.description }
          }))
        }
      })}} />
    </main>
  )
}
