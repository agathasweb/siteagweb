import "server-only";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

export type UploadKind = "post" | "avatar";

const UPLOAD_BASES: Record<UploadKind, string> = {
  post: "uploads/posts",
  avatar: "uploads/avatars",
};

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
  options: {
    postSlug: string;
    originalName: string;
    kind?: UploadKind;
    /**
     * Razão largura/altura do crop (ex.: 16/9 ≈ 1.778). Quando definido, todas
     * as variantes são geradas com `fit: cover` + foco em região saliente
     * (`position: "attention"`) e o "original" salvo é o crop em SIZES.large.
     */
     cropAspect?: number;
  },
): Promise<ProcessedImage> {
  const kind: UploadKind = options.kind ?? "post";
  const year = new Date().getUTCFullYear();
  const postSlug = slugifySegment(options.postSlug);
  const baseName = slugifySegment(options.originalName.replace(/\.[^.]+$/, ""));
  const id = randomId();
  const stem = `${baseName}-${id}`;

  const relDir = `${UPLOAD_BASES[kind]}/${year}/${postSlug}`;
  const absDir = join(PUBLIC_DIR, relDir);
  await mkdir(absDir, { recursive: true });

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Não foi possível ler dimensões da imagem.");
  }

  const baseImage = sharp(buffer, { failOn: "error" }).rotate();
  const aspect = options.cropAspect && options.cropAspect > 0 ? options.cropAspect : null;

  const variantHeight = (width: number): number | undefined =>
    aspect ? Math.round(width / aspect) : undefined;

  const variantOptions = (width: number): sharp.ResizeOptions =>
    aspect
      ? {
          width,
          height: variantHeight(width),
          fit: "cover",
          position: "attention",
        }
      : { width, withoutEnlargement: true };

  // "Original" salvo: quando há crop, fixamos em SIZES.large pra padronizar o ativo
  // canônico. Sem crop, mantemos a imagem completa (sem resize).
  const originalPipeline = aspect
    ? baseImage.clone().resize(variantOptions(SIZES.large))
    : baseImage.clone();

  const original = await originalPipeline
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(join(absDir, `${stem}.webp`), original.data);

  const thumbResult = await baseImage
    .clone()
    .resize(variantOptions(SIZES.thumb))
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer();
  await writeFile(join(absDir, `${stem}-${SIZES.thumb}.webp`), thumbResult);

  const mediumResult = await baseImage
    .clone()
    .resize(variantOptions(SIZES.medium))
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer();
  await writeFile(join(absDir, `${stem}-${SIZES.medium}.webp`), mediumResult);

  const largeResult = await baseImage
    .clone()
    .resize(variantOptions(SIZES.large))
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
