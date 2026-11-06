import { describe, expect, it } from "vitest";
import { checkZone } from "../src/lib/geocode";
import { addDays, agendaDateOf, monthEnd, rangeFor, weekStart, zurichToDate } from "../src/lib/dates";
import { safeNext } from "../src/lib/safe-next";

describe("zone couverte", () => {
  it("accepte Lausanne, Morges, Vevey, Yverdon", () => {
    expect(checkZone({ lng: 6.6323, state: "Vaud" }).ok).toBe(true); // Lausanne
    expect(checkZone({ lng: 6.4983, state: "Vaud" }).ok).toBe(true); // Morges
    expect(checkZone({ lng: 6.8432, state: "Vaud" }).ok).toBe(true); // Vevey
    expect(checkZone({ lng: 6.6412, state: "Vaud" }).ok).toBe(true); // Yverdon
  });
  it("refuse l'ouest de Morges (La Décadanse) et hors Vaud", () => {
    expect(checkZone({ lng: 6.3373, state: "Vaud" })).toEqual({ ok: false, reason: "ouest-morges" }); // Rolle
    expect(checkZone({ lng: 6.2398, state: "Vaud" })).toEqual({ ok: false, reason: "ouest-morges" }); // Nyon
    expect(checkZone({ lng: 7.3606, state: "Valais" })).toEqual({ ok: false, reason: "hors-vaud" }); // Sion
  });
});

describe("dates de l'agenda", () => {
  it("un événement à 00:30 appartient à la soirée de la veille", () => {
    expect(agendaDateOf(zurichToDate("2026-11-07", "00:30"))).toBe("2026-11-06");
    expect(agendaDateOf(zurichToDate("2026-11-07", "06:30"))).toBe("2026-11-07");
  });
  it("heure de Lausanne, été comme hiver", () => {
    expect(zurichToDate("2026-11-06", "21:00").toISOString()).toBe("2026-11-06T20:00:00.000Z");
    expect(zurichToDate("2026-07-31", "21:00").toISOString()).toBe("2026-07-31T19:00:00.000Z");
  });
  it("semaines du lundi au dimanche, mois complets", () => {
    expect(weekStart("2026-11-06")).toBe("2026-11-02");
    expect(rangeFor("semaine", "2026-11-06")).toEqual({ from: "2026-11-02", to: "2026-11-08" });
    expect(monthEnd("2026-02-10")).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("redirections sûres après connexion", () => {
  it("refuse les redirections vers un autre site", () => {
    expect(safeNext("/favoris")).toBe("/favoris");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
  });
});
