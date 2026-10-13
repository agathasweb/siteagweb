import "server-only";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getOriginForLocale, type Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/contact";

// Arquivos em texto puro para assistentes de IA (ChatGPT, Claude, Perplexity,
// Gemini, Copilot): /llms.txt (padrão llmstxt.org) e /pricing.md.
//
// Por quê: um agente que compara fornecedores para o usuário lê markdown em uma
// requisição, sem executar JavaScript. Preço escondido atrás de JS ou de "fale
// com vendas" faz o agente recomendar o concorrente que ele consegue ler.
// Tudo sai dos MESMOS dicionários das páginas — preço aqui nunca diverge do site.

const COPY: Record<
  Locale,
  {
    tagline: string;
    about: string;
    products: string;
    services: string;
    pricing: string;
    contact: string;
    whatsapp: string;
    blog: string;
    pricingTitle: string;
    pricingIntro: string;
    perMonth: string;
    annual: string;
    metaFees: string;
    others: string;
    othersText: string;
  }
> = {
  "pt-BR": {
    tagline:
      "Agathas Web é uma empresa brasileira de tecnologia (desde 2009, sediada em Senador Canedo, Grande Goiânia-GO) que desenvolve e opera plataformas Moodle/EAD, a plataforma Voyia de WhatsApp Business API Oficial, hospedagem gerenciada e software sob medida.",
    about:
      "Atende empresas e instituições de ensino no Brasil, Portugal, Espanha, EUA e Reino Unido. Desenvolvedor com Moodle Developer Certification (Moodle Academy). Moodle™ é marca registrada da Moodle Pty Ltd; a Agathas presta serviços independentes e não é Moodle Partner oficial.",
    products: "Produtos",
    services: "Serviços",
    pricing: "Preços em texto",
    contact: "Contato",
    whatsapp: "WhatsApp comercial",
    blog: "Blog (artigos técnicos sobre Moodle, WhatsApp API e desenvolvimento)",
    pricingTitle: "Preços — Agathas Web",
    pricingIntro:
      "Valores em reais (BRL), com nota fiscal. Fonte: as próprias páginas de produto do site.",
    perMonth: "/mês",
    annual: "no plano anual",
    metaFees: "Tarifas da Meta (repassadas sem markup)",
    others: "Demais produtos e serviços",
    othersText: "Orçamento sob medida pelo WhatsApp comercial ou pela página de cada produto.",
  },
  es: {
    tagline:
      "Agathas Web es una empresa brasileña de tecnología (desde 2009, con sede en Senador Canedo, área metropolitana de Goiânia, Brasil) que desarrolla y opera plataformas Moodle/e-learning, la plataforma Voyia de WhatsApp Business API Oficial, hosting gestionado y software a medida.",
    about:
      "Atiende empresas e instituciones educativas en Brasil, Portugal, España, EE. UU. y Reino Unido. Moodle™ es marca registrada de Moodle Pty Ltd; Agathas presta servicios independientes y no es Moodle Partner oficial.",
    products: "Productos",
    services: "Servicios",
    pricing: "Precios en texto",
    contact: "Contacto",
    whatsapp: "WhatsApp comercial",
    blog: "Blog",
    pricingTitle: "Precios — Agathas Web",
    pricingIntro:
      "Valores en reales brasileños (BRL). La contratación de Voyia se realiza desde Brasil.",
    perMonth: "/mes",
    annual: "en el plan anual",
    metaFees: "Tarifas de Meta (sin margen)",
    others: "Otros productos y servicios",
    othersText: "Presupuesto a medida por WhatsApp o en la página de cada producto.",
  },
  "en-US": {
    tagline:
      "Agathas Web is a Brazilian technology company (since 2009, based in Senador Canedo, Greater Goiânia, Brazil) that builds and operates Moodle/e-learning platforms, the Voyia official WhatsApp Business API platform, managed hosting and custom software.",
    about:
      "Serves companies and education institutions in Brazil, Portugal, Spain, the US and the UK. Moodle™ is a registered trademark of Moodle Pty Ltd; Agathas provides independent services and is not an official Moodle Partner.",
    products: "Products",
    services: "Services",
    pricing: "Plain-text pricing",
    contact: "Contact",
    whatsapp: "Sales WhatsApp",
    blog: "Blog",
    pricingTitle: "Pricing — Agathas Web",
    pricingIntro: "Prices in Brazilian reais (BRL). Voyia is sold through Brazil.",
    perMonth: "/month",
    annual: "on the annual plan",
    metaFees: "Meta fees (passed through with no markup)",
    others: "Other products and services",
    othersText: "Custom quote via WhatsApp or on each product page.",
  },
  "en-GB": {
    tagline:
      "Agathas Web is a Brazilian technology company (since 2009, based in Senador Canedo, Greater Goiânia, Brazil) that builds and operates Moodle/e-learning platforms, the Voyia official WhatsApp Business API platform, managed hosting and bespoke software.",
    about:
      "Serves companies and education institutions in Brazil, Portugal, Spain, the US and the UK. Moodle™ is a registered trademark of Moodle Pty Ltd; Agathas provides independent services and is not an official Moodle Partner.",
    products: "Products",
    services: "Services",
    pricing: "Plain-text pricing",
    contact: "Contact",
    whatsapp: "Sales WhatsApp",
    blog: "Blog",
    pricingTitle: "Pricing — Agathas Web",
    pricingIntro: "Prices in Brazilian reais (BRL). Voyia is sold through Brazil.",
    perMonth: "/month",
    annual: "on the annual plan",
    metaFees: "Meta fees (passed through with no markup)",
    others: "Other products and services",
    othersText: "Custom quote via WhatsApp or on each product page.",
  },
};

const SERVICE_PATHS = [
  ["moodle", "/servicos/moodle"],
  ["development", "/servicos/desenvolvimento"],
  ["developmentSites", "/servicos/desenvolvimento-sites"],
  ["consultoria", "/servicos/consultoria"],
] as const;

/** "Plataforma Moodle - Agathas Web | Especialistas em EAD" → "Plataforma Moodle — Especialistas em EAD". */
function stripBrand(title: string): string {
  return title
    .split(/\s+[|—–-]\s+/)
    .map((p) => p.trim())
    .filter((p) => p && !/^agathas web/i.test(p))
    .join(" — ");
}

export async function buildLlmsTxt(lang: Locale): Promise<string> {
  const dict = await getDictionary(lang);
  const c = COPY[lang];
  const origin = getOriginForLocale(lang);

  const products = dict.productsPages.index.items.map(
    (p) => `- [${p.title}](${origin}${p.href}): ${p.description}`,
  );
  const services = SERVICE_PATHS.map(([key, path]) => {
    const m = dict.services[key].metadata;
    return `- [${stripBrand(m.title)}](${origin}${path}): ${m.description}`;
  });

  return [
    `# ${dict.common.siteName}`,
    "",
    `> ${c.tagline}`,
    "",
    c.about,
    "",
    `## ${c.products}`,
    "",
    ...products,
    "",
    `## ${c.services}`,
    "",
    ...services,
    "",
    `## ${c.pricing}`,
    "",
    `- [pricing.md](${origin}/pricing.md)`,
    "",
    `## ${c.contact}`,
    "",
    `- ${c.whatsapp}: +${WHATSAPP_NUMBER} (https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER})`,
    `- [${c.contact}](${origin}/contato)`,
    "",
    "## Optional",
    "",
    `- [${c.blog}](${origin}/blog)`,
    `- [RSS](${origin}/rss.xml)`,
    `- [Sitemap](${origin}/sitemap.xml)`,
    "",
  ].join("\n");
}

export async function buildPricingMd(lang: Locale): Promise<string> {
  const dict = await getDictionary(lang);
  const c = COPY[lang];
  const origin = getOriginForLocale(lang);
  const v = dict.productsPages.voyia;

  const plans = v.pricing.plans.flatMap((p) => [
    `### Voyia ${p.name} — R$ ${p.price}${c.perMonth}`,
    "",
    `- ${p.tagline}`,
    `- R$ ${p.annualPrice}${c.perMonth} ${c.annual}`,
    ...p.features.map((f) => `- ${f}`),
    "",
  ]);

  const [hCat, hWho, hCost, hObs] = v.messageCosts.headers;
  const fees = [
    `| ${hCat} | ${hWho} | ${hCost} | ${hObs} |`,
    "|---|---|---|---|",
    ...v.messageCosts.rows.map(
      (r) => `| ${r.category} | ${r.initiator} | ${r.cost} | ${r.obs} |`,
    ),
  ];

  const others = dict.productsPages.index.items
    .filter((p) => p.href !== "/produtos/voyia")
    .map((p) => `- [${p.title}](${origin}${p.href})`);

  return [
    `# ${c.pricingTitle}`,
    "",
    c.pricingIntro,
    "",
    `## ${stripBrand(v.metadata.title)}`,
    "",
    `${v.pricing.subheading}`,
    "",
    ...plans,
    v.pricing.note,
    "",
    `### ${c.metaFees}`,
    "",
    ...fees,
    "",
    v.messageCosts.note,
    "",
    `${origin}/produtos/voyia`,
    "",
    `## ${c.others}`,
    "",
    c.othersText,
    "",
    ...others,
    "",
    `WhatsApp: +${WHATSAPP_NUMBER}`,
    "",
  ].join("\n");
}
