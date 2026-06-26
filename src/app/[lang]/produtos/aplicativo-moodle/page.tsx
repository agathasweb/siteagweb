import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, buildPageMetadata, type Locale } from "@/lib/i18n";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

// i18n inline pra evitar inflar os 4 dicts JSON por uma página.
const STRINGS: Record<Locale, {
  meta: { title: string; description: string };
  hero: { badge: string; title1: string; title2: string; lead: string; ctaQuote: string; ctaWa: string };
  trustBullets: string[];
  benefits: { heading: string; subheading: string; items: { icon: string; title: string; body: string }[] };
  process: { heading: string; steps: { num: string; title: string; body: string }[] };
  who: { heading: string; subheading: string; items: { icon: string; title: string; body: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; ctaPrimary: string; ctaSecondary: string };
}> = {
  "pt-BR": {
    meta: {
      title: "Aplicativo Moodle Personalizado | Agathas Web",
      description: "Aplicativo Moodle com a marca da sua instituição. Branding total, push notifications no seu nome, modo offline e analytics próprios. Orçamento sob medida.",
    },
    hero: {
      badge: "🆕 Serviço novo",
      title1: "Aplicativo Moodle",
      title2: "Personalizado",
      lead: "Seu Moodle no celular do aluno com a marca da instituição — ícone próprio na home, push notifications no seu nome, distribuído como app independente. Sob medida, com orçamento prévio.",
      ctaQuote: "Solicitar orçamento",
      ctaWa: "Falar no WhatsApp",
    },
    trustBullets: [
      "15+ anos em Moodle",
      "Certificação Moodle Internacional",
      "Publicação ponta a ponta",
      "Suporte contínuo incluso",
    ],
    benefits: {
      heading: "7 vantagens do aplicativo personalizado",
      subheading: "Tudo que sua instituição precisa pra ter a própria experiência mobile — com a sua marca em todos os pontos de contato.",
      items: [
        { icon: "🎨", title: "Branding total", body: "Ícone, splash, cores, tipografia: tudo da sua instituição. Na home do celular do aluno, é o seu logo aparecendo todo dia." },
        { icon: "🔔", title: "Push no nome da instituição", body: "\"Faculdade X enviou\" em vez de notificação genérica. Reabertura sobe 2-4× quando o aluno reconhece o emissor." },
        { icon: "🔐", title: "SSO e auth próprias", body: "Google Workspace educacional, Microsoft Entra ID, CPF + biometria, integração com sistema acadêmico — tudo nativo." },
        { icon: "🧩", title: "Integrações específicas", body: "Provas com fiscalização por webcam, pagamento de mensalidade in-app, cartão de estudante digital, WhatsApp embutido." },
        { icon: "🏪", title: "Loja com a sua marca", body: "Aluno busca o nome da instituição nas lojas de apps e encontra direto. Distribuição publicada no nome da instituição." },
        { icon: "⚙️", title: "Controle do roadmap", body: "Bug que afeta sua instituição é corrigido rápido. Feature exclusiva sai quando faz sentido pra você — sob seu controle." },
        { icon: "📈", title: "Analytics próprios", body: "Firebase, Mixpanel ou solução própria. Você vê qual aula é abandonada, qual horário engaja, qual módulo gera mais dúvidas." },
      ],
    },
    process: {
      heading: "Como funciona, do diagnóstico ao lançamento",
      steps: [
        { num: "1", title: "Diagnóstico", body: "Reunião pra entender base ativa, perfil do aluno, integrações necessárias e fluxos críticos. Saímos com proposta detalhada e cronograma personalizado." },
        { num: "2", title: "Setup das contas", body: "Criamos as contas de desenvolvedor nas lojas no nome da instituição (com DUNS quando aplicável). Política de privacidade redigida e termos de uso elaborados." },
        { num: "3", title: "Design & arquitetura", body: "Wireframes, identidade visual aplicada, fluxos de telas, definição de SSO, integrações e analytics — tudo aprovado por você antes de uma linha de código." },
        { num: "4", title: "Desenvolvimento iterativo", body: "Builds de teste contínuos, feedback semanal e validação de cada release num grupo fechado da sua equipe. Cada projeto tem seu ritmo — entregamos quando está pronto." },
        { num: "5", title: "Submissão e review", body: "Apps submetidos com toda a documentação. Acompanhamos cada review e respondemos a eventuais ajustes pedidos pelas lojas." },
        { num: "6", title: "Publicação + treinamento", body: "Apps no ar com sua marca. Treinamos a equipe administrativa pra usar o painel de push notifications e relatórios." },
        { num: "7", title: "Manutenção contínua (SLA mensal)", body: "Atualizações de Moodle, correções, renovação anual de certificados, suporte. Você foca no conteúdo, a gente cuida do app." },
      ],
    },
    who: {
      heading: "Faz sentido pra você?",
      subheading: "Os 3 cenários onde o investimento se paga com folga.",
      items: [
        { icon: "🎓", title: "Curso pago de alto ticket", body: "MBA, pós-graduação, treinamento corporativo executivo. Aluno premium não tolera experiência genérica — app próprio justifica o preço cobrado." },
        { icon: "📱", title: "300+ alunos ativos no mobile", body: "Ganho de engajamento (30-60%) gera horas adicionais de uso, melhor desempenho, menos churn. Payback típico: menos de 12 meses." },
        { icon: "🥇", title: "Diferenciação competitiva", body: "Mercado saturado onde \"ter app próprio\" é raridade. Sua instituição vira referência local — especialmente em educação técnica, idiomas, cursos preparatórios." },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        {
          q: "Precisa de servidor Moodle diferente?",
          a: "Não. O app consome a mesma instalação Moodle que você já usa, via Web Services. Backend, cursos, usuários, avaliações — tudo continua exatamente no mesmo lugar.",
        },
        {
          q: "Em quanto tempo o app fica pronto?",
          a: "Cada projeto tem seu próprio ritmo — depende do escopo, integrações necessárias e fluxos críticos. Saímos do diagnóstico com cronograma personalizado, sequenciado por entregas iterativas, e você acompanha cada milestone. Sem promessas genéricas de prazo.",
        },
        {
          q: "A instituição é dona do app?",
          a: "Sim, integralmente. As contas de desenvolvedor ficam no nome da instituição (CNPJ, documentos próprios). Recebemos permissões de acesso pra fazer publicações e gerenciar certificados — mas a conta-mãe é sua. Se a relação com a gente terminar, você mantém o app.",
        },
        {
          q: "Quando o Moodle atualiza, o app quebra?",
          a: "Em geral não. A API do Moodle (Web Services) mantém compatibilidade entre versões maiores. Updates do Moodle 4.x → 4.y costumam não exigir mudança no app. Updates 3.x → 4.x ou eventual 5.x exigem pequenos ajustes — feitos como parte da manutenção mensal.",
        },
        {
          q: "Como funciona a manutenção depois do lançamento?",
          a: "SLA mensal fixo: atualizações de Moodle, correções de bugs, renovação dos certificados anuais, ajustes visuais sazonais, monitoramento de crashes via Firebase. Você não precisa contratar dev mobile interno.",
        },
        {
          q: "Posso vender cursos dentro do app?",
          a: "A estratégia mais comum é vender o curso no seu próprio site (com Pix, cartão ou boleto) e o app dá acesso após pagamento confirmado. Esse fluxo é compatível com as políticas de distribuição das lojas e evita comissões sobre vendas in-app.",
        },
        {
          q: "Vocês fazem só app pra Moodle ou também integrações com nossos sistemas?",
          a: "Fazemos integração com seu sistema acadêmico, ERP, gateway de pagamento, BI e qualquer fluxo que precise rodar dentro do app. App não é só vitrine — é canal operacional.",
        },
      ],
    },
    finalCta: {
      heading: "Vamos conversar?",
      lead: "Cada projeto é único — orçamento é montado depois de entender seu cenário. Fale com a gente no WhatsApp e retornamos com uma proposta detalhada em até 2 horas úteis.",
      ctaPrimary: "Solicitar orçamento no WhatsApp",
      ctaSecondary: "Falar agora no WhatsApp",
    },
  },
  es: {
    meta: {
      title: "Aplicación Moodle Personalizada | Agathas Web",
      description: "App Moodle con la marca de tu institución. Branding total, push notifications con tu nombre, modo offline y analytics propios. Presupuesto a medida.",
    },
    hero: {
      badge: "🆕 Servicio nuevo",
      title1: "Aplicación Moodle",
      title2: "Personalizada",
      lead: "Tu Moodle en el celular del alumno con la marca de tu institución. Icono propio, push notifications con tu nombre, distribuido como app independiente. A medida, con presupuesto previo.",
      ctaQuote: "Solicitar presupuesto",
      ctaWa: "Hablar por WhatsApp",
    },
    trustBullets: ["15+ años en Moodle", "Certificación Moodle Internacional", "Publicación punta a punta", "Soporte continuo incluido"],
    benefits: {
      heading: "7 ventajas del app personalizado",
      subheading: "Todo lo que tu institución necesita para tener su propia experiencia mobile — con tu marca en cada punto de contacto.",
      items: [
        { icon: "🎨", title: "Branding total", body: "Icono, splash, colores, tipografía: todo de tu institución." },
        { icon: "🔔", title: "Push con tu nombre", body: "\"Universidad X envió\" en vez de notificación genérica. Aperturas suben 2-4×." },
        { icon: "🔐", title: "SSO propio", body: "Google Workspace, Entra ID, biometría, sistema académico — todo nativo." },
        { icon: "🧩", title: "Integraciones específicas", body: "Exámenes con fiscalización por webcam, pagos in-app, carnet digital." },
        { icon: "🏪", title: "Tienda con tu marca", body: "El alumno busca el nombre de la institución y lo encuentra directo." },
        { icon: "⚙️", title: "Control del roadmap", body: "Bugs corregidos rápido. Features exclusivas a tu ritmo." },
        { icon: "📈", title: "Analytics propios", body: "Firebase, Mixpanel o solución propia. Ves qué clase se abandona y cuándo engancha." },
      ],
    },
    process: {
      heading: "Cómo funciona, del diagnóstico al lanzamiento",
      steps: [
        { num: "1", title: "Diagnóstico", body: "Reunión para entender base activa, perfil del alumno, integraciones y flujos. Propuesta detallada con cronograma personalizado." },
        { num: "2", title: "Setup de cuentas", body: "Cuentas de desarrollador en nombre de la institución. Política de privacidad y términos elaborados." },
        { num: "3", title: "Diseño & arquitectura", body: "Wireframes, identidad visual aplicada, definición de SSO, integraciones y analytics — todo aprobado antes de codificar." },
        { num: "4", title: "Desarrollo iterativo", body: "Builds de prueba continuos, feedback semanal y validación. Cada proyecto tiene su ritmo — entregamos cuando está listo." },
        { num: "5", title: "Envío y review", body: "Apps enviados con documentación completa. Acompañamos cada review y respondemos ajustes solicitados." },
        { num: "6", title: "Publicación + training", body: "Apps en el aire con tu marca. Entrenamos al equipo administrativo." },
        { num: "7", title: "Mantenimiento continuo", body: "Updates de Moodle, correcciones, renovación anual, soporte. SLA mensual fijo." },
      ],
    },
    who: {
      heading: "¿Tiene sentido para ti?",
      subheading: "Los 3 escenarios donde la inversión se paga con holgura.",
      items: [
        { icon: "🎓", title: "Curso pago de alto ticket", body: "MBA, posgrado, entrenamiento corporativo. Alumno premium no tolera experiencia genérica." },
        { icon: "📱", title: "300+ alumnos activos en mobile", body: "Ganancia de engagement (30-60%) genera más uso, mejor desempeño, menos churn." },
        { icon: "🥇", title: "Diferenciación competitiva", body: "Mercado saturado donde \"tener app propio\" es raro. Tu institución se vuelve referencia." },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Se necesita servidor Moodle distinto?", a: "No. El app consume la misma instalación Moodle que ya usas vía Web Services. Todo el backend sigue exactamente igual." },
        { q: "¿En cuánto tiempo está listo?", a: "Cada proyecto tiene su propio ritmo — depende del alcance, integraciones y flujos. Salimos del diagnóstico con cronograma personalizado, secuenciado por entregas iterativas." },
        { q: "¿La institución es dueña del app?", a: "Sí, totalmente. Las cuentas de desarrollador quedan en nombre de la institución. Si la relación con nosotros termina, mantienes el app." },
        { q: "¿Cuando Moodle actualiza, el app se rompe?", a: "Generalmente no. La API Web Services mantiene compatibilidad entre versiones mayores." },
        { q: "¿Cómo funciona el mantenimiento?", a: "SLA mensual fijo: updates, correcciones, renovaciones, soporte." },
        { q: "¿Puedo vender cursos dentro del app?", a: "La estrategia común es vender en tu propio sitio y el app da acceso después del pago confirmado. Este flujo evita comisiones sobre ventas in-app." },
        { q: "¿Hacen solo app o también integraciones?", a: "Integramos con tu sistema académico, ERP, gateway de pago, BI y cualquier flujo que necesite correr dentro del app." },
      ],
    },
    finalCta: {
      heading: "¿Conversamos?",
      lead: "Cada proyecto es único — el presupuesto se monta después de entender tu escenario. Háblanos por WhatsApp y retornamos con propuesta detallada en hasta 2 horas hábiles.",
      ctaPrimary: "Solicitar presupuesto por WhatsApp",
      ctaSecondary: "Hablar ahora por WhatsApp",
    },
  },
  "en-US": {
    meta: {
      title: "Custom Moodle App | Agathas Web",
      description: "Moodle app with your institution's brand. Full branding, push notifications under your name, offline mode and analytics. Custom quote.",
    },
    hero: {
      badge: "🆕 New service",
      title1: "Custom Moodle",
      title2: "Mobile App",
      lead: "Your Moodle on the student's phone with your institution's brand. Own icon, push notifications under your name, distributed as a standalone app. Tailored, with prior quote.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    trustBullets: ["15+ years on Moodle", "International Moodle certification", "End-to-end publishing", "Continuous support included"],
    benefits: {
      heading: "7 advantages of the custom app",
      subheading: "Everything your institution needs to have its own mobile experience — with your brand at every touchpoint.",
      items: [
        { icon: "🎨", title: "Full branding", body: "Icon, splash, colors, typography: all yours." },
        { icon: "🔔", title: "Push under your name", body: "\"X University sent\" instead of generic notifications. Opens go up 2-4×." },
        { icon: "🔐", title: "Own SSO", body: "Google Workspace, Entra ID, biometrics, academic system — all native." },
        { icon: "🧩", title: "Specific integrations", body: "Proctored exams via webcam, in-app payments, digital student ID." },
        { icon: "🏪", title: "Store under your brand", body: "Student searches your institution's name and finds the app directly." },
        { icon: "⚙️", title: "Roadmap control", body: "Bugs fixed quickly. Exclusive features at your pace." },
        { icon: "📈", title: "Own analytics", body: "Firebase, Mixpanel or proprietary. See which class drops off, which hour engages." },
      ],
    },
    process: {
      heading: "How it works, from diagnosis to launch",
      steps: [
        { num: "1", title: "Diagnosis", body: "Meeting to understand active base, student profile, required integrations and flows. Detailed proposal with personalized timeline." },
        { num: "2", title: "Account setup", body: "Developer accounts in the institution's name. Privacy policy and terms drafted." },
        { num: "3", title: "Design & architecture", body: "Wireframes, visual identity applied, SSO definition, integrations and analytics — all approved before coding starts." },
        { num: "4", title: "Iterative development", body: "Continuous test builds, weekly feedback and validation. Every project has its own pace — we ship when it's ready." },
        { num: "5", title: "Submission and review", body: "Apps submitted with complete documentation. We track each review and respond to any adjustments requested." },
        { num: "6", title: "Publication + training", body: "Apps live with your brand. We train the admin team to use the push notifications panel." },
        { num: "7", title: "Ongoing maintenance", body: "Moodle updates, fixes, annual certificate renewals, support. Fixed monthly SLA." },
      ],
    },
    who: {
      heading: "Does it make sense for you?",
      subheading: "The 3 scenarios where the investment pays off with margin.",
      items: [
        { icon: "🎓", title: "High-ticket paid course", body: "MBA, graduate, executive corporate training. Premium student doesn't tolerate generic experience." },
        { icon: "📱", title: "300+ active mobile students", body: "Engagement gain (30-60%) generates more usage, better performance, less churn." },
        { icon: "🥇", title: "Competitive differentiation", body: "Saturated market where \"having own app\" is rare. Your institution becomes the local reference." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Does it need a different Moodle server?", a: "No. The app consumes the same Moodle installation you already use via Web Services." },
        { q: "How long until the app is live?", a: "Every project has its own pace — depends on scope, integrations and critical flows. We leave diagnosis with a personalized timeline, sequenced by iterative deliveries." },
        { q: "Does the institution own the app?", a: "Yes, fully. Developer accounts are in the institution's name." },
        { q: "When Moodle updates, does the app break?", a: "Generally no. The Web Services API keeps compatibility between major versions." },
        { q: "How does maintenance work after launch?", a: "Fixed monthly SLA: updates, fixes, renewals, support." },
        { q: "Can I sell courses inside the app?", a: "The common strategy is to sell on your own site and the app grants access after confirmed payment. This flow avoids in-app sales commissions." },
        { q: "Do you also do integrations?", a: "We integrate with your academic system, ERP, payment gateway, BI and any flow that needs to run inside the app." },
      ],
    },
    finalCta: {
      heading: "Let's talk?",
      lead: "Every project is unique — quote is built after understanding your scenario. Message us on WhatsApp and we'll reply with a detailed proposal within 2 business hours.",
      ctaPrimary: "Request a quote on WhatsApp",
      ctaSecondary: "Chat on WhatsApp now",
    },
  },
  "en-GB": {
    meta: {
      title: "Custom Moodle App | Agathas Web",
      description: "Moodle app with your institution's brand. Full branding, push notifications under your name, offline mode and analytics. Custom quote.",
    },
    hero: {
      badge: "🆕 New service",
      title1: "Custom Moodle",
      title2: "Mobile App",
      lead: "Your Moodle on the student's phone with your institution's brand. Own icon, push notifications under your name, distributed as a standalone app. Tailored, with prior quote.",
      ctaQuote: "Request a quote",
      ctaWa: "Chat on WhatsApp",
    },
    trustBullets: ["15+ years on Moodle", "International Moodle certification", "End-to-end publishing", "Continuous support included"],
    benefits: {
      heading: "7 advantages of the custom app",
      subheading: "Everything your institution needs to have its own mobile experience — with your brand at every touchpoint.",
      items: [
        { icon: "🎨", title: "Full branding", body: "Icon, splash, colours, typography: all yours." },
        { icon: "🔔", title: "Push under your name", body: "\"X University sent\" instead of generic notifications. Opens go up 2-4×." },
        { icon: "🔐", title: "Own SSO", body: "Google Workspace, Entra ID, biometrics, academic system — all native." },
        { icon: "🧩", title: "Specific integrations", body: "Proctored exams via webcam, in-app payments, digital student ID." },
        { icon: "🏪", title: "Store under your brand", body: "Student searches your institution's name and finds the app directly." },
        { icon: "⚙️", title: "Roadmap control", body: "Bugs fixed quickly. Exclusive features at your pace." },
        { icon: "📈", title: "Own analytics", body: "Firebase, Mixpanel or proprietary. See which class drops off, which hour engages." },
      ],
    },
    process: {
      heading: "How it works, from diagnosis to launch",
      steps: [
        { num: "1", title: "Diagnosis", body: "Meeting to understand active base, student profile, required integrations and flows. Detailed proposal with personalised timeline." },
        { num: "2", title: "Account setup", body: "Developer accounts in the institution's name. Privacy policy and terms drafted." },
        { num: "3", title: "Design & architecture", body: "Wireframes, visual identity applied, SSO definition, integrations and analytics — all approved before coding starts." },
        { num: "4", title: "Iterative development", body: "Continuous test builds, weekly feedback and validation. Every project has its own pace — we ship when it's ready." },
        { num: "5", title: "Submission and review", body: "Apps submitted with complete documentation. We track each review and respond to any adjustments requested." },
        { num: "6", title: "Publication + training", body: "Apps live with your brand. We train the admin team to use the push notifications panel." },
        { num: "7", title: "Ongoing maintenance", body: "Moodle updates, fixes, annual certificate renewals, support. Fixed monthly SLA." },
      ],
    },
    who: {
      heading: "Does it make sense for you?",
      subheading: "The 3 scenarios where the investment pays off with margin.",
      items: [
        { icon: "🎓", title: "High-ticket paid course", body: "MBA, postgraduate, executive corporate training. Premium student doesn't tolerate generic experience." },
        { icon: "📱", title: "300+ active mobile students", body: "Engagement gain (30-60%) generates more usage, better performance, less churn." },
        { icon: "🥇", title: "Competitive differentiation", body: "Saturated market where \"having own app\" is rare. Your institution becomes the local reference." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Does it need a different Moodle server?", a: "No. The app consumes the same Moodle installation you already use via Web Services." },
        { q: "How long until the app is live?", a: "Every project has its own pace — depends on scope, integrations and critical flows. We leave diagnosis with a personalised timeline, sequenced by iterative deliveries." },
        { q: "Does the institution own the app?", a: "Yes, fully. Developer accounts are in the institution's name." },
        { q: "When Moodle updates, does the app break?", a: "Generally no. The Web Services API keeps compatibility between major versions." },
        { q: "How does maintenance work after launch?", a: "Fixed monthly SLA: updates, fixes, renewals, support." },
        { q: "Can I sell courses inside the app?", a: "The common strategy is to sell on your own site and the app grants access after confirmed payment. This flow avoids in-app sales commissions." },
        { q: "Do you also do integrations?", a: "We integrate with your academic system, ERP, payment gateway, BI and any flow that needs to run inside the app." },
      ],
    },
    finalCta: {
      heading: "Shall we talk?",
      lead: "Every project is unique — quote is built after understanding your scenario. Message us on WhatsApp and we'll reply with a detailed proposal within 2 business hours.",
      ctaPrimary: "Request a quote on WhatsApp",
      ctaSecondary: "Chat on WhatsApp now",
    },
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/produtos/aplicativo-moodle">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const s = STRINGS[lang];
  return buildPageMetadata({
    lang,
    path: "/produtos/aplicativo-moodle",
    title: s.meta.title,
    description: s.meta.description,
  });
}

export default async function AplicativoMoodlePage({ params }: PageProps<"/[lang]/produtos/aplicativo-moodle">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = STRINGS[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            {t.hero.badge}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t.hero.title1} <span className="text-orange-400">{t.hero.title2}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <div className="mt-8 flex justify-center">
            <WhatsAppCta
              label={t.hero.ctaQuote}
              prefillMessage="Olá! Vi a página do Aplicativo Moodle Personalizado e quero solicitar um orçamento."
              ctaContext="app-moodle-hero-primary"
              locale={lang}
              recaptchaSiteKey={recaptchaSiteKey}
              modalLabels={modalLabels}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-orange-500/30"
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400 justify-center">
            {t.trustBullets.map((b) => (
              <span key={b} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.benefits.heading}</h2>
            <p className="text-lg text-gray-300">{t.benefits.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.benefits.items.map((it) => (
              <div key={it.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.25)] transition-all duration-300">
                <span className="text-3xl mb-4 block">{it.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{it.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.process.heading}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {t.process.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pra quem é */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.who.heading}</h2>
            <p className="text-lg text-gray-300">{t.who.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.who.items.map((it) => (
              <div key={it.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700">
                <div className="text-3xl mb-3">{it.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{it.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-voyia-dark">
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

      {/* Final CTA — WhatsApp */}
      <section id="orcamento" className="py-24 bg-black">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-voyia-gray to-purple-600/10 border border-orange-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(249,115,22,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.ctaPrimary}
                  prefillMessage="Olá! Vi a página do Aplicativo Moodle Personalizado e quero solicitar um orçamento detalhado."
                  ctaContext="app-moodle-final-primary"
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
