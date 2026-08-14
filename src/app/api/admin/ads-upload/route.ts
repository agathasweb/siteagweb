import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload de mídia (imagem/vídeo) dos criativos de anúncio.
 *
 * Salva em `public/uploads/ads/YYYY-MM/<hash>.<ext>` — fica acessível
 * publicamente em `https://agathas.com.br/uploads/ads/...` que é o que
 * a Meta Graph API precisa pra fazer o fetch (`image_url`/`video_url`).
 *
 * Validações:
 *  - Imagem: até 8MB (limite IG feed), tipos jpeg/png/webp
 *  - Vídeo: até 100MB (limite Reel IG é 1GB mas no Vercel/PM2 chunked
 *    upload via form-data fica caro — 100MB cobre 99% dos casos)
 *
 * Retorna `{ url, type, sizeBytes }` que o wizard usa pra montar o criativo.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime"]);

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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const mime = file.type;
  let kind: "image" | "video";
  let maxBytes: number;
  let ext: string;

  if (IMAGE_MIMES.has(mime)) {
    kind = "image";
    maxBytes = MAX_IMAGE_BYTES;
    ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  } else if (VIDEO_MIMES.has(mime)) {
    kind = "video";
    maxBytes = MAX_VIDEO_BYTES;
    ext = mime === "video/quicktime" ? "mov" : "mp4";
  } else {
    return NextResponse.json(
      { error: "unsupported_mime", got: mime },
      { status: 415 },
    );
  }

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: "file_too_large", limitBytes: maxBytes },
      { status: 413 },
    );
  }

  // Diretório mensal pra não estourar inodes em /uploads/ads.
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = join(process.cwd(), "public", "uploads", "ads", ym);
  await mkdir(dir, { recursive: true });

  const hash = crypto.randomBytes(8).toString("hex");
  const filename = `${Date.now()}-${hash}.${ext}`;
  const filepath = join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const publicUrl = `/uploads/ads/${ym}/${filename}`;

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    type: kind,
    sizeBytes: file.size,
    mime,
  });
}
