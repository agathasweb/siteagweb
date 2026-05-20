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

const STRINGS: Record<Locale, {
  hero: { badge: string; titlePrefix: string; titleHighlight: string; lead: string; ctaQuote: string; ctaWa: string };
  stats: { value: string; label: string }[];
  servicesTitle: string;
  servicesLead: string;
  services: { icon: string; title: string; desc: string }[];
  why: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  process: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[] };
  who: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  ecosystem: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; ctaPrimary: string; ctaSecondary: string };
  prefill: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🎓 Certificação Internacional Moodle",
      titlePrefix: "Plataforma",
      titleHighlight: "Moodle",
      lead: "Somos certificados pela Moodle HQ e operamos plataformas EAD em produção há 15+ anos. Customização, plugins, temas, hospedagem otimizada, integrações, app mobile com sua marca, SGA e sustentação completa.",
      ctaQuote: "Solicitar orçamento",
      ctaWa: "Falar no WhatsApp",
    },
    stats: [
      { value: "15+", label: "Anos com Moodle" },
      { value: "100+", label: "Instalações ativas" },
      { value: "Moodle HQ", label: "Certificação oficial" },
      { value: "99.9%", label: "Uptime SLA" },
    ],
    servicesTitle: "Tudo que precisamos cobrir em Moodle",
    servicesLead: "Operamos a stack inteira: do dimensionamento de servidor à publicação do app na App Store. Sem terceirizar nada que importa.",
    services: [
      { icon: "⚙️", title: "Implantação & migração", desc: "Implantação do zero, migração entre versões (3.x → 4.x → 5.x), migração entre servidores e consolidação de Moodles distintos." },
      { icon: "🎨", title: "Temas personalizados", desc: "Temas com identidade visual da sua instituição — paleta, tipografia, ícones, login customizado, dashboard sob medida." },
      { icon: "🔌", title: "Plugins sob medida", desc: "Plugins customizados pra regras específicas: integração com SGA, geração de boleto/Pix, certificado fiscalizado, gamificação, etc." },
      { icon: "☁️", title: "Hospedagem otimizada", desc: "Infraestrutura dedicada exclusivamente pra Moodle — PHP-FPM, Redis, OPcache, MariaDB ajustados, CDN, backup diário." },
      { icon: "📱", title: "App móvel da instituição", desc: "App Moodle com a sua marca na App Store e Google Play. Push notifications no seu nome, branding completo, distribuição na sua conta de desenvolvedor." },
      { icon: "🔗", title: "Integrações", desc: "SSO (Google Workspace, Microsoft Entra, SAML), gateway de pagamento (ASAAS, Stripe, Pagar.me), ERP, sistema acadêmico." },
      { icon: "🧑‍💼", title: "SGA — gestão de alunos", desc: "Sistema próprio que automatiza matrícula em massa, envio de credenciais, controle de mensalidades, relatórios de engajamento." },
      { icon: "📊", title: "BI & relatórios", desc: "Dashboards com métricas reais de engajamento, conclusão, abandono — além dos relatórios nativos do Moodle." },
      { icon: "🎓", title: "Treinamento & suporte", desc: "Capacitação da equipe acadêmica e administrativa. Suporte contínuo via WhatsApp, e-mail e Zoom em horário comercial brasileiro." },
      { icon: "🔐", title: "Segurança & LGPD", desc: "Endurecimento da plataforma, política de senhas, auditoria de logs, criptografia, política LGPD/GDPR aplicada de ponta a ponta." },
      { icon: "🚀", title: "Performance & escala", desc: "Otimização para 50k+ alunos simultâneos: Redis cache, load balancer, banco em alta disponibilidade, monitoramento 24/7." },
      { icon: "🛡️", title: "Sustentação & atualização", desc: "SLA mensal: atualizações de segurança, novas versões, correções, monitoramento, backup verificado, on-call." },
    ],
    why: {
      heading: "Por que a Agathas é referência em Moodle",
      subheading: "Não somos uma agência de marketing que toca Moodle no lado. Moodle é nosso core há mais de 15 anos.",
      items: [
        { icon: "🏆", title: "Certificação Moodle HQ", desc: "Equipe com Moodle Educator Certification e Moodle Partner Service — somos endossados pela própria Moodle." },
        { icon: "💻", title: "Code-first, não no-code", desc: "Manipulamos PHP, mustache, JavaScript e SQL do Moodle. Não dependemos de plugins de terceiros pra cada customização." },
        { icon: "🇧🇷", title: "Suporte em PT-BR", desc: "Atendimento técnico em português brasileiro, dentro do horário comercial. Sem fila internacional, sem tradução automática." },
        { icon: "📦", title: "Plugins próprios", desc: "Biblioteca de plugins desenvolvidos pela Agathas: SGA, geração de boleto Moodle, certificado avançado, integração ASAAS." },
        { icon: "📐", title: "Arquitetura escalável", desc: "Já operamos Moodles de 50k+ alunos simultâneos. Sabemos exatamente onde o Moodle gargala — e como contornar." },
        { icon: "🔄", title: "Sem lock-in", desc: "Você é dono dos dados, do tema, dos plugins customizados. Quer migrar pra outro fornecedor? Empacotamos e entregamos." },
      ],
    },
    process: {
      heading: "Como entregamos seu Moodle",
      subheading: "Implantação previsível, sem surpresa, com cronograma claro do dia 1.",
      steps: [
        { num: "1", title: "Diagnóstico (gratuito)", desc: "Entendemos o público (corporativo, escolar, universitário), volume esperado, integrações necessárias e prazos." },
        { num: "2", title: "Proposta técnica", desc: "Documento com arquitetura proposta, versão do Moodle, infraestrutura, lista de plugins, cronograma e investimento." },
        { num: "3", title: "Implantação", desc: "Instalação numa infraestrutura dedicada, configuração de cache, e-mail transacional, SSL, backup e monitoramento." },
        { num: "4", title: "Customização & integrações", desc: "Tema da instituição, plugins necessários, SSO, gateway de pagamento, integração com sistema acadêmico." },
        { num: "5", title: "Migração de dados", desc: "Se você já tem cursos/usuários em outra plataforma, importamos preservando histórico, notas e estrutura." },
        { num: "6", title: "Treinamento + go-live", desc: "Capacitamos sua equipe acadêmica e administrativa. Acompanhamos o lançamento de perto durante as primeiras semanas." },
        { num: "7", title: "Sustentação SLA", desc: "Manutenção contínua: atualizações de segurança, evolução, suporte. Você não fica refém de freelancer." },
      ],
    },
    who: {
      heading: "Pra quem o nosso Moodle faz sentido",
      subheading: "Atendemos do produtor de curso solo ao sistema federal de educação — com a mesma seriedade técnica.",
      items: [
        { icon: "🎓", title: "Faculdades & universidades", desc: "Instituições com 1k+ alunos, múltiplos cursos, integração com sistema acadêmico, geração de diplomas e mensalidades." },
        { icon: "🏫", title: "Escolas & cursinhos", desc: "Ensino básico, médio, vestibular e concurso. Painel pro pai/responsável, controle de presença, integração com WhatsApp." },
        { icon: "🏭", title: "Treinamento corporativo", desc: "RH de grandes empresas, treinamento de força de vendas, NRs, compliance, certificação interna obrigatória." },
        { icon: "💼", title: "Produtores de curso", desc: "Infoprodutores que querem sair da Hotmart/Kiwify e ter Moodle próprio — com gateway, fiscal e marca own." },
        { icon: "🏛️", title: "Órgãos públicos & ONGs", desc: "Escolas de governo, EAD para servidores, treinamento de conselheiros, capacitação de equipes públicas." },
        { icon: "🌍", title: "Idiomas & treinamentos técnicos", desc: "Escolas de idioma, cursos preparatórios, treinamento técnico (TI, saúde, jurídico) com avaliações automatizadas." },
      ],
    },
    ecosystem: {
      heading: "Nosso ecossistema completo de Moodle",
      subheading: "Não só o Moodle — todo o entorno que faz EAD funcionar de verdade.",
      items: [
        { icon: "🖥️", title: "Hospedagem Moodle", desc: "Servidores otimizados exclusivamente para Moodle — de 500 a 50k+ alunos simultâneos." },
        { icon: "🧑‍💼", title: "SGA (Sistema de Gestão)", desc: "Sistema próprio que automatiza importação de alunos, envio de credenciais, controle financeiro." },
        { icon: "📱", title: "App Moodle personalizado", desc: "Seu Moodle no celular do aluno com sua marca, na App Store e Google Play." },
        { icon: "💬", title: "Voyia (WhatsApp)", desc: "Comunicação com aluno via API Oficial WhatsApp, integrada ao Moodle." },
        { icon: "💳", title: "Pagamento Moodle", desc: "Integração nativa com ASAAS, Stripe e Pagar.me para boleto, Pix e cartão dentro do Moodle." },
        { icon: "🤖", title: "IA em Moodle", desc: "Tutor virtual com Claude/GPT, geração de questões, correção de redações, análise de engajamento." },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "Vocês são parceiros oficiais da Moodle HQ?", a: "Temos equipe certificada (Moodle Educator Certification) e usamos a infraestrutura Moodle Workplace e Moodle LMS sob licença. Atuamos em conformidade com as diretrizes oficiais." },
        { q: "Posso migrar do meu Moodle atual?", a: "Sim. Migramos preservando usuários, cursos, notas, badges, fóruns e arquivos. Cobramos pela complexidade do banco e volume de dados — proposta em 5 dias úteis." },
        { q: "Qual versão do Moodle vocês instalam?", a: "Sempre a versão LTS mais recente (Moodle 4.5 LTS no momento). Quem está em versões antigas (3.x) migramos para a LTS atual." },
        { q: "Vocês desenvolvem plugins customizados?", a: "Sim. Plugins próprios, integrações sob medida, hooks específicos para a sua regra de negócio. O código fica com você." },
        { q: "Quanto custa hospedar um Moodle?", a: "Depende do volume. Starter (até 500 alunos): R$ 199/mês. Professional (até 5k): R$ 599/mês. Enterprise (50k+): sob consulta. Setup inicial costuma ser R$ 1.500-5.000." },
        { q: "O Moodle suporta pagamento de mensalidade?", a: "Sim, com nossa integração ASAAS/Pagar.me/Stripe. Aluno paga dentro do Moodle, libera o curso automaticamente, gera nota fiscal automaticamente." },
        { q: "Vocês criam o app mobile com a marca da instituição?", a: "Sim — temos um serviço específico pra isso. Veja em /produtos/aplicativo-moodle. Customizamos o app oficial Moodle Mobile ou desenvolvemos do zero." },
        { q: "Como é o suporte depois que o Moodle tá no ar?", a: "SLA mensal fixo: atualizações de segurança, monitoramento 24/7, backup verificado, suporte por WhatsApp em horário comercial. A partir de R$ 800/mês." },
      ],
    },
    finalCta: {
      heading: "Pronto pra ter o Moodle que você merece?",
      lead: "Diagnóstico gratuito de 1 hora. Saímos com proposta técnica, cronograma e investimento estimados — sem compromisso.",
      ctaPrimary: "Falar com a equipe",
      ctaSecondary: "Falar no WhatsApp",
    },
    prefill: "Olá! Vi a página de Moodle e quero conversar sobre minha plataforma EAD.",
  },
  es: {
    hero: {
      badge: "🎓 Certificación Internacional Moodle",
      titlePrefix: "Plataforma",
      titleHighlight: "Moodle",
      lead: "Certificados por Moodle HQ y operando plataformas e-learning en producción desde hace 15+ años. Personalización, plugins, temas, hosting optimizado, integraciones, app móvil con tu marca, SGA y soporte completo.",
      ctaQuote: "Solicitar presupuesto",
      ctaWa: "Hablar por WhatsApp",
    },
    stats: [
      { value: "15+", label: "Años con Moodle" },
      { value: "100+", label: "Instalaciones activas" },
      { value: "Moodle HQ", label: "Certificación oficial" },
      { value: "99.9%", label: "Uptime SLA" },
    ],
    servicesTitle: "Todo lo que cubrimos en Moodle",
    servicesLead: "Operamos todo el stack: del dimensionamiento del servidor a la publicación del app en la App Store. Sin tercerizar lo que importa.",
    services: [
      { icon: "⚙️", title: "Implementación & migración", desc: "Implementación desde cero, migración entre versiones (3.x → 4.x → 5.x), migración entre servidores y consolidación de Moodles distintos." },
      { icon: "🎨", title: "Temas personalizados", desc: "Temas con la identidad visual de tu institución — paleta, tipografía, iconos, login customizado, dashboard a medida." },
      { icon: "🔌", title: "Plugins a medida", desc: "Plugins customizados para reglas específicas: integración con SGA, generación de pago, certificado fiscalizado, gamificación, etc." },
      { icon: "☁️", title: "Hosting optimizado", desc: "Infraestructura dedicada exclusivamente para Moodle — PHP-FPM, Redis, OPcache, MariaDB ajustados, CDN, backup diario." },
      { icon: "📱", title: "App móvil de la institución", desc: "App Moodle con tu marca en App Store y Google Play. Push notifications con tu nombre, branding completo." },
      { icon: "🔗", title: "Integraciones", desc: "SSO (Google Workspace, Microsoft Entra, SAML), pasarela de pago (ASAAS, Stripe, Pagar.me), ERP, sistema académico." },
      { icon: "🧑‍💼", title: "SGA — gestión de alumnos", desc: "Sistema propio que automatiza matrícula masiva, envío de credenciales, control de mensualidades, reportes de engagement." },
      { icon: "📊", title: "BI & reportes", desc: "Dashboards con métricas reales de engagement, conclusión, abandono — además de los reportes nativos." },
      { icon: "🎓", title: "Capacitación & soporte", desc: "Entrenamiento del equipo académico y administrativo. Soporte continuo vía WhatsApp, email y Zoom." },
      { icon: "🔐", title: "Seguridad & GDPR", desc: "Endurecimiento de la plataforma, política de contraseñas, auditoría de logs, cifrado, GDPR aplicado." },
      { icon: "🚀", title: "Rendimiento & escala", desc: "Optimización para 50k+ alumnos simultáneos: Redis cache, load balancer, BD en alta disponibilidad, monitoreo 24/7." },
      { icon: "🛡️", title: "Soporte & actualización", desc: "SLA mensual: actualizaciones de seguridad, nuevas versiones, correcciones, monitoreo, backup verificado." },
    ],
    why: {
      heading: "Por qué Agathas es referencia en Moodle",
      subheading: "No somos una agencia de marketing que toca Moodle al lado. Moodle es nuestro core hace más de 15 años.",
      items: [
        { icon: "🏆", title: "Certificación Moodle HQ", desc: "Equipo con Moodle Educator Certification — somos endosados por la propia Moodle." },
        { icon: "💻", title: "Code-first, no no-code", desc: "Manejamos PHP, mustache, JavaScript y SQL del Moodle. No dependemos de plugins de terceros." },
        { icon: "🌎", title: "Soporte en español", desc: "Atención técnica en español, en horario comercial. Sin fila internacional." },
        { icon: "📦", title: "Plugins propios", desc: "Biblioteca de plugins desarrollados por Agathas: SGA, pagos, certificado avanzado, integración ASAAS." },
        { icon: "📐", title: "Arquitectura escalable", desc: "Operamos Moodles de 50k+ alumnos simultáneos. Sabemos dónde Moodle se cuella de botella." },
        { icon: "🔄", title: "Sin lock-in", desc: "Eres dueño de los datos, del tema y de los plugins. Migración pacífica si lo deseas." },
      ],
    },
    process: {
      heading: "Cómo entregamos tu Moodle",
      subheading: "Implementación predecible, sin sorpresas, con cronograma claro desde el día 1.",
      steps: [
        { num: "1", title: "Diagnóstico (gratuito)", desc: "Entendemos el público, volumen esperado, integraciones necesarias y plazos." },
        { num: "2", title: "Propuesta técnica", desc: "Documento con arquitectura, versión Moodle, infraestructura, plugins, cronograma e inversión." },
        { num: "3", title: "Implementación", desc: "Instalación en infraestructura dedicada, cache, email transaccional, SSL, backup y monitoreo." },
        { num: "4", title: "Personalización & integraciones", desc: "Tema institucional, plugins, SSO, pasarela de pago, integración con sistema académico." },
        { num: "5", title: "Migración de datos", desc: "Si ya tienes cursos/usuarios en otra plataforma, importamos preservando historial." },
        { num: "6", title: "Capacitación + go-live", desc: "Entrenamos al equipo. Acompañamos el lanzamiento durante las primeras semanas." },
        { num: "7", title: "Soporte SLA", desc: "Mantenimiento continuo: actualizaciones de seguridad, evolución, soporte." },
      ],
    },
    who: {
      heading: "Para quién tiene sentido nuestro Moodle",
      subheading: "Atendemos desde el productor de cursos solo al sistema federal de educación — con la misma seriedad técnica.",
      items: [
        { icon: "🎓", title: "Universidades", desc: "Instituciones con 1k+ alumnos, múltiples cursos, integración académica, diplomas y mensualidades." },
        { icon: "🏫", title: "Colegios", desc: "Educación básica y media. Panel para padres, control de asistencia, integración WhatsApp." },
        { icon: "🏭", title: "Entrenamiento corporativo", desc: "RR. HH., entrenamiento de ventas, compliance, certificación interna obligatoria." },
        { icon: "💼", title: "Productores de cursos", desc: "Infoproductores que quieren salir de Hotmart/Kiwify y tener Moodle propio." },
        { icon: "🏛️", title: "Sector público & ONG", desc: "Escuelas de gobierno, capacitación de servidores, ONGs." },
        { icon: "🌍", title: "Idiomas & técnicos", desc: "Escuelas de idiomas, cursos preparatorios, formación técnica." },
      ],
    },
    ecosystem: {
      heading: "Nuestro ecosistema completo Moodle",
      subheading: "No solo Moodle — todo el entorno que hace funcionar al e-learning de verdad.",
      items: [
        { icon: "🖥️", title: "Hosting Moodle", desc: "Servidores optimizados — de 500 a 50k+ alumnos." },
        { icon: "🧑‍💼", title: "SGA", desc: "Sistema propio: importación masiva, envío de credenciales, control financiero." },
        { icon: "📱", title: "App Moodle personalizado", desc: "Tu Moodle en el celular del alumno con tu marca." },
        { icon: "💬", title: "Voyia (WhatsApp)", desc: "Comunicación con alumno vía API Oficial WhatsApp." },
        { icon: "💳", title: "Pagos en Moodle", desc: "Integración con ASAAS, Stripe y Pagar.me para boleto, Pix y tarjeta." },
        { icon: "🤖", title: "IA en Moodle", desc: "Tutor virtual con Claude/GPT, generación de preguntas, corrección automática." },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Son socios oficiales de Moodle HQ?", a: "Tenemos equipo certificado (Moodle Educator Certification) y usamos la infraestructura Moodle bajo licencia." },
        { q: "¿Puedo migrar de mi Moodle actual?", a: "Sí. Migramos preservando usuarios, cursos, notas, badges, foros y archivos." },
        { q: "¿Qué versión instalan?", a: "La LTS más reciente (Moodle 4.5 LTS actualmente)." },
        { q: "¿Desarrollan plugins customizados?", a: "Sí. Plugins propios, integraciones a medida. El código queda contigo." },
        { q: "¿Cuánto cuesta hospedar un Moodle?", a: "Starter (hasta 500 alumnos): USD 50/mes. Professional (hasta 5k): USD 150/mes. Enterprise (50k+): a consultar." },
        { q: "¿Soporta pago de mensualidades?", a: "Sí, con nuestra integración con pasarelas. Alumno paga dentro del Moodle, libera el curso automáticamente." },
        { q: "¿Crean el app móvil con la marca?", a: "Sí — servicio específico en /produtos/aplicativo-moodle." },
        { q: "¿Cómo es el soporte post-go-live?", a: "SLA mensual fijo: actualizaciones, monitoreo 24/7, backup verificado, soporte WhatsApp." },
      ],
    },
    finalCta: {
      heading: "¿Listo para tener el Moodle que mereces?",
      lead: "Diagnóstico gratuito de 1 hora. Salimos con propuesta técnica, cronograma e inversión estimados.",
      ctaPrimary: "Hablar con el equipo",
      ctaSecondary: "Hablar por WhatsApp",
    },
    prefill: "¡Hola! Vi la página de Moodle y quiero conversar sobre mi plataforma e-learning.",
  },
  "en-US": {
    hero: {
      badge: "🎓 International Moodle Certification",
      titlePrefix: "Moodle",
      titleHighlight: "Platform",
      lead: "Moodle HQ certified, operating e-learning platforms in production for 15+ years. Customization, plugins, themes, optimized hosting, integrations, branded mobile app, SMS and full sustainment.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    stats: [
      { value: "15+", label: "Years with Moodle" },
      { value: "100+", label: "Active installs" },
      { value: "Moodle HQ", label: "Official certification" },
      { value: "99.9%", label: "Uptime SLA" },
    ],
    servicesTitle: "Everything we cover on Moodle",
    servicesLead: "We operate the entire stack: from server sizing to App Store publication. We don't outsource what matters.",
    services: [
      { icon: "⚙️", title: "Deployment & migration", desc: "Fresh installation, version migration (3.x → 4.x → 5.x), server migration and Moodle consolidation." },
      { icon: "🎨", title: "Custom themes", desc: "Themes with your institution's visual identity — palette, typography, icons, custom login, tailored dashboard." },
      { icon: "🔌", title: "Custom plugins", desc: "Plugins customized for specific rules: SMS integration, payment, proctored certificate, gamification, etc." },
      { icon: "☁️", title: "Optimized hosting", desc: "Infrastructure dedicated exclusively to Moodle — tuned PHP-FPM, Redis, OPcache, MariaDB, CDN, daily backup." },
      { icon: "📱", title: "Branded mobile app", desc: "Moodle app with your brand on App Store and Google Play. Push notifications under your name, full branding." },
      { icon: "🔗", title: "Integrations", desc: "SSO (Google Workspace, Microsoft Entra, SAML), payment gateway (Stripe, ASAAS), ERP, academic system." },
      { icon: "🧑‍💼", title: "SMS — student management", desc: "Our system automating bulk enrollment, credential dispatch, tuition control, engagement reports." },
      { icon: "📊", title: "BI & reports", desc: "Dashboards with real engagement, completion, dropout metrics — beyond Moodle's native reports." },
      { icon: "🎓", title: "Training & support", desc: "Training for academic and administrative teams. Continuous support via WhatsApp, email and Zoom." },
      { icon: "🔐", title: "Security & GDPR", desc: "Platform hardening, password policy, log audit, encryption, GDPR/LGPD applied end-to-end." },
      { icon: "🚀", title: "Performance & scale", desc: "Optimization for 50k+ concurrent students: Redis cache, load balancer, HA database, 24/7 monitoring." },
      { icon: "🛡️", title: "Maintenance & updates", desc: "Monthly SLA: security patches, new versions, fixes, monitoring, verified backups, on-call." },
    ],
    why: {
      heading: "Why Agathas is a Moodle reference",
      subheading: "We're not a marketing agency that does Moodle on the side. Moodle has been our core for over 15 years.",
      items: [
        { icon: "🏆", title: "Moodle HQ certification", desc: "Team with Moodle Educator Certification — endorsed by Moodle itself." },
        { icon: "💻", title: "Code-first, not no-code", desc: "We manipulate Moodle's PHP, mustache, JavaScript and SQL. Not dependent on third-party plugins." },
        { icon: "🌎", title: "Multi-language support", desc: "Technical support in English, Spanish and Portuguese during business hours." },
        { icon: "📦", title: "Proprietary plugins", desc: "Library of plugins built by Agathas: SMS, payments, advanced certificates, integrations." },
        { icon: "📐", title: "Scalable architecture", desc: "We've operated Moodles with 50k+ concurrent students. We know where Moodle bottlenecks — and how to fix." },
        { icon: "🔄", title: "Zero lock-in", desc: "You own the data, theme and custom plugins. Want to migrate? We pack and deliver." },
      ],
    },
    process: {
      heading: "How we deliver your Moodle",
      subheading: "Predictable deployment, no surprises, clear timeline from day 1.",
      steps: [
        { num: "1", title: "Diagnosis (free)", desc: "We understand the audience, expected volume, required integrations and deadlines." },
        { num: "2", title: "Technical proposal", desc: "Document with proposed architecture, Moodle version, infrastructure, plugin list, timeline and investment." },
        { num: "3", title: "Deployment", desc: "Installation on dedicated infrastructure, cache config, transactional email, SSL, backup and monitoring." },
        { num: "4", title: "Customization & integrations", desc: "Institution theme, required plugins, SSO, payment gateway, academic system integration." },
        { num: "5", title: "Data migration", desc: "If you have courses/users in another platform, we import preserving history, grades and structure." },
        { num: "6", title: "Training + go-live", desc: "We train your academic and administrative teams. We monitor launch closely during first weeks." },
        { num: "7", title: "SLA sustainment", desc: "Continuous maintenance: security updates, evolution, support. You're not hostage to a missing freelancer." },
      ],
    },
    who: {
      heading: "Who our Moodle makes sense for",
      subheading: "From solo course producers to federal education systems — with the same technical seriousness.",
      items: [
        { icon: "🎓", title: "Universities", desc: "Institutions with 1k+ students, multiple courses, academic system integration, diplomas and tuition." },
        { icon: "🏫", title: "Schools", desc: "K-12, prep schools. Parent/guardian panel, attendance control, WhatsApp integration." },
        { icon: "🏭", title: "Corporate training", desc: "Large company HR, sales force training, compliance, mandatory internal certification." },
        { icon: "💼", title: "Course producers", desc: "Edupreneurs wanting to leave Hotmart/Teachable and have their own Moodle." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Government schools, public servant training, NGO capacity building." },
        { icon: "🌍", title: "Languages & technical training", desc: "Language schools, prep courses, technical training (IT, health, legal) with automated assessments." },
      ],
    },
    ecosystem: {
      heading: "Our complete Moodle ecosystem",
      subheading: "Not just Moodle — the whole surrounding stack that makes e-learning actually work.",
      items: [
        { icon: "🖥️", title: "Moodle hosting", desc: "Servers optimized exclusively for Moodle — from 500 to 50k+ concurrent students." },
        { icon: "🧑‍💼", title: "SMS (student management)", desc: "Proprietary system that automates student import, credential dispatch, financial control." },
        { icon: "📱", title: "Custom Moodle app", desc: "Your Moodle on student's phone with your brand, on App Store and Google Play." },
        { icon: "💬", title: "Voyia (WhatsApp)", desc: "Student communication via official WhatsApp API, integrated with Moodle." },
        { icon: "💳", title: "Moodle payments", desc: "Native integration with Stripe and ASAAS for card, Pix and bank slip inside Moodle." },
        { icon: "🤖", title: "AI in Moodle", desc: "Virtual tutor with Claude/GPT, question generation, essay grading, engagement analysis." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Are you official Moodle HQ partners?", a: "We have certified team (Moodle Educator Certification) and operate under Moodle Workplace/LMS license. We act per official guidelines." },
        { q: "Can I migrate from my current Moodle?", a: "Yes. We migrate preserving users, courses, grades, badges, forums and files. Proposal in 5 business days." },
        { q: "Which Moodle version do you install?", a: "Always the latest LTS (Moodle 4.5 LTS currently). We migrate 3.x users to current LTS." },
        { q: "Do you develop custom plugins?", a: "Yes. Proprietary plugins, custom integrations, hooks for your specific business rules. Code stays with you." },
        { q: "How much does Moodle hosting cost?", a: "Starter (up to 500 students): USD 50/month. Professional (up to 5k): USD 150/month. Enterprise (50k+): on request." },
        { q: "Does Moodle support tuition payment?", a: "Yes, with our Stripe/ASAAS integration. Student pays inside Moodle, unlocks course automatically, generates invoice." },
        { q: "Do you build the mobile app with the institution's brand?", a: "Yes — specific service at /produtos/aplicativo-moodle." },
        { q: "How is post go-live support?", a: "Fixed monthly SLA: security updates, 24/7 monitoring, verified backups, WhatsApp support. From USD 200/month." },
      ],
    },
    finalCta: {
      heading: "Ready to have the Moodle you deserve?",
      lead: "Free 1-hour diagnosis. You leave with technical proposal, timeline and investment estimated — no commitment.",
      ctaPrimary: "Talk to the team",
      ctaSecondary: "Chat on WhatsApp",
    },
    prefill: "Hi! I saw the Moodle page and want to discuss my e-learning platform.",
  },
  "en-GB": {
    hero: {
      badge: "🎓 International Moodle Certification",
      titlePrefix: "Moodle",
      titleHighlight: "Platform",
      lead: "Moodle HQ certified, operating e-learning platforms in production for 15+ years. Customisation, plugins, themes, optimised hosting, integrations, branded mobile app, SMS and full sustainment.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    stats: [
      { value: "15+", label: "Years with Moodle" },
      { value: "100+", label: "Active installs" },
      { value: "Moodle HQ", label: "Official certification" },
      { value: "99.9%", label: "Uptime SLA" },
    ],
    servicesTitle: "Everything we cover on Moodle",
    servicesLead: "We operate the entire stack: from server sizing to App Store publication. We don't outsource what matters.",
    services: [
      { icon: "⚙️", title: "Deployment & migration", desc: "Fresh installation, version migration (3.x → 4.x → 5.x), server migration and Moodle consolidation." },
      { icon: "🎨", title: "Custom themes", desc: "Themes with your institution's visual identity — palette, typography, icons, custom login, tailored dashboard." },
      { icon: "🔌", title: "Custom plugins", desc: "Plugins customised for specific rules: SMS integration, payment, proctored certificate, gamification, etc." },
      { icon: "☁️", title: "Optimised hosting", desc: "Infrastructure dedicated exclusively to Moodle — tuned PHP-FPM, Redis, OPcache, MariaDB, CDN, daily backup." },
      { icon: "📱", title: "Branded mobile app", desc: "Moodle app with your brand on App Store and Google Play. Push notifications under your name, full branding." },
      { icon: "🔗", title: "Integrations", desc: "SSO (Google Workspace, Microsoft Entra, SAML), payment gateway (Stripe, ASAAS), ERP, academic system." },
      { icon: "🧑‍💼", title: "SMS — student management", desc: "Our system automating bulk enrolment, credential dispatch, tuition control, engagement reports." },
      { icon: "📊", title: "BI & reports", desc: "Dashboards with real engagement, completion, dropout metrics — beyond Moodle's native reports." },
      { icon: "🎓", title: "Training & support", desc: "Training for academic and administrative teams. Continuous support via WhatsApp, email and Zoom." },
      { icon: "🔐", title: "Security & GDPR", desc: "Platform hardening, password policy, log audit, encryption, GDPR/LGPD applied end-to-end." },
      { icon: "🚀", title: "Performance & scale", desc: "Optimisation for 50k+ concurrent students: Redis cache, load balancer, HA database, 24/7 monitoring." },
      { icon: "🛡️", title: "Maintenance & updates", desc: "Monthly SLA: security patches, new versions, fixes, monitoring, verified backups, on-call." },
    ],
    why: {
      heading: "Why Agathas is a Moodle reference",
      subheading: "We're not a marketing agency that does Moodle on the side. Moodle has been our core for over 15 years.",
      items: [
        { icon: "🏆", title: "Moodle HQ certification", desc: "Team with Moodle Educator Certification — endorsed by Moodle itself." },
        { icon: "💻", title: "Code-first, not no-code", desc: "We manipulate Moodle's PHP, mustache, JavaScript and SQL. Not dependent on third-party plugins." },
        { icon: "🌎", title: "Multi-language support", desc: "Technical support in English, Spanish and Portuguese during business hours." },
        { icon: "📦", title: "Proprietary plugins", desc: "Library of plugins built by Agathas: SMS, payments, advanced certificates, integrations." },
        { icon: "📐", title: "Scalable architecture", desc: "We've operated Moodles with 50k+ concurrent students. We know where Moodle bottlenecks — and how to fix." },
        { icon: "🔄", title: "Zero lock-in", desc: "You own the data, theme and custom plugins. Want to migrate? We pack and deliver." },
      ],
    },
    process: {
      heading: "How we deliver your Moodle",
      subheading: "Predictable deployment, no surprises, clear timeline from day 1.",
      steps: [
        { num: "1", title: "Diagnosis (free)", desc: "We understand the audience, expected volume, required integrations and deadlines." },
        { num: "2", title: "Technical proposal", desc: "Document with proposed architecture, Moodle version, infrastructure, plugin list, timeline and investment." },
        { num: "3", title: "Deployment", desc: "Installation on dedicated infrastructure, cache config, transactional email, SSL, backup and monitoring." },
        { num: "4", title: "Customisation & integrations", desc: "Institution theme, required plugins, SSO, payment gateway, academic system integration." },
        { num: "5", title: "Data migration", desc: "If you have courses/users in another platform, we import preserving history, grades and structure." },
        { num: "6", title: "Training + go-live", desc: "We train your academic and administrative teams. We monitor launch closely during first weeks." },
        { num: "7", title: "SLA sustainment", desc: "Continuous maintenance: security updates, evolution, support." },
      ],
    },
    who: {
      heading: "Who our Moodle makes sense for",
      subheading: "From solo course producers to federal education systems — with the same technical seriousness.",
      items: [
        { icon: "🎓", title: "Universities", desc: "Institutions with 1k+ students, multiple courses, academic system integration, diplomas and tuition." },
        { icon: "🏫", title: "Schools", desc: "K-12, prep schools. Parent/guardian panel, attendance control, WhatsApp integration." },
        { icon: "🏭", title: "Corporate training", desc: "Large company HR, sales force training, compliance, mandatory internal certification." },
        { icon: "💼", title: "Course producers", desc: "Edupreneurs wanting to leave Hotmart/Teachable and have their own Moodle." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Government schools, public servant training, NGO capacity building." },
        { icon: "🌍", title: "Languages & technical training", desc: "Language schools, prep courses, technical training (IT, health, legal) with automated assessments." },
      ],
    },
    ecosystem: {
      heading: "Our complete Moodle ecosystem",
      subheading: "Not just Moodle — the whole surrounding stack that makes e-learning actually work.",
      items: [
        { icon: "🖥️", title: "Moodle hosting", desc: "Servers optimised exclusively for Moodle — from 500 to 50k+ concurrent students." },
        { icon: "🧑‍💼", title: "SMS (student management)", desc: "Proprietary system that automates student import, credential dispatch, financial control." },
        { icon: "📱", title: "Custom Moodle app", desc: "Your Moodle on student's phone with your brand, on App Store and Google Play." },
        { icon: "💬", title: "Voyia (WhatsApp)", desc: "Student communication via official WhatsApp API, integrated with Moodle." },
        { icon: "💳", title: "Moodle payments", desc: "Native integration with Stripe and ASAAS for card, Pix and bank slip inside Moodle." },
        { icon: "🤖", title: "AI in Moodle", desc: "Virtual tutor with Claude/GPT, question generation, essay grading, engagement analysis." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Are you official Moodle HQ partners?", a: "We have certified team (Moodle Educator Certification) and operate under Moodle Workplace/LMS licence. We act per official guidelines." },
        { q: "Can I migrate from my current Moodle?", a: "Yes. We migrate preserving users, courses, grades, badges, forums and files. Proposal in 5 working days." },
        { q: "Which Moodle version do you install?", a: "Always the latest LTS (Moodle 4.5 LTS currently). We migrate 3.x users to current LTS." },
        { q: "Do you develop custom plugins?", a: "Yes. Proprietary plugins, custom integrations, hooks for your specific business rules. Code stays with you." },
        { q: "How much does Moodle hosting cost?", a: "Starter (up to 500 students): GBP 40/month. Professional (up to 5k): GBP 120/month. Enterprise (50k+): on request." },
        { q: "Does Moodle support tuition payment?", a: "Yes, with our Stripe/ASAAS integration. Student pays inside Moodle, unlocks course automatically, generates invoice." },
        { q: "Do you build the mobile app with the institution's brand?", a: "Yes — specific service at /produtos/aplicativo-moodle." },
        { q: "How is post go-live support?", a: "Fixed monthly SLA: security updates, 24/7 monitoring, verified backups, WhatsApp support. From GBP 160/month." },
      ],
    },
    finalCta: {
      heading: "Ready to have the Moodle you deserve?",
      lead: "Free 1-hour diagnosis. You leave with technical proposal, timeline and investment estimated — no commitment.",
      ctaPrimary: "Talk to the team",
      ctaSecondary: "Chat on WhatsApp",
    },
    prefill: "Hi! I saw the Moodle page and want to discuss my e-learning platform.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/servicos/moodle">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  return {
    title: dict.services.moodle.metadata.title,
    description: dict.services.moodle.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/moodle`,
      languages: buildHreflangAlternates("/servicos/moodle"),
    },
  };
}

export default async function MoodlePage({ params }: PageProps<"/[lang]/servicos/moodle">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = STRINGS[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/40 rounded-full text-sm font-semibold text-orange-300 mb-8">{t.hero.badge}</span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {t.hero.titlePrefix} <span className="text-orange-400">{t.hero.titleHighlight}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {t.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-orange-400">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <WhatsAppCta
                label={t.hero.ctaQuote}
                prefillMessage={t.prefill}
                ctaContext="moodle-hero"
                locale={lang}
                recaptchaSiteKey={recaptchaSiteKey}
                modalLabels={modalLabels}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-orange-500/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.servicesTitle}</h2>
            <p className="text-lg text-gray-300">{t.servicesLead}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.services.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.2)]">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
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
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {t.process.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pra quem */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.who.heading}</h2>
            <p className="text-lg text-gray-300">{t.who.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.who.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecossistema */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.ecosystem.heading}</h2>
            <p className="text-lg text-gray-300">{t.ecosystem.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.ecosystem.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-orange-500/40 transition-colors">
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
                  <svg className="w-5 h-5 text-orange-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-voyia-gray to-purple-600/10 border border-orange-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(249,115,22,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.ctaPrimary}
                  prefillMessage={t.prefill}
                  ctaContext="moodle-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-orange-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
