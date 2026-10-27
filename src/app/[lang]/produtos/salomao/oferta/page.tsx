import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import { vagasRestantes } from '@/lib/db/cupons'

/**
 * Landing B — oferta de lançamento (oferta.salomao.agathas.com.br). Escassez e urgência só verdadeiras:
 * o contador vem do banco (vagas reais do cupom SALOMAO30), sem cronômetro falso.
 */
export const dynamic = 'force-dynamic'

const CUPOM = 'SALOMAO30'

export const metadata: Metadata = {
  title: { absolute: 'Salomão — 30% de desconto para as 50 primeiras escolas' },
  description: 'App da escola com portaria digital, app dos pais e cantina com PIX automático. 30% de desconto nos 3 primeiros meses para as 50 primeiras escolas.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://agathas.com.br/produtos/salomao' },
}

function pixelSalomao(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID_SALOMAO?.trim()
  return id && /^\d{10,20}$/.test(id) ? id : null
}

export default async function OfertaSalomao({ params }: PageProps<'/[lang]/produtos/salomao/oferta'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const vagas = vagasRestantes(CUPOM)
  const esgotado = vagas !== null && vagas <= 0
  const pixelId = pixelSalomao()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'

  return (
    <main id="main-content" role="main" className="bg-[#f7f6f2] text-slate-900">
      <SalomaoPixel pixelId={pixelId} valor={174.3} />

      <section className="bg-[#1f2a44] text-white">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center sm:py-20 lg:px-8">
          {!esgotado ? (
            <p className="inline-block rounded-full bg-[#d4a72c] px-4 py-1.5 text-sm font-bold text-[#1f2a44]">
              Lançamento · {vagas === null ? 'vagas limitadas' : `restam ${vagas} de 50 vagas`}
            </p>
          ) : (
            <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">As 50 vagas do lançamento acabaram</p>
          )}
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {esgotado ? 'O app da sua escola, pronto em 48 horas' : '30% de desconto nos 3 primeiros meses do app da sua escola'}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Portaria digital com chamada por voz na TV, app dos pais com a marca da escola e cantina com PIX automático.
          </p>
          <div className="mt-8 flex flex-wrap items-end justify-center gap-6">
            {[['Até 250 alunos', 249, 174.3], ['Até 500 alunos', 499, 349.3]].map(([nome, cheio, promo]) => (
              <div key={String(nome)} className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4">
                <p className="text-sm text-slate-300">{nome}</p>
                {!esgotado && <p className="text-sm text-slate-400 line-through">R$ {Number(cheio).toFixed(2).replace('.', ',')}/mês</p>}
                <p className="text-3xl font-bold tabular-nums">R$ {Number(esgotado ? cheio : promo).toFixed(2).replace('.', ',')}<span className="text-base font-normal text-slate-300">/mês</span></p>
              </div>
            ))}
          </div>
          {!esgotado && <p className="mt-4 text-sm text-slate-300">Depois do 3º mês, preço normal. Cupom <strong className="text-white">{CUPOM}</strong> já aplicado abaixo.</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#assinar" className="inline-block rounded-lg bg-[#d4a72c] px-7 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Garantir minha vaga</a>
            <SolicitarDemo recaptchaSiteKey={getRecaptchaSiteKey()} pixelId={pixelId} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 py-14 sm:grid-cols-3 lg:px-8">
        {[
          ['Saída sem fila', 'O pai pede pelo celular e o nome do aluno é chamado na TV da portaria.'],
          ['Cantina sem dinheiro', 'Crédito por PIX que entra sozinho, encomenda do lanche e extrato para os pais.'],
          ['Pronto em 48 horas', 'Pagou, o app é criado na hora. A gente importa a lista de alunos para você.'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-[#1f2a44]">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <section id="assinar" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-14 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1f2a44]">Assine agora</h2>
          <p className="mt-2 text-center text-sm text-slate-600">Cartão de crédito, renovação automática, cancele quando quiser. O cupom vale no plano mensal.</p>
          <div className="mt-8">
            <SalomaoCheckout dominioBase={dominioBase} cupomInicial={esgotado ? '' : CUPOM} pixelId={pixelId} />
          </div>
        </div>
      </section>
    </main>
  )
}
