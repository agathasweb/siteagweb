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
  "pt-BR": "Olá! Quero falar sobre Hospedagem Gerenciada.",
  es: "¡Hola! Quiero hablar sobre Hosting Gestionado.",
  "en-US": "Hi! I want to talk about Managed Hosting.",
  "en-GB": "Hi! I want to talk about Managed Hosting.",
};

const EXTRA: Record<Locale, {
  hero: { badge: string; subline: string };
  trust: { value: string; label: string }[];
  authority: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  cases: { heading: string; subheading: string; items: { icon: string; segment: string; title: string; metric: string; quote: string }[] };
  support: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  stack: { heading: string; subheading: string; groups: { label: string; items: string[] }[] };
  whatWeManage: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  migration: { heading: string; subheading: string; guarantees: { icon: string; title: string; desc: string }[]; cta: string };
  sla: { heading: string; subheading: string; rows: { metric: string; promise: string; how: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; cta: string };
  prefillGeneric: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🛡️ Sustentação cloud sênior · 15+ anos · SLA contratual",
      subline: "Sua infraestrutura gerenciada por uma equipe que opera SaaS, e-commerce, ERP e plataformas críticas em produção há 15+ anos. Você foca no negócio; a gente cuida do uptime.",
    },
    trust: [
      { value: "15+", label: "Anos sustentando infraestrutura" },
      { value: "200+", label: "Sites e sistemas ativos" },
      { value: "99.9%", label: "Uptime SLA contratual" },
      { value: "<15min", label: "Resposta a incidentes críticos" },
    ],
    authority: {
      heading: "Por que confiar a sua hospedagem à Agathas",
      subheading: "Não somos revenda de cPanel nem hospedagem genérica. Operamos infraestrutura cloud em AWS, Cloudflare, Hetzner e bare metal há mais de uma década — e o suporte é feito por gente que conhece a sua stack.",
      items: [
        { icon: "👨‍💻", title: "Equipe sênior brasileira", desc: "Quem te atende é o mesmo profissional que provisiona, monitora e debuga. Sem terceirização, sem fila internacional, sem nível 1 lendo script." },
        { icon: "🏗️", title: "Infraestrutura sob medida", desc: "Cada cliente recebe configuração específica para a stack que roda: WordPress, Laravel, Next.js, Node, Python, Moodle, ERP corporativo, e-commerce." },
        { icon: "🔐", title: "Segurança como padrão", desc: "WAF Cloudflare, fail2ban, hardening do SO, SSL Let's Encrypt automático, MFA obrigatório, backup AES-256, auditoria de logs. LGPD/GDPR aplicável." },
        { icon: "📡", title: "Monitoramento 24/7", desc: "Grafana, Prometheus, Sentry e UptimeRobot rodando em cima do seu ambiente. Quando algo ameaça quebrar, a gente já está agindo." },
        { icon: "💸", title: "Custo otimizado", desc: "Auditoria contínua de custo cloud. Em média, cortamos 20-50% do que clientes gastavam antes — sem perder performance." },
        { icon: "🚪", title: "Zero lock-in", desc: "Infraestrutura como código (Terraform/Ansible). Você pode levar tudo embora a qualquer momento, com documentação completa entregue." },
      ],
    },
    cases: {
      heading: "Operações que sustentamos com orgulho",
      subheading: "Mais de 15 anos sustentando sistemas críticos sem incidentes públicos. Recortes reais — anonimizados.",
      items: [
        { icon: "🛍️", segment: "E-commerce", title: "Black Friday — 12× tráfego sem cair", metric: "Pico R$ 2,1M em 24h · 99.98% uptime", quote: "Auto-scaling no Kubernetes, CDN Cloudflare, banco em replicação, fila assíncrona para pedidos. Pré-aquecemos a infra 48h antes." },
        { icon: "🏥", segment: "SaaS de saúde", title: "Migração de servidor físico para AWS sem parar atendimento", metric: "320 clínicas · 0 minutos de downtime", quote: "Replicação dupla, DNS com TTL baixo, cut-over em janela noturna. Médicos abriram o sistema no dia seguinte como se nada tivesse mudado." },
        { icon: "🏦", segment: "Fintech", title: "Compliance SOC 2 + LGPD em ambiente regulado", metric: "Auditoria externa aprovada em primeira rodada", quote: "Cofre de secrets (Vault), MFA obrigatório, logs imutáveis, política de menor privilégio, plano de incidente documentado. Pronto pra auditoria." },
        { icon: "🏭", segment: "ERP industrial", title: "Operação 24/7 com SLA de 99.95%", metric: "5 fábricas · 1.800 usuários · zero downtime planejado", quote: "Redundância de banco (master-slave), failover automático, backup PITR a cada 5 minutos. Quando o disco da master falhou, slave assumiu em 47 segundos." },
        { icon: "📰", segment: "Portal de notícias", title: "Atualização editorial 24/7 sem desperdiçar máquina", metric: "1,2M sessões/mês · custo 60% abaixo da concorrência", quote: "Cache em múltiplas camadas, CDN, ISR no Next.js, banco read-replica. Reduzimos servidores em 40% mantendo performance." },
        { icon: "💼", segment: "Plataforma corporativa", title: "Recuperação completa após ransomware (caso recebido)", metric: "Cliente novo restaurado em 6 horas", quote: "Cliente sofreu ataque com fornecedor anterior. Migramos backups, reconstruímos infra do zero em IaC, treinamos a equipe em hardening." },
      ],
    },
    support: {
      heading: "Suporte sênior em cada chamado",
      subheading: "Você fala direto com quem opera o seu ambiente — não com central de atendimento.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal direto com a equipe técnica, sem fila. Resposta em até 15 minutos para incidentes críticos." },
        { icon: "⏱️", title: "SLA contratual com multa", desc: "Resposta e resolução por severidade definidos no contrato. Multa contratual se descumprirmos — não é só promessa de marketing." },
        { icon: "🧑‍🔧", title: "Engenheiros sênior em cada nível", desc: "Sem nível 1 lendo roteiro. Quem atende já provisionou cluster, debugou banco, configurou WAF e mitigou DDoS." },
        { icon: "📊", title: "Relatório mensal executivo", desc: "Uptime, eventos críticos, backups testados, custos otimizados, ameaças mitigadas pelo WAF. Você sabe o que aconteceu sem ter que perguntar." },
        { icon: "🛟", title: "On-call em lançamentos", desc: "Black Friday, lançamento de produto, migração crítica — escalamos plantão 24/7 sob demanda. Sem cobrar extra na maioria dos casos." },
        { icon: "🎯", title: "Acompanhamento estratégico", desc: "Reunião mensal pra revisar SLA, custo, evolução do ambiente. Sustentação não é só apagar incêndio — é melhorar continuamente." },
      ],
    },
    stack: {
      heading: "Stack tecnológica que operamos",
      subheading: "Adaptamos a infraestrutura ao seu sistema, não o contrário. Nada de \"plano padrão\" com sobreconfiguração.",
      groups: [
        { label: "Cloud", items: ["AWS (EC2, RDS, S3, CloudFront, ECS)", "Cloudflare (CDN, WAF, R2, Workers)", "Hetzner (VPS dedicados de alta perf.)", "Vercel & Railway (Next.js, Node)", "Bare metal sob demanda"] },
        { label: "Aplicação", items: ["WordPress (com tuning sério)", "Laravel, Symfony, Node.js, Next.js", "Python (Django, FastAPI)", "Moodle (ver /produtos/hospedagem-moodle)", "Containers Docker e Kubernetes"] },
        { label: "Banco & cache", items: ["PostgreSQL, MySQL, MariaDB", "Redis, Memcached", "MongoDB, Elasticsearch", "Backup PITR e snapshots", "Réplica read-only para BI"] },
        { label: "Segurança & monitoramento", items: ["Cloudflare WAF + DDoS protection", "Fail2ban, rate limit, hardening SO", "Grafana, Prometheus, Sentry", "UptimeRobot externo", "Secrets via Vault + rotação automática"] },
      ],
    },
    whatWeManage: {
      heading: "O que está incluso na sustentação",
      subheading: "Você não precisa entender o que cada item faz — só precisa saber que está coberto.",
      items: [
        { icon: "🌐", title: "Sites & e-commerce", desc: "WordPress, Laravel, Next.js, Astro e qualquer stack. Cache otimizado, CDN, SSL e backup." },
        { icon: "📧", title: "E-mails corporativos", desc: "E-mails ilimitados no seu domínio, antispam avançado, compatibilidade com Outlook/Apple Mail/Gmail." },
        { icon: "🔒", title: "SSL & certificados", desc: "Let's Encrypt renovado automaticamente em todos os domínios e subdomínios. Sem manual." },
        { icon: "💾", title: "Backups verificados", desc: "Backup diário + incremental. Storage offsite criptografado. Restore testado mensalmente — não basta configurar." },
        { icon: "⚡", title: "Performance & CDN", desc: "CDN Cloudflare em todos os planos. Cache de objeto (Redis), cache HTTP, compressão Brotli, otimização de imagem." },
        { icon: "🛡️", title: "WAF & firewall", desc: "Cloudflare WAF com regras customizadas. Mitigação automática de DDoS. Bloqueio de bots maliciosos." },
        { icon: "🔍", title: "Monitoramento", desc: "Uptime, performance, erros, logs estruturados. Alertas no WhatsApp da equipe técnica quando algo foge do normal." },
        { icon: "🛠️", title: "Atualizações & patches", desc: "Sistema operacional, runtime (PHP/Node/Python), banco, plugins críticos. Atualizamos em janela combinada com staging." },
        { icon: "🚨", title: "Resposta a incidentes", desc: "Plano de incidente documentado, postmortem público quando aplicável, ações preventivas pós-evento." },
      ],
    },
    migration: {
      heading: "Migração sem dor em até 7 dias úteis",
      subheading: "Vem do seu fornecedor atual sem perder uma transação. Migramos sites, sistemas, bancos, e-mails e DNS com plano de rollback.",
      guarantees: [
        { icon: "🛡️", title: "Garantia de integridade", desc: "Comparamos checksums antes e depois. Nenhuma linha de dado é perdida ou alterada na migração." },
        { icon: "🧪", title: "Staging completo", desc: "Você valida o ambiente novo em domínio interno antes de virar a chave em produção. Aprovação por escrito." },
        { icon: "🌙", title: "Janela de baixo tráfego", desc: "Cut-over executado no horário de menor uso. DNS com TTL baixo, sem indisponibilidade perceptível." },
        { icon: "🔁", title: "Plano de rollback", desc: "Mantemos o ambiente antigo intacto por 30 dias. Se algo der errado, revertemos em horas." },
      ],
      cta: "Solicitar migração",
    },
    sla: {
      heading: "SLA contratual — sem letra miúda",
      subheading: "O que prometemos está no contrato, com multa se não cumprirmos.",
      rows: [
        { metric: "Uptime mensal", promise: "99.9% (≤ 43min/mês)", how: "Monitoramento 24/7, redundância, equipe on-call" },
        { metric: "Resposta — crítico", promise: "≤ 15 minutos", how: "Alerta WhatsApp + escalonamento automático" },
        { metric: "Resolução — crítico", promise: "≤ 2 horas", how: "Runbook documentado por tipo de incidente" },
        { metric: "Backup", promise: "Diário + incremental", how: "Storage offsite AES-256, restore testado mensalmente" },
        { metric: "Restauração", promise: "≤ 4 horas (últimas 24h)", how: "PITR e snapshots, RTO contratual" },
        { metric: "Atualização de patch crítico", promise: "≤ 72h após CVE público", how: "Staging + janela combinada" },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "Vocês migram meu site do fornecedor atual?", a: "Sim, incluso no setup. Em até 7 dias úteis migramos site, banco, e-mails e DNS. Cut-over fora do horário comercial, com plano de rollback." },
        { q: "Funciona com WordPress / Laravel / Next.js / ERP?", a: "Funciona com qualquer stack. Configuramos PHP, Node, Python ou containers Docker sob medida pro seu sistema. Não é hospedagem genérica." },
        { q: "Vocês incluem e-mails corporativos?", a: "Sim. E-mails ilimitados no seu domínio, antispam, compatibilidade total com Outlook, Apple Mail e Gmail. Migramos do servidor antigo sem perder mensagens." },
        { q: "Como funciona o backup?", a: "Backup completo diário + incremental. Storage offsite criptografado AES-256. Restore testado mensalmente — porque backup que não restaura não é backup." },
        { q: "Vocês fazem hardening de segurança?", a: "Sim, por padrão. WAF Cloudflare, fail2ban, hardening do SO, SSL automático, MFA, logs auditados. Aplicamos LGPD/GDPR onde for relevante." },
        { q: "E se meu site cair fora do horário comercial?", a: "Time on-call 24/7 monitora alertas. Incidentes críticos são tratados imediatamente, dia ou noite, fim de semana ou feriado. SLA contratual." },
        { q: "Quanto custa em média?", a: "Sites institucionais e blogs: R$ 250-500/mês. E-commerce e SaaS: R$ 600-2.500/mês. Operações enterprise: orçamento sob medida. Setup inicial: R$ 800-3.500 conforme complexidade." },
        { q: "Tenho fidelidade?", a: "Não. Contratos mensais com 30 dias de aviso pra cancelar. Sem multa, sem letra miúda. Confiamos no resultado." },
        { q: "Atendem fora do Brasil?", a: "Sim — clientes em Portugal, Espanha, EUA e Reino Unido. Servidor na região mais próxima do seu público, faturamento em BRL, EUR, USD ou GBP." },
        { q: "Vocês mantêm o código também ou só a infra?", a: "Podemos manter os dois: infra (sempre) + código (opcional, com SLA separado). Veja /servicos/desenvolvimento para sustentação de aplicação." },
      ],
    },
    finalCta: {
      heading: "Sua infraestrutura merece operação sênior",
      lead: "Diagnóstico gratuito da sua infraestrutura atual — apontamos riscos, oportunidades e custo otimizado em até 3 dias úteis.",
      cta: "Solicitar diagnóstico gratuito",
    },
    prefillGeneric: "Olá! Vi a página de Hospedagem Gerenciada e quero conversar sobre minha infraestrutura.",
  },
  es: {
    hero: {
      badge: "🛡️ Soporte cloud senior · 15+ años · SLA contractual",
      subline: "Tu infraestructura gestionada por un equipo que opera SaaS, e-commerce, ERP y plataformas críticas en producción hace 15+ años.",
    },
    trust: [
      { value: "15+", label: "Años sustentando infraestructura" },
      { value: "200+", label: "Sitios y sistemas activos" },
      { value: "99.9%", label: "Uptime SLA contractual" },
      { value: "<15min", label: "Respuesta a incidentes críticos" },
    ],
    authority: {
      heading: "Por qué confiar tu hosting a Agathas",
      subheading: "No somos reventa de cPanel ni hosting genérico. Operamos infraestructura cloud hace más de una década.",
      items: [
        { icon: "👨‍💻", title: "Equipo senior", desc: "Quien te atiende es el mismo que provisiona, monitorea y depura." },
        { icon: "🏗️", title: "Infraestructura a medida", desc: "Configuración específica para tu stack: WordPress, Laravel, Next.js, Node, Python, Moodle, ERP." },
        { icon: "🔐", title: "Seguridad por defecto", desc: "WAF Cloudflare, fail2ban, hardening, SSL automático, MFA, backup AES-256." },
        { icon: "📡", title: "Monitoreo 24/7", desc: "Grafana, Prometheus, Sentry, UptimeRobot." },
        { icon: "💸", title: "Costo optimizado", desc: "Cortamos 20-50% del costo cloud en promedio." },
        { icon: "🚪", title: "Cero lock-in", desc: "Infra como código. Puedes salir cuando quieras." },
      ],
    },
    cases: {
      heading: "Operaciones que sostenemos con orgullo",
      subheading: "15+ años sin incidentes públicos. Recortes anonimizados.",
      items: [
        { icon: "🛍️", segment: "E-commerce", title: "Black Friday — 12× tráfico sin caída", metric: "Pico USD 400k en 24h · 99.98% uptime", quote: "Auto-scaling Kubernetes, CDN, BD replicada, cola asíncrona." },
        { icon: "🏥", segment: "SaaS de salud", title: "Migración servidor físico → AWS sin parar", metric: "320 clínicas · 0min downtime", quote: "Replicación doble, DNS TTL bajo, cut-over nocturno." },
        { icon: "🏦", segment: "Fintech", title: "Compliance SOC 2 + GDPR aprobado", metric: "Auditoría externa pasada en primera ronda", quote: "Vault, MFA, logs inmutables, menor privilegio." },
        { icon: "🏭", segment: "ERP industrial", title: "SLA 99.95% en operación 24/7", metric: "5 fábricas · 1.800 usuarios · zero downtime", quote: "Master-slave, failover, PITR cada 5min. Failover en 47s." },
        { icon: "📰", segment: "Portal de noticias", title: "1,2M sesiones/mes con costo 60% menor", metric: "Reducimos 40% servidores manteniendo performance", quote: "Cache multinível, ISR, read-replica." },
        { icon: "💼", segment: "Plataforma corporativa", title: "Recuperación post-ransomware en 6 horas", metric: "Cliente nuevo restaurado completo", quote: "Migramos backups, reconstruimos infra en IaC, capacitamos al equipo." },
      ],
    },
    support: {
      heading: "Soporte senior en cada llamado",
      subheading: "Hablas directo con quien opera tu ambiente.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal directo, sin cola. Respuesta en 15min para críticos." },
        { icon: "⏱️", title: "SLA contractual con multa", desc: "Respuesta y resolución contractuales, con multa por incumplimiento." },
        { icon: "🧑‍🔧", title: "Ingenieros senior", desc: "Sin nivel 1. Provisionan cluster, depuran BD, configuran WAF." },
        { icon: "📊", title: "Reporte mensual ejecutivo", desc: "Uptime, eventos, backups, costos, amenazas." },
        { icon: "🛟", title: "On-call en lanzamientos", desc: "Black Friday, lanzamiento, migración — plantón 24/7." },
        { icon: "🎯", title: "Acompañamiento estratégico", desc: "Reunión mensual para revisar SLA, costo y evolución." },
      ],
    },
    stack: {
      heading: "Stack que operamos",
      subheading: "Adaptamos la infraestructura a tu sistema.",
      groups: [
        { label: "Cloud", items: ["AWS, Cloudflare, Hetzner, Vercel, bare metal"] },
        { label: "Aplicación", items: ["WordPress, Laravel, Node, Next.js, Python, Moodle", "Docker, Kubernetes"] },
        { label: "BD & cache", items: ["PostgreSQL, MySQL, MariaDB", "Redis, MongoDB, Elasticsearch", "PITR + snapshots"] },
        { label: "Seguridad & monitoreo", items: ["Cloudflare WAF + DDoS", "Fail2ban, hardening", "Grafana, Sentry, Prometheus", "Vault + rotación de secrets"] },
      ],
    },
    whatWeManage: {
      heading: "Qué incluye el soporte",
      subheading: "No necesitas entender cada ítem — solo saber que está cubierto.",
      items: [
        { icon: "🌐", title: "Sitios & e-commerce", desc: "WordPress, Laravel, Next.js, Astro. Cache, CDN, SSL, backup." },
        { icon: "📧", title: "Emails corporativos", desc: "Ilimitados en tu dominio, antispam, compatibilidad total." },
        { icon: "🔒", title: "SSL & certificados", desc: "Let's Encrypt automático." },
        { icon: "💾", title: "Backups verificados", desc: "Diario + incremental. AES-256. Restore testeado mensual." },
        { icon: "⚡", title: "Performance & CDN", desc: "CDN Cloudflare, Redis, Brotli, optimización de imagen." },
        { icon: "🛡️", title: "WAF & firewall", desc: "WAF con reglas custom. Mitigación DDoS." },
        { icon: "🔍", title: "Monitoreo", desc: "Uptime, performance, errores. Alertas WhatsApp." },
        { icon: "🛠️", title: "Actualizaciones", desc: "SO, runtime, BD, plugins críticos. En staging primero." },
        { icon: "🚨", title: "Respuesta a incidentes", desc: "Plan documentado, postmortem público cuando aplicable." },
      ],
    },
    migration: {
      heading: "Migración sin dolor en hasta 7 días hábiles",
      subheading: "Llega de tu proveedor sin perder una transacción.",
      guarantees: [
        { icon: "🛡️", title: "Garantía de integridad", desc: "Checksums antes y después. Ningún dato perdido." },
        { icon: "🧪", title: "Staging completo", desc: "Validación previa con aprobación por escrito." },
        { icon: "🌙", title: "Ventana de bajo tráfico", desc: "Cut-over fuera del horario de uso." },
        { icon: "🔁", title: "Plan de rollback", desc: "Ambiente antiguo intacto 30 días." },
      ],
      cta: "Solicitar migración",
    },
    sla: {
      heading: "SLA contractual — sin letra pequeña",
      subheading: "Todo lo prometido está en el contrato, con multa.",
      rows: [
        { metric: "Uptime mensual", promise: "99.9% (≤ 43min/mes)", how: "Monitoreo 24/7, redundancia, on-call" },
        { metric: "Respuesta — crítico", promise: "≤ 15 minutos", how: "Alerta WhatsApp + escalonamiento" },
        { metric: "Resolución — crítico", promise: "≤ 2 horas", how: "Runbook documentado" },
        { metric: "Backup", promise: "Diario + incremental", how: "Offsite AES-256, restore mensual" },
        { metric: "Restauración", promise: "≤ 4 horas (últimas 24h)", how: "PITR + snapshots" },
        { metric: "Patch crítico", promise: "≤ 72h post CVE", how: "Staging + ventana combinada" },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Migran mi sitio?", a: "Sí, incluido en setup. 7 días hábiles para sitio, BD, emails y DNS." },
        { q: "¿Funciona con cualquier stack?", a: "Sí. PHP, Node, Python o Docker a medida." },
        { q: "¿Incluyen emails?", a: "Sí, ilimitados, antispam, compatibilidad total." },
        { q: "¿Cómo es el backup?", a: "Diario + incremental, AES-256 offsite, restore mensual." },
        { q: "¿Hacen hardening?", a: "Sí, por defecto. WAF, fail2ban, MFA, logs." },
        { q: "¿Y si cae fuera de horario?", a: "On-call 24/7 monitorea. Críticos tratados inmediatamente." },
        { q: "¿Cuánto cuesta?", a: "Institucional: USD 50-100/mes. E-commerce/SaaS: USD 120-500/mes." },
        { q: "¿Hay fidelidad?", a: "No. Mensual, 30 días de aviso, sin multa." },
        { q: "¿Atienden fuera de Brasil?", a: "Sí — Portugal, España, EE. UU., Reino Unido." },
        { q: "¿Mantienen también el código?", a: "Opcional, con SLA separado. Ver /servicos/desenvolvimento." },
      ],
    },
    finalCta: {
      heading: "Tu infraestructura merece operación senior",
      lead: "Diagnóstico gratuito en hasta 3 días hábiles.",
      cta: "Solicitar diagnóstico gratuito",
    },
    prefillGeneric: "¡Hola! Vi la página de Hosting Gestionado y quiero conversar sobre mi infraestructura.",
  },
  "en-US": {
    hero: {
      badge: "🛡️ Senior cloud sustainment · 15+ years · contractual SLA",
      subline: "Your infrastructure managed by a team operating SaaS, e-commerce, ERP and critical platforms in production for 15+ years. You focus on the business; we handle uptime.",
    },
    trust: [
      { value: "15+", label: "Years sustaining infrastructure" },
      { value: "200+", label: "Active sites and systems" },
      { value: "99.9%", label: "Contractual uptime SLA" },
      { value: "<15min", label: "Critical incident response" },
    ],
    authority: {
      heading: "Why trust your hosting to Agathas",
      subheading: "Not cPanel reselling or generic hosting. We've operated cloud infrastructure on AWS, Cloudflare, Hetzner and bare metal for over a decade.",
      items: [
        { icon: "👨‍💻", title: "Senior team", desc: "Whoever helps you is the same engineer who provisions, monitors and debugs." },
        { icon: "🏗️", title: "Tailored infrastructure", desc: "Configuration specific to your stack: WordPress, Laravel, Next.js, Node, Python, Moodle, corporate ERP." },
        { icon: "🔐", title: "Security by default", desc: "Cloudflare WAF, fail2ban, OS hardening, automatic Let's Encrypt SSL, mandatory MFA, AES-256 backup." },
        { icon: "📡", title: "24/7 monitoring", desc: "Grafana, Prometheus, Sentry and UptimeRobot. When something threatens to break, we're already acting." },
        { icon: "💸", title: "Optimized cost", desc: "Continuous cloud cost audit. We cut 20-50% of what clients spent before — no performance loss." },
        { icon: "🚪", title: "Zero lock-in", desc: "Infrastructure as code. You can leave anytime, with complete documentation delivered." },
      ],
    },
    cases: {
      heading: "Operations we sustain with pride",
      subheading: "15+ years sustaining critical systems without public incidents. Real anonymized snapshots.",
      items: [
        { icon: "🛍️", segment: "E-commerce", title: "Black Friday — 12× traffic without falling", metric: "USD 400k peak in 24h · 99.98% uptime", quote: "Kubernetes auto-scaling, Cloudflare CDN, replicated DB, async queue for orders. Pre-warmed 48h before." },
        { icon: "🏥", segment: "Healthcare SaaS", title: "Migration physical → AWS without stopping service", metric: "320 clinics · 0min downtime", quote: "Dual replication, low-TTL DNS, overnight cut-over. Doctors opened the system next day unchanged." },
        { icon: "🏦", segment: "Fintech", title: "SOC 2 + GDPR compliance in regulated environment", metric: "External audit passed first round", quote: "Vault secrets, mandatory MFA, immutable logs, least privilege, documented incident plan." },
        { icon: "🏭", segment: "Industrial ERP", title: "99.95% SLA in 24/7 operation", metric: "5 factories · 1,800 users · zero planned downtime", quote: "Master-slave, automatic failover, PITR every 5min. When master disk failed, slave took over in 47 seconds." },
        { icon: "📰", segment: "News portal", title: "1.2M sessions/month at 60% lower cost", metric: "Reduced 40% of servers maintaining performance", quote: "Multi-layer cache, CDN, Next.js ISR, read-replica." },
        { icon: "💼", segment: "Corporate platform", title: "Post-ransomware recovery in 6 hours", metric: "New client fully restored", quote: "Client suffered attack with previous provider. We migrated backups, rebuilt infra in IaC, trained team on hardening." },
      ],
    },
    support: {
      heading: "Senior support on every call",
      subheading: "You talk directly to whoever operates your environment.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel. ≤15min response for critical incidents." },
        { icon: "⏱️", title: "Contractual SLA with penalty", desc: "Response and resolution contractually defined, with penalty for breach." },
        { icon: "🧑‍🔧", title: "Senior engineers", desc: "No tier-1 scripts. Whoever helps has provisioned clusters, debugged DBs, configured WAFs." },
        { icon: "📊", title: "Monthly executive report", desc: "Uptime, critical events, tested backups, optimized costs, mitigated threats." },
        { icon: "🛟", title: "On-call for launches", desc: "Black Friday, product launch, critical migration — 24/7 on-call." },
        { icon: "🎯", title: "Strategic follow-up", desc: "Monthly meeting to review SLA, cost, environment evolution." },
      ],
    },
    stack: {
      heading: "Stack we operate",
      subheading: "We adapt the infrastructure to your system, not the other way.",
      groups: [
        { label: "Cloud", items: ["AWS (EC2, RDS, S3, CloudFront, ECS)", "Cloudflare (CDN, WAF, R2, Workers)", "Hetzner (high-perf dedicated VPS)", "Vercel & Railway (Next.js, Node)", "Bare metal on demand"] },
        { label: "Application", items: ["WordPress (with serious tuning)", "Laravel, Symfony, Node.js, Next.js", "Python (Django, FastAPI)", "Moodle (see /produtos/hospedagem-moodle)", "Docker and Kubernetes containers"] },
        { label: "DB & cache", items: ["PostgreSQL, MySQL, MariaDB", "Redis, Memcached", "MongoDB, Elasticsearch", "PITR backup and snapshots", "Read-only replica for BI"] },
        { label: "Security & monitoring", items: ["Cloudflare WAF + DDoS protection", "Fail2ban, rate limit, OS hardening", "Grafana, Prometheus, Sentry", "External UptimeRobot", "Vault secrets + automatic rotation"] },
      ],
    },
    whatWeManage: {
      heading: "What's included in sustainment",
      subheading: "You don't need to understand each item — just know it's covered.",
      items: [
        { icon: "🌐", title: "Sites & e-commerce", desc: "WordPress, Laravel, Next.js, Astro and any stack. Optimized cache, CDN, SSL and backup." },
        { icon: "📧", title: "Corporate emails", desc: "Unlimited on your domain, advanced antispam, full compatibility." },
        { icon: "🔒", title: "SSL & certificates", desc: "Let's Encrypt auto-renewed on all domains and subdomains." },
        { icon: "💾", title: "Verified backups", desc: "Daily + incremental. Encrypted offsite. Monthly tested restore." },
        { icon: "⚡", title: "Performance & CDN", desc: "Cloudflare CDN on all plans. Object cache (Redis), HTTP cache, Brotli, image optimization." },
        { icon: "🛡️", title: "WAF & firewall", desc: "Cloudflare WAF with custom rules. Automatic DDoS mitigation. Bot blocking." },
        { icon: "🔍", title: "Monitoring", desc: "Uptime, performance, errors, structured logs. WhatsApp alerts when something deviates." },
        { icon: "🛠️", title: "Updates & patches", desc: "OS, runtime, DB, critical plugins. Updates in agreed window with staging." },
        { icon: "🚨", title: "Incident response", desc: "Documented incident plan, public postmortem when applicable, preventive post-event actions." },
      ],
    },
    migration: {
      heading: "Painless migration in up to 7 business days",
      subheading: "Come from your current provider without losing a transaction. We migrate sites, systems, databases, emails and DNS with rollback plan.",
      guarantees: [
        { icon: "🛡️", title: "Integrity guarantee", desc: "We compare checksums before and after. Not a single data row lost or altered." },
        { icon: "🧪", title: "Full staging", desc: "You validate the new environment on internal domain before production cut-over." },
        { icon: "🌙", title: "Low-traffic window", desc: "Cut-over during lowest usage. Low-TTL DNS, no perceivable downtime." },
        { icon: "🔁", title: "Rollback plan", desc: "Old environment kept intact for 30 days. Revert in hours if needed." },
      ],
      cta: "Request migration",
    },
    sla: {
      heading: "Contractual SLA — no fine print",
      subheading: "What we promise is in the contract, with penalty if we miss.",
      rows: [
        { metric: "Monthly uptime", promise: "99.9% (≤ 43min/month)", how: "24/7 monitoring, redundancy, on-call team" },
        { metric: "Response — critical", promise: "≤ 15 minutes", how: "WhatsApp alert + auto-escalation" },
        { metric: "Resolution — critical", promise: "≤ 2 hours", how: "Documented runbook per incident type" },
        { metric: "Backup", promise: "Daily + incremental", how: "AES-256 offsite, monthly tested restore" },
        { metric: "Restore", promise: "≤ 4 hours (last 24h)", how: "PITR and snapshots, contractual RTO" },
        { metric: "Critical patch update", promise: "≤ 72h post CVE", how: "Staging + agreed window" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you migrate my site?", a: "Yes, included in setup. 7 business days to migrate site, DB, emails and DNS. Cut-over off-hours, with rollback plan." },
        { q: "Works with WordPress / Laravel / Next.js / ERP?", a: "Works with any stack. Tailored PHP, Node, Python or Docker config." },
        { q: "Do you include corporate emails?", a: "Yes. Unlimited on your domain, antispam, full compatibility with Outlook, Apple Mail and Gmail." },
        { q: "How does backup work?", a: "Daily + incremental. AES-256 encrypted offsite. Monthly tested restore." },
        { q: "Do you do security hardening?", a: "Yes, by default. Cloudflare WAF, fail2ban, OS hardening, automatic SSL, MFA, audited logs." },
        { q: "What if my site falls off-hours?", a: "24/7 on-call monitors alerts. Critical incidents are handled immediately, day or night, weekend or holiday." },
        { q: "How much does it cost on average?", a: "Institutional sites and blogs: USD 50-100/month. E-commerce and SaaS: USD 120-500/month. Enterprise: custom quote." },
        { q: "Contract lock-in?", a: "No. Monthly contracts with 30 days notice to cancel. No penalty." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — clients in Portugal, Spain, US and UK." },
        { q: "Do you also maintain the code?", a: "Optional, with separate SLA. See /servicos/desenvolvimento." },
      ],
    },
    finalCta: {
      heading: "Your infrastructure deserves senior operation",
      lead: "Free diagnosis of your current infrastructure — risks, opportunities and optimized cost within 3 business days.",
      cta: "Request free diagnosis",
    },
    prefillGeneric: "Hi! I saw the Managed Hosting page and want to discuss my infrastructure.",
  },
  "en-GB": {
    hero: {
      badge: "🛡️ Senior cloud sustainment · 15+ years · contractual SLA",
      subline: "Your infrastructure managed by a team operating SaaS, e-commerce, ERP and critical platforms in production for 15+ years.",
    },
    trust: [
      { value: "15+", label: "Years sustaining infrastructure" },
      { value: "200+", label: "Active sites and systems" },
      { value: "99.9%", label: "Contractual uptime SLA" },
      { value: "<15min", label: "Critical incident response" },
    ],
    authority: {
      heading: "Why trust your hosting to Agathas",
      subheading: "Not cPanel reselling or generic hosting. We've operated cloud infrastructure on AWS, Cloudflare, Hetzner and bare metal for over a decade.",
      items: [
        { icon: "👨‍💻", title: "Senior team", desc: "Whoever helps you is the same engineer who provisions, monitors and debugs." },
        { icon: "🏗️", title: "Tailored infrastructure", desc: "Configuration specific to your stack: WordPress, Laravel, Next.js, Node, Python, Moodle, corporate ERP." },
        { icon: "🔐", title: "Security by default", desc: "Cloudflare WAF, fail2ban, OS hardening, automatic Let's Encrypt SSL, mandatory MFA, AES-256 backup." },
        { icon: "📡", title: "24/7 monitoring", desc: "Grafana, Prometheus, Sentry and UptimeRobot." },
        { icon: "💸", title: "Optimised cost", desc: "We cut 20-50% of what clients spent before — no performance loss." },
        { icon: "🚪", title: "Zero lock-in", desc: "Infrastructure as code. You can leave anytime." },
      ],
    },
    cases: {
      heading: "Operations we sustain with pride",
      subheading: "15+ years without public incidents. Real anonymised snapshots.",
      items: [
        { icon: "🛍️", segment: "E-commerce", title: "Black Friday — 12× traffic without falling", metric: "GBP 350k peak in 24h · 99.98% uptime", quote: "Kubernetes auto-scaling, CDN, replicated DB, async queue." },
        { icon: "🏥", segment: "Healthcare SaaS", title: "Migration physical → AWS without stopping", metric: "320 clinics · 0min downtime", quote: "Dual replication, low-TTL DNS, overnight cut-over." },
        { icon: "🏦", segment: "Fintech", title: "SOC 2 + GDPR compliance passed", metric: "External audit first round", quote: "Vault, MFA, immutable logs, least privilege." },
        { icon: "🏭", segment: "Industrial ERP", title: "99.95% SLA in 24/7 operation", metric: "5 factories · 1,800 users · zero downtime", quote: "Master-slave, failover in 47s." },
        { icon: "📰", segment: "News portal", title: "1.2M sessions/month at 60% lower cost", metric: "Reduced 40% of servers", quote: "Multi-layer cache, ISR, read-replica." },
        { icon: "💼", segment: "Corporate platform", title: "Post-ransomware recovery in 6 hours", metric: "Client fully restored", quote: "Migrated backups, rebuilt infra in IaC, trained team." },
      ],
    },
    support: {
      heading: "Senior support on every call",
      subheading: "You talk directly to whoever operates your environment.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel. ≤15min response for critical incidents." },
        { icon: "⏱️", title: "Contractual SLA with penalty", desc: "Response and resolution contractually defined." },
        { icon: "🧑‍🔧", title: "Senior engineers", desc: "No tier-1 scripts." },
        { icon: "📊", title: "Monthly executive report", desc: "Uptime, events, backups, costs, threats." },
        { icon: "🛟", title: "On-call for launches", desc: "24/7 on-call for critical periods." },
        { icon: "🎯", title: "Strategic follow-up", desc: "Monthly meeting to review SLA, cost, evolution." },
      ],
    },
    stack: {
      heading: "Stack we operate",
      subheading: "We adapt the infrastructure to your system.",
      groups: [
        { label: "Cloud", items: ["AWS, Cloudflare, Hetzner, Vercel, bare metal"] },
        { label: "Application", items: ["WordPress, Laravel, Node, Next.js, Python, Moodle", "Docker, Kubernetes"] },
        { label: "DB & cache", items: ["PostgreSQL, MySQL, MariaDB", "Redis, MongoDB, Elasticsearch", "PITR + snapshots"] },
        { label: "Security & monitoring", items: ["Cloudflare WAF + DDoS", "Fail2ban, hardening", "Grafana, Sentry, Prometheus", "Vault + secret rotation"] },
      ],
    },
    whatWeManage: {
      heading: "What's included in sustainment",
      subheading: "You don't need to understand each item — just know it's covered.",
      items: [
        { icon: "🌐", title: "Sites & e-commerce", desc: "Any stack. Cache, CDN, SSL and backup." },
        { icon: "📧", title: "Corporate emails", desc: "Unlimited on your domain, antispam, full compatibility." },
        { icon: "🔒", title: "SSL & certificates", desc: "Let's Encrypt auto-renewed." },
        { icon: "💾", title: "Verified backups", desc: "Daily + incremental. AES-256 offsite. Monthly tested restore." },
        { icon: "⚡", title: "Performance & CDN", desc: "Cloudflare CDN, Redis, Brotli, image optimisation." },
        { icon: "🛡️", title: "WAF & firewall", desc: "Cloudflare WAF, DDoS mitigation." },
        { icon: "🔍", title: "Monitoring", desc: "Uptime, performance, errors. WhatsApp alerts." },
        { icon: "🛠️", title: "Updates & patches", desc: "OS, runtime, DB, critical plugins. Staging first." },
        { icon: "🚨", title: "Incident response", desc: "Documented incident plan, public postmortem when applicable." },
      ],
    },
    migration: {
      heading: "Painless migration in up to 7 working days",
      subheading: "Bring everything from your current provider without losing a transaction.",
      guarantees: [
        { icon: "🛡️", title: "Integrity guarantee", desc: "Checksums before and after. No data lost." },
        { icon: "🧪", title: "Full staging", desc: "Validation before cut-over with written approval." },
        { icon: "🌙", title: "Low-traffic window", desc: "Cut-over off-hours." },
        { icon: "🔁", title: "Rollback plan", desc: "Old environment kept intact for 30 days." },
      ],
      cta: "Request migration",
    },
    sla: {
      heading: "Contractual SLA — no small print",
      subheading: "What we promise is in the contract, with penalty if we miss.",
      rows: [
        { metric: "Monthly uptime", promise: "99.9% (≤ 43min/month)", how: "24/7 monitoring, redundancy, on-call" },
        { metric: "Response — critical", promise: "≤ 15 minutes", how: "WhatsApp alert + auto-escalation" },
        { metric: "Resolution — critical", promise: "≤ 2 hours", how: "Documented runbook" },
        { metric: "Backup", promise: "Daily + incremental", how: "AES-256 offsite, monthly tested" },
        { metric: "Restore", promise: "≤ 4 hours (last 24h)", how: "PITR + snapshots" },
        { metric: "Critical patch", promise: "≤ 72h post CVE", how: "Staging + agreed window" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you migrate my site?", a: "Yes, included in setup. 7 working days to migrate site, DB, emails and DNS." },
        { q: "Works with any stack?", a: "Yes. PHP, Node, Python or Docker tailored." },
        { q: "Do you include emails?", a: "Yes. Unlimited, antispam, full compatibility." },
        { q: "How does backup work?", a: "Daily + incremental. AES-256 offsite. Monthly tested restore." },
        { q: "Do you do hardening?", a: "Yes, by default. WAF, fail2ban, MFA, logs." },
        { q: "What if my site falls off-hours?", a: "24/7 on-call monitors. Critical handled immediately." },
        { q: "How much does it cost?", a: "Institutional: GBP 40-80/month. E-commerce/SaaS: GBP 100-400/month." },
        { q: "Contract lock-in?", a: "No. Monthly, 30 days notice, no penalty." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US and UK." },
        { q: "Do you maintain the code?", a: "Optional, with separate SLA. See /servicos/desenvolvimento." },
      ],
    },
    finalCta: {
      heading: "Your infrastructure deserves senior operation",
      lead: "Free diagnosis within 3 working days.",
      cta: "Request free diagnosis",
    },
    prefillGeneric: "Hi! I saw the Managed Hosting page and want to discuss my infrastructure.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/produtos/hospedagem-gerenciada">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return buildPageMetadata({
    lang,
    path: "/produtos/hospedagem-gerenciada",
    title: dict.productsPages.hospedagemGerenciada.metadata.title,
    description: dict.productsPages.hospedagemGerenciada.metadata.description,
  });
}

export default async function HospedagemGerenciadaPage({ params }: PageProps<"/[lang]/produtos/hospedagem-gerenciada">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.productsPages.hospedagemGerenciada;
  const x = EXTRA[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/20 border border-cyan-500/40 rounded-full text-sm font-semibold text-cyan-300 mb-8">{x.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t.hero.titlePrefix} <span className="text-cyan-400">{t.hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <p className="mt-4 text-base text-cyan-200/80 max-w-3xl mx-auto">{x.hero.subline}</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {x.trust.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-cyan-400 mb-2">{stat.value}</div>
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
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-cyan-500/40 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.cases.heading}</h2>
            <p className="text-lg text-gray-300">{x.cases.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.cases.items.map((c) => (
              <div key={c.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(34,211,238,0.2)] flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full text-xs font-semibold">{c.segment}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{c.title}</h3>
                <div className="text-xs text-cyan-300 font-mono mb-3">{c.metric}</div>
                <p className="text-sm text-gray-300 leading-relaxed flex-1">{c.quote}</p>
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
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-cyan-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que está incluso */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.whatWeManage.heading}</h2>
            <p className="text-lg text-gray-300">{x.whatWeManage.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.whatWeManage.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 transition-all duration-300">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.stack.heading}</h2>
            <p className="text-lg text-gray-300">{x.stack.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {x.stack.groups.map((group) => (
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

      {/* Migração */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.migration.heading}</h2>
            <p className="text-lg text-gray-300">{x.migration.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {x.migration.guarantees.map((g) => (
              <div key={g.title} className="bg-voyia-gray rounded-2xl p-6 border border-cyan-500/30">
                <div className="text-3xl mb-3">{g.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{g.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <WhatsAppCta
              label={x.migration.cta}
              prefillMessage={x.prefillGeneric}
              ctaContext="hospedagem-gerenciada-migration"
              locale={lang}
              recaptchaSiteKey={recaptchaSiteKey}
              modalLabels={modalLabels}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-cyan-500/30"
            />
          </div>
        </div>
      </section>

      {/* SLA */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.sla.heading}</h2>
            <p className="text-lg text-gray-300">{x.sla.subheading}</p>
          </div>
          <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">SLA</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{lang === "pt-BR" ? "Compromisso" : lang === "es" ? "Compromiso" : "Commitment"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{lang === "pt-BR" ? "Como cumprimos" : lang === "es" ? "Cómo cumplimos" : "How we deliver"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {x.sla.rows.map((row) => (
                    <tr key={row.metric} className="hover:bg-black/20">
                      <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{row.metric}</td>
                      <td className="px-4 py-3 text-cyan-300 font-mono whitespace-nowrap">{row.promise}</td>
                      <td className="px-4 py-3 text-gray-300">{row.how}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-10 text-center">{x.faq.heading}</h2>
          <div className="space-y-4">
            {x.faq.items.map((item) => (
              <details key={item.q} className="group bg-voyia-gray rounded-xl border border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-semibold hover:bg-black/20 transition-colors list-none">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 text-cyan-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-5 text-gray-300 leading-relaxed text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-voyia-gray to-purple-600/10 border border-cyan-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(34,211,238,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{x.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{x.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={x.finalCta.cta}
                  prefillMessage={PREFILL[lang]}
                  ctaContext="hospedagem-gerenciada-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-cyan-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
