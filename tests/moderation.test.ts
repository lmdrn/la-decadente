import { describe, expect, it } from "vitest";
import { moderate } from "../src/lib/moderation";

describe("filtre de modération", () => {
  it("accepte un texte normal", () => {
    expect(moderate("Concert noise rock au Romandie, en retard de 10 minutes").decision).toBe("accepted");
  });
  it("ne bloque pas les mots courants ambigus", () => {
    expect(moderate("Atelier raton laveur et chant mongol").decision).toBe("review");
    expect(moderate("Vous tremblez ?").decision).toBe("accepted");
    expect(moderate("Soirée queer et trans au Romandie").decision).toBe("accepted");
  });
  it("refuse une insulte raciste, même déguisée", () => {
    expect(moderate("N3GR3").decision).toBe("rejected");
    expect(moderate("n.e.g.r.e").decision).toBe("rejected");
    expect(moderate("Nèèèègre").decision).toBe("rejected");
  });
  it("refuse les slogans d'extrême droite", () => {
    expect(moderate("Grand Remplacement : conférence").decision).toBe("rejected");
    expect(moderate("SIEG HEIL").decision).toBe("rejected");
  });
  it("signale les mots réappropriés sans refuser", () => {
    const r = moderate("Bal des gouines");
    expect(r.decision).toBe("review");
    expect(r.flags).toContain("gouines");
  });
});
