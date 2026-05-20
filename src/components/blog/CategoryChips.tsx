import Link from "next/link";
import type { CategoryWithCount } from "@/lib/db/posts";

interface Props {
  categories: CategoryWithCount[];
  heading: string;
}

export default function CategoryChips({ categories, heading }: Props) {
  if (categories.length === 0) return null;
  return (
    <section className="border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider mr-2">
            {heading}
          </span>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/categoria/${cat.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: cat.color ? `${cat.color}25` : "rgba(147,51,234,0.15)",
                color: cat.color ?? "rgb(216,180,254)",
                borderColor: cat.color ? `${cat.color}80` : "rgba(147,51,234,0.4)",
              }}
            >
              {cat.name}
              <span className="text-xs opacity-70">({cat.post_count})</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
