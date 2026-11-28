import type { Locale } from '@/lib/i18n'

/**
 * Textos da página /produtos/sk-render. A venda acontece em skrender.agathas.com.br (projeto
 * ~/DDEV/sk-render); esta página apresenta o produto dentro do site da empresa e leva para lá.
 * Preço do render: conferir com a página de venda antes de mudar aqui.
 */
export const SK_RENDER_URL = 'https://skrender.agathas.com.br/?utm_source=agathas&utm_medium=site&utm_campaign=produtos'
// Fora do Brasil (21/11/2026): cadastro em inglês/espanhol e pagamento em dólar/euro pela Stripe.
export const skRenderUrl = (lang: Locale) =>
  lang === 'pt-BR' ? SK_RENDER_URL : `https://skrender.agathas.com.br/start?lang=${lang === 'es' ? 'es' : 'en'}&utm_source=agathas&utm_medium=site&utm_campaign=produtos`

export interface SkRenderTextos {
  metadata: { title: string; description: string }
  badge: string
  titlePrefix: string
  titleHighlight: string
  lead: string
  cta: string
  ctaNote: string
  before: string
  after: string
  stepsHeading: string
  steps: { title: string; desc: string }[]
  featuresHeading: string
  features: { title: string; desc: string }[]
  pricingHeading: string
  pricing: string[]
  faqHeading: string
  faq: { q: string; a: string }[]
  finalHeading: string
  finalBody: string
  trademark: string
}

const pt: SkRenderTextos = {
  metadata: {
    title: 'SK Render — render com IA para SketchUp e Revit, fiel ao projeto | Agathas Web',
    description: 'Plugin para SketchUp e Revit que transforma a vista do projeto em imagem fotorrealista em cerca de 30 segundos. Vendido por assinatura, a partir de R$ 0,65 por render, sem fidelidade.',
  },
  badge: 'Plugin para SketchUp e Revit',
  titlePrefix: 'Render com IA que',
  titleHighlight: 'não inventa nada no seu projeto',
  lead: 'O SK Render transforma a vista que está na tela do SketchUp ou do Revit em imagem fotorrealista em cerca de 30 segundos. Mesma câmera, mesmos móveis, mesmos materiais. Feito para marceneiros, designers de interiores e arquitetos que precisam mostrar ao cliente como o projeto vai ficar.',
  cta: 'Baixar o plugin',
  ctaNote: 'Windows e Mac · assinatura sem fidelidade',
  before: 'Vista no SketchUp',
  after: 'Render do SK Render',
  stepsHeading: 'Como funciona',
  steps: [
    { title: 'Instale o plugin', desc: 'Crie a conta com nome e WhatsApp, baixe o plugin e instale no SketchUp ou no Revit, versão 2021 ou mais nova.' },
    { title: 'Posicione a vista', desc: 'Abra o projeto, escolha o ângulo e abra o SK Render: no SketchUp, em Extensões › SK Render; no Revit, no botão da aba Complementos. Escolha o clima da cena e clique em renderizar.' },
    { title: 'Receba a imagem', desc: 'O render é feito na nuvem e volta em cerca de 30 segundos. Se algo precisar de ajuste, escreva o que corrigir e gere de novo.' },
  ],
  featuresHeading: 'O que o SK Render faz',
  features: [
    { title: 'Fiel ao que você desenhou', desc: 'A imagem mantém câmera, geometria e materiais do modelo. Nada de móvel trocado ou janela inventada.' },
    { title: 'Sem placa de vídeo', desc: 'O processamento é na nuvem: funciona em qualquer computador com internet.' },
    { title: 'Fita de LED', desc: 'Marque a fita com a textura hachurada amarela e branca e ela sai como iluminação indireta.' },
    { title: 'Acabamentos de catálogo', desc: 'No SketchUp, vincule os materiais a padrões reais de MDF, revestimento e pedra.' },
  ],
  pricingHeading: 'Quanto custa',
  pricing: [
    'Instalar o plugin não custa nada, mas cada render usa créditos.',
    'Assinatura de 25, 50 ou 100 renders por mês (R$ 19,90, R$ 34,90 ou R$ 64,90), até 50% mais barata, e o que sobra do mês acumula.',
    'Por enquanto, o SK Render é vendido só por assinatura, sem fidelidade: cancele quando quiser. PIX ou cartão.',
    'Render que não gerar imagem não é cobrado.',
  ],
  faqHeading: 'Perguntas frequentes',
  faq: [
    { q: 'Em quais versões do SketchUp funciona?', a: 'No SketchUp 2021 ou mais novo, para Windows e Mac. Não funciona no SketchUp para web nem no iPad.' },
    { q: 'Funciona no Revit?', a: 'Funciona, no Revit 2021 ou mais novo (Windows). O botão SK Render fica na aba Complementos e renderiza a vista 3D aberta. A conta, o serial e o crédito são os mesmos do SketchUp. O vínculo com acabamentos de catálogo, por enquanto, só existe no SketchUp.' },
    { q: 'Preciso de um computador potente?', a: 'Não. O render é feito nos nossos servidores; o seu computador só precisa abrir o SketchUp ou o Revit e ter internet.' },
    { q: 'Posso usar em mais de um computador?', a: 'Sim. O mesmo serial vale no computador de casa e no do escritório, e o crédito é um só.' },
    { q: 'Quem está por trás do SK Render?', a: 'A Agathas Web, empresa brasileira de tecnologia com mais de 15 anos de mercado. O pagamento é processado pelo ASAAS e o suporte é pelo nosso WhatsApp.' },
  ],
  finalHeading: 'Mostre o projeto como ele vai ficar',
  finalBody: 'Instale o plugin, escolha a assinatura e renderize o próximo projeto do cliente.',
  trademark: 'SketchUp é marca da Trimble Inc. e Revit é marca da Autodesk, Inc. O SK Render não é afiliado à Trimble nem à Autodesk.',
}

const es: SkRenderTextos = {
  metadata: {
    title: 'SK Render — render con IA para SketchUp y Revit, fiel al proyecto | Agathas Web',
    description: 'Plugin para SketchUp y Revit que convierte la vista del proyecto en una imagen fotorrealista en unos 30 segundos. Se vende por suscripción, desde 0,32 € por render, sin permanencia.',
  },
  badge: 'Plugin para SketchUp y Revit',
  titlePrefix: 'Render con IA que',
  titleHighlight: 'no inventa nada en tu proyecto',
  lead: 'SK Render convierte la vista que tienes en la pantalla de SketchUp o de Revit en una imagen fotorrealista en unos 30 segundos. La misma cámara, los mismos muebles, los mismos materiales. Hecho para carpinteros, diseñadores de interiores y arquitectos que necesitan mostrar al cliente cómo quedará el proyecto.',
  cta: 'Descargar el plugin',
  ctaNote: 'Windows y Mac · suscripción sin permanencia',
  before: 'Vista en SketchUp',
  after: 'Render de SK Render',
  stepsHeading: 'Cómo funciona',
  steps: [
    { title: 'Instala el plugin', desc: 'Crea la cuenta con nombre y WhatsApp, descarga el plugin e instálalo en SketchUp o en Revit, versión 2021 o posterior.' },
    { title: 'Coloca la vista', desc: 'Abre el proyecto, elige el ángulo y abre SK Render: en SketchUp, en Extensiones › SK Render; en Revit, con el botón de la pestaña Complementos. Elige el ambiente de la escena y haz clic en renderizar.' },
    { title: 'Recibe la imagen', desc: 'El render se hace en la nube y vuelve en unos 30 segundos. Si algo necesita ajuste, escribe qué corregir y genera de nuevo.' },
  ],
  featuresHeading: 'Qué hace SK Render',
  features: [
    { title: 'Fiel a lo que diseñaste', desc: 'La imagen mantiene la cámara, la geometría y los materiales del modelo. Sin muebles cambiados ni ventanas inventadas.' },
    { title: 'Sin tarjeta gráfica', desc: 'El procesamiento es en la nube: funciona en cualquier ordenador con internet.' },
    { title: 'Tiras LED', desc: 'Marca la tira con la textura rayada amarilla y blanca y saldrá como iluminación indirecta.' },
    { title: 'Acabados de catálogo', desc: 'En SketchUp, vincula los materiales a patrones reales de tableros, revestimientos y piedra.' },
  ],
  pricingHeading: 'Cuánto cuesta',
  pricing: [
    'Instalar el plugin no cuesta nada, pero cada render usa créditos.',
    'Suscripción de 25, 50 o 100 renders al mes (9,95 €, 17,45 € o 32,45 €), hasta un 50% más barata, y lo que no uses se acumula.',
    'Por ahora, SK Render se vende solo por suscripción, sin permanencia: cancela cuando quieras. Pago con tarjeta en euros.',
    'El render que no genera imagen no se cobra.',
  ],
  faqHeading: 'Preguntas frecuentes',
  faq: [
    { q: '¿En qué versiones de SketchUp funciona?', a: 'En SketchUp 2021 o posterior, para Windows y Mac. No funciona en SketchUp para web ni en iPad.' },
    { q: '¿Funciona en Revit?', a: 'Sí, en Revit 2021 o posterior (Windows). El botón SK Render está en la pestaña Complementos y renderiza la vista 3D abierta. La cuenta, el serial y el crédito son los mismos de SketchUp. El vínculo con acabados de catálogo, por ahora, solo existe en SketchUp.' },
    { q: '¿Necesito un ordenador potente?', a: 'No. El render se hace en nuestros servidores; tu ordenador solo necesita abrir SketchUp o Revit y tener internet.' },
    { q: '¿Puedo usarlo en más de un ordenador?', a: 'Sí. El mismo serial vale en el ordenador de casa y en el de la oficina, y el crédito es uno solo.' },
    { q: '¿Quién está detrás de SK Render?', a: 'Agathas Web, empresa brasileña de tecnología con más de 15 años en el mercado. La cuenta está en español y el pago es en euros, procesado por Stripe.' },
  ],
  finalHeading: 'Muestra el proyecto como va a quedar',
  finalBody: 'Instala el plugin, elige la suscripción y renderiza el próximo proyecto del cliente.',
  trademark: 'SketchUp es una marca de Trimble Inc. y Revit es una marca de Autodesk, Inc. SK Render no está afiliado a Trimble ni a Autodesk.',
}

const en: SkRenderTextos = {
  metadata: {
    title: 'SK Render — AI rendering for SketchUp and Revit, faithful to your design | Agathas Web',
    description: 'Plugin for SketchUp and Revit that turns the current view into a photorealistic image in about 30 seconds. Sold by subscription, from $0.65 per render, cancel anytime.',
  },
  badge: 'Plugin for SketchUp and Revit',
  titlePrefix: 'AI rendering that',
  titleHighlight: 'changes nothing in your design',
  lead: 'SK Render turns the view on your SketchUp or Revit screen into a photorealistic image in about 30 seconds. Same camera, same furniture, same materials. Built for cabinet makers, interior designers and architects who need to show a client what the project will look like.',
  cta: 'Get the extension',
  ctaNote: 'Windows and Mac · subscription, cancel anytime',
  before: 'SketchUp view',
  after: 'SK Render result',
  stepsHeading: 'How it works',
  steps: [
    { title: 'Install the extension', desc: 'Create an account with your name and WhatsApp number, download the plugin and install it in SketchUp or Revit, version 2021 or newer.' },
    { title: 'Position the view', desc: 'Open your project, choose the angle and open SK Render: in SketchUp, under Extensions › SK Render; in Revit, with the button on the Add-Ins tab. Pick the scene mood and click render.' },
    { title: 'Get the image', desc: 'The render runs in the cloud and comes back in about 30 seconds. If something needs fixing, describe it and render again.' },
  ],
  featuresHeading: 'What SK Render does',
  features: [
    { title: 'Faithful to your design', desc: 'The image keeps the camera, geometry and materials of your model. No swapped furniture, no invented windows.' },
    { title: 'No graphics card needed', desc: 'Processing happens in the cloud, so it runs on any computer with an internet connection.' },
    { title: 'LED strips', desc: 'Mark the strip with the yellow and white hatch texture and it comes out as indirect lighting.' },
    { title: 'Catalog finishes', desc: 'In SketchUp, link materials to real wood panel, tile and stone patterns.' },
  ],
  pricingHeading: 'Pricing',
  pricing: [
    'Installing the extension costs nothing, but each render uses credits.',
    'Subscription of 25, 50 or 100 renders a month ($19.90, $34.90 or $64.90), up to 50% cheaper, and unused renders roll over.',
    'For now, SK Render is sold by subscription only, with no lock-in: cancel anytime. Card payment in US dollars.',
    'A render that fails to produce an image is not charged.',
  ],
  faqHeading: 'Frequently asked questions',
  faq: [
    { q: 'Which SketchUp versions are supported?', a: 'SketchUp 2021 or newer, on Windows and Mac. It does not run on SketchUp for Web or iPad.' },
    { q: 'Does it work in Revit?', a: 'Yes, in Revit 2021 or newer (Windows). The SK Render button is on the Add-Ins tab and renders the open 3D view. Your account, serial and credit are the same as in SketchUp. Linking catalog finishes is, for now, only available in SketchUp.' },
    { q: 'Do I need a powerful computer?', a: 'No. Rendering runs on our servers; your computer only needs to run SketchUp or Revit and be online.' },
    { q: 'Can I use it on more than one computer?', a: 'Yes. The same serial works on your home and office computers, with a single credit balance.' },
    { q: 'Who is behind SK Render?', a: 'Agathas Web, a Brazilian technology company with more than 15 years in business. Your account is in English and payment is in US dollars, processed by Stripe.' },
  ],
  finalHeading: 'Show the project the way it will look',
  finalBody: 'Install the extension, pick a subscription and render your next client project.',
  trademark: 'SketchUp is a trademark of Trimble Inc. and Revit is a trademark of Autodesk, Inc. SK Render is not affiliated with Trimble or Autodesk.',
}

export const SK_RENDER_TEXTOS: Record<Locale, SkRenderTextos> = { 'pt-BR': pt, es, 'en-US': en, 'en-GB': en }
