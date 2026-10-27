import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/lib/i18n'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

/**
 * Salomão — app da escola (SaaS escolar). Venda só no Brasil: a página existe só em pt-BR.
 * A compra é 100% automática: checkout ASAAS (cartão) → webhook → API do Salomão cria a escola.
 */

const PIXEL_RE = /^\d{10,20}$/

function pixelSalomao(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID_SALOMAO?.trim()
  return id && PIXEL_RE.test(id) ? id : null
}

export async function generateMetadata({ params }: PageProps<'/[lang]/produtos/salomao'>): Promise<Metadata> {
  const { lang } = await params
  if (lang !== 'pt-BR') return {}
  const meta = buildPageMetadata({
    lang,
    path: '/produtos/salomao',
    title: 'Salomão — app da escola com portaria digital, cantina e app dos pais | Agathas Web',
    description:
      'App da escola com a marca da escola: portaria digital com chamada por voz na TV, app dos pais, cantina com PIX automático, tarefas e notas. Instalação em 48 horas, a partir de R$ 249/mês.',
  })
  return { ...meta, alternates: { canonical: meta.alternates?.canonical } }
}

const DIFERENCIAIS = [
  {
    titulo: 'Portaria digital',
    texto: 'O pai chega, pede a saída pelo celular e o nome do aluno é chamado em voz alta na TV da portaria. Sem fila, sem grito, sem papel.',
  },
  {
    titulo: 'App dos pais com a cara da escola',
    texto: 'Nome, logo e cores da escola no celular das famílias: boletim, frequência, tarefas, avisos com notificação e entrada com digital ou rosto.',
  },
  {
    titulo: 'Cantina sem dinheiro na mão',
    texto: 'Os pais colocam crédito por PIX ou cartão e ele entra sozinho. Encomenda do lanche, extrato e venda no balcão com saldo do aluno.',
  },
  {
    titulo: 'Tarefas e trabalhos',
    texto: 'O professor publica com anexos e vídeos do YouTube; a família acompanha em casa e marca como feita.',
  },
  {
    titulo: 'Secretaria organizada',
    texto: 'Cadastro de alunos com documentos da matrícula, importação por planilha de qualquer sistema, financeiro e equipe.',
  },
  {
    titulo: 'Instalação em 48 horas',
    texto: 'Pagou, o app da escola é criado na hora. A gente importa a lista de alunos e deixa tudo pronto em até 48 horas.',
  },
]

const NIVEIS = [
  {
    nome: 'App da escola instalável',
    preco: 'Incluso',
    texto: 'Os pais instalam pelo navegador e o ícone da escola fica na tela do celular, com notificações. Endereço escola.salomao.agathas.com.br.',
  },
  {
    nome: 'Domínio próprio',
    preco: 'Adicional',
    texto: 'O app no endereço da escola (app.suaescola.com.br). É o mesmo app, só muda o endereço.',
  },
  {
    nome: 'App nas lojas (Apple e Google)',
    preco: 'R$ 2.749 + R$ 99/mês',
    texto: 'O app com o nome da escola na App Store e no Google Play, publicado na conta da própria escola. Taxas das lojas à parte (Apple US$ 99/ano, Google US$ 25 uma vez). Prazo: até 45 dias depois dos documentos.',
  },
]

const FAQ = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O Salomão funciona no navegador do computador e do celular. Para a portaria basta uma TV com navegador ou um computador ligado a ela.',
  },
  {
    q: 'Como os pais recebem o acesso?',
    a: 'A escola importa a lista de alunos e os pais criam o próprio acesso com o CPF cadastrado. Depois é só instalar o app pelo navegador.',
  },
  {
    q: 'E se a escola tiver mais de 500 alunos ou várias unidades?',
    a: 'Redes com 2 ou 3 unidades têm 10% de desconto e um login para o dono trocar de unidade. Acima de 500 alunos por unidade ou de 3 unidades, fazemos um orçamento.',
  },
  {
    q: 'Posso cancelar?',
    a: 'Pode, quando quiser. No plano mensal a cobrança para no ciclo seguinte. Os dados da escola ficam guardados por 90 dias.',
  },
  {
    q: 'O que acontece se o pagamento atrasar?',
    a: 'Avisamos a gestão no próprio app. A partir do 10º dia o app fica só para consulta e no 30º é suspenso até a regularização.',
  },
]

export default async function SalomaoPage({ params, searchParams }: PageProps<'/[lang]/produtos/salomao'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const sp = await searchParams
  const cupom = typeof sp.cupom === 'string' ? sp.cupom.slice(0, 30) : ''
  const pixelId = pixelSalomao()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'

  return (
    <main id="main-content" role="main" className="bg-[#f7f6f2] text-slate-900">
      <SalomaoPixel pixelId={pixelId} valor={249} />

      {/* Hero */}
      <section className="bg-[#1f2a44] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d4a72c]">Salomão · app da escola</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              A saída da escola sem fila, e a escola inteira no celular dos pais
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              Portaria digital com chamada por voz na TV, app dos pais com a marca da escola, cantina com PIX automático,
              tarefas e notas. Pronto em 48 horas.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#assinar" className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Assinar agora</a>
              <SolicitarDemo recaptchaSiteKey={getRecaptchaSiteKey()} pixelId={pixelId} />
              <span className="text-sm text-slate-300">a partir de <strong className="text-white">R$ 249/mês</strong> · menos de R$ 1 por aluno</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Na TV da portaria</p>
            <div className="mt-4 space-y-3">
              {[['Maria Eduarda Santos', '5º ano A', 'Mãe'], ['Pedro Henrique Alves', '2º ano B', 'Pai'], ['Lívia Moura', 'Infantil 5', 'Avó']].map(([n, t, p], i) => (
                <div key={n} className={`flex items-center justify-between rounded-xl px-4 py-3 ${i === 0 ? 'bg-[#d4a72c] text-[#1f2a44]' : 'bg-white/10'}`}>
                  <div>
                    <p className="font-semibold">{n}</p>
                    <p className={`text-xs ${i === 0 ? 'text-[#1f2a44]/80' : 'text-slate-300'}`}>{t} · {p} chegou</p>
                  </div>
                  {i === 0 && <span className="text-xs font-bold uppercase">Chamando</span>}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-300">&ldquo;Atenção, portaria. Maria Eduarda Santos. Quinto ano A.&rdquo; — 6 vozes para escolher.</p>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Tudo o que a escola usa no dia a dia</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DIFERENCIAIS.map((d) => (
            <div key={d.titulo} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-[#1f2a44]">{d.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{d.texto}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-600">
          Quer avisos e cobranças pelo WhatsApp oficial da escola? O <Link href="/produtos/voyia" className="font-semibold text-[#1f2a44] underline">Voyia</Link> se conecta ao Salomão como complemento.
        </p>
      </section>

      {/* Planos + compra */}
      <section id="assinar" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Planos</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-2">Alunos</th><th className="py-2">Mensal</th><th className="py-2">Anual</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  <tr><td className="py-3 font-medium">Até 250</td><td className="py-3">R$ 249</td><td className="py-3">R$ 2.490</td></tr>
                  <tr><td className="py-3 font-medium">Até 500</td><td className="py-3">R$ 499</td><td className="py-3">R$ 4.990</td></tr>
                  <tr><td className="py-3 font-medium">Mais de 500</td><td className="py-3" colSpan={2}>Orçamento</td></tr>
                </tbody>
              </table>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li>Todos os módulos inclusos, sem taxa de implantação.</li>
              <li>Anual: paga 10 mensalidades e usa 12 meses.</li>
              <li>Rede com 2 ou 3 unidades: 10% de desconto no total.</li>
              <li>Pagamento só no cartão (mensal) ou anual antecipado.</li>
            </ul>
          </div>
          <SalomaoCheckout dominioBase={dominioBase} cupomInicial={cupom} pixelId={pixelId} />
        </div>
      </section>

      {/* White label */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">A marca da escola em primeiro lugar</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Domínio próprio e app nas lojas são coisas diferentes. Veja o que cada nível entrega:</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {NIVEIS.map((n) => (
            <div key={n.nome} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#b8891a]">{n.preco}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1f2a44]">{n.nome}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{n.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">Perguntas frequentes</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold text-[#1f2a44]">{f.q}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
