import Link from "next/link";
import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";

export const instant = false;
export const metadata: Metadata = {
  title: "Charte",
  description: "Ce qu'on publie sur La Décadente, et ce qu'on ne publie pas.",
  alternates: { canonical: "/charte" },
};

export default async function ChartePage() {
  const lang = await getLang();
  const t = dict(lang);
  return (
    <Window title="La Décadente / charte.txt" menu={mainMenu(t)}>
      <div className="sunk prose" style={{ margin: 10 }}>
        <h2 style={{ marginTop: 0 }}>Charte</h2>
        <p>
          La Décadente est un agenda collaboratif de la culture alternative à Lausanne et environs. Tout le monde peut y ajouter un événement ou un lieu.
          Pour que l'agenda reste un endroit où chacun·e se sent bienvenu·e, voici ce qu'on y publie, et ce qu'on n'y publie pas.
        </p>

        <h2>Nos valeurs</h2>
        <p>
          La Décadente est féministe, queer et antiraciste. Les contenus racistes, antisémites, islamophobes, sexistes, homophobes, transphobes, validistes,
          nationalistes ou qui appellent à la haine sont refusés automatiquement quand c'est possible, et supprimés sinon. Les comptes qui en publient sont fermés.
        </p>

        <h2>Ce qu'on publie</h2>
        <ul>
          <li>Concerts de musiques actuelles, jazz, musiques expérimentales.</li>
          <li>Soirées club et DJ, quand la musique et la culture sont au centre.</li>
          <li>Théâtre, danse, performance, cirque.</li>
          <li>Expositions, vernissages, lectures.</li>
          <li>Cinéma indépendant et projections alternatives.</li>
          <li>Ateliers, discussions, conférences gratuites ou à prix modéré.</li>
          <li>Marchés alternatifs, fanzines, festivals.</li>
        </ul>
        <p>
          Un événement doit avoir lieu en vrai : un lieu, une date, une heure, des gens qui se retrouvent. Pas d'événements uniquement en ligne.
        </p>

        <h2>Ce qu'on ne publie pas</h2>
        <ul>
          <li>Les événements commerciaux : présentations de produits ou d'entreprises, publicité, dégustations, happy hours.</li>
          <li>Les événements religieux, ésotériques, de développement personnel ou de médecine parallèle.</li>
          <li>Les salons et conférences professionnels, les cours et stages chers.</li>
          <li>Les compétitions sportives.</li>
          <li>Les lieux qui trient leur public à l'entrée sur des critères de tenue ou d'apparence.</li>
        </ul>

        <h2>Prix et accès</h2>
        <p>
          On privilégie les événements abordables, gratuits ou à prix libre. Les clubs et lieux plus commerciaux ne sont pas listés, mais une soirée alternative
          qui s'y déroule (par exemple organisée par un collectif) peut être ajoutée au cas par cas. Indique l'accessibilité PMR, la présence d'une équipe awareness
          et les soirées non mixtes quand c'est le cas.
        </p>

        <h2>Zone couverte</h2>
        <p>
          Lausanne avant tout, et le canton de Vaud : Renens, Pully, Lutry, Vevey, Montreux, Yverdon et ailleurs. À l'ouest de Morges, c'est le territoire de{" "}
          <a href="https://www.ladecadanse.ch" target="_blank" rel="noopener noreferrer">La Décadanse</a>, on ne marche pas sur ses plates-bandes.
        </p>

        <h2>Modération</h2>
        <p>
          Les ajouts sont publiés tout de suite. Un filtre refuse automatiquement les propos haineux, et signale à l'équipe ceux qui demandent un regard humain.
          L'équipe peut corriger ou supprimer tout contenu qui ne respecte pas cette charte, sans préavis. Tu vois quelque chose qui n'a rien à faire ici ?{" "}
          <Link href="/contact">Écris-nous</Link>.
        </p>
      </div>
    </Window>
  );
}
