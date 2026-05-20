import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processImageToWebp, type UploadKind } from "@/lib/images";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const ALLOWED_KINDS = new Set<UploadKind>(["post", "avatar"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = form.get("file");
  const postSlug = (form.get("post_slug") ?? "post").toString();
  const kindRaw = (form.get("kind") ?? "post").toString();

  if (!ALLOWED_KINDS.has(kindRaw as UploadKind)) {
    return NextResponse.json(
      { error: "unsupported_kind", got: kindRaw },
      { status: 400 },
    );
  }
  const kind = kindRaw as UploadKind;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", limitBytes: MAX_BYTES },
      { status: 413 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", got: file.type },
      { status: 415 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processImageToWebp(buffer, {
      postSlug,
      originalName: file.name,
      kind,
    });
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
