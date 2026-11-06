import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { fontVars } from "./fonts";
import { getLang, dict } from "@/lib/i18n";
import { getCurrentUser, canModerate } from "@/lib/auth";
import { parseAppearance } from "@/lib/appearance";
import { Ticker } from "@/components/Ticker";
import { Taskbar } from "@/components/Taskbar";
import { BlackHole } from "@/components/BlackHole";
import { Devil } from "@/components/Devil";
import { CursorTrail } from "@/components/CursorTrail";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Chaque page dépend de la langue, de l'apparence et du compte (cookies) :
// le rendu attend la requête, c'est voulu.
export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "La Décadente, agenda culturel alternatif de Lausanne", template: "%s | La Décadente" },
  description:
    "Concerts, clubs, théâtre, danse, expos, ciné et culture alternative à Lausanne. Agenda collaboratif, féministe et queer.",
  applicationName: "La Décadente",
  openGraph: { type: "website", locale: "fr_CH", siteName: "La Décadente" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C0C0C0" },
    { media: "(prefers-color-scheme: dark)", color: "#07060B" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = dict(lang);
  const user = await getCurrentUser().catch(() => null);
  const app = parseAppearance((await cookies()).get("apparence")?.value, user?.appearance);
  const fr = lang === "fr";

  return (
    <html lang={lang} data-palette={app.palette} data-font={app.font} data-mode={app.mode} data-trail={app.trail} className={fontVars}>
      <body>
        <a className="skip" href="#contenu">
          {fr ? "Aller au contenu" : "Skip to content"}
        </a>
        <CursorTrail />
        <Suspense fallback={<div className="ticker" aria-hidden="true"><span>&nbsp;</span></div>}>
          <Ticker lang={lang} />
        </Suspense>
        <div className="desk">
          {children}
          <footer className="foot">
            <nav className="win" aria-label={fr ? "Pied de page" : "Footer"}>
              <Link href="/charte">{t.charte}</Link>
              <Link href="/a-propos">{t.aPropos}</Link>
              <Link href="/contact">{t.contact}</Link>
              <Link href="/merci" style={{ opacity: 0.7 }}>
                ~/merci.txt
              </Link>
            </nav>
            <span className="win lust">
              {t.madeWith} <Devil px={1} /> {t.by}
            </span>
          </footer>
        </div>
        <Taskbar
          t={t}
          lang={lang}
          appearance={app}
          user={user ? { name: user.displayName, canModerate: canModerate(user) } : null}
        />
        <BlackHole
          title={fr ? "On n'échappe pas à La Décadente" : "There is no escaping La Décadente"}
          button={fr ? "Fermer le trou noir et retourner se cultiver" : "Close the black hole and go back to culture"}
        />
      </body>
    </html>
  );
}
