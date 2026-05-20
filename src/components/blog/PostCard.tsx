import Link from "next/link";
import Image from "next/image";
import type { BlogCardData } from "@/lib/db/posts";
import { htmlLangAttr, type Locale } from "@/lib/i18n";

interface Props {
  post: BlogCardData;
  locale: Locale;
  variant?: "default" | "featured";
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(htmlLangAttr[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function parseTags(csv: string | null): { name: string; slug: string }[] {
  if (!csv) return [];
  return csv.split("||").map((pair) => {
    const [name, slug] = pair.split("|");
    return { name: name ?? "", slug: slug ?? "" };
  }).filter((t) => t.slug);
}

export default function PostCard({ post, locale, variant = "default" }: Props) {
  const tags = parseTags(post.tags_csv);
  const isFeatured = variant === "featured";

  return (
    <article
      className={`group relative bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-voyia-blue/60 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)] ${
        isFeatured ? "md:flex md:min-h-[280px]" : ""
      }`}
    >
      {/* Overlay link — torna o card inteiro (inclusive imagem) clicável.
          z-10 vence o `position:relative` do wrapper da imagem que cria
          stacking context. Badges abaixo ficam em z-20 pra interceptar
          cliques próprios. */}
      <Link
        href={`/blog/${post.slug}`}
        className="absolute inset-0 z-10"
        aria-label={post.title}
      />

      {post.cover_image && (
        <div
          className={`relative bg-black/40 ${
            isFeatured ? "md:w-1/2 aspect-video md:aspect-auto" : "aspect-video"
          }`}
        >
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes={isFeatured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isFeatured && (
            <span className="absolute top-4 left-4 z-10 bg-yellow-500/95 text-black text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none">
              ⭐ Destaque
            </span>
          )}
        </div>
      )}

      <div className={`p-6 ${isFeatured ? "md:flex-1 md:flex md:flex-col md:justify-center" : ""}`}>
        {/* Categoria + tempo de leitura */}
        <div className="flex items-center gap-3 text-xs mb-3 flex-wrap">
          {post.category_slug && post.category_name && (
            <Link
              href={`/blog/categoria/${post.category_slug}`}
              className="relative z-20 inline-flex items-center px-2.5 py-1 rounded-full font-semibold transition-colors"
              style={{
                backgroundColor: post.category_color ? `${post.category_color}30` : "rgba(147,51,234,0.2)",
                color: post.category_color ?? "rgb(216,180,254)",
                borderColor: post.category_color ? `${post.category_color}80` : "rgba(147,51,234,0.4)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              {post.category_name}
            </Link>
          )}
          {post.reading_time_min != null && post.reading_time_min > 0 && (
            <span className="text-gray-400">⏱ {post.reading_time_min} min</span>
          )}
        </div>

        <h2
          className={`font-semibold text-white mb-2 group-hover:text-voyia-blue transition-colors ${
            isFeatured ? "text-2xl md:text-3xl" : "text-xl"
          }`}
        >
          {post.title}
        </h2>

        {post.excerpt && (
          <p className={`text-gray-300 leading-relaxed mb-4 ${isFeatured ? "text-base" : "text-sm"}`}>
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}`}
                className="relative z-20 inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-300 bg-black/30 hover:bg-voyia-blue/30 hover:text-white border border-gray-700 hover:border-voyia-blue/50 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Footer: autor + data */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700/60">
          <div className="flex items-center gap-2 min-w-0">
            {post.author_avatar && (
              <Image
                src={post.author_avatar}
                alt={post.author_name ?? ""}
                width={24}
                height={24}
                className="rounded-full shrink-0"
              />
            )}
            {post.author_name && <span className="truncate">{post.author_name}</span>}
          </div>
          {post.published_at && (
            <time dateTime={post.published_at} className="text-gray-500 whitespace-nowrap">
              {formatDate(post.published_at, locale)}
            </time>
          )}
        </div>
      </div>
    </article>
  );
}
