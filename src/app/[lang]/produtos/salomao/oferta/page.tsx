import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import { BotaoWhatsApp, WhatsAppFlutuanteSalomao } from '@/components/salomao/WhatsAppSalomao'
import BarraCompra from '@/components/salomao/lp/BarraCompra'
import { AppNasLojas, AppPais, Compra, Hero, Numeros, Perguntas, Portaria, Confianca, VideoDemo, Secretaria, Selos, TabelaPrecos } from '@/components/salomao/lp/Secoes'
import { vagasRestantes } from '@/lib/db/cupons'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

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
  const recaptcha = getRecaptchaSiteKey()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'
  // O número só aparece depois das primeiras vendas: "restam 50 de 50" dizia ao visitante que ninguém comprou.
  const mostrarNumero = vagas !== null && vagas <= 40
  const contador = mostrarNumero ? `restam ${vagas} de 50 vagas` : 'vagas limitadas'

  return (
    <main id="main-content" role="main" data-salomao-lp className="overflow-x-clip bg-white text-slate-900">
      <WhatsAppFlutuanteSalomao pixelId={pixelId} />
      <SalomaoPixel pixelId={pixelId} valor={174.3} />

      <Hero
        selo={esgotado
          ? <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">As 50 vagas do lançamento acabaram</p>
          : <p className="inline-flex items-center gap-2 rounded-full bg-[#d4a72c] px-4 py-1.5 text-sm font-bold text-[#1f2a44]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#1f2a44]" /> Lançamento · {contador}</p>}
        titulo={esgotado ? 'O app da sua escola, instalado em 48 horas' : <>30% de desconto nos 3 primeiros meses <span className="text-[#d4a72c]">do app da sua escola</span></>}
        subtitulo="Saída sem fila com chamada por voz na TV, app dos pais com a marca da escola e cantina com PIX que entra sozinho."
        acoes={<>
          <a href="#assinar" className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">{esgotado ? 'Assinar agora' : 'Garantir minha vaga'}</a>
          <BotaoWhatsApp pixelId={pixelId} origem="oferta" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp>
          <SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="px-2 py-3.5 text-sm font-semibold text-white underline underline-offset-4 hover:text-[#d4a72c]" />
        </>}
        rodape={esgotado ? <Selos itens={['Sem taxa de implantação', 'Cancele quando quiser']} /> : (
          <div className="flex flex-wrap items-end gap-6">
            {[['Até 250 alunos', '249,00', '174,30'], ['Até 500 alunos', '499,00', '349,30']].map(([n, de, por]) => (
              <div key={n}>
                <p className="text-xs text-slate-300">{n}</p>
                <p className="text-sm text-slate-400 line-through">R$ {de}/mês</p>
                <p className="text-2xl font-bold tabular-nums">R$ {por}<span className="text-sm font-normal text-slate-300">/mês</span></p>
              </div>
            ))}
            <p className="text-xs text-slate-300">nos 3 primeiros meses · cupom <strong className="text-white">{CUPOM}</strong> já aplicado</p>
          </div>
        )}
      />
      <VideoDemo acao={<><BotaoWhatsApp pixelId={pixelId} origem="oferta - vídeo" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp><SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="rounded-lg border border-[#1f2a44]/30 px-6 py-3.5 font-semibold text-[#1f2a44] hover:border-[#1f2a44]" /></>} />
      <Numeros />
      <Portaria />
      <AppPais />
      <AppNasLojas />
      <Secretaria />
      <Confianca acao={<BotaoWhatsApp pixelId={pixelId} origem="oferta - confiança" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp>} />
      <Compra titulo={esgotado ? 'Assine agora' : 'Garanta o desconto de lançamento'} texto={<>
        <TabelaPrecos cupom={!esgotado} />
        <p className="mt-4 text-sm">{esgotado ? 'Sem taxa de implantação. Cancele quando quiser.' : `Desconto de 30% nas 3 primeiras mensalidades do plano mensal. Depois, preço normal. ${mostrarNumero ? `Restam ${vagas} vagas.` : 'Vagas limitadas.'}`}</p>
      </>}>
        <SalomaoCheckout dominioBase={dominioBase} cupomInicial={esgotado ? '' : CUPOM} pixelId={pixelId} />
      </Compra>
      <Perguntas />
      <BarraCompra rotulo={esgotado ? 'Assinar agora' : 'Garantir vaga'} detalhe={esgotado ? 'Instalação em 48 h · cancele quando quiser' : `30% off · ${contador}`} />
    </main>
  )
}
