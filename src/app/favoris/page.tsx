import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { EventListByDay } from "@/components/EventRows";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { upcoming } from "@/lib/queries";
import { todayAgenda } from "@/lib/dates";

export const instant = false;
export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default async function FavoritesPage() {
  await connection();
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const user = await getCurrentUser();
  return (
    <Window title={`La Décadente / ${t.favoris.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="body">
        <main className="sunk content" style={{ flexBasis: "100%" }}>
          {!user ? (
            <p className="empty">
              {fr ? "Connecte-toi pour garder tes soirées en favoris." : "Log in to save events to your favourites."}{" "}
              <Link href="/connexion?next=/favoris">{t.connexion}</Link>
            </p>
          ) : (
            <EventListByDay
              rows={await upcoming({ favoritesOf: user.id, from: todayAgenda() })}
              lang={lang}
              t={t}
              empty={fr ? "Aucun favori à venir. Clique sur le cœur d'un événement pour le garder ici." : "No upcoming favourites. Click the heart on an event to keep it here."}
            />
          )}
        </main>
      </div>
    </Window>
  );
}
