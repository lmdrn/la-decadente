// Ajoute les coordonnées (carte) aux lieux qui n'en ont pas, depuis leur adresse.
// OpenStreetMap / Nominatim : 1 requête par seconde maximum.
import { and, eq, isNull, ne } from "drizzle-orm";
import { db, pool, schema } from "./db";
import { geocodeAddress } from "../src/lib/geocode";

async function main() {
  const rows = await db
    .select()
    .from(schema.venues)
    .where(and(isNull(schema.venues.lat), ne(schema.venues.address, "à compléter")));
  for (const v of rows) {
    const hit = await geocodeAddress(`${v.address}, ${v.postcode ?? ""} ${v.city}`);
    if (hit) {
      await db.update(schema.venues).set({ lat: hit.lat, lng: hit.lng }).where(eq(schema.venues.id, v.id));
      console.log(`OK ${v.name} : ${hit.lat.toFixed(5)}, ${hit.lng.toFixed(5)}`);
    } else console.log(`-- ${v.name} : introuvable`);
    await new Promise((r) => setTimeout(r, 1100));
  }
  await pool.end();
}
main();
