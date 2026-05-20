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

const PREFILL: Record<string, (plan: string) => string> = {
  "pt-BR": (plan) => `Olá! Tenho interesse na Hospedagem Moodle (plano ${plan}).`,
  es: (plan) => `¡Hola! Tengo interés en el Hosting Moodle (plan ${plan}).`,
  "en-US": (plan) => `Hi! I'm interested in Moodle Hosting (${plan} plan).`,
  "en-GB": (plan) => `Hi! I'm interested in Moodle Hosting (${plan} plan).`,
};

const EXTRA: Record<Locale, {
  hero: { badge: string; subline: string };
  trust: { value: string; label: string }[];
  authority: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  cases: { heading: string; subheading: string; items: { icon: string; segment: string; title: string; metric: string; quote: string }[] };
  support: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  stack: { heading: string; subheading: string; groups: { label: string; items: string[] }[] };
  migration: { heading: string; subheading: string; guarantees: { icon: string; title: string; desc: string }[]; cta: string };
  sla: { heading: string; subheading: string; rows: { metric: string; promise: string; how: string }[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; lead: string; cta: string };
  prefillGeneric: string;
}> = {
  "pt-BR": {
    hero: {
      badge: "🏆 Sustentação Moodle 24/7 · 15+ anos · Certificação HQ",
      subline: "Servidores afinados exclusivamente para Moodle. Hospedagem, monitoramento, backup, atualização e suporte sênior — sem fila de chamado, sem PHP genérico, sem dor de cabeça.",
    },
    trust: [
      { value: "15+", label: "Anos sustentando Moodle" },
      { value: "100+", label: "Instalações em produção" },
      { value: "50k+", label: "Alunos simultâneos suportados" },
      { value: "99.9%", label: "Uptime contratual" },
    ],
    authority: {
      heading: "Por que a Agathas é referência em sustentação Moodle",
      subheading: "Não somos hospedagem genérica que vendem \"plano Moodle\" como se fosse cPanel. Nossa stack foi desenhada para a complexidade real do Moodle e da operação acadêmica.",
      items: [
        { icon: "🎓", title: "Certificação Moodle HQ", desc: "Equipe com Moodle Educator Certification reconhecida internacionalmente. Atualizamos certificações a cada nova versão LTS." },
        { icon: "🛠️", title: "Stack dedicada a Moodle", desc: "PHP-FPM, OPcache, Redis, MariaDB e Nginx configurados especificamente para o padrão de IO/CPU do Moodle. Não é hospedagem WordPress maquiada." },
        { icon: "📡", title: "Monitoramento 24/7", desc: "Sentry, Grafana e UptimeRobot rodando em cima da sua plataforma. Detectamos lentidão antes do aluno reclamar — e na maioria das vezes resolvemos antes você notar." },
        { icon: "🇧🇷", title: "Suporte em português brasileiro", desc: "Atendimento técnico em horário comercial brasileiro, via WhatsApp e e-mail. Sem fila internacional, sem nível 1 que só lê script." },
        { icon: "🔄", title: "Atualizações sem dor", desc: "Subir versão do Moodle, plugin novo, customização de tema, integração com SGA — tudo executado por equipe sênior em ambiente de staging antes de tocar produção." },
        { icon: "🚪", title: "Zero lock-in", desc: "Backup completo entregue se você quiser sair. Não somos prisão técnica — nosso churn é baixo porque entregamos resultado, não por contrato amarrado." },
      ],
    },
    cases: {
      heading: "Casos de sustentação que sustentamos com orgulho",
      subheading: "Mais de 15 anos operando Moodles que jamais tiveram um incidente público. Recortes reais do que entregamos — anonimizados para preservar o cliente.",
      items: [
        { icon: "🎓", segment: "Faculdade EAD", title: "Migrando de Moodle 3.5 para 4.5 LTS sem perder uma aula", metric: "12.000 alunos · 0 reclamações no go-live", quote: "Migração executada em janela de 4 horas no fim de semana. Plugins legados portados, banco corrigido (3M+ de linhas migradas), tema institucional preservado." },
        { icon: "🏫", segment: "Rede de escolas", title: "Da hospedagem genérica para Moodle dedicado: -73% no tempo de resposta", metric: "8.500 alunos · queda de 4,2s → 1,1s no TTFB", quote: "Stack PHP-FPM + Redis + CDN configurada do zero. Cache de cursos, sessões e arquivos otimizado para o padrão de acesso pico (manhãs/segundas-feiras)." },
        { icon: "🏢", segment: "Treinamento corporativo", title: "Compliance LGPD aplicado em ambiente regulado", metric: "3.200 colaboradores · auditoria interna aprovada", quote: "Política de senhas, MFA, criptografia de PII, retenção de logs, plano de incidente e DPO designado. Pronto pra auditoria do compliance da matriz." },
        { icon: "🌍", segment: "Universidade pública", title: "Black Friday acadêmico — 4.500 alunos simultâneos no vestibular", metric: "Pico de 4.500 sessões · zero downtime", quote: "Load balancer + auto-scaling configurados para a janela de inscrição. Banco em replicação master-slave. Restauramos em 12 minutos quando o cliente apagou cursos por engano." },
        { icon: "📱", segment: "Escola de idiomas", title: "App mobile da instituição + Moodle integrado", metric: "App publicado · 60% dos alunos usando", quote: "Apps iOS/Android com a marca da escola na conta de desenvolvedor deles. Push notifications no nome da escola, login via Moodle, modo offline." },
        { icon: "💼", segment: "Curso preparatório", title: "Gateway de pagamento Pix dentro do Moodle", metric: "+R$ 480k/mês processados no Moodle · 0% de chargeback", quote: "Plugin proprietário Agathas que integra ASAAS/Pagar.me. Aluno paga dentro do Moodle, libera o curso automaticamente, gera NF-e." },
      ],
    },
    support: {
      heading: "Suporte sênior, não nível 1",
      subheading: "Nosso suporte é feito pela mesma equipe que coda, opera e desenha sua arquitetura — porque problema de Moodle não se resolve com script de atendimento.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal direto com a equipe técnica, sem fila, em horário comercial brasileiro. Resposta em até 15 minutos para incidentes." },
        { icon: "⏱️", title: "SLA contratual", desc: "Tempo de resposta e resolução por severidade definidos por contrato. Crítico em 15min, alto em 1h, normal em 4h úteis." },
        { icon: "👨‍🔧", title: "Equipe sênior em todo nível", desc: "Quem te atende já configurou Moodle, escreveu plugin, migrou versão e debugou banco em produção. Sem nível 1 lendo roteiro." },
        { icon: "📊", title: "Relatórios mensais", desc: "Relatório executivo: uso de recursos, eventos críticos, backups testados, alunos pico, tempo médio de resposta, lista de melhorias sugeridas." },
        { icon: "🛟", title: "On-call em períodos críticos", desc: "Vestibular, semana de provas, lançamento de cursos — escalamos a equipe pra plantão 24/7 sob sua demanda. Sem cobrar extra na maior parte dos casos." },
        { icon: "🎓", title: "Treinamento incluso", desc: "Capacitamos sua equipe acadêmica e administrativa pra usar o painel Moodle, gerar relatórios, lidar com matrículas em massa. Treinamento via Zoom + material gravado." },
      ],
    },
    stack: {
      heading: "A stack por trás da sua hospedagem",
      subheading: "Software e hardware afinados milimetricamente para o Moodle. Não tem cPanel, não tem WordPress dividindo CPU com você.",
      groups: [
        { label: "Aplicação", items: ["PHP 8.3 com OPcache otimizado", "PHP-FPM com pool dedicado por instância", "Sessões em Redis (sem perda no horário de pico)", "Cron Moodle isolado em worker dedicado", "Composer + Moosh para automação"] },
        { label: "Banco & cache", items: ["MariaDB 10.11+ com binlog para PITR", "Redis para sessions, cache e MUC", "Backup binlog incremental a cada 15min", "Réplica read-only para relatórios pesados", "Otimização semanal de índices"] },
        { label: "Rede & segurança", items: ["Cloudflare WAF + DDoS protection", "SSL Let's Encrypt com renovação automática", "Fail2ban + rate limit em rotas críticas", "Backup offsite criptografado (AES-256)", "Hardening do SO + auditoria de logs"] },
        { label: "Monitoramento", items: ["Grafana + Prometheus em tempo real", "Sentry para erros de aplicação", "UptimeRobot externo (verifica fora da nossa infra)", "Alertas no WhatsApp da equipe técnica", "Postmortem público em caso de incidente"] },
      ],
    },
    migration: {
      heading: "Migração assistida em até 5 dias úteis — risco zero",
      subheading: "Vem do seu fornecedor atual com tudo: usuários, cursos, notas, badges, fóruns, arquivos. Não perde uma linha de log.",
      guarantees: [
        { icon: "🛡️", title: "Garantia de paridade", desc: "Todos os usuários, cursos, notas, certificados, fóruns e tarefas migrados. Sua plataforma nova é réplica fiel da antiga, sem perdas." },
        { icon: "🧪", title: "Ambiente de homologação", desc: "Você valida em staging antes de virar a chave em produção. Aprovação por escrito antes do cut-over." },
        { icon: "🌙", title: "Janela noturna ou fim de semana", desc: "Cut-over executado fora do horário de aulas. Aluno acorda já no novo Moodle, sem perceber transição." },
        { icon: "🔁", title: "Plano de rollback", desc: "Mantemos o ambiente antigo intacto por 30 dias. Se algo der errado (raríssimo), revertemos em horas." },
      ],
      cta: "Solicitar migração assistida",
    },
    sla: {
      heading: "SLA contratual — sem letra miúda",
      subheading: "Tudo que prometemos está no contrato, com multa contratual se não cumprirmos.",
      rows: [
        { metric: "Uptime mensal", promise: "99.9% (≤ 43min downtime/mês)", how: "Redundância de banco, monitoramento 24/7, equipe on-call" },
        { metric: "Tempo de resposta — crítico", promise: "≤ 15 minutos", how: "Alerta no WhatsApp da equipe técnica, escalonamento automático" },
        { metric: "Tempo de resolução — crítico", promise: "≤ 2 horas", how: "Procedimentos documentados, runbook por tipo de incidente" },
        { metric: "Backup", promise: "Diário + binlog a cada 15min", how: "Storage offsite criptografado, restore testado mensalmente" },
        { metric: "Restauração", promise: "≤ 4 horas para últimas 24h", how: "PITR via binlog + snapshots, RTO definido por contrato" },
        { metric: "Atualização Moodle (LTS)", promise: "Em até 90 dias do release", how: "Staging completo + janela combinada com o cliente" },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "Vocês fazem migração do meu Moodle atual?", a: "Sim, incluímos no setup do plano. Em até 5 dias úteis migramos usuários, cursos, notas, badges, fóruns e arquivos do fornecedor atual sem perda. Você homologa em staging antes de virar produção." },
        { q: "E se eu já tiver muitos plugins customizados?", a: "Sem problema. Analisamos cada plugin, garantimos compatibilidade com a versão LTS e portamos customizações sob medida. Se algum plugin estiver abandonado, sugerimos alternativas equivalentes." },
        { q: "Qual versão do Moodle vocês mantêm?", a: "Sempre a LTS mais recente (Moodle 4.5 LTS hoje). Atualizamos para nova LTS dentro de 90 dias do release oficial, com staging completo." },
        { q: "Funciona com o app oficial Moodle Mobile?", a: "Sim, totalmente compatível. E se quiser app com a marca da sua instituição, temos serviço dedicado em /produtos/aplicativo-moodle." },
        { q: "Posso integrar gateway de pagamento dentro do Moodle?", a: "Sim. Temos plugin proprietário que integra ASAAS, Pagar.me e Stripe. Aluno paga dentro do Moodle, libera o curso automaticamente e gera nota fiscal." },
        { q: "Como funciona o backup?", a: "Backup completo diário + binlog incremental a cada 15 minutos. Storage offsite criptografado AES-256. Restore testado mensalmente — porque backup que não restaura não é backup." },
        { q: "Vocês oferecem ambiente de homologação?", a: "Sim, em todos os planos Professional e Enterprise. Ambiente espelhado em domínio interno (staging.suamarca.com.br) pra validar plugins, temas e atualizações antes de virar pra produção." },
        { q: "E se meu Moodle crescer mais do que o plano?", a: "Migração entre planos é gratuita e sem janela de downtime perceptível. Avisamos com antecedência quando você está chegando no limite — em geral 60 dias antes de impacto operacional." },
        { q: "Tenho fidelidade contratual?", a: "Contratos mensais sem fidelidade longa. Cancelamento com 30 dias de aviso prévio e devolução de todos os dados em formato padrão. Sem multa." },
        { q: "Atendem fora do Brasil?", a: "Sim — Portugal, Espanha, EUA e Reino Unido. Faturamento em BRL, EUR, USD ou GBP com NF-e/Invoice oficial. Servidor pode ser hospedado na região mais próxima dos seus alunos." },
      ],
    },
    finalCta: {
      heading: "Vamos botar o seu Moodle nas mãos de quem entende?",
      lead: "Diagnóstico gratuito do seu Moodle atual — apontamos gargalos, oportunidades e proposta de migração em até 3 dias úteis.",
      cta: "Solicitar diagnóstico gratuito",
    },
    prefillGeneric: "Olá! Vi a página de Hospedagem Moodle e quero conversar sobre minha plataforma EAD.",
  },
  es: {
    hero: {
      badge: "🏆 Soporte Moodle 24/7 · 15+ años · Certificación HQ",
      subline: "Servidores afinados exclusivamente para Moodle. Hosting, monitoreo, backup, actualización y soporte senior — sin cola, sin PHP genérico, sin dolor de cabeza.",
    },
    trust: [
      { value: "15+", label: "Años sustentando Moodle" },
      { value: "100+", label: "Instalaciones en producción" },
      { value: "50k+", label: "Alumnos simultáneos soportados" },
      { value: "99.9%", label: "Uptime contractual" },
    ],
    authority: {
      heading: "Por qué Agathas es referencia en soporte Moodle",
      subheading: "No somos hosting genérico vendiendo \"plan Moodle\" como cPanel. Nuestro stack está diseñado para la complejidad real de Moodle.",
      items: [
        { icon: "🎓", title: "Certificación Moodle HQ", desc: "Equipo con Moodle Educator Certification internacional. Actualizada cada nueva LTS." },
        { icon: "🛠️", title: "Stack dedicado a Moodle", desc: "PHP-FPM, OPcache, Redis, MariaDB y Nginx configurados específicamente para Moodle." },
        { icon: "📡", title: "Monitoreo 24/7", desc: "Sentry, Grafana y UptimeRobot. Detectamos lentitud antes que el alumno reclame." },
        { icon: "🌎", title: "Soporte en español", desc: "Atención técnica en horario comercial, vía WhatsApp y email. Sin cola internacional." },
        { icon: "🔄", title: "Actualizaciones sin dolor", desc: "Versión nueva, plugin, tema, integración — todo en staging antes de tocar producción." },
        { icon: "🚪", title: "Cero lock-in", desc: "Backup completo si quieres salir. No retenemos clientes por contrato amarrado." },
      ],
    },
    cases: {
      heading: "Casos de soporte que sostenemos con orgullo",
      subheading: "Más de 15 años operando Moodles sin incidentes públicos. Recortes reales — anonimizados.",
      items: [
        { icon: "🎓", segment: "Facultad e-learning", title: "Migrando Moodle 3.5 → 4.5 LTS sin perder una clase", metric: "12.000 alumnos · 0 reclamos en el go-live", quote: "Migración en ventana de 4 horas. Plugins portados, banco corregido, tema preservado." },
        { icon: "🏫", segment: "Red de colegios", title: "De hosting genérico a Moodle dedicado: -73% en tiempo de respuesta", metric: "8.500 alumnos · 4,2s → 1,1s TTFB", quote: "Stack PHP-FPM + Redis + CDN. Cache de cursos y sesiones optimizado para el pico." },
        { icon: "🏢", segment: "Entrenamiento corporativo", title: "GDPR aplicado en entorno regulado", metric: "3.200 colaboradores · auditoría aprobada", quote: "MFA, cifrado de PII, retención de logs, plan de incidente y DPO. Listo para compliance." },
        { icon: "🌍", segment: "Universidad pública", title: "Pico académico — 4.500 alumnos simultáneos", metric: "Pico 4.500 sesiones · zero downtime", quote: "Load balancer + auto-scaling. BD master-slave. Restore en 12min cuando borraron cursos." },
        { icon: "📱", segment: "Escuela de idiomas", title: "App móvil de la institución + Moodle integrado", metric: "App en 8 semanas · 60% de alumnos usándola", quote: "Apps iOS/Android con la marca, push notifications con el nombre, login Moodle, offline." },
        { icon: "💼", segment: "Curso preparatorio", title: "Pago dentro de Moodle", metric: "+R$ 480k/mes procesados · 0% chargeback", quote: "Plugin propio que integra pasarelas. Pago en Moodle, libera curso, genera factura." },
      ],
    },
    support: {
      heading: "Soporte senior, no nivel 1",
      subheading: "Soporte hecho por el mismo equipo que codifica y opera — problemas de Moodle no se resuelven con script.",
      items: [
        { icon: "💬", title: "WhatsApp dedicado", desc: "Canal directo con el equipo técnico, sin cola. Respuesta en 15min para incidentes críticos." },
        { icon: "⏱️", title: "SLA contractual", desc: "Tiempo de respuesta por severidad definido por contrato. Crítico 15min, alto 1h." },
        { icon: "👨‍🔧", title: "Equipo senior", desc: "Quien te atiende ya configuró Moodle, escribió plugin, migró versión y debugó banco." },
        { icon: "📊", title: "Reportes mensuales", desc: "Uso de recursos, eventos críticos, backups testeados, picos, mejoras sugeridas." },
        { icon: "🛟", title: "On-call en períodos críticos", desc: "Vestibulares, semana de pruebas, lanzamiento — equipo en plantón 24/7." },
        { icon: "🎓", title: "Capacitación incluida", desc: "Capacitamos a tu equipo académico y administrativo. Zoom + material grabado." },
      ],
    },
    stack: {
      heading: "El stack detrás de tu hosting",
      subheading: "Software y hardware afinados milimétricamente para Moodle. Sin cPanel, sin WordPress compartiendo CPU.",
      groups: [
        { label: "Aplicación", items: ["PHP 8.3 + OPcache optimizado", "PHP-FPM con pool dedicado", "Sesiones en Redis", "Cron Moodle aislado", "Composer + Moosh"] },
        { label: "BD & cache", items: ["MariaDB 10.11+ con binlog para PITR", "Redis para sessions y MUC", "Backup binlog cada 15min", "Réplica read-only", "Optimización semanal de índices"] },
        { label: "Red & seguridad", items: ["Cloudflare WAF + DDoS", "SSL Let's Encrypt automático", "Fail2ban + rate limit", "Backup offsite AES-256", "Hardening SO + auditoría"] },
        { label: "Monitoreo", items: ["Grafana + Prometheus", "Sentry para errores", "UptimeRobot externo", "Alertas WhatsApp", "Postmortem público"] },
      ],
    },
    migration: {
      heading: "Migración asistida en hasta 5 días hábiles — riesgo cero",
      subheading: "Llega de tu proveedor actual con todo: usuarios, cursos, notas, badges, foros, archivos.",
      guarantees: [
        { icon: "🛡️", title: "Garantía de paridad", desc: "Usuarios, cursos, notas, certificados, foros y tareas migrados. Réplica fiel." },
        { icon: "🧪", title: "Ambiente de homologación", desc: "Validas en staging antes de cambiar a producción. Aprobación por escrito." },
        { icon: "🌙", title: "Ventana nocturna o fin de semana", desc: "Cut-over fuera de horario de clases. El alumno no nota la transición." },
        { icon: "🔁", title: "Plan de rollback", desc: "Mantenemos ambiente antiguo 30 días. Revertimos en horas si fuera necesario." },
      ],
      cta: "Solicitar migración asistida",
    },
    sla: {
      heading: "SLA contractual — sin letra pequeña",
      subheading: "Todo lo prometido está en el contrato, con multa si no cumplimos.",
      rows: [
        { metric: "Uptime mensual", promise: "99.9% (≤ 43min/mes)", how: "Redundancia, monitoreo 24/7, on-call" },
        { metric: "Respuesta — crítico", promise: "≤ 15 minutos", how: "Alerta WhatsApp, escalonamiento" },
        { metric: "Resolución — crítico", promise: "≤ 2 horas", how: "Runbook por incidente" },
        { metric: "Backup", promise: "Diario + binlog 15min", how: "Storage offsite cifrado, restore testeado" },
        { metric: "Restauración", promise: "≤ 4 horas últimas 24h", how: "PITR + snapshots, RTO por contrato" },
        { metric: "Actualización Moodle", promise: "≤ 90 días del release LTS", how: "Staging completo + ventana combinada" },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Migran mi Moodle actual?", a: "Sí, incluido en el setup. 5 días hábiles para migrar usuarios, cursos, notas, foros y archivos." },
        { q: "¿Y si tengo muchos plugins customizados?", a: "Analizamos cada uno, garantizamos compatibilidad con LTS y portamos." },
        { q: "¿Qué versión mantienen?", a: "LTS más reciente (Moodle 4.5 LTS hoy). Update en 90 días desde release." },
        { q: "¿Funciona con app oficial Moodle Mobile?", a: "Sí. Y si quieres app con tu marca, ver /produtos/aplicativo-moodle." },
        { q: "¿Integran pasarela de pago?", a: "Sí. Plugin propio con pasarelas. Pago en Moodle, libera curso, genera factura." },
        { q: "¿Cómo funciona el backup?", a: "Diario + binlog cada 15min. Storage offsite AES-256. Restore testeado mensual." },
        { q: "¿Hay ambiente de homologación?", a: "Sí, en Professional y Enterprise. Staging espejado para validar antes de producción." },
        { q: "¿Y si crezco más que el plan?", a: "Migración entre planes gratuita. Aviso 60 días antes del límite." },
        { q: "¿Hay fidelidad?", a: "Mensual sin fidelidad larga. Cancelación con 30 días, sin multa." },
        { q: "¿Atienden fuera de Brasil?", a: "Sí — Portugal, España, EE. UU., Reino Unido. BRL, EUR, USD, GBP." },
      ],
    },
    finalCta: {
      heading: "¿Le ponemos tu Moodle en manos de quien entiende?",
      lead: "Diagnóstico gratuito — gargalos, oportunidades y propuesta en 3 días hábiles.",
      cta: "Solicitar diagnóstico gratuito",
    },
    prefillGeneric: "¡Hola! Vi la página de Hosting Moodle y quiero conversar sobre mi plataforma.",
  },
  "en-US": {
    hero: {
      badge: "🏆 24/7 Moodle support · 15+ years · HQ certified",
      subline: "Servers tuned exclusively for Moodle. Hosting, monitoring, backup, updates and senior support — no queue, no generic PHP, no headache.",
    },
    trust: [
      { value: "15+", label: "Years sustaining Moodle" },
      { value: "100+", label: "Production installs" },
      { value: "50k+", label: "Concurrent students supported" },
      { value: "99.9%", label: "Contractual uptime" },
    ],
    authority: {
      heading: "Why Agathas is a reference in Moodle sustainment",
      subheading: "Not generic hosting selling \"Moodle plan\" like cPanel. Our stack is designed for Moodle's real complexity.",
      items: [
        { icon: "🎓", title: "Moodle HQ certification", desc: "Team with internationally-recognized Moodle Educator Certification. Refreshed each LTS." },
        { icon: "🛠️", title: "Moodle-dedicated stack", desc: "PHP-FPM, OPcache, Redis, MariaDB and Nginx tuned specifically for Moodle's IO/CPU pattern." },
        { icon: "📡", title: "24/7 monitoring", desc: "Sentry, Grafana, UptimeRobot. We detect slowness before students complain." },
        { icon: "🌎", title: "Multi-language support", desc: "Support in Portuguese, Spanish and English during business hours. No tier-1 reading scripts." },
        { icon: "🔄", title: "Painless updates", desc: "Moodle version, new plugin, theme, integration — everything on staging before production." },
        { icon: "🚪", title: "Zero lock-in", desc: "Full backup delivered if you want to leave. We don't retain clients by contract." },
      ],
    },
    cases: {
      heading: "Sustainment cases we're proud of",
      subheading: "15+ years operating Moodles without public incidents. Real anonymized snapshots.",
      items: [
        { icon: "🎓", segment: "E-learning college", title: "Migrating Moodle 3.5 → 4.5 LTS without missing a class", metric: "12,000 students · 0 go-live complaints", quote: "Migration in 4-hour weekend window. Legacy plugins ported, DB fixed (3M+ rows), theme preserved." },
        { icon: "🏫", segment: "School network", title: "From generic hosting to dedicated Moodle: -73% response time", metric: "8,500 students · 4.2s → 1.1s TTFB", quote: "PHP-FPM + Redis + CDN stack. Course/session/file cache optimized for peak access patterns." },
        { icon: "🏢", segment: "Corporate training", title: "GDPR applied in regulated environment", metric: "3,200 employees · internal audit approved", quote: "Password policy, MFA, PII encryption, log retention, incident plan and DPO. Compliance-ready." },
        { icon: "🌍", segment: "Public university", title: "Academic peak — 4,500 concurrent students", metric: "Peak 4,500 sessions · zero downtime", quote: "Load balancer + auto-scaling. Master-slave DB. Restored in 12min when client accidentally deleted courses." },
        { icon: "📱", segment: "Language school", title: "Branded mobile app + integrated Moodle", metric: "App live in 8 weeks · 60% student adoption", quote: "iOS/Android apps with school brand, push notifications under school name, Moodle login, offline mode." },
        { icon: "💼", segment: "Prep course", title: "In-Moodle payment gateway", metric: "+USD 90k/month processed · 0% chargeback", quote: "Proprietary plugin integrating ASAAS/Stripe. Student pays in Moodle, course unlocked, invoice issued." },
      ],
    },
    support: {
      heading: "Senior support, not tier-1",
      subheading: "Support delivered by the same team that codes, operates and designs your architecture — Moodle issues don't yield to scripts.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel with the tech team. ≤15min response for critical incidents." },
        { icon: "⏱️", title: "Contractual SLA", desc: "Response and resolution by severity defined contractually." },
        { icon: "👨‍🔧", title: "Senior team", desc: "Whoever helps you has configured Moodle, written plugins, migrated versions and debugged DB in production." },
        { icon: "📊", title: "Monthly reports", desc: "Resource usage, critical events, tested backups, peaks, suggested improvements." },
        { icon: "🛟", title: "On-call in critical periods", desc: "Exam weeks, course launches — team on 24/7 on-call." },
        { icon: "🎓", title: "Training included", desc: "We train your academic and admin teams. Zoom + recorded material." },
      ],
    },
    stack: {
      heading: "The stack behind your hosting",
      subheading: "Software and hardware millimetrically tuned for Moodle. No cPanel, no WordPress sharing CPU.",
      groups: [
        { label: "Application", items: ["PHP 8.3 with optimized OPcache", "PHP-FPM with dedicated pool per instance", "Redis sessions (no loss at peak)", "Isolated Moodle cron worker", "Composer + Moosh automation"] },
        { label: "DB & cache", items: ["MariaDB 10.11+ with PITR binlog", "Redis for sessions, cache and MUC", "Incremental binlog backup every 15min", "Read-only replica for heavy reports", "Weekly index optimization"] },
        { label: "Network & security", items: ["Cloudflare WAF + DDoS protection", "Let's Encrypt SSL with auto-renewal", "Fail2ban + rate limit on critical paths", "AES-256 encrypted offsite backup", "OS hardening + log audit"] },
        { label: "Monitoring", items: ["Real-time Grafana + Prometheus", "Sentry for application errors", "External UptimeRobot (outside our infra)", "WhatsApp alerts to tech team", "Public postmortems for incidents"] },
      ],
    },
    migration: {
      heading: "Assisted migration in up to 5 business days — zero risk",
      subheading: "Bring everything from your current provider: users, courses, grades, badges, forums, files. Not a single log line lost.",
      guarantees: [
        { icon: "🛡️", title: "Parity guarantee", desc: "All users, courses, grades, certificates, forums and assignments migrated. Faithful replica." },
        { icon: "🧪", title: "Staging environment", desc: "You validate on staging before production cut-over. Written approval required." },
        { icon: "🌙", title: "Night or weekend window", desc: "Cut-over outside class hours. Students wake up on the new Moodle without noticing." },
        { icon: "🔁", title: "Rollback plan", desc: "Old environment kept intact for 30 days. If anything goes wrong (rare), we revert in hours." },
      ],
      cta: "Request assisted migration",
    },
    sla: {
      heading: "Contractual SLA — no fine print",
      subheading: "Everything we promise is in the contract, with contractual penalty if we miss.",
      rows: [
        { metric: "Monthly uptime", promise: "99.9% (≤43min downtime/month)", how: "DB redundancy, 24/7 monitoring, on-call team" },
        { metric: "Response — critical", promise: "≤15 minutes", how: "WhatsApp alerts to tech team, auto-escalation" },
        { metric: "Resolution — critical", promise: "≤2 hours", how: "Documented procedures, runbook by incident type" },
        { metric: "Backup", promise: "Daily + 15min binlog", how: "Encrypted offsite storage, monthly tested restore" },
        { metric: "Restore", promise: "≤4 hours for last 24h", how: "PITR via binlog + snapshots, contractual RTO" },
        { metric: "Moodle update (LTS)", promise: "Within 90 days of release", how: "Full staging + window agreed with client" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you migrate my current Moodle?", a: "Yes, included in plan setup. 5 business days to migrate users, courses, grades, forums and files without loss." },
        { q: "What if I have many custom plugins?", a: "We analyze each one, guarantee LTS compatibility and port customizations." },
        { q: "Which version do you maintain?", a: "Latest LTS (Moodle 4.5 LTS now). We update to new LTS within 90 days." },
        { q: "Works with official Moodle Mobile?", a: "Yes. If you want a branded app, see /produtos/aplicativo-moodle." },
        { q: "Can I integrate payment in Moodle?", a: "Yes. Proprietary plugin with Stripe/ASAAS. Pay inside Moodle, unlock course, generate invoice." },
        { q: "How does backup work?", a: "Daily + 15min binlog. AES-256 encrypted offsite. Monthly tested restore." },
        { q: "Do you offer staging?", a: "Yes, Professional and Enterprise plans. Mirrored staging at internal subdomain." },
        { q: "What if I outgrow my plan?", a: "Plan migration is free and seamless. We notify ~60 days before operational impact." },
        { q: "Contract lock-in?", a: "Monthly contracts, no long lock-in. 30 days notice cancellation, no penalty." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US, UK. Invoicing in BRL, EUR, USD, GBP." },
      ],
    },
    finalCta: {
      heading: "Shall we put your Moodle in expert hands?",
      lead: "Free diagnosis of your current Moodle — bottlenecks, opportunities and migration proposal in 3 business days.",
      cta: "Request free diagnosis",
    },
    prefillGeneric: "Hi! I saw the Moodle Hosting page and want to discuss my e-learning platform.",
  },
  "en-GB": {
    hero: {
      badge: "🏆 24/7 Moodle support · 15+ years · HQ certified",
      subline: "Servers tuned exclusively for Moodle. Hosting, monitoring, backup, updates and senior support — no queue, no generic PHP, no headache.",
    },
    trust: [
      { value: "15+", label: "Years sustaining Moodle" },
      { value: "100+", label: "Production installs" },
      { value: "50k+", label: "Concurrent students supported" },
      { value: "99.9%", label: "Contractual uptime" },
    ],
    authority: {
      heading: "Why Agathas is a reference in Moodle sustainment",
      subheading: "Not generic hosting selling \"Moodle plan\" like cPanel. Our stack is designed for Moodle's real complexity.",
      items: [
        { icon: "🎓", title: "Moodle HQ certification", desc: "Team with internationally-recognised Moodle Educator Certification. Refreshed each LTS." },
        { icon: "🛠️", title: "Moodle-dedicated stack", desc: "PHP-FPM, OPcache, Redis, MariaDB and Nginx tuned specifically for Moodle's IO/CPU pattern." },
        { icon: "📡", title: "24/7 monitoring", desc: "Sentry, Grafana, UptimeRobot. We detect slowness before students complain." },
        { icon: "🌎", title: "Multi-language support", desc: "Support in Portuguese, Spanish and English during business hours. No tier-1 reading scripts." },
        { icon: "🔄", title: "Painless updates", desc: "Moodle version, new plugin, theme, integration — everything on staging before production." },
        { icon: "🚪", title: "Zero lock-in", desc: "Full backup delivered if you want to leave. We don't retain clients by contract." },
      ],
    },
    cases: {
      heading: "Sustainment cases we're proud of",
      subheading: "15+ years operating Moodles without public incidents. Real anonymised snapshots.",
      items: [
        { icon: "🎓", segment: "E-learning college", title: "Migrating Moodle 3.5 → 4.5 LTS without missing a class", metric: "12,000 students · 0 go-live complaints", quote: "Migration in 4-hour weekend window. Legacy plugins ported, DB fixed, theme preserved." },
        { icon: "🏫", segment: "School network", title: "From generic hosting to dedicated Moodle: -73% response time", metric: "8,500 students · 4.2s → 1.1s TTFB", quote: "PHP-FPM + Redis + CDN stack. Cache optimised for peak access patterns." },
        { icon: "🏢", segment: "Corporate training", title: "GDPR applied in regulated environment", metric: "3,200 employees · internal audit approved", quote: "Password policy, MFA, PII encryption, log retention, incident plan and DPO. Compliance-ready." },
        { icon: "🌍", segment: "Public university", title: "Academic peak — 4,500 concurrent students", metric: "Peak 4,500 sessions · zero downtime", quote: "Load balancer + auto-scaling. Master-slave DB. Restored in 12min when client accidentally deleted courses." },
        { icon: "📱", segment: "Language school", title: "Branded mobile app + integrated Moodle", metric: "App live in 8 weeks · 60% student adoption", quote: "iOS/Android apps with school brand, push notifications under school name, Moodle login, offline mode." },
        { icon: "💼", segment: "Prep course", title: "In-Moodle payment gateway", metric: "+GBP 75k/month processed · 0% chargeback", quote: "Proprietary plugin integrating Stripe/ASAAS. Student pays in Moodle, course unlocked, invoice issued." },
      ],
    },
    support: {
      heading: "Senior support, not tier-1",
      subheading: "Support delivered by the same team that codes, operates and designs your architecture.",
      items: [
        { icon: "💬", title: "Dedicated WhatsApp", desc: "Direct channel with the tech team. ≤15min response for critical incidents." },
        { icon: "⏱️", title: "Contractual SLA", desc: "Response and resolution by severity defined contractually." },
        { icon: "👨‍🔧", title: "Senior team", desc: "Whoever helps you has configured Moodle, written plugins, migrated versions and debugged DB in production." },
        { icon: "📊", title: "Monthly reports", desc: "Resource usage, critical events, tested backups, peaks, suggested improvements." },
        { icon: "🛟", title: "On-call in critical periods", desc: "Exam weeks, course launches — team on 24/7 on-call." },
        { icon: "🎓", title: "Training included", desc: "We train your academic and admin teams. Zoom + recorded material." },
      ],
    },
    stack: {
      heading: "The stack behind your hosting",
      subheading: "Software and hardware millimetrically tuned for Moodle. No cPanel, no WordPress sharing CPU.",
      groups: [
        { label: "Application", items: ["PHP 8.3 with optimised OPcache", "PHP-FPM with dedicated pool per instance", "Redis sessions (no loss at peak)", "Isolated Moodle cron worker", "Composer + Moosh automation"] },
        { label: "DB & cache", items: ["MariaDB 10.11+ with PITR binlog", "Redis for sessions, cache and MUC", "Incremental binlog backup every 15min", "Read-only replica for heavy reports", "Weekly index optimisation"] },
        { label: "Network & security", items: ["Cloudflare WAF + DDoS protection", "Let's Encrypt SSL with auto-renewal", "Fail2ban + rate limit on critical paths", "AES-256 encrypted offsite backup", "OS hardening + log audit"] },
        { label: "Monitoring", items: ["Real-time Grafana + Prometheus", "Sentry for application errors", "External UptimeRobot (outside our infra)", "WhatsApp alerts to tech team", "Public postmortems for incidents"] },
      ],
    },
    migration: {
      heading: "Assisted migration in up to 5 working days — zero risk",
      subheading: "Bring everything from your current provider: users, courses, grades, badges, forums, files.",
      guarantees: [
        { icon: "🛡️", title: "Parity guarantee", desc: "All users, courses, grades, certificates, forums and assignments migrated." },
        { icon: "🧪", title: "Staging environment", desc: "You validate on staging before production cut-over. Written approval required." },
        { icon: "🌙", title: "Night or weekend window", desc: "Cut-over outside class hours. Students wake up on the new Moodle without noticing." },
        { icon: "🔁", title: "Rollback plan", desc: "Old environment kept intact for 30 days. If anything goes wrong, we revert in hours." },
      ],
      cta: "Request assisted migration",
    },
    sla: {
      heading: "Contractual SLA — no small print",
      subheading: "Everything we promise is in the contract, with contractual penalty if we miss.",
      rows: [
        { metric: "Monthly uptime", promise: "99.9% (≤43min downtime/month)", how: "DB redundancy, 24/7 monitoring, on-call team" },
        { metric: "Response — critical", promise: "≤15 minutes", how: "WhatsApp alerts to tech team, auto-escalation" },
        { metric: "Resolution — critical", promise: "≤2 hours", how: "Documented procedures, runbook by incident type" },
        { metric: "Backup", promise: "Daily + 15min binlog", how: "Encrypted offsite storage, monthly tested restore" },
        { metric: "Restore", promise: "≤4 hours for last 24h", how: "PITR via binlog + snapshots, contractual RTO" },
        { metric: "Moodle update (LTS)", promise: "Within 90 days of release", how: "Full staging + window agreed with client" },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "Do you migrate my current Moodle?", a: "Yes, included in plan setup. 5 working days to migrate users, courses, grades, forums and files without loss." },
        { q: "What if I have many custom plugins?", a: "We analyse each one, guarantee LTS compatibility and port customisations." },
        { q: "Which version do you maintain?", a: "Latest LTS (Moodle 4.5 LTS now). We update to new LTS within 90 days." },
        { q: "Works with official Moodle Mobile?", a: "Yes. If you want a branded app, see /produtos/aplicativo-moodle." },
        { q: "Can I integrate payment in Moodle?", a: "Yes. Proprietary plugin with Stripe/ASAAS." },
        { q: "How does backup work?", a: "Daily + 15min binlog. AES-256 encrypted offsite. Monthly tested restore." },
        { q: "Do you offer staging?", a: "Yes, Professional and Enterprise plans. Mirrored staging at internal subdomain." },
        { q: "What if I outgrow my plan?", a: "Plan migration is free and seamless." },
        { q: "Contract lock-in?", a: "Monthly contracts, no long lock-in. 30 days notice cancellation, no penalty." },
        { q: "Do you serve clients outside Brazil?", a: "Yes — Portugal, Spain, US, UK." },
      ],
    },
    finalCta: {
      heading: "Shall we put your Moodle in expert hands?",
      lead: "Free diagnosis of your current Moodle — bottlenecks, opportunities and migration proposal in 3 working days.",
      cta: "Request free diagnosis",
    },
    prefillGeneric: "Hi! I saw the Moodle Hosting page and want to discuss my e-learning platform.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/produtos/hospedagem-moodle">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);
  return {
    title: dict.productsPages.hospedagemMoodle.metadata.title,
    description: dict.productsPages.hospedagemMoodle.metadata.description,
    alternates: {
      canonical: `${origin}/produtos/hospedagem-moodle`,
      languages: buildHreflangAlternates("/produtos/hospedagem-moodle"),
    },
  };
}

export default async function HospedagemMoodlePage({ params }: PageProps<"/[lang]/produtos/hospedagem-moodle">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.productsPages.hospedagemMoodle;
  const x = EXTRA[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/40 rounded-full text-sm font-semibold text-orange-300 mb-8">{x.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t.hero.titlePrefix} <span className="text-orange-400">{t.hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <p className="mt-4 text-base text-orange-200/80 max-w-3xl mx-auto">{x.hero.subline}</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {x.trust.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-orange-400 mb-2">{stat.value}</div>
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
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-orange-500/40 transition-colors">
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
              <div key={c.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.2)] flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-full text-xs font-semibold">{c.segment}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{c.title}</h3>
                <div className="text-xs text-orange-300 font-mono mb-3">{c.metric}</div>
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
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">{t.plansTitle}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-700 mx-auto rounded-full mb-12" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {t.plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 ${plan.featured ? "bg-gradient-to-b from-orange-500/15 to-voyia-gray border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]" : "bg-voyia-gray border-gray-700"}`}>
                {plan.featured && <span className="bg-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">{t.popularBadge}</span>}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-orange-400 font-semibold mb-6">{plan.alunos}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center text-gray-300 text-sm">
                      <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <WhatsAppCta
                  label={t.cta}
                  prefillMessage={PREFILL[lang](plan.name)}
                  ctaContext={`hospedagem-moodle-${plan.name.toLowerCase()}`}
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${plan.featured ? "bg-orange-500 hover:bg-orange-400 text-black" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack técnica */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.stack.heading}</h2>
            <p className="text-lg text-gray-300">{x.stack.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {x.stack.groups.map((group) => (
              <div key={group.label} className="bg-voyia-gray rounded-2xl p-5 border border-gray-700">
                <h3 className="text-base font-bold text-orange-300 mb-3 uppercase tracking-wider">{group.label}</h3>
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
              <div key={g.title} className="bg-voyia-gray rounded-2xl p-6 border border-orange-500/30">
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
              ctaContext="hospedagem-moodle-migration"
              locale={lang}
              recaptchaSiteKey={recaptchaSiteKey}
              modalLabels={modalLabels}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-orange-500/30"
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
                      <td className="px-4 py-3 text-orange-300 font-mono whitespace-nowrap">{row.promise}</td>
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
                  <svg className="w-5 h-5 text-orange-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-voyia-gray to-purple-600/10 border border-orange-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(249,115,22,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{x.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{x.finalCta.lead}</p>
              <div className="flex justify-center">
                <WhatsAppCta
                  label={x.finalCta.cta}
                  prefillMessage={x.prefillGeneric}
                  ctaContext="hospedagem-moodle-final-cta"
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
