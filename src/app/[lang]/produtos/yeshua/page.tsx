import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  isLocale,
  buildPageMetadata,
  type Locale,
} from "@/lib/i18n";
import WhatsAppCta from "@/components/whatsapp/WhatsAppCta";
import AnaliseForm, { type AnaliseLabels } from "./AnaliseForm";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

const PREFILL: Record<string, string> = {
  "pt-BR": "Olá! Quero conhecer o YESHUA — o ERP para agências.",
  es: "¡Hola! Quiero conocer YESHUA — el ERP para agencias.",
  "en-US": "Hi! I want to learn about YESHUA — the ERP for agencies.",
  "en-GB": "Hi! I want to learn about YESHUA — the ERP for agencies.",
};

const EXTRA: Record<Locale, {
  hero: { badge: string; subline: string; ctaPrimary: string; ctaSecondary: string };
  trust: { value: string; label: string }[];
  authority: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  problem: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  modules: { heading: string; subheading: string; groups: { label: string; icon: string; items: string[] }[] };
  roi: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[]; note: string };
  integrations: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  flow: { heading: string; subheading: string; steps: { num: string; title: string; desc: string }[] };
  whoFor: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[] };
  privacy: { heading: string; subheading: string; items: { icon: string; title: string; desc: string }[]; linkLabel: string };
  faq: { heading: string; items: { q: string; a: string }[] };
  analise: { heading: string; subheading: string; steps: string[]; form: AnaliseLabels };
  finalCta: { heading: string; lead: string; cta: string; whatsapp: string };
}> = {
  "pt-BR": {
    hero: {
      badge: "⚡ YESHUA · o ERP que a Agathas usa para operar a própria agência",
      subline: "Tráfego pago, leads, social media, financeiro e fiscal no mesmo painel — conectados por APIs oficiais, do primeiro clique do anúncio até o dinheiro entrando na conta.",
      ctaPrimary: "Solicitar análise",
      ctaSecondary: "Ver os módulos",
    },
    trust: [
      { value: "6", label: "Módulos em um só painel" },
      { value: "100%", label: "APIs oficiais, sem scraping" },
      { value: "24/7", label: "Alertas de conta, saldo e lead" },
      { value: "1", label: "Fonte de verdade da agência" },
    ],
    authority: {
      heading: "Por que um ERP feito por agência, para agência",
      subheading: "O YESHUA não foi desenhado numa reunião de produto. Ele nasceu da operação diária da Agathas Web — e cada módulo existe porque a dor apareceu aqui primeiro.",
      items: [
        { icon: "🧪", title: "Nasceu em produção, não em slide", desc: "A Agathas opera o próprio negócio dentro do YESHUA: contas de anúncio de clientes, cobrança recorrente, notas fiscais e atendimento. O que você vê na tela é o que roda aqui todo dia." },
        { icon: "🔌", title: "APIs oficiais, sem gambiarra", desc: "Meta Marketing API, Google Ads API, WhatsApp Business API, ASAAS e Serpro Integra Contador. Nada de scraping, extensão de navegador ou robô clicando em tela — que quebra na primeira mudança de layout." },
        { icon: "🇧🇷", title: "Fiscal brasileiro de verdade", desc: "NFS-e municipal, apuração do Simples, certificado digital A1 e-CNPJ, boleto e Pix conciliados. ERP importado não entende nota de serviço, DAS nem regime tributário brasileiro." },
        { icon: "🔗", title: "Do clique ao caixa, na mesma base", desc: "O custo do anúncio, o lead que ele gerou, o cliente que fechou e a mensalidade que entrou vivem na mesma base de dados. ROI deixa de ser estimativa de planilha." },
        { icon: "📱", title: "App próprio e portal do cliente", desc: "Sua equipe acompanha pelo celular com notificação push. Seu cliente entra num portal e vê os próprios leads e resultados, sem precisar pedir relatório por WhatsApp." },
        { icon: "🔓", title: "Seus dados continuam seus", desc: "Banco PostgreSQL acessível, exportação completa quando quiser, backup diário. Sem cativeiro e sem taxa para levar o que é seu embora." },
      ],
    },
    problem: {
      heading: "O que planilha, print e cinco abas abertas não resolvem",
      subheading: "Toda agência que cresce esbarra nos mesmos seis buracos. O YESHUA foi construído tapando um por um.",
      items: [
        { icon: "📉", title: "ROI que ninguém consegue fechar", desc: "Gasto no Meta numa aba, gasto no Google noutra, lead no WhatsApp, contrato no e-mail e mensalidade no extrato do banco. Quando a planilha fica pronta, o número já está velho." },
        { icon: "🔕", title: "Conta de anúncio parada e ninguém viu", desc: "Cartão recusado, saldo zerado, teto de gastos atingido, conta em revisão. Sem monitoramento ativo, você descobre quando o cliente liga perguntando por que parou." },
        { icon: "⏳", title: "Lead esfriando na fila", desc: "O lead chega e espera alguém abrir o painel. O YESHUA avisa na hora — push no celular, e-mail e WhatsApp — com a origem do lead já carimbada." },
        { icon: "🧾", title: "Cobrança manual todo santo mês", desc: "Boleto, link de pagamento, Pix, quem pagou e quem esqueceu. Sem régua automática de lembretes, sempre escapa alguém — e a conversa fica constrangedora." },
        { icon: "🗓️", title: "Postagem agendada em três ferramentas", desc: "Instagram numa, Facebook noutra, relatório numa terceira. Três assinaturas, três senhas, três lugares para errar o horário de publicação." },
        { icon: "💸", title: "Caixa do mês que vem no chute", desc: "Fatura de cartão que ainda vai fechar, recebimento preso à vigência do contrato, despesa recorrente esquecida. Sem projeção, todo mês seguinte é surpresa." },
      ],
    },
    modules: {
      heading: "Os módulos do YESHUA",
      subheading: "Um ERP completo para agências digitais — ative o que você precisa hoje e cresça para os outros quando fizer sentido.",
      groups: [
        { label: "Financeiro", icon: "💰", items: ["Contas a pagar e a receber", "Cartões com previsão de fatura dinâmica", "Conciliação pela data de pagamento", "Projeção de saldo mês a mês", "Centro de custo, categorias e tags", "Recebimentos amarrados à vigência do contrato"] },
        { label: "Fiscal", icon: "🧾", items: ["Emissão de NFS-e municipal", "Certificado digital A1 e-CNPJ", "Integração com o Serpro Integra Contador", "Apuração e guia do DAS do Simples", "Controle de parcelamentos de tributos", "Guarda das notas fiscais recebidas"] },
        { label: "Clientes e receita", icon: "🤝", items: ["Cliente como entidade-mãe da operação", "Serviços e contratos com vigência", "Cobrança recorrente integrada ao ASAAS", "Régua de lembretes automáticos", "Orçamentos com biblioteca de partes", "Proposta em PDF pronta para enviar"] },
        { label: "Tráfego pago", icon: "📈", items: ["Meta Ads e Google Ads por API oficial", "Saldo, recarga e teto de gastos monitorados", "Alerta de conta pausada ou com fatura em aberto", "Recortes por campanha, palavra-chave, termo e região", "Conversões offline e CAPI centralizadas", "Custo por lead e por cliente, no mesmo lugar"] },
        { label: "Leads e CRM", icon: "🎯", items: ["Captura por plugin no site do cliente", "Porta de entrada: site, WhatsApp e clique-no-anúncio", "Qualificação comercial por canal", "Aviso de lead novo em tempo real", "Alerta de cliente que parou de receber leads", "Exportação e relatório por período"] },
        { label: "Social e mensagens", icon: "📲", items: ["Agendamento de post, reel e story", "Instagram, Facebook, YouTube e LinkedIn", "Biblioteca de mídia com upload direto", "Publicação em lote com fila idempotente", "WhatsApp Oficial integrado ao Voyia", "Templates aprovados pela Meta"] },
      ],
    },
    roi: {
      heading: "Do clique ao caixa: a cadeia que o YESHUA fecha",
      subheading: "Quatro elos que na maioria das agências vivem em sistemas diferentes — e por isso nunca fecham a conta.",
      steps: [
        { num: "1", title: "O que você gastou", desc: "As APIs oficiais do Meta e do Google trazem o custo real por conta, por campanha e por dia. Sem print, sem exportar CSV, sem digitar em planilha." },
        { num: "2", title: "O que isso gerou", desc: "Cada lead chega carimbado com a origem: rede, campanha, anúncio e porta de entrada. Lead sem rastro vira exceção, não regra." },
        { num: "3", title: "O que virou cliente", desc: "A qualificação comercial marca o lead que realmente fechou e devolve essa conversão para a plataforma de anúncio, para o algoritmo otimizar pelo que importa." },
        { num: "4", title: "O que entrou no caixa", desc: "Serviço contratado, recebimento gerado e baixa conciliada fecham a conta: custo de aquisição contra receita recorrente, cliente por cliente." },
      ],
      note: "É essa cadeia inteira, num só banco de dados, que transforma \"acho que está dando resultado\" em um número que você mostra na reunião.",
    },
    integrations: {
      heading: "Integrações nativas",
      subheading: "O YESHUA conversa com as plataformas que a sua agência já usa — sempre pela porta da frente.",
      items: [
        { icon: "📘", title: "Meta Marketing API", desc: "Campanhas, conjuntos, anúncios, custo e resultado do Facebook e do Instagram. Leitura de métricas e envio de conversões pela API de Conversões (CAPI)." },
        { icon: "🔍", title: "Google Ads API", desc: "Custo, campanhas, palavras-chave, termos de busca, região e demografia. Saldo de conta pré-paga e detecção de recarga, com alerta antes de parar." },
        { icon: "💬", title: "WhatsApp Business API", desc: "Via Voyia: templates aprovados, disparo, agendamento e histórico de conversa com status de entrega real." },
        { icon: "💳", title: "ASAAS", desc: "Boleto, Pix e link de pagamento, assinatura recorrente, conciliação automática e data de crédito refletida no fluxo de caixa." },
        { icon: "🏛️", title: "Serpro Integra Contador", desc: "Apuração do PGDAS-D, emissão da guia do DAS e consulta de situação fiscal — direto da Receita, sem intermediário." },
        { icon: "📸", title: "Publicação em redes sociais", desc: "Instagram, Facebook, YouTube e LinkedIn: agendamento e publicação de post, reel e story pela API oficial de cada rede." },
        { icon: "🔌", title: "Plugin para WordPress", desc: "Instalou no site do cliente, começou a captar: formulário, origem do lead, conversão e tráfego chegam no painel sem desenvolvimento extra." },
        { icon: "🔔", title: "Push, e-mail e relatório", desc: "Notificação push no app da equipe, e-mail transacional com cópia interna e relatório em PDF gerado no próprio aparelho." },
        { icon: "🗄️", title: "Seu banco, seu BI", desc: "PostgreSQL com exportação completa. Conecte Looker Studio, Power BI, Metabase ou a ferramenta que a sua agência já usa." },
      ],
    },
    flow: {
      heading: "Como é colocar o YESHUA para rodar",
      subheading: "Da conexão das contas ao primeiro fechamento de mês, sem parar a operação no meio do caminho.",
      steps: [
        { num: "1", title: "Implantação", desc: "Subimos o ambiente, criamos os usuários da sua equipe e configuramos os papéis de acesso — quem vê financeiro, quem vê só os módulos de mídia, quem é cliente." },
        { num: "2", title: "Conexão das contas", desc: "Você autoriza as contas de anúncio, as redes sociais e o gateway de cobrança pelo fluxo oficial de cada plataforma. Nenhuma senha é digitada dentro do YESHUA." },
        { num: "3", title: "Importação", desc: "Clientes, contratos, serviços e histórico financeiro entram de uma vez. O histórico das contas de anúncio é reprocessado para o painel já nascer com passado." },
        { num: "4", title: "Operação diária", desc: "Lead chega e avisa. Conta de anúncio para e alerta. Cobrança vence e o lembrete sai sozinho. A equipe passa a trabalhar por exceção." },
        { num: "5", title: "Cliente no portal", desc: "Cada cliente ganha acesso ao próprio portal: leads recebidos, investimento, resultado e relatório. Reunião mensal deixa de começar pela montagem do slide." },
        { num: "6", title: "Fechamento do mês", desc: "Faturamento, recebimentos, despesas conciliadas, nota emitida e guia apurada. O mês fecha com o mesmo número em todos os lugares." },
      ],
    },
    whoFor: {
      heading: "Para quem o YESHUA foi feito",
      subheading: "Se a sua operação tem cliente recorrente, verba de mídia de terceiros e obrigação fiscal, ele foi desenhado para você.",
      items: [
        { icon: "📊", title: "Agência de tráfego pago", desc: "Gerencia verba de vários clientes no Meta e no Google e precisa provar resultado com número, não com print de tela." },
        { icon: "🎨", title: "Agência full service", desc: "Faz mídia, social, site e conteúdo para a mesma carteira — e hoje usa uma ferramenta diferente para cada frente." },
        { icon: "🧑‍💻", title: "Consultoria e profissional sênior", desc: "Opera sozinho ou com equipe enxuta, cobra recorrente e não tem tempo para virar o próprio departamento financeiro." },
        { icon: "🏢", title: "Agência com time comercial", desc: "Tem vendedor recebendo lead e precisa fechar o ciclo entre o que foi investido, o que foi qualificado e o que virou contrato." },
        { icon: "🧾", title: "Quem emite nota todo mês", desc: "Cobra assinatura ou fee mensal, emite NFS-e para cada cliente e quer parar de fazer isso manualmente no site da prefeitura." },
        { icon: "🌱", title: "Agência em crescimento", desc: "Passou do ponto em que a planilha dava conta e ainda não quer o custo — nem a complexidade — de um ERP corporativo." },
      ],
    },
    privacy: {
      heading: "Dados, acesso e privacidade",
      subheading: "O YESHUA lida com dado de anúncio, de lead e financeiro. Como isso é tratado não é letra miúda — está aqui na frente.",
      items: [
        { icon: "🔐", title: "Autorização pela porta oficial", desc: "O acesso às contas de anúncio e às redes sociais é concedido pelo fluxo OAuth da própria plataforma. O YESHUA nunca pede nem armazena a senha da sua conta Google ou Meta." },
        { icon: "🎯", title: "Uso restrito ao que o painel mostra", desc: "Os dados lidos das APIs de anúncio são usados para exibir métricas, gerar relatório e calcular ROI dentro da sua conta. Não são vendidos, cedidos nem usados para treinar modelo." },
        { icon: "👥", title: "Acesso por papel", desc: "Administrador, colaborador e cliente enxergam recortes diferentes do sistema. O cliente vê o portal dele; o colaborador, só os módulos liberados." },
        { icon: "🇧🇷", title: "LGPD aplicada", desc: "Dado pessoal de lead com base legal, finalidade declarada, prazo de guarda e exclusão sob pedido. Sem coleta invisível." },
        { icon: "🔄", title: "Revogação a qualquer momento", desc: "Você desconecta uma conta de anúncio ou uma rede social quando quiser, pelo painel ou pelas configurações de segurança da própria plataforma." },
        { icon: "💾", title: "Backup e exportação", desc: "Backup diário do banco e exportação completa dos seus dados sempre disponível, em formato aberto." },
      ],
      linkLabel: "Ler a política de privacidade",
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        { q: "O que exatamente é o YESHUA?", a: "É um ERP web para agências digitais. Reúne num só painel o financeiro, o fiscal, a gestão de clientes e contratos, o tráfego pago, os leads e o social media — com app para a equipe e portal para o cliente." },
        { q: "Preciso dar acesso às minhas contas de anúncio?", a: "Sim, e o acesso é concedido pelo fluxo de autorização oficial do Google e da Meta. Você escolhe quais contas conectar, o YESHUA nunca vê sua senha, e você pode revogar o acesso a qualquer momento." },
        { q: "O que o YESHUA lê da API do Google Ads?", a: "Custo, campanhas, grupos de anúncio, palavras-chave, termos de busca, métricas de desempenho e saldo de conta pré-paga. Esses dados aparecem nos painéis e relatórios da sua própria conta e servem para calcular custo por lead e ROI. Quando você marca um lead como qualificado, o YESHUA pode devolver essa conversão para a plataforma." },
        { q: "Meus dados ficam onde?", a: "Em banco PostgreSQL, com backup diário. Você tem exportação completa disponível a qualquer momento e pode conectar a ferramenta de BI que já usa." },
        { q: "Tem aplicativo?", a: "Tem. App para Android e iOS com notificação push de lead novo, acompanhamento das contas de anúncio e relatório em PDF gerado no próprio aparelho." },
        { q: "Dá para migrar do que eu já uso hoje?", a: "Dá. Clientes, contratos, serviços e histórico financeiro entram por importação, e o histórico das contas de anúncio é reprocessado pelas APIs — o painel já nasce com passado, não zerado." },
        { q: "Quanto custa?", a: "Não trabalhamos com tabela de preços nem planos prontos. O YESHUA é modular, e o valor depende de quantos clientes a agência atende, quantas contas de anúncio vão ser conectadas e quais módulos vocês vão usar. Preencha o pedido de análise nesta página: marcamos uma reunião para entender a sua operação e a proposta sai depois dela." },
      ],
    },
    finalCta: {
      heading: "Pare de montar relatório e volte a operar",
      lead: "Conte como a sua agência opera. Marcamos uma reunião de análise, mostramos o YESHUA rodando com dado real — não com ambiente de demonstração — e a proposta sai depois dela.",
      cta: "Solicitar análise",
      whatsapp: "Prefiro falar pelo WhatsApp",
    },
    analise: {"heading": "Solicite uma análise da sua operação", "subheading": "O YESHUA não tem preço de tabela: cada implantação é dimensionada pela carteira de clientes, pelas contas de anúncio e pelos módulos que você vai usar. Conte um pouco da sua operação e a nossa equipe comercial entra em contato.", "steps": ["Você envia o pedido com o tamanho da operação", "Nossa equipe agenda uma reunião de análise", "Mostramos o YESHUA com dado real e entendemos o seu fluxo", "Você recebe a proposta sob medida"], "form": {"name": "Nome", "email": "E-mail", "phone": "WhatsApp", "agency": "Agência ou empresa", "agencyPlaceholder": "Nome da agência", "profile": "Você é", "profiles": ["Agência de marketing digital", "Agência de publicidade", "Gestor de tráfego autônomo", "Outro"], "clients": "Clientes ativos", "accounts": "Contas de anúncio", "ranges": ["1 a 5", "6 a 15", "16 a 40", "41 a 100", "Mais de 100"], "modules": "Módulos de interesse", "notes": "Algo que devemos saber antes da reunião?", "notesPlaceholder": "Ferramentas que usa hoje, principal dor, prazo...", "privacy": "Concordo em ser contatado pela equipe da Agathas Web e li a", "privacyLink": "política de privacidade", "submit": "Solicitar análise", "sending": "Enviando…", "required": "Campo obrigatório.", "successTitle": "Pedido recebido!", "successText": "Nossa equipe comercial vai entrar em contato pelo WhatsApp ou e-mail para agendar a reunião de análise da sua operação.", "error": "Não foi possível enviar agora. Tente de novo ou fale com a gente pelo WhatsApp."}},
  },
  es: {
    hero: {
      badge: "⚡ YESHUA · el ERP con el que Agathas opera su propia agencia",
      subline: "Tráfico pago, leads, redes sociales, finanzas y fiscal en un solo panel — conectados por APIs oficiales, desde el primer clic del anuncio hasta el dinero entrando en la cuenta.",
      ctaPrimary: "Solicitar análisis",
      ctaSecondary: "Ver los módulos",
    },
    trust: [
      { value: "6", label: "Módulos en un solo panel" },
      { value: "100%", label: "APIs oficiales, sin scraping" },
      { value: "24/7", label: "Alertas de cuenta, saldo y lead" },
      { value: "1", label: "Fuente de verdad de la agencia" },
    ],
    authority: {
      heading: "Por qué un ERP hecho por una agencia, para agencias",
      subheading: "YESHUA no se diseñó en una reunión de producto. Nació de la operación diaria de Agathas Web — y cada módulo existe porque el dolor apareció aquí primero.",
      items: [
        { icon: "🧪", title: "Nació en producción, no en una presentación", desc: "Agathas opera su propio negocio dentro de YESHUA: cuentas publicitarias de clientes, cobro recurrente, facturas y atención. Lo que ves en pantalla es lo que aquí funciona todos los días." },
        { icon: "🔌", title: "APIs oficiales, sin parches", desc: "Meta Marketing API, Google Ads API, WhatsApp Business API, ASAAS y Serpro Integra Contador. Nada de scraping, extensiones de navegador ni robots haciendo clic — que se rompen al primer cambio de pantalla." },
        { icon: "🌎", title: "Fiscal de verdad", desc: "Factura de servicio, cálculo del régimen simplificado, certificado digital, boleto y Pix conciliados. Un ERP importado no entiende la burocracia tributaria local." },
        { icon: "🔗", title: "Del clic a la caja, en la misma base", desc: "El costo del anuncio, el lead que generó, el cliente que cerró y la mensualidad que entró viven en la misma base de datos. El ROI deja de ser una estimación de hoja de cálculo." },
        { icon: "📱", title: "App propia y portal del cliente", desc: "Tu equipo sigue todo desde el móvil con notificaciones push. Tu cliente entra en un portal y ve sus propios leads y resultados, sin pedir informes por WhatsApp." },
        { icon: "🔓", title: "Tus datos siguen siendo tuyos", desc: "Base PostgreSQL accesible, exportación completa cuando quieras, copia de seguridad diaria. Sin cautiverio y sin peaje para llevarte lo que es tuyo." },
      ],
    },
    problem: {
      heading: "Lo que una hoja de cálculo y cinco pestañas abiertas no resuelven",
      subheading: "Toda agencia que crece choca con los mismos seis agujeros. YESHUA se construyó tapando uno por uno.",
      items: [
        { icon: "📉", title: "Un ROI que nadie logra cerrar", desc: "Gasto en Meta en una pestaña, gasto en Google en otra, el lead en WhatsApp, el contrato en el correo y la mensualidad en el extracto bancario. Cuando la hoja está lista, el número ya está viejo." },
        { icon: "🔕", title: "Cuenta publicitaria parada y nadie lo vio", desc: "Tarjeta rechazada, saldo en cero, límite de gasto alcanzado, cuenta en revisión. Sin monitoreo activo, te enteras cuando el cliente llama preguntando por qué se detuvo." },
        { icon: "⏳", title: "Leads enfriándose en la fila", desc: "El lead llega y espera a que alguien abra el panel. YESHUA avisa al instante — push, correo y WhatsApp — con el origen del lead ya identificado." },
        { icon: "🧾", title: "Cobro manual todos los meses", desc: "Boleto, enlace de pago, Pix, quién pagó y quién olvidó. Sin una secuencia automática de recordatorios siempre se escapa alguien — y la conversación se vuelve incómoda." },
        { icon: "🗓️", title: "Publicaciones programadas en tres herramientas", desc: "Instagram en una, Facebook en otra, el informe en una tercera. Tres suscripciones, tres contraseñas y tres lugares donde equivocarse de horario." },
        { icon: "💸", title: "La caja del mes siguiente a ojo", desc: "Factura de tarjeta aún por cerrar, cobro atado a la vigencia del contrato, gasto recurrente olvidado. Sin proyección, cada mes siguiente es una sorpresa." },
      ],
    },
    modules: {
      heading: "Los módulos de YESHUA",
      subheading: "Un ERP completo para agencias digitales — activa lo que necesitas hoy y crece hacia el resto cuando tenga sentido.",
      groups: [
        { label: "Finanzas", icon: "💰", items: ["Cuentas por pagar y por cobrar", "Tarjetas con previsión dinámica de factura", "Conciliación por fecha de pago", "Proyección de saldo mes a mes", "Centro de costo, categorías y etiquetas", "Cobros atados a la vigencia del contrato"] },
        { label: "Fiscal", icon: "🧾", items: ["Emisión de factura de servicio", "Certificado digital de la empresa", "Integración con el organismo tributario", "Cálculo y guía del régimen simplificado", "Control de planes de pago de impuestos", "Archivo de las facturas recibidas"] },
        { label: "Clientes e ingresos", icon: "🤝", items: ["El cliente como entidad central", "Servicios y contratos con vigencia", "Cobro recurrente integrado con ASAAS", "Secuencia de recordatorios automáticos", "Presupuestos con biblioteca de partidas", "Propuesta en PDF lista para enviar"] },
        { label: "Tráfico pago", icon: "📈", items: ["Meta Ads y Google Ads por API oficial", "Saldo, recarga y límite de gasto monitoreados", "Alerta de cuenta pausada o con factura pendiente", "Desgloses por campaña, palabra clave, término y región", "Conversiones offline y CAPI centralizadas", "Costo por lead y por cliente, en el mismo lugar"] },
        { label: "Leads y CRM", icon: "🎯", items: ["Captación con plugin en el sitio del cliente", "Puerta de entrada: sitio, WhatsApp y clic en el anuncio", "Calificación comercial por canal", "Aviso de lead nuevo en tiempo real", "Alerta de cliente que dejó de recibir leads", "Exportación e informe por período"] },
        { label: "Social y mensajes", icon: "📲", items: ["Programación de post, reel y story", "Instagram, Facebook, YouTube y LinkedIn", "Biblioteca de medios con carga directa", "Publicación por lotes con cola idempotente", "WhatsApp Oficial integrado con Voyia", "Plantillas aprobadas por Meta"] },
      ],
    },
    roi: {
      heading: "Del clic a la caja: la cadena que YESHUA cierra",
      subheading: "Cuatro eslabones que en la mayoría de las agencias viven en sistemas distintos — y por eso nunca cuadran.",
      steps: [
        { num: "1", title: "Lo que gastaste", desc: "Las APIs oficiales de Meta y Google traen el costo real por cuenta, por campaña y por día. Sin capturas, sin exportar CSV, sin teclear en una hoja." },
        { num: "2", title: "Lo que eso generó", desc: "Cada lead llega marcado con su origen: red, campaña, anuncio y puerta de entrada. El lead sin rastro pasa a ser la excepción, no la regla." },
        { num: "3", title: "Lo que se volvió cliente", desc: "La calificación comercial marca el lead que realmente cerró y devuelve esa conversión a la plataforma publicitaria, para que el algoritmo optimice por lo que importa." },
        { num: "4", title: "Lo que entró en caja", desc: "Servicio contratado, cobro generado y conciliación cierran la cuenta: costo de adquisición contra ingreso recurrente, cliente por cliente." },
      ],
      note: "Es esa cadena completa, en una sola base de datos, la que convierte el \"creo que está funcionando\" en un número que puedes mostrar en la reunión.",
    },
    integrations: {
      heading: "Integraciones nativas",
      subheading: "YESHUA habla con las plataformas que tu agencia ya usa — siempre por la puerta principal.",
      items: [
        { icon: "📘", title: "Meta Marketing API", desc: "Campañas, conjuntos, anuncios, costo y resultado de Facebook e Instagram. Lectura de métricas y envío de conversiones por la API de Conversiones (CAPI)." },
        { icon: "🔍", title: "Google Ads API", desc: "Costo, campañas, palabras clave, términos de búsqueda, región y demografía. Saldo de cuenta prepago y detección de recarga, con alerta antes de que se detenga." },
        { icon: "💬", title: "WhatsApp Business API", desc: "Vía Voyia: plantillas aprobadas, envío, programación e historial de conversación con estado de entrega real." },
        { icon: "💳", title: "ASAAS", desc: "Boleto, Pix y enlace de pago, suscripción recurrente, conciliación automática y fecha de acreditación reflejada en el flujo de caja." },
        { icon: "🏛️", title: "Organismo tributario", desc: "Cálculo, emisión de la guía de impuestos y consulta de situación fiscal — directo de la fuente, sin intermediarios." },
        { icon: "📸", title: "Publicación en redes sociales", desc: "Instagram, Facebook, YouTube y LinkedIn: programación y publicación de post, reel y story por la API oficial de cada red." },
        { icon: "🔌", title: "Plugin para WordPress", desc: "Lo instalas en el sitio del cliente y empieza a captar: formulario, origen del lead, conversión y tráfico llegan al panel sin desarrollo extra." },
        { icon: "🔔", title: "Push, correo e informes", desc: "Notificación push en la app del equipo, correo transaccional con copia interna e informe en PDF generado en el propio dispositivo." },
        { icon: "🗄️", title: "Tu base, tu BI", desc: "PostgreSQL con exportación completa. Conecta Looker Studio, Power BI, Metabase o la herramienta que tu agencia ya usa." },
      ],
    },
    flow: {
      heading: "Cómo es poner YESHUA en marcha",
      subheading: "De la conexión de las cuentas al primer cierre de mes, sin detener la operación por el camino.",
      steps: [
        { num: "1", title: "Implantación", desc: "Levantamos el entorno, creamos los usuarios de tu equipo y configuramos los roles de acceso — quién ve finanzas, quién solo los módulos de medios, quién es cliente." },
        { num: "2", title: "Conexión de las cuentas", desc: "Autorizas las cuentas publicitarias, las redes sociales y la pasarela de cobro por el flujo oficial de cada plataforma. Ninguna contraseña se escribe dentro de YESHUA." },
        { num: "3", title: "Importación", desc: "Clientes, contratos, servicios e historial financiero entran de una vez. El historial de las cuentas publicitarias se reprocesa para que el panel nazca con pasado." },
        { num: "4", title: "Operación diaria", desc: "Llega un lead y avisa. Se detiene una cuenta y alerta. Vence un cobro y el recordatorio sale solo. El equipo pasa a trabajar por excepción." },
        { num: "5", title: "Cliente en el portal", desc: "Cada cliente recibe acceso a su propio portal: leads recibidos, inversión, resultado e informe. La reunión mensual deja de empezar armando la presentación." },
        { num: "6", title: "Cierre del mes", desc: "Facturación, cobros, gastos conciliados, factura emitida y guía calculada. El mes cierra con el mismo número en todos lados." },
      ],
    },
    whoFor: {
      heading: "Para quién es YESHUA",
      subheading: "Si tu operación tiene clientes recurrentes, presupuesto de medios de terceros y obligaciones fiscales, fue diseñado para ti.",
      items: [
        { icon: "📊", title: "Agencia de tráfico pago", desc: "Gestiona presupuesto de varios clientes en Meta y Google y necesita probar resultados con números, no con capturas de pantalla." },
        { icon: "🎨", title: "Agencia full service", desc: "Hace medios, social, sitios y contenido para la misma cartera — y hoy usa una herramienta distinta para cada frente." },
        { icon: "🧑‍💻", title: "Consultoría y profesional sénior", desc: "Opera solo o con un equipo reducido, cobra recurrente y no tiene tiempo de convertirse en su propio departamento financiero." },
        { icon: "🏢", title: "Agencia con equipo comercial", desc: "Tiene vendedores recibiendo leads y necesita cerrar el ciclo entre lo invertido, lo calificado y lo que se volvió contrato." },
        { icon: "🧾", title: "Quien factura todos los meses", desc: "Cobra suscripción o fee mensual, emite factura para cada cliente y quiere dejar de hacerlo a mano en el portal del organismo." },
        { icon: "🌱", title: "Agencia en crecimiento", desc: "Ya superó el punto en que la hoja de cálculo alcanzaba y todavía no quiere el costo — ni la complejidad — de un ERP corporativo." },
      ],
    },
    privacy: {
      heading: "Datos, acceso y privacidad",
      subheading: "YESHUA maneja datos publicitarios, de leads y financieros. Cómo se tratan no es letra pequeña — está aquí al frente.",
      items: [
        { icon: "🔐", title: "Autorización por la puerta oficial", desc: "El acceso a las cuentas publicitarias y a las redes sociales se concede por el flujo OAuth de cada plataforma. YESHUA nunca pide ni almacena la contraseña de tu cuenta de Google o Meta." },
        { icon: "🎯", title: "Uso limitado a lo que el panel muestra", desc: "Los datos leídos de las APIs publicitarias se usan para mostrar métricas, generar informes y calcular ROI dentro de tu cuenta. No se venden, no se ceden ni se usan para entrenar modelos." },
        { icon: "👥", title: "Acceso por rol", desc: "Administrador, colaborador y cliente ven recortes distintos del sistema. El cliente ve su portal; el colaborador, solo los módulos habilitados." },
        { icon: "🌎", title: "Protección de datos aplicada", desc: "Dato personal de lead con base legal, finalidad declarada, plazo de conservación y eliminación bajo pedido. Sin recolección invisible." },
        { icon: "🔄", title: "Revocación en cualquier momento", desc: "Desconectas una cuenta publicitaria o una red social cuando quieras, desde el panel o desde la configuración de seguridad de la propia plataforma." },
        { icon: "💾", title: "Copia de seguridad y exportación", desc: "Copia diaria de la base y exportación completa de tus datos siempre disponible, en formato abierto." },
      ],
      linkLabel: "Leer la política de privacidad",
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        { q: "¿Qué es exactamente YESHUA?", a: "Es un ERP web para agencias digitales. Reúne en un solo panel las finanzas, lo fiscal, la gestión de clientes y contratos, el tráfico pago, los leads y las redes sociales — con app para el equipo y portal para el cliente." },
        { q: "¿Necesito dar acceso a mis cuentas publicitarias?", a: "Sí, y el acceso se concede por el flujo de autorización oficial de Google y Meta. Tú eliges qué cuentas conectar, YESHUA nunca ve tu contraseña y puedes revocar el acceso en cualquier momento." },
        { q: "¿Qué lee YESHUA de la API de Google Ads?", a: "Costo, campañas, grupos de anuncios, palabras clave, términos de búsqueda, métricas de rendimiento y saldo de cuenta prepago. Esos datos aparecen en los paneles e informes de tu propia cuenta y sirven para calcular costo por lead y ROI. Cuando marcas un lead como calificado, YESHUA puede devolver esa conversión a la plataforma." },
        { q: "¿Dónde quedan mis datos?", a: "En una base PostgreSQL, con copia de seguridad diaria. Tienes exportación completa disponible en cualquier momento y puedes conectar la herramienta de BI que ya usas." },
        { q: "¿Tiene aplicación?", a: "Sí. App para Android e iOS con notificación push de lead nuevo, seguimiento de las cuentas publicitarias e informe en PDF generado en el propio dispositivo." },
        { q: "¿Se puede migrar desde lo que uso hoy?", a: "Sí. Clientes, contratos, servicios e historial financiero entran por importación, y el historial de las cuentas publicitarias se reprocesa por las APIs — el panel nace con pasado, no en cero." },
        { q: "¿Cuánto cuesta?", a: "No trabajamos con tabla de precios ni planes cerrados. YESHUA es modular y el valor depende de cuántos clientes atiende la agencia, cuántas cuentas publicitarias se conectarán y qué módulos van a usar. Completa la solicitud de análisis en esta página: agendamos una reunión para entender tu operación y la propuesta sale después de ella." },
      ],
    },
    finalCta: {
      heading: "Deja de armar informes y vuelve a operar",
      lead: "Cuéntanos cómo opera tu agencia. Agendamos una reunión de análisis, te mostramos YESHUA funcionando con datos reales — no con un entorno de demostración — y la propuesta sale después de ella.",
      cta: "Solicitar análisis",
      whatsapp: "Prefiero hablar por WhatsApp",
    },
    analise: {"heading": "Solicita un análisis de tu operación", "subheading": "YESHUA no tiene precio de lista: cada implantación se dimensiona según la cartera de clientes, las cuentas publicitarias y los módulos que vas a usar. Cuéntanos un poco de tu operación y nuestro equipo comercial se pondrá en contacto.", "steps": ["Envías la solicitud con el tamaño de la operación", "Nuestro equipo agenda una reunión de análisis", "Te mostramos YESHUA con datos reales y entendemos tu flujo", "Recibes la propuesta a medida"], "form": {"name": "Nombre", "email": "Correo", "phone": "WhatsApp", "agency": "Agencia o empresa", "agencyPlaceholder": "Nombre de la agencia", "profile": "Eres", "profiles": ["Agencia de marketing digital", "Agencia de publicidad", "Gestor de tráfico independiente", "Otro"], "clients": "Clientes activos", "accounts": "Cuentas publicitarias", "ranges": ["1 a 5", "6 a 15", "16 a 40", "41 a 100", "Más de 100"], "modules": "Módulos de interés", "notes": "¿Algo que debamos saber antes de la reunión?", "notesPlaceholder": "Herramientas que usas hoy, principal dolor, plazo...", "privacy": "Acepto ser contactado por el equipo de Agathas Web y leí la", "privacyLink": "política de privacidad", "submit": "Solicitar análisis", "sending": "Enviando…", "required": "Campo obligatorio.", "successTitle": "¡Solicitud recibida!", "successText": "Nuestro equipo comercial se pondrá en contacto por WhatsApp o correo para agendar la reunión de análisis de tu operación.", "error": "No se pudo enviar ahora. Inténtalo de nuevo o escríbenos por WhatsApp."}},
  },
  "en-US": {
    hero: {
      badge: "⚡ YESHUA · the ERP Agathas uses to run its own agency",
      subline: "Paid media, leads, social, finance and tax in a single panel — wired together through official APIs, from the first ad click to the money landing in the bank.",
      ctaPrimary: "Request an assessment",
      ctaSecondary: "See the modules",
    },
    trust: [
      { value: "6", label: "Modules in one panel" },
      { value: "100%", label: "Official APIs, no scraping" },
      { value: "24/7", label: "Account, balance and lead alerts" },
      { value: "1", label: "Single source of truth" },
    ],
    authority: {
      heading: "Why an ERP built by an agency, for agencies",
      subheading: "YESHUA wasn't designed in a product meeting. It grew out of Agathas Web's daily operation — every module exists because the pain showed up here first.",
      items: [
        { icon: "🧪", title: "Born in production, not in a slide deck", desc: "Agathas runs its own business inside YESHUA: client ad accounts, recurring billing, invoices and support. What you see on screen is what runs here every day." },
        { icon: "🔌", title: "Official APIs, no workarounds", desc: "Meta Marketing API, Google Ads API, WhatsApp Business API, ASAAS and the Brazilian tax authority gateway. No scraping, no browser extension, no bot clicking through screens — the kind that breaks on the first layout change." },
        { icon: "🇧🇷", title: "Real Brazilian tax handling", desc: "Municipal service invoices, simplified-regime filings, A1 digital certificate, bank slips and instant payments reconciled. An imported ERP doesn't understand Brazilian service invoicing or tax regimes." },
        { icon: "🔗", title: "From click to cash, in one database", desc: "Ad cost, the lead it generated, the client who signed and the monthly fee that came in all live in the same database. ROI stops being a spreadsheet estimate." },
        { icon: "📱", title: "Own mobile app and client portal", desc: "Your team follows everything from the phone with push notifications. Your client logs into a portal and sees their own leads and results, instead of asking for a report over WhatsApp." },
        { icon: "🔓", title: "Your data stays yours", desc: "Accessible PostgreSQL database, full export whenever you want, daily backups. No lock-in and no exit fee to take what's yours." },
      ],
    },
    problem: {
      heading: "What spreadsheets, screenshots and five open tabs can't solve",
      subheading: "Every growing agency hits the same six gaps. YESHUA was built closing them one by one.",
      items: [
        { icon: "📉", title: "ROI nobody can actually close", desc: "Meta spend in one tab, Google spend in another, the lead in WhatsApp, the contract in email and the fee in the bank statement. By the time the spreadsheet is ready, the number is already stale." },
        { icon: "🔕", title: "An ad account stopped and nobody noticed", desc: "Declined card, zero balance, spending cap reached, account under review. Without active monitoring you find out when the client calls asking why it stopped." },
        { icon: "⏳", title: "Leads going cold in the queue", desc: "The lead arrives and waits for someone to open the dashboard. YESHUA alerts instantly — push, email and WhatsApp — with the lead's source already attached." },
        { icon: "🧾", title: "Manual billing every single month", desc: "Bank slip, payment link, instant transfer, who paid and who forgot. Without an automated reminder cadence someone always slips through — and the conversation gets awkward." },
        { icon: "🗓️", title: "Posts scheduled across three tools", desc: "Instagram in one, Facebook in another, the report in a third. Three subscriptions, three passwords and three places to get the publishing time wrong." },
        { icon: "💸", title: "Next month's cash flow as guesswork", desc: "A card statement that hasn't closed yet, revenue tied to contract terms, a forgotten recurring expense. Without a forecast, every coming month is a surprise." },
      ],
    },
    modules: {
      heading: "The YESHUA modules",
      subheading: "A complete ERP for digital agencies — turn on what you need today and grow into the rest when it makes sense.",
      groups: [
        { label: "Finance", icon: "💰", items: ["Accounts payable and receivable", "Credit cards with dynamic statement forecasting", "Reconciliation by payment date", "Month-by-month balance projection", "Cost centers, categories and tags", "Revenue tied to contract terms"] },
        { label: "Tax", icon: "🧾", items: ["Municipal service invoice issuing", "A1 digital company certificate", "Direct tax authority integration", "Simplified-regime filing and payment slip", "Tax installment plan tracking", "Archive of received invoices"] },
        { label: "Clients and revenue", icon: "🤝", items: ["The client as the core entity", "Services and contracts with terms", "Recurring billing through ASAAS", "Automated reminder cadence", "Quotes with a reusable line-item library", "Ready-to-send PDF proposals"] },
        { label: "Paid media", icon: "📈", items: ["Meta Ads and Google Ads via official API", "Balance, top-ups and spending caps monitored", "Alerts for paused accounts or unpaid invoices", "Breakdowns by campaign, keyword, search term and region", "Offline conversions and CAPI in one place", "Cost per lead and per client, side by side"] },
        { label: "Leads and CRM", icon: "🎯", items: ["Capture through a plugin on the client's site", "Entry point: website, WhatsApp and click-to-message", "Sales qualification by channel", "Real-time new-lead notification", "Alert when a client stops receiving leads", "Export and reporting by period"] },
        { label: "Social and messaging", icon: "📲", items: ["Scheduling for posts, reels and stories", "Instagram, Facebook, YouTube and LinkedIn", "Media library with direct upload", "Batch publishing with an idempotent queue", "Official WhatsApp through Voyia", "Meta-approved message templates"] },
      ],
    },
    roi: {
      heading: "Click to cash: the chain YESHUA closes",
      subheading: "Four links that in most agencies live in separate systems — which is exactly why the math never adds up.",
      steps: [
        { num: "1", title: "What you spent", desc: "The official Meta and Google APIs bring real cost per account, per campaign and per day. No screenshots, no CSV exports, no retyping into a spreadsheet." },
        { num: "2", title: "What it generated", desc: "Every lead arrives stamped with its source: network, campaign, ad and entry point. An untraceable lead becomes the exception, not the rule." },
        { num: "3", title: "What became a client", desc: "Sales qualification marks the lead that actually closed and sends that conversion back to the ad platform, so the algorithm optimizes for what matters." },
        { num: "4", title: "What hit the bank", desc: "Contracted service, generated invoice and reconciled payment close the loop: acquisition cost against recurring revenue, client by client." },
      ],
      note: "It's that full chain, in one database, that turns \"I think it's working\" into a number you can put on the table in a meeting.",
    },
    integrations: {
      heading: "Native integrations",
      subheading: "YESHUA talks to the platforms your agency already uses — always through the front door.",
      items: [
        { icon: "📘", title: "Meta Marketing API", desc: "Campaigns, ad sets, ads, cost and results from Facebook and Instagram. Metric reads plus conversion sending through the Conversions API (CAPI)." },
        { icon: "🔍", title: "Google Ads API", desc: "Cost, campaigns, keywords, search terms, region and demographics. Prepaid account balance and top-up detection, with an alert before it runs out." },
        { icon: "💬", title: "WhatsApp Business API", desc: "Through Voyia: approved templates, sending, scheduling and conversation history with real delivery status." },
        { icon: "💳", title: "ASAAS", desc: "Bank slips, instant payments and payment links, recurring subscriptions, automatic reconciliation and credit dates reflected in the cash flow." },
        { icon: "🏛️", title: "Tax authority gateway", desc: "Filing calculation, tax payment slip issuing and compliance status checks — straight from the source, with no middleman." },
        { icon: "📸", title: "Social publishing", desc: "Instagram, Facebook, YouTube and LinkedIn: scheduling and publishing of posts, reels and stories through each network's official API." },
        { icon: "🔌", title: "WordPress plugin", desc: "Install it on the client's site and capture starts: form submissions, lead source, conversions and traffic reach the panel with no extra development." },
        { icon: "🔔", title: "Push, email and reports", desc: "Push notifications in the team app, transactional email with an internal copy, and PDF reports generated on the device itself." },
        { icon: "🗄️", title: "Your database, your BI", desc: "PostgreSQL with full export. Connect Looker Studio, Power BI, Metabase or whichever tool your agency already runs." },
      ],
    },
    flow: {
      heading: "What it takes to get YESHUA running",
      subheading: "From connecting accounts to the first month-end close, without stopping the operation halfway through.",
      steps: [
        { num: "1", title: "Setup", desc: "We stand up the environment, create your team's users and configure access roles — who sees finance, who sees only the media modules, who is a client." },
        { num: "2", title: "Connecting accounts", desc: "You authorize ad accounts, social networks and the billing gateway through each platform's official flow. No password is ever typed inside YESHUA." },
        { num: "3", title: "Import", desc: "Clients, contracts, services and financial history come in at once. Ad account history is reprocessed so the dashboard starts with a past, not from zero." },
        { num: "4", title: "Daily operation", desc: "A lead arrives and it notifies. An account stops and it alerts. A payment comes due and the reminder goes out on its own. The team starts working by exception." },
        { num: "5", title: "Clients in the portal", desc: "Each client gets access to their own portal: leads received, investment, results and reports. The monthly meeting no longer starts with building a slide deck." },
        { num: "6", title: "Month-end close", desc: "Billing, receipts, reconciled expenses, invoices issued and tax filings calculated. The month closes with the same number everywhere." },
      ],
    },
    whoFor: {
      heading: "Who YESHUA is for",
      subheading: "If your operation has recurring clients, other people's media budget and tax obligations, it was designed for you.",
      items: [
        { icon: "📊", title: "Paid media agency", desc: "Manages budget for several clients across Meta and Google and needs to prove results with numbers, not screenshots." },
        { icon: "🎨", title: "Full service agency", desc: "Runs media, social, websites and content for the same client base — and today uses a different tool for each front." },
        { icon: "🧑‍💻", title: "Consultancy and senior freelancer", desc: "Works alone or with a lean team, bills recurring fees and has no time to become their own finance department." },
        { icon: "🏢", title: "Agency with a sales team", desc: "Has reps receiving leads and needs to close the loop between what was invested, what was qualified and what turned into a contract." },
        { icon: "🧾", title: "Anyone invoicing every month", desc: "Charges a subscription or monthly fee, issues an invoice for each client and wants to stop doing it by hand on a government portal." },
        { icon: "🌱", title: "Growing agency", desc: "Has outgrown the spreadsheet but doesn't want the cost — or the complexity — of a corporate ERP." },
      ],
    },
    privacy: {
      heading: "Data, access and privacy",
      subheading: "YESHUA handles advertising, lead and financial data. How that's treated isn't fine print — it's right here.",
      items: [
        { icon: "🔐", title: "Authorization through the official door", desc: "Access to ad accounts and social networks is granted through each platform's own OAuth flow. YESHUA never asks for or stores your Google or Meta account password." },
        { icon: "🎯", title: "Use limited to what the panel shows", desc: "Data read from the advertising APIs is used to display metrics, generate reports and calculate ROI inside your own account. It is not sold, shared or used to train models." },
        { icon: "👥", title: "Role-based access", desc: "Administrators, staff and clients see different slices of the system. The client sees their portal; staff see only the modules they've been granted." },
        { icon: "🇧🇷", title: "Data protection applied", desc: "Personal lead data with a legal basis, a declared purpose, a retention period and deletion on request. No invisible collection." },
        { icon: "🔄", title: "Revoke at any time", desc: "Disconnect an ad account or a social network whenever you want, from the panel or from the platform's own security settings." },
        { icon: "💾", title: "Backup and export", desc: "Daily database backups and a full export of your data always available, in an open format." },
      ],
      linkLabel: "Read the privacy policy",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "What exactly is YESHUA?", a: "It's a web ERP for digital agencies. It brings finance, tax, client and contract management, paid media, leads and social media into a single panel — with a mobile app for the team and a portal for the client." },
        { q: "Do I need to grant access to my ad accounts?", a: "Yes, and access is granted through Google's and Meta's official authorization flow. You choose which accounts to connect, YESHUA never sees your password, and you can revoke access at any time." },
        { q: "What does YESHUA read from the Google Ads API?", a: "Cost, campaigns, ad groups, keywords, search terms, performance metrics and prepaid account balance. That data appears in the dashboards and reports of your own account and is used to calculate cost per lead and ROI. When you mark a lead as qualified, YESHUA can send that conversion back to the platform." },
        { q: "Where does my data live?", a: "In a PostgreSQL database with daily backups. A full export is available at any time and you can connect the BI tool you already use." },
        { q: "Is there a mobile app?", a: "Yes. An Android and iOS app with push notifications for new leads, ad account tracking and PDF reports generated on the device itself." },
        { q: "Can I migrate from what I use today?", a: "You can. Clients, contracts, services and financial history come in through import, and ad account history is reprocessed through the APIs — the dashboard starts with a past, not empty." },
        { q: "How much does it cost?", a: "We don't have a price list or fixed plans. YESHUA is modular, and the price depends on how many clients the agency serves, how many ad accounts will be connected and which modules you'll use. Fill in the assessment request on this page: we book a meeting to understand your operation and the proposal comes after it." },
      ],
    },
    finalCta: {
      heading: "Stop assembling reports and get back to operating",
      lead: "Tell us how your agency operates. We book an assessment meeting, show YESHUA running on real data — not on a demo environment — and the proposal comes after it.",
      cta: "Request an assessment",
      whatsapp: "I'd rather talk on WhatsApp",
    },
    analise: {"heading": "Request an assessment of your operation", "subheading": "YESHUA has no list price: each deployment is sized by your client base, your ad accounts and the modules you'll use. Tell us a little about your operation and our sales team will get in touch.", "steps": ["You send the request with the size of your operation", "Our team books an assessment meeting", "We show YESHUA on real data and map your workflow", "You receive a tailored proposal"], "form": {"name": "Name", "email": "Email", "phone": "WhatsApp", "agency": "Agency or company", "agencyPlaceholder": "Agency name", "profile": "You are", "profiles": ["Digital marketing agency", "Advertising agency", "Freelance media buyer", "Other"], "clients": "Active clients", "accounts": "Ad accounts", "ranges": ["1 to 5", "6 to 15", "16 to 40", "41 to 100", "More than 100"], "modules": "Modules of interest", "notes": "Anything we should know before the meeting?", "notesPlaceholder": "Tools you use today, main pain point, timeline...", "privacy": "I agree to be contacted by the Agathas Web team and have read the", "privacyLink": "privacy policy", "submit": "Request an assessment", "sending": "Sending…", "required": "Required field.", "successTitle": "Request received!", "successText": "Our sales team will reach out on WhatsApp or email to book the assessment meeting for your operation.", "error": "We couldn't send it right now. Try again or message us on WhatsApp."}},
  },
  "en-GB": {
    hero: {
      badge: "⚡ YESHUA · the ERP Agathas uses to run its own agency",
      subline: "Paid media, leads, social, finance and tax in a single panel — wired together through official APIs, from the first ad click to the money landing in the bank.",
      ctaPrimary: "Request an assessment",
      ctaSecondary: "See the modules",
    },
    trust: [
      { value: "6", label: "Modules in one panel" },
      { value: "100%", label: "Official APIs, no scraping" },
      { value: "24/7", label: "Account, balance and lead alerts" },
      { value: "1", label: "Single source of truth" },
    ],
    authority: {
      heading: "Why an ERP built by an agency, for agencies",
      subheading: "YESHUA wasn't designed in a product meeting. It grew out of Agathas Web's daily operation — every module exists because the pain showed up here first.",
      items: [
        { icon: "🧪", title: "Born in production, not in a slide deck", desc: "Agathas runs its own business inside YESHUA: client ad accounts, recurring billing, invoices and support. What you see on screen is what runs here every day." },
        { icon: "🔌", title: "Official APIs, no workarounds", desc: "Meta Marketing API, Google Ads API, WhatsApp Business API, ASAAS and the Brazilian tax authority gateway. No scraping, no browser extension, no bot clicking through screens — the kind that breaks on the first layout change." },
        { icon: "🇧🇷", title: "Real Brazilian tax handling", desc: "Municipal service invoices, simplified-regime filings, A1 digital certificate, bank slips and instant payments reconciled. An imported ERP doesn't understand Brazilian service invoicing or tax regimes." },
        { icon: "🔗", title: "From click to cash, in one database", desc: "Ad cost, the lead it generated, the client who signed and the monthly fee that came in all live in the same database. ROI stops being a spreadsheet estimate." },
        { icon: "📱", title: "Own mobile app and client portal", desc: "Your team follows everything from the phone with push notifications. Your client logs into a portal and sees their own leads and results, instead of asking for a report over WhatsApp." },
        { icon: "🔓", title: "Your data stays yours", desc: "Accessible PostgreSQL database, full export whenever you want, daily backups. No lock-in and no exit fee to take what's yours." },
      ],
    },
    problem: {
      heading: "What spreadsheets, screenshots and five open tabs can't solve",
      subheading: "Every growing agency hits the same six gaps. YESHUA was built closing them one by one.",
      items: [
        { icon: "📉", title: "ROI nobody can actually close", desc: "Meta spend in one tab, Google spend in another, the lead in WhatsApp, the contract in email and the fee in the bank statement. By the time the spreadsheet is ready, the number is already stale." },
        { icon: "🔕", title: "An ad account stopped and nobody noticed", desc: "Declined card, zero balance, spending cap reached, account under review. Without active monitoring you find out when the client calls asking why it stopped." },
        { icon: "⏳", title: "Leads going cold in the queue", desc: "The lead arrives and waits for someone to open the dashboard. YESHUA alerts instantly — push, email and WhatsApp — with the lead's source already attached." },
        { icon: "🧾", title: "Manual billing every single month", desc: "Bank slip, payment link, instant transfer, who paid and who forgot. Without an automated reminder cadence someone always slips through — and the conversation gets awkward." },
        { icon: "🗓️", title: "Posts scheduled across three tools", desc: "Instagram in one, Facebook in another, the report in a third. Three subscriptions, three passwords and three places to get the publishing time wrong." },
        { icon: "💸", title: "Next month's cash flow as guesswork", desc: "A card statement that hasn't closed yet, revenue tied to contract terms, a forgotten recurring expense. Without a forecast, every coming month is a surprise." },
      ],
    },
    modules: {
      heading: "The YESHUA modules",
      subheading: "A complete ERP for digital agencies — turn on what you need today and grow into the rest when it makes sense.",
      groups: [
        { label: "Finance", icon: "💰", items: ["Accounts payable and receivable", "Credit cards with dynamic statement forecasting", "Reconciliation by payment date", "Month-by-month balance projection", "Cost centres, categories and tags", "Revenue tied to contract terms"] },
        { label: "Tax", icon: "🧾", items: ["Municipal service invoice issuing", "A1 digital company certificate", "Direct tax authority integration", "Simplified-regime filing and payment slip", "Tax instalment plan tracking", "Archive of received invoices"] },
        { label: "Clients and revenue", icon: "🤝", items: ["The client as the core entity", "Services and contracts with terms", "Recurring billing through ASAAS", "Automated reminder cadence", "Quotes with a reusable line-item library", "Ready-to-send PDF proposals"] },
        { label: "Paid media", icon: "📈", items: ["Meta Ads and Google Ads via official API", "Balance, top-ups and spending caps monitored", "Alerts for paused accounts or unpaid invoices", "Breakdowns by campaign, keyword, search term and region", "Offline conversions and CAPI in one place", "Cost per lead and per client, side by side"] },
        { label: "Leads and CRM", icon: "🎯", items: ["Capture through a plugin on the client's site", "Entry point: website, WhatsApp and click-to-message", "Sales qualification by channel", "Real-time new-lead notification", "Alert when a client stops receiving leads", "Export and reporting by period"] },
        { label: "Social and messaging", icon: "📲", items: ["Scheduling for posts, reels and stories", "Instagram, Facebook, YouTube and LinkedIn", "Media library with direct upload", "Batch publishing with an idempotent queue", "Official WhatsApp through Voyia", "Meta-approved message templates"] },
      ],
    },
    roi: {
      heading: "Click to cash: the chain YESHUA closes",
      subheading: "Four links that in most agencies live in separate systems — which is exactly why the math never adds up.",
      steps: [
        { num: "1", title: "What you spent", desc: "The official Meta and Google APIs bring real cost per account, per campaign and per day. No screenshots, no CSV exports, no retyping into a spreadsheet." },
        { num: "2", title: "What it generated", desc: "Every lead arrives stamped with its source: network, campaign, ad and entry point. An untraceable lead becomes the exception, not the rule." },
        { num: "3", title: "What became a client", desc: "Sales qualification marks the lead that actually closed and sends that conversion back to the ad platform, so the algorithm optimises for what matters." },
        { num: "4", title: "What hit the bank", desc: "Contracted service, generated invoice and reconciled payment close the loop: acquisition cost against recurring revenue, client by client." },
      ],
      note: "It's that full chain, in one database, that turns \"I think it's working\" into a number you can put on the table in a meeting.",
    },
    integrations: {
      heading: "Native integrations",
      subheading: "YESHUA talks to the platforms your agency already uses — always through the front door.",
      items: [
        { icon: "📘", title: "Meta Marketing API", desc: "Campaigns, ad sets, ads, cost and results from Facebook and Instagram. Metric reads plus conversion sending through the Conversions API (CAPI)." },
        { icon: "🔍", title: "Google Ads API", desc: "Cost, campaigns, keywords, search terms, region and demographics. Prepaid account balance and top-up detection, with an alert before it runs out." },
        { icon: "💬", title: "WhatsApp Business API", desc: "Through Voyia: approved templates, sending, scheduling and conversation history with real delivery status." },
        { icon: "💳", title: "ASAAS", desc: "Bank slips, instant payments and payment links, recurring subscriptions, automatic reconciliation and credit dates reflected in the cash flow." },
        { icon: "🏛️", title: "Tax authority gateway", desc: "Filing calculation, tax payment slip issuing and compliance status checks — straight from the source, with no middleman." },
        { icon: "📸", title: "Social publishing", desc: "Instagram, Facebook, YouTube and LinkedIn: scheduling and publishing of posts, reels and stories through each network's official API." },
        { icon: "🔌", title: "WordPress plugin", desc: "Install it on the client's site and capture starts: form submissions, lead source, conversions and traffic reach the panel with no extra development." },
        { icon: "🔔", title: "Push, email and reports", desc: "Push notifications in the team app, transactional email with an internal copy, and PDF reports generated on the device itself." },
        { icon: "🗄️", title: "Your database, your BI", desc: "PostgreSQL with full export. Connect Looker Studio, Power BI, Metabase or whichever tool your agency already runs." },
      ],
    },
    flow: {
      heading: "What it takes to get YESHUA running",
      subheading: "From connecting accounts to the first month-end close, without stopping the operation halfway through.",
      steps: [
        { num: "1", title: "Setup", desc: "We stand up the environment, create your team's users and configure access roles — who sees finance, who sees only the media modules, who is a client." },
        { num: "2", title: "Connecting accounts", desc: "You authorise ad accounts, social networks and the billing gateway through each platform's official flow. No password is ever typed inside YESHUA." },
        { num: "3", title: "Import", desc: "Clients, contracts, services and financial history come in at once. Ad account history is reprocessed so the dashboard starts with a past, not from zero." },
        { num: "4", title: "Daily operation", desc: "A lead arrives and it notifies. An account stops and it alerts. A payment comes due and the reminder goes out on its own. The team starts working by exception." },
        { num: "5", title: "Clients in the portal", desc: "Each client gets access to their own portal: leads received, investment, results and reports. The monthly meeting no longer starts with building a slide deck." },
        { num: "6", title: "Month-end close", desc: "Billing, receipts, reconciled expenses, invoices issued and tax filings calculated. The month closes with the same number everywhere." },
      ],
    },
    whoFor: {
      heading: "Who YESHUA is for",
      subheading: "If your operation has recurring clients, other people's media budget and tax obligations, it was designed for you.",
      items: [
        { icon: "📊", title: "Paid media agency", desc: "Manages budget for several clients across Meta and Google and needs to prove results with numbers, not screenshots." },
        { icon: "🎨", title: "Full service agency", desc: "Runs media, social, websites and content for the same client base — and today uses a different tool for each front." },
        { icon: "🧑‍💻", title: "Consultancy and senior freelancer", desc: "Works alone or with a lean team, bills recurring fees and has no time to become their own finance department." },
        { icon: "🏢", title: "Agency with a sales team", desc: "Has reps receiving leads and needs to close the loop between what was invested, what was qualified and what turned into a contract." },
        { icon: "🧾", title: "Anyone invoicing every month", desc: "Charges a subscription or monthly fee, issues an invoice for each client and wants to stop doing it by hand on a government portal." },
        { icon: "🌱", title: "Growing agency", desc: "Has outgrown the spreadsheet but doesn't want the cost — or the complexity — of a corporate ERP." },
      ],
    },
    privacy: {
      heading: "Data, access and privacy",
      subheading: "YESHUA handles advertising, lead and financial data. How that's treated isn't fine print — it's right here.",
      items: [
        { icon: "🔐", title: "Authorisation through the official door", desc: "Access to ad accounts and social networks is granted through each platform's own OAuth flow. YESHUA never asks for or stores your Google or Meta account password." },
        { icon: "🎯", title: "Use limited to what the panel shows", desc: "Data read from the advertising APIs is used to display metrics, generate reports and calculate ROI inside your own account. It is not sold, shared or used to train models." },
        { icon: "👥", title: "Role-based access", desc: "Administrators, staff and clients see different slices of the system. The client sees their portal; staff see only the modules they've been granted." },
        { icon: "🇧🇷", title: "Data protection applied", desc: "Personal lead data with a legal basis, a declared purpose, a retention period and deletion on request. No invisible collection." },
        { icon: "🔄", title: "Revoke at any time", desc: "Disconnect an ad account or a social network whenever you want, from the panel or from the platform's own security settings." },
        { icon: "💾", title: "Backup and export", desc: "Daily database backups and a full export of your data always available, in an open format." },
      ],
      linkLabel: "Read the privacy policy",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "What exactly is YESHUA?", a: "It's a web ERP for digital agencies. It brings finance, tax, client and contract management, paid media, leads and social media into a single panel — with a mobile app for the team and a portal for the client." },
        { q: "Do I need to grant access to my ad accounts?", a: "Yes, and access is granted through Google's and Meta's official authorisation flow. You choose which accounts to connect, YESHUA never sees your password, and you can revoke access at any time." },
        { q: "What does YESHUA read from the Google Ads API?", a: "Cost, campaigns, ad groups, keywords, search terms, performance metrics and prepaid account balance. That data appears in the dashboards and reports of your own account and is used to calculate cost per lead and ROI. When you mark a lead as qualified, YESHUA can send that conversion back to the platform." },
        { q: "Where does my data live?", a: "In a PostgreSQL database with daily backups. A full export is available at any time and you can connect the BI tool you already use." },
        { q: "Is there a mobile app?", a: "Yes. An Android and iOS app with push notifications for new leads, ad account tracking and PDF reports generated on the device itself." },
        { q: "Can I migrate from what I use today?", a: "You can. Clients, contracts, services and financial history come in through import, and ad account history is reprocessed through the APIs — the dashboard starts with a past, not empty." },
        { q: "How much does it cost?", a: "We don't have a price list or fixed plans. YESHUA is modular, and the price depends on how many clients the agency serves, how many ad accounts will be connected and which modules you'll use. Fill in the assessment request on this page: we book a meeting to understand your operation and the proposal comes after it." },
      ],
    },
    finalCta: {
      heading: "Stop assembling reports and get back to operating",
      lead: "Tell us how your agency operates. We book an assessment meeting, show YESHUA running on real data — not on a demo environment — and the proposal comes after it.",
      cta: "Request an assessment",
      whatsapp: "I'd rather talk on WhatsApp",
    },
    analise: {"heading": "Request an assessment of your operation", "subheading": "YESHUA has no list price: each deployment is sized by your client base, your ad accounts and the modules you'll use. Tell us a little about your operation and our sales team will get in touch.", "steps": ["You send the request with the size of your operation", "Our team books an assessment meeting", "We show YESHUA on real data and map your workflow", "You receive a tailored proposal"], "form": {"name": "Name", "email": "Email", "phone": "WhatsApp", "agency": "Agency or company", "agencyPlaceholder": "Agency name", "profile": "You are", "profiles": ["Digital marketing agency", "Advertising agency", "Freelance media buyer", "Other"], "clients": "Active clients", "accounts": "Ad accounts", "ranges": ["1 to 5", "6 to 15", "16 to 40", "41 to 100", "More than 100"], "modules": "Modules of interest", "notes": "Anything we should know before the meeting?", "notesPlaceholder": "Tools you use today, main pain point, timeline...", "privacy": "I agree to be contacted by the Agathas Web team and have read the", "privacyLink": "privacy policy", "submit": "Request an assessment", "sending": "Sending…", "required": "Required field.", "successTitle": "Request received!", "successText": "Our sales team will reach out on WhatsApp or email to book the assessment meeting for your operation.", "error": "We couldn't send it right now. Try again or message us on WhatsApp."}},
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/produtos/yeshua">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return buildPageMetadata({
    lang,
    path: "/produtos/yeshua",
    title: dict.productsPages.yeshua.metadata.title,
    description: dict.productsPages.yeshua.metadata.description,
  });
}

export default async function YeshuaPage({ params }: PageProps<"/[lang]/produtos/yeshua">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.productsPages.yeshua;
  const x = EXTRA[lang];
  const recaptchaSiteKey = getRecaptchaSiteKey();
  const modalLabels = WHATSAPP_MODAL_LABELS[lang];

  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.3), transparent 40%), radial-gradient(circle at 80% 60%, rgba(147,51,234,0.15), transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/40 rounded-full text-sm font-semibold text-amber-300 mb-8">{x.hero.badge}</span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            <span className="text-amber-400">{t.hero.titleHighlight}</span> {t.hero.titleSuffix}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          <p className="mt-4 text-base text-amber-200/80 max-w-3xl mx-auto">{x.hero.subline}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#analise" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-amber-500/20">
              {x.hero.ctaPrimary}
            </a>
            <a href="#modulos" className="inline-flex items-center gap-2 border border-gray-600 hover:border-amber-400 text-white px-6 py-3.5 rounded-lg font-semibold transition-colors text-base">
              {x.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-voyia-dark border-y border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {x.trust.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-amber-400 mb-2">{stat.value}</div>
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
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-amber-500/40 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.problem.heading}</h2>
            <p className="text-lg text-gray-300">{x.problem.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.problem.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray/40 rounded-2xl p-6 border border-gray-800 hover:border-amber-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="py-24 bg-black scroll-mt-20">
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
                  <h3 className="text-lg font-bold text-amber-300 uppercase tracking-wider">{group.label}</h3>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start text-sm text-gray-300">
                      <svg className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI — do clique ao caixa */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.roi.heading}</h2>
            <p className="text-lg text-gray-300">{x.roi.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {x.roi.steps.map((step) => (
              <div key={step.num} className="relative bg-gradient-to-b from-amber-500/10 to-voyia-gray rounded-2xl p-6 border border-amber-500/25">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center mb-4">{step.num}</div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-10 max-w-3xl mx-auto">{x.roi.note}</p>
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

      {/* Fluxo de implantação */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.flow.heading}</h2>
            <p className="text-lg text-gray-300">{x.flow.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.flow.steps.map((step) => (
              <div key={step.num} className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center mb-4">{step.num}</div>
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

      {/* Dados, acesso e privacidade */}
      <section className="py-24 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">{x.privacy.heading}</h2>
            <p className="text-lg text-gray-300">{x.privacy.subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {x.privacy.items.map((item) => (
              <div key={item.title} className="bg-voyia-gray rounded-2xl p-7 border border-gray-700 hover:border-amber-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/privacidade" className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 font-semibold transition-colors">
              {x.privacy.linkLabel}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Pedido de análise — sem preço de tabela: a proposta sai depois da reunião */}
      <section id="analise" className="py-24 bg-voyia-dark scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{x.analise.heading}</h2>
            <p className="text-lg text-gray-300">{x.analise.subheading}</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {x.analise.steps.map((passo, i) => (
              <li key={passo} className="rounded-xl border border-gray-700 bg-black/30 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-black font-bold text-sm mb-3">{i + 1}</span>
                <p className="text-sm text-gray-200 leading-relaxed">{passo}</p>
              </li>
            ))}
          </ol>
          <AnaliseForm
            t={x.analise.form}
            modules={x.modules.groups.map((g) => g.label)}
            locale={lang}
            recaptchaSiteKey={recaptchaSiteKey}
          />
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
                  <svg className="w-5 h-5 text-amber-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-voyia-gray to-orange-700/10 border border-amber-500/30 p-10 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(245,158,11,0.4), transparent 50%)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{x.finalCta.heading}</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{x.finalCta.lead}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#analise" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors text-base shadow-lg shadow-amber-500/30">
                  {x.finalCta.cta}
                </a>
                <WhatsAppCta
                  label={x.finalCta.whatsapp}
                  prefillMessage={PREFILL[lang]}
                  ctaContext="yeshua-final-cta"
                  locale={lang}
                  recaptchaSiteKey={recaptchaSiteKey}
                  modalLabels={modalLabels}
                  className="inline-flex items-center gap-2 border border-gray-500 hover:border-amber-400 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
