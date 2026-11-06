import type { Dict } from "./i18n";
import type { MenuItem } from "@/components/Window";

export const mainMenu = (t: Dict): MenuItem[] => [
  { href: "/", label: t.agenda },
  { href: "/lieux", label: t.lieux },
  { href: "/carte", label: t.carte },
  { href: "/favoris", label: t.favoris },
  { href: "/ajouter/evenement", label: t.ajouter },
];
