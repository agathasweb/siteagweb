import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  type Locale,
} from "@/lib/i18n";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

// i18n inline — conteúdo rico em 4 idiomas sem inflar JSON dicts.
const STRINGS: Record<Locale, {
  hero: { badge: string; titleLine1: string; titleLine2: string; lead: string; ctaQuote: string; ctaWa: string };
  stats: { value: string; label: string }[];
  areasTitle: string;
  areasLead: string;
  areas: { icon: string; title: string; desc: string }[];
  stack: { heading: string; subheading: string; groups: { label: string; items: string[] }[] };
  process: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[] };
  why: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  cases: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; ctaPrimary: string; ctaSecondary: string };
  prefill: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🚀 Engenharia sob medida há 15+ anos",
      titleLine1: "Desenvolvimento",
      titleLine2: "de Software sob Medida",
      lead: "ERPs, SaaS, apps mobile, sistemas web complexos e integrações. Arquitetura escalável, código próprio, zero lock-in — entregue por uma equipe que opera em produção há mais de uma década.",
      ctaQuote: "Solicitar orçamento",
      ctaWa: "Falar no WhatsApp",
    },
    stats: [
      { value: "15+", label: "Anos de operação" },
      { value: "500+", label: "Projetos entregues" },
      { value: "5.0⭐", label: "Avaliação Google" },
      { value: "100%", label: "Código entregue" },
    ],
    areasTitle: "O que desenvolvemos",
    areasLead: "Cobertura full-stack: do back-end de alta carga ao app mobile na loja, do CRM interno à integração com ERP corporativo.",
    areas: [
      { icon: "🏢", title: "ERPs & sistemas empresariais", desc: "ERPs sob medida, CRMs, dashboards, BI, fluxos de aprovação, gestão financeira, RH, estoque e operações." },
      { icon: "🌐", title: "Sistemas web complexos", desc: "Plataformas SaaS multi-tenant, portais, áreas restritas, marketplaces e softwares B2B com regras de negócio densas." },
      { icon: "📱", title: "Apps mobile (iOS e Android)", desc: "React Native, Flutter ou nativo. Publicação nas lojas no nome da sua empresa, push notifications e modo offline." },
      { icon: "🛒", title: "E-commerce sob medida", desc: "Lojas com regra fiscal brasileira, integração com ERP, marketplace, frete, pagamento Pix/cartão/boleto e antifraude." },
      { icon: "🔌", title: "APIs & integrações", desc: "APIs REST/GraphQL, webhooks, integração com Bling, Tiny, RD Station, HubSpot, VTEX, ASAAS, Stripe, ERP corporativo." },
      { icon: "🤖", title: "Automações & IA", desc: "Bots, agentes de IA (Claude, GPT, Gemini), RPA, processamento de documentos e workflows automatizados em N8N e Make." },
      { icon: "🎯", title: "Landing pages de alta conversão", desc: "Páginas otimizadas para Google Ads e Meta Ads, com tracking server-side (GTM + CAPI) e A/B testing nativo." },
      { icon: "☁️", title: "SaaS & produtos digitais", desc: "MVP a produto maduro: billing recorrente, multi-tenant, métricas, onboarding, analytics e infraestrutura escalável." },
      { icon: "🔐", title: "Sistemas de gestão acadêmica", desc: "SGA, LMS, plataformas EAD com integração Moodle, geração de certificados, controle de matrículas e mensalidades." },
    ],
    stack: {
      heading: "Stack tecnológica",
      subheading: "Tecnologias modernas e maduras, escolhidas conforme o problema — não conforme moda.",
      groups: [
        { label: "Back-end", items: ["Node.js (NestJS, Fastify)", "PHP (Laravel, Symfony)", "Python (FastAPI, Django)", "Go", ".NET / C#"] },
        { label: "Front-end", items: ["Next.js / React", "Vue / Nuxt", "Astro", "Svelte / SvelteKit", "TypeScript"] },
        { label: "Mobile", items: ["React Native", "Flutter", "Swift (iOS nativo)", "Kotlin (Android nativo)", "Capacitor / Ionic"] },
        { label: "Dados & infra", items: ["PostgreSQL, MySQL, MariaDB", "MongoDB, Redis", "AWS, Cloudflare, Hetzner", "Docker, Kubernetes", "Vercel, Railway, GCP"] },
        { label: "IA & integrações", items: ["Claude, GPT, Gemini", "n8n, Make, Zapier", "Webhooks, REST, GraphQL", "Stripe, ASAAS, Pagar.me", "Meta API, Google APIs"] },
      ],
    },
    process: {
      heading: "Como trabalhamos",
      subheading: "Processo enxuto, com entregas semanais e visibilidade total para o cliente.",
      steps: [
        { num: "1", title: "Diagnóstico (1 semana)", desc: "Reunião pra entender o problema real, fluxos, integrações necessárias e prioridades. Proposta detalhada em até 5 dias úteis." },
        { num: "2", title: "Discovery & escopo", desc: "Wireframes, diagrama de arquitetura, modelagem de dados e definição clara do MVP. Você aprova antes de uma linha de código." },
        { num: "3", title: "Sprints semanais", desc: "Entregas a cada 1-2 semanas com demo ao vivo. Você acompanha o backlog no Trello/Linear e fala direto com a pessoa que está codando." },
        { num: "4", title: "Testes & QA", desc: "Testes automatizados (unit, integration, e2e), revisão de segurança OWASP, validação de performance e auditoria de acessibilidade." },
        { num: "5", title: "Deploy & go-live", desc: "Infraestrutura provisionada (AWS, Cloudflare, Vercel), CI/CD configurado, monitoramento (Sentry, Grafana) e domínios no ar." },
        { num: "6", title: "Sustentação contínua", desc: "SLA mensal opcional pra correções, evoluções, monitoramento 24/7 e suporte. Você não fica refém de freelancer sumido." },
      ],
    },
    why: {
      heading: "Por que escolher a Agathas",
      subheading: "15+ anos entregando em produção. Sem firula, sem letra miúda, sem terceirização escondida.",
      items: [
        { icon: "📐", title: "Arquitetura primeiro", desc: "Decisões técnicas justificadas — sem cair em frameworks da moda. Você recebe um diagrama claro de como tudo conversa." },
        { icon: "🧑‍💻", title: "Time sênior brasileiro", desc: "Sem subcontratação opaca. Quem coda no seu projeto é quem você fala no WhatsApp." },
        { icon: "🔓", title: "Zero lock-in", desc: "Código entregue no seu GitHub/GitLab. Infra com sua conta na AWS/Cloudflare. Se um dia quiser trocar, leva tudo." },
        { icon: "🚦", title: "Demo semanal ao vivo", desc: "Você vê o sistema crescer toda semana — não recebe surpresa no final do projeto." },
        { icon: "🛡️", title: "Segurança séria", desc: "OWASP Top 10 tratada, dependências auditadas, secrets gerenciados, LGPD/GDPR aplicada do dia 1." },
        { icon: "📊", title: "Observabilidade nativa", desc: "Logs estruturados, métricas, traces e alertas. Você sabe o que tá acontecendo em produção sem depender de adivinhação." },
      ],
    },
    cases: {
      heading: "Para quem trabalhamos",
      subheading: "Atendemos PMEs estabelecidas, scaleups, startups com tração e empresas que precisam de tecnologia robusta — não vitrine.",
      items: [
        { icon: "🏭", title: "Indústrias & operações", desc: "Sistemas que conectam chão de fábrica, ERP, BI e fluxos comerciais. Integração com SAP, TOTVS, Omie." },
        { icon: "🎓", title: "Educação & EAD", desc: "Plataformas Moodle, SGA, geração de certificados, controle de mensalidades, apps mobile no nome da instituição." },
        { icon: "🛍️", title: "Varejo & e-commerce", desc: "Sites com regra fiscal brasileira, integração com marketplace, ERP, frete, gateway, antifraude e marketing." },
        { icon: "📈", title: "Agências & marketing", desc: "Plataformas internas, landing pages otimizadas, automações de captação e dashboards de campanha." },
        { icon: "⚕️", title: "Saúde & jurídico", desc: "Sistemas com LGPD aplicada, prontuário eletrônico, agenda inteligente, integração com TISS, peticionamento e CRM jurídico." },
        { icon: "🚀", title: "SaaS & startups", desc: "MVP em 6-12 semanas, billing recorrente, multi-tenant, métricas de produto, infra escalável." },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "Quanto custa um projeto de software?", a: "Depende do escopo. MVP de SaaS começa em R$ 25-60 mil; ERP/sistema corporativo entre R$ 60-200 mil; apps mobile com integração entre R$ 40-120 mil. Fazemos diagnóstico gratuito de 1h pra estimar com precisão antes da proposta." },
        { q: "Em quanto tempo entregam?", a: "MVP funcional de SaaS: 6-12 semanas. Sistemas mais complexos: 3-6 meses divididos em milestones. Apps mobile publicados: 8-16 semanas. Trabalhamos com entregas a cada 1-2 semanas, então você vê resultado contínuo." },
        { q: "Vocês desenvolvem internamente ou terceirizam?", a: "100% interno. Equipe sênior brasileira, sem subcontratação opaca. Quem coda no seu projeto é quem você conversa no WhatsApp." },
        { q: "O código fica comigo?", a: "Sim, integralmente. Repositório no seu GitHub/GitLab desde o primeiro commit. Infraestrutura na sua conta AWS/Cloudflare/Vercel. Zero lock-in com a Agathas." },
        { q: "Vocês mantêm o sistema depois?", a: "Opcionalmente sim. Oferecemos SLA mensal de sustentação (correções, evoluções, monitoramento). Mas se quiser internalizar ou levar pra outro fornecedor, o código tá documentado e pronto." },
        { q: "Como funciona a propriedade intelectual?", a: "Contrato deixa explícito: você é dono de 100% do código produzido. Patente, marca, IP, tudo seu. A gente assina NDA antes mesmo da reunião de diagnóstico, se preferir." },
        { q: "Atendem fora do Brasil?", a: "Sim — temos clientes em Portugal, Espanha, EUA e Reino Unido. Faturamento em BRL, USD, EUR ou GBP com nota fiscal." },
      ],
    },
    finalCta: {
      heading: "Vamos conversar sobre o seu projeto?",
      lead: "Diagnóstico de 1 hora gratuito. Saímos da reunião com escopo, prazo e investimento estimados — sem compromisso.",
      ctaPrimary: "Falar com a equipe",
      ctaSecondary: "Falar no WhatsApp",
    },
    prefill: "Olá! Vi a página de Desenvolvimento e quero conversar sobre um projeto.",
  },
  es: {
    hero: {
      badge: "🚀 Ingeniería a medida desde hace 15+ años",
      titleLine1: "Desarrollo",
      titleLine2: "de Software a Medida",
      lead: "ERPs, SaaS, apps móviles, sistemas web complejos e integraciones. Arquitectura escalable, código propio, cero lock-in — entregado por un equipo en producción hace más de una década.",
      ctaQuote: "Solicitar presupuesto",
      ctaWa: "Hablar por WhatsApp",
    },
    stats: [
      { value: "15+", label: "Años de operación" },
      { value: "500+", label: "Proyectos entregados" },
      { value: "5.0⭐", label: "Reseña Google" },
      { value: "100%", label: "Código entregado" },
    ],
    areasTitle: "Qué desarrollamos",
    areasLead: "Cobertura full-stack: del back-end de alta carga al app móvil en la tienda, del CRM interno a la integración con ERP corporativo.",
    areas: [
      { icon: "🏢", title: "ERPs & sistemas empresariales", desc: "ERPs a medida, CRMs, dashboards, BI, flujos de aprobación, gestión financiera, RR. HH., inventario y operaciones." },
      { icon: "🌐", title: "Sistemas web complejos", desc: "Plataformas SaaS multi-tenant, portales, áreas restringidas, marketplaces y software B2B con reglas de negocio densas." },
      { icon: "📱", title: "Apps móviles (iOS y Android)", desc: "React Native, Flutter o nativo. Publicación en las tiendas a nombre de tu empresa, push notifications y modo offline." },
      { icon: "🛒", title: "E-commerce a medida", desc: "Tiendas con regla fiscal local, integración con ERP, marketplace, envío, Pix/tarjeta/boleto y antifraude." },
      { icon: "🔌", title: "APIs & integraciones", desc: "APIs REST/GraphQL, webhooks, integración con ERPs, CRMs, pasarelas, plataformas de marketing y herramientas SaaS." },
      { icon: "🤖", title: "Automaciones & IA", desc: "Bots, agentes de IA (Claude, GPT, Gemini), RPA, procesamiento de documentos y workflows en n8n y Make." },
      { icon: "🎯", title: "Landing pages de alta conversión", desc: "Páginas optimizadas para Google Ads y Meta Ads con tracking server-side (GTM + CAPI) y A/B testing nativo." },
      { icon: "☁️", title: "SaaS & productos digitales", desc: "Del MVP al producto maduro: billing recurrente, multi-tenant, métricas, onboarding, analytics e infraestructura escalable." },
      { icon: "🔐", title: "Sistemas de gestión académica", desc: "SGA, LMS, plataformas e-learning con integración Moodle, certificados, matrículas y cuotas." },
    ],
    stack: {
      heading: "Stack tecnológico",
      subheading: "Tecnologías modernas y maduras, elegidas según el problema — no según la moda.",
      groups: [
        { label: "Back-end", items: ["Node.js (NestJS, Fastify)", "PHP (Laravel, Symfony)", "Python (FastAPI, Django)", "Go", ".NET / C#"] },
        { label: "Front-end", items: ["Next.js / React", "Vue / Nuxt", "Astro", "Svelte / SvelteKit", "TypeScript"] },
        { label: "Mobile", items: ["React Native", "Flutter", "Swift (iOS nativo)", "Kotlin (Android nativo)", "Capacitor / Ionic"] },
        { label: "Datos & infra", items: ["PostgreSQL, MySQL, MariaDB", "MongoDB, Redis", "AWS, Cloudflare, Hetzner", "Docker, Kubernetes", "Vercel, Railway, GCP"] },
        { label: "IA & integraciones", items: ["Claude, GPT, Gemini", "n8n, Make, Zapier", "Webhooks, REST, GraphQL", "Stripe, ASAAS, Pagar.me", "Meta API, Google APIs"] },
      ],
    },
    process: {
      heading: "Cómo trabajamos",
      subheading: "Proceso ágil, con entregas semanales y visibilidad total para el cliente.",
      steps: [
        { num: "1", title: "Diagnóstico (1 semana)", desc: "Reunión para entender el problema real, flujos, integraciones y prioridades. Propuesta detallada en hasta 5 días hábiles." },
        { num: "2", title: "Discovery & alcance", desc: "Wireframes, diagrama de arquitectura, modelado de datos y definición clara del MVP. Apruebas antes de una línea de código." },
        { num: "3", title: "Sprints semanales", desc: "Entregas cada 1-2 semanas con demo en vivo. Sigues el backlog en Trello/Linear y hablas con quien codifica." },
        { num: "4", title: "Pruebas & QA", desc: "Pruebas automatizadas, revisión de seguridad OWASP, validación de rendimiento y auditoría de accesibilidad." },
        { num: "5", title: "Deploy & go-live", desc: "Infraestructura provisionada (AWS, Cloudflare, Vercel), CI/CD, monitoreo (Sentry, Grafana) y dominios al aire." },
        { num: "6", title: "Soporte continuo", desc: "SLA mensual opcional para correcciones, evoluciones, monitoreo 24/7 y soporte." },
      ],
    },
    why: {
      heading: "Por qué elegir Agathas",
      subheading: "15+ años entregando en producción. Sin letra pequeña, sin tercerización opaca.",
      items: [
        { icon: "📐", title: "Arquitectura primero", desc: "Decisiones técnicas justificadas — sin caer en frameworks de moda." },
        { icon: "🧑‍💻", title: "Equipo senior", desc: "Sin subcontratación oculta. Quien codifica tu proyecto es con quien hablas." },
        { icon: "🔓", title: "Cero lock-in", desc: "Código entregado en tu GitHub. Infra en tu cuenta AWS/Cloudflare. Si cambias, te llevas todo." },
        { icon: "🚦", title: "Demo semanal en vivo", desc: "Ves el sistema crecer cada semana — sin sorpresas al final." },
        { icon: "🛡️", title: "Seguridad seria", desc: "OWASP Top 10 tratada, dependencias auditadas, secrets gestionados, LGPD/GDPR aplicada." },
        { icon: "📊", title: "Observabilidad nativa", desc: "Logs estructurados, métricas, traces y alertas." },
      ],
    },
    cases: {
      heading: "Para quién trabajamos",
      subheading: "Atendemos pymes establecidas, scaleups, startups con tracción y empresas que necesitan tecnología robusta — no vitrina.",
      items: [
        { icon: "🏭", title: "Industria & operaciones", desc: "Sistemas que conectan planta, ERP, BI y flujos comerciales." },
        { icon: "🎓", title: "Educación & e-learning", desc: "Plataformas Moodle, SGA, certificados, control de mensualidades, apps móviles." },
        { icon: "🛍️", title: "Retail & e-commerce", desc: "Sitios con regla fiscal local, integración con marketplace, ERP, envío, antifraude." },
        { icon: "📈", title: "Agencias & marketing", desc: "Plataformas internas, landing pages, automaciones y dashboards de campaña." },
        { icon: "⚕️", title: "Salud & legal", desc: "Sistemas con LGPD aplicada, expediente electrónico, agenda y CRM jurídico." },
        { icon: "🚀", title: "SaaS & startups", desc: "MVP en 6-12 semanas, billing recurrente, multi-tenant, métricas e infra escalable." },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Cuánto cuesta un proyecto?", a: "Depende del alcance. MVP de SaaS desde R$ 25-60K; ERP/sistema corporativo entre R$ 60-200K; apps móviles entre R$ 40-120K. Diagnóstico gratuito de 1h para estimar con precisión." },
        { q: "¿En cuánto tiempo entregan?", a: "MVP de SaaS: 6-12 semanas. Sistemas complejos: 3-6 meses. Apps móviles publicados: 8-16 semanas. Entregas cada 1-2 semanas." },
        { q: "¿Desarrollan internamente o tercerizan?", a: "100% interno. Equipo senior, sin subcontratación opaca." },
        { q: "¿El código queda conmigo?", a: "Sí, totalmente. Repo en tu GitHub desde el primer commit. Infraestructura en tu cuenta. Cero lock-in." },
        { q: "¿Mantienen el sistema después?", a: "Opcional. Ofrecemos SLA mensual de soporte. Pero el código queda documentado para internalizar si quieres." },
        { q: "¿Atienden fuera de Brasil?", a: "Sí — clientes en Portugal, España, EE. UU. y Reino Unido. Facturación en BRL, USD, EUR o GBP." },
      ],
    },
    finalCta: {
      heading: "¿Conversamos sobre tu proyecto?",
      lead: "Diagnóstico gratuito de 1 hora. Salimos de la reunión con alcance, plazo e inversión estimados — sin compromiso.",
      ctaPrimary: "Hablar con el equipo",
      ctaSecondary: "Hablar por WhatsApp",
    },
    prefill: "¡Hola! Vi la página de Desarrollo y quiero conversar sobre un proyecto.",
  },
  "en-US": {
    hero: {
      badge: "🚀 Custom engineering for 15+ years",
      titleLine1: "Custom Software",
      titleLine2: "Development",
      lead: "ERPs, SaaS, mobile apps, complex web systems and integrations. Scalable architecture, your code, zero lock-in — delivered by a team operating in production for over a decade.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    stats: [
      { value: "15+", label: "Years operating" },
      { value: "500+", label: "Projects delivered" },
      { value: "5.0⭐", label: "Google rating" },
      { value: "100%", label: "Source delivered" },
    ],
    areasTitle: "What we build",
    areasLead: "Full-stack coverage: from high-load back-end to mobile app on the store, from internal CRM to ERP integration.",
    areas: [
      { icon: "🏢", title: "ERPs & business systems", desc: "Custom ERPs, CRMs, dashboards, BI, approval workflows, finance, HR, inventory and operations." },
      { icon: "🌐", title: "Complex web systems", desc: "Multi-tenant SaaS platforms, portals, gated areas, marketplaces and B2B software with dense business rules." },
      { icon: "📱", title: "Mobile apps (iOS & Android)", desc: "React Native, Flutter or native. Stores publication under your company's name, push notifications and offline mode." },
      { icon: "🛒", title: "Tailored e-commerce", desc: "Stores with local tax rules, ERP integration, marketplace, shipping, payment and antifraud." },
      { icon: "🔌", title: "APIs & integrations", desc: "REST/GraphQL APIs, webhooks, integration with ERPs, CRMs, gateways, marketing platforms and SaaS tools." },
      { icon: "🤖", title: "Automation & AI", desc: "Bots, AI agents (Claude, GPT, Gemini), RPA, document processing and workflows on n8n and Make." },
      { icon: "🎯", title: "High-conversion landing pages", desc: "Pages optimized for Google Ads and Meta Ads with server-side tracking (GTM + CAPI) and native A/B testing." },
      { icon: "☁️", title: "SaaS & digital products", desc: "From MVP to mature product: recurring billing, multi-tenant, metrics, onboarding, analytics and scalable infrastructure." },
      { icon: "🔐", title: "Academic management systems", desc: "SMS, LMS, e-learning platforms with Moodle integration, certificates, enrollment and tuition control." },
    ],
    stack: {
      heading: "Tech stack",
      subheading: "Modern and mature tools, chosen by problem fit — not by trend.",
      groups: [
        { label: "Back-end", items: ["Node.js (NestJS, Fastify)", "PHP (Laravel, Symfony)", "Python (FastAPI, Django)", "Go", ".NET / C#"] },
        { label: "Front-end", items: ["Next.js / React", "Vue / Nuxt", "Astro", "Svelte / SvelteKit", "TypeScript"] },
        { label: "Mobile", items: ["React Native", "Flutter", "Swift (native iOS)", "Kotlin (native Android)", "Capacitor / Ionic"] },
        { label: "Data & infra", items: ["PostgreSQL, MySQL, MariaDB", "MongoDB, Redis", "AWS, Cloudflare, Hetzner", "Docker, Kubernetes", "Vercel, Railway, GCP"] },
        { label: "AI & integrations", items: ["Claude, GPT, Gemini", "n8n, Make, Zapier", "Webhooks, REST, GraphQL", "Stripe, ASAAS, Pagar.me", "Meta API, Google APIs"] },
      ],
    },
    process: {
      heading: "How we work",
      subheading: "Lean process with weekly deliveries and full client visibility.",
      steps: [
        { num: "1", title: "Diagnosis (1 week)", desc: "Discovery meeting to understand the real problem, flows, integrations and priorities. Detailed proposal in up to 5 business days." },
        { num: "2", title: "Discovery & scope", desc: "Wireframes, architecture diagram, data modeling and clear MVP definition. You approve before a line of code." },
        { num: "3", title: "Weekly sprints", desc: "Delivery every 1-2 weeks with live demo. You follow the backlog on Trello/Linear and talk to whoever codes it." },
        { num: "4", title: "Tests & QA", desc: "Automated tests, OWASP security review, performance validation and accessibility audit." },
        { num: "5", title: "Deploy & go-live", desc: "Provisioned infra (AWS, Cloudflare, Vercel), CI/CD, monitoring (Sentry, Grafana) and domains live." },
        { num: "6", title: "Ongoing support", desc: "Optional monthly SLA for fixes, evolutions, 24/7 monitoring and support." },
      ],
    },
    why: {
      heading: "Why choose Agathas",
      subheading: "15+ years delivering in production. No fine print, no hidden outsourcing.",
      items: [
        { icon: "📐", title: "Architecture first", desc: "Justified technical decisions — never trend-chasing frameworks." },
        { icon: "🧑‍💻", title: "Senior team", desc: "No opaque subcontracting. Whoever codes is who you talk to on WhatsApp." },
        { icon: "🔓", title: "Zero lock-in", desc: "Code delivered to your GitHub. Infra on your AWS/Cloudflare. You can leave anytime." },
        { icon: "🚦", title: "Weekly live demo", desc: "You see the system grow weekly — no end-of-project surprises." },
        { icon: "🛡️", title: "Serious security", desc: "OWASP Top 10 covered, audited dependencies, managed secrets, LGPD/GDPR applied from day one." },
        { icon: "📊", title: "Native observability", desc: "Structured logs, metrics, traces and alerts." },
      ],
    },
    cases: {
      heading: "Who we work with",
      subheading: "Established SMBs, scaleups, startups with traction and companies that need robust technology — not showcase.",
      items: [
        { icon: "🏭", title: "Industry & operations", desc: "Systems connecting shop floor, ERP, BI and sales flows." },
        { icon: "🎓", title: "Education & e-learning", desc: "Moodle platforms, SMS, certificates, tuition control, branded mobile apps." },
        { icon: "🛍️", title: "Retail & e-commerce", desc: "Sites with local tax rules, marketplace integration, ERP, shipping, antifraud." },
        { icon: "📈", title: "Agencies & marketing", desc: "Internal platforms, landing pages, lead automation and campaign dashboards." },
        { icon: "⚕️", title: "Health & legal", desc: "Systems with LGPD applied, electronic records, scheduling and legal CRM." },
        { icon: "🚀", title: "SaaS & startups", desc: "MVP in 6-12 weeks, recurring billing, multi-tenant, product metrics, scalable infra." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "How much does a project cost?", a: "Depends on scope. SaaS MVP starts at USD 5-12K; corporate ERP between USD 12-40K; mobile apps with integration between USD 8-25K. Free 1h diagnosis to estimate accurately." },
        { q: "How long does it take?", a: "SaaS MVP: 6-12 weeks. Complex systems: 3-6 months. Published mobile apps: 8-16 weeks. Deliveries every 1-2 weeks." },
        { q: "Do you build in-house or outsource?", a: "100% in-house. Senior team, no opaque subcontracting." },
        { q: "Do I own the code?", a: "Yes, entirely. Repo on your GitHub from the first commit. Infrastructure on your account. Zero lock-in." },
        { q: "Do you maintain the system?", a: "Optionally. We offer monthly maintenance SLA. But the code is documented if you want to internalize." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — clients in Portugal, Spain, US and UK. Invoicing in BRL, USD, EUR or GBP." },
      ],
    },
    finalCta: {
      heading: "Let's talk about your project?",
      lead: "Free 1-hour diagnosis. You leave the meeting with scope, deadline and investment estimated — no commitment.",
      ctaPrimary: "Talk to the team",
      ctaSecondary: "Chat on WhatsApp",
    },
    prefill: "Hi! I saw the Development page and want to discuss a project.",
  },
  "en-GB": {
    hero: {
      badge: "🚀 Bespoke engineering for 15+ years",
      titleLine1: "Bespoke Software",
      titleLine2: "Development",
      lead: "ERPs, SaaS, mobile apps, complex web systems and integrations. Scalable architecture, your code, zero lock-in — delivered by a team operating in production for over a decade.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    stats: [
      { value: "15+", label: "Years operating" },
      { value: "500+", label: "Projects delivered" },
      { value: "5.0⭐", label: "Google rating" },
      { value: "100%", label: "Source delivered" },
    ],
    areasTitle: "What we build",
    areasLead: "Full-stack coverage: from high-load back-end to mobile apps in the stores, from internal CRM to ERP integrations.",
    areas: [
      { icon: "🏢", title: "ERPs & business systems", desc: "Bespoke ERPs, CRMs, dashboards, BI, approval workflows, finance, HR, inventory and operations." },
      { icon: "🌐", title: "Complex web systems", desc: "Multi-tenant SaaS platforms, portals, gated areas, marketplaces and B2B software with dense business rules." },
      { icon: "📱", title: "Mobile apps (iOS & Android)", desc: "React Native, Flutter or native. Store publication under your company's name, push notifications and offline mode." },
      { icon: "🛒", title: "Tailored e-commerce", desc: "Stores with local tax rules, ERP integration, marketplace, shipping, payment and anti-fraud." },
      { icon: "🔌", title: "APIs & integrations", desc: "REST/GraphQL APIs, webhooks, integration with ERPs, CRMs, gateways, marketing platforms and SaaS tools." },
      { icon: "🤖", title: "Automation & AI", desc: "Bots, AI agents (Claude, GPT, Gemini), RPA, document processing and workflows on n8n and Make." },
      { icon: "🎯", title: "High-conversion landing pages", desc: "Pages optimised for Google Ads and Meta Ads with server-side tracking (GTM + CAPI) and native A/B testing." },
      { icon: "☁️", title: "SaaS & digital products", desc: "From MVP to mature product: recurring billing, multi-tenant, metrics, onboarding, analytics and scalable infrastructure." },
      { icon: "🔐", title: "Academic management systems", desc: "SMS, LMS, e-learning platforms with Moodle integration, certificates, enrolment and tuition control." },
    ],
    stack: {
      heading: "Tech stack",
      subheading: "Modern and mature tools, chosen by problem fit — not by trend.",
      groups: [
        { label: "Back-end", items: ["Node.js (NestJS, Fastify)", "PHP (Laravel, Symfony)", "Python (FastAPI, Django)", "Go", ".NET / C#"] },
        { label: "Front-end", items: ["Next.js / React", "Vue / Nuxt", "Astro", "Svelte / SvelteKit", "TypeScript"] },
        { label: "Mobile", items: ["React Native", "Flutter", "Swift (native iOS)", "Kotlin (native Android)", "Capacitor / Ionic"] },
        { label: "Data & infra", items: ["PostgreSQL, MySQL, MariaDB", "MongoDB, Redis", "AWS, Cloudflare, Hetzner", "Docker, Kubernetes", "Vercel, Railway, GCP"] },
        { label: "AI & integrations", items: ["Claude, GPT, Gemini", "n8n, Make, Zapier", "Webhooks, REST, GraphQL", "Stripe, ASAAS, Pagar.me", "Meta API, Google APIs"] },
      ],
    },
    process: {
      heading: "How we work",
      subheading: "Lean process with weekly deliveries and full client visibility.",
      steps: [
        { num: "1", title: "Diagnosis (1 week)", desc: "Discovery meeting to understand the real problem, flows, integrations and priorities. Detailed proposal in up to 5 working days." },
        { num: "2", title: "Discovery & scope", desc: "Wireframes, architecture diagram, data modelling and clear MVP definition. You approve before a line of code." },
        { num: "3", title: "Weekly sprints", desc: "Delivery every 1-2 weeks with live demo. You follow the backlog on Trello/Linear and talk to whoever codes it." },
        { num: "4", title: "Testing & QA", desc: "Automated tests, OWASP security review, performance validation and accessibility audit." },
        { num: "5", title: "Deploy & go-live", desc: "Provisioned infra (AWS, Cloudflare, Vercel), CI/CD, monitoring (Sentry, Grafana) and domains live." },
        { num: "6", title: "Ongoing support", desc: "Optional monthly SLA for fixes, evolutions, 24/7 monitoring and support." },
      ],
    },
    why: {
      heading: "Why choose Agathas",
      subheading: "15+ years delivering in production. No small print, no hidden outsourcing.",
      items: [
        { icon: "📐", title: "Architecture first", desc: "Justified technical decisions — never trend-chasing frameworks." },
        { icon: "🧑‍💻", title: "Senior team", desc: "No opaque subcontracting. Whoever codes is who you talk to on WhatsApp." },
        { icon: "🔓", title: "Zero lock-in", desc: "Code delivered to your GitHub. Infra on your AWS/Cloudflare. You can leave anytime." },
        { icon: "🚦", title: "Weekly live demo", desc: "You see the system grow weekly — no end-of-project surprises." },
        { icon: "🛡️", title: "Serious security", desc: "OWASP Top 10 covered, audited dependencies, managed secrets, LGPD/GDPR applied from day one." },
        { icon: "📊", title: "Native observability", desc: "Structured logs, metrics, traces and alerts." },
      ],
    },
    cases: {
      heading: "Who we work with",
      subheading: "Established SMBs, scaleups, startups with traction and companies that need robust technology — not showcase.",
      items: [
        { icon: "🏭", title: "Industry & operations", desc: "Systems connecting shop floor, ERP, BI and sales flows." },
        { icon: "🎓", title: "Education & e-learning", desc: "Moodle platforms, SMS, certificates, tuition control, branded mobile apps." },
        { icon: "🛍️", title: "Retail & e-commerce", desc: "Sites with local tax rules, marketplace integration, ERP, shipping, anti-fraud." },
        { icon: "📈", title: "Agencies & marketing", desc: "Internal platforms, landing pages, lead automation and campaign dashboards." },
        { icon: "⚕️", title: "Health & legal", desc: "Systems with LGPD applied, electronic records, scheduling and legal CRM." },
        { icon: "🚀", title: "SaaS & startups", desc: "MVP in 6-12 weeks, recurring billing, multi-tenant, product metrics, scalable infra." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "How much does a project cost?", a: "Depends on scope. SaaS MVP starts at GBP 4-10K; corporate ERP between GBP 10-30K; mobile apps with integration between GBP 6-20K. Free 1h diagnosis to estimate accurately." },
        { q: "How long does it take?", a: "SaaS MVP: 6-12 weeks. Complex systems: 3-6 months. Published mobile apps: 8-16 weeks. Deliveries every 1-2 weeks." },
        { q: "Do you build in-house or outsource?", a: "100% in-house. Senior team, no opaque subcontracting." },
        { q: "Do I own the code?", a: "Yes, entirely. Repo on your GitHub from the first commit. Infrastructure on your account. Zero lock-in." },
        { q: "Do you maintain the system?", a: "Optionally. We offer monthly maintenance SLA. But the code is documented if you want to internalise." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — clients in Portugal, Spain, US and UK. Invoicing in BRL, USD, EUR or GBP." },
      ],
    },
    finalCta: {
      heading: "Shall we talk about your project?",
      lead: "Free 1-hour diagnosis. You leave the meeting with scope, deadline and investment estimated — no commitment.",
      ctaPrimary: "Talk to the team",
      ctaSecondary: "Chat on WhatsApp",
    },
    prefill: "Hi! I saw the Development page and want to discuss a project.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/servicos/desenvolvimento">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  return {
    title: dict.services.development.metadata.title,
    description: dict.services.development.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/desenvolvimento`,
      languages: buildHreflangAlternates("/servicos/desenvolvimento"),
    },
  };
}

export default async function DesenvolvimentoPage({ params }: PageProps<"/[lang]/servicos/desenvolvimento">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = STRINGS[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-[60vh] flex items-center py-20 sm:py-32">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-full text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{t.hero.badge}</span>
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              <span className="block mb-2">{t.hero.titleLine1}</span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">{t.hero.titleLine2}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-10 max-w-3xl mx-auto">{t.hero.lead}</p>
            <div className="grid grid-cols-4 gap-4 sm:gap-8 mb-12 max-w-3xl mx-auto">
              {t.stats.map((stat, idx) => {
                const gradient = idx === 0 ? "from-blue-400 to-cyan-400" : idx === 1 ? "from-cyan-400 to-green-400" : idx === 2 ? "from-green-400 to-blue-400" : "from-purple-400 to-blue-400";
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center">
              <WhatsAppCta
                label={t.hero.ctaQuote}
                prefillMessage={t.prefill}
                ctaContext="desenvolvimento-hero"
                locale={lang}
                recaptchaSiteKey={recaptchaSiteKey}
                modalLabels={modalLabels}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:opacity-95 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Áreas de atuação */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.areasTitle}</h2>
            <p className="text-lg text-gray-300">{t.areasLead}</p>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 mx-auto rounded-full mb-16" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.areas.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.2)]">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.stack.heading}</h2>
            <p className="text-lg text-gray-300">{t.stack.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {t.stack.groups.map((group) => (
              <div key={group.label} className="bg-voyia-gray rounded-2xl p-5 border border-gray-700">
                <h3 className="text-base font-bold text-cyan-300 mb-3 uppercase tracking-wider">{group.label}</h3>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-gray-300 leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.process.heading}</h2>
            <p className="text-lg text-gray-300">{t.process.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.process.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.why.heading}</h2>
            <p className="text-lg text-gray-300">{t.why.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.why.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-blue-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.cases.heading}</h2>
            <p className="text-lg text-gray-300">{t.cases.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.cases.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-10 text-center">{t.faq.heading}</h2>
          <div className="space-y-4">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-semibold hover:bg-black/20 transition-colors list-none">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 text-blue-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-5 text-gray-300 leading-relaxed text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 via-voyia-gray to-cyan-500/10 border border-blue-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(59,130,246,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.ctaPrimary}
                  prefillMessage={t.prefill}
                  ctaContext="desenvolvimento-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-blue-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
