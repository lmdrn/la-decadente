import type { Metadata } from "next";
import { Window } from "@/components/Window";
import { getLang, dict } from "@/lib/i18n";
import { mainMenu } from "@/lib/menu";
import { ContactForm } from "./form";

export const instant = false;
export const metadata: Metadata = { title: "Contact", description: "Écrire à l'équipe de La Décadente.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const lang = await getLang();
  const t = dict(lang);
  const fr = lang === "fr";
  return (
    <Window title="La Décadente / contact" menu={mainMenu(t)}>
      <div className="sunk" style={{ margin: 10 }}>
        <p style={{ padding: "16px 20px 0", margin: 0, maxWidth: 680 }}>
          {fr
            ? "Une erreur dans un événement, un contenu qui ne respecte pas la charte, une idée ? Écris-nous."
            : "A mistake in an event, content that breaks the charter, an idea? Write to us."}
        </p>
        <ContactForm fr={fr} />
      </div>
    </Window>
  );
}
