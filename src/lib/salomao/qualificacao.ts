/**
 * Qualificação do lead do Salomão (decisão do Gutto, 16/11/2026).
 *
 * As redes de anúncio recebiam como conversão qualquer pedido de demonstração e aprendiam a
 * buscar mais gente igual: escola estadual, pai, aluno. Agora o formulário pergunta o tipo de
 * escola, o porte e o cargo; todo mundo fica gravado, mas SÓ o qualificado dispara a conversão
 * (Meta, Google, TikTok) e o 1º contato automático pelo WhatsApp.
 *
 * Régua: escola particular (inclui creche e educação infantil), qualquer tamanho, com dono,
 * mantenedor, diretor ou coordenação. O resto entra na demonstração, mas não conta.
 */
export const TIPOS_ESCOLA = {
  particular: "Escola particular (inclui creche e educação infantil)",
  publica: "Escola pública (municipal, estadual ou federal)",
  curso: "Curso livre, idiomas ou reforço",
  outro: "Não sou de uma escola",
} as const;

export const FAIXAS_ALUNOS = {
  "ate-100": "Até 100 alunos",
  "101-300": "De 101 a 300 alunos",
  "301-600": "De 301 a 600 alunos",
  "mais-600": "Mais de 600 alunos",
  "nao-sei": "Não sei / não se aplica",
} as const;

export const PAPEIS = {
  dono: "Dono(a) ou mantenedor(a)",
  diretor: "Diretor(a)",
  coordenacao: "Coordenação",
  secretaria: "Secretaria ou financeiro",
  professor: "Professor(a)",
  familia: "Pai, mãe ou aluno",
  outro: "Outro",
} as const;

export type TipoEscola = keyof typeof TIPOS_ESCOLA;
export type FaixaAlunos = keyof typeof FAIXAS_ALUNOS;
export type Papel = keyof typeof PAPEIS;

const DECISORES: Papel[] = ["dono", "diretor", "coordenacao"];

export interface Qualificacao {
  tipo: TipoEscola;
  alunos: FaixaAlunos;
  papel: Papel;
  qualificado: boolean;
  /** Linhas para a mensagem do lead (e-mail da equipe, YESHUA). */
  texto: string;
}

/** Lê as três respostas do corpo do pedido. Devolve null se faltar alguma ou vier valor desconhecido. */
export function lerQualificacao(b: Record<string, unknown>): Qualificacao | null {
  const tipo = String(b.tipoEscola ?? "") as TipoEscola;
  const alunos = String(b.alunos ?? "") as FaixaAlunos;
  const papel = String(b.papel ?? "") as Papel;
  if (!(tipo in TIPOS_ESCOLA) || !(alunos in FAIXAS_ALUNOS) || !(papel in PAPEIS)) return null;
  const qualificado = tipo === "particular" && DECISORES.includes(papel);
  return {
    tipo, alunos, papel, qualificado,
    texto:
      `${qualificado ? "✅ QUALIFICADO" : "⛔ FORA DA RÉGUA (não contou como conversão nem recebeu o 1º contato automático)"}\n` +
      `Tipo: ${TIPOS_ESCOLA[tipo]}\nPorte: ${FAIXAS_ALUNOS[alunos]}\nCargo: ${PAPEIS[papel]}`,
  };
}
