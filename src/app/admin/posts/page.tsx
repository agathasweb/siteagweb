import Link from "next/link";
import { listAllPosts } from "@/lib/db/posts";

export const metadata = {
  title: "Posts | Painel Admin",
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-900/30 border-yellow-500/40 text-yellow-300",
  published: "bg-green-900/30 border-green-500/40 text-green-300",
  archived: "bg-gray-800 border-gray-600 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export default async function PostsPage() {
  const posts = listAllPosts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
          >
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Posts do Blog</h1>
          <p className="text-gray-400 mt-1">
            {posts.length} {posts.length === 1 ? "post" : "posts"} no sistema.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
        >
          + Novo Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-voyia-gray rounded-2xl p-12 border border-gray-700 text-center">
          <span className="text-5xl mb-4 block">📝</span>
          <h2 className="text-xl font-semibold text-white mb-2">
            Nenhum post ainda
          </h2>
          <p className="text-gray-400 mb-6">
            Crie seu primeiro post para começar.
          </p>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
          >
            Criar primeiro post
          </Link>
        </div>
      ) : (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-black/30 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Título</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Origem</th>
                <th className="px-6 py-3">Atualizado</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-gray-700 last:border-0 hover:bg-black/20"
                >
                  <td className="px-6 py-4 text-white font-medium">
                    {post.title ?? <span className="text-gray-500">(sem título)</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm font-mono">
                    {post.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-xs px-2 py-1 border rounded ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}
                    >
                      {STATUS_LABELS[post.status] ?? post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {post.source_locale}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(post.updated_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-voyia-blue hover:text-purple-300 text-sm font-semibold"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
