import type { ReactNode } from 'react'
import { Celular, Tela } from './Molduras'
import s from './lp.module.css'
import appAvisos from './img/app-avisos.webp'
import appDiario from './img/app-diario.webp'
import appLanches from './img/app-lanches.webp'
import appTarefas from './img/app-tarefas.webp'
import appBoletim from './img/app-boletim.webp'
import escolaLeitura from './img/escola-leitura.webp'
import escolaCantina from './img/escola-cantina.webp'
import escolaFinanceiro from './img/escola-financeiro.webp'
import tvPortaria from './img/tv-portaria.webp'
import { AVALIACOES_GOOGLE } from '@/lib/avaliacoes-google'

/**
 * Página de vendas do Salomão refeita em 13/11/2026 (foco em conversão), depois do benchmarking das
 * landing pages dos concorrentes (salomao/docs/benchmarking-2026-11/landing-pages/).
 *
 * Regras que valem para qualquer texto daqui:
 * - Só recurso que está publicado. Sem boleto, matrícula online, nota fiscal ou autorização digital.
 * - Nunca "o mais barato"; preço fixo e "a partir de". O app nas lojas é adicional.
 * - Depoimento só o que o cliente escreveu ou autorizou (ver DEPOIMENTOS em Secoes.tsx).
 */

function Check({ className = 'text-[#d4a72c]' }: { className?: string }) {
  return (
    <svg className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  )
}

function Estrelas() {
  return (
    <span className="inline-flex gap-0.5 text-[#d4a72c]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" /></svg>
      ))}
    </span>
  )
}

/**
 * Primeira tela por ângulo (`?a=`): cada anúncio cai numa tela que repete a promessa dele, na mesma URL.
 * Rolagem média medida em 04/11 = 5 a 8% da página: o que não está aqui, quase ninguém lê.
 */
export const ANGULOS = {
  // Sem `?a=` é para cá que vão os vídeos da Meta, que abrem com "Diretora de escola, …" (18/11/2026):
  // a primeira tela repete a fala do vídeo e já diz o que acontece ao clicar (21/11/2026).
  padrao: {
    selo: 'Para diretoras, diretores e donos de escolas particulares',
    titulo: <>Diretora, a sua escola com <span className="text-[#d4a72c]">app próprio</span>: aviso com leitura, saída sem fila e tudo num lugar só</>,
    sub: 'Teste agora numa escola de exemplo: você entra como diretora em 30 segundos, sem cartão e sem falar com vendedor.',
    video: 'tudo-num-app',
    alt: 'Animação com os módulos do Salomão: portaria, cantina, avisos, notas, financeiro e app com a marca da escola',
  },
  gestao: {
    selo: 'Sistema de gestão escolar para escolas particulares',
    titulo: <>Sistema de gestão escolar que cabe <span className="text-[#d4a72c]">no bolso da escola</span> e no celular da família</>,
    sub: 'Financeiro, notas, frequência, avisos, cantina e portaria num sistema só, no ar em 48 horas.',
    video: 'V3-painel-diretor',
    alt: 'Painel do diretor do Salomão com financeiro, alunos e relatórios',
  },
  avisos: {
    selo: 'Agenda digital para escolas particulares, com a marca da escola',
    titulo: <>Chega de grupo de WhatsApp: mande o aviso e <span className="text-[#d4a72c]">veja quem leu</span></>,
    sub: 'Para a escola toda, para uma turma ou só para a equipe. Quem não abriu recebe o lembrete com um toque.',
    video: 'adeus-grupo',
    alt: 'Animação: o aviso sai do grupo de mensagens e vai para o app da escola, com a lista de quem leu',
  },
  portaria: {
    selo: 'Portaria digital para escolas particulares',
    titulo: <>A saída da escola sem fila, sem gritaria e <span className="text-[#d4a72c]">com registro de quem buscou</span></>,
    sub: 'O responsável pede pelo celular, a TV chama o nome e a portaria libera com um toque.',
    video: 'V1-saida',
    alt: 'Demonstração: o responsável pede a saída pelo celular, o nome é chamado na TV e a portaria libera com um toque',
  },
  cantina: {
    selo: 'Sistema de cantina para escolas particulares',
    titulo: <>Cantina escolar sem dinheiro e sem fiado: <span className="text-[#d4a72c]">o crédito entra por PIX</span></>,
    sub: 'O responsável recarrega pelo app, a cantina vende no balcão em segundos e a família vê o extrato.',
    video: 'cantina',
    alt: 'Demonstração da cantina: venda no balcão com o crédito do aluno',
  },
  infantil: {
    selo: 'Agenda digital para creches e escolas infantis particulares',
    titulo: <>O dia da criança no celular da família, <span className="text-[#d4a72c]">sem agenda de papel</span></>,
    sub: 'Refeições, sono, humor e recados lançados pela professora em minutos, para a turma toda de uma vez.',
    video: 'diario',
    alt: 'Demonstração do diário da criança: a professora lança a turma toda e a família recebe no celular',
  },
  whatsapp: {
    selo: 'WhatsApp oficial para escolas particulares',
    titulo: <>O WhatsApp oficial da escola, <span className="text-[#d4a72c]">com vários atendentes</span> e ligado ao app</>,
    sub: 'API oficial da Meta: aviso em massa sem medo de bloqueio, a equipe toda atendendo no mesmo número e o WhatsApp continua no celular.',
    video: 'adeus-grupo',
    alt: 'Animação: o aviso sai do grupo de mensagens e vai para o canal oficial da escola',
  },
  financeiro: {
    selo: 'Controle de mensalidades para escolas particulares',
    titulo: <>Veja quem está em atraso e deixe <span className="text-[#d4a72c]">o app lembrar a família</span></>,
    sub: 'Mensalidades, despesas e atrasados numa tela. O lembrete é automático, no ritmo que a escola escolhe, nunca todo dia.',
    video: 'inadimplencia',
    alt: 'Demonstração do financeiro: quem deve, quanto e há quantos dias',
  },
} as const

export type Angulo = keyof typeof ANGULOS

export function anguloDe(valor: unknown): Angulo {
  return typeof valor === 'string' && valor in ANGULOS ? (valor as Angulo) : 'padrao'
}

/** Último dia da oferta de lançamento (cupom SALOMAO30, `valido_ate` no banco do site). */
const FIM_OFERTA = '2026-12-31'

/** Dias que faltam para o fim da oferta, no fuso de Brasília; null quando já acabou. */
export function diasDeOferta(agora = new Date()): number | null {
  const hoje = agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  if (hoje > FIM_OFERTA) return null
  return Math.round((Date.parse(`${FIM_OFERTA}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000)
}

export function HeroVenda({ angulo, acao, acao2, oferta }: { angulo: Angulo; acao: ReactNode; acao2?: ReactNode; oferta: boolean }) {
  const a = ANGULOS[angulo]
  return (
    <section className="relative overflow-hidden bg-[#1f2a44] bg-[radial-gradient(circle_at_85%_10%,rgba(212,167,44,0.18),transparent_45%)] text-white">
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-10 pt-6 [&>*]:min-w-0 sm:px-6 sm:pt-12 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-8 lg:pb-16">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-[#d4a72c] sm:text-sm ${s.entra}`}>{a.selo}</p>
          <h1 className={`mt-3 text-[1.7rem] font-bold leading-[1.15] tracking-tight sm:text-[2.6rem] lg:text-5xl ${s.entra2}`}>{a.titulo}</h1>
          <p className={`mt-3 max-w-xl text-base leading-7 text-slate-200 sm:mt-5 sm:text-lg sm:leading-8 ${s.entra3}`}>{a.sub}</p>
          <p className={`mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 ${s.entra3}`}>
            <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">R$ 249<span className="text-base font-semibold text-slate-300">/mês</span></span>
            <span className="text-sm text-slate-300">preço fixo até 250 alunos, sem taxa de implantação</span>
          </p>
          {oferta && (
            <p className={`mt-2 inline-flex items-center gap-2 rounded-full bg-[#d4a72c]/15 px-3 py-1 text-sm font-semibold text-[#f0cf73] ${s.entra3}`}>
              <span className={`h-2 w-2 rounded-full bg-[#d4a72c] ${s.pulso}`} aria-hidden /> Até 31/12: 30% de desconto nos 3 primeiros meses
            </p>
          )}
          <div className={`mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center ${s.entra3}`}>{acao}{acao2}</div>
          <p className={`mt-3 text-sm text-slate-300 ${s.entra3}`}>Sem cartão e sem reunião de vendas: o acesso abre na hora e você entra como diretor numa escola de exemplo.</p>
        </div>
        <div>
          {/* Escola de demonstração, com nomes fictícios. Mudo para poder tocar sozinho no celular. */}
          <video key={a.video} src={`/salomao/${a.video}.mp4`} poster={`/salomao/${a.video}.webp`} autoPlay muted loop playsInline preload="metadata" width={720} height={900}
            aria-label={a.alt}
            className="mx-auto aspect-[4/5] w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0f1626] object-cover shadow-2xl" />
        </div>
      </div>
    </section>
  )
}

/** Faixa de confiança logo abaixo da primeira tela: é o que quase todo visitante ainda vê. */
export function FaixaConfianca() {
  const itens = [
    ['48 h', 'para a escola estar no ar'],
    ['R$ 0', 'de implantação e de migração'],
    ['30 dias', 'de garantia, com o valor de volta'],
    ['7 dias', 'de teste grátis com a marca da escola'],
  ]
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <figure className="rounded-2xl bg-[#f7f6f2] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1f2a44]">
              <Estrelas /> {AVALIACOES_GOOGLE.nota.replace('.', ',')} no Google · {AVALIACOES_GOOGLE.total} avaliações da Agathas Web
            </div>
            <blockquote className="mt-3 text-lg font-semibold leading-snug text-[#1f2a44]">“Precisávamos de uma comunicação mais efetiva e prática com os pais, e o app Salomão resolveu!”</blockquote>
            <figcaption className="mt-2 text-sm text-slate-600"><strong className="text-[#1f2a44]">Pr. David</strong>, fundador do Lar Benedi</figcaption>
          </figure>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            {itens.map(([n, t]) => (
              <div key={n}>
                <dt className="text-2xl font-bold tabular-nums text-[#1f2a44]">{n}</dt>
                <dd className="mt-0.5 text-sm leading-5 text-slate-600">{t}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/** Oferta de lançamento. Some sozinha depois de 31/12/2026. */
export function FaixaOferta({ dias, acao }: { dias: number | null; acao?: ReactNode }) {
  if (dias === null) return null
  const prazo = dias === 0 ? 'Termina hoje' : dias === 1 ? 'Falta 1 dia' : `Faltam ${dias} dias`
  return (
    <section className="bg-[#fff8e6]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b8891a]">Oferta de lançamento · {prazo}</p>
          <p className="mt-1 text-xl font-bold leading-snug text-[#1f2a44] sm:text-2xl">
            30% de desconto nos 3 primeiros meses: de <s className="font-semibold text-slate-400">R$ 249</s> por <span className="tabular-nums">R$ 174,30</span>/mês
          </p>
          <p className="mt-1 text-sm text-slate-700">Para escolas que assinam o plano mensal até 31/12/2026 com o cupom <strong className="text-[#1f2a44]">SALOMAO30</strong>. Limitado a 50 escolas.</p>
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
    </section>
  )
}

/** O problema, do jeito que o diretor reconhece: como é hoje × como fica. */
export function AntesDepois({ acao }: { acao?: ReactNode }) {
  const linhas = [
    ['Avisos', 'Grupo de WhatsApp: o recado some entre figurinhas e ninguém sabe quem leu', 'Notificação no app da escola e a lista de quem abriu e de quem falta'],
    ['WhatsApp', 'Um celular na secretaria, uma pessoa atendendo e medo de bloqueio ao avisar todo mundo', 'Número oficial com vários atendentes e envio em massa (opcional)'],
    ['Saída', 'Fila de carros, gritaria no portão e nenhum registro', 'A TV chama o nome e fica gravado quem buscou e quando'],
    ['Cantina', 'Dinheiro na mochila, troco e fiado no caderno', 'Crédito por PIX que entra sozinho e extrato para a família'],
    ['Educação infantil', 'Agenda de papel preenchida criança por criança', 'Diário no celular: a turma toda lançada em um minuto'],
    ['Mensalidades', 'Planilha e ligação constrangedora para cobrar', 'Painel de atrasados e lembrete automático no celular da família'],
    ['Sistemas', 'Um fornecedor para cada coisa, cada um com a marca dele', 'Um app só, com o nome e a logo da escola, por preço fixo'],
  ]
  return (
    <section className="bg-white [content-visibility:auto] [contain-intrinsic-size:auto_900px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Reconhece a sua escola?</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">O que muda na rotina quando a escola tem o próprio app</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[150px_1fr_1fr] bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span className="px-5 py-3" /><span className="px-5 py-3">Hoje</span><span className="bg-[#1f2a44] px-5 py-3 text-[#d4a72c]">Com o Salomão</span>
          </div>
          {linhas.map(([tema, antes, depois]) => (
            <div key={tema} className="grid border-t border-slate-200 first:border-t-0 md:grid-cols-[150px_1fr_1fr] md:first:border-t">
              <p className="bg-slate-50 px-5 py-2.5 text-sm font-bold text-[#1f2a44] md:bg-white md:py-4">{tema}</p>
              <p className="flex gap-2 px-5 py-3 text-sm leading-6 text-slate-600 md:py-4">
                <span className="mt-0.5 font-bold text-red-500" aria-hidden>×</span><span><span className="sr-only">Hoje: </span>{antes}</span>
              </p>
              <p className="flex gap-2 bg-[#f3f7f1] px-5 py-3 text-sm font-medium leading-6 text-[#1f2a44] md:py-4">
                <Check className="text-green-600" /><span><span className="sr-only">Com o Salomão: </span>{depois}</span>
              </p>
            </div>
          ))}
        </div>
        {acao && <div className="mt-8 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

/** Tudo que vem no plano, num relance. Sem contagem de módulos no texto: a lista cresce todo mês. */
export function TudoNumApp() {
  const itens = [
    ['Avisos com leitura', 'Para todos, para uma turma ou só para a equipe. Você vê quem abriu.'],
    ['Portaria digital', 'O responsável pede pelo celular e a TV chama o aluno pelo nome.'],
    ['Cantina com crédito', 'Recarga por PIX, venda no balcão e extrato para a família.'],
    ['Diário da criança', 'Refeições, sono, humor e recados da educação infantil.'],
    ['Tarefas de casa', 'O professor publica com vídeo e anexos; a família acompanha.'],
    ['Notas e frequência', 'Chamada e notas pelo celular do professor; boletim no app.'],
    ['Financeiro', 'Mensalidades, despesas, atrasados e lembrete automático.'],
    ['App com a sua marca', 'Nome, logo e cores da escola, instalado no celular da família.'],
  ]
  return (
    <section className="bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_800px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Tudo num app só</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Tudo incluso no mesmo plano, sem módulo cobrado à parte</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {itens.map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className="flex items-start gap-1.5 text-sm font-semibold text-[#1f2a44] sm:gap-2 sm:text-base"><Check /> {t}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Topicos({ itens }: { itens: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {itens.map((t) => <li key={t} className="flex gap-2.5 text-slate-700"><Check /> <span>{t}</span></li>)}
    </ul>
  )
}

/** Recurso novo (12/11/2026): leitura automática dos avisos, sem botão de confirmar. */
export function Avisos() {
  return (
    <section id="avisos" className="scroll-mt-20 bg-white [content-visibility:auto] [contain-intrinsic-size:auto_1000px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 [&>*]:min-w-0 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Agenda digital · avisos</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Mande o aviso uma vez e saiba quem leu</h2>
            <p className="mt-3 text-slate-600">O aviso chega como notificação no celular, fora do grupo de mensagens. Abriu no app, está lido: ninguém precisa clicar em “confirmar”.</p>
            <Topicos itens={[
              'Para a escola toda, para uma turma ou só para professores e gestão',
              'Lista de quem leu e de quem ainda falta, com data e hora',
              'Um toque reenvia o aviso só para quem não abriu',
              'Mural da equipe separado dos recados das famílias',
            ]} />
          </div>
          <div className={`relative ${s.revela}`}>
            <Tela src={escolaLeitura} alt="Tela do aviso no painel da escola: 92% leram, com a lista de quem leu e de quem ainda não leu" endereco="escola.salomao.agathas.com.br/admin/avisos" />
            <div className="absolute -bottom-8 -left-3 hidden w-[150px] sm:block lg:-left-10">
              <Celular src={appAvisos} alt="Avisos da escola no app da família" className="!w-[150px] sm:!w-[150px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * WhatsApp oficial (13/11/2026): opcional, pelo motor do Voyia, ativado pelo suporte. O valor NÃO é
 * divulgado na página (decisão do Gutto): só "opcional, contratado à parte".
 */
export function WhatsAppOficial({ acao }: { acao?: ReactNode }) {
  const itens = [
    ['Aviso também pelo WhatsApp', 'Publicou o aviso no app, marcou a opção e ele chega no WhatsApp das famílias, do número da escola, com o link do aviso.'],
    ['Vários atendentes no mesmo número', 'Secretaria, financeiro e coordenação respondem juntos, cada um com o próprio acesso, sem passar o celular de mão em mão.'],
    ['Envio em massa pela API oficial', 'Mensagem para muitas famílias de uma vez pelo canal oficial da Meta, sem o risco de bloqueio dos disparos por aplicativos não oficiais.'],
    ['O WhatsApp continua no celular', 'O número da escola segue funcionando no aplicativo de sempre, ao mesmo tempo. Ninguém perde as conversas.'],
  ]
  return (
    <section id="whatsapp" className="scroll-mt-20 bg-[#0b3d1f] bg-[radial-gradient(circle_at_90%_0%,rgba(37,211,102,0.25),transparent_50%)] text-white [content-visibility:auto] [contain-intrinsic-size:auto_800px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="inline-block rounded-full bg-[#25d366] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0b3d1f]">Opcional · WhatsApp oficial</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">O WhatsApp oficial da escola, dentro do app da escola</h2>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-green-50/90">Para a família que ainda não instalou o app, o aviso chega onde ela já está. Tudo pela API oficial da Meta, com o número da própria escola.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {itens.map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="flex items-start gap-2 font-semibold"><Check className="text-[#25d366]" /> {t}</h3>
              <p className="mt-2 text-sm leading-6 text-green-50/80">{d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-green-50/80">Serviço opcional, contratado à parte do plano. A ativação do número é feita pelo nosso suporte, junto com a escola.</p>
        {acao && <div className="mt-6 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

export function PortariaVenda() {
  const passos = [
    ['Chegou, tocou', 'O responsável abre o app da escola e toca em “Buscar na saída”.'],
    ['A TV chama', 'O nome e a turma aparecem na TV e são falados em voz alta. Irmãos saem juntos.'],
    ['Liberado com registro', 'Um toque libera. A escola sabe quem buscou, quando e quanto tempo esperou.'],
  ]
  return (
    <section id="portaria" className="scroll-mt-20 bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_1100px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Portaria digital</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">O fim da fila e da gritaria na saída</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Só precisa de uma TV com navegador na portaria. Nenhum equipamento a mais.</p>
        <div className="mt-8 grid items-start gap-8 [&>*]:min-w-0 lg:grid-cols-[1.25fr_0.6fr_1fr]">
          <div className={s.revela}>
            <Tela src={tvPortaria} alt="Painel da portaria na TV com o aluno em chamada e a fila" endereco="escola.salomao.agathas.com.br/portaria" />
          </div>
          <figure>
            {/* Gravação real na portaria do Colégio Provérbios (30/10/2026), publicada com autorização. */}
            <video src="/salomao/portaria-real-proverbios.mp4" poster="/salomao/portaria-real-proverbios.webp" controls playsInline preload="none" width={576} height={1024}
              className="mx-auto aspect-[9/16] w-full max-w-[240px] rounded-2xl border border-slate-200 bg-[#0f1626] object-cover shadow-lg" />
            <figcaption className="mt-2 text-center text-xs text-slate-600"><span className="mr-1 inline-block rounded-full bg-[#d4a72c] px-2 py-0.5 font-bold text-[#1f2a44]">Gravação real</span> Colégio Provérbios</figcaption>
          </figure>
          <ol className="space-y-5">
            {passos.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f2a44] font-bold text-[#d4a72c]">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export function CantinaFinanceiro() {
  const blocos = [
    {
      id: 'cantina', rotulo: 'Cantina', titulo: 'Cantina sem dinheiro, sem troco e sem fiado', img: escolaCantina, alt: 'Tela de venda da cantina no balcão',
      end: 'escola.salomao.agathas.com.br/cantina',
      itens: ['O responsável recarrega por PIX e o crédito entra sozinho', 'No balcão: busca o aluno, toca nos itens e pronto', 'O saldo nunca fica negativo', 'A família vê o extrato e encomenda o lanche pelo app'],
    },
    {
      id: 'financeiro', rotulo: 'Financeiro', titulo: 'Quem deve, quanto e há quantos dias, numa tela', img: escolaFinanceiro, alt: 'Painel financeiro da escola com mensalidades, despesas e atrasados',
      end: 'escola.salomao.agathas.com.br/admin/financeiro',
      itens: ['Mensalidades, despesas, atrasados e a sobra prevista do mês', 'A família vê as mensalidades no app', 'Lembrete automático de vencimento por notificação', 'A escola escolhe o ritmo do lembrete: leve, padrão ou firme, nunca todo dia'],
    },
  ] as const
  return (
    <section className="bg-white [content-visibility:auto] [contain-intrinsic-size:auto_1300px]">
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-14 sm:px-6 lg:space-y-20 lg:px-8 lg:py-20">
        {blocos.map((b, i) => (
          <div key={b.id} id={b.id} className={`grid scroll-mt-20 items-center gap-8 [&>*]:min-w-0 lg:grid-cols-[1.35fr_1fr] ${i % 2 ? 'lg:grid-cols-[1fr_1.35fr] lg:[&>*:first-child]:order-2' : ''}`}>
            <div className={s.revela}><Tela src={b.img} alt={b.alt} endereco={b.end} /></div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">{b.rotulo}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">{b.titulo}</h2>
              <Topicos itens={[...b.itens]} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** App da família: diário da criança (12/11/2026) + as telas de sempre, num trilho só. */
export function AppFamilia() {
  const telas = [
    [appDiario, 'Diário da criança', 'Refeições, sono, humor e recados da educação infantil.'],
    [appAvisos, 'Avisos da escola', 'Chegam por notificação, fora do grupo de mensagens.'],
    [appTarefas, 'Tarefas de casa', 'O professor publica com vídeo e anexos.'],
    [appLanches, 'Cantina com crédito', 'Recarga por PIX, encomenda do lanche e extrato.'],
    [appBoletim, 'Boletim sempre em dia', 'Notas por bimestre e média, sem papel.'],
  ] as const
  return (
    <section id="app-da-familia" className="scroll-mt-20 bg-[#f7f6f2] [content-visibility:auto] [contain-intrinsic-size:auto_1100px]">
      <div className="mx-auto max-w-6xl px-5 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">App da família</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">A escola no celular dos pais, com a marca da escola</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Nome, logo e cores da sua escola. Instala direto do navegador, avisa por notificação e entra com digital ou rosto. Na educação infantil, a professora lança o dia da turma toda em um minuto.</p>
      </div>
      <div className={`${s.trilho} mt-8 flex gap-6 overflow-x-auto px-5 pb-14 sm:px-6 lg:mx-auto lg:max-w-6xl lg:justify-between lg:overflow-visible lg:px-8 lg:pb-20`}>
        {telas.map(([img, t, d]) => (
          <figure key={t} className="w-[210px] shrink-0 lg:w-[200px]">
            <Celular src={img} alt={`App da família: ${t}`} className="!w-[210px] lg:!w-[200px]" />
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

/** Como começar: tira o medo da troca (implantação e migração são a objeção nº 1 de quem já usa sistema). */
export function ComoComeca({ acao }: { acao?: ReactNode }) {
  const passos = [
    ['Hoje', 'Teste grátis', 'Entre na demonstração como diretor e veja tudo funcionando. Gostou? Liberamos o Salomão com a logo e as cores da sua escola por 7 dias, sem custo. Pode assinar pela página, sem reunião.'],
    ['Em até 48 horas', 'A escola no ar', 'Você manda a lista de alunos do jeito que tiver (exportação do sistema atual, planilha ou PDF) e nós fazemos a migração, sem custo.'],
    ['Na mesma semana', 'As famílias instalam', 'Cada responsável cria o próprio acesso com o CPF cadastrado. A gente acompanha a equipe pelo WhatsApp.'],
  ]
  return (
    <section id="como-comeca" className="scroll-mt-20 bg-[#1f2a44] text-white [content-visibility:auto] [contain-intrinsic-size:auto_600px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d4a72c]">Como começar</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Do teste ao app no celular das famílias em uma semana</h2>
        <p className="mt-3 max-w-2xl text-slate-300">Já usa outro sistema? A migração é por nossa conta. Ninguém da escola recadastra aluno por aluno.</p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          {passos.map(([quando, t, d], i) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a72c] font-bold text-[#1f2a44]">{i + 1}</span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#d4a72c]">{quando}</p>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{d}</p>
            </li>
          ))}
        </ol>
        {acao && <div className="mt-8 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

/** Extras que não entram no plano: tudo junto e curto, depois do preço, para não competir com a venda. */
export function Extras({ acao }: { acao?: ReactNode }) {
  const itens = [
    ['WhatsApp oficial da escola', 'Opcional', 'O número da escola na API oficial da Meta: aviso também pelo WhatsApp, vários atendentes, envio em massa e o WhatsApp continua no celular. Ativado pelo nosso suporte.'],
    ['App nas lojas', 'R$ 2.749 + R$ 99/mês', 'O app com o nome da escola na App Store e na Google Play, na conta da própria escola. A aprovação das lojas leva de 45 a 90 dias: quem quer começar o ano letivo com ele precisa pedir agora.'],
    ['Domínio próprio', 'Adicional', 'O app no endereço da escola (app.suaescola.com.br). É o mesmo app, só muda o endereço.'],
    ['Catraca, facial, carteirinha e módulos novos', 'Sob projeto', 'Integração com catraca, reconhecimento facial, biometria e carteirinha, combinada com o nosso suporte. Módulo que serve a todas as escolas nós desenvolvemos sem custo; o que é só da sua escola recebe valor e prazo antes de começar.'],
  ]
  return (
    <section id="app-nas-lojas" className="scroll-mt-20 bg-white [content-visibility:auto] [contain-intrinsic-size:auto_700px]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b8891a]">Opcionais</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Quando a escola quiser ir além</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Nada disso é obrigatório: todo plano já inclui o app instalável pelo navegador, com a marca da escola.</p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {itens.map(([t, preco, d]) => (
            <li key={t} className="rounded-2xl border border-slate-200 bg-[#f7f6f2] p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[#b8891a]">{preco}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1f2a44]">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            </li>
          ))}
        </ul>
        {acao && <div className="mt-8 flex flex-wrap items-center gap-3">{acao}</div>}
      </div>
    </section>
  )
}

/** Fecho: uma última chamada, com a garantia ao lado. */
export function CtaFinal({ acao, oferta }: { acao: ReactNode; oferta: boolean }) {
  return (
    <section className="bg-[#1f2a44] bg-[radial-gradient(circle_at_50%_0%,rgba(212,167,44,0.2),transparent_55%)] text-white">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Veja o Salomão funcionando agora, antes de falar com qualquer pessoa</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-200">Entre como diretor numa escola de exemplo, mande um aviso, chame um aluno na portaria e venda um lanche na cantina. Leva dois minutos.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">{acao}</div>
        <p className="mt-4 text-sm text-slate-300">30 dias de garantia · sem fidelidade · sem taxa de implantação{oferta ? ' · 30% de desconto até 31/12' : ''}</p>
      </div>
    </section>
  )
}

/** FAQ da página de vendas: objeções primeiro (preço, troca de sistema, cancelamento), detalhes depois. */
export const FAQ_VENDA = [
  ['Quanto custa? Tem taxa de implantação?', 'R$ 249 por mês para escolas com até 250 alunos e R$ 499 por mês até 500 alunos, com tudo incluso. Não há taxa de implantação nem de migração. No plano anual você paga 10 mensalidades e usa 12 meses.'],
  ['E se a escola já usa outro sistema?', 'A migração é por nossa conta e sem custo: a escola manda o que usa hoje (exportação do sistema atual, planilhas ou PDFs), nós passamos alunos, turmas e responsáveis para o Salomão e acompanhamos a equipe na virada. Dá para começar pela portaria e pelos avisos e ir ligando o resto.'],
  ['Posso testar antes de assinar?', 'Pode, agora mesmo e sem falar com ninguém: o botão “Testar grátis” abre na hora uma escola de exemplo, e você entra como diretor e como família. Não pede cartão. Depois, se quiser ver com a cara da sua escola, liberamos o Salomão com a logo e as cores da escola por 7 dias, sem custo: é só pedir pelo WhatsApp.'],
  ['E se não servir para a minha escola?', 'Você tem 30 dias de garantia: se o Salomão não servir, devolvemos o valor pago, sem burocracia. Basta pedir pelo WhatsApp ou por e-mail.'],
  ['Posso cancelar quando quiser?', 'Pode, sem multa e sem fidelidade. No mensal a cobrança para no ciclo seguinte.'],
  ['O Salomão envia aviso pelo WhatsApp?', 'Envia, com o WhatsApp oficial da escola, que é um opcional contratado à parte: o aviso publicado no app também chega no WhatsApp das famílias, do número da escola, pela API oficial da Meta. O mesmo número passa a ter vários atendentes e envio em massa, e continua funcionando no celular.'],
  ['O Salomão substitui o grupo de WhatsApp da turma?', 'Substitui para os recados da escola: o aviso chega por notificação só para quem deve receber, sem conversa paralela, e a escola vê quem abriu. O que o grupo não mostra, o app mostra.'],
  ['O Salomão funciona como agenda digital?', 'Sim. A escola manda avisos por notificação para todas as famílias, para uma turma ou só para a equipe, e vê a lista de quem abriu e de quem falta.'],
  ['Os pais precisam confirmar que leram o aviso?', 'Não. Abriu o aviso no app, está lido. A escola vê quem ainda não abriu e reenvia só para essas famílias com um toque.'],
  ['Tem diário para a educação infantil?', 'Sim. A professora lança refeições, sono, humor, higiene, recados e o que trazer, por criança ou para a turma toda de uma vez, e a família recebe no celular.'],
  ['O lembrete de mensalidade incomoda as famílias?', 'A escola escolhe o ritmo (leve, padrão ou firme) e nenhum deles manda lembrete todo dia: há sempre pelo menos 5 dias entre um lembrete e o seguinte, e quem já pagou não recebe nada.'],
  ['Preciso instalar ou comprar algum equipamento?', 'Não. Funciona no navegador do computador e do celular. Na portaria basta uma TV com navegador (ou um computador ligado nela).'],
  ['Como os pais recebem o acesso?', 'A escola importa a lista de alunos e cada responsável cria o próprio acesso com o CPF cadastrado. Depois é só instalar o app pelo navegador.'],
  ['A escola pode ter o próprio app na Google Play e na App Store?', 'Pode. Com o adicional App nas Lojas, o app é publicado com o nome, o ícone e as cores da escola, na conta da própria escola. Custa R$ 2.749 de implantação + R$ 99/mês e leva de 45 a 90 dias, por causa da revisão das lojas. Sem o adicional, todo plano já inclui o app instalável pelo navegador com a marca da escola.'],
  ['Funciona com catraca, reconhecimento facial ou carteirinha?', 'Fazemos a integração sob projeto: como cada escola tem um tipo de equipamento e de carteirinha, a escola combina com o nosso suporte e recebe valor e prazo antes de começar.'],
  ['Os dados ficam seguros?', 'Cada escola só enxerga os próprios dados, o acesso é por login individual e os documentos ficam fora da área pública. Tratamos dados de alunos conforme a LGPD.'],
  ['Como é o pagamento?', 'Cartão de crédito, boleto ou PIX: você escolhe na tela de pagamento segura da ASAAS. Mensal ou anual.'],
  ['Quem está por trás do Salomão?', 'A Agathas Web, empresa de tecnologia de Senador Canedo (GO) que desenvolve sites, sistemas e plataformas de ensino desde 2009. O suporte é feito pela nossa equipe, por WhatsApp.'],
] as const
