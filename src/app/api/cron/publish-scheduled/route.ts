import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishScheduledPosts } from "@/lib/db/posts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const published = publishScheduledPosts();

  if (published > 0) {
    revalidatePath("/[lang]/blog", "page");
    revalidatePath("/[lang]/blog/[slug]", "page");
    revalidatePath("/[lang]/blog/categoria", "page");
  }

  return NextResponse.json({ published, ok: true });
}
