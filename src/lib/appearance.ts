import type { Appearance } from "@/db/schema";

export const PALETTES = ["citron", "violet", "rouge", "contraste"] as const;
export const FONTS = ["base", "affiche", "hacker", "tattoo", "gothique", "pixel"] as const;
export const MODES = ["auto", "day", "night"] as const;
export const TRAILS = ["on", "off"] as const;

export type Resolved = { palette: (typeof PALETTES)[number]; font: (typeof FONTS)[number]; mode: (typeof MODES)[number]; trail: (typeof TRAILS)[number] };

export const DEFAULT_APPEARANCE: Resolved = { palette: "citron", font: "base", mode: "auto", trail: "on" };

/** Cookie "apparence" au format "palette.police.mode.traînée". */
export function parseAppearance(raw: string | undefined | null, fallback?: Appearance | null): Resolved {
  const out: Resolved = { ...DEFAULT_APPEARANCE, ...(fallback ?? {}) } as Resolved;
  if (raw) {
    const [p, f, m, tr] = raw.split(".");
    if ((PALETTES as readonly string[]).includes(p)) out.palette = p as Resolved["palette"];
    if ((FONTS as readonly string[]).includes(f)) out.font = f as Resolved["font"];
    if ((MODES as readonly string[]).includes(m)) out.mode = m as Resolved["mode"];
    if ((TRAILS as readonly string[]).includes(tr)) out.trail = tr as Resolved["trail"];
  }
  return out;
}

export const serializeAppearance = (a: Resolved) => `${a.palette}.${a.font}.${a.mode}.${a.trail}`;
