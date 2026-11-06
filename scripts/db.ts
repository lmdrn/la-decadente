// Connexion à la base pour les scripts en ligne de commande (hors Next.js).
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://decadente:decadente@localhost:5433/decadente",
});
export const db = drizzle(pool, { schema });
export { schema };
