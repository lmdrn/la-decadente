import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

const COOKIE = "dk_session";
const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
/** Hash factice : on compare quand même quand le compte n'existe pas (même durée de réponse). */
export const DUMMY_HASH = bcrypt.hashSync("compte-inexistant", 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export type SafeUser = Pick<User, "id" | "email" | "displayName" | "role" | "appearance">;

/** Utilisateur·ice connecté·e, ou null. Mis en cache le temps d'une requête. */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      appearance: users.appearance,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  return rows[0] ?? null;
});

export const canModerate = (u: SafeUser | null) => u?.role === "admin" || u?.role === "moderator";

export async function requireUser(): Promise<SafeUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function requireModerator(): Promise<SafeUser> {
  const u = await requireUser();
  if (!canModerate(u)) throw new Error("FORBIDDEN");
  return u;
}

export async function requireAdmin(): Promise<SafeUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}

// Limite simple des tentatives de connexion (mémoire du processus).
// En production avec plusieurs instances, remplacer par un stockage partagé.
const attempts = new Map<string, { n: number; until: number }>();
export function tooManyAttempts(key: string): boolean {
  const a = attempts.get(key);
  return !!a && a.n >= 8 && a.until > Date.now();
}
export function recordFailure(key: string) {
  const a = attempts.get(key);
  const now = Date.now();
  if (!a || a.until < now) attempts.set(key, { n: 1, until: now + 15 * 60_000 });
  else a.n += 1;
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
