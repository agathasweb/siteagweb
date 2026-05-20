import Link from "next/link";
import { listAllPostsEnriched } from "@/lib/db/posts";
import PostsTable from "./PostsTable";

export const metadata = {
  title: "Posts | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function PostsPage() {
  const posts = listAllPostsEnriched();

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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/import"
            className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-5 py-3 rounded-lg font-medium transition-colors"
            title="Importar via JSON (lote)"
          >
            📦 Importar JSON
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center bg-voyia-blue hover:bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
          >
            + Novo Post
          </Link>
        </div>
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
        <PostsTable posts={posts} />
      )}
    </div>
  );
}
