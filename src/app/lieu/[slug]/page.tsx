import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { EventListByDay } from "@/components/EventRows";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { getVenueBySlug, upcoming } from "@/lib/queries";
import { todayAgenda } from "@/lib/dates";

export const instant = false;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVenueBySlug(slug);
  if (!v) return { title: "Introuvable" };
  return {
    title: `${v.name}, programme`,
    description: `Programme de ${v.name} (${v.city}) : concerts, soirées et événements à venir sur La Décadente.`,
    alternates: { canonical: `/lieu/${slug}` },
  };
}

export default async function VenuePage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const lang = await getLang();
  const t = dict(lang);
  const v = await getVenueBySlug(slug);
  if (!v) notFound();
  const user = await getCurrentUser();
  const rows = await upcoming({ venueId: v.id, from: todayAgenda(), userId: user?.id });
  const fr = lang === "fr";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: v.name,
    description: v.description ?? undefined,
    address: { "@type": "PostalAddress", streetAddress: v.address === "à compléter" ? undefined : v.address, postalCode: v.postcode ?? undefined, addressLocality: v.city, addressRegion: "VD", addressCountry: "CH" },
    geo: v.lat && v.lng ? { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } : undefined,
    url: `${appUrl}/lieu/${v.slug}`,
    sameAs: v.website ?? undefined,
  };

  return (
    <Window title={`${v.name} / ${fr ? "lieu" : "venue"}`} menu={mainMenu(t)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="toolbar" style={{ alignItems: "flex-start" }}>
        <div style={{ marginRight: "auto", minWidth: 0 }}>
          <h2 className="fd caps" style={{ fontSize: 44, lineHeight: 0.95, margin: 0 }}>
            {v.name}
          </h2>
          <div>
            {v.address === "à compléter" ? (fr ? "Adresse à compléter" : "Address missing") : v.address}, {v.postcode} {v.city}
          </div>
          {v.description && <p style={{ maxWidth: 680, margin: "6px 0 0" }}>{v.description}</p>}
        </div>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {v.website && (
            <a className="b" href={v.website} target="_blank" rel="noopener noreferrer">
              {fr ? "Site du lieu" : "Website"}
            </a>
          )}
          {v.lat && v.lng && (
            <Link className="b" href={`/carte?lieu=${v.slug}`}>
              {t.carte}
            </Link>
          )}
          <Link className="b strong" href={`/ajouter/evenement?lieu=${v.slug}`}>
            {t.ajouter}
          </Link>
        </span>
      </div>
      <div className="body">
        <main className="sunk content" style={{ flexBasis: "100%" }}>
          <EventListByDay rows={rows} lang={lang} t={t} empty={fr ? "Rien d'annoncé ici pour l'instant." : "Nothing announced here yet."} />
        </main>
      </div>
    </Window>
  );
}
