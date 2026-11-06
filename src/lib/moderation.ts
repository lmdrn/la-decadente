// Filtre de modération : logique uniquement (aucun mot ici).
// Les mots sont dans la base de données (table filter_terms), gérés depuis /admin.
// - "blocked"   : mot entier, refus automatique
// - "phrase"    : expression, refus automatique
// - "sensitive" : mot souvent réapproprié ou ambigu, publié mais signalé à l'admin

export type FilterLists = { blocked: string[]; phrases: string[]; sensitive: string[] };

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "€": "e", "!": "i" };

/** Minuscules, sans accents, chiffres-lettres convertis, lettres répétées réduites, ponctuation retirée. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[0134578@$€!]/g, (c) => LEET[c] ?? c)
    .replace(/([a-z])\1{2,}/g, "$1")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Découpe en mots, en recollant les lettres isolées : "m o t" devient "mot". */
export function tokens(norm: string): string[] {
  const out: string[] = [];
  let run = "";
  for (const w of norm.split(" ").filter(Boolean)) {
    if (w.length === 1) run += w;
    else {
      if (run) out.push(run);
      run = "";
      out.push(w);
    }
  }
  if (run) out.push(run);
  return out;
}

export type ModerationResult = { decision: "accepted" | "review" | "rejected"; flags: string[] };

export function check(lists: FilterLists, ...fields: (string | null | undefined)[]): ModerationResult {
  const toks = tokens(normalize(fields.filter(Boolean).join(" \n ")));
  const set = new Set(toks);
  const joined = " " + toks.join(" ") + " ";

  const blocked = [...lists.blocked.filter((w) => set.has(w)), ...lists.phrases.filter((p) => joined.includes(` ${p} `))];
  if (blocked.length) return { decision: "rejected", flags: blocked };

  const sensitive = lists.sensitive.filter((w) => set.has(w));
  if (sensitive.length) return { decision: "review", flags: sensitive };
  return { decision: "accepted", flags: [] };
}
