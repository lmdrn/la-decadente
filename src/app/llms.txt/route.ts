import { connection } from "next/server";
import { listEvents, NO_FILTERS } from "@/lib/queries";
import { addDays, fmtTime, todayAgenda } from "@/lib/dates";
import { categoryLabel } from "@/lib/taxonomy";

// /llms.txt : présentation du site pour les assistants IA (format llmstxt.org),
// avec les événements des 7 prochains jours.
export async function GET() {
  await connection();
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const today = todayAgenda();
  const rows = await listEvents(today, addDays(today, 6), NO_FILTERS);
  const lines = rows.map(
    (e) => `- ${e.day} ${fmtTime(e.startsAt)}, ${categoryLabel(e.category, "fr")} : [${e.title}](${base}/evenement/${e.slug}), lieu : ${e.venueName}`,
  );
  const body = `# La Décadente

> Agenda collaboratif de la culture alternative à Lausanne et dans le canton de Vaud (jusqu'à Morges à l'ouest) : concerts de musiques actuelles, clubs et DJ, théâtre, danse, performance, expositions, cinéma indépendant, ateliers, marchés. Féministe, queer et antiraciste.

## Pages utiles

- [Agenda du jour](${base}/) : vues jour, semaine (?vue=semaine) et mois (?vue=mois), date avec ?date=AAAA-MM-JJ
- [Lieux et collectifs](${base}/lieux)
- [Carte des lieux](${base}/carte)
- [Charte](${base}/charte)
- [Plan du site](${base}/sitemap.xml)

## Filtres de l'agenda (paramètres d'URL)

- type : concert, club, theatre, danse, performance, expo, cine, atelier, marche
- genre : punk, noise, rock, metal, techno, house, electro, hiphop, jazz, chanson, folk, dub, world, contemporain
- gratuit=1, prixlibre=1, max20=1, acces=pmr|safe|flinta, lieu=<slug>, collectif=<slug>, q=<recherche>

## Les 7 prochains jours

${lines.join("\n") || "- Rien d'annoncé pour l'instant."}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}
