import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, buildPageMetadata, buildHreflangAlternates, type Locale } from '@/lib/i18n'

/**
 * Orientação fiscal para clientes da União Europeia (IVA por inversão do sujeito passivo,
 * retenção do convênio Espanha–Brasil, documentos e pagamento). Linkada no rodapé dos
 * orçamentos do YESHUA para clientes estrangeiros.
 *
 * Só existe em espanhol (agathas.es) e inglês (agathasweb.com / uk.agathasweb.com): o
 * público é o cliente europeu. No pt-BR dá 404, e o hreflang lista só esses três idiomas.
 */
const IDIOMAS: readonly Locale[] = ['es', 'en-US', 'en-GB']
const PATH = '/eu-clients'

type Ref = { nome: string; url: string; diz: string }
type Conteudo = {
  /** Vídeo explicativo (YouTube, canal @AgathasWeb) — primeiro item da página. */
  video?: { id: string; titulo: string; descricao: string; publicado: string }
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  intro: string
  updated: string
  resumo: { k: string; v: string }[]
  vat: { h: string; p: string; citacao: string; sub: string; itens: string[]; nota: string }
  wht: { h: string; p: string; th: [string, string, string]; linhas: [string, string, string][]; itens: string[] }
  pay: { h: string; itens: string[] }
  brasil: { h: string; p: string }
  passos: { h: string; itens: string[] }
  refs: { h: string; th: [string, string]; itens: Ref[] }
  aviso: string
  contato: string
}

const LINKS = {
  diretiva: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006L0112',
  diretivaEn: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0112',
  liva: 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740',
  convenio: 'https://www.boe.es/buscar/act.php?id=BOE-A-1975-26928',
  irnr: 'https://www.boe.es/buscar/act.php?id=BOE-A-2004-4527',
  modelo216: 'https://www.boe.es/buscar/act.php?id=BOE-A-2008-18497',
  lc116: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
  lc123: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
}

const ES: Conteudo = {
  video: {
    id: 'zWj8tcfEeh8',
    titulo: 'Cómo contratar a Agathas Web desde España: IVA y retención (Convenio España–Brasil)',
    descricao: 'Proceso de contratación, IVA por inversión del sujeto pasivo y retención del IRNR según el Convenio España–Brasil, en menos de dos minutos.',
    publicado: '2026-10-30',
  },
  metaTitle: 'Clientes de la Unión Europea: IVA, retención y facturación | Agathas Web',
  metaDescription: 'Cómo contratar a Agathas Web (Brasil) desde la UE: factura sin IVA con inversión del sujeto pasivo, retención del convenio España–Brasil, documentos y pago SEPA.',
  eyebrow: 'Clientes de la Unión Europea',
  title: 'Cómo contratarnos desde la UE',
  intro: 'IVA, retenciones, facturas y pago, paso a paso, para empresas europeas que contratan servicios de Agathas Web, empresa establecida en Brasil.',
  updated: 'Actualizado en octubre de 2026',
  resumo: [
    { k: 'IVA', v: 'Facturamos sin IVA. Su empresa lo autoliquida (inversión del sujeto pasivo).' },
    { k: 'Retención', v: 'En España puede corresponder una retención del IRNR: máx. 15% con nuestro certificado de residencia fiscal; 24% sin él.' },
    { k: 'Documentos', v: 'Factura comercial en euros, nota fiscal brasileña de exportación (NFS-e) y certificado de residencia fiscal.' },
    { k: 'Pago', v: 'Transferencia SEPA en euros a una cuenta a nombre de la empresa, indicada en la factura.' },
  ],
  vat: {
    h: '1. IVA: inversión del sujeto pasivo',
    p: 'Cuando una empresa establecida fuera de la UE presta servicios a una empresa (B2B) de la UE, el servicio se entiende prestado en el país del cliente y quien declara el IVA es el cliente, no el prestador. Por eso nuestras facturas no llevan IVA y contienen esta mención:',
    citacao: 'IVA no incluido — inversión del sujeto pasivo: el IVA lo autoliquida el destinatario (arts. 44 y 196 de la Directiva 2006/112/CE; en España, arts. 69.Uno.1º y 84.Uno.2º de la Ley 37/1992).',
    sub: 'Qué hace su empresa',
    itens: [
      'Registra la factura y declara el IVA como devengado y soportado a la vez en su declaración periódica (en España, modelo 303). Con derecho a deducción total, el efecto neto es cero.',
      'Documenta la operación según su normativa de facturación. Su asesor confirmará si necesita emitir autofactura.',
      'Nos facilita su NIF/VAT y razón social exactos para la factura.',
    ],
    nota: 'Este esquema vale para empresas y profesionales. No vendemos a consumidores finales de la UE: eso exigiría registrarnos en la ventanilla única OSS y cobrar el IVA del país del consumidor.',
  },
  wht: {
    h: '2. Retención en la fuente (España)',
    p: 'El Convenio entre España y Brasil para evitar la doble imposición (1974) trata la prestación de servicios y la asistencia técnica como cánones (art. 12 y punto 5 del Protocolo). Por eso, al pagarnos, su empresa puede tener que retener el Impuesto sobre la Renta de no Residentes (IRNR):',
    th: ['Situación', 'Retención máx.', 'Base legal'],
    linhas: [
      ['Con nuestro certificado de residencia fiscal', '15%', 'Convenio, art. 12.2.b y Protocolo, punto 5'],
      ['Derechos de autor (obras, contenidos)', '10%', 'Convenio, art. 12.2.a'],
      ['Sin certificado', '24%', 'TRLIRNR, art. 25.1.a'],
    ],
    itens: [
      'Le enviamos el certificado de residencia fiscal emitido por la Receita Federal de Brasil, válido por un año, antes del primer pago.',
      'Su empresa ingresa la retención con el modelo 216, la resume en el modelo 296 anual y nos envía el justificante.',
      'Antes de firmar acordaremos si los importes del presupuesto se entienden antes o después de la retención.',
      'Fuera de España, cada país tiene su propio convenio con Brasil (o ninguno). Su asesor indicará la retención aplicable.',
    ],
  },
  pay: {
    h: '3. Pago',
    itens: [
      'Transferencia SEPA en euros a la cuenta indicada en la factura, siempre a nombre de Agathas Web. Su banco comprobará que el nombre coincide con el titular de la cuenta.',
      'No pedimos pagos a cuentas personales ni en criptoactivos.',
      'Indique en el concepto el número de factura.',
    ],
  },
  brasil: {
    h: '4. Lo que hacemos en Brasil',
    p: 'Emitimos la nota fiscal electrónica de servicios (NFS-e) de exportación y declaramos el ingreso en Brasil. La exportación de servicios no paga el impuesto municipal (ISS) ni PIS/Cofins. Usted recibe una copia para su archivo; no tiene que hacer nada con ella.',
  },
  passos: {
    h: '5. Paso a paso',
    itens: [
      'Nos envía razón social, NIF/VAT, dirección y el correo de facturación.',
      'Le enviamos el presupuesto (sin IVA, con la mención de inversión del sujeto pasivo) y, al aceptarlo, el certificado de residencia fiscal.',
      'Emitimos la factura comercial en euros y la NFS-e de exportación.',
      'Paga por SEPA, aplicando la retención que corresponda, y nos envía el justificante del modelo 216 si retuvo.',
      'Autoliquida el IVA en su declaración periódica.',
    ],
  },
  refs: {
    h: 'Referencias',
    th: ['Norma', 'Qué dice'],
    itens: [
      { nome: 'Directiva 2006/112/CE', url: LINKS.diretiva, diz: 'Art. 44: los servicios B2B se localizan en la sede del cliente. Art. 196: el cliente es deudor del IVA.' },
      { nome: 'Ley 37/1992 (IVA, España)', url: LINKS.liva, diz: 'Art. 69.Uno.1º (lugar de prestación) y art. 84.Uno.2º (inversión del sujeto pasivo).' },
      { nome: 'Convenio España–Brasil', url: LINKS.convenio, diz: 'Art. 12 (cánones, 10%/15%) y Protocolo, punto 5 (servicios y asistencia técnica).' },
      { nome: 'RDLeg 5/2004 (IRNR)', url: LINKS.irnr, diz: 'Art. 25.1.a: tipo general del 24% para no residentes fuera de la UE/EEE.' },
      { nome: 'Orden EHA/3290/2008', url: LINKS.modelo216, diz: 'Modelos 216 y 296 y justificación de la retención con certificado de residencia.' },
      { nome: 'LC 116/2003 (Brasil)', url: LINKS.lc116, diz: 'Art. 2º, I: el ISS no incide en la exportación de servicios.' },
      { nome: 'LC 123/2006 (Brasil)', url: LINKS.lc123, diz: 'Simples Nacional: ingresos de exportación sin PIS/Cofins ni ISS.' },
    ],
  },
  aviso: 'Guía informativa. No sustituye el asesoramiento de su gestor o asesor fiscal, que debe confirmar el tratamiento en su caso concreto.',
  contato: '¿Dudas? Escríbanos a',
}

const EN: Conteudo = {
  metaTitle: 'EU clients: VAT, withholding tax and invoicing | Agathas Web',
  metaDescription: 'How to hire Agathas Web (Brazil) from the EU: VAT-free invoices under the reverse charge, Spain–Brazil treaty withholding, documents and SEPA payment.',
  eyebrow: 'European Union clients',
  title: 'How to hire us from the EU',
  intro: 'VAT, withholding tax, invoices and payment, step by step, for European companies buying services from Agathas Web, a company established in Brazil.',
  updated: 'Updated October 2026',
  resumo: [
    { k: 'VAT', v: 'We invoice without VAT. Your company self-assesses it (reverse charge).' },
    { k: 'Withholding', v: 'In Spain, non-resident income tax may be withheld: max. 15% with our tax residence certificate; 24% without it.' },
    { k: 'Documents', v: 'Commercial invoice in euros, Brazilian export service invoice (NFS-e) and tax residence certificate.' },
    { k: 'Payment', v: "SEPA transfer in euros to an account in the company's name, shown on the invoice." },
  ],
  vat: {
    h: '1. VAT: reverse charge',
    p: "When a company established outside the EU supplies services to an EU business (B2B), the place of supply is the customer's country, and the customer, not the supplier, accounts for the VAT. Our invoices therefore carry no VAT and include this statement:",
    citacao: 'VAT not included — reverse charge: VAT to be accounted for by the recipient (Articles 44 and 196, Council Directive 2006/112/EC).',
    sub: 'What your company does',
    itens: [
      'Records the invoice and declares the VAT as both output and input tax in its periodic return (in Spain, form 303). With full deduction rights the net effect is zero.',
      'Documents the transaction under its local invoicing rules. Your adviser will confirm whether a self-billed invoice is required.',
      'Sends us its exact VAT number and legal name for the invoice.',
    ],
    nota: "This applies to businesses and professionals. We do not sell to EU consumers: that would require us to register for the OSS scheme and charge the consumer's local VAT.",
  },
  wht: {
    h: '2. Withholding tax (Spain)',
    p: 'The Spain–Brazil double tax treaty (1974) treats services and technical assistance as royalties (Article 12 and point 5 of the Protocol). When paying us, your company may therefore have to withhold Spanish non-resident income tax (IRNR):',
    th: ['Situation', 'Max. withholding', 'Legal basis'],
    linhas: [
      ['With our tax residence certificate', '15%', 'Treaty, Art. 12(2)(b) and Protocol, point 5'],
      ['Copyright (works, content)', '10%', 'Treaty, Art. 12(2)(a)'],
      ['Without certificate', '24%', 'Spanish IRNR law, Art. 25(1)(a)'],
    ],
    itens: [
      "Before the first payment we send our tax residence certificate issued by Brazil's Receita Federal, valid for one year.",
      'Your company pays the withholding with form 216, reports it in the annual form 296, and sends us the receipt.',
      'Before signing, we will agree whether quoted amounts are before or after withholding.',
      'Outside Spain, each country has its own treaty with Brazil (or none). Your adviser will confirm the applicable rate.',
    ],
  },
  pay: {
    h: '3. Payment',
    itens: [
      'SEPA transfer in euros to the account on the invoice, always in the name of Agathas Web. Your bank will check that the name matches the account holder.',
      'We never ask for payment to personal accounts or in crypto-assets.',
      'Please quote the invoice number in the payment reference.',
    ],
  },
  brasil: {
    h: '4. What we do in Brazil',
    p: 'We issue the Brazilian electronic export service invoice (NFS-e) and report the income in Brazil. Service exports are exempt from the municipal service tax (ISS) and from PIS/Cofins. You receive a copy for your records; no action is needed on your side.',
  },
  passos: {
    h: '5. Step by step',
    itens: [
      'Send us your legal name, VAT number, address and billing email.',
      'We send the quote (no VAT, with the reverse-charge statement) and, on acceptance, our tax residence certificate.',
      'We issue the commercial invoice in euros and the Brazilian export NFS-e.',
      'You pay by SEPA, applying any withholding due, and send us the form 216 receipt if you withheld.',
      'You self-assess the VAT in your periodic return.',
    ],
  },
  refs: {
    h: 'References',
    th: ['Law', 'What it says'],
    itens: [
      { nome: 'Directive 2006/112/EC', url: LINKS.diretivaEn, diz: 'Art. 44: B2B services are supplied where the customer is established. Art. 196: the customer is liable for VAT.' },
      { nome: 'Law 37/1992 (Spanish VAT)', url: LINKS.liva, diz: 'Art. 69.Uno.1º (place of supply) and Art. 84.Uno.2º (reverse charge).' },
      { nome: 'Spain–Brazil tax treaty', url: LINKS.convenio, diz: 'Art. 12 (royalties, 10%/15%) and Protocol, point 5 (services and technical assistance).' },
      { nome: 'Royal Legislative Decree 5/2004 (IRNR)', url: LINKS.irnr, diz: 'Art. 25(1)(a): 24% general rate for non-EU/EEA residents.' },
      { nome: 'Order EHA/3290/2008', url: LINKS.modelo216, diz: 'Forms 216 and 296, and proof of reduced withholding with a residence certificate.' },
      { nome: 'LC 116/2003 (Brazil)', url: LINKS.lc116, diz: 'Art. 2(I): no municipal ISS on service exports.' },
      { nome: 'LC 123/2006 (Brazil)', url: LINKS.lc123, diz: 'Simples Nacional: export revenue free of PIS/Cofins and ISS.' },
    ],
  },
  aviso: 'Informational guide. It does not replace advice from your accountant or tax adviser, who should confirm the treatment in your specific case.',
  contato: 'Questions? Write to',
}

function conteudo(lang: Locale): Conteudo | null {
  if (lang === 'es') return ES
  if (lang === 'en-US' || lang === 'en-GB') return EN
  return null
}

export async function generateMetadata({ params }: PageProps<'/[lang]/eu-clients'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const t = conteudo(lang)
  if (!t) return {}
  const meta = buildPageMetadata({ lang, path: PATH, title: t.metaTitle, description: t.metaDescription })

  // hreflang só para os idiomas em que a página existe (o pt-BR dá 404).
  return { ...meta, alternates: { ...meta.alternates, languages: buildHreflangAlternates(PATH, IDIOMAS) } }
}

export default async function EuClientsPage({ params }: PageProps<'/[lang]/eu-clients'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = conteudo(lang)
  if (!t) notFound()

  const h2 = 'text-2xl font-bold text-white mt-12 mb-4'
  const lista = 'list-disc pl-6 space-y-2'

  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        {t.video && (
          <>
            <div className="mb-12 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${t.video.id}?rel=0`}
                title={t.video.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'VideoObject',
                name: t.video.titulo,
                description: t.video.descricao,
                thumbnailUrl: `https://i.ytimg.com/vi/${t.video.id}/hqdefault.jpg`,
                uploadDate: t.video.publicado,
                duration: 'PT1M54S',
                embedUrl: `https://www.youtube-nocookie.com/embed/${t.video.id}`,
                contentUrl: `https://www.youtube.com/watch?v=${t.video.id}`,
                inLanguage: 'es-ES',
              }) }}
            />
          </>
        )}
        <p className="text-sm font-semibold uppercase tracking-widest text-voyia-blue">{t.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold text-white text-balance">{t.title}</h1>
        <p className="mt-4 text-lg text-gray-300">{t.intro}</p>
        <p className="mt-2 text-sm text-gray-500">{t.updated}</p>

        <dl className="mt-10 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
          {t.resumo.map((r) => (
            <div key={r.k} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 sm:pt-1">{r.k}</dt>
              <dd className="text-gray-200">{r.v}</dd>
            </div>
          ))}
        </dl>

        <div className="text-gray-300 leading-relaxed">
          <h2 className={h2}>{t.vat.h}</h2>
          <p>{t.vat.p}</p>
          <blockquote className="my-5 rounded-lg border-l-4 border-voyia-blue bg-white/5 px-5 py-4 font-medium text-white">{t.vat.citacao}</blockquote>
          <h3 className="mt-6 mb-2 text-lg font-semibold text-white">{t.vat.sub}</h3>
          <ul className={lista}>{t.vat.itens.map((i) => <li key={i}>{i}</li>)}</ul>
          <p className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-amber-100">{t.vat.nota}</p>

          <h2 className={h2}>{t.wht.h}</h2>
          <p>{t.wht.p}</p>
          <div className="my-5 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/15 text-left text-xs uppercase tracking-wider text-gray-400">
                  {t.wht.th.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.wht.linhas.map(([sit, pct, base]) => (
                  <tr key={sit} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">{sit}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-white">{pct}</td>
                    <td className="px-3 py-3 text-gray-400">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={lista}>{t.wht.itens.map((i) => <li key={i}>{i}</li>)}</ul>

          <h2 className={h2}>{t.pay.h}</h2>
          <ul className={lista}>{t.pay.itens.map((i) => <li key={i}>{i}</li>)}</ul>

          <h2 className={h2}>{t.brasil.h}</h2>
          <p>{t.brasil.p}</p>

          <h2 className={h2}>{t.passos.h}</h2>
          <ol className="list-decimal pl-6 space-y-2 marker:font-semibold marker:text-voyia-blue">
            {t.passos.itens.map((i) => <li key={i}>{i}</li>)}
          </ol>

          <h2 className={h2}>{t.refs.h}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/15 text-left text-xs uppercase tracking-wider text-gray-400">
                  {t.refs.th.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.refs.itens.map((r) => (
                  <tr key={r.nome} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-voyia-blue underline hover:text-purple-300">{r.nome}</a>
                    </td>
                    <td className="px-3 py-3 text-gray-400">{r.diz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-12 border-t border-white/10 pt-6 text-sm text-gray-500">{t.aviso}</p>
          <p className="mt-2 text-sm text-gray-400">
            {t.contato} <a href="mailto:webmaster@agathas.com.br" className="text-voyia-blue hover:text-purple-300">webmaster@agathas.com.br</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
