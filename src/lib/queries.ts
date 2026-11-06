import "server-only";
import { and, asc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { collectives, eventCollectives, events, favorites, venues, type Category } from "@/db/schema";
import { isCategory, GENRES, ACCESS } from "./taxonomy";

export type Filters = {
  types: Category[];
  genres: string[];
  venues: string[];
  collectives: string[];
  free: boolean;
  pwyw: boolean;
  under20: boolean;
  access: string[];
  q: string;
};

type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function parseFilters(sp: SP): Filters {
  return {
    types: arr(sp.type).filter(isCategory),
    genres: arr(sp.genre).filter((g) => GENRES.some((x) => x.key === g)),
    venues: arr(sp.lieu).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)),
    collectives: arr(sp.collectif).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)),
    free: sp.gratuit === "1",
    pwyw: sp.prixlibre === "1",
    under20: sp.max20 === "1",
    access: arr(sp.acces).filter((a) => ACCESS.some((x) => x.key === a)),
    q: (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100),
  };
}

export const activeFilterCount = (f: Filters) =>
  f.types.length + f.genres.length + f.venues.length + f.collectives.length + f.access.length + (f.free ? 1 : 0) + (f.pwyw ? 1 : 0) + (f.under20 ? 1 : 0) + (f.q ? 1 : 0);

// Journée de l'agenda : 06:00 à 05:59, heure de Lausanne.
const agendaDate = sql<string>`to_char((${events.startsAt} at time zone 'Europe/Zurich') - interval '6 hours', 'YYYY-MM-DD')`;

function whereFor(from: string, to: string, f: Filters): SQL {
  const conds: (SQL | undefined)[] = [
    eq(events.status, "published"),
    eq(venues.status, "published"),
    gte(agendaDate, from),
    lte(agendaDate, to),
  ];
  if (f.types.length) conds.push(inArray(events.category, f.types));
  if (f.genres.length) conds.push(sql`${events.genres} && ${sql.param(f.genres)}::text[]`);
  if (f.venues.length) conds.push(inArray(venues.slug, f.venues));
  if (f.collectives.length)
    conds.push(
      sql`exists(select 1 from ${eventCollectives} ec join ${collectives} c on c.id = ec.collective_id where ec.event_id = ${events.id} and c.slug = any(${sql.param(f.collectives)}::text[]))`,
    );
  if (f.access.length) conds.push(sql`${events.accessibility} @> ${sql.param(f.access)}::text[]`);
  const price: SQL[] = [];
  if (f.free) price.push(eq(events.isFree, true));
  if (f.pwyw) price.push(eq(events.isPayWhatYouWant, true));
  if (f.under20) price.push(sql`(${events.isFree} or ${events.priceMax} <= 20)`);
  if (price.length) conds.push(or(...price));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
    conds.push(or(ilike(events.title, like), ilike(events.lineup, like), ilike(venues.name, like), ilike(events.description, like)));
  }
  return and(...conds)!;
}

export async function listEvents(from: string, to: string, f: Filters, userId?: string) {
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      lineup: events.lineup,
      category: events.category,
      genres: events.genres,
      startsAt: events.startsAt,
      priceLabel: events.priceLabel,
      isFree: events.isFree,
      isPayWhatYouWant: events.isPayWhatYouWant,
      accessibility: events.accessibility,
      imageUrl: events.imageUrl,
      day: agendaDate,
      venueName: venues.name,
      venueSlug: venues.slug,
      collectives: sql<{ slug: string; name: string }[]>`coalesce((select json_agg(json_build_object('slug', c.slug, 'name', c.name) order by c.name) from ${eventCollectives} ec join ${collectives} c on c.id = ec.collective_id where ec.event_id = ${events.id} and c.status = 'published'), '[]'::json)`,
      fav: userId
        ? sql<boolean>`exists(select 1 from ${favorites} where ${favorites.eventId} = ${events.id} and ${favorites.userId} = ${userId})`
        : sql<boolean>`false`,
    })
    .from(events)
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(whereFor(from, to, f))
    .orderBy(asc(agendaDate), asc(events.startsAt), asc(events.title))
    .limit(2000);
  return rows;
}

export type AgendaRow = Awaited<ReturnType<typeof listEvents>>[number];

export const NO_FILTERS: Filters = { types: [], genres: [], venues: [], collectives: [], free: false, pwyw: false, under20: false, access: [], q: "" };

export async function listVenueOptions(includeUnlisted = false) {
  return db
    .select({ id: venues.id, slug: venues.slug, name: venues.name, city: venues.city })
    .from(venues)
    .where(includeUnlisted ? eq(venues.status, "published") : and(eq(venues.status, "published"), eq(venues.listed, true)))
    .orderBy(asc(venues.name));
}

export async function listCollectiveOptions() {
  return db
    .select({ id: collectives.id, slug: collectives.slug, name: collectives.name })
    .from(collectives)
    .where(eq(collectives.status, "published"))
    .orderBy(asc(collectives.name));
}

/** Événements à venir (à partir de la soirée en cours), filtrés par lieu, collectif ou favoris. */
export async function upcoming(opts: { venueId?: string; collectiveId?: string; favoritesOf?: string; from: string; limit?: number; userId?: string }) {
  const conds: (SQL | undefined)[] = [eq(events.status, "published"), eq(venues.status, "published"), gte(agendaDate, opts.from)];
  if (opts.venueId) conds.push(eq(events.venueId, opts.venueId));
  if (opts.collectiveId)
    conds.push(sql`exists(select 1 from ${eventCollectives} ec where ec.event_id = ${events.id} and ec.collective_id = ${opts.collectiveId})`);
  if (opts.favoritesOf)
    conds.push(sql`exists(select 1 from ${favorites} f where f.event_id = ${events.id} and f.user_id = ${opts.favoritesOf})`);
  const uid = opts.userId ?? opts.favoritesOf;
  return db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      lineup: events.lineup,
      category: events.category,
      genres: events.genres,
      startsAt: events.startsAt,
      priceLabel: events.priceLabel,
      isFree: events.isFree,
      isPayWhatYouWant: events.isPayWhatYouWant,
      accessibility: events.accessibility,
      imageUrl: events.imageUrl,
      day: agendaDate,
      venueName: venues.name,
      venueSlug: venues.slug,
      collectives: sql<{ slug: string; name: string }[]>`coalesce((select json_agg(json_build_object('slug', c.slug, 'name', c.name) order by c.name) from ${eventCollectives} ec join ${collectives} c on c.id = ec.collective_id where ec.event_id = ${events.id} and c.status = 'published'), '[]'::json)`,
      fav: uid
        ? sql<boolean>`exists(select 1 from ${favorites} where ${favorites.eventId} = ${events.id} and ${favorites.userId} = ${uid})`
        : sql<boolean>`false`,
    })
    .from(events)
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(...conds))
    .orderBy(asc(events.startsAt))
    .limit(opts.limit ?? 200);
}

export async function getEventBySlug(slug: string) {
  const [row] = await db
    .select({ event: events, venue: venues })
    .from(events)
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  if (!row) return null;
  const colls = await db
    .select({ slug: collectives.slug, name: collectives.name })
    .from(eventCollectives)
    .innerJoin(collectives, eq(collectives.id, eventCollectives.collectiveId))
    .where(and(eq(eventCollectives.eventId, row.event.id), eq(collectives.status, "published")));
  return { ...row, collectives: colls };
}

export async function getVenueBySlug(slug: string) {
  const [v] = await db.select().from(venues).where(and(eq(venues.slug, slug), eq(venues.status, "published"))).limit(1);
  return v ?? null;
}

export async function getCollectiveBySlug(slug: string) {
  const [c] = await db.select().from(collectives).where(and(eq(collectives.slug, slug), eq(collectives.status, "published"))).limit(1);
  return c ?? null;
}

export async function listVenuesWithCounts(from: string) {
  return db
    .select({
      slug: venues.slug,
      name: venues.name,
      address: venues.address,
      postcode: venues.postcode,
      city: venues.city,
      lat: venues.lat,
      lng: venues.lng,
      n: sql<number>`(select count(*)::int from ${events} e where e.venue_id = ${venues.id} and e.status = 'published' and to_char((e.starts_at at time zone 'Europe/Zurich') - interval '6 hours', 'YYYY-MM-DD') >= ${from})`,
    })
    .from(venues)
    .where(and(eq(venues.status, "published"), eq(venues.listed, true)))
    .orderBy(asc(venues.city), asc(venues.name));
}

export async function listCollectivesWithCounts(from: string) {
  return db
    .select({
      slug: collectives.slug,
      name: collectives.name,
      scene: collectives.scene,
      description: collectives.description,
      n: sql<number>`(select count(*)::int from ${eventCollectives} ec join ${events} e on e.id = ec.event_id where ec.collective_id = ${collectives.id} and e.status = 'published' and to_char((e.starts_at at time zone 'Europe/Zurich') - interval '6 hours', 'YYYY-MM-DD') >= ${from})`,
    })
    .from(collectives)
    .where(eq(collectives.status, "published"))
    .orderBy(asc(collectives.scene), asc(collectives.name));
}

export async function categoryCounts(from: string, to: string) {
  const empty = NO_FILTERS;
  const rows = await db
    .select({ category: events.category, n: sql<number>`count(*)::int` })
    .from(events)
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(whereFor(from, to, empty))
    .groupBy(events.category);
  return Object.fromEntries(rows.map((r) => [r.category, r.n])) as Record<string, number>;
}
