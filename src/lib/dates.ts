// Toutes les dates de l'agenda sont en heure de Lausanne.
// Une "journée" de l'agenda va de 06:00 à 05:59 le lendemain :
// un concert à 00:30 appartient à la soirée de la veille.
export const TZ = "Europe/Zurich";
export const NIGHT_SHIFT_HOURS = 6;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Date "YYYY-MM-DD" de la soirée en cours à Lausanne. */
export function todayAgenda(now = new Date()): string {
  return agendaDateOf(now);
}

export function agendaDateOf(d: Date): string {
  const shifted = new Date(d.getTime() - NIGHT_SHIFT_HOURS * 3600_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(shifted);
}

export function isValidDate(s: string | undefined | null): s is string {
  if (!s || !ISO.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const toUTC = (s: string) => new Date(s + "T12:00:00Z");
const fromUTC = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(s: string, n: number): string {
  const d = toUTC(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTC(d);
}

export function addMonths(s: string, n: number): string {
  const d = toUTC(s);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return fromUTC(d);
}

/** Lundi de la semaine qui contient s. */
export function weekStart(s: string): string {
  const d = toUTC(s);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lundi
  return addDays(s, -dow);
}

export function monthStart(s: string): string {
  return s.slice(0, 8) + "01";
}

export function monthEnd(s: string): string {
  return addDays(addMonths(monthStart(s), 1), -1);
}

export type View = "jour" | "semaine" | "mois";

export function rangeFor(view: View, date: string): { from: string; to: string } {
  if (view === "semaine") {
    const from = weekStart(date);
    return { from, to: addDays(from, 6) };
  }
  if (view === "mois") return { from: monthStart(date), to: monthEnd(date) };
  return { from: date, to: date };
}

export function stepFor(view: View, date: string, dir: 1 | -1): string {
  if (view === "semaine") return addDays(date, 7 * dir);
  if (view === "mois") return addMonths(date, dir);
  return addDays(date, dir);
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

const loc = (lang: "fr" | "en") => (lang === "fr" ? "fr-CH" : "en-GB");

export function fmtDay(s: string, lang: "fr" | "en", opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: "UTC", ...opts }).format(toUTC(s));
}

export function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-CH", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Numéro de semaine ISO. */
export function isoWeek(s: string): number {
  const d = toUTC(s);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

/** Convertit une date + heure locales de Lausanne en Date (UTC). */
export function zurichToDate(date: string, time: string): Date {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  const offset = asLocal - guess.getTime();
  return new Date(guess.getTime() - offset);
}
