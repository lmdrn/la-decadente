"use server";

import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { clientIp, rateLimited } from "@/lib/request";

export type ContactState = { ok?: boolean; error?: string };

const Input = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(4000),
});

// Les messages arrivent dans l'espace admin. L'envoi par email sera branché
// avec la messagerie Infomaniak (serveur SMTP) au moment de la mise en ligne.
export async function sendContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "") !== "") return { ok: true }; // robot : on fait semblant
  const ip = await clientIp();
  if (rateLimited(`contact:${ip}`, 3, 60 * 60_000)) return { error: "Trop de messages envoyés. Réessaie dans une heure." };
  const p = Input.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Remplis ton nom, un email valide et un message (10 caractères minimum)." };
  await db.insert(contactMessages).values(p.data);
  return { ok: true };
}
