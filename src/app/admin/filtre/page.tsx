import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { canModerate, getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { filterTerms } from "@/db/schema";
import { addFilterTerm, removeFilterTerm } from "../actions";

export const instant = false;
export const metadata: Metadata = { title: "Mots filtrés", robots: { index: false, follow: false } };

const KINDS = [
  { key: "blocked", title: "Mots bloquants", help: "Mot entier. L'ajout est refusé automatiquement." },
  { key: "phrase", title: "Expressions bloquantes", help: "Plusieurs mots qui se suivent. L'ajout est refusé automatiquement." },
  { key: "sensitive", title: "Mots sensibles", help: "Souvent réappropriés ou ambigus. L'ajout est publié, mais apparaît dans « À vérifier »." },
] as const;

export default async function FilterPage() {
  const lang = await getLang();
  const t = dict(lang);
  const me = await getCurrentUser();
  if (!me) redirect("/connexion?next=/admin/filtre");
  if (!canModerate(me)) redirect("/");
  const rows = await db.select().from(filterTerms).orderBy(asc(filterTerms.term));

  return (
    <Window title="La Décadente / mots filtrés" menu={mainMenu(t)}>
      <div className="sunk prose" style={{ margin: 10, maxWidth: "none" }}>
        <p style={{ marginTop: 0 }}>
          <Link href="/admin">Retour à l'administration</Link>
        </p>
        <p className="notice">
          Ces listes sont dans la base de données, pas dans le code : elles ne sont jamais visibles sur GitHub.
          Le filtre ignore les majuscules, les accents, les chiffres à la place des lettres et les lettres séparées.
          Les changements s'appliquent en moins d'une minute.
        </p>
        <p className="mu">Contenu choquant par nature : ces listes existent uniquement pour bloquer la haine.</p>
        {KINDS.map((k) => {
          const list = rows.filter((r) => r.kind === k.key);
          return (
            <section key={k.key} aria-labelledby={`h-${k.key}`}>
              <h2 id={`h-${k.key}`}>
                {k.title} ({list.length})
              </h2>
              <p className="mu">{k.help}</p>
              <form action={addFilterTerm} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                <input type="hidden" name="kind" value={k.key} />
                <label className="sr-only" htmlFor={`add-${k.key}`}>Ajouter à « {k.title} »</label>
                <textarea id={`add-${k.key}`} name="term" rows={1} className="sunk field" style={{ flex: "1 1 260px", minHeight: 40 }} placeholder="un par ligne" />
                <button className="b strong" type="submit">Ajouter</button>
              </form>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {list.map((r) => (
                  <form key={r.id} action={removeFilterTerm} style={{ display: "inline-flex" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <span className="sunk" style={{ padding: "4px 8px" }}>{r.term}</span>
                    <button className="b tb" type="submit" aria-label={`Retirer ${r.term}`} style={{ width: 32, minHeight: 32 }}>
                      ×
                    </button>
                  </form>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Window>
  );
}
