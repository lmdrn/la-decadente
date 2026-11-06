import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { Devil } from "@/components/Devil";
import { AutoSubmitForm, VisitCounter, AppearanceButton } from "@/components/ClientBits";
import { EventRow } from "@/components/EventRows";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { activeFilterCount, categoryCounts, listEvents, listVenueOptions, listCollectiveOptions, parseFilters, type AgendaRow, type Filters } from "@/lib/queries";
import { CATEGORIES, GENRES, ACCESS, type Lang } from "@/lib/taxonomy";
import { addDays, eachDay, fmtDay, fmtTime, isValidDate, isoWeek, rangeFor, stepFor, todayAgenda, weekStart, type View } from "@/lib/dates";

type SP = Record<string, string | string[] | undefined>;

export const instant = false;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp).some((k) => !["vue", "date"].includes(k));
  // Les combinaisons de filtres ne sont pas indexées (contenu dupliqué) ; les dates oui.
  return { robots: filtered ? { index: false, follow: true } : undefined };
}

function qs(base: SP, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (k in patch) continue;
    for (const x of Array.isArray(v) ? v : v !== undefined ? [v] : []) p.append(k, x);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) p.set(k, v);
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<SP> }) {
  await connection(); // l'agenda dépend de l'heure actuelle : rendu à chaque requête
  const sp = await searchParams;
  const lang = await getLang();
  const t = dict(lang);
  const user = await getCurrentUser();
  const view: View = sp.vue === "semaine" || sp.vue === "mois" ? sp.vue : "jour";
  const today = todayAgenda();
  const date = isValidDate(typeof sp.date === "string" ? sp.date : null) ? (sp.date as string) : today;
  const { from, to } = rangeFor(view, date);
  const f = parseFilters(sp);
  const [rows, counts, venueOpts, collOpts] = await Promise.all([listEvents(from, to, f, user?.id), categoryCounts(from, to), listVenueOptions(), listCollectiveOptions()]);

  const nActive = activeFilterCount(f);
  const prev = stepFor(view, date, -1);
  const next = stepFor(view, date, 1);

  let kicker: string;
  let heading: string;
  if (view === "jour") {
    kicker = date === today ? `${t.aujourdhui}, ${rows.length} ${rows.length > 1 ? t.evenements : t.evenement}` : `${rows.length} ${rows.length > 1 ? t.evenements : t.evenement}`;
    heading = `${fmtDay(date, lang, { weekday: "short" }).replace(".", "")} ${fmtDay(date, lang, { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".")}`;
  } else if (view === "semaine") {
    kicker = `${t.semaineN} ${isoWeek(from)}, ${rows.length} ${t.evenements}`;
    heading = `${fmtDay(from, lang, { day: "2-digit", month: "short" })} ${lang === "fr" ? "au" : "to"} ${fmtDay(to, lang, { day: "2-digit", month: "short" })}`;
  } else {
    kicker = `${rows.length} ${t.evenements}`;
    heading = fmtDay(from, lang, { month: "long", year: "numeric" });
  }

  const title = lang === "fr" ? "La Décadente / agenda" : "La Décadente / agenda";

  return (
    <Window title={title} menu={mainMenu(t)}>
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: "auto" }}>
          <Devil px={4} />
          <div>
            <div className="mu">{kicker}</div>
            <h2 className="fn caps bigdate" style={{ margin: 0, fontSize: 46, lineHeight: 0.9 }}>
              {heading}
            </h2>
          </div>
        </div>
        <Link className="b" href={qs(sp, { date: prev })} aria-label={t.precedent} rel="nofollow">
          ◄
        </Link>
        <Link className="b" href={qs(sp, { date: next })} aria-label={t.suivant} rel="nofollow">
          ►
        </Link>
        <div role="group" aria-label="Vue" style={{ display: "flex", gap: 2 }}>
          {(["jour", "semaine", "mois"] as View[]).map((v) => (
            <Link key={v} className="b" href={qs(sp, { vue: v === "jour" ? undefined : v })} aria-current={view === v ? "page" : undefined}>
              {v === "jour" ? t.jour : v === "semaine" ? t.semaine : t.mois}
            </Link>
          ))}
        </div>
        {date !== today && (
          <Link className="b" href={qs(sp, { date: undefined })}>
            {t.aujourdhui}
          </Link>
        )}
        <AppearanceButton label={t.apparence} />
        <Link className="b strong" href="/ajouter/evenement">
          {t.ajouter}
        </Link>
      </div>

      <div className="body">
        <Filters t={t} lang={lang} f={f} nActive={nActive} counts={counts} venues={venueOpts} colls={collOpts} view={view} date={date} />
        <main className="sunk content" aria-live="polite">
          {rows.length === 0 ? (
            <p className="empty">{t.rien}</p>
          ) : view === "jour" ? (
            <>{rows.map((e) => <EventRow key={e.id} e={e} lang={lang} t={t} />)}</>
          ) : view === "semaine" ? (
            <Week rows={rows} from={from} to={to} lang={lang} today={today} sp={sp} t={t} />
          ) : (
            <Month rows={rows} from={from} to={to} lang={lang} today={today} sp={sp} t={t} />
          )}
        </main>
      </div>

      <div className="status">
        <span className="sunk" style={{ flex: "1 1 260px" }}>
          {rows.length} {lang === "fr" ? "objet(s)" : "item(s)"}
          {nActive > 0 && (
            <>
              {" "}
              ({nActive} {t.filtres.toLowerCase()} {t.actifs}, <Link href={qs({ vue: sp.vue, date: sp.date }, {})}>{t.effacer.toLowerCase()}</Link>)
            </>
          )}
        </span>
        <VisitCounter label={t.visiteur} />
      </div>
    </Window>
  );
}

function Filters({
  t,
  lang,
  f,
  nActive,
  counts,
  venues,
  colls,
  view,
  date,
}: {
  t: ReturnType<typeof dict>;
  lang: Lang;
  f: Filters;
  nActive: number;
  counts: Record<string, number>;
  venues: { slug: string; name: string }[];
  colls: { slug: string; name: string }[];
  view: View;
  date: string;
}) {
  return (
    <AutoSubmitForm className="filters" action="/" method="get" role="search">
      {view !== "jour" && <input type="hidden" name="vue" value={view} />}
      <input type="hidden" name="date" value={date} />
      <div>
        <label htmlFor="q" className="fd" style={{ fontWeight: 700 }}>
          {t.rechercher}
        </label>
        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
          <input id="q" name="q" type="search" className="sunk field" placeholder={t.rechercherPh} defaultValue={f.q} />
          <button className="b" type="submit">
            OK
          </button>
        </div>
      </div>
      <details className="flt" open>
        <summary>
          ▾ {t.filtres}
          {nActive > 0 ? ` (${nActive} ${nActive > 1 ? t.actifs : t.actifs.replace(/s$/, "")})` : ""}
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
          <fieldset className="g">
            <legend>{t.type}</legend>
            {CATEGORIES.map((c) => (
              <label key={c.key} className="opt">
                <input type="checkbox" name="type" value={c.key} defaultChecked={f.types.includes(c.key)} />
                <span className={`sq k-${c.key}`} style={{ margin: 0 }} aria-hidden="true" />
                {c[lang]}
                <span className="n">{counts[c.key] ?? 0}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="g">
            <legend>{t.genre}</legend>
            <div className="scrolllist">
              {GENRES.map((g) => (
                <label key={g.key} className="opt">
                  <input type="checkbox" name="genre" value={g.key} defaultChecked={f.genres.includes(g.key)} />
                  {g[lang]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="g">
            <legend>{t.lieu}</legend>
            <div className="sunk scrolllist">
              {venues.map((v) => (
                <label key={v.slug} className="opt">
                  <input type="checkbox" name="lieu" value={v.slug} defaultChecked={f.venues.includes(v.slug)} />
                  {v.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="g">
            <legend>{lang === "fr" ? "Collectif" : "Collective"}</legend>
            <div className="sunk scrolllist">
              {colls.map((c) => (
                <label key={c.slug} className="opt">
                  <input type="checkbox" name="collectif" value={c.slug} defaultChecked={f.collectives.includes(c.slug)} />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="g">
            <legend>{t.prixAcces}</legend>
            <label className="opt">
              <input type="checkbox" name="gratuit" value="1" defaultChecked={f.free} />
              {t.gratuit}
            </label>
            <label className="opt">
              <input type="checkbox" name="prixlibre" value="1" defaultChecked={f.pwyw} />
              {t.prixLibre}
            </label>
            <label className="opt">
              <input type="checkbox" name="max20" value="1" defaultChecked={f.under20} />
              {t.moins20}
            </label>
            {ACCESS.map((a) => (
              <label key={a.key} className="opt">
                <input type="checkbox" name="acces" value={a.key} defaultChecked={f.access.includes(a.key)} />
                {a[lang]}
              </label>
            ))}
          </fieldset>
          <noscript>
            <button className="b" type="submit">
              {t.appliquer}
            </button>
          </noscript>
        </div>
      </details>
    </AutoSubmitForm>
  );
}

function Week({ rows, from, to, lang, today, sp, t }: { rows: AgendaRow[]; from: string; to: string; lang: Lang; today: string; sp: SP; t: ReturnType<typeof dict> }) {
  const byDay = new Map<string, AgendaRow[]>();
  for (const r of rows) byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]);
  return (
    <div className="wk">
      {eachDay(from, to).map((d) => {
        const list = byDay.get(d) ?? [];
        return (
          <div key={d}>
            <Link className={`wh ${d === today ? "on" : ""}`} href={qs(sp, { vue: undefined, date: d })}>
              {fmtDay(d, lang, { weekday: "short", day: "2-digit" })} <span className="mu" style={{ color: "inherit" }}>({list.length})</span>
            </Link>
            {list.slice(0, 8).map((e) => (
              <div key={e.id} className="wi">
                <span className={`sq k-${e.category}`} style={{ margin: "0 4px 0 0", verticalAlign: -2 }} aria-hidden="true" />
                <b>{fmtTime(e.startsAt)}</b> <Link href={`/evenement/${e.slug}`}>{e.title}</Link>
                <div className="mu">{e.venueName}</div>
              </div>
            ))}
            {list.length > 8 && (
              <div className="wi">
                <Link href={qs(sp, { vue: undefined, date: d })}>+ {t.voirTout}</Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Month({ rows, from, to, lang, today, sp, t }: { rows: AgendaRow[]; from: string; to: string; lang: Lang; today: string; sp: SP; t: ReturnType<typeof dict> }) {
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.day, (count.get(r.day) ?? 0) + 1);
  const start = weekStart(from);
  const days = eachDay(start, to);
  while (days.length % 7) days.push("");
  const names = eachDay(start, addDays(start, 6));
  return (
    <div className="mo">
      {names.map((d) => (
        <div key={d} className="h">
          {fmtDay(d, lang, { weekday: "short" })}
        </div>
      ))}
      {days.map((d, i) =>
        !d || d < from ? (
          <div key={i} className="c out" aria-hidden="true" />
        ) : (
          <Link key={d} className={`c ${d === today ? "on" : ""}`} href={qs(sp, { vue: undefined, date: d })}>
            <span className="n">{Number(d.slice(8))}</span>
            <span className="cnt">
              {count.get(d) ?? 0} {(count.get(d) ?? 0) > 1 ? t.evenements : t.evenement}
            </span>
          </Link>
        ),
      )}
    </div>
  );
}
