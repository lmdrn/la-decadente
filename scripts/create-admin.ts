// Crée (ou promeut) le compte admin.
// Usage : npm run admin:create -- ton@email.ch "Dark Lélé"
// Un mot de passe aléatoire est affiché une seule fois : change-le ensuite.
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool, schema } from "./db";

async function main() {
  const [email, name = "Admin"] = process.argv.slice(2);
  if (!email || !email.includes("@")) {
    console.error('Usage : npm run admin:create -- email "Nom"');
    process.exit(1);
  }
  const lower = email.toLowerCase();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, lower)).limit(1);
  if (existing[0]) {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing[0].id));
    console.log(`${lower} est maintenant admin.`);
  } else {
    const password = randomBytes(12).toString("base64url");
    await db.insert(schema.users).values({ email: lower, displayName: name, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
    console.log(`Compte admin créé : ${lower}`);
    console.log(`Mot de passe provisoire : ${password}`);
  }
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
