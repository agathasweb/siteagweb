import type { Locale } from '@/lib/i18n'

/**
 * Textos da página /produtos/sk-render. A venda acontece em skrender.agathas.com.br (projeto
 * ~/DDEV/sk-render); esta página apresenta o produto dentro do site da empresa e leva para lá.
 * Preço do render: conferir com a página de venda antes de mudar aqui.
 */
export const SK_RENDER_URL = 'https://skrender.agathas.com.br/?utm_source=agathas&utm_medium=site&utm_campaign=produtos'

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
    title: 'SK Render — render com IA para SketchUp, fiel ao projeto | Agathas Web',
    description: 'Plugin gratuito para SketchUp (Windows e Mac) que transforma a vista do projeto em imagem fotorrealista em cerca de um minuto. R$ 0,99 por render, sem mensalidade.',
  },
  badge: 'Plugin para SketchUp',
  titlePrefix: 'Render com IA que',
  titleHighlight: 'não inventa nada no seu projeto',
  lead: 'O SK Render transforma a vista que está na tela do SketchUp em imagem fotorrealista em cerca de um minuto. Mesma câmera, mesmos móveis, mesmos materiais. Feito para marceneiros, designers de interiores e arquitetos que precisam mostrar ao cliente como o projeto vai ficar.',
  cta: 'Baixar o plugin grátis',
  ctaNote: 'Windows e Mac · você só paga quando renderizar',
  before: 'Vista no SketchUp',
  after: 'Render do SK Render',
  stepsHeading: 'Como funciona',
  steps: [
    { title: 'Instale o plugin', desc: 'Crie a conta com nome e WhatsApp, baixe o plugin e instale no SketchUp 2021 ou mais novo.' },
    { title: 'Posicione a vista', desc: 'Abra o projeto, escolha o ângulo e clique em Extensões › SK Render › Renderizar vista atual.' },
    { title: 'Receba a imagem', desc: 'O render é feito na nuvem e volta em cerca de um minuto. Se algo precisar de ajuste, escreva o que corrigir e gere de novo.' },
  ],
  featuresHeading: 'O que o SK Render faz',
  features: [
    { title: 'Fiel ao que você desenhou', desc: 'A imagem mantém câmera, geometria e materiais do modelo. Nada de móvel trocado ou janela inventada.' },
    { title: 'Sem placa de vídeo', desc: 'O processamento é na nuvem: funciona em qualquer computador com internet.' },
    { title: 'Fita de LED', desc: 'Marque a fita com a textura hachurada amarela e branca e ela sai como iluminação indireta.' },
    { title: 'Acabamentos de catálogo', desc: 'Vincule os materiais do SketchUp a padrões reais de MDF, revestimento e pedra.' },
  ],
  pricingHeading: 'Quanto custa',
  pricing: [
    'O plugin é gratuito.',
    'Cada render custa R$ 0,99, pago com crédito pré-pago (PIX ou cartão).',
    'Sem mensalidade: no mês em que você não renderiza, não paga nada.',
    'Render que não gerar imagem não é cobrado.',
  ],
  faqHeading: 'Perguntas frequentes',
  faq: [
    { q: 'Em quais versões do SketchUp funciona?', a: 'No SketchUp 2021 ou mais novo, para Windows e Mac. Não funciona no SketchUp para web nem no iPad.' },
    { q: 'Preciso de um computador potente?', a: 'Não. O render é feito nos nossos servidores; o seu computador só precisa abrir o SketchUp e ter internet.' },
    { q: 'Posso usar em mais de um computador?', a: 'Sim. O mesmo serial vale no computador de casa e no do escritório, e o crédito é um só.' },
    { q: 'Quem está por trás do SK Render?', a: 'A Agathas Web, empresa brasileira de tecnologia com mais de 15 anos de mercado. O pagamento é processado pelo ASAAS e o suporte é pelo nosso WhatsApp.' },
  ],
  finalHeading: 'Mostre o projeto como ele vai ficar',
  finalBody: 'Instale grátis e coloque crédito só quando tiver projeto para apresentar.',
  trademark: 'SketchUp é marca da Trimble Inc. O SK Render não é afiliado à Trimble.',
}

const es: SkRenderTextos = {
  metadata: {
    title: 'SK Render — render con IA para SketchUp, fiel al proyecto | Agathas Web',
    description: 'Plugin gratuito para SketchUp (Windows y Mac) que convierte la vista del proyecto en una imagen fotorrealista en cerca de un minuto. Pago por render, sin mensualidad.',
  },
  badge: 'Plugin para SketchUp',
  titlePrefix: 'Render con IA que',
  titleHighlight: 'no inventa nada en tu proyecto',
  lead: 'SK Render convierte la vista que tienes en la pantalla de SketchUp en una imagen fotorrealista en cerca de un minuto. La misma cámara, los mismos muebles, los mismos materiales. Hecho para carpinteros, diseñadores de interiores y arquitectos que necesitan mostrar al cliente cómo quedará el proyecto.',
  cta: 'Descargar el plugin gratis',
  ctaNote: 'Windows y Mac · solo pagas cuando renderizas',
  before: 'Vista en SketchUp',
  after: 'Render de SK Render',
  stepsHeading: 'Cómo funciona',
  steps: [
    { title: 'Instala el plugin', desc: 'Crea la cuenta con nombre y WhatsApp, descarga el plugin e instálalo en SketchUp 2021 o posterior.' },
    { title: 'Coloca la vista', desc: 'Abre el proyecto, elige el ángulo y haz clic en Extensiones › SK Render › Renderizar vista actual.' },
    { title: 'Recibe la imagen', desc: 'El render se hace en la nube y vuelve en cerca de un minuto. Si algo necesita ajuste, escribe qué corregir y genera de nuevo.' },
  ],
  featuresHeading: 'Qué hace SK Render',
  features: [
    { title: 'Fiel a lo que diseñaste', desc: 'La imagen mantiene la cámara, la geometría y los materiales del modelo. Sin muebles cambiados ni ventanas inventadas.' },
    { title: 'Sin tarjeta gráfica', desc: 'El procesamiento es en la nube: funciona en cualquier ordenador con internet.' },
    { title: 'Tiras LED', desc: 'Marca la tira con la textura rayada amarilla y blanca y saldrá como iluminación indirecta.' },
    { title: 'Acabados de catálogo', desc: 'Vincula los materiales de SketchUp a patrones reales de tableros, revestimientos y piedra.' },
  ],
  pricingHeading: 'Cuánto cuesta',
  pricing: [
    'El plugin es gratuito.',
    'Cada render cuesta R$ 0,99 (reales brasileños), pagado con crédito prepago.',
    'Sin mensualidad: el mes que no renderizas, no pagas nada.',
    'El render que no genera imagen no se cobra.',
  ],
  faqHeading: 'Preguntas frecuentes',
  faq: [
    { q: '¿En qué versiones de SketchUp funciona?', a: 'En SketchUp 2021 o posterior, para Windows y Mac. No funciona en SketchUp para web ni en iPad.' },
    { q: '¿Necesito un ordenador potente?', a: 'No. El render se hace en nuestros servidores; tu ordenador solo necesita abrir SketchUp y tener internet.' },
    { q: '¿Puedo usarlo en más de un ordenador?', a: 'Sí. El mismo serial vale en el ordenador de casa y en el de la oficina, y el crédito es uno solo.' },
    { q: '¿Quién está detrás de SK Render?', a: 'Agathas Web, empresa brasileña de tecnología con más de 15 años en el mercado. La página de compra y el pago están en portugués y en reales brasileños.' },
  ],
  finalHeading: 'Muestra el proyecto como va a quedar',
  finalBody: 'Instálalo gratis y añade crédito solo cuando tengas un proyecto que presentar.',
  trademark: 'SketchUp es una marca de Trimble Inc. SK Render no está afiliado a Trimble.',
}

const en: SkRenderTextos = {
  metadata: {
    title: 'SK Render — AI rendering for SketchUp, faithful to your design | Agathas Web',
    description: 'Free SketchUp extension (Windows and Mac) that turns the current view into a photorealistic image in about a minute. Pay per render, no subscription.',
  },
  badge: 'SketchUp extension',
  titlePrefix: 'AI rendering that',
  titleHighlight: 'changes nothing in your design',
  lead: 'SK Render turns the view on your SketchUp screen into a photorealistic image in about a minute. Same camera, same furniture, same materials. Built for cabinet makers, interior designers and architects who need to show a client what the project will look like.',
  cta: 'Get the extension for free',
  ctaNote: 'Windows and Mac · you only pay when you render',
  before: 'SketchUp view',
  after: 'SK Render result',
  stepsHeading: 'How it works',
  steps: [
    { title: 'Install the extension', desc: 'Create an account with your name and WhatsApp number, download the extension and install it in SketchUp 2021 or newer.' },
    { title: 'Position the view', desc: 'Open your project, choose the angle and click Extensions › SK Render › Render current view.' },
    { title: 'Get the image', desc: 'The render runs in the cloud and comes back in about a minute. If something needs fixing, describe it and render again.' },
  ],
  featuresHeading: 'What SK Render does',
  features: [
    { title: 'Faithful to your design', desc: 'The image keeps the camera, geometry and materials of your model. No swapped furniture, no invented windows.' },
    { title: 'No graphics card needed', desc: 'Processing happens in the cloud, so it runs on any computer with an internet connection.' },
    { title: 'LED strips', desc: 'Mark the strip with the yellow and white hatch texture and it comes out as indirect lighting.' },
    { title: 'Catalog finishes', desc: 'Link SketchUp materials to real wood panel, tile and stone patterns.' },
  ],
  pricingHeading: 'Pricing',
  pricing: [
    'The extension is free.',
    'Each render costs R$ 0.99 (Brazilian reais), paid with prepaid credit.',
    'No subscription: in a month with no renders, you pay nothing.',
    'A render that fails to produce an image is not charged.',
  ],
  faqHeading: 'Frequently asked questions',
  faq: [
    { q: 'Which SketchUp versions are supported?', a: 'SketchUp 2021 or newer, on Windows and Mac. It does not run on SketchUp for Web or iPad.' },
    { q: 'Do I need a powerful computer?', a: 'No. Rendering runs on our servers; your computer only needs to run SketchUp and be online.' },
    { q: 'Can I use it on more than one computer?', a: 'Yes. The same serial works on your home and office computers, with a single credit balance.' },
    { q: 'Who is behind SK Render?', a: 'Agathas Web, a Brazilian technology company with more than 15 years in business. The purchase page and payment are in Portuguese and in Brazilian reais.' },
  ],
  finalHeading: 'Show the project the way it will look',
  finalBody: 'Install it for free and add credit only when you have a project to present.',
  trademark: 'SketchUp is a trademark of Trimble Inc. SK Render is not affiliated with Trimble.',
}

export const SK_RENDER_TEXTOS: Record<Locale, SkRenderTextos> = { 'pt-BR': pt, es, 'en-US': en, 'en-GB': en }
