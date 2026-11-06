import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { listCollectivesWithCounts, listVenuesWithCounts } from "@/lib/queries";
import { todayAgenda } from "@/lib/dates";

export const instant = false;
export const metadata: Metadata = {
  title: "Lieux et collectifs",
  description: "Salles de concert, clubs, théâtres, cinémas et lieux alternatifs de Lausanne et environs, et les collectifs qui y organisent des soirées.",
  alternates: { canonical: "/lieux" },
};

export default async function VenuesPage() {
  await connection();
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const today = todayAgenda();
  const [vs, cs] = await Promise.all([listVenuesWithCounts(today), listCollectivesWithCounts(today)]);
  const byCity = new Map<string, typeof vs>();
  for (const v of vs) byCity.set(v.city, [...(byCity.get(v.city) ?? []), v]);
  const byScene = new Map<string, typeof cs>();
  for (const c of cs) byScene.set(c.scene ?? "autres", [...(byScene.get(c.scene ?? "autres") ?? []), c]);

  return (
    <Window title={fr ? "La Décadente / lieux et collectifs" : "La Décadente / venues and collectives"} menu={mainMenu(t)}>
      <div className="toolbar">
        <h2 className="fd caps" style={{ fontSize: 36, margin: 0, marginRight: "auto" }}>
          {fr ? "Lieux et collectifs" : "Venues and collectives"}
        </h2>
        <Link className="b" href="/carte">{t.carte}</Link>
        <Link className="b strong" href="/ajouter/lieu">{t.ajouterLieu}</Link>
      </div>
      <div className="body">
        <section className="sunk content" aria-labelledby="h-lieux" style={{ padding: "0 0 12px" }}>
          <h3 id="h-lieux" className="dayhead caps" style={{ margin: 0 }}>{t.lieux} ({vs.length})</h3>
          {[...byCity].map(([city, list]) => (
            <div key={city} style={{ padding: "8px 12px" }}>
              <h4 className="fd" style={{ margin: "6px 0" }}>{city}</h4>
              <ul style={{ margin: 0, paddingLeft: 18, columns: "260px", columnGap: 24 }}>
                {list.map((v) => (
                  <li key={v.slug} style={{ breakInside: "avoid", marginBottom: 4 }}>
                    <Link href={`/lieu/${v.slug}`}>{v.name}</Link> <span className="mu">({v.n})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section className="sunk content" aria-labelledby="h-coll" style={{ padding: "0 0 12px" }}>
          <h3 id="h-coll" className="dayhead caps" style={{ margin: 0 }}>{fr ? "Collectifs" : "Collectives"} ({cs.length})</h3>
          {[...byScene].map(([scene, list]) => (
            <div key={scene} style={{ padding: "8px 12px" }}>
              <h4 className="fd" style={{ margin: "6px 0" }}>{scene}</h4>
              {list.map((c) => (
                <p key={c.slug} style={{ margin: "0 0 8px" }}>
                  <Link className="fd" href={`/collectif/${c.slug}`}>{c.name}</Link> <span className="mu">({c.n})</span>
                  {c.description && <><br /><span className="mu">{c.description}</span></>}
                </p>
              ))}
            </div>
          ))}
        </section>
      </div>
    </Window>
  );
}
