import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, buildPageMetadata, type Locale } from '@/lib/i18n'

// Strings adicionais (3 sections novas) inline pra não inflar 4 JSONs.
const STRINGS: Record<Locale, {
  pillars: { heading: string; subheading: string; items: { icon: string; title: string; body: string }[] };
  markets: { heading: string; subheading: string; items: { icon: string; title: string; body: string }[] };
  methodology: { heading: string; subheading: string; steps: { num: string; title: string; body: string }[] };
  commitments: { heading: string; subheading: string; items: { icon: string; title: string; body: string }[] };
}> = {
  'pt-BR': {
    pillars: {
      heading: 'Os pilares que sustentam tudo que entregamos',
      subheading: 'Por que clientes ficam conosco por anos — e indicam.',
      items: [
        { icon: '🎯', title: 'Foco em resultado', body: 'Não vendemos horas, vendemos resolução. Cada projeto começa com o problema de negócio e termina com a métrica que mudou.' },
        { icon: '🔍', title: 'Transparência total', body: 'Acesso ao código desde o dia 1. Sem markup escondido em mensagens, sem cobrança opaca, sem surpresa no fim do mês. Tudo documentado.' },
        { icon: '🔐', title: 'Segurança e LGPD', body: 'Infraestrutura hardening padrão: WAF, backups versionados, criptografia em trânsito e repouso, conformidade LGPD desde o primeiro commit.' },
        { icon: '🤝', title: 'Suporte real em português', body: 'Não é chatbot, não é ticket que some. Atendimento direto com quem desenvolve. SLA contratual em todos os planos.' },
      ],
    },
    markets: {
      heading: 'Setores que dominamos',
      subheading: '15+ anos focados em verticais onde tecnologia faz diferença real.',
      items: [
        { icon: '🎓', title: 'Educação online (EAD)', body: 'Moodle hospedado e customizado, aplicativos próprios, integração com sistemas acadêmicos. Centenas de instituições atendidas no Brasil, Reino Unido e EUA.' },
        { icon: '💬', title: 'Atendimento WhatsApp Empresarial', body: 'API Oficial Meta com nossa plataforma Voyia: sem markup, agentes ilimitados, integração com CRMs e ERPs brasileiros.' },
        { icon: '🏥', title: 'Saúde e farmácia', body: 'Sistemas com filtros regulatórios específicos da área médica — onde começamos em 2010 com sistema de nutrição parenteral.' },
        { icon: '🛒', title: 'E-commerce e SaaS B2B', body: 'Hospedagem gerenciada, performance, otimização de conversão. Tráfego pago alinhado ao funil real do cliente.' },
        { icon: '📊', title: 'Marketing de performance', body: 'Google Ads, Meta Ads e LinkedIn Ads gerenciados internamente. Sem black box: você vê cada otimização e métrica.' },
        { icon: '🌐', title: 'Operação multi-país', body: 'Domínios próprios por mercado, conteúdo localizado, atendimento em 3 idiomas. Mesma equipe, mesma qualidade.' },
      ],
    },
    methodology: {
      heading: 'Como trabalhamos com você',
      subheading: 'Processo claro em 4 etapas — sem orçamento surpresa, sem mudança de escopo silenciosa.',
      steps: [
        { num: '01', title: 'Diagnóstico (gratuito)', body: 'Conversa de 30-60 min pra entender o problema de negócio, não só a solução técnica. Saímos com proposta detalhada por escrito.' },
        { num: '02', title: 'Proposta com escopo fechado', body: 'Preço, prazo, entregáveis e métrica de sucesso definidos antes do contrato. Sem cobrança por hora pra ficar elástico.' },
        { num: '03', title: 'Execução com acesso direto', body: 'Você acompanha em tempo real: acesso a repositório, board de tarefas, ambiente de staging. Comunicação direta com quem desenvolve, sem intermediário.' },
        { num: '04', title: 'Manutenção e evolução', body: 'Contrato mensal opcional com SLA. Ou entrega final + documentação completa pra sua equipe assumir. Você escolhe — sem lock-in.' },
      ],
    },
    commitments: {
      heading: 'O que você pode esperar — sempre',
      subheading: 'Compromissos contratuais, não promessas vagas.',
      items: [
        { icon: '📝', title: 'Contrato claro', body: 'Escopo, preço, prazo e SLA documentados. Sem letrinhas miúdas, sem auto-renovação predatória.' },
        { icon: '🔓', title: 'Você é dono do código', body: 'Repositório no seu nome (GitHub/GitLab). Se a parceria terminar, você mantém tudo funcionando.' },
        { icon: '📈', title: 'Métricas reais', body: 'Reports mensais com o que importa: conversão, performance, uptime. Não vaidade — números acionáveis.' },
        { icon: '⏱', title: 'Resposta em 2h úteis', body: 'WhatsApp e e-mail respondidos no mesmo dia útil. Incidentes críticos em até 30 minutos no plano com SLA.' },
        { icon: '💰', title: 'Sem cobrança escondida', body: 'Preço publicado, taxas de terceiros (Meta, Google, AWS) repassadas sem markup. Auditável.' },
        { icon: '🇧🇷', title: 'Empresa brasileira, fatura BRL', body: 'CNPJ, nota fiscal de serviço, pagamento em real. Sem variação cambial nem complicação tributária.' },
      ],
    },
  },
  es: {
    pillars: {
      heading: 'Los pilares que sostienen todo lo que entregamos',
      subheading: 'Por qué los clientes se quedan con nosotros por años — y nos recomiendan.',
      items: [
        { icon: '🎯', title: 'Foco en resultado', body: 'No vendemos horas, vendemos resolución. Cada proyecto comienza con el problema de negocio y termina con la métrica que cambió.' },
        { icon: '🔍', title: 'Transparencia total', body: 'Acceso al código desde el día 1. Sin markup escondido, sin cobranza opaca, sin sorpresas a fin de mes. Todo documentado.' },
        { icon: '🔐', title: 'Seguridad y LGPD/GDPR', body: 'Infraestructura hardening estándar: WAF, backups versionados, cifrado en tránsito y reposo, conformidad regulatoria desde el primer commit.' },
        { icon: '🤝', title: 'Soporte real en español', body: 'No es chatbot, no es ticket que desaparece. Atención directa con quien desarrolla. SLA contractual en todos los planes.' },
      ],
    },
    markets: {
      heading: 'Sectores que dominamos',
      subheading: '15+ años enfocados en verticales donde la tecnología hace diferencia real.',
      items: [
        { icon: '🎓', title: 'Educación online (LMS)', body: 'Moodle alojado y customizado, apps propios, integración con sistemas académicos. Cientos de instituciones atendidas en España, Brasil, Reino Unido y EE.UU.' },
        { icon: '💬', title: 'Atención WhatsApp Empresarial', body: 'API Oficial Meta con nuestra plataforma Voyia: sin markup, agentes ilimitados, integración con CRMs y ERPs.' },
        { icon: '🏥', title: 'Salud y farmacia', body: 'Sistemas con filtros regulatorios específicos del área médica — donde empezamos en 2010 con sistema de nutrición parenteral.' },
        { icon: '🛒', title: 'E-commerce y SaaS B2B', body: 'Alojamiento gestionado, performance, optimización de conversión. Tráfico pago alineado al embudo real del cliente.' },
        { icon: '📊', title: 'Marketing de performance', body: 'Google Ads, Meta Ads y LinkedIn Ads gestionados internamente. Sin caja negra: ves cada optimización y métrica.' },
        { icon: '🌐', title: 'Operación multi-país', body: 'Dominios propios por mercado, contenido localizado, atención en 3 idiomas. Mismo equipo, misma calidad.' },
      ],
    },
    methodology: {
      heading: 'Cómo trabajamos contigo',
      subheading: 'Proceso claro en 4 etapas — sin presupuesto sorpresa, sin cambio de alcance silencioso.',
      steps: [
        { num: '01', title: 'Diagnóstico (gratis)', body: 'Conversación de 30-60 min para entender el problema de negocio, no sólo la solución técnica. Salimos con propuesta detallada por escrito.' },
        { num: '02', title: 'Propuesta con alcance cerrado', body: 'Precio, plazo, entregables y métrica de éxito definidos antes del contrato. Sin cobranza por hora elástica.' },
        { num: '03', title: 'Ejecución con acceso directo', body: 'Sigues en tiempo real: repositorio, tablero de tareas, entorno staging. Comunicación directa con quien desarrolla.' },
        { num: '04', title: 'Mantenimiento y evolución', body: 'Contrato mensual opcional con SLA. O entrega final + documentación completa para tu equipo asumir. Tú decides — sin lock-in.' },
      ],
    },
    commitments: {
      heading: 'Lo que puedes esperar — siempre',
      subheading: 'Compromisos contractuales, no promesas vagas.',
      items: [
        { icon: '📝', title: 'Contrato claro', body: 'Alcance, precio, plazo y SLA documentados. Sin letra chica, sin auto-renovación predatoria.' },
        { icon: '🔓', title: 'Tú eres dueño del código', body: 'Repositorio a tu nombre (GitHub/GitLab). Si la relación termina, mantienes todo funcionando.' },
        { icon: '📈', title: 'Métricas reales', body: 'Reportes mensuales con lo que importa: conversión, performance, uptime. Números accionables.' },
        { icon: '⏱', title: 'Respuesta en 2h hábiles', body: 'WhatsApp y e-mail respondidos el mismo día. Incidentes críticos en hasta 30 minutos en plan con SLA.' },
        { icon: '💰', title: 'Sin cobranza escondida', body: 'Precio publicado, tarifas de terceros (Meta, Google, AWS) repasadas sin markup. Auditable.' },
        { icon: '🌍', title: 'Operación internacional', body: 'Facturación en EUR/USD/BRL conforme región. Equipo bilingüe, sin complicación cambiaria.' },
      ],
    },
  },
  'en-US': {
    pillars: {
      heading: 'The pillars that support everything we deliver',
      subheading: 'Why clients stay with us for years — and refer.',
      items: [
        { icon: '🎯', title: 'Outcome-focused', body: "We don't sell hours, we sell resolution. Every project starts with the business problem and ends with the metric that moved." },
        { icon: '🔍', title: 'Full transparency', body: 'Code access from day 1. No hidden markup, no opaque billing, no end-of-month surprises. Everything documented.' },
        { icon: '🔐', title: 'Security and compliance', body: 'Standard hardening: WAF, versioned backups, encryption in transit and at rest, GDPR/LGPD compliant from first commit.' },
        { icon: '🤝', title: 'Real support', body: "Not a chatbot, not a ticket that vanishes. Direct contact with whoever's developing. Contractual SLA on every plan." },
      ],
    },
    markets: {
      heading: 'Sectors we dominate',
      subheading: '15+ years focused on verticals where technology makes a real difference.',
      items: [
        { icon: '🎓', title: 'Online education (LMS)', body: 'Hosted and customized Moodle, custom apps, integration with academic systems. Hundreds of institutions served across the US, Brazil, UK and Europe.' },
        { icon: '💬', title: 'WhatsApp Business support', body: 'Meta Official API with our Voyia platform: no markup, unlimited agents, integration with CRMs and ERPs.' },
        { icon: '🏥', title: 'Healthcare and pharmacy', body: 'Systems with regulation-specific filters — where we started in 2010 with a parenteral nutrition system.' },
        { icon: '🛒', title: 'E-commerce and B2B SaaS', body: 'Managed hosting, performance, conversion optimization. Paid traffic aligned with the real customer funnel.' },
        { icon: '📊', title: 'Performance marketing', body: 'Google Ads, Meta Ads and LinkedIn Ads managed in-house. No black box: you see every optimization and metric.' },
        { icon: '🌐', title: 'Multi-country operation', body: 'Dedicated domains per market, localized content, support in 3 languages. Same team, same quality.' },
      ],
    },
    methodology: {
      heading: 'How we work with you',
      subheading: 'Clear 4-step process — no surprise budgets, no silent scope changes.',
      steps: [
        { num: '01', title: 'Diagnostic (free)', body: '30-60 min conversation to understand the business problem, not just the technical solution. We leave with a detailed written proposal.' },
        { num: '02', title: 'Fixed-scope proposal', body: 'Price, deadline, deliverables and success metric defined before the contract. No elastic hourly billing.' },
        { num: '03', title: 'Execution with direct access', body: 'You follow in real time: repository, task board, staging environment. Direct communication with developers.' },
        { num: '04', title: 'Maintenance and evolution', body: 'Optional monthly contract with SLA. Or final delivery + full documentation for your team to take over. Your call — zero lock-in.' },
      ],
    },
    commitments: {
      heading: 'What you can expect — always',
      subheading: 'Contractual commitments, not vague promises.',
      items: [
        { icon: '📝', title: 'Clear contract', body: 'Scope, price, deadline and SLA documented. No fine print, no predatory auto-renewal.' },
        { icon: '🔓', title: 'You own the code', body: 'Repository in your name (GitHub/GitLab). If the partnership ends, you keep everything running.' },
        { icon: '📈', title: 'Real metrics', body: 'Monthly reports with what matters: conversion, performance, uptime. Actionable numbers.' },
        { icon: '⏱', title: 'Reply in 2 business hours', body: 'WhatsApp and email replied within the same business day. Critical incidents within 30 minutes on SLA plans.' },
        { icon: '💰', title: 'No hidden fees', body: 'Published pricing, third-party fees (Meta, Google, AWS) passed through without markup. Auditable.' },
        { icon: '🌍', title: 'International operation', body: 'Billing in USD/EUR/BRL by region. Bilingual team, no currency headaches.' },
      ],
    },
  },
  'en-GB': {
    pillars: {
      heading: 'The pillars that support everything we deliver',
      subheading: 'Why clients stay with us for years — and refer.',
      items: [
        { icon: '🎯', title: 'Outcome-focused', body: "We don't sell hours, we sell resolution. Every project starts with the business problem and ends with the metric that moved." },
        { icon: '🔍', title: 'Full transparency', body: 'Code access from day 1. No hidden markup, no opaque billing, no end-of-month surprises. Everything documented.' },
        { icon: '🔐', title: 'Security and compliance', body: 'Standard hardening: WAF, versioned backups, encryption in transit and at rest, GDPR compliant from first commit.' },
        { icon: '🤝', title: 'Real support', body: "Not a chatbot, not a ticket that vanishes. Direct contact with whoever's developing. Contractual SLA on every plan." },
      ],
    },
    markets: {
      heading: 'Sectors we dominate',
      subheading: '15+ years focused on verticals where technology makes a real difference.',
      items: [
        { icon: '🎓', title: 'Online education (LMS)', body: 'Hosted and customised Moodle, custom apps, integration with academic systems. Hundreds of institutions served across the UK, Brazil, the US and Europe.' },
        { icon: '💬', title: 'WhatsApp Business support', body: 'Meta Official API with our Voyia platform: no markup, unlimited agents, integration with CRMs and ERPs.' },
        { icon: '🏥', title: 'Healthcare and pharmacy', body: 'Systems with regulation-specific filters — where we started in 2010 with a parenteral nutrition system.' },
        { icon: '🛒', title: 'E-commerce and B2B SaaS', body: 'Managed hosting, performance, conversion optimisation. Paid traffic aligned with the real customer funnel.' },
        { icon: '📊', title: 'Performance marketing', body: 'Google Ads, Meta Ads and LinkedIn Ads managed in-house. No black box: you see every optimisation and metric.' },
        { icon: '🌐', title: 'Multi-country operation', body: 'Dedicated domains per market, localised content, support in 3 languages. Same team, same quality.' },
      ],
    },
    methodology: {
      heading: 'How we work with you',
      subheading: 'Clear 4-step process — no surprise budgets, no silent scope changes.',
      steps: [
        { num: '01', title: 'Diagnostic (free)', body: '30-60 min conversation to understand the business problem, not just the technical solution. We leave with a detailed written proposal.' },
        { num: '02', title: 'Fixed-scope proposal', body: 'Price, deadline, deliverables and success metric defined before the contract. No elastic hourly billing.' },
        { num: '03', title: 'Execution with direct access', body: 'You follow in real time: repository, task board, staging environment. Direct communication with developers.' },
        { num: '04', title: 'Maintenance and evolution', body: 'Optional monthly contract with SLA. Or final delivery + full documentation for your team to take over. Your call — zero lock-in.' },
      ],
    },
    commitments: {
      heading: 'What you can expect — always',
      subheading: 'Contractual commitments, not vague promises.',
      items: [
        { icon: '📝', title: 'Clear contract', body: 'Scope, price, deadline and SLA documented. No fine print, no predatory auto-renewal.' },
        { icon: '🔓', title: 'You own the code', body: 'Repository in your name (GitHub/GitLab). If the partnership ends, you keep everything running.' },
        { icon: '📈', title: 'Real metrics', body: 'Monthly reports with what matters: conversion, performance, uptime. Actionable numbers.' },
        { icon: '⏱', title: 'Reply in 2 business hours', body: 'WhatsApp and email replied within the same business day. Critical incidents within 30 minutes on SLA plans.' },
        { icon: '💰', title: 'No hidden fees', body: 'Published pricing, third-party fees (Meta, Google, AWS) passed through without markup. Auditable.' },
        { icon: '🌍', title: 'International operation', body: 'Billing in GBP/EUR/BRL by region. Bilingual team, no currency headaches.' },
      ],
    },
  },
}

export async function generateMetadata({ params }: PageProps<'/[lang]/quem-somos'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/quem-somos',
    title: dict.pages.quemSomos.metadata.title,
    description: dict.pages.quemSomos.metadata.description,
  })
}

const TIMELINE_COLORS = ['bg-voyia-blue', 'bg-purple-600', 'bg-voyia-blue', 'bg-purple-600', 'bg-voyia-blue', 'bg-purple-600', 'bg-gradient-to-r from-voyia-blue to-purple-600']

export default async function QuemSomosPage({ params }: PageProps<'/[lang]/quem-somos'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.pages.quemSomos
  const s = STRINGS[lang]
  const timeline = t.timeline.items.map((item, i) => ({ ...item, color: TIMELINE_COLORS[i] ?? 'bg-voyia-blue' }))

  return (
    <main id="main-content" role="main">
      {/* Hero + Stats + Story */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">{t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span></h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {t.stats.map((stat) => (
              <div key={stat.label} className="bg-voyia-gray/50 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-voyia-blue mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-voyia-blue/10 to-purple-900/10 border border-voyia-blue/30 rounded-2xl p-8 md:p-12">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                {t.story.paragraph1Before}<strong className="text-voyia-blue">{t.story.paragraph1Brand}</strong>{t.story.paragraph1Middle}<strong className="text-white">{t.story.paragraph1Date}</strong>{t.story.paragraph1After}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t.story.paragraph2Before}<strong className="text-white">{t.story.paragraph2Emphasis}</strong>{t.story.paragraph2After}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-voyia-dark overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.timeline.heading}</h2>
            <p className="text-lg text-gray-400">{t.timeline.subheading}</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-voyia-blue via-purple-500 to-voyia-blue/30 rounded-full" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={item.year} className="relative flex flex-col md:flex-row items-center justify-between group">
                  {i % 2 === 0 ? (
                    <>
                      <div className="w-full md:w-[45%] mb-8 md:mb-0 pr-0 md:pr-8 pl-16 md:pl-0 text-left md:text-right">
                        <div className={`rounded-xl p-6 border shadow-lg relative ${item.featured ? 'bg-gradient-to-r from-voyia-blue/20 to-purple-600/20 border-voyia-blue/50' : 'bg-voyia-gray border-gray-700 hover:border-voyia-blue/50'} transition-colors`}>
                          <span className={`md:hidden absolute -left-[42px] top-6 w-4 h-4 rounded-full ${item.color} border-2 border-voyia-dark ${item.featured ? 'animate-pulse' : ''}`} />
                          <h3 className={`text-xl font-bold mb-2 ${item.featured ? 'text-voyia-blue' : 'text-white'}`}>{item.title}</h3>
                          <p className="text-gray-300 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 ${item.featured ? 'w-14 h-14' : 'w-12 h-12'} ${item.color} rounded-full items-center justify-center text-white font-bold text-sm border-4 border-voyia-dark z-10 shadow-xl group-hover:scale-110 transition-transform ${item.featured ? 'animate-pulse text-xs' : ''}`}>{item.year}</div>
                      <div className="w-full md:w-[45%]" />
                    </>
                  ) : (
                    <>
                      <div className="w-full md:w-[45%] order-2 md:order-1" />
                      <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 ${item.color} rounded-full items-center justify-center text-white font-bold text-sm border-4 border-voyia-dark z-10 shadow-xl group-hover:scale-110 transition-transform`}>{item.year}</div>
                      <div className="w-full md:w-[45%] order-1 md:order-2 mb-8 md:mb-0 pl-16 md:pl-8 text-left">
                        <div className="bg-voyia-gray rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors shadow-lg relative">
                          <span className={`md:hidden absolute -left-[42px] top-6 w-4 h-4 rounded-full ${item.color} border-2 border-voyia-dark`} />
                          <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                          <p className="text-gray-300 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{s.pillars.heading}</h2>
            <p className="text-lg text-gray-300">{s.pillars.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {s.pillars.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 transition-colors">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mercados */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{s.markets.heading}</h2>
            <p className="text-lg text-gray-300">{s.markets.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {s.markets.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(147,51,234,0.25)] transition-all duration-300">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{s.methodology.heading}</h2>
            <p className="text-lg text-gray-300">{s.methodology.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {s.methodology.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 relative">
                <span className="text-4xl font-bold text-voyia-blue/40 absolute top-4 right-5">{step.num}</span>
                <h3 className="text-lg font-semibold text-white mb-3 pr-12">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compromissos */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{s.commitments.heading}</h2>
            <p className="text-lg text-gray-300">{s.commitments.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {s.commitments.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-xl p-5 border border-gray-700 flex items-start gap-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
