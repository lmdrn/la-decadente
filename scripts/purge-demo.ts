// Supprime tous les événements fictifs de démonstration.
import { eq } from "drizzle-orm";
import { db, pool, schema } from "./db";

async function main() {
  const res = await db.delete(schema.events).where(eq(schema.events.source, "demo")).returning({ id: schema.events.id });
  console.log(`${res.length} événements de démo supprimés.`);
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
