import { FAIXAS_ALUNOS, PAPEIS, TIPOS_ESCOLA } from "@/lib/salomao/qualificacao";

/** Rótulos curtos dos botões (o valor enviado continua a chave de @/lib/salomao/qualificacao). */
const CURTO_TIPO: Record<keyof typeof TIPOS_ESCOLA, string> = {
  particular: "Particular (inclui creche e infantil)",
  publica: "Pública",
  curso: "Curso livre, idiomas ou reforço",
  outro: "Não sou de escola",
};
const CURTO_ALUNOS: Record<keyof typeof FAIXAS_ALUNOS, string> = {
  "ate-100": "Até 100",
  "101-300": "101 a 300",
  "301-600": "301 a 600",
  "mais-600": "Mais de 600",
  "nao-sei": "Não sei",
};
const CURTO_PAPEL: Record<keyof typeof PAPEIS, string> = {
  dono: "Dono(a) ou mantenedor(a)",
  diretor: "Diretor(a)",
  coordenacao: "Coordenação",
  secretaria: "Secretaria ou financeiro",
  professor: "Professor(a)",
  familia: "Pai, mãe ou aluno",
  outro: "Outro",
};

/**
 * As três perguntas de qualificação dos formulários do Salomão (ver @/lib/salomao/qualificacao).
 *
 * Botões de toque (rádio) no lugar de <select> (21/11/2026): no celular cada lista abria o seletor
 * nativo, três vezes seguidas, e o Clarity mostrava visita de 0 a 3 s ativos vinda dos anúncios.
 * Com rádio, a opção aparece na tela e um toque basta. `valores` permite preencher de novo
 * (formulário em 2 passos).
 */
export default function CamposQualificacao({ prefixo, classeRotulo, valores }: {
  prefixo: string;
  classeRotulo: string;
  /** Mantido por compatibilidade com quem passava a classe do <select>; não é usado. */
  classeCampo?: string;
  valores?: { tipoEscola?: string; alunos?: string; papel?: string };
}) {
  const grupo = (id: string, nome: "tipoEscola" | "alunos" | "papel", rotulo: string, opcoes: Record<string, string>, colunas: string) => (
    <fieldset>
      <legend className={classeRotulo}>{rotulo}</legend>
      <div className={`mt-1.5 grid gap-2 ${colunas}`}>
        {Object.entries(opcoes).map(([valor, texto]) => (
          <label key={valor} className="cursor-pointer">
            <input type="radio" name={nome} value={valor} required defaultChecked={valores?.[nome] === valor} id={`${prefixo}-${id}-${valor}`} className="peer sr-only" />
            <span className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium leading-tight text-slate-700 peer-checked:border-[#1f2a44] peer-checked:bg-[#1f2a44] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4a72c]/60">
              {texto}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <>
      {grupo("tipo", "tipoEscola", "Sua escola é", CURTO_TIPO, "grid-cols-2")}
      {grupo("papel", "papel", "Seu cargo", CURTO_PAPEL, "grid-cols-2")}
      {grupo("alunos", "alunos", "Quantos alunos", CURTO_ALUNOS, "grid-cols-3 sm:grid-cols-5")}
    </>
  );
}
