import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/lib/i18n'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import { BotaoWhatsApp, WhatsAppFlutuanteSalomao } from '@/components/salomao/WhatsAppSalomao'
import BarraCompra from '@/components/salomao/lp/BarraCompra'
import MedicaoSalomao from '@/components/salomao/MedicaoSalomao'
import { Compra, Confianca, Perguntas, TabelaPrecos } from '@/components/salomao/lp/Secoes'
import { WhatsAppOficial, AntesDepois, AppFamilia, Avisos, CantinaFinanceiro, ComoComeca, CtaFinal, Extras, FAQ_VENDA, FaixaConfianca, FaixaOferta, HeroVenda, PortariaVenda, TudoNumApp, anguloDe, diasDeOferta } from '@/components/salomao/lp/Venda'
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
    title: 'Salomão — sistema de gestão escolar e app da escola, R$ 249/mês | Agathas Web',
    description:
      'Sistema de gestão escolar e agenda digital com a marca da escola: avisos com leitura, WhatsApp oficial, portaria digital, cantina com PIX, diário infantil, notas e financeiro. No ar em 48 horas, R$ 249/mês até 250 alunos. Teste grátis.',
  })
  return { ...meta, alternates: { canonical: meta.alternates?.canonical } }
}

const OURO = 'rounded-lg bg-[#d4a72c] px-6 py-3.5 text-center font-bold text-[#1f2a44] hover:bg-[#e0b84a]'
const VERDE = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]'

export default async function SalomaoPage({ params, searchParams }: PageProps<'/[lang]/produtos/salomao'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const sp = await searchParams
  const dias = diasDeOferta()
  const oferta = dias !== null
  // Com a oferta no ar, o cupom já vem preenchido no checkout (quem chega com outro cupom na URL mantém o dele).
  const cupom = typeof sp.cupom === 'string' ? sp.cupom.slice(0, 30) : oferta ? 'SALOMAO30' : ''
  const angulo = anguloDe(sp.a)
  const pixelId = pixelSalomao()
  const recaptcha = getRecaptchaSiteKey()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'
  const demo = (rotulo: string, classe = OURO) => <SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className={classe}>{rotulo}</SolicitarDemo>
  const whats = (origem: string, rotulo: string, classe = VERDE) => <BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem={`produto - ${origem}`} className={classe}>{rotulo}</BotaoWhatsApp>

  return (
    <main id="main-content" role="main" data-salomao-lp className="overflow-x-clip bg-white text-slate-900">
      <WhatsAppFlutuanteSalomao pixelId={pixelId} recaptchaSiteKey={recaptcha} />
      <SalomaoPixel pixelId={pixelId} valor={249} />
      <MedicaoSalomao clarityId={process.env.CLARITY_PROJECT_ID?.trim() || null} pixelId={pixelId} pagina={angulo === 'padrao' ? 'produto' : `produto-${angulo}`} />

      <HeroVenda angulo={angulo} oferta={oferta}
        acao={demo('Testar grátis agora', `${OURO} w-full sm:w-auto`)}
        acao2={<a href="#assinar" className="rounded-lg border border-white/30 px-6 py-3.5 text-center font-semibold text-white hover:border-white">Ver planos e preços</a>} />
      <FaixaConfianca />
      <FaixaOferta dias={dias} acao={<a href="#assinar" className={`${OURO} block`}>Garantir o desconto</a>} />
      <AntesDepois acao={<>{demo('Testar grátis agora')}{whats('antes e depois', 'Falar com um especialista')}</>} />
      <TudoNumApp />
      <Avisos />
      <WhatsAppOficial acao={whats('whatsapp oficial', 'Quero o WhatsApp oficial na minha escola')} />
      <PortariaVenda />
      <CantinaFinanceiro />
      <AppFamilia />
      <Confianca acao={<>{demo('Testar grátis agora')}{whats('confiança', 'Falar com um especialista')}</>} />
      <ComoComeca acao={<>{demo('Começar pelo teste grátis')}{whats('migração', 'Tirar dúvidas sobre a migração')}</>} />
      <Compra titulo={oferta ? 'Assine até 31/12 com 30% de desconto' : 'Comece hoje'} texto={<>
        <TabelaPrecos cupom={oferta} />
        {oferta && <p className="mt-2 text-xs text-slate-500">Valor com o cupom SALOMAO30 nos 3 primeiros meses do plano mensal; depois, o valor normal.</p>}
        <ul className="mt-5 space-y-1.5 text-sm">
          <li><strong className="text-[#1f2a44]">Preço fixo, não por aluno:</strong> com 250 alunos, sai a R$ 0,99 por aluno por mês{oferta ? ' (R$ 0,70 nos 3 primeiros meses)' : ''}.</li>
          <li>Tudo incluso, sem módulo cobrado à parte e sem taxa de implantação.</li>
          <li>Migração do sistema atual por nossa conta, sem custo.</li>
          <li>30 dias de garantia: não serviu, devolvemos o valor pago.</li>
          <li>Sem fidelidade: cancele quando quiser, sem multa.</li>
          <li>Anual: paga 10 mensalidades e usa 12 meses.</li>
          <li>Rede com 2 ou 3 unidades: 10% de desconto no total.</li>
        </ul>
        <p className="mt-5 text-sm">
          Quer o <a href="#whatsapp" className="font-semibold text-[#1f2a44] underline">WhatsApp oficial da escola</a> ligado ao app? É um opcional, contratado à parte, com o motor do <Link href="/produtos/voyia" className="font-semibold text-[#1f2a44] underline">Voyia</Link>.
        </p>
      </>}>
        <SalomaoCheckout dominioBase={dominioBase} cupomInicial={cupom} pixelId={pixelId} recaptchaSiteKey={recaptcha} />
      </Compra>
      <Extras acao={whats('opcionais', 'Falar sobre os opcionais')} />
      <Perguntas itens={FAQ_VENDA} />
      <CtaFinal oferta={oferta} acao={<>{demo('Testar grátis agora', `${OURO} w-full sm:w-auto`)}{whats('fecho', 'Falar com um especialista', `${VERDE} w-full sm:w-auto`)}</>} />
      <BarraCompra detalhe={oferta ? 'Até 31/12: 30% de desconto nos 3 primeiros meses' : 'R$ 249/mês até 250 alunos, sem taxa de implantação'} acao={demo('Testar grátis', 'shrink-0 rounded-lg bg-[#d4a72c] px-5 py-3 text-sm font-bold text-[#1f2a44]')} />
    </main>
  )
}
