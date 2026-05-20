import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchUnsplash } from "@/lib/unsplash";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }
  const perPage = Math.min(20, Math.max(1, Number(url.searchParams.get("per_page") ?? 12)));
  const result = await searchUnsplash(q, perPage);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ photos: result.photos, total: result.total });
}
