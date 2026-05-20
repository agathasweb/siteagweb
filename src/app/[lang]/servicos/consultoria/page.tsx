import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  isLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  type Locale,
} from "@/lib/i18n";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

const STRINGS: Record<Locale, {
  hero: { badge: string; titlePrefix: string; titleHighlight: string; lead: string; cta: string };
  authority: { heading: string; subheading: string; pillars: { icon: string; title: string; desc: string }[] };
  diagnosis: { heading: string; subheading: string; intro: string; positives: { heading: string; items: string[] }; negatives: { heading: string; items: string[] } };
  areas: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  frameworks: { heading: string; subheading: string; items: { label: string; desc: string }[] };
  process: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[] };
  services: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  deliverables: { heading: string; subheading: string; items: string[] };
  who: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  proof: { heading: string; subheading: string; items: { value: string; label: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; cta: string };
  prefill: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🧭 Diagnóstico técnico independente · 15+ anos",
      titlePrefix: "Consultoria que enxerga",
      titleHighlight: "o que está travando o seu negócio",
      lead: "Auditamos sistemas, processos, infraestrutura, time e operação — e devolvemos um diagnóstico honesto com o que está funcionando, o que está custando dinheiro silenciosamente e o que precisa mudar agora. CTO as a Service da Agathas Web.",
      cta: "Agendar diagnóstico gratuito",
    },
    authority: {
      heading: "Por que a Agathas pode auditar a sua empresa",
      subheading: "Não somos consultores teóricos. Operamos, codamos e mantemos sistemas em produção há 15+ anos — então sabemos onde olhar, o que perguntar e o que de fato dá problema.",
      pillars: [
        { icon: "🏗️", title: "Operamos a stack que auditamos", desc: "ERP, Moodle, e-commerce, SaaS, WhatsApp API, infraestrutura cloud, banco de dados em produção. Você não vai ouvir teoria — vai ouvir o que já vimos quebrar e o que conserta de fato." },
        { icon: "🌍", title: "+300 projetos em 4 países", desc: "Brasil, Portugal, Espanha, EUA e Reino Unido. PMEs, scaleups, instituições de ensino, indústrias e órgãos públicos. Repertório que vê padrão onde o time interno vê só ruído." },
        { icon: "🎓", title: "Certificações que importam", desc: "Moodle HQ, Microsoft, Google Cloud, AWS, Meta Business Partner. Certificação não é o que entrega resultado — mas comprova que sabemos do que estamos falando." },
        { icon: "🔍", title: "Foco em diagnóstico, não em venda", desc: "Saímos da auditoria com o relatório — e você decide o que fazer. Não somos pagos por revenda de software, então a recomendação é honesta de verdade. Sem conflito de interesse." },
        { icon: "📐", title: "Visão sistêmica, não só TI", desc: "Auditamos tecnologia, processos, time, operação, marketing, vendas. TI não vive isolada — e diagnóstico parcial não resolve nada." },
        { icon: "🧑‍💼", title: "Atendimento sênior direto", desc: "Quem audita a sua empresa é sócio/CTO da Agathas — não junior, não estagiário, não terceirizado. Reunião direta, decisão direta." },
      ],
    },
    diagnosis: {
      heading: "O que identificamos em uma auditoria — bom e ruim",
      subheading: "Saímos do diagnóstico com um relatório que mapeia, lado a lado, o que está funcionando bem (mantenha) e o que está silenciosamente sangrando recurso (corrija). Direto ao ponto.",
      intro: "Em cada engajamento revisamos os 12 vetores abaixo. O relatório final cruza os dois lados — você vê o quadro completo, sem maquiagem.",
      positives: {
        heading: "✅ Pontos positivos identificados",
        items: [
          "Stack tecnológica madura e bem suportada (sem dívida técnica imediata)",
          "Processos automatizados que economizam horas-pessoa de fato mensuráveis",
          "Integrações estáveis com fornecedores críticos (ERP, gateway, fiscal, Moodle)",
          "Equipe interna com domínio das ferramentas-chave do dia-a-dia",
          "Backup e recuperação funcionando — testados, não só configurados",
          "Métricas de negócio acompanhadas em dashboards confiáveis",
          "Cultura de revisão de código, CI/CD ou QA implantada e usada",
          "Conformidade LGPD/GDPR e segurança de dados em níveis aceitáveis",
          "Custo de infraestrutura proporcional ao volume operado",
          "SLAs com fornecedores compatíveis com a criticidade do serviço",
          "Documentação suficiente para onboarding sem fricção",
          "Caminhos de escala já mapeados (não vai estourar no próximo trimestre)",
        ],
      },
      negatives: {
        heading: "⚠️ Pontos críticos e gargalos identificados",
        items: [
          "Sistemas legados sem manutenção — alto risco de incidente irrecuperável",
          "Processos manuais críticos sem redundância (perda de R$ X/mês silencioso)",
          "Integrações frágeis com pontos únicos de falha não monitorados",
          "Dependência de pessoas-chave sem documentação (bus factor 1)",
          "Backup configurado mas nunca testado — backup que não restaura não é backup",
          "Métricas de produto/marketing/operação dispersas em planilhas desencontradas",
          "Senhas compartilhadas, acessos não revogados, ausência de SSO/MFA",
          "LGPD/GDPR aplicada parcialmente — passivo legal latente",
          "Custo cloud 30-60% acima do necessário por configuração sub-ótima",
          "SLA do fornecedor inferior ao SLA prometido ao cliente final",
          "Falta de roadmap técnico — time apaga incêndio em vez de evoluir",
          "Time pequeno demais ou grande demais para o estágio da empresa",
        ],
      },
    },
    areas: {
      heading: "Vetores que auditamos",
      subheading: "Cada um desses pontos é avaliado com profundidade técnica e traduzido em uma linguagem que o C-level entende — sem jargão e com prioridade clara.",
      items: [
        { icon: "🏛️", title: "Arquitetura de sistemas", desc: "Diagrama atual vs. ideal, pontos de gargalo, débito técnico, fragmentação, decisões erradas que custam caro." },
        { icon: "☁️", title: "Infraestrutura & cloud", desc: "Custos, dimensionamento, alta disponibilidade, observabilidade, monitoramento, custos ocultos, lock-in com fornecedor." },
        { icon: "🔐", title: "Segurança & LGPD", desc: "OWASP Top 10, gestão de secrets, política de acesso, criptografia, política LGPD/GDPR, plano de incidente, auditoria de logs." },
        { icon: "📊", title: "Dados & BI", desc: "Modelagem, qualidade de dados, governança, relatórios confiáveis vs. fictícios, métricas de produto vs. métricas de vaidade." },
        { icon: "⚙️", title: "Processos & operação", desc: "Mapeamento de processos, automação possível, gargalos humanos, redundância, tempo de ciclo, custo por operação." },
        { icon: "👥", title: "Time & estrutura", desc: "Skill gap, senioridade, bus factor, cultura de revisão, processos de onboarding, retenção, plano de evolução de carreira." },
        { icon: "🔗", title: "Integrações & APIs", desc: "Mapa de integrações, fragilidades, lock-in, governança de API, monitoramento, custos por chamada, alternativas." },
        { icon: "💻", title: "Qualidade de código", desc: "Análise estática, cobertura de testes, padrões, complexidade ciclomática, dependências desatualizadas, segurança." },
        { icon: "🚀", title: "Performance & escala", desc: "Auditoria de performance (front e back), banco, cache, CDN, load testing, plano de escala vs. crescimento esperado." },
        { icon: "💸", title: "Custos & ROI", desc: "Onde o dinheiro está indo, ROI por sistema/feature, custo por cliente, oportunidades imediatas de redução." },
        { icon: "📈", title: "Marketing & vendas tech", desc: "GTM, CAPI, tracking, atribuição, CRM, automação de vendas, integração com WhatsApp, score de leads." },
        { icon: "🎯", title: "Estratégia & roadmap", desc: "Alinhamento entre tecnologia, produto e negócio. Roadmap honesto, sequenciado por impacto vs. esforço." },
      ],
    },
    frameworks: {
      heading: "Frameworks que aplicamos",
      subheading: "Combinamos metodologias maduras para que o diagnóstico seja rigoroso, comparável e acionável — nada de \"olhômetro\".",
      items: [
        { label: "WSJF (Weighted Shortest Job First)", desc: "Prioriza intervenções por custo do atraso × esforço, separando rapidamente o que dói mais agora do que pode esperar." },
        { label: "Wardley Mapping", desc: "Mapeia componentes e dependências do negócio para revelar onde investir, onde manter e onde aceitar a commodity." },
        { label: "DORA + SPACE metrics", desc: "Métricas objetivas de engenharia — frequência de deploy, lead time, MTTR, satisfação do time — para comparar com o estado da arte do setor." },
        { label: "ISO 27001 (sob medida)", desc: "Aplicamos os controles relevantes para o porte da empresa, sem entregar um documento de 200 páginas que ninguém vai ler." },
        { label: "OWASP Top 10 + ASVS", desc: "Checklist de segurança aplicada a código, infra e API. Testes manuais quando faz sentido, ferramental automático para o resto." },
        { label: "Five Whys + Fishbone", desc: "Para incidentes recorrentes e gargalos crônicos. Não tratamos sintoma; vamos até a causa raiz." },
      ],
    },
    process: {
      heading: "Como funciona uma consultoria com a gente",
      subheading: "Em 4 a 6 semanas você sai com diagnóstico, plano e prioridades — não com um cartão visita.",
      steps: [
        { num: "1", title: "Conversa inicial (gratuita)", desc: "30-60 minutos pra entendermos o cenário, os incômodos atuais, o time, a stack, os números. Saímos com um escopo proposto." },
        { num: "2", title: "Mergulho técnico (1-2 semanas)", desc: "Entrevistas com C-level e time, acesso read-only aos sistemas, análise de código, infra, banco e métricas. Sem interromper o operacional." },
        { num: "3", title: "Análise cruzada (1 semana)", desc: "Cruzamos dados técnicos com indicadores de negócio. Identificamos correlação entre dor financeira e causa técnica/operacional." },
        { num: "4", title: "Apresentação do diagnóstico", desc: "Reunião executiva com os pontos positivos, pontos críticos, plano de ação e quick wins. Documento entregue na hora, com vídeo opcional pra revisar depois." },
        { num: "5", title: "Roadmap & priorização", desc: "Construção conjunta do roadmap dos próximos 3-12 meses, com critérios de priorização (WSJF, impacto/esforço, risco)." },
        { num: "6", title: "Acompanhamento opcional", desc: "Mensal ou trimestral. Atuamos como CTO as a Service, revisamos roadmap, validamos decisões críticas e cobramos execução do time." },
      ],
    },
    services: {
      heading: "Modalidades de consultoria",
      subheading: "Da auditoria pontual ao CTO mensal — desenhamos o engajamento conforme o momento da empresa.",
      items: [
        { icon: "🔬", title: "Diagnóstico técnico completo", desc: "Auditoria de 4-6 semanas com relatório final, plano de ação e apresentação executiva. Pontual, com escopo fechado." },
        { icon: "👨‍💼", title: "CTO as a Service", desc: "Liderança técnica fracionada (8-40h/mês). Reuniões semanais com C-level e time, revisão de decisões, validação de contratações." },
        { icon: "🎓", title: "Consultoria Moodle estratégica", desc: "Para instituições de ensino: escolha de versão, plataforma, infraestrutura, plugins, integrações e SGA. 15+ anos de Moodle em produção." },
        { icon: "🏗️", title: "Arquitetura de novo produto", desc: "Antes de codar: validamos a arquitetura, stack, custo de cloud, escolha de banco, modelo multi-tenant. Evita decisões caras." },
        { icon: "🔐", title: "Auditoria de segurança & LGPD", desc: "OWASP Top 10, política de acessos, criptografia, plano de incidente, mapeamento LGPD. Entrega pronta pra auditor externo." },
        { icon: "💸", title: "Auditoria de custo cloud", desc: "Análise de AWS/GCP/Cloudflare/Vercel. Identificamos onde cortar 20-60% sem perder performance. Pagamos com o que economizamos." },
        { icon: "📈", title: "Auditoria de marketing tech", desc: "GTM, CAPI, pixel, CRM, atribuição. Vemos onde tracking está furando e quanto isso custa em otimização de campanhas." },
        { icon: "🧑‍🏫", title: "Mentoria técnica do time", desc: "Acompanhamento mensal do time de TI: revisão de PRs, mentorias 1:1, suporte em decisões arquiteturais." },
      ],
    },
    deliverables: {
      heading: "O que você recebe no fim",
      subheading: "Documento executivo curto, anexos técnicos profundos, vídeo de apresentação e plano de ação sequenciado.",
      items: [
        "Relatório executivo de 15-30 páginas com priorização clara",
        "Diagrama de arquitetura atual e arquitetura proposta",
        "Lista de pontos positivos (manter) e pontos críticos (corrigir)",
        "Plano de ação dos próximos 3, 6 e 12 meses, com responsáveis sugeridos",
        "Estimativa de custo de cada intervenção e ROI esperado",
        "Quick wins (resultados em 30 dias) destacados separadamente",
        "Vídeo da apresentação executiva (pra rever com sócio/board)",
        "Anexos técnicos: auditoria de segurança, custo cloud, qualidade de código",
        "Lista de fornecedores recomendados (e a evitar) com justificativa técnica",
        "Termo de confidencialidade (NDA) bilateral antes do projeto começar",
      ],
    },
    who: {
      heading: "Para quem esta consultoria foi feita",
      subheading: "Atendemos sócios, CEOs, CFOs, COOs e CTOs que precisam de um olhar externo, técnico e independente.",
      items: [
        { icon: "🏢", title: "PMEs em crescimento", desc: "Empresas de 20-300 funcionários onde TI virou gargalo e ninguém internamente tem tempo (ou repertório) para fazer o diagnóstico." },
        { icon: "🚀", title: "Scaleups pós-Série A", desc: "Captou rodada, precisa escalar sem quebrar. Auditamos arquitetura, time e processos antes do crescimento expor falhas estruturais." },
        { icon: "🎓", title: "Instituições de ensino", desc: "Universidades, escolas, cursos preparatórios. Auditoria do ecossistema Moodle/EAD com olhar de quem opera há 15 anos." },
        { icon: "🏭", title: "Indústrias & varejo", desc: "Operações com ERP, e-commerce, logística e fiscal. Avaliamos integrações, automação possível e custo escondido." },
        { icon: "🏛️", title: "Órgãos públicos & ONGs", desc: "Diagnóstico técnico imparcial para licitações, modernização e renegociação de contratos com fornecedores incumbentes." },
        { icon: "💼", title: "Board & investidores", desc: "Due diligence técnica antes de investimento ou aquisição. Avaliamos código, infra, time e passivos antes de qualquer assinatura." },
      ],
    },
    proof: {
      heading: "Números que sustentam a autoridade",
      subheading: "",
      items: [
        { value: "15+", label: "Anos auditando e operando sistemas em produção" },
        { value: "300+", label: "Projetos em PMEs, scaleups e órgãos públicos" },
        { value: "4 países", label: "Brasil, Portugal, Espanha, EUA e Reino Unido" },
        { value: "5.0★", label: "Avaliação Google em 17 reviews" },
        { value: "0", label: "Conflito de interesse — não revendemos software" },
        { value: "100%", label: "Equipe sênior brasileira, sem terceirização" },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "Vocês precisam ter acesso aos nossos sistemas?", a: "Acesso read-only ao código, infra, banco e dashboards. Tudo regido por NDA assinado antes da gente entrar. Você pode revogar a qualquer momento — sem retaliação contratual." },
        { q: "Quanto tempo dura uma auditoria?", a: "Diagnóstico completo: 4-6 semanas. Auditoria pontual de segurança ou cloud: 2-3 semanas. CTO as a Service: contrato mensal recorrente." },
        { q: "Quanto custa?", a: "Diagnóstico completo: a partir de R$ 18 mil (escopo PME). CTO as a Service: R$ 6-15 mil/mês conforme horas. Auditorias pontuais: R$ 6-12 mil. Orçamento fechado depois da conversa inicial gratuita." },
        { q: "Vocês implementam o plano depois?", a: "Podemos, mas você não é obrigado. Entregamos o plano com fornecedores sugeridos e você decide se contrata a Agathas, fornecedor de fora, ou faz internamente. Diagnóstico é nosso produto, não isca de venda." },
        { q: "E se o nosso problema for cultural ou de gestão, não técnico?", a: "Mapeamos isso também — e dizemos com clareza. Em 30-40% das auditorias o gargalo crítico é processo, time ou gestão, não tecnologia. Honestidade é o produto." },
        { q: "Atendem fora do Brasil?", a: "Sim. Já atuamos em Portugal, Espanha, EUA e Reino Unido. Faturamento em BRL, USD, EUR ou GBP, com nota fiscal e contrato bilíngue se necessário." },
        { q: "Vocês assinam NDA?", a: "Sempre. Modelo bilateral pronto, ou usamos o seu se preferir. Tudo que vemos durante o engajamento é confidencial — escrito em cláusula com prazo de 5 anos." },
        { q: "Vocês falam com nosso time, ou só com a diretoria?", a: "Os dois. Falamos com C-level, gerência e devs/ops/marketing. Quem vê o problema no dia-a-dia raramente é quem nos contrata — e a verdade aparece no nível técnico." },
        { q: "E se ficarmos com você como CTO fracionado?", a: "Modelo CTO as a Service: pacote mensal de horas (8 a 40h/mês). Cuidamos de decisões arquiteturais, validação de contratações, revisão de roadmap e blindagem técnica do C-level." },
      ],
    },
    finalCta: {
      heading: "Vamos olhar o seu negócio com lupa?",
      lead: "Reunião inicial de 30-60 minutos, sem compromisso. Saímos da call com um diagnóstico preliminar, escopo proposto e investimento estimado.",
      cta: "Agendar diagnóstico gratuito",
    },
    prefill: "Olá! Vi a página de Consultoria e quero agendar um diagnóstico técnico da minha empresa.",
  },
  es: {
    hero: {
      badge: "🧭 Diagnóstico técnico independiente · 15+ años",
      titlePrefix: "Consultoría que ve",
      titleHighlight: "lo que está frenando tu negocio",
      lead: "Auditamos sistemas, procesos, infraestructura, equipo y operación — y devolvemos un diagnóstico honesto con lo que funciona, lo que cuesta dinero silenciosamente y lo que necesita cambiar ahora. CTO as a Service de Agathas Web.",
      cta: "Agendar diagnóstico gratuito",
    },
    authority: {
      heading: "Por qué Agathas puede auditar tu empresa",
      subheading: "No somos consultores teóricos. Operamos, codificamos y mantenemos sistemas en producción hace 15+ años — sabemos dónde mirar, qué preguntar y qué realmente da problemas.",
      pillars: [
        { icon: "🏗️", title: "Operamos el stack que auditamos", desc: "ERP, Moodle, e-commerce, SaaS, WhatsApp API, cloud, BD en producción. Nada de teoría — solo lo que ya vimos romperse y lo que arregla de verdad." },
        { icon: "🌍", title: "+300 proyectos en 4 países", desc: "Brasil, Portugal, España, EE. UU. y Reino Unido. PYMEs, scaleups, instituciones educativas, industrias y sector público." },
        { icon: "🎓", title: "Certificaciones relevantes", desc: "Moodle HQ, Microsoft, Google Cloud, AWS, Meta Business Partner." },
        { icon: "🔍", title: "Foco en diagnóstico, no en venta", desc: "No revendemos software. La recomendación es honesta de verdad, sin conflicto de interés." },
        { icon: "📐", title: "Visión sistémica", desc: "Auditamos tecnología, procesos, equipo, operación, marketing y ventas. TI no vive aislada." },
        { icon: "🧑‍💼", title: "Atención senior directa", desc: "Quien audita es socio/CTO de Agathas — no junior, no tercerizado." },
      ],
    },
    diagnosis: {
      heading: "Lo que identificamos en una auditoría — lo bueno y lo malo",
      subheading: "Salimos del diagnóstico con un informe que mapea, lado a lado, qué funciona (mantener) y qué sangra recursos silenciosamente (corregir). Directo al grano.",
      intro: "En cada engagement revisamos los 12 vectores siguientes. El informe final cruza ambos lados — ves el cuadro completo, sin maquillaje.",
      positives: {
        heading: "✅ Puntos positivos identificados",
        items: [
          "Stack tecnológico maduro y bien soportado (sin deuda técnica inmediata)",
          "Procesos automatizados que ahorran horas-persona mensurables",
          "Integraciones estables con proveedores críticos (ERP, gateway, fiscal, Moodle)",
          "Equipo interno con dominio de las herramientas-clave",
          "Backup y recuperación funcionando — probados, no solo configurados",
          "Métricas de negocio acompañadas en dashboards confiables",
          "Cultura de revisión de código, CI/CD o QA implantada y usada",
          "Conformidad GDPR/LGPD y seguridad de datos en niveles aceptables",
          "Costo de infraestructura proporcional al volumen operado",
          "SLAs con proveedores compatibles con la criticidad del servicio",
          "Documentación suficiente para onboarding sin fricción",
          "Caminos de escala ya mapeados",
        ],
      },
      negatives: {
        heading: "⚠️ Puntos críticos identificados",
        items: [
          "Sistemas legacy sin mantenimiento — alto riesgo de incidente irrecuperable",
          "Procesos manuales críticos sin redundancia (pérdida silenciosa)",
          "Integraciones frágiles con puntos únicos de falla sin monitoreo",
          "Dependencia de personas-clave sin documentación (bus factor 1)",
          "Backup configurado pero nunca probado",
          "Métricas dispersas en planillas desencontradas",
          "Contraseñas compartidas, accesos no revocados, ausencia de SSO/MFA",
          "GDPR aplicado parcialmente — pasivo legal latente",
          "Costo cloud 30-60% por encima de lo necesario",
          "SLA del proveedor inferior al SLA prometido al cliente final",
          "Falta de roadmap técnico — el equipo apaga incendios",
          "Equipo demasiado pequeño o demasiado grande para la etapa",
        ],
      },
    },
    areas: {
      heading: "Vectores que auditamos",
      subheading: "Cada uno se evalúa con profundidad técnica y se traduce al lenguaje del C-level — sin jerga y con prioridad clara.",
      items: [
        { icon: "🏛️", title: "Arquitectura de sistemas", desc: "Diagrama actual vs. ideal, gargalos, deuda técnica, decisiones caras." },
        { icon: "☁️", title: "Infraestructura & cloud", desc: "Costos, dimensionamiento, alta disponibilidad, observabilidad, lock-in." },
        { icon: "🔐", title: "Seguridad & GDPR", desc: "OWASP Top 10, secrets, acceso, encriptación, plan de incidente, logs." },
        { icon: "📊", title: "Datos & BI", desc: "Modelado, calidad, gobernanza, métricas reales vs. vanidad." },
        { icon: "⚙️", title: "Procesos & operación", desc: "Mapeo, automación, gargalos humanos, tiempo de ciclo." },
        { icon: "👥", title: "Equipo & estructura", desc: "Skill gap, seniority, bus factor, onboarding, retención." },
        { icon: "🔗", title: "Integraciones & APIs", desc: "Mapa, fragilidades, lock-in, gobernanza, alternativas." },
        { icon: "💻", title: "Calidad de código", desc: "Estático, cobertura, padrones, complejidad, dependencias." },
        { icon: "🚀", title: "Performance & escala", desc: "Auditoría front/back, BD, cache, CDN, load testing." },
        { icon: "💸", title: "Costos & ROI", desc: "Adónde va el dinero, ROI por sistema, reducciones inmediatas." },
        { icon: "📈", title: "Marketing & ventas tech", desc: "GTM, CAPI, tracking, atribución, CRM, automación." },
        { icon: "🎯", title: "Estrategia & roadmap", desc: "Alineamiento tecnología-producto-negocio. Roadmap honesto." },
      ],
    },
    frameworks: {
      heading: "Frameworks que aplicamos",
      subheading: "Metodologías maduras para que el diagnóstico sea riguroso y accionable — nada de \"a ojo\".",
      items: [
        { label: "WSJF", desc: "Prioriza intervenciones por costo del retraso × esfuerzo." },
        { label: "Wardley Mapping", desc: "Mapea componentes y dependencias para revelar dónde invertir." },
        { label: "DORA + SPACE", desc: "Métricas objetivas de ingeniería — deploy, lead time, MTTR." },
        { label: "ISO 27001 (a medida)", desc: "Controles relevantes para el porte de la empresa." },
        { label: "OWASP Top 10 + ASVS", desc: "Checklist de seguridad para código, infra y API." },
        { label: "Five Whys + Fishbone", desc: "Causa raíz para incidentes recurrentes." },
      ],
    },
    process: {
      heading: "Cómo funciona una consultoría con nosotros",
      subheading: "En 4-6 semanas sales con diagnóstico, plan y prioridades — no con una tarjeta de visita.",
      steps: [
        { num: "1", title: "Conversación inicial (gratuita)", desc: "30-60 min para entender escenario, incómodos, equipo, stack y números." },
        { num: "2", title: "Inmersión técnica (1-2 sem.)", desc: "Entrevistas con C-level y equipo, acceso read-only, análisis de código, infra y métricas." },
        { num: "3", title: "Análisis cruzado (1 sem.)", desc: "Cruzamos datos técnicos con indicadores de negocio. Correlación entre dolor y causa." },
        { num: "4", title: "Presentación del diagnóstico", desc: "Reunión ejecutiva con puntos positivos, críticos, plan y quick wins." },
        { num: "5", title: "Roadmap & priorización", desc: "Construcción conjunta del roadmap 3-12 meses, con criterios claros." },
        { num: "6", title: "Acompañamiento opcional", desc: "Mensual o trimestral, como CTO as a Service." },
      ],
    },
    services: {
      heading: "Modalidades de consultoría",
      subheading: "De la auditoría puntual al CTO mensual.",
      items: [
        { icon: "🔬", title: "Diagnóstico técnico completo", desc: "Auditoría de 4-6 semanas con informe final, plan y presentación." },
        { icon: "👨‍💼", title: "CTO as a Service", desc: "Liderazgo técnico fraccionado (8-40h/mes)." },
        { icon: "🎓", title: "Consultoría Moodle estratégica", desc: "Para instituciones: versión, plataforma, plugins, integraciones, SGA." },
        { icon: "🏗️", title: "Arquitectura de nuevo producto", desc: "Antes de codificar: validamos arquitectura, stack, costos, modelo." },
        { icon: "🔐", title: "Auditoría de seguridad & GDPR", desc: "OWASP, acceso, encriptación, plan de incidente, GDPR." },
        { icon: "💸", title: "Auditoría de costos cloud", desc: "AWS/GCP/Cloudflare/Vercel. Cortes de 20-60% sin perder rendimiento." },
        { icon: "📈", title: "Auditoría de marketing tech", desc: "GTM, CAPI, pixel, CRM, atribución." },
        { icon: "🧑‍🏫", title: "Mentoría técnica del equipo", desc: "Mensual: revisión de PRs, 1:1, soporte arquitectural." },
      ],
    },
    deliverables: {
      heading: "Lo que recibes al final",
      subheading: "Documento ejecutivo corto, anexos técnicos profundos, video y plan de acción secuenciado.",
      items: [
        "Informe ejecutivo de 15-30 páginas con priorización clara",
        "Diagrama de arquitectura actual y propuesta",
        "Lista de positivos (mantener) y críticos (corregir)",
        "Plan de acción 3, 6 y 12 meses, con responsables sugeridos",
        "Estimación de costos y ROI esperado",
        "Quick wins (resultados en 30 días) destacados",
        "Video de la presentación ejecutiva",
        "Anexos técnicos: seguridad, costos cloud, calidad de código",
        "Lista de proveedores recomendados (y a evitar)",
        "NDA bilateral antes del proyecto",
      ],
    },
    who: {
      heading: "Para quién es esta consultoría",
      subheading: "Atendemos socios, CEOs, CFOs, COOs y CTOs que necesitan una mirada externa, técnica e independiente.",
      items: [
        { icon: "🏢", title: "PYMEs en crecimiento", desc: "20-300 empleados donde TI se volvió cuello de botella." },
        { icon: "🚀", title: "Scaleups post-Serie A", desc: "Captaron ronda, necesitan escalar sin romper." },
        { icon: "🎓", title: "Instituciones educativas", desc: "Universidades, colegios, cursos preparatorios." },
        { icon: "🏭", title: "Industrias & retail", desc: "Operaciones con ERP, e-commerce, logística y fiscal." },
        { icon: "🏛️", title: "Sector público & ONGs", desc: "Diagnóstico técnico imparcial para licitaciones y modernización." },
        { icon: "💼", title: "Board & inversionistas", desc: "Due diligence técnica antes de inversión o adquisición." },
      ],
    },
    proof: {
      heading: "Números que sustentan la autoridad",
      subheading: "",
      items: [
        { value: "15+", label: "Años auditando sistemas en producción" },
        { value: "300+", label: "Proyectos en PYMEs y scaleups" },
        { value: "4 países", label: "Brasil, Portugal, España, EE. UU. y Reino Unido" },
        { value: "5.0★", label: "Reseña Google en 17 reviews" },
        { value: "0", label: "Conflicto de interés — no revendemos software" },
        { value: "100%", label: "Equipo senior, sin tercerización" },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Necesitan acceso a nuestros sistemas?", a: "Acceso read-only a código, infra, BD y dashboards. Todo bajo NDA firmado antes." },
        { q: "¿Cuánto dura una auditoría?", a: "Diagnóstico completo: 4-6 semanas. Puntual: 2-3 semanas. CTO as a Service: mensual recurrente." },
        { q: "¿Cuánto cuesta?", a: "Diagnóstico completo: desde R$ 18K. CTO as a Service: R$ 6-15K/mes. Auditorías puntuales: R$ 6-12K." },
        { q: "¿Implementan el plan después?", a: "Podemos, pero no es obligatorio. Entregamos el plan y tú decides." },
        { q: "¿Y si nuestro problema es de gestión, no técnico?", a: "Lo mapeamos también. En 30-40% el gargalo crítico es proceso o gestión, no tecnología." },
        { q: "¿Atienden fuera de Brasil?", a: "Sí — Portugal, España, EE. UU. y Reino Unido." },
        { q: "¿Firman NDA?", a: "Siempre. Modelo bilateral, prazo 5 años." },
        { q: "¿Hablan con nuestro equipo o solo con dirección?", a: "Ambos. C-level, gerencia y devs/ops/marketing." },
      ],
    },
    finalCta: {
      heading: "¿Miramos tu negocio con lupa?",
      lead: "Reunión inicial de 30-60 minutos, sin compromiso.",
      cta: "Agendar diagnóstico gratuito",
    },
    prefill: "¡Hola! Vi la página de Consultoría y quiero agendar un diagnóstico técnico.",
  },
  "en-US": {
    hero: {
      badge: "🧭 Independent technical diagnosis · 15+ years",
      titlePrefix: "Consulting that sees",
      titleHighlight: "what's holding your business back",
      lead: "We audit systems, processes, infrastructure, team and operations — and deliver an honest diagnosis with what's working, what's silently bleeding money and what needs to change now. Agathas Web CTO as a Service.",
      cta: "Schedule a free diagnosis",
    },
    authority: {
      heading: "Why Agathas can audit your company",
      subheading: "Not theoretical consultants. We operate, code and maintain systems in production for 15+ years — so we know where to look, what to ask and what actually breaks.",
      pillars: [
        { icon: "🏗️", title: "We run the stack we audit", desc: "ERP, Moodle, e-commerce, SaaS, WhatsApp API, cloud, production databases. No theory — only what we've seen break and what actually fixes." },
        { icon: "🌍", title: "+300 projects in 4 countries", desc: "Brazil, Portugal, Spain, US and UK. SMBs, scaleups, educational institutions, industry and public sector." },
        { icon: "🎓", title: "Relevant certifications", desc: "Moodle HQ, Microsoft, Google Cloud, AWS, Meta Business Partner." },
        { icon: "🔍", title: "Diagnosis-focused, not sales-focused", desc: "We don't resell software. The recommendation is genuinely honest — no conflict of interest." },
        { icon: "📐", title: "Systems thinking", desc: "We audit tech, processes, team, operations, marketing and sales. IT doesn't live in isolation." },
        { icon: "🧑‍💼", title: "Direct senior attention", desc: "Whoever audits you is an Agathas partner/CTO — never junior, never outsourced." },
      ],
    },
    diagnosis: {
      heading: "What we find in an audit — good and bad",
      subheading: "We leave the diagnosis with a report that maps, side by side, what's working (keep) and what's silently bleeding resources (fix). Straight to the point.",
      intro: "In every engagement we review the 12 vectors below. The final report crosses both sides — you see the complete picture, no sugar-coating.",
      positives: {
        heading: "✅ Positive findings identified",
        items: [
          "Mature, well-supported tech stack (no immediate technical debt)",
          "Automated processes saving measurable person-hours",
          "Stable integrations with critical providers (ERP, gateway, billing, Moodle)",
          "Internal team mastering the key day-to-day tools",
          "Backup and recovery working — tested, not just configured",
          "Business metrics tracked in reliable dashboards",
          "Code review culture, CI/CD or QA in place and used",
          "GDPR/LGPD compliance and data security at acceptable levels",
          "Infrastructure cost proportional to operated volume",
          "Provider SLAs aligned with service criticality",
          "Sufficient documentation for frictionless onboarding",
          "Scaling paths already mapped",
        ],
      },
      negatives: {
        heading: "⚠️ Critical issues identified",
        items: [
          "Unmaintained legacy systems — high risk of unrecoverable incident",
          "Critical manual processes without redundancy (silent monthly losses)",
          "Fragile integrations with unmonitored single points of failure",
          "Key-person dependency without documentation (bus factor 1)",
          "Backup configured but never tested",
          "Metrics scattered across mismatched spreadsheets",
          "Shared passwords, unrevoked access, no SSO/MFA",
          "GDPR/LGPD partially applied — latent legal liability",
          "Cloud cost 30-60% above necessary due to sub-optimal configuration",
          "Provider SLA lower than what's promised to end customer",
          "No technical roadmap — team firefighting instead of evolving",
          "Team too small or too large for company stage",
        ],
      },
    },
    areas: {
      heading: "Vectors we audit",
      subheading: "Each evaluated with technical depth and translated into C-level language — no jargon, clear priority.",
      items: [
        { icon: "🏛️", title: "System architecture", desc: "Current vs. ideal diagram, bottlenecks, tech debt, costly bad decisions." },
        { icon: "☁️", title: "Infrastructure & cloud", desc: "Costs, sizing, HA, observability, hidden costs, vendor lock-in." },
        { icon: "🔐", title: "Security & GDPR", desc: "OWASP Top 10, secrets, access, encryption, incident plan, logs." },
        { icon: "📊", title: "Data & BI", desc: "Modeling, quality, governance, real vs. vanity metrics." },
        { icon: "⚙️", title: "Processes & ops", desc: "Mapping, automation, human bottlenecks, cycle time." },
        { icon: "👥", title: "Team & structure", desc: "Skill gap, seniority, bus factor, onboarding, retention." },
        { icon: "🔗", title: "Integrations & APIs", desc: "Map, fragilities, lock-in, governance, alternatives." },
        { icon: "💻", title: "Code quality", desc: "Static, coverage, standards, complexity, dependencies." },
        { icon: "🚀", title: "Performance & scale", desc: "Front/back audit, DB, cache, CDN, load testing." },
        { icon: "💸", title: "Costs & ROI", desc: "Where money goes, ROI per system, immediate reductions." },
        { icon: "📈", title: "Marketing & sales tech", desc: "GTM, CAPI, tracking, attribution, CRM, automation." },
        { icon: "🎯", title: "Strategy & roadmap", desc: "Tech-product-business alignment. Honest roadmap." },
      ],
    },
    frameworks: {
      heading: "Frameworks we apply",
      subheading: "Mature methodologies so the diagnosis is rigorous and actionable — no eyeballing.",
      items: [
        { label: "WSJF", desc: "Prioritizes interventions by cost of delay × effort." },
        { label: "Wardley Mapping", desc: "Maps components and dependencies to reveal where to invest." },
        { label: "DORA + SPACE", desc: "Objective engineering metrics — deploy, lead time, MTTR." },
        { label: "ISO 27001 (tailored)", desc: "Relevant controls for company size." },
        { label: "OWASP Top 10 + ASVS", desc: "Security checklist for code, infra and API." },
        { label: "Five Whys + Fishbone", desc: "Root cause for recurring incidents." },
      ],
    },
    process: {
      heading: "How consulting with us works",
      subheading: "In 4-6 weeks you leave with diagnosis, plan and priorities — not a business card.",
      steps: [
        { num: "1", title: "Initial call (free)", desc: "30-60 min to understand scenario, pain points, team, stack and numbers." },
        { num: "2", title: "Technical deep-dive (1-2 wks)", desc: "Interviews with C-level and team, read-only access, code/infra/DB analysis." },
        { num: "3", title: "Cross-analysis (1 wk)", desc: "We cross technical data with business indicators." },
        { num: "4", title: "Diagnosis presentation", desc: "Executive meeting with positives, criticals, action plan and quick wins." },
        { num: "5", title: "Roadmap & prioritization", desc: "Joint 3-12 month roadmap with clear criteria." },
        { num: "6", title: "Optional follow-up", desc: "Monthly or quarterly, as CTO as a Service." },
      ],
    },
    services: {
      heading: "Consulting modalities",
      subheading: "From one-off audits to monthly CTO.",
      items: [
        { icon: "🔬", title: "Full technical diagnosis", desc: "4-6 week audit with report, plan and presentation." },
        { icon: "👨‍💼", title: "CTO as a Service", desc: "Fractional tech leadership (8-40h/month)." },
        { icon: "🎓", title: "Strategic Moodle consulting", desc: "For education: version, platform, plugins, integrations, SMS." },
        { icon: "🏗️", title: "New product architecture", desc: "Before coding: architecture, stack, cloud cost, multi-tenant model." },
        { icon: "🔐", title: "Security & GDPR audit", desc: "OWASP, access, encryption, incident plan, GDPR." },
        { icon: "💸", title: "Cloud cost audit", desc: "AWS/GCP/Cloudflare/Vercel. 20-60% cuts without losing performance." },
        { icon: "📈", title: "Marketing tech audit", desc: "GTM, CAPI, pixel, CRM, attribution." },
        { icon: "🧑‍🏫", title: "Tech team mentorship", desc: "Monthly: PR reviews, 1:1, architectural support." },
      ],
    },
    deliverables: {
      heading: "What you receive at the end",
      subheading: "Short executive document, deep technical annexes, video and sequenced action plan.",
      items: [
        "15-30 page executive report with clear prioritization",
        "Current and proposed architecture diagrams",
        "List of positives (keep) and criticals (fix)",
        "3, 6 and 12 month action plan with suggested owners",
        "Cost estimates and expected ROI",
        "Quick wins (30-day results) highlighted",
        "Executive presentation video",
        "Technical annexes: security, cloud cost, code quality",
        "Recommended (and to-avoid) vendor list",
        "Bilateral NDA before project starts",
      ],
    },
    who: {
      heading: "Who this consulting is for",
      subheading: "We serve founders, CEOs, CFOs, COOs and CTOs who need an external, technical, independent view.",
      items: [
        { icon: "🏢", title: "Growing SMBs", desc: "20-300 employees where IT became a bottleneck." },
        { icon: "🚀", title: "Post-Series A scaleups", desc: "Raised a round, need to scale without breaking." },
        { icon: "🎓", title: "Educational institutions", desc: "Universities, schools, prep courses." },
        { icon: "🏭", title: "Industry & retail", desc: "Operations with ERP, e-commerce, logistics and tax." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Impartial technical diagnosis for tenders and modernization." },
        { icon: "💼", title: "Board & investors", desc: "Technical due diligence before investment or acquisition." },
      ],
    },
    proof: {
      heading: "Numbers that back the authority",
      subheading: "",
      items: [
        { value: "15+", label: "Years auditing systems in production" },
        { value: "300+", label: "Projects in SMBs and scaleups" },
        { value: "4 countries", label: "Brazil, Portugal, Spain, US and UK" },
        { value: "5.0★", label: "Google rating, 17 reviews" },
        { value: "0", label: "Conflict of interest — we don't resell software" },
        { value: "100%", label: "Senior team, no outsourcing" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you need access to our systems?", a: "Read-only access to code, infra, DB and dashboards. All under NDA signed beforehand." },
        { q: "How long does an audit take?", a: "Full diagnosis: 4-6 weeks. One-off audit: 2-3 weeks. CTO as a Service: recurring monthly." },
        { q: "How much does it cost?", a: "Full diagnosis: from USD 3.5K. CTO as a Service: USD 1.2-3K/month. One-off audits: USD 1.2-2.5K." },
        { q: "Do you implement the plan afterward?", a: "We can, but you're not required. We deliver the plan and you decide." },
        { q: "What if our problem is management, not technical?", a: "We map that too. In 30-40% of audits the critical bottleneck is process or management." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US and UK." },
        { q: "Do you sign NDAs?", a: "Always. Bilateral, 5-year term." },
        { q: "Do you talk to our team or just leadership?", a: "Both. C-level, management and devs/ops/marketing." },
      ],
    },
    finalCta: {
      heading: "Shall we look at your business with a magnifying glass?",
      lead: "30-60 minute initial meeting, no commitment.",
      cta: "Schedule a free diagnosis",
    },
    prefill: "Hi! I saw the Consulting page and want to schedule a technical diagnosis.",
  },
  "en-GB": {
    hero: {
      badge: "🧭 Independent technical diagnosis · 15+ years",
      titlePrefix: "Consulting that sees",
      titleHighlight: "what's holding your business back",
      lead: "We audit systems, processes, infrastructure, team and operations — and deliver an honest diagnosis with what's working, what's silently bleeding money and what needs to change now. Agathas Web CTO as a Service.",
      cta: "Schedule a free diagnosis",
    },
    authority: {
      heading: "Why Agathas can audit your company",
      subheading: "Not theoretical consultants. We operate, code and maintain systems in production for 15+ years — so we know where to look, what to ask and what actually breaks.",
      pillars: [
        { icon: "🏗️", title: "We run the stack we audit", desc: "ERP, Moodle, e-commerce, SaaS, WhatsApp API, cloud, production databases. No theory — only what we've seen break and what actually fixes." },
        { icon: "🌍", title: "+300 projects in 4 countries", desc: "Brazil, Portugal, Spain, US and UK. SMBs, scaleups, educational institutions, industry and public sector." },
        { icon: "🎓", title: "Relevant certifications", desc: "Moodle HQ, Microsoft, Google Cloud, AWS, Meta Business Partner." },
        { icon: "🔍", title: "Diagnosis-focused, not sales-focused", desc: "We don't resell software. The recommendation is genuinely honest — no conflict of interest." },
        { icon: "📐", title: "Systems thinking", desc: "We audit tech, processes, team, operations, marketing and sales. IT doesn't live in isolation." },
        { icon: "🧑‍💼", title: "Direct senior attention", desc: "Whoever audits you is an Agathas partner/CTO — never junior, never outsourced." },
      ],
    },
    diagnosis: {
      heading: "What we find in an audit — good and bad",
      subheading: "We leave the diagnosis with a report that maps, side by side, what's working (keep) and what's silently bleeding resources (fix). Straight to the point.",
      intro: "In every engagement we review the 12 vectors below. The final report crosses both sides — you see the complete picture, no sugar-coating.",
      positives: {
        heading: "✅ Positive findings identified",
        items: [
          "Mature, well-supported tech stack (no immediate technical debt)",
          "Automated processes saving measurable person-hours",
          "Stable integrations with critical providers (ERP, gateway, billing, Moodle)",
          "Internal team mastering the key day-to-day tools",
          "Backup and recovery working — tested, not just configured",
          "Business metrics tracked in reliable dashboards",
          "Code review culture, CI/CD or QA in place and used",
          "GDPR/LGPD compliance and data security at acceptable levels",
          "Infrastructure cost proportional to operated volume",
          "Provider SLAs aligned with service criticality",
          "Sufficient documentation for frictionless onboarding",
          "Scaling paths already mapped",
        ],
      },
      negatives: {
        heading: "⚠️ Critical issues identified",
        items: [
          "Unmaintained legacy systems — high risk of unrecoverable incident",
          "Critical manual processes without redundancy (silent monthly losses)",
          "Fragile integrations with unmonitored single points of failure",
          "Key-person dependency without documentation (bus factor 1)",
          "Backup configured but never tested",
          "Metrics scattered across mismatched spreadsheets",
          "Shared passwords, unrevoked access, no SSO/MFA",
          "GDPR/LGPD partially applied — latent legal liability",
          "Cloud cost 30-60% above necessary due to sub-optimal configuration",
          "Provider SLA lower than what's promised to end customer",
          "No technical roadmap — team firefighting instead of evolving",
          "Team too small or too large for company stage",
        ],
      },
    },
    areas: {
      heading: "Vectors we audit",
      subheading: "Each evaluated with technical depth and translated into C-level language — no jargon, clear priority.",
      items: [
        { icon: "🏛️", title: "System architecture", desc: "Current vs. ideal diagram, bottlenecks, tech debt, costly bad decisions." },
        { icon: "☁️", title: "Infrastructure & cloud", desc: "Costs, sizing, HA, observability, hidden costs, vendor lock-in." },
        { icon: "🔐", title: "Security & GDPR", desc: "OWASP Top 10, secrets, access, encryption, incident plan, logs." },
        { icon: "📊", title: "Data & BI", desc: "Modelling, quality, governance, real vs. vanity metrics." },
        { icon: "⚙️", title: "Processes & ops", desc: "Mapping, automation, human bottlenecks, cycle time." },
        { icon: "👥", title: "Team & structure", desc: "Skill gap, seniority, bus factor, onboarding, retention." },
        { icon: "🔗", title: "Integrations & APIs", desc: "Map, fragilities, lock-in, governance, alternatives." },
        { icon: "💻", title: "Code quality", desc: "Static, coverage, standards, complexity, dependencies." },
        { icon: "🚀", title: "Performance & scale", desc: "Front/back audit, DB, cache, CDN, load testing." },
        { icon: "💸", title: "Costs & ROI", desc: "Where money goes, ROI per system, immediate reductions." },
        { icon: "📈", title: "Marketing & sales tech", desc: "GTM, CAPI, tracking, attribution, CRM, automation." },
        { icon: "🎯", title: "Strategy & roadmap", desc: "Tech-product-business alignment. Honest roadmap." },
      ],
    },
    frameworks: {
      heading: "Frameworks we apply",
      subheading: "Mature methodologies so the diagnosis is rigorous and actionable — no eyeballing.",
      items: [
        { label: "WSJF", desc: "Prioritises interventions by cost of delay × effort." },
        { label: "Wardley Mapping", desc: "Maps components and dependencies to reveal where to invest." },
        { label: "DORA + SPACE", desc: "Objective engineering metrics — deploy, lead time, MTTR." },
        { label: "ISO 27001 (tailored)", desc: "Relevant controls for company size." },
        { label: "OWASP Top 10 + ASVS", desc: "Security checklist for code, infra and API." },
        { label: "Five Whys + Fishbone", desc: "Root cause for recurring incidents." },
      ],
    },
    process: {
      heading: "How consulting with us works",
      subheading: "In 4-6 weeks you leave with diagnosis, plan and priorities — not a business card.",
      steps: [
        { num: "1", title: "Initial call (free)", desc: "30-60 min to understand scenario, pain points, team, stack and numbers." },
        { num: "2", title: "Technical deep-dive (1-2 wks)", desc: "Interviews with C-level and team, read-only access, code/infra/DB analysis." },
        { num: "3", title: "Cross-analysis (1 wk)", desc: "We cross technical data with business indicators." },
        { num: "4", title: "Diagnosis presentation", desc: "Executive meeting with positives, criticals, action plan and quick wins." },
        { num: "5", title: "Roadmap & prioritisation", desc: "Joint 3-12 month roadmap with clear criteria." },
        { num: "6", title: "Optional follow-up", desc: "Monthly or quarterly, as CTO as a Service." },
      ],
    },
    services: {
      heading: "Consulting modalities",
      subheading: "From one-off audits to monthly CTO.",
      items: [
        { icon: "🔬", title: "Full technical diagnosis", desc: "4-6 week audit with report, plan and presentation." },
        { icon: "👨‍💼", title: "CTO as a Service", desc: "Fractional tech leadership (8-40h/month)." },
        { icon: "🎓", title: "Strategic Moodle consulting", desc: "For education: version, platform, plugins, integrations, SMS." },
        { icon: "🏗️", title: "New product architecture", desc: "Before coding: architecture, stack, cloud cost, multi-tenant model." },
        { icon: "🔐", title: "Security & GDPR audit", desc: "OWASP, access, encryption, incident plan, GDPR." },
        { icon: "💸", title: "Cloud cost audit", desc: "AWS/GCP/Cloudflare/Vercel. 20-60% cuts without losing performance." },
        { icon: "📈", title: "Marketing tech audit", desc: "GTM, CAPI, pixel, CRM, attribution." },
        { icon: "🧑‍🏫", title: "Tech team mentorship", desc: "Monthly: PR reviews, 1:1, architectural support." },
      ],
    },
    deliverables: {
      heading: "What you receive at the end",
      subheading: "Short executive document, deep technical annexes, video and sequenced action plan.",
      items: [
        "15-30 page executive report with clear prioritisation",
        "Current and proposed architecture diagrams",
        "List of positives (keep) and criticals (fix)",
        "3, 6 and 12 month action plan with suggested owners",
        "Cost estimates and expected ROI",
        "Quick wins (30-day results) highlighted",
        "Executive presentation video",
        "Technical annexes: security, cloud cost, code quality",
        "Recommended (and to-avoid) vendor list",
        "Bilateral NDA before project starts",
      ],
    },
    who: {
      heading: "Who this consulting is for",
      subheading: "We serve founders, CEOs, CFOs, COOs and CTOs who need an external, technical, independent view.",
      items: [
        { icon: "🏢", title: "Growing SMBs", desc: "20-300 employees where IT became a bottleneck." },
        { icon: "🚀", title: "Post-Series A scaleups", desc: "Raised a round, need to scale without breaking." },
        { icon: "🎓", title: "Educational institutions", desc: "Universities, schools, prep courses." },
        { icon: "🏭", title: "Industry & retail", desc: "Operations with ERP, e-commerce, logistics and tax." },
        { icon: "🏛️", title: "Public sector & NGOs", desc: "Impartial technical diagnosis for tenders and modernisation." },
        { icon: "💼", title: "Board & investors", desc: "Technical due diligence before investment or acquisition." },
      ],
    },
    proof: {
      heading: "Numbers that back the authority",
      subheading: "",
      items: [
        { value: "15+", label: "Years auditing systems in production" },
        { value: "300+", label: "Projects in SMBs and scaleups" },
        { value: "4 countries", label: "Brazil, Portugal, Spain, US and UK" },
        { value: "5.0★", label: "Google rating, 17 reviews" },
        { value: "0", label: "Conflict of interest — we don't resell software" },
        { value: "100%", label: "Senior team, no outsourcing" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you need access to our systems?", a: "Read-only access to code, infra, DB and dashboards. All under NDA signed beforehand." },
        { q: "How long does an audit take?", a: "Full diagnosis: 4-6 weeks. One-off audit: 2-3 weeks. CTO as a Service: recurring monthly." },
        { q: "How much does it cost?", a: "Full diagnosis: from GBP 2.8K. CTO as a Service: GBP 1-2.5K/month. One-off audits: GBP 1-2K." },
        { q: "Do you implement the plan afterwards?", a: "We can, but you're not required. We deliver the plan and you decide." },
        { q: "What if our problem is management, not technical?", a: "We map that too. In 30-40% of audits the critical bottleneck is process or management." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US and UK." },
        { q: "Do you sign NDAs?", a: "Always. Bilateral, 5-year term." },
        { q: "Do you talk to our team or just leadership?", a: "Both. C-level, management and devs/ops/marketing." },
      ],
    },
    finalCta: {
      heading: "Shall we look at your business with a magnifying glass?",
      lead: "30-60 minute initial meeting, no commitment.",
      cta: "Schedule a free diagnosis",
    },
    prefill: "Hi! I saw the Consulting page and want to schedule a technical diagnosis.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/servicos/consultoria">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  return {
    title: dict.services.consultoria.metadata.title,
    description: dict.services.consultoria.metadata.description,
    alternates: {
      canonical: `${origin}/servicos/consultoria`,
      languages: buildHreflangAlternates("/servicos/consultoria"),
    },
  };
}

export default async function ConsultoriaPage({ params }: PageProps<"/[lang]/servicos/consultoria">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = STRINGS[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(147,51,234,0.3), transparent 40%), radial-gradient(circle at 80% 60%, rgba(34,197,94,0.12), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/40 rounded-full text-sm font-semibold text-purple-300 mb-8">{t.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <div className="mt-10 flex justify-center">
            <WhatsAppCta
              label={t.hero.cta}
              prefillMessage={t.prefill}
              ctaContext="consultoria-hero"
              locale={lang}
              recaptchaSiteKey={recaptchaSiteKey}
              modalLabels={modalLabels}
              className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-purple-500/30"
            />
          </div>
        </div>
      </section>

      {/* Autoridade */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.authority.heading}</h2>
            <p className="text-lg text-gray-300">{t.authority.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.authority.pillars.map((p) => (
              <div key={p.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-purple-500/40 transition-colors">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prova social — números */}
      <section className="py-16 bg-black border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {t.proof.items.map((p) => (
              <div key={p.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-purple-400 mb-2">{p.value}</div>
                <div className="text-xs lg:text-sm text-gray-400 leading-snug">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagnóstico — positivos vs negativos */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.diagnosis.heading}</h2>
            <p className="text-lg text-gray-300">{t.diagnosis.subheading}</p>
            <p className="text-sm text-gray-400 mt-4">{t.diagnosis.intro}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="bg-voyia-gray rounded-2xl p-7 border border-green-500/30">
              <h3 className="text-xl font-bold text-green-300 mb-5">{t.diagnosis.positives.heading}</h3>
              <ul className="space-y-3">
                {t.diagnosis.positives.items.map((item) => (
                  <li key={item} className="flex items-start text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-voyia-gray rounded-2xl p-7 border border-red-500/30">
              <h3 className="text-xl font-bold text-red-300 mb-5">{t.diagnosis.negatives.heading}</h3>
              <ul className="space-y-3">
                {t.diagnosis.negatives.items.map((item) => (
                  <li key={item} className="flex items-start text-sm text-gray-300">
                    <svg className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas auditadas */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.areas.heading}</h2>
            <p className="text-lg text-gray-300">{t.areas.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.areas.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.2)]">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frameworks */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.frameworks.heading}</h2>
            <p className="text-lg text-gray-300">{t.frameworks.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {t.frameworks.items.map((f) => (
              <div key={f.label} className="bg-voyia-gray rounded-xl p-5 border border-gray-700">
                <h3 className="text-base font-bold text-purple-300 mb-2">{f.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.process.heading}</h2>
            <p className="text-lg text-gray-300">{t.process.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.process.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modalidades */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.services.heading}</h2>
            <p className="text-lg text-gray-300">{t.services.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.services.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-purple-500/40 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entregáveis */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{t.deliverables.heading}</h2>
            <p className="text-lg text-gray-300">{t.deliverables.subheading}</p>
          </div>
          <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-7">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {t.deliverables.items.map((item) => (
                <li key={item} className="flex items-start text-sm text-gray-300">
                  <svg className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pra quem */}
      <section className="py-24 bg-voyia-dark">
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

      {/* FAQ */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-10 text-center">{t.faq.heading}</h2>
          <div className="space-y-4">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-semibold hover:bg-black/20 transition-colors list-none">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 text-purple-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={t.finalCta.cta}
                  prefillMessage={t.prefill}
                  ctaContext="consultoria-final-cta"
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
