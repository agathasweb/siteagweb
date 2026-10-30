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
        <p className="mt-3 max-w-2xl text-slate-600">Nome, logo e cores da sua escola. Instala direto do navegador, avisa por notificação e entra com digital ou rosto. E, se a escola quiser, o app também vai para a Google Play e a App Store.</p>
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
    ['30 dias', 'de garantia: não serviu, devolvemos o valor pago'],
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
  ['A escola pode ter o próprio app na Google Play e na App Store?', 'Pode. Com o adicional App nas Lojas, o app é publicado na Google Play e na App Store com o nome, o ícone, a logo e as cores da escola, na conta da própria escola: as famílias baixam pela loja oficial e veem a marca da escola, não a nossa. Custa R$ 2.749 de implantação + R$ 99/mês. Sem o adicional, todo plano já inclui o app instalável pelo navegador com a marca da escola.'],
  ['Como os pais recebem o acesso?', 'A escola importa a lista de alunos e cada responsável cria o próprio acesso com o CPF cadastrado. Depois é só instalar o app pelo navegador.'],
  ['E se a escola já usa outro sistema?', 'O Salomão importa a planilha de alunos de qualquer sistema. Dá para começar pela portaria e pela cantina e ir ligando o resto.'],
  ['Os dados ficam seguros?', 'Cada escola só enxerga os próprios dados, o acesso é por login individual e os documentos ficam fora da área pública. Tratamos dados de alunos conforme a LGPD.'],
  ['Posso cancelar?', 'Pode, quando quiser, sem multa. No mensal a cobrança para no ciclo seguinte.'],
  ['E se não servir para a minha escola?', 'Você tem 30 dias de garantia: se o Salomão não servir para a escola, devolvemos o valor pago, sem burocracia. Basta pedir pelo WhatsApp ou e-mail.'],
  ['Como é o pagamento?', 'Cartão de crédito, boleto ou PIX: você escolhe na tela de pagamento segura da ASAAS. Mensal ou anual (o anual sai por 10 mensalidades).'],
  ['Quem está por trás do Salomão?', 'A Agathas Web, empresa de tecnologia de Senador Canedo (GO) que desenvolve sites, sistemas e plataformas de ensino desde 2009. O suporte é feito pela nossa equipe, por WhatsApp, e a implantação inclui a importação da lista de alunos.'],
  ['Posso falar com alguém antes de assinar?', 'Claro. Chame no WhatsApp (62) 99123-9558: a gente tira as dúvidas, mostra o sistema funcionando e ajuda a decidir o plano.'],
] as const

/** Vídeos reais da escola de demonstração: a portaria chamando o aluno e o painel do diretor. */
export function VideoDemo({ acao }: { acao?: ReactNode }) {
  const videos = [
    ['/salomao/V1-saida.mp4', '/salomao/V1-saida.webp', 'A saída funcionando: o pai pede pelo app e a TV chama o aluno'],
    ['/salomao/V3-painel-diretor.mp4', '/salomao/V3-painel-diretor.webp', 'O painel do diretor: financeiro, alunos e relatórios'],
  ] as const
  return (
    <section className="bg-white [content-visibility:auto] [contain-intrinsic-size:auto_900px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Veja funcionando em 20 segundos</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Telas reais do Salomão, na escola de demonstração.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {videos.map(([src, poster, legenda]) => (
            <figure key={src}>
              <video src={src} poster={poster} controls playsInline preload="none" width={720} height={900}
                className="aspect-[4/5] w-full rounded-2xl border border-slate-200 bg-[#0f1626] object-cover shadow-lg" />
              <figcaption className="mt-2 text-sm text-slate-600">{legenda}</figcaption>
            </figure>
          ))}
        </div>
        {acao && <div className="mt-8 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

/**
 * Quem está por trás + garantia. Os clientes listados são clientes REAIS da Agathas Web (sites e
 * sistemas), apresentados como tal — não como usuários do Salomão. Depoimento só entra aqui escrito
 * e autorizado pelo cliente.
 */
const CLIENTES = [
  ['Colégio Provérbios', 'https://colegioproverbios.com.br', 'Escola'],
  ['Lar Benedi', 'https://larbenedi.com', 'Educação de crianças · Uganda'],
  ['Projeto VIP', 'https://vip.associacaobethel.com.br', 'Associação Bethel'],
] as const

export function Confianca({ acao }: { acao?: ReactNode }) {
  const pilares = [
    ['Desde 2009', 'A Agathas Web desenvolve sites, sistemas e plataformas de ensino há 17 anos, em Senador Canedo (GO).'],
    ['Gente de verdade no suporte', 'Implantação com a lista de alunos importada por nós e atendimento humano pelo WhatsApp.'],
    ['Garantia de 30 dias', 'Se o Salomão não servir para a sua escola, devolvemos o valor pago. Sem fidelidade e sem multa.'],
    ['Dados protegidos', 'Cada escola só vê os próprios dados, com login individual, tratamento conforme a LGPD e pagamento pela ASAAS.'],
  ]
  return (
    <section className="bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_700px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Quem está por trás</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Feito pela Agathas Web, com quem você fala direto</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-[#1f2a44]">Instituições de ensino e projetos sociais que já confiam na Agathas Web</p>
          <p className="mt-1 text-xs text-slate-500">Clientes da agência em sites e sistemas.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {CLIENTES.map(([nome, url, tipo]) => (
              <li key={nome}>
                <a href={url} target="_blank" rel="noopener" className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-[#d4a72c]">
                  <span className="block font-semibold text-[#1f2a44]">{nome}</span>
                  <span className="block text-xs text-slate-500">{tipo} · {url.replace('https://', '')}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        {acao && <div className="mt-8 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

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

/** Ícone genérico do app da escola (monograma + capelo), desenhado em SVG: zero bytes de imagem. */
function IconeEscola({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-[22%] bg-gradient-to-br from-[#d4a72c] to-[#b8891a] text-[#1f2a44] shadow-md ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="currentColor">
        <path d="M12 3 1.5 8.5 12 14l8.5-4.45V16h2V8.5L12 3Z" />
        <path d="M5.5 12.2v3.6c0 1.6 2.9 3.2 6.5 3.2s6.5-1.6 6.5-3.2v-3.6L12 15.6l-6.5-3.4Z" opacity=".75" />
      </svg>
    </span>
  )
}

/** Selo de loja estilizado (texto + glifo genérico; não usa os logotipos oficiais). */
function SeloLoja({ loja }: { loja: 'google' | 'apple' }) {
  const google = loja === 'google'
  return (
    <span className="inline-flex items-center gap-2.5 rounded-xl border border-white/25 bg-black px-4 py-2 text-white">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
        {google
          ? <path d="M6 3.2v17.6L20.5 12 6 3.2Z" fill="#d4a72c" />
          : <path d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM4 18h16v2.5H4V18Z" fill="#d4a72c" />}
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-slate-300">{google ? 'Disponível no' : 'Baixar na'}</span>
        <span className="block text-base font-semibold">{google ? 'Google Play' : 'App Store'}</span>
      </span>
    </span>
  )
}

/**
 * Adicional "App nas Lojas": o app com a marca da escola publicado na Google Play e na App Store.
 * Mockup 100% HTML/CSS (tela inicial do celular + ficha da loja): nenhuma imagem nova a baixar.
 */
export function AppNasLojas() {
  const itens = [
    'Nome e ícone da escola na Google Play e na App Store',
    'Logo e cores da instituição em todas as telas',
    'As famílias veem a marca da escola, não a do fornecedor',
    'Notificações push direto no celular dos pais',
    '"Baixe o app da escola na loja": mais credibilidade na matrícula e um diferencial diante das outras escolas',
  ]
  const outros = ['#94a3b8', '#7dd3fc', '#86efac', '#fca5a5', '#c4b5fd', '#fdba74', '#a5b4fc', '#5eead4', '#f9a8d4', '#cbd5e1', '#fde68a']
  return (
    <section id="app-nas-lojas" className="scroll-mt-20 bg-white [content-visibility:auto] [contain-intrinsic-size:auto_1500px]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="overflow-hidden rounded-3xl bg-[#1f2a44] bg-[radial-gradient(circle_at_15%_0%,rgba(212,167,44,0.22),transparent_50%)] text-white">
          <div className="grid items-center gap-12 px-6 py-12 [&>*]:min-w-0 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:px-14 lg:py-16">
            <div>
              <p className="inline-block rounded-full bg-[#d4a72c] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#1f2a44]">App próprio nas lojas</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                O aplicativo da <span className="text-[#d4a72c]">sua escola</span> na Google Play e na App Store
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-200">
                Com o nome, o ícone, a logo e as cores da sua instituição. A família procura a escola na loja oficial do celular, instala e encontra a marca da escola em cada tela.
              </p>
              <ul className="mt-6 space-y-3">
                {itens.map((t) => (
                  <li key={t} className="flex gap-2.5 text-slate-100"><Check /> <span>{t}</span></li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3" aria-label="Disponível na Google Play e na App Store">
                <SeloLoja loja="google" />
                <SeloLoja loja="apple" />
              </div>
              <div className="mt-8 rounded-2xl border border-[#d4a72c]/40 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#d4a72c]">Adicional opcional · App nas Lojas</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">R$ 2.749 <span className="text-base font-normal text-slate-300">de implantação</span> + R$ 99<span className="text-base font-normal text-slate-300">/mês</span></p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Todo plano já inclui o app da escola instalável pelo navegador, com a marca da escola. O app nas lojas é contratado à parte, para quem quer a escola na Google Play e na App Store.</p>
              </div>
            </div>

            {/* tela inicial do celular da família com o ícone da escola + ficha da loja (só HTML/CSS) */}
            <div className="relative mx-auto w-full max-w-[300px] sm:pb-10">
              <div className="relative mx-auto w-[230px] rounded-[2.4rem] border-[7px] border-[#0f1626] bg-[#0f1626] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]" role="img" aria-label="Tela inicial de um celular com o ícone do app Sua Escola e uma notificação da escola">
                <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0f1626]" aria-hidden />
                <div className="aspect-[9/19] overflow-hidden rounded-[1.9rem] bg-[linear-gradient(160deg,#334155,#1e293b_55%,#3b2f12)] px-3 pt-7" aria-hidden>
                  <p className="text-center text-[10px] font-semibold text-white/80">9:41</p>
                  <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/90 p-2 text-[#1f2a44] shadow">
                    <IconeEscola className="h-7 w-7 shrink-0" />
                    <div className="min-w-0 leading-tight">
                      <p className="text-[9px] font-bold uppercase tracking-wide">Sua Escola · agora</p>
                      <p className="text-[10px]">Nova tarefa de Matemática publicada</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3">
                    <div className="col-span-1 flex flex-col items-center gap-1">
                      <IconeEscola className="h-11 w-11 ring-2 ring-white/80 ring-offset-2 ring-offset-[#1e293b]" />
                      <span className="whitespace-nowrap text-[8px] font-semibold text-white">Sua Escola</span>
                    </div>
                    {outros.map((c) => (
                      <div key={c} className="flex flex-col items-center gap-1">
                        <span className="h-11 w-11 rounded-[22%] opacity-60" style={{ background: c }} />
                        <span className="h-1.5 w-8 rounded-full bg-white/25" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-5 flex w-full max-w-[280px] items-center gap-3 rounded-2xl bg-white p-3 text-[#1f2a44] shadow-xl sm:absolute sm:-bottom-2 sm:-left-10 sm:mt-0 sm:w-[260px]" aria-hidden>
                <IconeEscola className="h-12 w-12 shrink-0" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate font-bold">Sua Escola</p>
                  <p className="truncate text-xs text-slate-500">Educação</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#1f2a44] px-3 py-1.5 text-xs font-bold text-white">Instalar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
