"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createPostAction } from "../actions";
import Tooltip from "@/components/admin/Tooltip";
import CharCounter from "@/components/admin/CharCounter";
import SerpPreview from "@/components/admin/SerpPreview";
import SocialCardPreview from "@/components/admin/SocialCardPreview";
import ImageUploader, { type UploadedImage } from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ReadabilityPanel from "@/components/admin/ReadabilityPanel";
import InternalLinkPanel from "@/components/admin/InternalLinkPanel";
import { countWords, readingTimeMinutes } from "@/lib/content-stats";
import type { Locale } from "@/lib/i18n";

const SOURCE_LOCALES = [
  { value: "pt-BR", label: "Português (Brasil) — agathas.com.br" },
  { value: "es", label: "Español — agathas.es" },
  { value: "en-US", label: "English (US) — agathasweb.com" },
  { value: "en-GB", label: "English (UK) — uk.agathasweb.com" },
];

const ARTICLE_TYPES = [
  { value: "BlogPosting", label: "BlogPosting — padrão para posts de blog" },
  { value: "Article", label: "Article — artigo genérico" },
  { value: "NewsArticle", label: "NewsArticle — notícia/jornalismo" },
  { value: "TechArticle", label: "TechArticle — tutorial técnico/documentação" },
];

const TWITTER_CARDS = [
  { value: "summary_large_image", label: "Imagem grande (recomendado para posts visuais)" },
  { value: "summary", label: "Resumo compacto (texto + thumbnail)" },
];

const DOMAIN_BY_LOCALE: Record<string, string> = {
  "pt-BR": "agathas.com.br",
  es: "agathas.es",
  "en-US": "agathasweb.com",
  "en-GB": "uk.agathasweb.com",
};

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface Props {
  categories: Category[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function NewPostForm({ categories }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [sourceLocale, setSourceLocale] = useState("pt-BR");
  const [status, setStatus] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [featured, setFeatured] = useState(false);
  const [articleType, setArticleType] = useState("BlogPosting");
  const [tags, setTags] = useState("");

  // Cover image
  const [coverImage, setCoverImage] = useState<UploadedImage | null>(null);
  const [coverImageAlt, setCoverImageAlt] = useState("");

  // Content
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Social
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [twitterCardType, setTwitterCardType] = useState("summary_large_image");

  // Advanced
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [nofollow, setNofollow] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");

  // Auto-derive slug from title until user manually edits slug
  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
    if (!metaTitle.trim()) {
      // suggest meta_title = title (user can override)
    }
  }

  const stats = useMemo(() => {
    const words = countWords(content);
    const minutes = readingTimeMinutes(content);
    return { words, minutes };
  }, [content]);

  const domain = DOMAIN_BY_LOCALE[sourceLocale] ?? "agathas.com.br";
  const serpTitle = metaTitle || title;
  const serpDesc = metaDescription || excerpt;
  const socialTitle = ogTitle || metaTitle || title;
  const socialDesc = ogDescription || metaDescription || excerpt;
  const socialImg = coverImage?.path_large ?? coverImage?.path ?? null;

  // Focus keyword check
  const focusOk = useMemo(() => {
    if (!focusKeyword.trim()) return null;
    const kw = focusKeyword.toLowerCase();
    return {
      inTitle: title.toLowerCase().includes(kw),
      inSlug: slug.toLowerCase().includes(slugify(kw)),
      inMetaDesc: metaDescription.toLowerCase().includes(kw),
      inContent: content.toLowerCase().includes(kw),
      inFirstParagraph: content.slice(0, 200).toLowerCase().includes(kw),
    };
  }, [focusKeyword, title, slug, metaDescription, content]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    // Inject computed values that aren't in regular inputs
    if (coverImage) {
      form.set("cover_image", coverImage.path);
      form.set("cover_image_width", String(coverImage.width));
      form.set("cover_image_height", String(coverImage.height));
    }

    startTransition(async () => {
      try {
        await createPostAction(form);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar";
        if (msg.includes("NEXT_REDIRECT")) throw err;
        setError(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* 1. Identificação */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">1. Identificação do post</h2>
          <p className="text-sm text-gray-400 mt-1">Como o Google e os 4 domínios identificam este conteúdo.</p>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Título (H1)
            <Tooltip text="Título principal do post (tag <h1>). 50-60 caracteres é o sweet spot para Google e leitores. Inclua a palavra-chave principal e mantenha-o atrativo. O Google geralmente exibe os primeiros 60 caracteres." href="https://developers.google.com/search/docs/appearance/title-link" />
          </label>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ex.: Por que ter um site multi-idioma em 2026"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Aparece no topo do post, em listas e como fallback para meta_title.</span>
            <CharCounter value={title} min={20} max={70} ideal={[40, 60]} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slug (URL)
            <Tooltip text="Parte final da URL: /blog/<slug>. Use apenas minúsculas, números e hífens. Mantenha curto (3-5 palavras) e descritivo. Inclua a palavra-chave principal. Evite acentos, espaços e palavras vazias como 'o', 'a', 'de'." />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono whitespace-nowrap">https://{domain}/blog/</span>
            <input
              name="slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>
          {!slugTouched && title && (
            <p className="text-xs text-gray-500 mt-1">↑ Gerado automaticamente a partir do título. Pode editar.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Idioma de origem
              <Tooltip text="Em qual idioma você está escrevendo? Este vira o conteúdo canônico — depois você usa o botão 'Traduzir com IA' nas outras abas para gerar as 3 outras versões. Cada idioma é servido por um domínio diferente em produção." />
            </label>
            <select
              name="source_locale"
              value={sourceLocale}
              onChange={(e) => setSourceLocale(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            >
              {SOURCE_LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
              <Tooltip text="Categoria principal do post (1 só). Ajuda a estruturar o blog, gera breadcrumb com schema BreadcrumbList e melhora a discoverability. Categorias devem ser amplas (3-8 no total)." />
            </label>
            <select
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            >
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Ainda não há categorias. Você pode adicionar depois em /admin/categorias.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags
            <Tooltip text="Termos específicos do post separados por vírgula (5-10 ideal). Diferente de categoria, tags são granulares (ex: 'next.js', 'tailwind', 'ssr'). Geram páginas de listagem por tag e ajudam relacionamento entre posts." />
          </label>
          <input
            name="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="moodle, ead, plataforma educacional, lms"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          {tags && (
            <p className="text-xs text-gray-400 mt-1">
              {tags.split(",").filter((t) => t.trim()).length} tag(s) será(ão) criada(s)/vinculada(s).
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de artigo (Schema.org)
            <Tooltip text="JSON-LD schema.org @type. BlogPosting é o padrão para posts de blog. NewsArticle se for jornalismo (Google News). TechArticle para tutoriais técnicos. Article para conteúdo genérico." href="https://schema.org/Article" />
          </label>
          <select
            name="article_type"
            value={articleType}
            onChange={(e) => setArticleType(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            {ARTICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* 2. Publicação */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">2. Publicação</h2>
          <p className="text-sm text-gray-400 mt-1">Quando e como o post fica visível.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
              <Tooltip text="Rascunho: não aparece no site. Agendado: publica automaticamente na data abaixo. Publicado: visível imediatamente. Arquivado: removido do site mas mantido no banco." />
            </label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            >
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="published">Publicar agora</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data agendada
              <Tooltip text="Quando o post deve ir ao ar (UTC). Só relevante se Status = Agendado. O cron de publicação roda a cada hora." />
            </label>
            <input
              name="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={status !== "scheduled"}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="mt-1 rounded border-gray-500 text-voyia-blue focus:ring-voyia-blue"
          />
          <span className="text-sm">
            <span className="text-white font-medium">Post em destaque</span>
            <Tooltip text="Aparece na home, no topo da listagem do blog e é incluído no feed RSS prioritário. Use com moderação — 1-3 posts em destaque por vez." />
            <span className="block text-xs text-gray-400 mt-0.5">
              Será exibido em posição privilegiada na home e no /blog
            </span>
          </span>
        </label>
      </section>

      {/* 3. Imagem de capa */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">
            3. Imagem de capa
            <Tooltip text="Imagem principal do post. Usada como hero, og:image (compartilhamento social) e twitter:image. Dimensão recomendada: 1200×630px (proporção 1.91:1), mínimo 600×315. Será convertida automaticamente para WebP em 4 tamanhos." href="https://developers.facebook.com/docs/sharing/webmasters/images" />
          </h2>
          <p className="text-sm text-gray-400 mt-1">JPEG/PNG/WebP/AVIF/GIF até 12MB → 4 variantes WebP (orig, 1600, 800, 400).</p>
        </header>

        <ImageUploader
          postSlug={slug || title}
          value={coverImage}
          onChange={setCoverImage}
          label="Imagem de capa"
        />

        {coverImage && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Texto alternativo (alt)
              <Tooltip text="Descrição da imagem para leitores de tela (acessibilidade WCAG) e SEO de imagens. Não comece com 'imagem de'. Seja específico: descreva o que é mostrado em 8-15 palavras. Pode incluir a palavra-chave se natural." href="https://www.w3.org/WAI/tutorials/images/" />
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              name="cover_image_alt"
              type="text"
              required
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder="Ex.: Time discutindo arquitetura multi-domínio numa lousa com diagrama"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Será traduzido automaticamente quando você gerar as outras versões.</span>
              <CharCounter value={coverImageAlt} min={10} max={125} ideal={[40, 100]} />
            </div>
          </div>
        )}
      </section>

      {/* 4. Conteúdo */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">4. Conteúdo</h2>
            <p className="text-sm text-gray-400 mt-1">O texto do post em Markdown ou HTML.</p>
          </div>
          <div className="text-xs text-gray-400 text-right">
            <p>
              <span className="text-white font-medium">{stats.words}</span> palavras
            </p>
            <p>
              ~<span className="text-white font-medium">{stats.minutes}</span> min de leitura
            </p>
          </div>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Palavra-chave principal (focus keyword)
            <Tooltip text="A frase ou termo principal que você quer rankear no Google. Use-a no título (H1), em pelo menos um H2, na meta description, no slug, no alt da imagem de capa, e no primeiro parágrafo. Não force — use naturalmente." />
          </label>
          <input
            name="focus_keyword"
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            placeholder="Ex.: hospedagem moodle"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          {focusKeyword && focusOk && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              <span className={focusOk.inTitle ? "text-green-300" : "text-yellow-300"}>
                {focusOk.inTitle ? "✓" : "○"} no título
              </span>
              <span className={focusOk.inSlug ? "text-green-300" : "text-yellow-300"}>
                {focusOk.inSlug ? "✓" : "○"} no slug
              </span>
              <span className={focusOk.inMetaDesc ? "text-green-300" : "text-yellow-300"}>
                {focusOk.inMetaDesc ? "✓" : "○"} na meta description
              </span>
              <span className={focusOk.inFirstParagraph ? "text-green-300" : "text-yellow-300"}>
                {focusOk.inFirstParagraph ? "✓" : "○"} nos primeiros 200 chars
              </span>
              <span className={focusOk.inContent ? "text-green-300" : "text-yellow-300"}>
                {focusOk.inContent ? "✓" : "○"} no conteúdo
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Resumo (excerpt)
            <Tooltip text="Resumo do post em 1-2 frases. Usado em listagens do blog, em previews de compartilhamento (fallback de og:description) e como teaser em RSS. Mantenha conciso e atrativo — 120-160 caracteres." />
          </label>
          <textarea
            name="excerpt"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Em 1-2 frases, o que o leitor vai aprender com este post?"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <div className="flex justify-end mt-1">
            <CharCounter value={excerpt} min={80} max={200} ideal={[120, 160]} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Conteúdo
            <Tooltip text="Editor WYSIWYG com toolbar. Use H2 e H3 (não pule níveis). Botão 🖼️ na toolbar faz upload e converte automaticamente. Frases curtas, parágrafos de 2-4 linhas, listas e tabelas ajudam SEO + AEO (LLM citations). Inclua dados, números e fontes citáveis." />
            <span className="text-red-400 ml-1">*</span>
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            postSlug={slug || title}
            placeholder="Comece com um parágrafo de abertura que responde à pergunta principal — isso é ótimo para AI search."
          />
          <input type="hidden" name="content" value={content} />
          <p className="text-xs text-gray-500 mt-2">
            HTML é sanitizado (DOMPurify) antes de salvar. Imagens viram WebP automaticamente.
            Ideal para blog: 800-2500 palavras.
          </p>
        </div>

        <ReadabilityPanel content={content} />

        <InternalLinkPanel postId={null} locale={sourceLocale as Locale} />
      </section>

      {/* 5. SEO + SERP preview */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">5. SEO básico</h2>
          <p className="text-sm text-gray-400 mt-1">Como o post aparece nos resultados de busca do Google.</p>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Meta título
            <Tooltip text="Título mostrado nos resultados do Google e na aba do navegador. Pode (e às vezes deve) ser diferente do H1: mais curto e otimizado para CTR. Limite ~60 chars. Se vazio, usa o H1." href="https://developers.google.com/search/docs/appearance/title-link" />
          </label>
          <input
            name="meta_title"
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder={title || "Deixe vazio para usar o H1"}
            maxLength={80}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <div className="flex justify-end mt-1">
            <CharCounter value={metaTitle} max={60} ideal={[40, 60]} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Meta description
            <Tooltip text="Resumo de 120-160 caracteres que aparece abaixo do título nos resultados do Google. Não é fator de ranking direto, mas afeta MUITO o CTR. Inclua a palavra-chave (Google pode bold), tenha um benefício claro e termine com um CTA implícito ('descubra como', 'aprenda a')." href="https://developers.google.com/search/docs/appearance/snippet" />
          </label>
          <textarea
            name="meta_description"
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Descrição que aparecerá nos resultados do Google. 120-160 caracteres ideal."
            maxLength={180}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <div className="flex justify-end mt-1">
            <CharCounter value={metaDescription} min={120} max={160} ideal={[140, 160]} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Como aparecerá no Google</p>
          <SerpPreview title={serpTitle} description={serpDesc} domain={domain} slug={slug} />
        </div>
      </section>

      {/* 6. Social */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">6. Redes sociais (Open Graph + Twitter)</h2>
          <p className="text-sm text-gray-400 mt-1">Como o post aparece ao ser compartilhado.</p>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            og:title
            <Tooltip text="Título usado em compartilhamento (Facebook, LinkedIn, WhatsApp, Slack). Pode ser mais 'caça-clique' que o meta_title. Limite ~70 chars. Se vazio, usa meta_title → H1." href="https://ogp.me/" />
          </label>
          <input
            name="og_title"
            type="text"
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
            placeholder={metaTitle || title || "Deixe vazio para usar meta título ou H1"}
            maxLength={95}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <div className="flex justify-end mt-1">
            <CharCounter value={ogTitle} max={70} ideal={[40, 70]} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            og:description
            <Tooltip text="Descrição em compartilhamentos. Mais 'social' e emocional que a meta_description. Limite ~200 chars (Facebook), 160 (LinkedIn). Se vazio, usa meta_description → excerpt." />
          </label>
          <textarea
            name="og_description"
            rows={2}
            value={ogDescription}
            onChange={(e) => setOgDescription(e.target.value)}
            placeholder={metaDescription || excerpt || "Deixe vazio para usar meta description ou excerpt"}
            maxLength={250}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
          <div className="flex justify-end mt-1">
            <CharCounter value={ogDescription} max={200} ideal={[120, 200]} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Twitter Card
            <Tooltip text="summary_large_image (recomendado): imagem grande estilo banner. summary: thumbnail pequeno ao lado do texto. Para Twitter/X funcionar, a conta @agathasweb precisa estar configurada como twitter:site nos meta tags." href="https://developer.twitter.com/en/docs/twitter-for-websites/cards" />
          </label>
          <select
            name="twitter_card_type"
            value={twitterCardType}
            onChange={(e) => setTwitterCardType(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            {TWITTER_CARDS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Preview Facebook / LinkedIn / WhatsApp</p>
            <SocialCardPreview
              variant="facebook"
              title={socialTitle}
              description={socialDesc}
              image={socialImg}
              domain={domain}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Preview Twitter / X</p>
            <SocialCardPreview
              variant="twitter"
              cardType={twitterCardType as "summary" | "summary_large_image"}
              title={socialTitle}
              description={socialDesc}
              image={socialImg}
              domain={domain}
            />
          </div>
        </div>
      </section>

      {/* 7. Vídeo (opcional) */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">
            7. Vídeo embed (opcional)
            <Tooltip text="Se o post inclui um vídeo (YouTube, Vimeo etc), preencher esses campos ativa o schema VideoObject — Google pode mostrar thumbnail no SERP e indexar no Google Vídeos. Use a URL de embed (não a página)." href="https://schema.org/VideoObject" />
          </h2>
          <p className="text-sm text-gray-400 mt-1">Deixe em branco se o post não tem vídeo principal.</p>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL do vídeo
            <Tooltip text="URL de embed (ex: https://www.youtube.com/embed/abc123). Ou URL canônica para Vimeo." />
          </label>
          <input
            name="video_url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duração (segundos)
              <Tooltip text="Duração total em segundos. Vira ISO-8601 (PT5M30S) no schema VideoObject." />
            </label>
            <input
              name="video_duration_sec"
              type="number"
              min="0"
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
              placeholder="330"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL da thumbnail
              <Tooltip text="Imagem que representa o vídeo no SERP. Em YouTube: https://img.youtube.com/vi/<videoID>/maxresdefault.jpg" />
            </label>
            <input
              name="video_thumbnail"
              type="url"
              value={videoThumbnail}
              onChange={(e) => setVideoThumbnail(e.target.value)}
              placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
          </div>
        </div>
      </section>

      {/* 8. Avançado */}
      <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">8. Avançado (canonical, robots)</h2>
          <p className="text-sm text-gray-400 mt-1">Cuidado — só mexa se souber o que está fazendo.</p>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL canônica (override)
            <Tooltip text="Se este post é uma republicação de outro lugar, aponte aqui pro original para evitar conteúdo duplicado. Deixe vazio para usar a URL natural do post no domínio do idioma." href="https://developers.google.com/search/docs/crawling-indexing/canonicalization" />
          </label>
          <input
            name="canonical_url"
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder={`https://${domain}/blog/${slug || "..."}`}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-black/20 rounded-lg">
            <input
              type="checkbox"
              name="noindex"
              checked={noindex}
              onChange={(e) => setNoindex(e.target.checked)}
              className="mt-1 rounded border-gray-500 text-voyia-blue focus:ring-voyia-blue"
            />
            <span className="text-sm">
              <span className="text-white font-medium">noindex</span>
              <Tooltip text="Diz ao Google para NÃO indexar este post. Use em posts duplicados, gated content ou conteúdo experimental. Reduz visibilidade no Google." />
              <span className="block text-xs text-gray-400 mt-0.5">
                meta robots noindex — Google não mostra na busca
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-4 bg-black/20 rounded-lg">
            <input
              type="checkbox"
              name="nofollow"
              checked={nofollow}
              onChange={(e) => setNofollow(e.target.checked)}
              className="mt-1 rounded border-gray-500 text-voyia-blue focus:ring-voyia-blue"
            />
            <span className="text-sm">
              <span className="text-white font-medium">nofollow</span>
              <Tooltip text="Diz ao Google para NÃO seguir os links deste post. Raramente necessário no nível do post — geralmente é melhor usar rel=nofollow em links específicos." />
              <span className="block text-xs text-gray-400 mt-0.5">
                meta robots nofollow — links daqui não passam link juice
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4 sticky bottom-4 z-10">
        <Link
          href="/admin/posts"
          className="px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="px-8 py-3 bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-2xl shadow-voyia-blue/30"
        >
          {pending ? "Criando post…" : "Criar post"}
        </button>
      </div>
    </form>
  );
}
