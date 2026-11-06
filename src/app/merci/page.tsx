import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";

export const instant = false;
// Page cachée : accessible depuis le pied de page, non indexée.
export const metadata: Metadata = { title: "merci.txt", robots: { index: false, follow: false } };

export default async function MerciPage() {
  const lang = await getLang();
  const t = dict(lang);
  return (
    <Window title="~/merci.txt" menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10, padding: "20px 22px 28px" }}>
        <pre style={{ fontFamily: "var(--fb)", whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 720 }}>
{`Avant La Décadente, il y a eu La Décadanse.

Pendant des années, c'est là que je trouvais mes soirées à Genève :
des concerts dans des caves trop petites, des clubs où on dansait
jusqu'au matin, des expos dont personne ne parlait ailleurs, des films
en VO devant trois personnes. Des nuits incroyables, des rencontres,
des découvertes que je n'aurais jamais faites sans cet agenda.

La Décadente est un hommage. Une petite sœur lausannoise, qui s'arrête
à Morges pour laisser toute la place à la grande.

Merci à l'équipe de La Décadanse, aux bénévoles qui ajoutent les
événements soir après soir, et à toutes les personnes qui font vivre
la culture alternative.

Dark Lélé`}
        </pre>
        <p style={{ marginTop: 20 }}>
          <a href="https://www.ladecadanse.ch" target="_blank" rel="noopener noreferrer">ladecadanse.ch</a>
        </p>
      </div>
    </Window>
  );
}
