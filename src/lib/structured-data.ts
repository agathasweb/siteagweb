import { getOriginForLocale, type Locale } from "@/lib/i18n";

// Dados estruturados (schema.org) das páginas de produto e serviço.
//
// Buscadores e assistentes de IA (ChatGPT, Perplexity, Gemini, Copilot) leem o
// JSON-LD para entender O QUE a página oferece, de QUEM é, quanto custa e quais
// perguntas ela responde. Sem ele, a página é só texto solto — e perde a citação
// para o concorrente que declara isso de forma explícita.
//
// Tudo sai do conteúdo que a própria página já renderiza (FAQ, preços), para o
// JSON-LD nunca prometer algo que o visitante não vê.

type FaqItem = { q: string; a: string };

type Offer = {
  name: string;
  /** Valor mensal em BRL. */
  price: number;
  description?: string;
};

type Section = "produtos" | "servicos";

const SECTION_LABEL: Record<Locale, Record<Section, string>> = {
  "pt-BR": { produtos: "Produtos", servicos: "Serviços" },
  es: { produtos: "Productos", servicos: "Servicios" },
  "en-US": { produtos: "Products", servicos: "Services" },
  "en-GB": { produtos: "Products", servicos: "Services" },
};

const HOME_LABEL: Record<Locale, string> = {
  "pt-BR": "Início",
  es: "Inicio",
  "en-US": "Home",
  "en-GB": "Home",
};

/** Id estável da organização — a home declara o nó completo com este @id. */
export function organizationId(lang: Locale): string {
  return `${getOriginForLocale(lang)}/#organization`;
}

/**
 * "Voyia — Plataforma WhatsApp Business API Oficial | Agathas Web" vira
 * nome "Voyia" e categoria "Plataforma WhatsApp Business API Oficial".
 * O sufixo da marca nunca é categoria.
 */
function splitTitle(title: string): { name: string; category: string } {
  const parts = title
    .split(/\s+[|—–-]\s+/)
    .map((p) => p.trim())
    .filter((p) => p && !/^agathas web/i.test(p));
  const name = parts[0] ?? title;
  return { name, category: parts[1] ?? name };
}

type PageSchemaInput = {
  lang: Locale;
  /** Caminho da página (ex.: "/produtos/voyia"). */
  path: string;
  /** Título da página (o mesmo do <title>), já traduzido. */
  title: string;
  description: string;
  /** "Service" para serviço/hospedagem; "SoftwareApplication" para SaaS. */
  kind: "Service" | "SoftwareApplication";
  faq?: FaqItem[];
  offers?: Offer[];
};

export function pageSchemas({
  lang,
  path,
  title,
  description,
  kind,
  faq,
  offers,
}: PageSchemaInput) {
  const origin = getOriginForLocale(lang);
  const url = `${origin}${path}`;
  const section: Section = path.startsWith("/produtos") ? "produtos" : "servicos";
  const org = { "@id": organizationId(lang) };
  const { name, category } = splitTitle(title);

  const offerNodes = offers?.map((o) => ({
    "@type": "Offer",
    name: o.name,
    ...(o.description ? { description: o.description } : {}),
    price: o.price.toFixed(2),
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
    url,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: o.price.toFixed(2),
      priceCurrency: "BRL",
      unitCode: "MON",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
    },
  }));

  const main =
    kind === "SoftwareApplication"
      ? {
          "@type": "SoftwareApplication",
          "@id": `${url}#software`,
          name,
          description,
          url,
          applicationCategory: "BusinessApplication",
          applicationSubCategory: category,
          operatingSystem: "Web, iOS, Android",
          inLanguage: lang,
          publisher: org,
          provider: org,
          ...(offerNodes?.length ? { offers: offerNodes } : {}),
        }
      : {
          "@type": "Service",
          "@id": `${url}#service`,
          name,
          description,
          url,
          serviceType: category,
          inLanguage: lang,
          provider: org,
          areaServed: [
            { "@type": "Country", name: "Brasil" },
            { "@type": "Country", name: "Portugal" },
            { "@type": "Country", name: "España" },
            { "@type": "Country", name: "United States" },
            { "@type": "Country", name: "United Kingdom" },
          ],
          ...(offerNodes?.length ? { offers: offerNodes } : {}),
        };

  const graph: Record<string, unknown>[] = [
    // Nó mínimo da organização: a página se sustenta sozinha para quem não
    // passou pela home (o nó completo, com logo e redes, fica lá).
    { "@type": "Organization", "@id": org["@id"], name: "Agathas Web", url: origin },
    main,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: HOME_LABEL[lang], item: `${origin}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: SECTION_LABEL[lang][section],
          item: `${origin}/${section}`,
        },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  if (faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      inLanguage: lang,
      about: { "@id": main["@id"] },
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
