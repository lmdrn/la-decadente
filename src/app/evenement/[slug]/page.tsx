import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { FavButton } from "@/components/ClientBits";
import { priceText } from "@/components/EventRows";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries";
import { accessShort, ACCESS, categoryLabel, genreLabel } from "@/lib/taxonomy";
import { agendaDateOf, fmtDay, fmtTime } from "@/lib/dates";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { imageSize } from "@/lib/images";

export const instant = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEventBySlug(slug);
  if (!data) return { title: "Introuvable" };
  const { event, venue } = data;
  const day = fmtDay(agendaDateOf(event.startsAt), "fr", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const description = `${categoryLabel(event.category, "fr")} le ${day} à ${fmtTime(event.startsAt)}, ${venue.name}, ${venue.city}.${event.lineup ? " " + event.lineup + "." : ""}`;
  return {
    title: `${event.title}, ${venue.name}`,
    description,
    alternates: { canonical: `/evenement/${slug}` },
    openGraph: { title: event.title, description, type: "article", images: event.imageUrl ? [`/media/${event.imageUrl}.webp`] : undefined },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const lang = await getLang();
  const t = dict(lang);
  const data = await getEventBySlug(slug);
  if (!data) notFound();
  const { event: e, venue: v, collectives } = data;
  const user = await getCurrentUser();
  const fav = user
    ? (await db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.eventId, e.id))).limit(1)).length > 0
    : false;
  const day = agendaDateOf(e.startsAt);
  const fr = lang === "fr";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  // Données structurées pour Google (résultats "événements") et les IA.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description ?? e.lineup ?? undefined,
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: v.name,
      address: { "@type": "PostalAddress", streetAddress: v.address, postalCode: v.postcode ?? undefined, addressLocality: v.city, addressRegion: "VD", addressCountry: "CH" },
      geo: v.lat && v.lng ? { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } : undefined,
    },
    organizer: collectives.length ? collectives.map((c) => ({ "@type": "Organization", name: c.name, url: `${appUrl}/collectif/${c.slug}` })) : undefined,
    offers: {
      "@type": "Offer",
      url: e.ticketUrl ?? `${appUrl}/evenement/${e.slug}`,
      priceCurrency: "CHF",
      price: e.isFree ? 0 : e.priceMax ?? undefined,
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: e.isFree || undefined,
    image: e.imageUrl ? `${appUrl}/media/${e.imageUrl}.webp` : undefined,
    url: `${appUrl}/evenement/${e.slug}`,
  };

  return (
    <Window title={`${e.title} / ${v.name}`} menu={mainMenu(t)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="toolbar">
        <Link className="b" href={`/?date=${day}`}>
          ◄ {fmtDay(day, lang, { weekday: "short" }).replace(".", "")} {fmtDay(day, lang, { day: "2-digit", month: "2-digit" }).replace(/[./]$/, "").replace("/", ".")}
        </Link>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <a className="b" href={`/evenement/${e.slug}/ics`} download>
            {fr ? "Ajouter à mon calendrier" : "Add to my calendar"}
          </a>
          <FavButton id={e.id} initial={fav} labels={[t.favoriAjouter, t.favoriRetirer]} />
        </span>
      </div>
      <article className="sunk" style={{ margin: 10, padding: "18px 20px 26px", display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div style={{ flex: "999 1 420px", minWidth: 0 }}>
          {e.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-img" src={`/media/${e.imageUrl}.webp`} alt={`${e.title}, ${v.name}`} {...imageSize(e.imageUrl)} style={{ marginBottom: 14 }} />
          )}
          <div className="mu">
            <span className={`sq k-${e.category}`} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden="true" />
            {categoryLabel(e.category, lang)}
            {e.genres.length > 0 && ` / ${e.genres.map((g) => genreLabel(g, lang)).join(", ")}`}
          </div>
          <h2 className="fd caps" style={{ fontSize: 48, lineHeight: 0.95, margin: "6px 0 8px" }}>
            {e.title}
          </h2>
          {e.lineup && <p style={{ fontSize: 17, margin: "0 0 12px" }}>{e.lineup}</p>}
          {e.description && <p style={{ whiteSpace: "pre-line", maxWidth: 680, lineHeight: 1.65 }}>{e.description}</p>}
          {collectives.length > 0 && (
            <p>
              {fr ? "Organisé par" : "Organised by"}{" "}
              {collectives.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 && ", "}
                  <Link href={`/collectif/${c.slug}`}>{c.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <aside style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="win" style={{ padding: 12 }}>
            <div className="fn" style={{ fontSize: 40, lineHeight: 1 }}>
              {fmtTime(e.startsAt)}
            </div>
            <div className="fd caps">{fmtDay(day, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            {e.endsAt && (
              <div className="mu">
                {fr ? "jusqu'à" : "until"} {fmtTime(e.endsAt)}
              </div>
            )}
          </div>
          <div className="win" style={{ padding: 12 }}>
            <div className="fd caps" style={{ fontSize: 20 }}>
              <Link href={`/lieu/${v.slug}`}>{v.name}</Link>
            </div>
            <div>
              {v.address !== "à compléter" ? v.address : ""}
              {v.address !== "à compléter" && <br />}
              {v.postcode} {v.city}
            </div>
            {v.lat && v.lng && (
              <a href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=18/${v.lat}/${v.lng}`} target="_blank" rel="noopener noreferrer">
                {fr ? "Voir sur la carte" : "View on map"}
              </a>
            )}
          </div>
          <div className="win" style={{ padding: 12 }}>
            <div className="fn" style={{ fontSize: 30 }}>{priceText(e, t)}</div>
            {e.ticketUrl && (
              <a className="b strong" href={e.ticketUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ marginTop: 6 }}>
                {t.billets}
              </a>
            )}
          </div>
          {e.accessibility.length > 0 && (
            <div className="win" style={{ padding: 12 }}>
              {e.accessibility.map((a) => (
                <div key={a}>
                  <span className="acc">{accessShort(a)}</span> {ACCESS.find((x) => x.key === a)?.[lang]}
                </div>
              ))}
            </div>
          )}
        </aside>
      </article>
    </Window>
  );
}
