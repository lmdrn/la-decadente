"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { collectives, contactMessages, events, moderationLog, users, venues } from "@/db/schema";
import { requireAdmin, requireModerator } from "@/lib/auth";
import { deleteEventImage } from "@/lib/images";

const id = z.string().uuid();

export async function removeEvent(fd: FormData) {
  const me = await requireModerator();
  const eid = id.parse(fd.get("id"));
  await db.update(events).set({ status: "removed", updatedAt: new Date() }).where(eq(events.id, eid));
  await db.insert(moderationLog).values({ kind: "event", refId: eid, decision: "removed", by: me.id });
  revalidatePath("/admin");
}

export async function restoreEvent(fd: FormData) {
  const me = await requireModerator();
  const eid = id.parse(fd.get("id"));
  await db.update(events).set({ status: "published", updatedAt: new Date() }).where(eq(events.id, eid));
  await db.insert(moderationLog).values({ kind: "event", refId: eid, decision: "accepted", by: me.id });
  revalidatePath("/admin");
}

export async function markReviewed(fd: FormData) {
  const me = await requireModerator();
  const lid = id.parse(fd.get("id"));
  await db.update(moderationLog).set({ decision: "accepted", by: me.id }).where(eq(moderationLog.id, lid));
  revalidatePath("/admin");
}

export async function removeVenue(fd: FormData) {
  const me = await requireModerator();
  const vid = id.parse(fd.get("id"));
  await db.update(venues).set({ status: "removed" }).where(eq(venues.id, vid));
  await db.insert(moderationLog).values({ kind: "venue", refId: vid, decision: "removed", by: me.id });
  revalidatePath("/admin");
}

export async function toggleVenueListed(fd: FormData) {
  await requireModerator();
  const vid = id.parse(fd.get("id"));
  const [v] = await db.select({ listed: venues.listed }).from(venues).where(eq(venues.id, vid));
  if (v) await db.update(venues).set({ listed: !v.listed }).where(eq(venues.id, vid));
  revalidatePath("/admin");
}

export async function removeCollective(fd: FormData) {
  const me = await requireModerator();
  const cid = id.parse(fd.get("id"));
  await db.update(collectives).set({ status: "removed" }).where(eq(collectives.id, cid));
  await db.insert(moderationLog).values({ kind: "collective", refId: cid, decision: "removed", by: me.id });
  revalidatePath("/admin");
}

export async function setRole(fd: FormData) {
  const me = await requireAdmin();
  const uid = id.parse(fd.get("id"));
  const role = z.enum(["admin", "moderator", "contributor"]).parse(fd.get("role"));
  if (uid === me.id && role !== "admin") return; // on ne se retire pas soi-même le rôle admin
  await db.update(users).set({ role }).where(eq(users.id, uid));
  revalidatePath("/admin");
}

export async function markMessageHandled(fd: FormData) {
  await requireAdmin();
  await db.update(contactMessages).set({ handled: true }).where(eq(contactMessages.id, id.parse(fd.get("id"))));
  revalidatePath("/admin");
}

export async function removeEventImage(fd: FormData) {
  const me = await requireModerator();
  const eid = id.parse(fd.get("id"));
  const [e] = await db.select({ imageUrl: events.imageUrl }).from(events).where(eq(events.id, eid));
  if (!e?.imageUrl) return;
  await deleteEventImage(e.imageUrl);
  await db.update(events).set({ imageUrl: null, updatedAt: new Date() }).where(eq(events.id, eid));
  await db.insert(moderationLog).values({ kind: "image", refId: eid, decision: "removed", by: me.id });
  revalidatePath("/admin");
}
