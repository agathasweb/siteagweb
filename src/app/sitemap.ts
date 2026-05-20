import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getLocaleFromHost, getOriginForLocale } from "@/lib/i18n";
import {
  listPublishedPosts,
  listAllCategorySlugs,
  listAllTagSlugsWithPosts,
} from "@/lib/db/posts";

const STATIC_PATHS: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1.0, freq: "weekly" },
  { path: "/quem-somos", priority: 0.8, freq: "monthly" },
  { path: "/contato", priority: 0.7, freq: "monthly" },
  { path: "/blog", priority: 0.9, freq: "daily" },
  { path: "/servicos", priority: 0.8, freq: "monthly" },
  { path: "/servicos/desenvolvimento", priority: 0.7, freq: "monthly" },
  { path: "/servicos/desenvolvimento-sites", priority: 0.7, freq: "monthly" },
  { path: "/servicos/moodle", priority: 0.7, freq: "monthly" },
  { path: "/servicos/trafego-pago", priority: 0.7, freq: "monthly" },
  { path: "/servicos/consultoria", priority: 0.7, freq: "monthly" },
  { path: "/produtos", priority: 0.8, freq: "monthly" },
  { path: "/produtos/hospedagem-moodle", priority: 0.7, freq: "monthly" },
  { path: "/produtos/hospedagem-gerenciada", priority: 0.7, freq: "monthly" },
  { path: "/produtos/aplicativo-moodle", priority: 0.8, freq: "monthly" },
  { path: "/produtos/voyia", priority: 0.7, freq: "monthly" },
  { path: "/produtos/sga", priority: 0.7, freq: "monthly" },
  { path: "/privacidade", priority: 0.3, freq: "yearly" },
  { path: "/termos", priority: 0.3, freq: "yearly" },
  { path: "/politica-cookies", priority: 0.3, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, freq }) => ({
    url: `${origin}${path || "/"}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  const posts = listPublishedPosts(locale);
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const categorySlugs = listAllCategorySlugs();
  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${origin}/blog/categoria/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tagSlugs = listAllTagSlugsWithPosts();
  const tagEntries: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
    url: `${origin}/blog/tag/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Feed RSS — descoberta extra. lastModified usa a data do post mais recente
  // pra crawlers detectarem mudanças sem precisar baixar o feed.
  const latestPost = posts[0];
  const feedEntry: MetadataRoute.Sitemap = [
    {
      url: `${origin}/blog/feed.xml`,
      lastModified: latestPost?.published_at
        ? new Date(latestPost.published_at)
        : now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    },
  ];

  return [
    ...staticEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
    ...feedEntry,
  ];
}
