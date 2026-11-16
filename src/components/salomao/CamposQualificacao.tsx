import { FAIXAS_ALUNOS, PAPEIS, TIPOS_ESCOLA } from "@/lib/salomao/qualificacao";

/** As três perguntas de qualificação dos formulários do Salomão (ver @/lib/salomao/qualificacao). */
export default function CamposQualificacao({ prefixo, classeCampo, classeRotulo }: { prefixo: string; classeCampo: string; classeRotulo: string }) {
  const lista = (id: string, nome: string, rotulo: string, opcoes: Record<string, string>) => (
    <div>
      <label htmlFor={`${prefixo}-${id}`} className={classeRotulo}>{rotulo}</label>
      <select id={`${prefixo}-${id}`} name={nome} required defaultValue="" className={classeCampo}>
        <option value="" disabled>Selecione</option>
        {Object.entries(opcoes).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
      </select>
    </div>
  );
  return (
    <>
      {lista("tipo", "tipoEscola", "Sua escola é", TIPOS_ESCOLA)}
      <div className="grid gap-4 sm:grid-cols-2">
        {lista("alunos", "alunos", "Quantos alunos", FAIXAS_ALUNOS)}
        {lista("papel", "papel", "Seu cargo", PAPEIS)}
      </div>
    </>
  );
}
