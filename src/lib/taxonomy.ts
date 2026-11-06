import type { Category } from "@/db/schema";

export type Lang = "fr" | "en";

export const CATEGORIES: { key: Category; fr: string; en: string }[] = [
  { key: "concert", fr: "Concert", en: "Concert" },
  { key: "club", fr: "Club / DJ", en: "Club / DJ" },
  { key: "theatre", fr: "Théâtre", en: "Theatre" },
  { key: "danse", fr: "Danse", en: "Dance" },
  { key: "performance", fr: "Performance", en: "Performance" },
  { key: "expo", fr: "Expo", en: "Exhibition" },
  { key: "cine", fr: "Ciné", en: "Cinema" },
  { key: "atelier", fr: "Ateliers / Discussions", en: "Workshops / Talks" },
  { key: "marche", fr: "Marchés / Festivals", en: "Markets / Festivals" },
];

export const GENRES: { key: string; fr: string; en: string }[] = [
  { key: "punk", fr: "Punk / hardcore", en: "Punk / hardcore" },
  { key: "noise", fr: "Noise / expé", en: "Noise / experimental" },
  { key: "rock", fr: "Rock / post-punk", en: "Rock / post-punk" },
  { key: "metal", fr: "Metal", en: "Metal" },
  { key: "techno", fr: "Techno", en: "Techno" },
  { key: "house", fr: "House / disco", en: "House / disco" },
  { key: "electro", fr: "Électro", en: "Electronic" },
  { key: "hiphop", fr: "Hip-hop / rap", en: "Hip-hop / rap" },
  { key: "jazz", fr: "Jazz / impro", en: "Jazz / impro" },
  { key: "chanson", fr: "Chanson", en: "Chanson" },
  { key: "folk", fr: "Folk / acoustique", en: "Folk / acoustic" },
  { key: "dub", fr: "Reggae / dub", en: "Reggae / dub" },
  { key: "world", fr: "Musiques du monde", en: "World music" },
  { key: "contemporain", fr: "Classique / contemporain", en: "Classical / contemporary" },
];

export const ACCESS: { key: string; fr: string; en: string; short: string }[] = [
  { key: "pmr", fr: "Accessible PMR", en: "Wheelchair access", short: "PMR" },
  { key: "safe", fr: "Safe space / awareness", en: "Safe space / awareness", short: "SAFE" },
  { key: "flinta", fr: "Non-mixte FLINTA*", en: "FLINTA* only", short: "FLINTA*" },
];

export const categoryLabel = (k: string, lang: Lang) =>
  CATEGORIES.find((c) => c.key === k)?.[lang] ?? k;
export const genreLabel = (k: string, lang: Lang) => GENRES.find((g) => g.key === k)?.[lang] ?? k;
export const accessShort = (k: string) => ACCESS.find((a) => a.key === k)?.short ?? k;

export const isCategory = (v: string): v is Category => CATEGORIES.some((c) => c.key === v);
