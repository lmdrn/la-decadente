import { readFile } from "node:fs/promises";
import path from "node:path";
import { NAME_RE, uploadDir } from "@/lib/images";

// Sert les photos des événements. Le nom est strictement contrôlé :
// impossible de lire un autre fichier du serveur.
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!NAME_RE.test(name)) return new Response("Introuvable", { status: 404 });
  try {
    const data = await readFile(path.join(uploadDir(), name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
