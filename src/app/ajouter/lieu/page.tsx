import Link from "next/link";
import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { VenueForm } from "../forms";

export const instant = false;
export const metadata: Metadata = { title: "Ajouter un lieu", robots: { index: false } };

export default async function AddVenuePage() {
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const user = await getCurrentUser();
  return (
    <Window title={`La Décadente / ${t.ajouterLieu.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10 }}>
        {!user ? (
          <p className="empty">
            {fr ? "Pour ajouter un lieu, il faut un compte." : "You need an account to add a venue."}{" "}
            <Link href="/connexion?next=/ajouter/lieu">{t.connexion}</Link> / <Link href="/inscription?next=/ajouter/lieu">{fr ? "Créer un compte" : "Sign up"}</Link>
          </p>
        ) : (
          <VenueForm fr={fr} />
        )}
      </div>
    </Window>
  );
}
