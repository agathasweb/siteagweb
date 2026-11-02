import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SalomaoCheckout from '@/components/salomao/SalomaoCheckout'
import SalomaoPixel from '@/components/salomao/SalomaoPixel'
import SolicitarDemo from '@/components/salomao/SolicitarDemo'
import { BotaoWhatsApp, WhatsAppFlutuanteSalomao } from '@/components/salomao/WhatsAppSalomao'
import BarraCompra from '@/components/salomao/lp/BarraCompra'
import MedicaoSalomao from '@/components/salomao/MedicaoSalomao'
import { AppNasLojas, AppPais, Compra, Hero, Prazo2027, Numeros, Perguntas, Portaria, Confianca, Migracao, VideoDemo, Secretaria, Selos, TabelaPrecos } from '@/components/salomao/lp/Secoes'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

/**
 * Landing C — dor da rotina e segurança na saída (conheca.salomao.agathas.com.br).
 * Gatilhos: identificação com o problema, demonstração com as telas reais, redução de risco (demo, sem fidelidade).
 */
// A seção "Não deixe para 2027" calcula a janela a partir de hoje: a página é refeita 1×/dia.
export const revalidate = 86400

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
  ['17h30, portão lotado', 'Carros em fila dupla, porteiro gritando nomes, criança que não ouve e fica para trás.'],
  ['Telefone que não para', '"Ela já saiu?", "Tem tarefa hoje?", "Quanto deu a cantina?" — o dia inteiro na secretaria.'],
  ['Cantina no caderno', 'Fiado anotado à mão, troco que falta e família que não sabe o que o filho comeu.'],
]

export default async function EscolaSalomao({ params }: PageProps<'/[lang]/produtos/salomao/escola'>) {
  const { lang } = await params
  if (lang !== 'pt-BR') notFound()
  const pixelId = pixelSalomao()
  const recaptcha = getRecaptchaSiteKey()
  const dominioBase = process.env.SALOMAO_DOMINIO_BASE?.trim() || 'salomao.agathas.com.br'

  return (
    <main id="main-content" role="main" data-salomao-lp className="overflow-x-clip bg-white text-slate-900">
      <WhatsAppFlutuanteSalomao pixelId={pixelId} recaptchaSiteKey={recaptcha} />
      <SalomaoPixel pixelId={pixelId} valor={249} />
      <MedicaoSalomao clarityId={process.env.CLARITY_PROJECT_ID?.trim() || null} pixelId={pixelId} pagina="conheca" />

      <Hero
        selo={<p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d4a72c]">Para diretores e mantenedores</p>}
        titulo={<>A saída da escola sem fila, sem gritaria e <span className="text-[#d4a72c]">com registro de quem buscou</span></>}
        subtitulo="O responsável pede a saída pelo celular, o nome é chamado na TV e a portaria libera com um toque. Junto vêm o app dos pais, a cantina com PIX e as tarefas."
        acoes={<>
          <SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Testar grátis a demonstração</SolicitarDemo>
          <BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem="conheça" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp>
          <a href="#assinar" className="px-2 py-3.5 text-sm font-semibold text-white underline underline-offset-4 hover:text-[#d4a72c]">Quero na minha escola</a>
        </>}
        rodape={<Selos itens={['Instalação em 48 horas', 'Migração gratuita do sistema atual', 'Sem fidelidade', 'Teste a demonstração antes']} />}
      />
      <Prazo2027 acao={<><SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Testar grátis a demonstração</SolicitarDemo><BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem="conheça - 2027" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Quero o app nas lojas em 2027</BotaoWhatsApp></>} />

      <section className="bg-[#f7f6f2]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#1f2a44] sm:text-4xl">Parece com a sua escola?</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {DORES.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-[#1f2a44]">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg font-semibold text-[#1f2a44]">O Salomão resolve as três no mesmo app:</p>
        </div>
      </section>
      <VideoDemo acao={<><SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="rounded-lg bg-[#d4a72c] px-6 py-3.5 font-bold text-[#1f2a44] hover:bg-[#e0b84a]">Testar grátis a demonstração</SolicitarDemo><BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem="conheça - vídeo" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp></>} />
      <Migracao acao={<BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem="conheça - migração" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Tirar dúvidas sobre a migração</BotaoWhatsApp>} />
      <Portaria />
      <AppPais />
      <AppNasLojas />
      <Secretaria />
      <Numeros />
      <Confianca acao={<BotaoWhatsApp pixelId={pixelId} recaptchaSiteKey={recaptcha} origem="conheça - confiança" className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-6 py-3.5 font-bold text-[#0b3d1f] hover:bg-[#3ee07b]">Falar com um especialista</BotaoWhatsApp>} />
      <Compra titulo="Menos de R$ 1 por aluno" texto={<>
        <TabelaPrecos />
        <p className="mt-4 text-sm">Todos os módulos, sem taxa de implantação. Feito pela Agathas Web, com suporte humano por WhatsApp e a migração do sistema atual feita por nós, sem custo.</p>
      </>}>
        <SalomaoCheckout dominioBase={dominioBase} pixelId={pixelId} recaptchaSiteKey={recaptcha} />
      </Compra>
      <Perguntas />
      <BarraCompra rotulo="Quero na minha escola" detalhe="Não deixe para 2027: o app nas lojas leva de 45 a 90 dias" acao={<SolicitarDemo recaptchaSiteKey={recaptcha} pixelId={pixelId} className="shrink-0 rounded-lg bg-[#d4a72c] px-5 py-3 text-sm font-bold text-[#1f2a44]">Testar grátis</SolicitarDemo>} />
    </main>
  )
}
