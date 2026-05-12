import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/db/posts";
import { listAllPostFaqs, listCategories } from "@/lib/db/taxonomy";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { updatePostMetaAction, deletePostAction } from "../actions";
import PostEditor, { type TranslationData } from "./PostEditor";
import FaqEditor from "./FaqEditor";

export const metadata = {
  title: "Editar post | Painel Admin",
  robots: { index: false, follow: false },
};

const empty: TranslationData = {
  title: "",
  excerpt: "",
  content: "",
  meta_title: "",
  meta_description: "",
  og_title: "",
  og_description: "",
  twitter_card_type: "summary_large_image",
  focus_keyword: "",
  secondary_keywords: "",
  cover_image_alt: "",
  source: "manual",
  exists: false,
};

interface PostRow {
  id: number;
  slug: string;
  status: string;
  source_locale: string;
  cover_image: string | null;
  category_id: number | null;
  article_type: string;
  noindex: number;
  nofollow: number;
  featured: number;
  canonical_url: string | null;
  scheduled_at: string | null;
  video_url: string | null;
  video_duration_sec: number | null;
  video_thumbnail: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface TranslationRow {
  post_id: number;
  locale: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_card_type: string | null;
  focus_keyword: string | null;
  secondary_keywords: string | null;
  cover_image_alt: string | null;
  translation_source: string;
}

const ARTICLE_TYPES = [
  { value: "BlogPosting", label: "BlogPosting — post de blog" },
  { value: "Article", label: "Article — artigo genérico" },
  { value: "NewsArticle", label: "NewsArticle — notícia/jornalismo" },
  { value: "TechArticle", label: "TechArticle — tutorial técnico" },
  { value: "HowTo", label: "HowTo — guia passo a passo (rich result!)" },
  { value: "Course", label: "Course — conteúdo de curso" },
  { value: "Recipe", label: "Recipe — receita" },
];

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const detail = getPostById(postId);
  if (!detail) notFound();

  const post = detail.post as PostRow;
  const translations = detail.translations as TranslationRow[];
  const categories = listCategories("pt-BR");

  if (!isLocale(post.source_locale)) notFound();
  const sourceLocale = post.source_locale as Locale;

  const initial: Record<Locale, TranslationData> = {
    "pt-BR": { ...empty },
    es: { ...empty },
    "en-US": { ...empty },
    "en-GB": { ...empty },
  };

  for (const t of translations) {
    if (!isLocale(t.locale)) continue;
    initial[t.locale as Locale] = {
      title: t.title,
      excerpt: t.excerpt ?? "",
      content: t.content_html,
      meta_title: t.meta_title ?? "",
      meta_description: t.meta_description ?? "",
      og_title: t.og_title ?? "",
      og_description: t.og_description ?? "",
      twitter_card_type: t.twitter_card_type ?? "summary_large_image",
      focus_keyword: t.focus_keyword ?? "",
      secondary_keywords: t.secondary_keywords ?? "",
      cover_image_alt: t.cover_image_alt ?? "",
      source: t.translation_source,
      exists: true,
    };
  }

  const metaAction = updatePostMetaAction.bind(null, postId);
  const deleteAction = deletePostAction.bind(null, postId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin/posts" className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2">
        ← Voltar para Posts
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Editar post</h1>
      <p className="text-gray-400 mb-8">
        ID #{post.id} · criado em {new Date(post.created_at).toLocaleString("pt-BR")}
      </p>

      <div className="space-y-6">
        {/* Metadados globais (nível do post, todos os locales) */}
        <form action={metaAction} className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Configurações do post</h2>
              <p className="text-sm text-gray-400 mt-0.5">Campos globais — afetam todos os idiomas.</p>
            </div>
            <button type="submit" className="text-sm bg-voyia-blue hover:bg-purple-600 px-5 py-2.5 rounded-lg text-white font-semibold transition-colors">
              Salvar configurações
            </button>
          </div>

          {/* Linha 1: Slug + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
              <input
                name="slug" type="text" required pattern="[a-z0-9-]+"
                defaultValue={post.slug}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select name="status" defaultValue={post.status} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          {/* Linha 2: Tipo de artigo + Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de artigo (Schema.org)</label>
              <select name="article_type" defaultValue={post.article_type} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
                {ARTICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
              <select name="category_id" defaultValue={post.category_id ?? ""} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
                <option value="">— Sem categoria —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 3: Imagem de capa + Data agendada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagem de capa (URL)</label>
              <input
                name="cover_image" type="text"
                defaultValue={post.cover_image ?? ""}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                placeholder="/assets/posts/capa.webp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data agendada</label>
              <input
                name="scheduled_at" type="datetime-local"
                defaultValue={post.scheduled_at?.slice(0, 16) ?? ""}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Linha 4: Vídeo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">URL do vídeo (embed)</label>
              <input
                name="video_url" type="url"
                defaultValue={post.video_url ?? ""}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duração (segundos)</label>
              <input
                name="video_duration_sec" type="number" min="0"
                defaultValue={post.video_duration_sec ?? ""}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail do vídeo (URL)</label>
            <input
              name="video_thumbnail" type="url"
              defaultValue={post.video_thumbnail ?? ""}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">URL canônica (override)</label>
            <input
              name="canonical_url" type="url"
              defaultValue={post.canonical_url ?? ""}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
              placeholder="Deixe vazio para usar a URL natural"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
              <input type="checkbox" name="featured" defaultChecked={!!post.featured}
                className="rounded border-gray-500 text-voyia-blue" />
              <span className="text-sm text-white">⭐ Post em destaque</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
              <input type="checkbox" name="noindex" defaultChecked={!!post.noindex}
                className="rounded border-gray-500 text-red-500" />
              <span className="text-sm text-white">🚫 noindex</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/20 rounded-lg">
              <input type="checkbox" name="nofollow" defaultChecked={!!post.nofollow}
                className="rounded border-gray-500 text-yellow-500" />
              <span className="text-sm text-white">🚫 nofollow</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-1">
            <p>Idioma de origem: <span className="text-white font-mono">{sourceLocale}</span></p>
            <p>Publicado em: <span className="text-white">{post.published_at ? new Date(post.published_at).toLocaleString("pt-BR") : "—"}</span></p>
          </div>
        </form>

        {/* Editor por locale */}
        <PostEditor
          postId={post.id}
          slug={post.slug}
          sourceLocale={sourceLocale}
          coverImage={post.cover_image}
          categoryId={post.category_id ? String(post.category_id) : ""}
          initial={initial}
        />

        {/* FAQ */}
        <FaqEditor
          postId={post.id}
          sourceLocale={sourceLocale}
          initialFaqs={listAllPostFaqs(post.id)}
        />

        {/* Zona de perigo */}
        <form action={deleteAction} className="bg-red-950/20 rounded-2xl border border-red-800/40 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-red-300 mb-1">Zona de perigo</h2>
            <p className="text-sm text-red-200/70">Apagar o post remove todas as traduções, FAQs e imagens. Irreversível.</p>
          </div>
          <button type="submit" className="bg-red-700 hover:bg-red-600 text-white px-5 py-3 rounded-lg font-semibold transition-colors">
            Apagar post
          </button>
        </form>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <Link href={`/blog/${post.slug}`} className="text-voyia-blue hover:text-purple-300" target="_blank">
          Abrir post no site →
        </Link>
        <p className="text-gray-500">Locales: {locales.join(", ")}</p>
      </div>
    </div>
  );
}
