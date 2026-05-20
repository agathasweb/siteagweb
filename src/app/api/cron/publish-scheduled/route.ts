import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishScheduledPosts, getPostById } from "@/lib/db/posts";
import { buildPostUrls } from "@/lib/indexer";
import { submitUrlsForIndexingAsync } from "@/lib/seo-sync";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron_misconfigured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count, ids } = publishScheduledPosts();

  if (count > 0) {
    revalidatePath("/[lang]/blog", "page");
    revalidatePath("/[lang]/blog/[slug]", "page");
    revalidatePath("/[lang]/blog/categoria", "page");

    // Coleta URLs de todos os posts recém-publicados e dispara indexação
    // (IndexNow + Google) em background — não bloqueia o cron.
    const urlsToIndex: string[] = [];
    for (const id of ids) {
      const detail = getPostById(id);
      if (!detail) continue;
      type PostRow = { slug: string; status: string };
      type TRow = { locale: Locale };
      const post = detail.post as PostRow;
      const translations = detail.translations as TRow[];
      const availableLocales = translations.map((t) => t.locale);
      if (post.status === "published" && availableLocales.length > 0) {
        urlsToIndex.push(...buildPostUrls(post.slug, availableLocales));
      }
    }
    if (urlsToIndex.length > 0) {
      submitUrlsForIndexingAsync(urlsToIndex, `cron-publish:${count}-posts`);
    }
  }

  return NextResponse.json({ published: count, ids, ok: true });
}
