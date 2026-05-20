import Link from "next/link";

interface Props {
  currentPage: number;
  totalPages: number;
  basePath: string; // ex: "/blog"
  labels: {
    previous: string;
    next: string;
    page: string;
  };
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  // Sempre inclui: 1, total, current, current±1.
  const pages = new Set<number>([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

function pageHref(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export default function BlogPagination({ currentPage, totalPages, basePath, labels }: Props) {
  if (totalPages <= 1) return null;
  const pages = buildPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-10 flex-wrap"
      aria-label={labels.page}
    >
      {hasPrev ? (
        <Link
          href={pageHref(basePath, currentPage - 1)}
          rel="prev"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-voyia-gray border border-gray-700 hover:border-voyia-blue hover:bg-voyia-blue/10 transition-colors"
        >
          ← {labels.previous}
        </Link>
      ) : (
        <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-900 border border-gray-800 cursor-not-allowed">
          ← {labels.previous}
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`gap-${idx}`} className="px-2 text-gray-500 text-sm">…</span>
          ) : p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold text-white bg-voyia-blue border border-voyia-blue"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(basePath, p)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-voyia-blue/20 border border-gray-700 hover:border-voyia-blue/50 transition-colors"
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {hasNext ? (
        <Link
          href={pageHref(basePath, currentPage + 1)}
          rel="next"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-voyia-gray border border-gray-700 hover:border-voyia-blue hover:bg-voyia-blue/10 transition-colors"
        >
          {labels.next} →
        </Link>
      ) : (
        <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-900 border border-gray-800 cursor-not-allowed">
          {labels.next} →
        </span>
      )}
    </nav>
  );
}
