import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/db/posts";
import { listAllPostFaqs } from "@/lib/db/taxonomy";
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
        {/* Metadados globais do post */}
        <form action={metaAction} className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Metadados do post</h2>
            <button type="submit" className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg text-white">
              Salvar metadados
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
              <input
                id="slug" name="slug" type="text" required pattern="[a-z0-9-]+"
                defaultValue={post.slug}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-voyia-blue"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                id="status" name="status" defaultValue={post.status}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cover_image" className="block text-sm font-medium text-gray-300 mb-2">Imagem de capa (URL)</label>
            <input
              id="cover_image" name="cover_image" type="text"
              defaultValue={post.cover_image ?? ""}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              placeholder="/assets/posts/capa.webp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
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

        {/* Perigo */}
        <form action={deleteAction} className="bg-red-950/20 rounded-2xl border border-red-800/40 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-red-300 mb-1">Zona de perigo</h2>
            <p className="text-sm text-red-200/70">Apagar o post remove todas as traduções. Irreversível.</p>
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
