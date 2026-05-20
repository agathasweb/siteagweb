import Link from "next/link";
import type { TagCloudItem } from "@/lib/db/posts";

interface Props {
  tags: TagCloudItem[];
  heading: string;
}

/**
 * Tag cloud com tamanho de fonte proporcional ao post_count.
 * Min 0.75rem, max 1.5rem. Escala log para evitar tags muito grandes
 * dominarem (1 tag com 50 posts vs várias com 1-2).
 */
function fontSize(count: number, min: number, max: number): string {
  const minSize = 0.75;
  const maxSize = 1.5;
  if (max === min) return `${(minSize + maxSize) / 2}rem`;
  const ratio = (Math.log(count + 1) - Math.log(min + 1)) / (Math.log(max + 1) - Math.log(min + 1));
  const size = minSize + ratio * (maxSize - minSize);
  return `${size.toFixed(2)}rem`;
}

export default function TagCloud({ tags, heading }: Props) {
  if (tags.length === 0) return null;
  const counts = tags.map((t) => t.post_count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return (
    <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-5">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{heading}</h3>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/blog/tag/${tag.slug}`}
            title={`${tag.post_count} post(s)`}
            className="text-gray-300 hover:text-voyia-blue transition-colors leading-tight"
            style={{ fontSize: fontSize(tag.post_count, min, max) }}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
