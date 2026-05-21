import Link from "next/link";
import Image from "next/image";
import type { BlogCardData } from "@/lib/db/posts";
import { htmlLangAttr, type Locale } from "@/lib/i18n";

interface Props {
  posts: BlogCardData[];
  locale: Locale;
  heading: string;
}

function formatShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(htmlLangAttr[locale], {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export default function RecentPostsList({ posts, locale, heading }: Props) {
  if (posts.length === 0) return null;
  return (
    <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-5">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{heading}</h3>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.slug}`}
              className="flex gap-3 group items-start hover:bg-black/20 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              {p.cover_image && (
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-black/40">
                  <Image
                    src={p.cover_image}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-white leading-snug group-hover:text-voyia-blue transition-colors line-clamp-2">
                  {p.title}
                </h4>
                {p.published_at && (
                  <time dateTime={p.published_at} className="text-xs text-gray-500 mt-1 block">
                    {formatShort(p.published_at, locale)}
                  </time>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
