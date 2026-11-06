import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

// Photos des événements.
// Chaque image est ré-encodée en WebP : ça allège les pages, neutralise un fichier
// piégé et retire les métadonnées (position GPS de l'appareil photo, etc.).
// Le nom contient les dimensions ("<uuid>-1600x900") pour réserver la place à l'affichage.

export const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
export const NAME_RE = /^[0-9a-f-]{36}-\d{1,4}x\d{1,4}(-t)?\.webp$/;

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export type ImageError = "trop-lourde" | "format" | "illisible";

export async function saveEventImage(file: File): Promise<{ ok: true; name: string } | { ok: false; error: ImageError }> {
  if (file.size > MAX_BYTES) return { ok: false, error: "trop-lourde" };
  if (!ACCEPTED.includes(file.type)) return { ok: false, error: "format" };
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) return { ok: false, error: "format" };
    const base = sharp(input, { limitInputPixels: 40_000_000 }).rotate(); // tient compte de l'orientation, puis l'oublie
    const big = await base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const thumb = await base.clone().resize({ width: 320, height: 320, fit: "cover", position: "attention" }).webp({ quality: 72 }).toBuffer();
    const name = `${randomUUID()}-${big.info.width}x${big.info.height}`;
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(path.join(uploadDir(), `${name}.webp`), big.data);
    await writeFile(path.join(uploadDir(), `${name}-t.webp`), thumb);
    return { ok: true, name };
  } catch {
    return { ok: false, error: "illisible" };
  }
}

export async function deleteEventImage(name: string | null | undefined) {
  if (!name || !NAME_RE.test(`${name}.webp`)) return;
  await Promise.all([unlink(path.join(uploadDir(), `${name}.webp`)), unlink(path.join(uploadDir(), `${name}-t.webp`))].map((p) => p.catch(() => undefined)));
}

/** Dimensions lues dans le nom ("<uuid>-1600x900"). */
export function imageSize(name: string): { width: number; height: number } {
  const m = name.match(/-(\d+)x(\d+)$/);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1600, height: 900 };
}
