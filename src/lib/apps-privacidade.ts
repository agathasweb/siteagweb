// Políticas de privacidade dos aplicativos publicados pela Agathas Web nas lojas (App Store e Google Play).
// As lojas exigem um endereço público por aplicativo. Texto só em português: o público dos apps é do Brasil.

export type AppPrivacidade = {
  nome: string
  responsavel: string // quem decide sobre os dados (a instituição dona da plataforma)
  site: string
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

export const APPS_PRIVACIDADE: Record<string, AppPrivacidade> = {
  'cva-iejur': moodle('CVA IEJUR', 'IEJUR', 'https://www.iejur.com', 'https://cva.iejur.com'),
  'ipos-ead': moodle('iPós EaD', 'iPós', 'https://www.iposead.com.br', 'https://ava.iposead.com.br'),
}
