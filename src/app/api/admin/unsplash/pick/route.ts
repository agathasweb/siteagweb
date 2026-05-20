import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchImageBuffer, trackDownload } from "@/lib/unsplash";
import { processImageToWebp } from "@/lib/images";

export const runtime = "nodejs";

interface PickBody {
  download_url?: string;
  download_location?: string;
  post_slug?: string;
  kind?: "post" | "avatar";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PickBody;
  try {
    body = (await request.json()) as PickBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const downloadUrl = body.download_url?.trim();
  if (!downloadUrl || !downloadUrl.startsWith("https://images.unsplash.com/")) {
    return NextResponse.json(
      { error: "invalid_download_url", detail: "Esperado URL https://images.unsplash.com/..." },
      { status: 400 },
    );
  }
  const postSlug = (body.post_slug ?? "post").toString();
  const kind = body.kind === "avatar" ? "avatar" : "post";

  try {
    const buffer = await fetchImageBuffer(downloadUrl);
    const result = await processImageToWebp(buffer, {
      postSlug,
      originalName: "unsplash.jpg",
      kind,
    });
    // Track download (Unsplash TOS exige; best-effort)
    if (body.download_location) {
      void trackDownload(body.download_location);
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: "processing_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
