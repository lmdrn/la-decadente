// Listes du filtre de modération. Toujours en minuscules, sans accents.
// Ajoute des mots ici quand quelque chose passe à travers.
// Attention aux mots qui ont aussi un sens courant (ex. "retard", "raton") :
// ceux-là vont dans SENSITIVE, jamais dans BLOCKED.
//
// Contenu choquant par nature : ces listes existent uniquement pour bloquer la haine.

/** Refus automatique : mot entier. */
export const BLOCKED: string[] = [
  // racisme
  "negre", "negres", "negresse", "nigger", "niggers", "nigga", "niggas", "bougnoule", "bougnoules", "bicot", "bicots",
  "youpin", "youpins", "youpine", "youtre", "youtres", "chintok", "chintoks", "chinetoque", "chinetoques",
  // antisémitisme
  "kike", "kikes",
  // homophobie et transphobie
  "faggot", "faggots", "tranny", "trannies", "travelo", "travelos",
  // misogynie
  "feminazi", "feminazis",
  // validisme
  "retarded",
];

/** Refus automatique : expressions (texte normalisé). */
export const BLOCKED_PHRASES: string[] = [
  "sieg heil", "heil hitler", "white power", "grand remplacement", "remigration", "mort aux juifs", "mort aux arabes",
  "mort aux noirs", "mort aux pedes", "sale noir", "sale noire", "sale arabe", "sale juif", "sale juive",
  "white lives matter", "it s ok to be white",
];

/** Mots souvent réappropriés ou ambigus : publication, mais signalement à l'admin. */
export const SENSITIVE: string[] = [
  "pede", "pedes", "gouine", "gouines", "tapette", "tapettes", "fiotte", "fiottes", "tarlouze", "tarlouzes",
  "salope", "salopes", "pute", "putes", "bitch", "bitches", "dyke", "dykes", "negro", "bamboula", "macaque",
  "raton", "ratons", "mongol", "mongole", "nazi", "nazis", "hitler", "race", "races",
];
