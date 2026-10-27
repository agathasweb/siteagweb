import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'

/**
 * Landing C — dor da rotina e segurança na saída (conheca.salomao.agathas.com.br).
 * Gatilhos: identificação com o problema, demonstração passo a passo, autoridade da Agathas.
 */
export const metadata: Metadata = {
  title: { absolute: 'Salomão — a saída da escola sem fila e sem gritaria' },
  description: 'Portaria digital: o responsável pede a saída pelo celular e o nome do aluno é chamado na TV. Mais app dos pais, cantina com PIX e tarefas.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://agathas.com.br/produtos/salomao' },
}

function pixelSalomao(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID_SALOMAO?.trim()
  return id && /^\d{10,20}$/.test(id) ? id : null
}

const DORES = [
  ['17h30, portão lotado', 'Pais buzinando, porteiro gritando nomes, criança que não ouve e fica para trás.'],
  ['Telefone da secretaria não para', '"Ela já saiu?", "Hoje tem tarefa?", "Quanto deu a cantina?" — o dia inteiro.'],
  ['Cantina no caderno', 'Fiado anotado à mão, troco que falta e pai que não sabe o que o filho comeu.'],
]

const PASSOS = [
  ['1', 'O responsável chega', 'Abre o app da escola no celular e toca em "Buscar na saída".'],
  ['2', 'A TV chama', 'O nome e a turma do aluno aparecem na TV da portaria e são falados em voz alta.'],
  ['3', 'A portaria libera', 'Um toque marca a saída. A escola guarda o histórico de quem buscou e a que horas.'],
]

export default async function EscolaSalomao({ params }: PageProps<'/[lang]/produtos/salomao/escola'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const pixelId = pixelSalomao()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'

  return (
    <main id="main-content" role="main" className="bg-[#f7f6f2] text-slate-900">
      <SalomaoPixel pixelId={pixelId} valor={249} />

      <section className="bg-[#1f2a44] text-white">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d4a72c]">Para diretores e mantenedores</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">A saída da escola sem fila, sem gritaria e com registro de quem buscou</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            O Salomão organiza a portaria, a cantina e a comunicação com as famílias num app com a marca da sua escola.
          </p>
          <a href="#assinar" className="mt-8 inline-block rounded-lg bg-[#d4a72c] px-7 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Quero na minha escola</a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Parece com a sua escola?</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {DORES.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Como funciona a portaria digital</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {PASSOS.map(([n, t, d]) => (
              <li key={n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f2a44] font-bold text-[#d4a72c]">{n}</span>
                <div>
                  <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-slate-600">
            E mais: app dos pais com boletim, frequência, tarefas e avisos com notificação; cantina com crédito por PIX que entra sozinho;
            secretaria com documentos da matrícula e importação de alunos por planilha.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Feito pela Agathas Web</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          A mesma equipe que mantém sites, plataformas de ensino e sistemas para dezenas de instituições. Suporte humano por WhatsApp
          e instalação em até 48 horas, com a lista de alunos importada por nós.
        </p>
      </section>

      <section id="assinar" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-[1fr_1.3fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Menos de R$ 1 por aluno</h2>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li><strong className="text-[#1f2a44]">Até 250 alunos:</strong> R$ 249/mês ou R$ 2.490/ano</li>
              <li><strong className="text-[#1f2a44]">Até 500 alunos:</strong> R$ 499/mês ou R$ 4.990/ano</li>
              <li>Todos os módulos, sem taxa de implantação. Cancele quando quiser.</li>
              <li>Mais de 500 alunos ou rede com mais de 3 unidades: orçamento.</li>
            </ul>
          </div>
          <SalomaoCheckout dominioBase={dominioBase} pixelId={pixelId} />
        </div>
      </section>
    </main>
  )
}
