/**
 * Assunto de um post do blog, pela categoria: o post fala de um produto da Agathas ou é
 * conteúdo geral (notícia de tecnologia, IA, finanças...)?
 *
 * Por que existe (16/11/2026): o botão de WhatsApp aparecia igual em todo post, e em 60 dias
 * 8 dos 36 leads da Agathas vieram do blog — 5 só do post da atualização One UI 8.5 da
 * Samsung, gente procurando suporte da Samsung. Post de produto (WhatsApp API, gestão
 * escolar, Moodle) traz cliente e mantém o WhatsApp; post de conteúdo perde o botão, ganha
 * um bloco "Conheça as soluções" e, se ainda assim virar lead, chega ao YESHUA marcado como
 * conteúdo, sem disparar o aviso de lead novo.
 *
 * Categoria nova entra como conteúdo até alguém ligá-la a um produto aqui.
 */

export type ProdutoBlog = "voyia" | "salomao" | "moodle" | "trafego";

export type AssuntoBlog =
  | { tipo: "produto"; produto: ProdutoBlog }
  | { tipo: "conteudo" };

const CATEGORIA_PRODUTO: Record<string, ProdutoBlog> = {
  "api-oficial": "voyia",
  voyia: "voyia",
  "gestao-escolar": "salomao",
  educacao: "salomao",
  moodle: "moodle",
  "trafego-pago": "trafego",
};

export function assuntoDaCategoria(slug: string | null | undefined): AssuntoBlog {
  const produto = slug ? CATEGORIA_PRODUTO[slug] : undefined;
  return produto ? { tipo: "produto", produto } : { tipo: "conteudo" };
}

/** Destino e chamada de cada produto, no bloco do fim do post. */
export const PRODUTO_BLOG: Record<ProdutoBlog, { href: string; titulo: string; texto: string; botao: string }> = {
  voyia: {
    href: "/produtos/voyia",
    titulo: "WhatsApp oficial da sua empresa, com vários atendentes",
    texto: "O Voyia coloca o seu número na API oficial da Meta: atendimento em equipe, envio em massa e chatbot, sem perder o WhatsApp do celular.",
    botao: "Conhecer o Voyia",
  },
  salomao: {
    href: "/produtos/salomao",
    titulo: "O app da sua escola, com a marca da escola",
    texto: "Avisos com confirmação de leitura, cantina com PIX, portaria digital, diário infantil, notas e financeiro num app só.",
    botao: "Conhecer o Salomão",
  },
  moodle: {
    href: "/servicos/moodle",
    titulo: "Moodle no ar, rápido e com suporte",
    texto: "Hospedagem, implantação, personalização e suporte para a sua plataforma EAD.",
    botao: "Ver soluções Moodle",
  },
  trafego: {
    href: "/contato",
    titulo: "Quer anúncios que trazem cliente de verdade?",
    texto: "A Agathas Web cuida do Google Ads, Meta e TikTok da sua empresa, com acompanhamento de cada lead.",
    botao: "Falar com a Agathas",
  },
};
