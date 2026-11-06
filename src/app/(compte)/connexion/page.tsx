import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/request";
import { LoginForm } from "../forms";

export const instant = false;
export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const lang = await getLang();
  const t = dict(lang);
  if (await getCurrentUser()) redirect(safeNext(next, "/compte"));
  return (
    <Window title={`La Décadente / ${t.connexion.toLowerCase()}`} menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10 }}>
        <LoginForm next={safeNext(next, "/")} fr={lang === "fr"} />
      </div>
    </Window>
  );
}
