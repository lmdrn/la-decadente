import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { listEvents, listVenuesWithCounts, NO_FILTERS } from "@/lib/queries";
import { fmtTime, todayAgenda } from "@/lib/dates";
import { MapView, type Pin } from "./MapView";

export const instant = false;
export const metadata: Metadata = {
  title: "Carte des lieux",
  description: "Carte des lieux culturels alternatifs de Lausanne et ce qui s'y passe ce soir.",
  alternates: { canonical: "/carte" },
};

export default async function MapPage({ searchParams }: { searchParams: Promise<{ lieu?: string }> }) {
  await connection();
  const { lieu } = await searchParams;
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const today = todayAgenda();
  const [vs, tonight] = await Promise.all([listVenuesWithCounts(today), listEvents(today, today, NO_FILTERS)]);
  const pins: Pin[] = vs
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      address: v.address,
      city: v.city,
      lat: v.lat!,
      lng: v.lng!,
      tonight: tonight.filter((e) => e.venueSlug === v.slug).map((e) => ({ slug: e.slug, title: e.title, time: fmtTime(e.startsAt) })),
    }));
  const missing = vs.filter((v) => v.lat == null);

  return (
    <Window title={`La Décadente / ${t.carte.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="toolbar">
        <span style={{ marginRight: "auto" }}>
          <span className="pin on" style={{ display: "inline-flex", position: "static", verticalAlign: "middle" }} aria-hidden="true">2</span>{" "}
          {fr ? "= événements ce soir" : "= events tonight"}
        </span>
        <Link className="b" href="/lieux">{t.lieux}</Link>
      </div>
      <div className="sunk" style={{ margin: 10 }}>
        <MapView
          pins={pins}
          focus={lieu}
          labels={{ tonight: fr ? "Ce soir" : "Tonight", nothing: fr ? "Rien ce soir." : "Nothing tonight.", program: fr ? "Tout le programme" : "Full programme" }}
        />
      </div>
      {missing.length > 0 && (
        <p className="mu" style={{ padding: "0 12px 10px", margin: 0 }}>
          {fr ? "Pas encore sur la carte (adresse à compléter) : " : "Not on the map yet: "}
          {missing.map((v, i) => (
            <span key={v.slug}>{i > 0 && ", "}<Link href={`/lieu/${v.slug}`}>{v.name}</Link></span>
          ))}
        </p>
      )}
    </Window>
  );
}
