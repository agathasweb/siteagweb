import Link from "next/link";
import ImportForm from "./ImportForm";

export const metadata = {
  title: "Importar posts (JSON) | Painel Admin",
  robots: { index: false, follow: false },
};

export default function ImportPostsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin/posts"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar para Posts
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Importar posts via JSON</h1>
      <p className="text-gray-400 mb-8">
        Cole o JSON ou faça upload de um arquivo <code className="text-voyia-blue">.json</code>.
        Aceita um único post ou um array. Use a aba <strong>Lote</strong> para arrastar
        vários arquivos e processá-los numa fila, um a um. Modo <strong>estrito</strong>:
        se qualquer post falhar na validação, nenhum daquele arquivo é criado (no lote, cada
        arquivo é independente).
      </p>

      <details className="bg-voyia-gray rounded-2xl border border-gray-700 p-5 mb-6 text-sm">
        <summary className="cursor-pointer text-white font-semibold">
          📖 Esquema do JSON (clique para expandir)
        </summary>
        <pre className="mt-4 text-xs text-gray-300 overflow-x-auto whitespace-pre">{`{
  "slug": "meu-post",                    // [obrigatório] lowercase, dígitos, hífens
  "source_locale": "pt-BR",              // [obrigatório] pt-BR | es | en-US | en-GB
  "status": "draft",                     // draft | scheduled | published | archived
  "article_type": "BlogPosting",         // BlogPosting | Article | NewsArticle | TechArticle | HowTo | Course | Recipe
  "category_slug": "marketing-digital",  // opcional — deve existir em /admin/categorias
  "cover_image": "/uploads/posts/...",   // opcional
  "cover_image_width": 1600,
  "cover_image_height": 900,
  "noindex": false,
  "nofollow": false,
  "featured": false,
  "canonical_url": null,
  "scheduled_at": null,                  // ISO datetime — obrigatório se status="scheduled"
  "video_url": null,
  "video_duration_sec": null,
  "video_thumbnail": null,
  "tags": ["tag-1", "tag-2"],
  "translations": [                      // [obrigatório] mínimo 1, com source_locale incluído
    {
      "locale": "pt-BR",
      "title": "Título do post",         // [obrigatório]
      "content": "# Markdown ou HTML",   // [obrigatório] — sanitizado no import
      "excerpt": "Resumo curto",
      "meta_title": "SEO ≤ 60 chars",
      "meta_description": "SEO ≤ 160 chars",
      "og_title": "Open Graph title",
      "og_description": "OG description",
      "twitter_card_type": "summary_large_image",
      "focus_keyword": "palavra-chave",
      "secondary_keywords": "lsi, related",
      "cover_image_alt": "Descrição da capa"
    }
  ],
  "faqs": [                              // opcional
    {
      "sort_order": 0,
      "translations": [
        { "locale": "pt-BR", "question": "P?", "answer": "R." }
      ]
    }
  ]
}`}</pre>
        <p className="mt-3 text-xs text-gray-400">
          <strong>Para múltiplos posts:</strong> envolva em array{" "}
          <code className="text-voyia-blue">[ {`{...}`}, {`{...}`} ]</code>. Tudo é
          criado numa única transação (rollback se algo falhar).
        </p>
        <p className="mt-2 text-xs text-gray-400">
          <strong>Dica:</strong> use o slash command{" "}
          <code className="text-voyia-blue">/post</code> no Claude Code para gerar JSON
          otimizado pronto pra colar aqui.
        </p>
      </details>

      <ImportForm />
    </div>
  );
}
