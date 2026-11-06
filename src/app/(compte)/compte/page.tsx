import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions";
import { db } from "@/db";
import { events } from "@/db/schema";
import { fmtTime, agendaDateOf } from "@/lib/dates";
import { PasswordForm } from "../forms";

export const instant = false;
export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

const STATUS: Record<string, string> = { published: "publié", pending: "à vérifier", rejected: "refusé", removed: "supprimé" };

export default async function AccountPage() {
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");
  const mine = await db
    .select({ slug: events.slug, title: events.title, startsAt: events.startsAt, status: events.status })
    .from(events)
    .where(eq(events.createdBy, user.id))
    .orderBy(desc(events.createdAt))
    .limit(50);

  return (
    <Window title={`La Décadente / ${t.monCompte.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="sunk prose" style={{ margin: 10, maxWidth: "none" }}>
        <h2 style={{ marginTop: 0 }}>{user.displayName}</h2>
        <p>
          {user.email}, {fr ? "rôle" : "role"} : {user.role === "admin" ? "admin" : user.role === "moderator" ? (fr ? "modération" : "moderator") : fr ? "contributeur·ice" : "contributor"}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="b strong" href="/ajouter/evenement">{t.ajouterEvent}</Link>
          <Link className="b" href="/ajouter/lieu">{t.ajouterLieu}</Link>
          <Link className="b" href="/favoris">{t.favoris}</Link>
          {(user.role === "admin" || user.role === "moderator") && <Link className="b" href="/admin">{t.admin}</Link>}
          <form action={logout}>
            <button className="b" type="submit">{t.deconnexion}</button>
          </form>
        </div>
        <h2>{fr ? "Mes ajouts" : "My submissions"}</h2>
        {mine.length === 0 ? (
          <p>{fr ? "Rien pour l'instant." : "Nothing yet."}</p>
        ) : (
          <ul>
            {mine.map((e) => (
              <li key={e.slug}>
                {e.status === "published" ? <Link href={`/evenement/${e.slug}`}>{e.title}</Link> : e.title}{" "}
                <span className="mu">
                  ({agendaDateOf(e.startsAt)} {fmtTime(e.startsAt)}, {STATUS[e.status]})
                </span>
              </li>
            ))}
          </ul>
        )}
        <h2>{fr ? "Mot de passe" : "Password"}</h2>
        <PasswordForm fr={fr} />
      </div>
    </Window>
  );
}
