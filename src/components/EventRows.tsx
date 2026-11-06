import Link from "next/link";
import { FavButton } from "./ClientBits";
import type { AgendaRow } from "@/lib/queries";
import type { Dict } from "@/lib/i18n";
import { accessShort, categoryLabel, genreLabel, type Lang } from "@/lib/taxonomy";
import { fmtDay, fmtTime } from "@/lib/dates";

export function priceText(r: Pick<AgendaRow, "isFree" | "isPayWhatYouWant" | "priceLabel">, t: Dict) {
  if (r.isFree) return t.gratuit;
  if (r.isPayWhatYouWant) return t.prixLibre;
  return r.priceLabel ?? "";
}

export function EventRow({ e, lang, t }: { e: AgendaRow; lang: Lang; t: Dict }) {
  return (
    <article className={`row ${e.imageUrl ? "has-img" : ""}`}>
      <div className="t">{fmtTime(e.startsAt)}</div>
      <span className={`sq k-${e.category}`} aria-hidden="true" />
      {e.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="thumb" src={`/media/${e.imageUrl}-t.webp`} alt="" width={72} height={72} loading="lazy" decoding="async" />
      )}
      <div style={{ minWidth: 0 }}>
        <div className="mu">
          {categoryLabel(e.category, lang)}
          {e.genres.length > 0 && ` / ${e.genres.map((g) => genreLabel(g, lang)).join(", ")}`}
        </div>
        <h3 className="ttl caps">
          <Link href={`/evenement/${e.slug}`}>{e.title}</Link>
        </h3>
        {e.lineup && <div style={{ fontSize: 14 }}>{e.lineup}</div>}
        <div style={{ fontSize: 14 }}>
          @ <Link href={`/lieu/${e.venueSlug}`}>{e.venueName}</Link>
          {e.collectives.length > 0 && (
            <>
              {" "}
              {lang === "fr" ? "par" : "by"}{" "}
              {e.collectives.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 && ", "}
                  <Link href={`/collectif/${c.slug}`}>{c.name}</Link>
                </span>
              ))}
            </>
          )}
        </div>
        {e.accessibility.map((a) => (
          <span key={a} className="acc">
            {accessShort(a)}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div className="pr">{priceText(e, t)}</div>
        <FavButton id={e.id} initial={e.fav} labels={[t.favoriAjouter, t.favoriRetirer]} />
      </div>
    </article>
  );
}

/** Liste groupée par soirée, avec un titre de jour. */
export function EventListByDay({ rows, lang, t, empty }: { rows: AgendaRow[]; lang: Lang; t: Dict; empty: string }) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  const groups: [string, AgendaRow[]][] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0] === r.day) last[1].push(r);
    else groups.push([r.day, [r]]);
  }
  return (
    <>
      {groups.map(([day, list]) => (
        <section key={day}>
          <h3 className="dayhead caps" style={{ margin: 0 }}>
            {fmtDay(day, lang, { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {list.map((e) => (
            <EventRow key={e.id} e={e} lang={lang} t={t} />
          ))}
        </section>
      ))}
    </>
  );
}
