import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/lib/i18n'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import BarraCompra from '@/components/salomao/lp/BarraCompra'
import { AppNasLojas, AppPais, Compra, Hero, Numeros, Perguntas, Portaria, Secretaria, Selos, TabelaPrecos } from '@/components/salomao/lp/Secoes'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

/**
 * Salomão — app da escola (SaaS escolar). Venda só no Brasil: a página existe só em pt-BR.
 * A compra é 100% automática: checkout ASAAS (cartão) → webhook → API do Salomão cria a escola.
 */

function pixelSalomao(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID_SALOMAO?.trim()
  return id && /^\d{10,20}$/.test(id) ? id : null
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

const NIVEIS = [
  ['Incluso', 'App da escola instalável', 'Os pais instalam pelo navegador e o ícone da escola fica na tela do celular, com notificações.'],
  ['Adicional', 'Domínio próprio', 'O app no endereço da escola (app.suaescola.com.br). É o mesmo app, só muda o endereço.'],
  ['R$ 2.749 + R$ 99/mês', 'App nas lojas (Apple e Google)', 'Com o nome da escola na App Store e no Google Play, publicado na conta da própria escola. Taxas das lojas à parte. Prazo: até 45 dias depois dos documentos.'],
]

export default async function SalomaoPage({ params, searchParams }: PageProps<'/[lang]/produtos/salomao'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const sp = await searchParams
  const cupom = typeof sp.cupom === 'string' ? sp.cupom.slice(0, 30) : ''
  const pixelId = pixelSalomao()
  const recaptcha = getRecaptchaSiteKey()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'

  return (
    <main id="main-content" role="main" className="overflow-x-clip bg-white text-slate-900">
      <SalomaoPixel pixelId={pixelId} valor={249} />

      <Hero
        selo={<p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d4a72c]">Salomão · app da escola</p>}
        titulo={<>A saída da escola sem fila, e a escola inteira <span className="text-[#d4a72c]">no celular dos pais</span></>}
        subtitulo="Portaria digital com chamada por voz na TV, app dos pais com a marca da escola, cantina com PIX automático, tarefas e notas. Instalação em 48 horas."
        acoes={<>
          <a href="#assinar" className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Assinar agora</a>
          <SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} />
        </>}
        rodape={<Selos itens={['A partir de R$ 249/mês', 'Sem taxa de implantação', 'Cancele quando quiser']} />}
      />
      <Portaria />
      <AppPais />
      <AppNasLojas />
      <Numeros />
      <Secretaria />

      <section className="bg-[#f7f6f2]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44]">A marca da escola em primeiro lugar</h2>
          <p className="mt-3 max-w-2xl text-slate-600">Domínio próprio e app nas lojas são coisas diferentes. Veja o que cada nível entrega:</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {NIVEIS.map(([preco, nome, texto]) => (
              <div key={nome} className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#b8891a]">{preco}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#1f2a44]">{nome}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Quer avisos e cobranças pelo WhatsApp oficial da escola? O <Link href="/produtos/voyia" className="font-semibold text-[#1f2a44] underline">Voyia</Link> se conecta ao Salomão como complemento.
          </p>
        </div>
      </section>

      <Compra titulo="Comece hoje" texto={<>
        <TabelaPrecos />
        <ul className="mt-5 space-y-1.5 text-sm">
          <li>Todos os módulos inclusos, sem taxa de implantação.</li>
          <li>Anual: paga 10 mensalidades e usa 12 meses.</li>
          <li>Rede com 2 ou 3 unidades: 10% de desconto no total.</li>
        </ul>
      </>}>
        <SalomaoCheckout dominioBase={dominioBase} cupomInicial={cupom} pixelId={pixelId} />
      </Compra>
      <Perguntas />
      <BarraCompra detalhe="Instalação em 48 h · a partir de R$ 249/mês" />
    </main>
  )
}
