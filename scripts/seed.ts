// Données de départ : vrais lieux et collectifs (scripts/data.ts),
// plus des événements FICTIFS de démonstration (source = "demo").
// Effacer les événements de démo avant la mise en ligne : npm run db:purge-demo
import { eq, inArray } from "drizzle-orm";
import { db, pool, schema } from "./db";
import { VENUES, COLLECTIVES } from "./data";
import { addDays, todayAgenda, zurichToDate } from "../src/lib/dates";
import type { Category } from "../src/db/schema";

const { venues, events, collectives, eventCollectives } = schema;

type E = { t: string; cat: Category; title: string; lineup?: string; venue: string; genres?: string[]; price: string; max?: number; free?: boolean; pwyw?: boolean; acc?: string[]; coll?: string[] };

const POOL: E[] = [
  { t: "18:00", cat: "expo", title: "Sueur froide", lineup: "vernissage", venue: "terreaux", price: "Gratuit", free: true, acc: ["pmr"] },
  { t: "19:00", cat: "atelier", title: "Sérigraphie féministe", venue: "pavillon", price: "Prix libre", pwyw: true, acc: ["flinta"] },
  { t: "19:30", cat: "theatre", title: "Les Corps bavards", lineup: "Cie Rien de grave", venue: "arsenic", price: "25.- / 15.-", max: 25, acc: ["pmr"] },
  { t: "20:00", cat: "danse", title: "Pli", lineup: "Mira Ostende", venue: "sevelin-36", price: "20.-", max: 20, acc: ["pmr"] },
  { t: "20:30", cat: "cine", title: "Paris Is Burning", lineup: "Jennie Livingston, 1990, VOst", venue: "cinematographe", price: "15.-", max: 15, acc: ["pmr"] },
  { t: "21:00", cat: "concert", title: "Trio Basse Pression", venue: "les-jumeaux", genres: ["jazz"], price: "20.-", max: 20 },
  { t: "21:00", cat: "concert", title: "Vipère Molle + Ciel Brûlé", lineup: "double plateau", venue: "le-romandie", genres: ["noise", "rock"], price: "18.-", max: 18, acc: ["safe"] },
  { t: "23:00", cat: "club", title: "Nuit Lilas", lineup: "Sorcière Pressée b2b Kalk", venue: "les-docks", genres: ["techno"], price: "20.-", max: 20, acc: ["safe", "pmr"], coll: ["360-fever"] },
  { t: "23:30", cat: "club", title: "Bars Bruts", venue: "d-club", genres: ["hiphop"], price: "15.-", max: 15 },
  { t: "00:00", cat: "club", title: "Fréquence Mauve", venue: "folklor", genres: ["techno", "house"], price: "20.-", max: 20, acc: ["safe"], coll: ["club-paillettes"] },
  { t: "21:30", cat: "concert", title: "Les Mal-Lunées", lineup: "release party", venue: "le-bourg", genres: ["chanson", "punk"], price: "15.-", max: 15 },
  { t: "22:00", cat: "cine", title: "Nuit du giallo", lineup: "3 films, 1 billet", venue: "cinematheque-suisse", price: "10.-", max: 10, acc: ["pmr"] },
  { t: "20:00", cat: "performance", title: "Bouche cousue", lineup: "Lio Varenne", venue: "theatre-de-vidy", price: "30.- / 20.-", max: 30, acc: ["pmr"] },
  { t: "14:00", cat: "marche", title: "Marché des fanzines", venue: "terreaux", price: "Gratuit", free: true, coll: ["mets-tes-palmes"] },
  { t: "21:00", cat: "concert", title: "Tôlerie Fine", lineup: "+ guest", venue: "la-breche", genres: ["punk"], price: "15.-", max: 15, acc: ["safe"] },
  { t: "21:00", cat: "concert", title: "Grès Doux Quartet", venue: "chorus", genres: ["jazz"], price: "Prix libre", pwyw: true },
  { t: "23:00", cat: "club", title: "Ballroom Night", lineup: "vogue, house", venue: "le-romandie", genres: ["house"], price: "15.-", max: 15, acc: ["safe"], coll: ["4311-kollective", "zagaza"] },
  { t: "23:30", cat: "club", title: "Hypnose", venue: "le-romandie", genres: ["techno"], price: "18.-", max: 18, coll: ["club-francois"] },
  { t: "22:00", cat: "club", title: "Vinyles et bombes", lineup: "live graffiti, VJ", venue: "pavillon", genres: ["house"], price: "Prix libre", pwyw: true, coll: ["la-recre"] },
];

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

async function main() {
  console.log("Lieux...");
  const venueId = new Map<string, string>();
  for (const v of VENUES) {
    const [row] = await db
      .insert(venues)
      .values({ slug: v.slug, name: v.name, address: v.address, postcode: v.postcode, city: v.city, description: v.description, listed: v.listed ?? true })
      .onConflictDoUpdate({
        target: venues.slug,
        set: { name: v.name, address: v.address, postcode: v.postcode, city: v.city, description: v.description, listed: v.listed ?? true },
      })
      .returning({ id: venues.id });
    venueId.set(v.slug, row.id);
  }
  // Lieux de démo d'avant qui ne sont pas dans la liste
  const known = VENUES.map((v) => v.slug);
  const all = await db.select({ id: venues.id, slug: venues.slug }).from(venues);
  const stale = all.filter((v) => !known.includes(v.slug)).map((v) => v.id);
  if (stale.length) await db.delete(venues).where(inArray(venues.id, stale));

  console.log("Collectifs...");
  const collId = new Map<string, string>();
  for (const c of COLLECTIVES) {
    const [row] = await db
      .insert(collectives)
      .values({ slug: c.slug, name: c.name, scene: c.scene, description: c.description })
      .onConflictDoUpdate({ target: collectives.slug, set: { name: c.name, scene: c.scene, description: c.description } })
      .returning({ id: collectives.id });
    collId.set(c.slug, row.id);
  }

  console.log("Événements de démonstration (fictifs)...");
  await db.delete(events).where(eq(events.source, "demo"));
  const start = addDays(todayAgenda(), -10);
  let n = 0;
  for (let d = 0; d < 45; d++) {
    const date = addDays(start, d);
    const count = 4 + ((d * 7) % 6);
    for (let k = 0; k < count; k++) {
      const e = POOL[(d * 5 + k * 3) % POOL.length];
      const civil = Number(e.t.slice(0, 2)) < 6 ? addDays(date, 1) : date;
      const [row] = await db
        .insert(events)
        .values({
          slug: `${slugify(e.title)}-${date}`,
          title: e.title,
          lineup: e.lineup,
          description: "Événement fictif de démonstration.",
          category: e.cat,
          genres: e.genres ?? [],
          venueId: venueId.get(e.venue)!,
          startsAt: zurichToDate(civil, e.t),
          priceLabel: e.price,
          priceMax: e.max ?? null,
          isFree: !!e.free,
          isPayWhatYouWant: !!e.pwyw,
          accessibility: e.acc ?? [],
          source: "demo",
        })
        .onConflictDoNothing()
        .returning({ id: events.id });
      if (row && e.coll) {
        await db.insert(eventCollectives).values(e.coll.map((c) => ({ eventId: row.id, collectiveId: collId.get(c)! })));
      }
      if (row) n++;
    }
  }
  console.log(`${VENUES.length} lieux, ${COLLECTIVES.length} collectifs, ${n} événements de démo.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
