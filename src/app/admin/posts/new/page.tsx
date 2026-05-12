import Link from "next/link";
import { createPostAction } from "../actions";

export const metadata = {
  title: "Novo post | Painel Admin",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin/posts"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar para Posts
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Novo post</h1>
      <p className="text-gray-400 mb-8">
        Escreva na língua de origem. Depois de salvar você poderá traduzir
        automaticamente para os outros idiomas.
      </p>

      <form action={createPostAction} className="space-y-6">
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Metadados</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Slug *
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minúsculas, números e hífens"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
                placeholder="bem-vindos-ao-blog"
              />
            </div>

            <div>
              <label
                htmlFor="source_locale"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Idioma de origem *
              </label>
              <select
                id="source_locale"
                name="source_locale"
                required
                defaultValue="pt-BR"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="es">Español</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="cover_image"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Imagem de capa (URL)
              </label>
              <input
                id="cover_image"
                name="cover_image"
                type="text"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
                placeholder="/assets/posts/capa.webp"
              />
            </div>
          </div>
        </div>

        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Conteúdo</h2>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Título *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="excerpt"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Resumo (excerpt)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              placeholder="1 a 2 frases que resumem o post."
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Conteúdo (Markdown ou HTML) *
            </label>
            <textarea
              id="content"
              name="content"
              rows={16}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              placeholder={"# Título\n\nParágrafo com **negrito** e [link](https://...).\n\n## Subtítulo\n- Item 1\n- Item 2"}
            />
            <p className="text-xs text-gray-500 mt-1">
              Markdown é detectado automaticamente. HTML é sanitizado antes de salvar.
            </p>
          </div>
        </div>

        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">SEO (opcional)</h2>

          <div>
            <label
              htmlFor="meta_title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Meta título
            </label>
            <input
              id="meta_title"
              name="meta_title"
              type="text"
              maxLength={70}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              placeholder="Recomendado até 60 caracteres."
            />
          </div>

          <div>
            <label
              htmlFor="meta_description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Meta descrição
            </label>
            <textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              maxLength={170}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              placeholder="Recomendado até 160 caracteres."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/posts"
            className="px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-voyia-blue hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
          >
            Criar post
          </button>
        </div>
      </form>
    </div>
  );
}
