import "server-only";
import { db } from "@/db";
import { filterTerms } from "@/db/schema";
import { check, type FilterLists, type ModerationResult } from "./moderation";

// Les listes sont lues en base et gardées 60 secondes en mémoire.
let cache: { at: number; lists: FilterLists } | null = null;

export async function getFilterLists(): Promise<FilterLists> {
  if (cache && Date.now() - cache.at < 60_000) return cache.lists;
  const rows = await db.select({ term: filterTerms.term, kind: filterTerms.kind }).from(filterTerms);
  const lists: FilterLists = { blocked: [], phrases: [], sensitive: [] };
  for (const r of rows) (r.kind === "blocked" ? lists.blocked : r.kind === "phrase" ? lists.phrases : lists.sensitive).push(r.term);
  cache = { at: Date.now(), lists };
  return lists;
}

/** À appeler après une modification des mots depuis l'admin. */
export function clearFilterCache() {
  cache = null;
}

export async function moderate(...fields: (string | null | undefined)[]): Promise<ModerationResult> {
  return check(await getFilterLists(), ...fields);
}
