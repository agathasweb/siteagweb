import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  isLocale,
  buildPageMetadata,
  type Locale,
} from "@/lib/i18n";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

const PREFILL: Record<string, string> = {
  "pt-BR": "Olá! Quero conhecer o SGA — Sistema de Gestão de Alunos.",
  es: "¡Hola! Quiero conocer el SGA — Sistema de Gestión de Alumnos.",
  "en-US": "Hi! I want to learn about SMS — Student Management System.",
  "en-GB": "Hi! I want to learn about SMS — Student Management System.",
};

const EXTRA: Record<Locale, {
  hero: { badge: string; subline: string };
  trust: { value: string; label: string }[];
  authority: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  problem: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  cases: { heading: string; subheading: string; items: { icon: string; segment: string; title: string; metric: string; quote: string }[] };
  modules: { heading: string; subheading: string; groups: { label: string; icon: string; items: string[] }[] };
  integrations: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  flow: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[] };
  support: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  whoFor: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; cta: string };
  prefillGeneric: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🏆 SGA Agathas · gestão Moodle desde 2009",
      subline: "Sistema de Gestão de Alunos integrado nativamente ao Moodle. Importação em massa, envio de credenciais, controle financeiro, certificados, painel pra pais/responsáveis e relatórios — operando em produção há mais de uma década.",
    },
    trust: [
      { value: "15+", label: "Anos com EAD" },
      { value: "1M+", label: "Alunos cadastrados pelo SGA" },
      { value: "200+", label: "Instituições atendidas" },
      { value: "99.9%", label: "Uptime contratual" },
    ],
    authority: {
      heading: "Por que o SGA é o sistema de gestão Moodle de referência no Brasil",
      subheading: "Construído por quem opera Moodle há mais de 15 anos. Cada feature do SGA nasceu de uma dor real que vimos repetida em dezenas de instituições.",
      items: [
        { icon: "🎓", title: "Code-first, não no-code", desc: "Não é integração via Zapier. É plugin Moodle proprietário + sistema web acoplado, falando direto com o banco. Sem latência, sem job em fila, sem erro de sincronização." },
        { icon: "🛠️", title: "15 anos lapidando", desc: "O SGA é o nosso produto mais maduro. A cada novo cliente, a cada nova versão do Moodle, evoluiu — hoje cobre tudo que uma instituição de ensino precisa no dia-a-dia." },
        { icon: "🇧🇷", title: "Pensado pro Brasil", desc: "Nota fiscal de serviço, boleto/Pix, mensalidade, controle de inadimplência, integração com órgãos reguladores, LGPD aplicada. Sistema gringo não entende nossa burocracia." },
        { icon: "📊", title: "Dashboards reais", desc: "Não é relatório PDF estático. É BI ao vivo: matrículas hoje, alunos ativos no celular, taxa de conclusão por curso, inadimplência projetada, churn previsto." },
        { icon: "🤝", title: "Suporte que entende EAD", desc: "Nosso suporte já configurou turma, importou 50k alunos, debugou nota incorreta. Quando você pergunta algo, recebe resposta de quem já resolveu antes." },
        { icon: "🔓", title: "Você é dono dos dados", desc: "Acesso direto ao banco SQL, export completo a qualquer momento, backup diário. Não é refém — pode levar tudo se quiser." },
      ],
    },
    problem: {
      heading: "O que o Moodle puro não resolve — e o SGA sim",
      subheading: "Moodle é excelente como AVA. Mas a parte operacional da instituição (matrícula, cobrança, comunicação, certificado fiscal) precisa de outro sistema. O SGA é esse outro sistema.",
      items: [
        { icon: "📥", title: "Matrícula em massa", desc: "Subir 5.000 alunos no Moodle via CSV padrão dá problema em cada coluna. O SGA importa de qualquer planilha, valida CPF, cria contas em batch e envia credenciais — sem erro." },
        { icon: "💸", title: "Mensalidade & inadimplência", desc: "Moodle não tem financeiro. SGA tem: emissão de boleto/Pix, controle de mensalidade, bloqueio automático do aluno inadimplente, NF-e por aluno. Integra com ASAAS, Pagar.me e bancos." },
        { icon: "📄", title: "Certificado fiscal & jurídico", desc: "Geramos certificados com modelos da sua instituição, assinatura digital, validação via QR code, registro em cartório eletrônico, e arquivo permanente." },
        { icon: "📱", title: "Comunicação com aluno e pai", desc: "WhatsApp Oficial integrado (via Voyia), e-mail transacional, SMS, push do app — tudo a partir do mesmo lugar. Aluno faltou 3 aulas? Pai recebe alerta automático." },
        { icon: "🔄", title: "Sincronia com sistema acadêmico", desc: "Já tem TOTVS, SOPHIA, MV ou Senior? SGA conecta via API ou ETL agendado, mantendo aluno, curso e nota sincronizados nos dois lados." },
        { icon: "📊", title: "Engajamento & churn previsto", desc: "Algoritmo que monitora engajamento e prevê alunos em risco de evasão 30 dias antes. Sua coordenação age antes do aluno sumir, não depois." },
      ],
    },
    cases: {
      heading: "Casos reais de SGA em produção",
      subheading: "Recortes anonimizados de instituições que confiaram a operação acadêmica ao SGA Agathas.",
      items: [
        { icon: "🎓", segment: "Universidade EAD", title: "Importação de 50.000 alunos em uma única madrugada", metric: "47 minutos · 0 falha · 0 duplicata", quote: "Migração de plataforma legada. Pipeline ETL validou CPF, mesclou duplicatas, criou contas Moodle e disparou e-mail+WhatsApp com credenciais. Aluno acordou já matriculado." },
        { icon: "🏫", segment: "Colégio K-12", title: "Painel do responsável: 92% dos pais ativos no app", metric: "8.500 alunos · 92% engajamento parental", quote: "App próprio (ver /produtos/aplicativo-moodle) integrado ao SGA. Pai vê presença, notas, comunicados, paga mensalidade in-app. Inadimplência caiu 38% em 6 meses." },
        { icon: "🏢", segment: "Treinamento corporativo", title: "Compliance NR-35 automatizado para 12.000 colaboradores", metric: "12k operários · 100% certificados em dia", quote: "Pipeline automatizado: RH manda planilha de admissão, SGA cria conta, matricula em NR obrigatórias, emite certificado, alerta vencimento 60 dias antes. Auditoria do MTE aprovada." },
        { icon: "🌍", segment: "Escola de idiomas internacional", title: "Multi-instância: 14 unidades, 1 SGA", metric: "14 filiais · gestão centralizada · relatórios consolidados", quote: "Cada unidade tem seu Moodle, mas o SGA é um só — vê tudo, compara, identifica unidade com melhor conversão e replica o playbook." },
        { icon: "💼", segment: "Curso preparatório premium", title: "Pagamento Pix dentro do Moodle, recibo em 3s", metric: "+R$ 1,8M/mês processados · 0% chargeback", quote: "Aluno paga matrícula via Pix dentro do Moodle. SGA confirma, libera curso, emite NF-e, registra no financeiro — em menos de 3 segundos." },
        { icon: "🏛️", segment: "Escola de governo", title: "Capacitação de 28.000 servidores públicos", metric: "28k servidores · trilhas obrigatórias · 89% conclusão", quote: "SGA organiza por secretaria, distribui matrículas conforme cargo, gera relatório de cumprimento de carga horária pra Controladoria. LGPD aplicada do dia 1." },
      ],
    },
    modules: {
      heading: "Módulos do SGA",
      subheading: "Sistema completo de gestão acadêmica, organizado em módulos que você ativa conforme a necessidade.",
      groups: [
        { label: "Acadêmico", icon: "🎓", items: ["Gestão de cursos, turmas, períodos letivos", "Matriz curricular e pré-requisitos", "Trilhas de aprendizagem personalizadas", "Frequência e plano de aula", "Avaliações e provas com fiscalização", "Diários eletrônicos"] },
        { label: "Aluno & responsável", icon: "👨‍🎓", items: ["Cadastro completo do aluno (LGPD)", "Painel do responsável (pai/empresa)", "Histórico escolar digital", "Documentos do aluno em pasta digital", "Carteirinha digital com QR code", "Solicitações online (declaração, transferência, etc.)"] },
        { label: "Financeiro", icon: "💸", items: ["Mensalidade automatizada (boleto/Pix/cartão)", "Plano de pagamento parcelado", "Controle de inadimplência", "NF-e por aluno (NFS-e municipal)", "Conciliação bancária", "Integração ASAAS, Pagar.me, Stripe, Iugu"] },
        { label: "Comunicação", icon: "💬", items: ["WhatsApp Oficial (via Voyia)", "E-mail transacional + marketing", "SMS pra avisos críticos", "Push notification (app próprio)", "Templates aprovados pela Meta", "Cadência automática de follow-up"] },
        { label: "Certificados & jurídico", icon: "📜", items: ["Geração automática de certificado", "Modelo personalizado da instituição", "Assinatura digital ICP-Brasil", "Validação via QR code público", "Histórico imutável de emissões", "Registro em cartório eletrônico (opcional)"] },
        { label: "Relatórios & BI", icon: "📊", items: ["Dashboard em tempo real", "Engajamento e tempo de tela", "Taxa de conclusão por curso", "Previsão de evasão (IA)", "Funil de matrícula", "Export pra Excel, Google Sheets, Looker, Power BI"] },
      ],
    },
    integrations: {
      heading: "Integrações nativas",
      subheading: "O SGA não é uma ilha — conecta com os sistemas que sua instituição já usa.",
      items: [
        { icon: "🎓", title: "Moodle (qualquer versão LTS)", desc: "Integração nativa via plugin proprietário Agathas + Web Services. Sincronia em tempo real de usuário, curso, matrícula, nota." },
        { icon: "💳", title: "Gateways de pagamento", desc: "ASAAS, Pagar.me, Stripe, Iugu, Cielo, PagSeguro. Boleto, Pix, cartão de crédito recorrente, débito automático." },
        { icon: "📱", title: "WhatsApp Business API", desc: "Integração nativa com Voyia. Comunicação operacional (boletim, ausência, mensalidade) via WhatsApp Oficial." },
        { icon: "🏢", title: "Sistemas acadêmicos legados", desc: "TOTVS RM, SOPHIA, MV Educare, Senior, Sponte, Lyceum — via API REST ou ETL agendado." },
        { icon: "📊", title: "BI & Analytics", desc: "Power BI, Looker Studio, Metabase, Google Sheets — via API ou conexão direta ao banco." },
        { icon: "🔐", title: "SSO corporativo", desc: "Google Workspace educacional, Microsoft Entra ID, SAML 2.0, LDAP/AD, Keycloak." },
        { icon: "📧", title: "E-mail transacional", desc: "Amazon SES, SendGrid, Postmark, Mailgun. Templates HTML com personalização por aluno." },
        { icon: "🇧🇷", title: "Órgãos públicos", desc: "INEP (Censo Escolar), MEC, secretarias estaduais. Exportação de dados no padrão exigido por cada órgão." },
        { icon: "🤖", title: "IA & automação", desc: "Claude, GPT, Gemini, DeepSeek pra tutor virtual, correção de redação, geração de questões, atendimento ao aluno." },
      ],
    },
    flow: {
      heading: "Como o SGA opera no seu dia a dia",
      subheading: "Da matrícula à emissão do certificado, sem cair em planilha intermediária.",
      steps: [
        { num: "1", title: "Captação", desc: "Lead chega via landing page, anúncio ou indicação. SGA cria pré-cadastro, qualifica e roteia pro vendedor certo. CRM integrado." },
        { num: "2", title: "Matrícula", desc: "Aluno assina contrato digital, paga matrícula via Pix, e recebe credenciais Moodle por e-mail + WhatsApp — tudo automático, em segundos." },
        { num: "3", title: "Operação", desc: "Aluno entra no Moodle, faz curso, paga mensalidade. SGA monitora frequência, engajamento, financeiro. Coordenação age só quando precisa." },
        { num: "4", title: "Comunicação", desc: "Boletim mensal pro pai via WhatsApp, alerta de inadimplência, lembrete de aula, parabenização por marco — tudo automatizado, todos personalizados." },
        { num: "5", title: "Conclusão", desc: "Aluno conclui curso → SGA gera certificado com assinatura digital, salva em pasta permanente, envia por WhatsApp e adiciona ao histórico." },
        { num: "6", title: "Relacionamento", desc: "Após formado, aluno continua no CRM pra upsell (cursos avançados), indicação de novos alunos, alumni network." },
      ],
    },
    support: {
      heading: "Suporte sênior e operação assistida",
      subheading: "SGA não é só software — vem com gente que sabe operar EAD.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal direto com o time técnico. Sem fila, sem central de atendimento. Resposta em até 15 minutos para incidentes críticos." },
        { icon: "🎯", title: "Onboarding assistido", desc: "Configuração inicial, importação de alunos legados, integração com seu Moodle, treinamento da equipe — incluso no setup." },
        { icon: "🎓", title: "Treinamento contínuo", desc: "Capacitação da equipe acadêmica e administrativa. Material gravado, sessões ao vivo, certificação interna do uso do SGA." },
        { icon: "🛡️", title: "SLA contratual", desc: "Uptime 99.9%, resposta a crítico ≤ 15min, resolução ≤ 2h. Multa contratual se descumprirmos." },
        { icon: "📊", title: "Revisão trimestral", desc: "Reunião com sócios da Agathas pra revisar uso do SGA, identificar oportunidades, sugerir novas features baseadas na sua realidade." },
        { icon: "🔄", title: "Updates automáticos", desc: "Novas features liberadas continuamente. Você não paga por upgrade — assinatura SGA inclui evolução perpétua do produto." },
      ],
    },
    whoFor: {
      heading: "Pra quem o SGA foi feito",
      subheading: "Atendemos do produtor de curso solo ao sistema federal de educação — com a mesma seriedade técnica.",
      items: [
        { icon: "🎓", title: "Faculdades & universidades", desc: "1k-100k alunos. Multi-campus, multi-curso, integração com sistema acadêmico, emissão de diplomas e mensalidade." },
        { icon: "🏫", title: "Escolas K-12 & cursinhos", desc: "Ensino básico, médio, vestibular. Painel pra pai/responsável, controle de presença, contrato anual, mensalidade." },
        { icon: "🏭", title: "Treinamento corporativo", desc: "RH de empresas grandes. Trilhas obrigatórias por cargo, NRs, compliance, certificação interna." },
        { icon: "💼", title: "Produtores de curso", desc: "Quem quer sair de Hotmart/Kiwify e ter Moodle próprio com financeiro, fiscal, marca own e controle total." },
        { icon: "🏛️", title: "Órgãos públicos & ONGs", desc: "Escolas de governo, capacitação de servidores, treinamento de conselheiros, EAD obrigatória." },
        { icon: "🌍", title: "Idiomas & técnico", desc: "Escolas de idioma, cursos preparatórios, formação técnica (TI, saúde, jurídico) com avaliação automatizada." },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "O SGA funciona com o meu Moodle atual?", a: "Sim. SGA é agnóstico de hospedagem — funciona com qualquer Moodle 4.x ou superior, hospedado em qualquer lugar (na Agathas ou em outro fornecedor). Conectamos via Web Services + plugin proprietário." },
        { q: "Preciso trocar de Moodle pra usar o SGA?", a: "Não. SGA conecta no seu Moodle atual. Se você está em Moodle 3.x, sugerimos atualizar pra 4.x LTS antes — mas é trabalho do projeto de implantação, não obrigatório." },
        { q: "Quanto tempo até estar operando?", a: "Setup inicial em 2-4 semanas (importação de alunos, integração Moodle, treinamento). Cada projeto tem seu ritmo conforme o volume e integrações necessárias." },
        { q: "Quanto custa?", a: "Mensalidade por volume de alunos ativos. Starter (até 500 alunos): R$ 690/mês. Professional (até 5k): R$ 1.890/mês. Enterprise (50k+): sob consulta. Setup inicial conforme escopo." },
        { q: "Vocês importam meus alunos do sistema atual?", a: "Sim, incluído no setup. Importamos de CSV, planilha, banco SQL, sistema acadêmico via API. Validamos CPF, deduplicamos, criamos contas Moodle e enviamos credenciais." },
        { q: "SGA emite nota fiscal de serviço (NFS-e)?", a: "Sim, integração nativa com prefeituras das principais capitais brasileiras (SP, RJ, BH, POA, Curitiba, etc.). Para municípios menores, usamos integradores como NFE.io ou Nuvem Fiscal." },
        { q: "E se a gente quiser parar de usar?", a: "Sem fidelidade longa. Cancelamento com 30 dias de aviso. Entregamos dump completo do banco (SQL) + export CSV de tudo. Você é dono dos seus dados, ponto." },
        { q: "Tem app mobile pra aluno e pai?", a: "Sim, opcional. App com a marca da sua instituição, integrado ao SGA e Moodle. Veja /produtos/aplicativo-moodle pra detalhes." },
        { q: "Tem LGPD aplicada?", a: "Sim, do dia 1. DPO designado, política de retenção, criptografia de PII, log de auditoria, direito de exclusão automatizado, contrato de tratamento de dados pronto." },
        { q: "Atende fora do Brasil?", a: "Sim — clientes em Portugal, Espanha, EUA e Reino Unido. SGA suporta múltiplas moedas, idiomas e regulação local. Faturamento em BRL, EUR, USD ou GBP." },
      ],
    },
    finalCta: {
      heading: "Vamos conversar sobre a operação acadêmica da sua instituição?",
      lead: "Demonstração ao vivo de 45 minutos, com sua realidade na tela. Mostramos o SGA configurado pra você, sem promessa genérica.",
      cta: "Agendar demonstração",
    },
    prefillGeneric: "Olá! Vi a página do SGA e quero agendar uma demonstração.",
  },
  es: {
    hero: {
      badge: "🏆 SGA Agathas · gestión Moodle desde 2009",
      subline: "Sistema de Gestión de Alumnos integrado nativamente a Moodle. Importación masiva, envío de credenciales, control financiero, certificados, panel para padres y reportes — operando en producción hace más de una década.",
    },
    trust: [
      { value: "15+", label: "Años con e-learning" },
      { value: "1M+", label: "Alumnos gestionados" },
      { value: "200+", label: "Instituciones" },
      { value: "99.9%", label: "Uptime contractual" },
    ],
    authority: {
      heading: "Por qué SGA es referencia en gestión Moodle",
      subheading: "Construido por quien opera Moodle hace más de 15 años. Cada feature nació de un dolor real.",
      items: [
        { icon: "🎓", title: "Code-first, no no-code", desc: "Plugin Moodle propio + sistema web acoplado al banco. Sin latencia, sin job en cola." },
        { icon: "🛠️", title: "15 años puliendo", desc: "Producto más maduro. Cada nuevo cliente lo hizo evolucionar." },
        { icon: "🌎", title: "Pensado para Latinoamérica", desc: "Factura electrónica, pagos locales, control de morosidad, regulación local." },
        { icon: "📊", title: "Dashboards reales", desc: "BI en vivo: matrículas hoy, alumnos activos, tasa de conclusión, morosidad proyectada." },
        { icon: "🤝", title: "Soporte que entiende e-learning", desc: "Ya configuró clases, importó 50k alumnos, debug nota incorrecta." },
        { icon: "🔓", title: "Eres dueño de los datos", desc: "Acceso directo a SQL, export completo, backup diario." },
      ],
    },
    problem: {
      heading: "Lo que Moodle no resuelve — y SGA sí",
      subheading: "Moodle es excelente como LMS. Pero la parte operativa (matrícula, cobranza, comunicación, certificado) necesita otro sistema.",
      items: [
        { icon: "📥", title: "Matrícula masiva", desc: "Subir 5.000 alumnos en Moodle vía CSV da problema. SGA importa, valida, crea cuentas y envía credenciales — sin error." },
        { icon: "💸", title: "Mensualidad & morosidad", desc: "SGA: emisión de pago, control, bloqueo automático, factura. Integra con pasarelas locales." },
        { icon: "📄", title: "Certificado fiscal & jurídico", desc: "Modelos personalizados, firma digital, validación QR, registro permanente." },
        { icon: "📱", title: "Comunicación con alumno y padre", desc: "WhatsApp Oficial (vía Voyia), email, SMS, push — todo desde un solo lugar." },
        { icon: "🔄", title: "Sincronía con sistema académico", desc: "Conecta vía API o ETL agendado con TOTVS, SOPHIA, MV, Senior." },
        { icon: "📊", title: "Engagement & churn predicho", desc: "Algoritmo que predice evasión 30 días antes." },
      ],
    },
    cases: {
      heading: "Casos reales en producción",
      subheading: "Recortes anonimizados.",
      items: [
        { icon: "🎓", segment: "Universidad e-learning", title: "Importación de 50.000 alumnos en una madrugada", metric: "47min · 0 fallas · 0 duplicados", quote: "ETL validó CPF, dedupó, creó cuentas Moodle, envió credenciales." },
        { icon: "🏫", segment: "Colegio K-12", title: "Panel del padre: 92% de padres activos en el app", metric: "8.500 alumnos · 92% engagement", quote: "App propio + SGA. Morosidad cayó 38% en 6 meses." },
        { icon: "🏢", segment: "Entrenamiento corporativo", title: "Compliance NR-35 automatizado para 12.000 colaboradores", metric: "12k operarios · 100% certificados al día", quote: "Pipeline automatizado. Auditoría del MTE aprobada." },
        { icon: "🌍", segment: "Escuela de idiomas", title: "Multi-instancia: 14 unidades, 1 SGA", metric: "Gestión centralizada, reportes consolidados", quote: "Ve todo, compara, identifica unidad con mejor conversión." },
        { icon: "💼", segment: "Curso preparatorio premium", title: "Pago dentro de Moodle, recibo en 3s", metric: "+R$ 1,8M/mes · 0% chargeback", quote: "Alumno paga matrícula, SGA confirma, libera curso, emite factura — <3s." },
        { icon: "🏛️", segment: "Escuela de gobierno", title: "Capacitación de 28.000 servidores públicos", metric: "28k servidores · 89% conclusión", quote: "Organiza por secretaría, reporta carga horaria. GDPR aplicada." },
      ],
    },
    modules: {
      heading: "Módulos del SGA",
      subheading: "Sistema completo organizado en módulos que activas según necesidad.",
      groups: [
        { label: "Académico", icon: "🎓", items: ["Cursos, clases, períodos lectivos", "Matriz curricular", "Trilhas de aprendizaje", "Asistencia y plan de clase", "Evaluaciones con fiscalización", "Diarios electrónicos"] },
        { label: "Alumno & padre", icon: "👨‍🎓", items: ["Registro completo (GDPR)", "Panel del padre/empresa", "Historial escolar digital", "Documentos en carpeta digital", "Carnet digital con QR", "Solicitudes online"] },
        { label: "Financiero", icon: "💸", items: ["Mensualidad automatizada", "Plan de pago parcial", "Control de morosidad", "Factura por alumno", "Conciliación bancaria", "Integración con pasarelas"] },
        { label: "Comunicación", icon: "💬", items: ["WhatsApp Oficial (Voyia)", "Email transacional", "SMS críticos", "Push notification", "Templates Meta aprobados", "Cadencia automática"] },
        { label: "Certificados", icon: "📜", items: ["Generación automática", "Modelo personalizado", "Firma digital", "Validación QR", "Historial inmutable", "Registro en cartorio"] },
        { label: "Reportes & BI", icon: "📊", items: ["Dashboard en tiempo real", "Engagement", "Conclusión por curso", "Previsión de evasión (IA)", "Funnel de matrícula", "Export Excel, Sheets, Power BI"] },
      ],
    },
    integrations: {
      heading: "Integraciones nativas",
      subheading: "SGA no es isla — conecta con tus sistemas.",
      items: [
        { icon: "🎓", title: "Moodle (cualquier LTS)", desc: "Integración nativa vía plugin propio + Web Services." },
        { icon: "💳", title: "Pasarelas de pago", desc: "ASAAS, Pagar.me, Stripe, Iugu, Cielo, PagSeguro." },
        { icon: "📱", title: "WhatsApp Business API", desc: "Integración nativa con Voyia." },
        { icon: "🏢", title: "Sistemas académicos", desc: "TOTVS RM, SOPHIA, MV Educare, Senior, Sponte, Lyceum." },
        { icon: "📊", title: "BI & Analytics", desc: "Power BI, Looker Studio, Metabase, Google Sheets." },
        { icon: "🔐", title: "SSO corporativo", desc: "Google Workspace, Microsoft Entra ID, SAML 2.0, LDAP/AD." },
        { icon: "📧", title: "Email transacional", desc: "Amazon SES, SendGrid, Postmark, Mailgun." },
        { icon: "🇧🇷", title: "Órganos públicos", desc: "INEP, MEC, secretarías estaduales." },
        { icon: "🤖", title: "IA & automación", desc: "Claude, GPT, Gemini, DeepSeek." },
      ],
    },
    flow: {
      heading: "Cómo SGA opera tu día a día",
      subheading: "De la matrícula al certificado, sin caer en planilla intermedia.",
      steps: [
        { num: "1", title: "Captación", desc: "Lead llega → pre-registro, calificación, routing al vendedor. CRM integrado." },
        { num: "2", title: "Matrícula", desc: "Contrato digital, pago Pix, credenciales por email + WhatsApp — automático." },
        { num: "3", title: "Operación", desc: "Alumno entra en Moodle, paga mensualidad. SGA monitorea." },
        { num: "4", title: "Comunicación", desc: "Boletín mensual al padre, alertas, lembrança — todo automatizado." },
        { num: "5", title: "Conclusión", desc: "Certificado con firma digital, archivo permanente, envío por WhatsApp." },
        { num: "6", title: "Relacionamiento", desc: "Alumni en CRM, upsell, indicaciones." },
      ],
    },
    support: {
      heading: "Soporte senior y operación asistida",
      subheading: "SGA no es solo software — viene con gente que sabe operar e-learning.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal directo, sin cola. Respuesta en 15min para críticos." },
        { icon: "🎯", title: "Onboarding asistido", desc: "Configuración, importación, integración, capacitación — incluido." },
        { icon: "🎓", title: "Capacitación continua", desc: "Material grabado, sesiones en vivo, certificación interna." },
        { icon: "🛡️", title: "SLA contractual", desc: "Uptime 99.9%, respuesta crítico ≤ 15min, resolución ≤ 2h." },
        { icon: "📊", title: "Revisión trimestral", desc: "Reunión para revisar uso e identificar oportunidades." },
        { icon: "🔄", title: "Updates automáticos", desc: "Features nuevas continuamente, sin pagar upgrade." },
      ],
    },
    whoFor: {
      heading: "Para quién es SGA",
      subheading: "Del productor de cursos solo al sistema federal — misma seriedad.",
      items: [
        { icon: "🎓", title: "Universidades", desc: "1k-100k alumnos. Multi-campus, multi-curso, sistema académico." },
        { icon: "🏫", title: "Colegios K-12", desc: "Panel del padre, asistencia, contrato anual, mensualidad." },
        { icon: "🏭", title: "Entrenamiento corporativo", desc: "Trilhas obligatorias, compliance, certificación interna." },
        { icon: "💼", title: "Productores de curso", desc: "Salir de Hotmart/Teachable, tener Moodle propio con financiero." },
        { icon: "🏛️", title: "Sector público & ONG", desc: "Escuelas de gobierno, capacitación de servidores." },
        { icon: "🌍", title: "Idiomas & técnico", desc: "Escuelas de idioma, preparatorios, formación técnica." },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿SGA funciona con mi Moodle actual?", a: "Sí. Funciona con Moodle 4.x+. Conectamos vía Web Services + plugin propio." },
        { q: "¿Necesito cambiar de Moodle?", a: "No. SGA se conecta a tu Moodle actual." },
        { q: "¿Cuánto hasta operar?", a: "Setup en 2-4 semanas." },
        { q: "¿Cuánto cuesta?", a: "Starter (hasta 500): R$ 690/mes. Professional (hasta 5k): R$ 1.890/mes." },
        { q: "¿Importan mis alumnos?", a: "Sí, incluido en setup." },
        { q: "¿Emite factura electrónica?", a: "Sí, integración nativa con prefeituras brasileñas." },
        { q: "¿Y si queremos parar?", a: "Sin fidelidad larga. 30 días de aviso, dump completo del banco." },
        { q: "¿App móvil?", a: "Sí, opcional. Ver /produtos/aplicativo-moodle." },
        { q: "¿GDPR aplicada?", a: "Sí, del día 1." },
        { q: "¿Atienden fuera de Brasil?", a: "Sí — Portugal, España, EE. UU., Reino Unido." },
      ],
    },
    finalCta: {
      heading: "¿Conversamos sobre la operación académica de tu institución?",
      lead: "Demostración en vivo de 45 minutos, con tu realidad en pantalla.",
      cta: "Agendar demostración",
    },
    prefillGeneric: "¡Hola! Vi la página del SGA y quiero agendar una demostración.",
  },
  "en-US": {
    hero: {
      badge: "🏆 SGA by Agathas · Moodle management since 2009",
      subline: "Student Management System natively integrated with Moodle. Bulk import, credential dispatch, financial control, certificates, parent panel and reports — operating in production for over a decade.",
    },
    trust: [
      { value: "15+", label: "Years in e-learning" },
      { value: "1M+", label: "Students managed" },
      { value: "200+", label: "Institutions served" },
      { value: "99.9%", label: "Contractual uptime" },
    ],
    authority: {
      heading: "Why SGA is the reference Moodle management system",
      subheading: "Built by people operating Moodle for 15+ years. Every feature was born from a real pain seen repeated across institutions.",
      items: [
        { icon: "🎓", title: "Code-first, not no-code", desc: "Proprietary Moodle plugin + web system talking directly to the DB. No latency, no queued jobs." },
        { icon: "🛠️", title: "15 years polishing", desc: "Our most mature product. Every client made it evolve." },
        { icon: "🌎", title: "Multi-region ready", desc: "Tax invoicing, local payments, dropout control, local regulation." },
        { icon: "📊", title: "Real dashboards", desc: "Live BI: today's enrollments, active mobile students, completion rate, projected delinquency." },
        { icon: "🤝", title: "Support that understands e-learning", desc: "We've configured classes, imported 50k students, debugged wrong grades." },
        { icon: "🔓", title: "You own the data", desc: "Direct SQL access, full export anytime, daily backup." },
      ],
    },
    problem: {
      heading: "What Moodle alone doesn't solve — and SGA does",
      subheading: "Moodle is excellent as LMS. But the institution's operational side (enrollment, billing, communication, tax-compliant certificate) needs another system.",
      items: [
        { icon: "📥", title: "Bulk enrollment", desc: "Uploading 5,000 students via standard CSV is error-prone. SGA validates ID, dedupes, creates Moodle accounts and sends credentials — without error." },
        { icon: "💸", title: "Tuition & delinquency", desc: "Moodle has no finance. SGA does: invoice generation, tuition control, automatic blocking of delinquent students, invoice per student." },
        { icon: "📄", title: "Tax & legal certificate", desc: "Certificates with institutional templates, digital signature, QR validation, permanent archive." },
        { icon: "📱", title: "Communication with student & parent", desc: "Official WhatsApp (via Voyia), transactional email, SMS, app push — all from the same place." },
        { icon: "🔄", title: "Sync with academic system", desc: "Already have a SIS? SGA connects via API or scheduled ETL, keeping student/course/grade synced." },
        { icon: "📊", title: "Engagement & predicted churn", desc: "Algorithm that predicts dropout 30 days before. Coordination acts before, not after." },
      ],
    },
    cases: {
      heading: "Real SGA cases in production",
      subheading: "Anonymized snapshots of institutions that trust their academic operations to SGA.",
      items: [
        { icon: "🎓", segment: "E-learning university", title: "50,000 students imported in one overnight run", metric: "47 minutes · 0 failures · 0 duplicates", quote: "Migration from legacy. ETL validated IDs, merged duplicates, created Moodle accounts and sent credentials. Students woke up enrolled." },
        { icon: "🏫", segment: "K-12 school", title: "Parent panel: 92% of parents active on app", metric: "8,500 students · 92% parental engagement", quote: "Branded app integrated with SGA. Parent sees attendance, grades, pays tuition in-app. Delinquency fell 38% in 6 months." },
        { icon: "🏢", segment: "Corporate training", title: "Automated compliance for 12,000 employees", metric: "12k workers · 100% certifications up to date", quote: "Automated pipeline. Audit approved first round." },
        { icon: "🌍", segment: "International language school", title: "Multi-tenant: 14 units, 1 SGA", metric: "14 units · centralized management · consolidated reports", quote: "Sees everything, compares units, identifies winning playbooks." },
        { icon: "💼", segment: "Premium prep course", title: "In-Moodle payment, receipt in 3s", metric: "+USD 350k/month processed · 0% chargeback", quote: "Student pays inside Moodle. SGA confirms, unlocks course, issues invoice — in <3 seconds." },
        { icon: "🏛️", segment: "Government school", title: "Training 28,000 civil servants", metric: "28k servants · mandatory tracks · 89% completion", quote: "Organizes by department, generates compliance reports. GDPR applied from day 1." },
      ],
    },
    modules: {
      heading: "SGA modules",
      subheading: "Complete system organized in modules you activate by need.",
      groups: [
        { label: "Academic", icon: "🎓", items: ["Courses, classes, terms", "Curriculum & prerequisites", "Personalized learning paths", "Attendance & lesson plan", "Proctored assessments", "Electronic diaries"] },
        { label: "Student & parent", icon: "👨‍🎓", items: ["Full registration (GDPR)", "Parent/employer panel", "Digital school record", "Document folder", "Digital ID with QR", "Online requests"] },
        { label: "Financial", icon: "💸", items: ["Automated tuition", "Installment plans", "Delinquency control", "Per-student invoice", "Bank reconciliation", "Gateway integration"] },
        { label: "Communication", icon: "💬", items: ["Official WhatsApp (Voyia)", "Transactional email", "SMS for critical", "Push notification", "Meta-approved templates", "Automated follow-up"] },
        { label: "Certificates & legal", icon: "📜", items: ["Automatic generation", "Custom template", "Digital signature", "QR validation", "Immutable history", "Electronic notary"] },
        { label: "Reports & BI", icon: "📊", items: ["Real-time dashboard", "Engagement", "Completion per course", "Dropout prediction (AI)", "Enrollment funnel", "Export to Excel, Sheets, Power BI"] },
      ],
    },
    integrations: {
      heading: "Native integrations",
      subheading: "SGA is not an island — connects with your existing systems.",
      items: [
        { icon: "🎓", title: "Moodle (any LTS)", desc: "Native integration via proprietary plugin + Web Services." },
        { icon: "💳", title: "Payment gateways", desc: "Stripe, ASAAS, Pagar.me, Iugu, Cielo, PagSeguro." },
        { icon: "📱", title: "WhatsApp Business API", desc: "Native integration with Voyia." },
        { icon: "🏢", title: "Legacy academic systems", desc: "TOTVS, SOPHIA, MV, Senior, Sponte, Lyceum via API or ETL." },
        { icon: "📊", title: "BI & Analytics", desc: "Power BI, Looker Studio, Metabase, Google Sheets." },
        { icon: "🔐", title: "Corporate SSO", desc: "Google Workspace, Microsoft Entra ID, SAML 2.0, LDAP/AD." },
        { icon: "📧", title: "Transactional email", desc: "Amazon SES, SendGrid, Postmark, Mailgun." },
        { icon: "🇧🇷", title: "Government bodies", desc: "INEP, MEC, state secretariats (Brazil)." },
        { icon: "🤖", title: "AI & automation", desc: "Claude, GPT, Gemini, DeepSeek." },
      ],
    },
    flow: {
      heading: "How SGA operates your day-to-day",
      subheading: "From enrollment to certificate, without falling into intermediate spreadsheets.",
      steps: [
        { num: "1", title: "Acquisition", desc: "Lead arrives → pre-registration, qualification, routing to sales. CRM integrated." },
        { num: "2", title: "Enrollment", desc: "Digital contract, online payment, Moodle credentials via email + WhatsApp — automated, in seconds." },
        { num: "3", title: "Operation", desc: "Student enters Moodle, takes course, pays tuition. SGA monitors." },
        { num: "4", title: "Communication", desc: "Monthly report to parent via WhatsApp, alerts, reminders — all automated, personalized." },
        { num: "5", title: "Completion", desc: "Course completed → SGA generates digitally-signed certificate, archives, sends via WhatsApp." },
        { num: "6", title: "Relationship", desc: "After graduation, student stays in CRM for upsell, referral, alumni network." },
      ],
    },
    support: {
      heading: "Senior support and assisted operation",
      subheading: "SGA isn't just software — it comes with people who know how to operate e-learning.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel. ≤15min response for critical." },
        { icon: "🎯", title: "Assisted onboarding", desc: "Initial setup, legacy import, integration, training — included." },
        { icon: "🎓", title: "Continuous training", desc: "Recorded material, live sessions, internal certification." },
        { icon: "🛡️", title: "Contractual SLA", desc: "99.9% uptime, ≤15min critical response, ≤2h resolution." },
        { icon: "📊", title: "Quarterly review", desc: "Meeting to review SGA usage, identify opportunities." },
        { icon: "🔄", title: "Automatic updates", desc: "New features released continuously, no upgrade fee." },
      ],
    },
    whoFor: {
      heading: "Who SGA is for",
      subheading: "From solo course producers to federal education systems — same technical seriousness.",
      items: [
        { icon: "🎓", title: "Universities", desc: "1k-100k students. Multi-campus, multi-course, academic integration." },
        { icon: "🏫", title: "K-12 & prep schools", desc: "Parent panel, attendance, annual contract, tuition." },
        { icon: "🏭", title: "Corporate training", desc: "Mandatory tracks by role, compliance, internal certification." },
        { icon: "💼", title: "Course producers", desc: "Leave Hotmart/Teachable, have own Moodle with finance." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Government schools, civil servant training, NGO capacity building." },
        { icon: "🌍", title: "Languages & technical", desc: "Language schools, prep courses, technical training." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Does SGA work with my current Moodle?", a: "Yes. Works with any Moodle 4.x+ hosted anywhere. We connect via Web Services + proprietary plugin." },
        { q: "Do I need to change Moodle?", a: "No. SGA connects to your current Moodle." },
        { q: "How long until operating?", a: "Initial setup in 2-4 weeks." },
        { q: "How much does it cost?", a: "Starter (up to 500): USD 175/month. Professional (up to 5k): USD 480/month. Enterprise (50k+): on request." },
        { q: "Do you import my students?", a: "Yes, included in setup." },
        { q: "Does SGA issue tax invoices?", a: "Native integration with Brazilian municipalities. For other regions we integrate with local providers." },
        { q: "What if we want to stop?", a: "No long lock-in. 30 days notice, full DB dump delivered." },
        { q: "Mobile app for student and parent?", a: "Yes, optional. See /produtos/aplicativo-moodle." },
        { q: "GDPR applied?", a: "Yes, from day 1." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US and UK." },
      ],
    },
    finalCta: {
      heading: "Let's talk about your institution's academic operations?",
      lead: "Live 45-minute demo with your reality on screen. We show SGA configured for you, no generic promises.",
      cta: "Schedule demo",
    },
    prefillGeneric: "Hi! I saw the SGA page and want to schedule a demo.",
  },
  "en-GB": {
    hero: {
      badge: "🏆 SGA by Agathas · Moodle management since 2009",
      subline: "Student Management System natively integrated with Moodle. Bulk import, credential dispatch, financial control, certificates, parent panel and reports — operating in production for over a decade.",
    },
    trust: [
      { value: "15+", label: "Years in e-learning" },
      { value: "1M+", label: "Students managed" },
      { value: "200+", label: "Institutions served" },
      { value: "99.9%", label: "Contractual uptime" },
    ],
    authority: {
      heading: "Why SGA is the reference Moodle management system",
      subheading: "Built by people operating Moodle for 15+ years.",
      items: [
        { icon: "🎓", title: "Code-first, not no-code", desc: "Proprietary Moodle plugin + web system talking directly to the DB." },
        { icon: "🛠️", title: "15 years polishing", desc: "Our most mature product. Every client made it evolve." },
        { icon: "🌎", title: "Multi-region ready", desc: "Tax invoicing, local payments, dropout control, local regulation." },
        { icon: "📊", title: "Real dashboards", desc: "Live BI: enrollments today, active students, completion rates." },
        { icon: "🤝", title: "Support that understands e-learning", desc: "We've configured classes, imported 50k students." },
        { icon: "🔓", title: "You own the data", desc: "Direct SQL access, full export anytime, daily backup." },
      ],
    },
    problem: {
      heading: "What Moodle alone doesn't solve — and SGA does",
      subheading: "Moodle is excellent as LMS. But the operational side needs another system.",
      items: [
        { icon: "📥", title: "Bulk enrolment", desc: "SGA validates ID, dedupes, creates Moodle accounts and sends credentials." },
        { icon: "💸", title: "Tuition & delinquency", desc: "Invoice generation, tuition control, automatic blocking, invoice per student." },
        { icon: "📄", title: "Tax & legal certificate", desc: "Custom templates, digital signature, QR validation, permanent archive." },
        { icon: "📱", title: "Communication with student & parent", desc: "WhatsApp, email, SMS, app push — all from one place." },
        { icon: "🔄", title: "Sync with academic system", desc: "Connects via API or scheduled ETL." },
        { icon: "📊", title: "Engagement & predicted churn", desc: "Algorithm that predicts dropout 30 days before." },
      ],
    },
    cases: {
      heading: "Real SGA cases in production",
      subheading: "Anonymised snapshots.",
      items: [
        { icon: "🎓", segment: "E-learning university", title: "50,000 students imported overnight", metric: "47min · 0 failures · 0 duplicates", quote: "ETL validated IDs, deduped, created Moodle accounts." },
        { icon: "🏫", segment: "K-12 school", title: "Parent panel: 92% of parents active", metric: "8,500 students · 92% engagement", quote: "Branded app + SGA. Delinquency fell 38% in 6 months." },
        { icon: "🏢", segment: "Corporate training", title: "Automated compliance for 12,000 employees", metric: "12k workers · 100% up to date", quote: "Audit approved." },
        { icon: "🌍", segment: "International language school", title: "Multi-tenant: 14 units, 1 SGA", metric: "Centralised management", quote: "Identifies winning playbooks." },
        { icon: "💼", segment: "Premium prep course", title: "In-Moodle payment, receipt in 3s", metric: "+GBP 280k/month · 0% chargeback", quote: "Pay inside Moodle, unlock course, issue invoice — <3s." },
        { icon: "🏛️", segment: "Government school", title: "Training 28,000 civil servants", metric: "28k servants · 89% completion", quote: "Compliance reports. GDPR applied." },
      ],
    },
    modules: {
      heading: "SGA modules",
      subheading: "Complete system organised in modules.",
      groups: [
        { label: "Academic", icon: "🎓", items: ["Courses, classes, terms", "Curriculum", "Learning paths", "Attendance", "Proctored assessments", "Electronic diaries"] },
        { label: "Student & parent", icon: "👨‍🎓", items: ["Full registration (GDPR)", "Parent panel", "Digital school record", "Document folder", "Digital ID with QR", "Online requests"] },
        { label: "Financial", icon: "💸", items: ["Automated tuition", "Instalment plans", "Delinquency control", "Per-student invoice", "Bank reconciliation", "Gateway integration"] },
        { label: "Communication", icon: "💬", items: ["WhatsApp (Voyia)", "Transactional email", "SMS critical", "Push notification", "Meta templates", "Automated follow-up"] },
        { label: "Certificates", icon: "📜", items: ["Automatic generation", "Custom template", "Digital signature", "QR validation", "Immutable history"] },
        { label: "Reports & BI", icon: "📊", items: ["Real-time dashboard", "Engagement", "Completion", "Dropout prediction (AI)", "Enrolment funnel", "Export"] },
      ],
    },
    integrations: {
      heading: "Native integrations",
      subheading: "Connects with your existing systems.",
      items: [
        { icon: "🎓", title: "Moodle (any LTS)", desc: "Native integration via proprietary plugin." },
        { icon: "💳", title: "Payment gateways", desc: "Stripe, ASAAS, Pagar.me, Iugu." },
        { icon: "📱", title: "WhatsApp Business API", desc: "Native via Voyia." },
        { icon: "🏢", title: "Academic systems", desc: "TOTVS, SOPHIA, MV, Senior." },
        { icon: "📊", title: "BI & Analytics", desc: "Power BI, Looker Studio, Metabase." },
        { icon: "🔐", title: "SSO", desc: "Google Workspace, Entra ID, SAML, LDAP." },
        { icon: "📧", title: "Transactional email", desc: "SES, SendGrid, Postmark, Mailgun." },
        { icon: "🇧🇷", title: "Government bodies", desc: "INEP, MEC, state secretariats." },
        { icon: "🤖", title: "AI & automation", desc: "Claude, GPT, Gemini." },
      ],
    },
    flow: {
      heading: "How SGA operates your day-to-day",
      subheading: "From enrolment to certificate.",
      steps: [
        { num: "1", title: "Acquisition", desc: "Lead arrives, qualification, routing." },
        { num: "2", title: "Enrolment", desc: "Digital contract, online payment, credentials — automated." },
        { num: "3", title: "Operation", desc: "Student takes course, pays tuition. SGA monitors." },
        { num: "4", title: "Communication", desc: "Monthly reports, alerts, reminders — automated." },
        { num: "5", title: "Completion", desc: "Digitally-signed certificate, archived, sent via WhatsApp." },
        { num: "6", title: "Relationship", desc: "Alumni in CRM, upsell, referrals." },
      ],
    },
    support: {
      heading: "Senior support and assisted operation",
      subheading: "SGA comes with people who know e-learning.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel. ≤15min critical response." },
        { icon: "🎯", title: "Assisted onboarding", desc: "Included in setup." },
        { icon: "🎓", title: "Continuous training", desc: "Recorded + live sessions." },
        { icon: "🛡️", title: "Contractual SLA", desc: "99.9% uptime." },
        { icon: "📊", title: "Quarterly review", desc: "Identify opportunities." },
        { icon: "🔄", title: "Automatic updates", desc: "Continuous features, no upgrade fee." },
      ],
    },
    whoFor: {
      heading: "Who SGA is for",
      subheading: "Solo producer to federal system.",
      items: [
        { icon: "🎓", title: "Universities", desc: "1k-100k students." },
        { icon: "🏫", title: "K-12 & prep schools", desc: "Parent panel, attendance, tuition." },
        { icon: "🏭", title: "Corporate training", desc: "Mandatory tracks, compliance." },
        { icon: "💼", title: "Course producers", desc: "Own Moodle with finance." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Government schools, capacity building." },
        { icon: "🌍", title: "Languages & technical", desc: "Language schools, prep courses, technical training." },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Does SGA work with my current Moodle?", a: "Yes. Any Moodle 4.x+." },
        { q: "Do I need to change Moodle?", a: "No." },
        { q: "How long until operating?", a: "2-4 weeks." },
        { q: "How much does it cost?", a: "Starter (up to 500): GBP 140/month. Professional (up to 5k): GBP 380/month." },
        { q: "Do you import my students?", a: "Yes, included." },
        { q: "Does SGA issue tax invoices?", a: "Native Brazilian integration; other regions via partners." },
        { q: "What if we want to stop?", a: "No long lock-in. 30 days notice, full DB dump." },
        { q: "Mobile app?", a: "Yes, optional. See /produtos/aplicativo-moodle." },
        { q: "GDPR applied?", a: "Yes." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US and UK." },
      ],
    },
    finalCta: {
      heading: "Shall we talk about your academic operations?",
      lead: "Live 45-minute demo with your reality on screen.",
      cta: "Schedule demo",
    },
    prefillGeneric: "Hi! I saw the SGA page and want to schedule a demo.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/produtos/sga">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return buildPageMetadata({
    lang,
    path: "/produtos/sga",
    title: dict.productsPages.sga.metadata.title,
    description: dict.productsPages.sga.metadata.description,
  });
}

export default async function SGAPage({ params }: PageProps<"/[lang]/produtos/sga">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.productsPages.sga;
  const x = EXTRA[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(147,51,234,0.3), transparent 40%), radial-gradient(circle at 80% 60%, rgba(34,197,94,0.12), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/40 rounded-full text-sm font-semibold text-purple-300 mb-8">{x.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            <span className="text-voyia-blue">{t.hero.titleHighlight}</span> {t.hero.titleSuffix}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <p className="mt-4 text-base text-purple-200/80 max-w-3xl mx-auto">{x.hero.subline}</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {x.trust.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-purple-400 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Autoridade */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.authority.heading}</h2>
            <p className="text-lg text-gray-300">{x.authority.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.authority.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-purple-500/40 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que Moodle puro não resolve */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.problem.heading}</h2>
            <p className="text-lg text-gray-300">{x.problem.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.problem.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.cases.heading}</h2>
            <p className="text-lg text-gray-300">{x.cases.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.cases.items.map((c) => (
              <div key={c.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.2)] flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold">{c.segment}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{c.title}</h3>
                <div className="text-xs text-purple-300 font-mono mb-3">{c.metric}</div>
                <p className="text-sm text-gray-300 leading-relaxed flex-1">{c.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.modules.heading}</h2>
            <p className="text-lg text-gray-300">{x.modules.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.modules.groups.map((group) => (
              <div key={group.label} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{group.icon}</span>
                  <h3 className="text-lg font-bold text-purple-300 uppercase tracking-wider">{group.label}</h3>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start text-sm text-gray-300">
                      <svg className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.integrations.heading}</h2>
            <p className="text-lg text-gray-300">{x.integrations.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.integrations.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fluxo */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.flow.heading}</h2>
            <p className="text-lg text-gray-300">{x.flow.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.flow.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suporte */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.support.heading}</h2>
            <p className="text-lg text-gray-300">{x.support.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.support.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pra quem */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.whoFor.heading}</h2>
            <p className="text-lg text-gray-300">{x.whoFor.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.whoFor.items.map((item) => (
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
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-10 text-center">{x.faq.heading}</h2>
          <div className="space-y-4">
            {x.faq.items.map((item) => (
              <details key={item.q} className="group bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-semibold hover:bg-black/20 transition-colors list-none">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 text-purple-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 via-voyia-gray to-purple-700/10 border border-purple-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(147,51,234,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{x.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{x.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={x.finalCta.cta}
                  prefillMessage={PREFILL[lang]}
                  ctaContext="sga-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-purple-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
