import Link from "next/link";
import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { Devil } from "@/components/Devil";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";

export const instant = false;
export const metadata: Metadata = {
  title: "À propos",
  description: "La Décadente, agenda collaboratif de la culture alternative à Lausanne.",
  alternates: { canonical: "/a-propos" },
};

export default async function AboutPage() {
  const lang = await getLang();
  const t = dict(lang);
  return (
    <Window title="La Décadente / lisez-moi.txt" menu={mainMenu(t)}>
      <div className="sunk prose" style={{ margin: 10 }}>
        <Devil px={5} />
        <h2>La Décadente</h2>
        <p>
          Un agenda pour trouver vite quoi faire ce soir à Lausanne : concerts, clubs, théâtre, danse, expos, ciné alternatif, ateliers, marchés. Une seule page,
          triée par jour, avec des filtres par lieu, par genre et par type de sortie.
        </p>
        <p>
          C'est un agenda collaboratif : les lieux, les collectifs et le public ajoutent eux-mêmes les événements. Pas de pub, pas de newsletter, pas de billetterie :
          on renvoie vers les sites des organisateur·ices.
        </p>
        <p>
          Tu organises des soirées ? <Link href="/inscription">Crée un compte</Link> et <Link href="/ajouter/evenement">ajoute ton événement</Link>. Il faut juste
          respecter <Link href="/charte">la charte</Link>.
        </p>
        <p>
          Astuce : en bas à gauche, le bouton Démarrer ouvre le menu. Et dans Apparence, tu peux changer les couleurs et la police du site.
        </p>
        <p className="lust" style={{ marginTop: 24 }}>
          {t.madeWith} <Devil px={1} /> {t.by}
        </p>
      </div>
    </Window>
  );
}
