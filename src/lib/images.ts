import "server-only";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");
const UPLOADS_BASE = "uploads/posts";

const SIZES = {
  thumb: 400,
  medium: 800,
  large: 1600,
} as const;

const WEBP_QUALITY = 82;

export type ImageSize = keyof typeof SIZES;

export interface ProcessedImage {
  path: string;
  path_thumb: string;
  path_medium: string;
  path_large: string;
  width: number;
  height: number;
  bytes: number;
}

function slugifySegment(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "img"
  );
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export async function processImageToWebp(
  buffer: Buffer,
  options: { postSlug: string; originalName: string },
): Promise<ProcessedImage> {
  const year = new Date().getUTCFullYear();
  const postSlug = slugifySegment(options.postSlug);
  const baseName = slugifySegment(options.originalName.replace(/\.[^.]+$/, ""));
  const id = randomId();
  const stem = `${baseName}-${id}`;

  const relDir = `${UPLOADS_BASE}/${year}/${postSlug}`;
  const absDir = join(PUBLIC_DIR, relDir);
  await mkdir(absDir, { recursive: true });

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Não foi possível ler dimensões da imagem.");
  }

  const baseImage = sharp(buffer, { failOn: "error" }).rotate();

  const original = await baseImage
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(join(absDir, `${stem}.webp`), original.data);

  const thumbResult = await baseImage
    .clone()
    .resize({ width: SIZES.thumb, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer();
  await writeFile(join(absDir, `${stem}-${SIZES.thumb}.webp`), thumbResult);

  const mediumResult = await baseImage
    .clone()
    .resize({ width: SIZES.medium, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer();
  await writeFile(join(absDir, `${stem}-${SIZES.medium}.webp`), mediumResult);

  const largeResult = await baseImage
    .clone()
    .resize({ width: SIZES.large, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer();
  await writeFile(join(absDir, `${stem}-${SIZES.large}.webp`), largeResult);

  return {
    path: `/${relDir}/${stem}.webp`,
    path_thumb: `/${relDir}/${stem}-${SIZES.thumb}.webp`,
    path_medium: `/${relDir}/${stem}-${SIZES.medium}.webp`,
    path_large: `/${relDir}/${stem}-${SIZES.large}.webp`,
    width: original.info.width,
    height: original.info.height,
    bytes: original.data.byteLength,
  };
}
