import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/request";
import { RegisterForm } from "../forms";

export const instant = false;
export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  if (await getCurrentUser()) redirect("/compte");
  return (
    <Window title={`La Décadente / ${fr ? "inscription" : "sign up"}`} menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10 }}>
        <p style={{ padding: "16px 20px 0", margin: 0, maxWidth: 680 }}>
          {fr
            ? "Un compte sert à ajouter des événements et des lieux, et à garder tes soirées en favoris. Pas de newsletter, pas de pub."
            : "An account lets you add events and venues, and keep favourites. No newsletter, no ads."}
        </p>
        <RegisterForm next={safeNext(next, "/compte")} fr={fr} />
      </div>
    </Window>
  );
}
