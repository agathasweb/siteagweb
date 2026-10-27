import type { ReactNode } from 'react'
import { Celular, Tela } from './Molduras'
import s from './lp.module.css'
import appAluno from './img/app-aluno.webp'
import appLiberacao from './img/app-liberacao.webp'
import appLanches from './img/app-lanches.webp'
import appTarefas from './img/app-tarefas.webp'
import appBoletim from './img/app-boletim.webp'
import tvPortaria from './img/tv-portaria.webp'
import escolaCantina from './img/escola-cantina.webp'
import escolaFinanceiro from './img/escola-financeiro.webp'
import escolaAlunos from './img/escola-alunos.webp'

/**
 * Seções das páginas de venda do Salomão (produto + landings). Prints reais da escola de demonstração
 * (nomes fictícios). Imagens com import estático: tamanho fixo (sem pulo de layout), blur enquanto carrega,
 * WebP/AVIF no tamanho do aparelho; só a primeira dobra carrega com prioridade.
 */

const AZUL = '#1f2a44'

function Check() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#d4a72c]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  )
}

export function Hero({ selo, titulo, subtitulo, acoes, rodape }: { selo: ReactNode; titulo: ReactNode; subtitulo: ReactNode; acoes: ReactNode; rodape?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-[#1f2a44] bg-[radial-gradient(circle_at_85%_10%,rgba(212,167,44,0.18),transparent_45%)] text-white">
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 [&>*]:min-w-0 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:pb-20">
        <div>
          <div className={s.entra}>{selo}</div>
          <h1 className={`mt-5 text-[2.1rem] font-bold leading-[1.12] tracking-tight sm:text-5xl ${s.entra2}`}>{titulo}</h1>
          <p className={`mt-5 max-w-xl text-lg leading-8 text-slate-200 ${s.entra3}`}>{subtitulo}</p>
          <div className={`mt-8 flex flex-wrap items-center gap-3 ${s.entra3}`}>{acoes}</div>
          {rodape && <div className={`mt-6 ${s.entra3}`}>{rodape}</div>}
        </div>
        {/* TV da portaria + celular do pai: a promessa inteira numa imagem */}
        {/* celular: só o app (leve, o texto continua sendo o maior conteúdo); telas maiores: TV + celular */}
        <div className="relative mx-auto w-full max-w-[560px] sm:pb-16">
          <div className={`relative hidden rounded-2xl border-[6px] border-[#0f1626] bg-[#0f1626] shadow-2xl sm:block ${s.flutuaLento}`}>
            <Tela src={tvPortaria} alt="TV da portaria chamando o nome do aluno e a fila de chegada" endereco="TV da portaria" className="!rounded-lg !border-0 !shadow-none" />
          </div>
          <div className={`mx-auto w-[200px] sm:absolute sm:-bottom-2 sm:-right-4 sm:w-[190px] ${s.flutua}`}>
            <Celular src={appLiberacao} alt="App dos pais: botão Solicitar liberação na portaria" className="!w-full !border-[5px]" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Selos({ itens }: { itens: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
      {itens.map((t) => (
        <li key={t} className="flex items-center gap-1.5"><Check /> {t}</li>
      ))}
    </ul>
  )
}

export function Portaria() {
  const passos = [
    ['Chegou, tocou', 'O responsável abre o app da escola e toca em "Buscar na saída". Sem ligar, sem gritar no portão.'],
    ['A TV chama', 'O nome e a turma aparecem na TV e são falados em voz alta, com voz natural. Irmãos saem juntos.'],
    ['Liberado com registro', 'Um toque na TV libera. A escola sabe quem buscou, quando e quanto tempo esperou.'],
  ]
  return (
    <section className="bg-white [content-visibility:auto] [contain-intrinsic-size:auto_1100px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Portaria digital</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">O fim da fila e da gritaria na saída</h2>
        <div className="mt-10 grid items-center gap-10 [&>*]:min-w-0 lg:grid-cols-[1.3fr_1fr]">
          <div className={s.revela}>
            <Tela src={tvPortaria} alt="Painel da portaria na TV com o aluno em chamada e a fila" endereco="escola.salomao.agathas.com.br/portaria" />
          </div>
          <ol className="space-y-6">
            {passos.map(([t, d], i) => (
              <li key={t} className={`flex gap-4 ${s.revela}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-[#d4a72c]" style={{ background: AZUL }}>{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{d}</p>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-2 pl-14 text-sm text-slate-500"><span className={`h-2 w-2 rounded-full bg-green-500 ${s.pulso}`} /> 6 vozes para escolher (3 femininas e 3 masculinas)</li>
          </ol>
        </div>
      </div>
    </section>
  )
}

export function AppPais() {
  const telas = [
    [appAluno, 'Tudo do filho na tela inicial', 'Tarefas, cantina, saída, boletim e frequência num toque.'],
    [appTarefas, 'Tarefas de casa', 'O professor publica com vídeo e anexos; a família acompanha.'],
    [appLanches, 'Cantina com crédito', 'PIX que entra sozinho, encomenda do lanche e extrato.'],
    [appBoletim, 'Boletim sempre em dia', 'Notas por bimestre e média, sem papel.'],
  ] as const
  return (
    <section className="bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_1100px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">App dos pais</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">A escola no celular da família, com a marca da escola</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Nome, logo e cores da sua escola. Instala direto do navegador (sem loja), avisa por notificação e entra com digital ou rosto.</p>
      </div>
      <div className={`${s.trilho} -mt-4 flex gap-6 overflow-x-auto px-5 pb-16 sm:px-6 lg:mx-auto lg:max-w-6xl lg:justify-between lg:overflow-visible lg:px-8 lg:pb-24`}>
        {telas.map(([img, t, d]) => (
          <figure key={t} className={`w-[230px] shrink-0 sm:w-[250px] ${s.revela}`}>
            <Celular src={img} alt={`App dos pais: ${t}`} />
            <figcaption className="mt-4 text-center">
              <span className="block font-semibold text-[#1f2a44]">{t}</span>
              <span className="mt-1 block text-sm text-slate-600">{d}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function Secretaria() {
  const blocos = [
    [escolaCantina, 'Cantina no balcão', 'Busca o aluno, toca nos itens e o valor sai do crédito. Saldo nunca fica negativo.', 'escola.salomao.agathas.com.br/cantina'],
    [escolaFinanceiro, 'Financeiro claro', 'Mensalidades, despesas, atrasados e a sobra prevista do mês numa tela só.', 'escola.salomao.agathas.com.br/admin/financeiro'],
    [escolaAlunos, 'Alunos e famílias', 'Importa a planilha de qualquer sistema em minutos. Documentos da matrícula guardados com segurança.', 'escola.salomao.agathas.com.br/admin/alunos'],
  ] as const
  return (
    <section className="bg-white [content-visibility:auto] [contain-intrinsic-size:auto_1100px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Para a secretaria e a direção</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Menos papel, menos telefone, mais controle</h2>
        <div className="mt-12 space-y-14 lg:space-y-20">
          {blocos.map(([img, t, d, end], i) => (
            <div key={t} className={`grid items-center gap-8 [&>*]:min-w-0 lg:grid-cols-[1.4fr_1fr] ${i % 2 ? 'lg:[&>*:first-child]:order-2 lg:grid-cols-[1fr_1.4fr]' : ''}`}>
              <div className={s.revela}><Tela src={img} alt={t} endereco={end} /></div>
              <div className={s.revela}>
                <h3 className="text-2xl font-bold text-[#1f2a44]">{t}</h3>
                <p className="mt-3 text-slate-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Numeros() {
  const itens = [
    ['48 h', 'para a escola estar funcionando, com a lista de alunos importada'],
    ['R$ 0,99', 'por aluno por mês no plano de 250 alunos'],
    ['0', 'taxa de implantação ou fidelidade'],
    ['6', 'módulos inclusos: portaria, cantina, tarefas, notas, financeiro e avisos'],
  ]
  return (
    <section className="bg-[#1f2a44] text-white [content-visibility:auto] [contain-intrinsic-size:auto_500px]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {itens.map(([n, t]) => (
          <div key={n} className={s.revela}>
            <p className="text-4xl font-bold tabular-nums text-[#d4a72c]">{n}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{t}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export const FAQ_PADRAO = [
  ['Preciso instalar alguma coisa?', 'Não. Funciona no navegador do computador e do celular. Na portaria basta uma TV com navegador (ou um computador ligado nela).'],
  ['Como os pais recebem o acesso?', 'A escola importa a lista de alunos e cada responsável cria o próprio acesso com o CPF cadastrado. Depois é só instalar o app pelo navegador.'],
  ['E se a escola já usa outro sistema?', 'O Salomão importa a planilha de alunos de qualquer sistema. Dá para começar pela portaria e pela cantina e ir ligando o resto.'],
  ['Os dados ficam seguros?', 'Cada escola só enxerga os próprios dados, o acesso é por login individual e os documentos ficam fora da área pública. Tratamos dados de alunos conforme a LGPD.'],
  ['Posso cancelar?', 'Pode, quando quiser, sem multa. No mensal a cobrança para no ciclo seguinte.'],
  ['Tem app na App Store e no Google Play?', 'Todo plano inclui o app instalável com a marca da escola. O app próprio nas lojas é um adicional (R$ 2.749 de implantação + R$ 99/mês), publicado na conta da escola.'],
] as const

export function Perguntas({ itens = FAQ_PADRAO }: { itens?: readonly (readonly [string, string])[] }) {
  return (
    <section className="bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_700px]">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Perguntas frequentes</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">
          {itens.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#1f2a44]">
                {q}
                <span className="text-xl text-[#b8891a] transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Compra({ titulo, texto, children }: { titulo: string; texto: ReactNode; children: ReactNode }) {
  return (
    <section id="assinar" className="scroll-mt-20 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 [&>*]:min-w-0 lg:grid-cols-[1fr_1.2fr] lg:px-8 lg:py-24">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">{titulo}</h2>
          <div className="mt-4 text-slate-600">{texto}</div>
          <div className="mt-8 hidden lg:block">
            <Celular src={appAluno} alt="Tela inicial do app dos pais" className="!mx-0 rotate-[-4deg]" />
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

export function TabelaPrecos({ cupom = false }: { cupom?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-3">Alunos</th><th className="px-4 py-3">Mensal</th><th className="px-4 py-3">Anual</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 tabular-nums">
          <tr><td className="px-4 py-3 font-medium">Até 250</td><td className="px-4 py-3">{cupom ? <><s className="text-slate-400">R$ 249</s> <strong>R$ 174,30</strong></> : 'R$ 249'}</td><td className="px-4 py-3">R$ 2.490</td></tr>
          <tr><td className="px-4 py-3 font-medium">Até 500</td><td className="px-4 py-3">{cupom ? <><s className="text-slate-400">R$ 499</s> <strong>R$ 349,30</strong></> : 'R$ 499'}</td><td className="px-4 py-3">R$ 4.990</td></tr>
          <tr><td className="px-4 py-3 font-medium">Mais de 500</td><td className="px-4 py-3" colSpan={2}>Orçamento</td></tr>
        </tbody>
      </table>
    </div>
  )
}
