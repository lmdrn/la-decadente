import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { canModerate, getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { collectives, contactMessages, events, moderationLog, users, venues } from "@/db/schema";
import { agendaDateOf, fmtTime } from "@/lib/dates";
import { removeEventImage, markMessageHandled, markReviewed, removeCollective, removeEvent, removeVenue, restoreEvent, setRole, toggleVenueListed } from "./actions";

export const instant = false;
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

const fmt = (d: Date) => new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" }).format(d);

export default async function AdminPage() {
  const lang = await getLang();
  const t = dict(lang);
  const me = await getCurrentUser();
  if (!me) redirect("/connexion?next=/admin");
  if (!canModerate(me)) redirect("/");
  const isAdmin = me.role === "admin";

  const toReview = await db.select().from(moderationLog).where(eq(moderationLog.decision, "review")).orderBy(desc(moderationLog.createdAt)).limit(100);
  const reviewEventIds = toReview.filter((r) => r.kind === "event" && r.refId).map((r) => r.refId!);
  const reviewVenueIds = toReview.filter((r) => r.kind === "venue" && r.refId).map((r) => r.refId!);
  const [revEvents, revVenues] = await Promise.all([
    reviewEventIds.length ? db.select({ id: events.id, slug: events.slug, title: events.title, status: events.status }).from(events).where(inArray(events.id, reviewEventIds)) : [],
    reviewVenueIds.length ? db.select({ id: venues.id, slug: venues.slug, name: venues.name, status: venues.status }).from(venues).where(inArray(venues.id, reviewVenueIds)) : [],
  ]);

  const recent = await db
    .select({ id: events.id, slug: events.slug, title: events.title, startsAt: events.startsAt, status: events.status, imageUrl: events.imageUrl, venue: venues.name, by: users.displayName })
    .from(events)
    .innerJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(users, eq(users.id, events.createdBy))
    .where(ne(events.source, "demo"))
    .orderBy(desc(events.createdAt))
    .limit(60);

  const allVenues = await db.select().from(venues).where(ne(venues.status, "removed")).orderBy(venues.name);
  const allColls = await db.select().from(collectives).where(ne(collectives.status, "removed")).orderBy(collectives.name);
  const rejected = await db.select().from(moderationLog).where(and(eq(moderationLog.decision, "rejected"), eq(moderationLog.by, "filtre"))).orderBy(desc(moderationLog.createdAt)).limit(20);
  const messages = isAdmin ? await db.select().from(contactMessages).where(eq(contactMessages.handled, false)).orderBy(desc(contactMessages.createdAt)) : [];
  const people = isAdmin ? await db.select({ id: users.id, email: users.email, name: users.displayName, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(200) : [];

  return (
    <Window title="La Décadente / administration" menu={mainMenu(t)}>
      <div className="sunk prose" style={{ margin: 10, maxWidth: "none" }}>
        <h2 style={{ marginTop: 0 }}>À vérifier ({toReview.length})</h2>
        <p className="mu">Publiés, mais le filtre a repéré un mot sensible (souvent réapproprié). Vérifie le contexte.</p>
        {toReview.length === 0 ? <p>Rien à vérifier.</p> : (
          <ul>
            {toReview.map((r) => {
              const ev = revEvents.find((e) => e.id === r.refId);
              const ve = revVenues.find((v) => v.id === r.refId);
              return (
                <li key={r.id} style={{ marginBottom: 6 }}>
                  {ev && <><Link href={`/evenement/${ev.slug}`}>{ev.title}</Link> (événement, {ev.status})</>}
                  {ve && <><Link href={`/lieu/${ve.slug}`}>{ve.name}</Link> (lieu, {ve.status})</>}
                  {" "}<span className="mu">mots : {(r.reasons ?? []).join(", ")}</span>{" "}
                  <form action={markReviewed} style={{ display: "inline" }}><input type="hidden" name="id" value={r.id} /><button className="b" type="submit">OK, c'est bon</button></form>{" "}
                  {ev && ev.status === "published" && <form action={removeEvent} style={{ display: "inline" }}><input type="hidden" name="id" value={ev.id} /><button className="b" type="submit">Supprimer</button></form>}
                  {ve && ve.status === "published" && <form action={removeVenue} style={{ display: "inline" }}><input type="hidden" name="id" value={ve.id} /><button className="b" type="submit">Supprimer</button></form>}
                </li>
              );
            })}
          </ul>
        )}

        <h2>Derniers ajouts</h2>
        <p className="mu">Les photos ne sont pas filtrées automatiquement : jette un œil aux vignettes.</p>
        {recent.length === 0 ? <p>Aucun ajout pour l'instant (les événements de démo ne sont pas listés ici).</p> : (
          <ul>
            {recent.map((e) => (
              <li key={e.id} style={{ marginBottom: 6 }}>
                {e.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={`/media/${e.imageUrl}-t.webp`} alt="" width={72} height={72} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
                )}
                <Link href={`/evenement/${e.slug}`}>{e.title}</Link> <span className="mu">@ {e.venue}, {agendaDateOf(e.startsAt)} {fmtTime(e.startsAt)}, par {e.by ?? "import"}, {e.status}</span>{" "}
                {e.imageUrl && (
                  <form action={removeEventImage} style={{ display: "inline" }}><input type="hidden" name="id" value={e.id} /><button className="b" type="submit">Retirer la photo</button></form>
                )}{" "}
                {e.status === "published" ? (
                  <form action={removeEvent} style={{ display: "inline" }}><input type="hidden" name="id" value={e.id} /><button className="b" type="submit">Supprimer</button></form>
                ) : (
                  <form action={restoreEvent} style={{ display: "inline" }}><input type="hidden" name="id" value={e.id} /><button className="b" type="submit">Republier</button></form>
                )}
              </li>
            ))}
          </ul>
        )}

        <h2>Refusés par le filtre</h2>
        {rejected.length === 0 ? <p>Aucun.</p> : (
          <ul>{rejected.map((r) => <li key={r.id}>{fmt(r.createdAt)}, {r.kind}, mots : {(r.reasons ?? []).join(", ")}</li>)}</ul>
        )}

        <h2>Lieux ({allVenues.length})</h2>
        <p className="mu">« Non listé » : le lieu n'apparaît pas dans la liste des lieux (ex. club commercial), mais on peut y ajouter une soirée.</p>
        <ul>
          {allVenues.map((v) => (
            <li key={v.id} style={{ marginBottom: 4 }}>
              <Link href={`/lieu/${v.slug}`}>{v.name}</Link> <span className="mu">{v.address}, {v.city}{v.listed ? "" : ", non listé"}{v.lat ? "" : ", sans coordonnées"}</span>{" "}
              <form action={toggleVenueListed} style={{ display: "inline" }}><input type="hidden" name="id" value={v.id} /><button className="b" type="submit">{v.listed ? "Ne plus lister" : "Lister"}</button></form>{" "}
              <form action={removeVenue} style={{ display: "inline" }}><input type="hidden" name="id" value={v.id} /><button className="b" type="submit">Supprimer</button></form>
            </li>
          ))}
        </ul>

        <h2>Collectifs ({allColls.length})</h2>
        <ul>
          {allColls.map((c) => (
            <li key={c.id} style={{ marginBottom: 4 }}>
              <Link href={`/collectif/${c.slug}`}>{c.name}</Link>{" "}
              <form action={removeCollective} style={{ display: "inline" }}><input type="hidden" name="id" value={c.id} /><button className="b" type="submit">Supprimer</button></form>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <h2>Messages ({messages.length})</h2>
            {messages.length === 0 ? <p>Aucun message en attente.</p> : messages.map((m) => (
              <div key={m.id} className="win" style={{ padding: 10, marginBottom: 8 }}>
                <div><b>{m.name}</b> <a href={`mailto:${m.email}`}>{m.email}</a> <span className="mu">{fmt(m.createdAt)}</span></div>
                <p style={{ whiteSpace: "pre-line" }}>{m.message}</p>
                <form action={markMessageHandled}><input type="hidden" name="id" value={m.id} /><button className="b" type="submit">Traité</button></form>
              </div>
            ))}

            <h2>Personnes inscrites ({people.length})</h2>
            <ul>
              {people.map((p) => (
                <li key={p.id} style={{ marginBottom: 4 }}>
                  {p.name} <span className="mu">{p.email}, depuis le {fmt(p.createdAt)}</span>{" "}
                  <form action={setRole} style={{ display: "inline-flex", gap: 4 }}>
                    <input type="hidden" name="id" value={p.id} />
                    <label className="sr-only" htmlFor={`role-${p.id}`}>Rôle de {p.name}</label>
                    <select id={`role-${p.id}`} name="role" defaultValue={p.role} className="sunk" disabled={p.id === me.id}>
                      <option value="contributor">contributeur·ice</option>
                      <option value="moderator">modération</option>
                      <option value="admin">admin</option>
                    </select>
                    {p.id !== me.id && <button className="b" type="submit">OK</button>}
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Window>
  );
}
