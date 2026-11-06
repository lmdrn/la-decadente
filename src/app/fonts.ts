import {
  Big_Shoulders,
  JetBrains_Mono,
  Chakra_Petch,
  IBM_Plex_Sans_Condensed,
  Pirata_One,
  IBM_Plex_Mono,
  Grenze_Gotisch,
  Archivo,
  Pixelify_Sans,
  VT323,
  Space_Mono,
} from "next/font/google";

// next/font exige des options écrites en toutes lettres pour chaque police.

// Polices par défaut : préchargées.
export const bigShoulders = Big_Shoulders({ subsets: ["latin"], weight: ["700", "900"], variable: "--f-bigshoulders", display: "swap", adjustFontFallback: false });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-jetbrains", display: "swap" });

// Polices au choix dans "Apparence" : téléchargées seulement si utilisées.
export const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["500", "700"], variable: "--f-chakra", display: "swap", preload: false });
export const plexCond = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-plexcond", display: "swap", preload: false });
export const pirata = Pirata_One({ subsets: ["latin"], weight: "400", variable: "--f-pirata", display: "swap", preload: false });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-plexmono", display: "swap", preload: false });
export const grenze = Grenze_Gotisch({ subsets: ["latin"], weight: ["500", "700"], variable: "--f-grenze", display: "swap", preload: false });
export const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-archivo", display: "swap", preload: false });
export const pixelify = Pixelify_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-pixelify", display: "swap", preload: false });
export const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--f-vt323", display: "swap", preload: false });
export const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-spacemono", display: "swap", preload: false });

export const fontVars = [bigShoulders, jetbrains, chakra, plexCond, pirata, plexMono, grenze, archivo, pixelify, vt323, spaceMono]
  .map((f) => f.variable)
  .join(" ");
