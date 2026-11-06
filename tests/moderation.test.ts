import { describe, expect, it } from "vitest";
import { check, normalize, type FilterLists } from "../src/lib/moderation";

// Faux mots de test : les vrais mots du filtre sont dans la base, jamais dans le code.
const LISTS: FilterLists = {
  blocked: ["bouffon", "crapaud"],
  phrases: ["vive le chaos"],
  sensitive: ["sorciere"],
};

describe("filtre de modération", () => {
  it("accepte un texte normal", () => {
    expect(check(LISTS, "Concert noise rock au Romandie, en retard de 10 minutes").decision).toBe("accepted");
  });
  it("ne bloque pas un mot qui en contient un autre", () => {
    expect(check(LISTS, "Les crapaudines et bouffonneries").decision).toBe("accepted");
  });
  it("refuse un mot bloquant, même déguisé", () => {
    expect(check(LISTS, "BOUFFON").decision).toBe("rejected");
    expect(check(LISTS, "b0uff0n").decision).toBe("rejected");
    expect(check(LISTS, "c.r.a.p.a.u.d").decision).toBe("rejected");
    expect(check(LISTS, "Crâââpaud").decision).toBe("rejected");
  });
  it("refuse une expression bloquante", () => {
    expect(check(LISTS, "Soirée : VIVE LE CHAOS !").decision).toBe("rejected");
    expect(check(LISTS, "le chaos, vive la fête").decision).toBe("accepted");
  });
  it("signale les mots sensibles sans refuser", () => {
    const r = check(LISTS, "Bal des Sorcières");
    expect(r.decision).toBe("accepted");
    const r2 = check(LISTS, "Bal de la sorcière");
    expect(r2.decision).toBe("review");
    expect(r2.flags).toContain("sorciere");
  });
  it("normalise accents, majuscules et chiffres", () => {
    expect(normalize("Éléphant R0SE!!!")).toBe("elephant rosei");
  });
});
