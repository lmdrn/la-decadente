"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { counters, favorites, users } from "@/db/schema";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { parseAppearance, serializeAppearance } from "@/lib/appearance";
import { redirect } from "next/navigation";

const YEAR = 365 * 86400;

export async function setLang(lang: "fr" | "en") {
  (await cookies()).set("lang", lang === "en" ? "en" : "fr", { path: "/", maxAge: YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function saveAppearance(raw: string) {
  const a = parseAppearance(raw);
  (await cookies()).set("apparence", serializeAppearance(a), { path: "/", maxAge: YEAR, sameSite: "lax" });
  const u = await getCurrentUser();
  if (u) await db.update(users).set({ appearance: a }).where(eq(users.id, u.id));
}

export async function toggleFavorite(eventId: string): Promise<{ ok: boolean; fav?: boolean; login?: boolean }> {
  const u = await getCurrentUser();
  if (!u) return { ok: false, login: true };
  if (!/^[0-9a-f-]{36}$/.test(eventId)) return { ok: false };
  const del = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, u.id), eq(favorites.eventId, eventId)))
    .returning({ e: favorites.eventId });
  if (del.length) return { ok: true, fav: false };
  await db.insert(favorites).values({ userId: u.id, eventId }).onConflictDoNothing();
  return { ok: true, fav: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/** Compteur de visites : une visite par navigateur et par jour. */
export async function countVisit(): Promise<number> {
  const jar = await cookies();
  const today = new Date().toISOString().slice(0, 10);
  if (jar.get("dk_v")?.value !== today) {
    jar.set("dk_v", today, { path: "/", maxAge: 2 * 86400, sameSite: "lax", httpOnly: true });
    const [r] = await db
      .insert(counters)
      .values({ key: "visites", value: 1 })
      .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
      .returning({ v: counters.value });
    return r.v;
  }
  const [r] = await db.select({ v: counters.value }).from(counters).where(eq(counters.key, "visites"));
  return r?.v ?? 0;
}
