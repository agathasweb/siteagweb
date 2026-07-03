import Link from "next/link";
import { listAllPostsEnrichedPaged } from "@/lib/db/posts";
import PostsTable from "./PostsTable";

export const metadata = {
  title: "Posts | Painel Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { items: posts, total, page, totalPages } = listAllPostsEnrichedPaged(
    requestedPage,
    PAGE_SIZE,
  );

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
            {total} {total === 1 ? "post" : "posts"} no sistema
            {totalPages > 1 ? ` · página ${page} de ${totalPages}` : ""}.
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
        <>
          <PostsTable posts={posts} />
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
              <PageLink page={page - 1} disabled={page <= 1} label="← Anterior" />
              {pageWindow(page, totalPages).map((p, i) =>
                p === null ? (
                  <span key={`gap-${i}`} className="px-2 text-gray-500">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={p === 1 ? "/admin/posts" : `/admin/posts?page=${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`min-w-9 text-center px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      p === page
                        ? "bg-voyia-blue border-voyia-blue text-white"
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </Link>
                ),
              )}
              <PageLink page={page + 1} disabled={page >= totalPages} label="Próxima →" />
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-2 rounded-lg text-sm border border-gray-700 text-gray-600 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={page === 1 ? "/admin/posts" : `/admin/posts?page=${page}`}
      className="px-3 py-2 rounded-lg text-sm border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
    >
      {label}
    </Link>
  );
}

// Janela de páginas com elipses: 1 … 4 5 [6] 7 8 … 20
function pageWindow(current: number, total: number): (number | null)[] {
  const out: (number | null)[] = [];
  const push = (p: number) => out.push(p);
  const first = 1;
  const last = total;
  const from = Math.max(first, current - 2);
  const to = Math.min(last, current + 2);
  if (from > first) {
    push(first);
    if (from > first + 1) out.push(null);
  }
  for (let p = from; p <= to; p++) push(p);
  if (to < last) {
    if (to < last - 1) out.push(null);
    push(last);
  }
  return out;
}
