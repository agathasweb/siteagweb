# Esquema JSON de posts — `/admin/posts/import`

Fonte da verdade: [`src/lib/posts-import.ts`](../src/lib/posts-import.ts). Qualquer mudança nos tipos `PostImport`/`PostImportTranslation`/`PostImportFaq` reflete aqui.

## Formato

- **Um post:** objeto raiz `{ ... }`
- **Vários posts:** array raiz `[ {...}, {...} ]`
- **Modo:** estrito — se qualquer post falhar a validação, **nada** é criado (transação SQLite com rollback total).

## Campos do post

| Campo                  | Tipo            | Obrig. | Notas |
|------------------------|-----------------|--------|-------|
| `slug`                 | string          | ✅     | kebab-case (`[a-z0-9-]`), único, ≤ 200 chars |
| `source_locale`        | enum            | ✅     | `pt-BR` \| `es` \| `en-US` \| `en-GB` |
| `status`               | enum            |        | `draft` (default) \| `scheduled` \| `published` \| `archived` |
| `article_type`         | enum            |        | `BlogPosting` (default), `Article`, `NewsArticle`, `TechArticle`, `HowTo`, `Course`, `Recipe` |
| `category_slug`        | string \| null  |        | Deve existir em `/admin/categorias` |
| `cover_image`          | string \| null  |        | Path absoluto (ex.: `/uploads/posts/2026/...`) |
| `cover_image_width`    | number          |        | Pixels |
| `cover_image_height`   | number          |        | Pixels |
| `noindex`              | boolean         |        | Default `false` |
| `nofollow`             | boolean         |        | Default `false` |
| `featured`             | boolean         |        | Default `false` |
| `canonical_url`        | string \| null  |        | Override canonical |
| `scheduled_at`         | ISO datetime    |   ⚠️   | Obrigatório se `status="scheduled"` |
| `video_url`            | string \| null  |        | URL de embed |
| `video_duration_sec`   | number          |        | Schema.org VideoObject |
| `video_thumbnail`      | string \| null  |        | URL |
| `tags`                 | string[]        |        | Reutiliza tags existentes (slugifica nomes) |
| `translations`         | Translation[]   | ✅     | Mín. 1 entrada, deve incluir `source_locale` |
| `faqs`                 | Faq[]           |        | Opcional |

## Translation

| Campo                  | Tipo            | Obrig. | Notas |
|------------------------|-----------------|--------|-------|
| `locale`               | enum            | ✅     | Mesmos 4 locales |
| `title`                | string          | ✅     | |
| `content`              | string          | ✅     | Markdown **ou** HTML — sanitizado com DOMPurify no import |
| `excerpt`              | string \| null  |        | 100-150 chars ideal |
| `meta_title`           | string \| null  |        | ≤ 60 chars |
| `meta_description`     | string \| null  |        | 140-160 chars |
| `og_title`             | string \| null  |        | |
| `og_description`       | string \| null  |        | |
| `twitter_card_type`    | enum            |        | `summary` \| `summary_large_image` (default) |
| `focus_keyword`        | string \| null  |        | Para SEO score |
| `secondary_keywords`   | string \| null  |        | CSV: `"keyword1, keyword2"` |
| `cover_image_alt`      | string \| null  |        | Alt da capa |

`reading_time_min` e `word_count` são **calculados automaticamente** a partir do `content`.

## FAQ

Duas formas:

```json
// Single-locale shorthand (aplica ao source_locale)
{ "sort_order": 0, "question": "P?", "answer": "R." }

// Multi-locale (preferido)
{
  "sort_order": 0,
  "translations": [
    { "locale": "pt-BR", "question": "P?", "answer": "R." },
    { "locale": "en-US", "question": "Q?", "answer": "A." }
  ]
}
```

## Exemplo mínimo (1 post)

```json
{
  "slug": "como-medir-roi-de-trafego-pago",
  "source_locale": "pt-BR",
  "status": "draft",
  "article_type": "BlogPosting",
  "category_slug": "marketing-digital",
  "tags": ["trafego-pago", "roi", "metricas"],
  "translations": [
    {
      "locale": "pt-BR",
      "title": "Como Medir o ROI Real de Tráfego Pago em 2026",
      "excerpt": "Guia passo a passo com fórmulas e exemplos para calcular o retorno real além do ROAS.",
      "content": "## Por que ROAS não basta\n\nROAS mede receita...\n\n## Fórmula completa\n\n...",
      "meta_title": "Como Medir ROI de Tráfego Pago (2026) — Guia Prático",
      "meta_description": "Aprenda a calcular o ROI real além do ROAS. Fórmulas, exemplos e armadilhas comuns que destroem campanhas.",
      "focus_keyword": "ROI tráfego pago",
      "secondary_keywords": "ROAS, CAC, LTV, performance marketing, atribuição",
      "cover_image_alt": "Dashboard de métricas de tráfego pago"
    }
  ],
  "faqs": [
    {
      "sort_order": 0,
      "translations": [
        {
          "locale": "pt-BR",
          "question": "Qual a diferença entre ROAS e ROI?",
          "answer": "ROAS mede só a receita gerada por R$1 gasto em mídia (4× = R$4 por R$1). ROI considera todos os custos — produto, equipe, plataforma, impostos. Um ROAS de 4× pode virar ROI negativo se a margem for baixa..."
        }
      ]
    }
  ]
}
```

## Exemplo lote (3 posts)

```json
[
  { "slug": "post-1", "source_locale": "pt-BR", "translations": [{ "locale": "pt-BR", "title": "...", "content": "..." }] },
  { "slug": "post-2", "source_locale": "pt-BR", "translations": [{ "locale": "pt-BR", "title": "...", "content": "..." }] },
  { "slug": "post-3", "source_locale": "pt-BR", "translations": [{ "locale": "pt-BR", "title": "...", "content": "..." }] }
]
```

## Validações que rodam no import

1. Tipos e formatos (acima)
2. `slug` não conflita com nenhum post existente
3. `slug` não duplica dentro do mesmo lote
4. `category_slug`, quando informado, existe
5. `source_locale` está presente em `translations[]`
6. Sem `locale` duplicado em `translations[]`
7. `scheduled_at` é ISO válido e obrigatório quando `status="scheduled"`
8. `twitter_card_type`, `article_type`, `status` no allowlist

Erros retornam JSONPath-like (`$.translations[0].title`) com mensagem.

## Geração assistida (recomendado)

No Claude Code dentro deste repo, use o slash command:

```
/post <briefing curto: tema, palavra-chave, ângulo>
```

O agente lê este schema, lê seu perfil do SQLite, lê posts publicados como referência de voz, e gera um JSON pronto para colar em `/admin/posts/import`.
