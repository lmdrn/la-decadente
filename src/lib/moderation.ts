// Modération par filtre de mots (sans service externe).
// - Mots BLOQUANTS : l'ajout est refusé, avec renvoi à la charte.
// - Mots SENSIBLES (souvent réappropriés, ex. dans le nom d'une soirée queer) :
//   publié, mais signalé "à vérifier" dans l'espace admin.
// Listes : src/lib/blocklist.ts
import { BLOCKED, SENSITIVE, BLOCKED_PHRASES } from "./blocklist";

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

/** Découpe en mots, en recollant les lettres isolées : "n e g r e" devient "negre". */
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

export type ModerationResult =
  | { decision: "accepted"; flags: string[] }
  | { decision: "review"; flags: string[] }
  | { decision: "rejected"; flags: string[] };

export function moderate(...fields: (string | null | undefined)[]): ModerationResult {
  const norm = normalize(fields.filter(Boolean).join(" \n "));
  const toks = tokens(norm);
  const set = new Set(toks);
  const joined = " " + toks.join(" ") + " ";

  const blocked = [
    ...BLOCKED.filter((w) => set.has(w)),
    ...BLOCKED_PHRASES.filter((p) => joined.includes(` ${p} `)),
  ];
  if (blocked.length) return { decision: "rejected", flags: blocked };

  const sensitive = SENSITIVE.filter((w) => set.has(w));
  if (sensitive.length) return { decision: "review", flags: sensitive };
  return { decision: "accepted", flags: [] };
}
