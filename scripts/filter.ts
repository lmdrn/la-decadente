// Sauvegarde et restauration des mots du filtre, dans un fichier PRIVÉ
// jamais envoyé sur GitHub (filtre.local.json, ignoré par git).
//
//   npm run filter:export   base -> filtre.local.json
//   npm run filter:import   filtre.local.json -> base (ajoute, ne supprime rien)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { db, pool, schema } from "./db";
import { normalize } from "../src/lib/moderation";

const FILE = "filtre.local.json";
type Kind = "blocked" | "phrase" | "sensitive";

async function main() {
  const cmd = process.argv[2];
  if (cmd === "export") {
    const rows = await db.select({ term: schema.filterTerms.term, kind: schema.filterTerms.kind }).from(schema.filterTerms);
    const out: Record<Kind, string[]> = { blocked: [], phrase: [], sensitive: [] };
    for (const r of rows) out[r.kind].push(r.term);
    for (const k of Object.keys(out) as Kind[]) out[k].sort();
    writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
    console.log(`${rows.length} mots exportés dans ${FILE} (fichier privé, à garder hors de GitHub).`);
  } else if (cmd === "import") {
    if (!existsSync(FILE)) throw new Error(`${FILE} introuvable.`);
    const data = JSON.parse(readFileSync(FILE, "utf8")) as Partial<Record<Kind, string[]>>;
    let n = 0;
    for (const kind of ["blocked", "phrase", "sensitive"] as Kind[]) {
      for (const raw of data[kind] ?? []) {
        const term = normalize(raw);
        if (!term) continue;
        const r = await db.insert(schema.filterTerms).values({ term, kind }).onConflictDoNothing().returning({ id: schema.filterTerms.id });
        n += r.length;
      }
    }
    console.log(`${n} mots ajoutés depuis ${FILE}.`);
  } else {
    console.log("Usage : npm run filter:export | npm run filter:import");
  }
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
