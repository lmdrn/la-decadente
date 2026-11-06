import type { MetadataRoute } from "next";
import { and, eq, gte } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { collectives, events, venues } from "@/db/schema";
import { addDays, todayAgenda } from "@/lib/dates";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const today = todayAgenda();
  const since = new Date(Date.now() - 86400_000);
  const [evs, vs, cs] = await Promise.all([
    db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(and(eq(events.status, "published"), gte(events.startsAt, since))).limit(5000),
    db.select({ slug: venues.slug }).from(venues).where(and(eq(venues.status, "published"), eq(venues.listed, true))),
    db.select({ slug: collectives.slug }).from(collectives).where(eq(collectives.status, "published")),
  ]);
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    ...days.map((d) => ({ url: `${base}/?date=${d}`, changeFrequency: "daily" as const, priority: 0.7 })),
    { url: `${base}/lieux`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/carte`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/charte`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/a-propos`, changeFrequency: "yearly", priority: 0.3 },
    ...evs.map((e) => ({ url: `${base}/evenement/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...vs.map((v) => ({ url: `${base}/lieu/${v.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...cs.map((c) => ({ url: `${base}/collectif/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
