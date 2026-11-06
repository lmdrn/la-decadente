"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { collectives, eventCollectives, events, moderationLog, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { moderate } from "@/lib/moderation";
import { rateLimited } from "@/lib/request";
import { slugify } from "@/lib/slug";
import { zurichToDate } from "@/lib/dates";
import { checkZone, geocodeAddress } from "@/lib/geocode";
import { ACCESS, CATEGORIES, GENRES } from "@/lib/taxonomy";
import { saveEventImage } from "@/lib/images";

export type AddState = { error?: string; values?: Record<string, string | string[]> };

const REFUS = "Ce contenu ne respecte pas la charte de La Décadente (propos discriminants). Il n'a pas été publié.";

async function uniqueSlug(table: typeof events | typeof venues | typeof collectives, base: string) {
  const taken = await db.select({ slug: table.slug }).from(table).where(like(table.slug, `${base}%`));
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

const url = z.union([z.literal(""), z.string().trim().url().max(500).refine((u) => /^https?:\/\//.test(u), "url")]);

const EventInput = z.object({
  title: z.string().trim().min(2).max(120),
  lineup: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(3000).optional().default(""),
  category: z.enum(CATEGORIES.map((c) => c.key) as [string, ...string[]]),
  genres: z.array(z.enum(GENRES.map((g) => g.key) as [string, ...string[]])).max(4),
  venue: z.string().regex(/^[a-z0-9-]{1,80}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]).optional().default(""),
  priceType: z.enum(["gratuit", "libre", "payant"]),
  priceLabel: z.string().trim().max(40).optional().default(""),
  priceMax: z.union([z.literal(""), z.coerce.number().int().min(0).max(1000)]).optional().default(""),
  ticketUrl: url.optional().default(""),
  accessibility: z.array(z.enum(ACCESS.map((a) => a.key) as [string, ...string[]])),
  collectives: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(6),
  newCollective: z.string().trim().max(80).optional().default(""),
  charte: z.literal("on"),
});

export async function addEvent(_prev: AddState, fd: FormData): Promise<AddState> {
  const values: Record<string, string | string[]> = {};
  for (const k of new Set(fd.keys())) {
    if (k === "image") continue;
    const all = fd.getAll(k).map(String);
    values[k] = ["genres", "accessibility", "collectives"].includes(k) ? all : all[0];
  }
  const user = await getCurrentUser();
  if (!user) return { error: "Connecte-toi pour ajouter un événement.", values };
  if (rateLimited(`add-event:${user.id}`, 30, 60 * 60_000)) return { error: "Beaucoup d'ajouts en peu de temps. Réessaie dans une heure.", values };

  const p = EventInput.safeParse({ ...values, genres: values.genres ?? [], accessibility: values.accessibility ?? [], collectives: values.collectives ?? [] });
  if (!p.success) {
    const k = String(p.error.issues[0]?.path[0] ?? "");
    const msgs: Record<string, string> = {
      title: "Le titre doit faire entre 2 et 120 caractères.",
      category: "Choisis un type.",
      venue: "Choisis un lieu.",
      date: "Date invalide.",
      time: "Heure invalide.",
      ticketUrl: "Le lien billetterie doit commencer par https://",
      charte: "Tu dois accepter la charte.",
      genres: "4 genres maximum.",
      collectives: "6 collectifs maximum.",
    };
    return { error: msgs[k] ?? "Vérifie le formulaire.", values };
  }
  const d = p.data;

  const mod = moderate(d.title, d.lineup, d.description, d.newCollective, d.priceLabel);
  if (mod.decision === "rejected") {
    await db.insert(moderationLog).values({ kind: "event", decision: "rejected", reasons: mod.flags, by: "filtre" });
    return { error: REFUS, values };
  }

  const [venue] = await db.select().from(venues).where(and(eq(venues.slug, d.venue), eq(venues.status, "published"))).limit(1);
  if (!venue) return { error: "Ce lieu n'existe pas (encore). Ajoute-le d'abord.", values };

  const startsAt = zurichToDate(d.date, d.time);
  if (Number.isNaN(startsAt.getTime())) return { error: "Date ou heure invalide.", values };
  if (startsAt.getTime() < Date.now() - 12 * 3600_000) return { error: "Cette date est déjà passée.", values };
  if (startsAt.getTime() > Date.now() + 2 * 365 * 86400_000) return { error: "Date trop lointaine (2 ans maximum).", values };
  let endsAt: Date | null = null;
  if (d.endTime) {
    endsAt = zurichToDate(d.date, d.endTime);
    if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 86400_000); // fin après minuit
  }

  // Photo (facultative)
  let imageName: string | null = null;
  const img = fd.get("image");
  if (img instanceof File && img.size > 0) {
    const saved = await saveEventImage(img);
    if (!saved.ok)
      return {
        error:
          saved.error === "trop-lourde" ? "La photo dépasse 5 Mo." : saved.error === "format" ? "La photo doit être en JPG, PNG ou WebP." : "Cette photo n'a pas pu être lue. Essaie un autre fichier.",
        values,
      };
    imageName = saved.name;
  }

  // Collectifs : existants + éventuellement un nouveau
  const collIds: string[] = [];
  if (d.collectives.length) {
    const rows = await db.select({ id: collectives.id }).from(collectives).where(and(inArray(collectives.slug, d.collectives), eq(collectives.status, "published")));
    collIds.push(...rows.map((r) => r.id));
  }
  if (d.newCollective) {
    const base = slugify(d.newCollective);
    const [existing] = await db.select({ id: collectives.id }).from(collectives).where(eq(collectives.slug, base)).limit(1);
    if (existing) collIds.push(existing.id);
    else {
      const [c] = await db
        .insert(collectives)
        .values({ slug: await uniqueSlug(collectives, base), name: d.newCollective, createdBy: user.id })
        .returning({ id: collectives.id });
      collIds.push(c.id);
    }
  }

  const slug = await uniqueSlug(events, `${slugify(d.title)}-${d.date}`);
  const [ev] = await db
    .insert(events)
    .values({
      slug,
      title: d.title,
      lineup: d.lineup || null,
      description: d.description || null,
      category: d.category as (typeof CATEGORIES)[number]["key"],
      genres: d.genres,
      venueId: venue.id,
      startsAt,
      endsAt,
      priceLabel: d.priceType === "payant" ? d.priceLabel || (d.priceMax !== "" ? `${d.priceMax}.-` : null) : null,
      priceMax: d.priceType === "payant" && d.priceMax !== "" ? Number(d.priceMax) : null,
      isFree: d.priceType === "gratuit",
      isPayWhatYouWant: d.priceType === "libre",
      ticketUrl: d.ticketUrl || null,
      imageUrl: imageName,
      accessibility: d.accessibility,
      source: "user",
      status: "published",
      createdBy: user.id,
    })
    .returning({ id: events.id });
  if (collIds.length) await db.insert(eventCollectives).values([...new Set(collIds)].map((c) => ({ eventId: ev.id, collectiveId: c })));
  await db.insert(moderationLog).values({ kind: "event", refId: ev.id, decision: mod.decision === "review" ? "review" : "accepted", reasons: mod.flags, by: "filtre" });

  redirect(`/evenement/${slug}?ajoute=1`);
}

const VenueInput = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(150),
  postcode: z.string().trim().regex(/^\d{4}$/),
  city: z.string().trim().min(2).max(60),
  website: url.optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  charte: z.literal("on"),
});

export async function addVenue(_prev: AddState, fd: FormData): Promise<AddState> {
  const values = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
  const user = await getCurrentUser();
  if (!user) return { error: "Connecte-toi pour ajouter un lieu.", values };
  if (rateLimited(`add-venue:${user.id}`, 10, 60 * 60_000)) return { error: "Beaucoup d'ajouts en peu de temps. Réessaie dans une heure.", values };
  const p = VenueInput.safeParse(values);
  if (!p.success) {
    const k = String(p.error.issues[0]?.path[0] ?? "");
    const msgs: Record<string, string> = {
      name: "Le nom doit faire entre 2 et 100 caractères.",
      address: "Indique la rue et le numéro.",
      postcode: "Le code postal suisse a 4 chiffres.",
      city: "Indique la commune.",
      website: "Le site doit commencer par https://",
      charte: "Tu dois accepter la charte.",
    };
    return { error: msgs[k] ?? "Vérifie le formulaire.", values };
  }
  const d = p.data;
  const mod = moderate(d.name, d.description);
  if (mod.decision === "rejected") {
    await db.insert(moderationLog).values({ kind: "venue", decision: "rejected", reasons: mod.flags, by: "filtre" });
    return { error: REFUS, values };
  }

  const hit = await geocodeAddress(`${d.address}, ${d.postcode} ${d.city}`);
  if (!hit) return { error: "Adresse introuvable sur la carte. Vérifie la rue, le numéro et le code postal.", values };
  const zone = checkZone(hit);
  if (!zone.ok) {
    return {
      error:
        zone.reason === "ouest-morges"
          ? "Ce lieu est à l'ouest de Morges : cette région est couverte par La Décadanse (ladecadanse.ch). Va l'y ajouter !"
          : "La Décadente couvre le canton de Vaud (Lausanne surtout, jusqu'à Morges à l'ouest).",
      values,
    };
  }

  const [dup] = await db.select({ slug: venues.slug }).from(venues).where(eq(venues.slug, slugify(d.name))).limit(1);
  if (dup) return { error: `Ce lieu existe déjà : /lieu/${dup.slug}`, values };

  const slug = await uniqueSlug(venues, slugify(d.name));
  const [v] = await db
    .insert(venues)
    .values({
      slug,
      name: d.name,
      address: d.address,
      postcode: d.postcode,
      city: d.city,
      lat: hit.lat,
      lng: hit.lng,
      website: d.website || null,
      description: d.description || null,
      createdBy: user.id,
    })
    .returning({ id: venues.id });
  await db.insert(moderationLog).values({ kind: "venue", refId: v.id, decision: mod.decision === "review" ? "review" : "accepted", reasons: mod.flags, by: "filtre" });
  redirect(`/ajouter/evenement?lieu=${slug}&nouveau-lieu=1`);
}
