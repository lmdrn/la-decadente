"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DUMMY_HASH, clearFailures, createSession, hashPassword, recordFailure, tooManyAttempts, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimited, safeNext } from "@/lib/request";
import { moderate } from "@/lib/moderation";

export type FormState = { error?: string; fields?: Record<string, string> };

const Register = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  displayName: z.string().trim().min(2).max(40),
  password: z.string().min(10).max(200),
  charte: z.literal("on"),
});

export async function register(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const fields = { email: raw.email ?? "", displayName: raw.displayName ?? "" };
  const ip = await clientIp();
  if (rateLimited(`register:${ip}`, 5, 60 * 60_000)) return { error: "Trop d'inscriptions depuis cette connexion. Réessaie plus tard.", fields };
  const p = Register.safeParse(raw);
  if (!p.success) {
    const k = p.error.issues[0]?.path[0];
    const msg =
      k === "email" ? "Adresse email invalide." :
      k === "displayName" ? "Le pseudo doit faire entre 2 et 40 caractères." :
      k === "password" ? "Le mot de passe doit faire au moins 10 caractères." :
      "Tu dois accepter la charte pour créer un compte.";
    return { error: msg, fields };
  }
  if (moderate(p.data.displayName).decision === "rejected") return { error: "Ce pseudo ne respecte pas la charte.", fields };
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, p.data.email)).limit(1);
  if (exists[0]) return { error: "Un compte existe déjà avec cet email. Connecte-toi.", fields };
  const [u] = await db
    .insert(users)
    .values({ email: p.data.email, displayName: p.data.displayName, passwordHash: await hashPassword(p.data.password) })
    .returning({ id: users.id });
  await createSession(u.id);
  redirect(safeNext(raw.next, "/compte"));
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();
  const key = `${email}|${ip}`;
  if (tooManyAttempts(key)) return { error: "Trop de tentatives. Attends 15 minutes.", fields: { email } };
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Toujours comparer un mot de passe, même si le compte n'existe pas (temps constant).
  const ok = await verifyPassword(password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok) {
    recordFailure(key);
    return { error: "Email ou mot de passe incorrect.", fields: { email } };
  }
  clearFailures(key);
  await createSession(u.id);
  redirect(safeNext(fd.get("next"), "/"));
}

const NewPassword = z.object({ current: z.string(), password: z.string().min(10).max(200) });

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState & { ok?: boolean }> {
  const { requireUser } = await import("@/lib/auth");
  const me = await requireUser();
  const p = NewPassword.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Le nouveau mot de passe doit faire au moins 10 caractères." };
  const [u] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!(await verifyPassword(p.data.current, u.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  await db.update(users).set({ passwordHash: await hashPassword(p.data.password) }).where(eq(users.id, me.id));
  return { ok: true };
}
