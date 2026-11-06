import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { listCollectiveOptions, listVenueOptions } from "@/lib/queries";
import { ACCESS, CATEGORIES, GENRES } from "@/lib/taxonomy";
import { todayAgenda } from "@/lib/dates";
import { EventForm } from "../forms";

export const instant = false;
export const metadata: Metadata = { title: "Ajouter un événement", robots: { index: false } };

export default async function AddEventPage({ searchParams }: { searchParams: Promise<{ lieu?: string; collectif?: string; "nouveau-lieu"?: string }> }) {
  await connection();
  const sp = await searchParams;
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const user = await getCurrentUser();
  const [venues, colls] = user ? await Promise.all([listVenueOptions(true), listCollectiveOptions()]) : [[], []];
  return (
    <Window title={`La Décadente / ${t.ajouterEvent.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10 }}>
        {!user ? (
          <p className="empty">
            {fr ? "Pour ajouter un événement, il faut un compte (c'est rapide)." : "You need an account to add an event (it's quick)."}{" "}
            <Link href="/connexion?next=/ajouter/evenement">{t.connexion}</Link> / <Link href="/inscription?next=/ajouter/evenement">{fr ? "Créer un compte" : "Sign up"}</Link>
          </p>
        ) : (
          <>
            {sp["nouveau-lieu"] && <p className="notice" style={{ margin: "16px 20px 0" }} role="status">{fr ? "Lieu ajouté. Tu peux maintenant y ajouter ton événement." : "Venue added. You can now add your event."}</p>}
            <EventForm
              fr={fr}
              venues={venues}
              colls={colls}
              categories={CATEGORIES.map((c) => ({ key: c.key, label: c[lang] }))}
              genres={GENRES.map((g) => ({ key: g.key, label: g[lang] }))}
              access={ACCESS.map((a) => ({ key: a.key, label: a[lang] }))}
              preVenue={sp.lieu}
              preColl={sp.collectif}
              today={todayAgenda()}
            />
          </>
        )}
      </div>
    </Window>
  );
}
