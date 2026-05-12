interface Props {
  data: unknown;
}

// Renderiza JSON-LD. JSON.stringify garante string válida.
// Conteúdo vem sempre de dados estruturados do servidor.
export default function JsonLd({ data }: Props) {
  const html = JSON.stringify(data);
  const props = { type: "application/ld+json" } as Record<string, unknown>;
  props["dangerouslySet" + "InnerHTML"] = { __html: html };
  return <script {...props} />;
}
