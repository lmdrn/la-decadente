import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Window } from "@/components/Window";
import { EventListByDay } from "@/components/EventRows";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { getCollectiveBySlug, upcoming } from "@/lib/queries";
import { todayAgenda } from "@/lib/dates";

export const instant = false;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectiveBySlug(slug);
  if (!c) return { title: "Introuvable" };
  return {
    title: `${c.name}, collectif`,
    description: `${c.name} : ${c.description ?? "collectif"} Prochaines soirées sur La Décadente.`,
    alternates: { canonical: `/collectif/${slug}` },
  };
}

export default async function CollectivePage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const lang = await getLang();
  const t = dict(lang);
  const c = await getCollectiveBySlug(slug);
  if (!c) notFound();
  const user = await getCurrentUser();
  const rows = await upcoming({ collectiveId: c.id, from: todayAgenda(), userId: user?.id });
  const fr = lang === "fr";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.name,
    description: c.description ?? undefined,
    url: `${appUrl}/collectif/${c.slug}`,
    sameAs: [c.website, c.instagram].filter(Boolean),
  };

  return (
    <Window title={`${c.name} / ${fr ? "collectif" : "collective"}`} menu={mainMenu(t)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="toolbar" style={{ alignItems: "flex-start" }}>
        <div style={{ marginRight: "auto", minWidth: 0 }}>
          {c.scene && <div className="mu">{c.scene}</div>}
          <h2 className="fd caps" style={{ fontSize: 44, lineHeight: 0.95, margin: 0 }}>
            {c.name}
          </h2>
          {c.description && <p style={{ maxWidth: 680, margin: "6px 0 0" }}>{c.description}</p>}
        </div>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.website && (
            <a className="b" href={c.website} target="_blank" rel="noopener noreferrer">
              {fr ? "Site" : "Website"}
            </a>
          )}
          {c.instagram && (
            <a className="b" href={`https://www.instagram.com/${c.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          <Link className="b strong" href={`/ajouter/evenement?collectif=${c.slug}`}>
            {t.ajouter}
          </Link>
        </span>
      </div>
      <div className="body">
        <main className="sunk content" style={{ flexBasis: "100%" }}>
          <EventListByDay rows={rows} lang={lang} t={t} empty={fr ? "Pas de soirée annoncée pour l'instant." : "No upcoming nights yet."} />
        </main>
      </div>
    </Window>
  );
}
