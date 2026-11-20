// Políticas de privacidade dos aplicativos publicados pela Agathas Web nas lojas (App Store e Google Play).
// As lojas exigem um endereço público por aplicativo. Texto só em português: o público dos apps é do Brasil.

export type AppPrivacidade = {
  nome: string
  responsavel: string // quem decide sobre os dados (a instituição dona da plataforma)
  site: string
  rotuloSite?: string // como chamar o site no rodapé (padrão: "Instituição")
  plataforma: string // endereço da plataforma que o app acessa
  contato: string
  atualizado: string
  secoes: { titulo: string; paragrafos: string[] }[]
}

// Apps feitos sobre o Moodle App: o aplicativo é só a porta de entrada para a plataforma de ensino da instituição.
function moodle(nome: string, responsavel: string, site: string, plataforma: string): AppPrivacidade {
  return {
    nome,
    responsavel,
    site,
    plataforma,
    contato: 'webmaster@agathas.com.br',
    atualizado: '19 de novembro de 2026',
    secoes: [
      {
        titulo: 'Quem é responsável',
        paragrafos: [
          `O aplicativo ${nome} dá acesso à plataforma de ensino de ${responsavel} (${plataforma}). ${responsavel} decide quais dados são tratados e para quê. A Agathas Web (AGATHAS MANUTENCAO DE COMPUTADORES LTDA, CNPJ 10.573.571/0001-79) desenvolve e publica o aplicativo e hospeda a plataforma, por conta da instituição.`,
        ],
      },
      {
        titulo: 'Quais dados o aplicativo trata',
        paragrafos: [
          'Dados da sua conta na plataforma: nome, e-mail, usuário e foto de perfil, quando houver. A conta é criada pela instituição no ato da matrícula; o aplicativo não cria contas.',
          'Dados de estudo: cursos em que você está matriculado, atividades, notas, mensagens trocadas na plataforma, participações em fóruns e arquivos que você enviar.',
          'Dados do aparelho: um identificador para o envio de notificações, o modelo e a versão do sistema. Servem para entregar avisos da plataforma e para corrigir falhas.',
          'Câmera, microfone, fotos e arquivos só são acessados quando você escolhe enviar uma foto, um áudio ou um arquivo em uma atividade. A localização só é usada se alguma atividade do curso pedir e você autorizar.',
        ],
      },
      {
        titulo: 'Para que os dados são usados',
        paragrafos: [
          'Para você entrar na plataforma, assistir às aulas, entregar atividades, acompanhar notas e certificados e receber avisos dos seus cursos. O aplicativo não exibe anúncios, não vende dados e não usa os dados para publicidade nem para rastrear você em outros aplicativos ou sites.',
        ],
      },
      {
        titulo: 'Onde os dados ficam e com quem são compartilhados',
        paragrafos: [
          `Os dados ficam nos servidores da plataforma de ${responsavel}, com conexão criptografada (HTTPS). Conteúdos baixados para uso sem internet ficam guardados no seu aparelho e são apagados quando você sai da conta ou desinstala o aplicativo.`,
          'As notificações são entregues pelos serviços da Apple (APNs) e do Google (Firebase Cloud Messaging), que recebem apenas o identificador de notificação do aparelho e o conteúdo do aviso. Não há outro compartilhamento com terceiros, salvo obrigação legal.',
        ],
      },
      {
        titulo: 'Por quanto tempo',
        paragrafos: [
          'Os dados são mantidos enquanto a sua matrícula estiver ativa e, depois disso, pelo prazo que a instituição precisa cumprir para guardar registros acadêmicos e emitir certificados.',
        ],
      },
      {
        titulo: 'Seus direitos e exclusão da conta',
        paragrafos: [
          `Pela Lei Geral de Proteção de Dados (Lei 13.709/2018) você pode pedir acesso, correção, portabilidade e exclusão dos seus dados. Para excluir a sua conta e os dados ligados a ela, escreva para webmaster@agathas.com.br informando o seu nome e o e-mail de cadastro, ou procure a secretaria de ${responsavel}. O pedido é atendido em até 15 dias; registros que a instituição é obrigada a guardar por lei são mantidos pelo prazo legal.`,
        ],
      },
      {
        titulo: 'Crianças',
        paragrafos: ['O aplicativo é destinado a alunos de cursos para adultos e não é direcionado a crianças.'],
      },
      {
        titulo: 'Alterações',
        paragrafos: ['Esta política pode ser atualizada. A data da última atualização fica no topo da página.'],
      },
    ],
  }
}

// Voyia: plataforma de atendimento pelo WhatsApp. Quem decide sobre os dados dos clientes atendidos é a empresa que
// contratou o Voyia; a Agathas Web opera a plataforma.
const voyia: AppPrivacidade = {
  nome: 'Voyia',
  responsavel: 'Agathas Web',
  site: 'https://agathas.com.br/produtos/voyia',
  rotuloSite: 'Site',
  plataforma: 'https://voyia.agathasweb.com',
  contato: 'webmaster@agathas.com.br',
  atualizado: '19 de novembro de 2026',
  secoes: [
    {
      titulo: 'Quem é responsável',
      paragrafos: [
        'O Voyia é uma plataforma de atendimento a clientes pelo WhatsApp, com painel web e aplicativo para Android e iPhone. É desenvolvido e operado pela Agathas Web (AGATHAS MANUTENCAO DE COMPUTADORES LTDA, CNPJ 10.573.571/0001-79).',
        'Sobre os dados da equipe que usa o aplicativo (os atendentes), a Agathas Web é a controladora. Sobre os dados dos clientes atendidos (nome, telefone e conversas), quem decide é a empresa que contratou o Voyia; a Agathas Web trata esses dados por conta dela, como operadora, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).',
      ],
    },
    {
      titulo: 'Quais dados o aplicativo trata',
      paragrafos: [
        'Dados da sua conta: nome, e-mail, senha (guardada só como hash) e o seu papel na empresa. A conta é criada pela empresa em que você trabalha; o aplicativo não tem cadastro aberto.',
        'Dados de atendimento: as conversas da empresa com os clientes dela pelo WhatsApp (mensagens, imagens, áudios e documentos), o nome e o telefone desses clientes e o registro de quem atendeu cada conversa.',
        'Fotos e arquivos: só os que você escolhe enviar em uma conversa. O aplicativo pede acesso à câmera e à galeria nesse momento e não lê nenhum outro arquivo do aparelho.',
        'Dados do aparelho: o identificador de notificação, usado só para avisar sobre mensagens novas.',
      ],
    },
    {
      titulo: 'Para que os dados são usados',
      paragrafos: [
        'Para você entrar na plataforma, ler e responder as conversas da sua empresa e receber avisos de mensagens novas. O aplicativo não exibe anúncios, não vende dados e não usa os dados para publicidade nem para rastrear você em outros aplicativos ou sites.',
      ],
    },
    {
      titulo: 'Onde os dados ficam e com quem são compartilhados',
      paragrafos: [
        'Os dados ficam nos servidores da plataforma, no Brasil, com conexão criptografada (HTTPS). No aparelho, o acesso fica no armazenamento seguro do sistema.',
        'As mensagens trafegam pela plataforma do WhatsApp Business, da Meta, que é o canal de atendimento. As notificações são entregues pelos serviços da Apple (APNs) e do Google (Firebase Cloud Messaging), que recebem o identificador de notificação do aparelho e o texto do aviso. Quando a empresa liga a transcrição de áudio ou o atendente virtual, o conteúdo necessário é processado por provedores de inteligência artificial contratados para isso. Não há outro compartilhamento com terceiros, salvo obrigação legal.',
      ],
    },
    {
      titulo: 'Por quanto tempo',
      paragrafos: [
        'Os dados da conta são mantidos enquanto ela estiver ativa. As conversas são mantidas enquanto a empresa for cliente do Voyia e pelo prazo que ela definir ou a lei exigir.',
      ],
    },
    {
      titulo: 'Seus direitos e exclusão da conta',
      paragrafos: [
        'Você pode pedir acesso, correção, portabilidade e exclusão dos seus dados. Para excluir a sua conta de atendente e os dados ligados a ela, escreva para webmaster@agathas.com.br informando o seu nome, o e-mail de cadastro e a empresa, ou peça ao administrador da sua empresa no painel. O pedido é atendido em até 15 dias.',
        'Se você é cliente de uma empresa que usa o Voyia e quer exercer os seus direitos sobre as suas conversas, procure essa empresa; se preferir, escreva para o mesmo endereço e encaminhamos o pedido a ela.',
      ],
    },
    {
      titulo: 'Crianças',
      paragrafos: ['O aplicativo é uma ferramenta de trabalho para equipes de atendimento e não é direcionado a crianças.'],
    },
    {
      titulo: 'Alterações',
      paragrafos: ['Esta política pode ser atualizada. A data da última atualização fica no topo da página.'],
    },
  ],
}

export const APPS_PRIVACIDADE: Record<string, AppPrivacidade> = {
  'cva-iejur': moodle('CVA IEJUR', 'IEJUR', 'https://www.iejur.com', 'https://cva.iejur.com'),
  'ipos-ead': moodle('iPós EaD', 'iPós', 'https://www.iposead.com.br', 'https://ava.iposead.com.br'),
  voyia,
}
