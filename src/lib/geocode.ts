// Géocodage et zone couverte par La Décadente.
// Zone : canton de Vaud, surtout Lausanne. Yverdon, Vevey, Montreux OK.
// Rien à l'ouest de Morges : cette région est couverte par La Décadanse.

export const MORGES_LNG = 6.4983; // longitude de Morges
const WEST_MARGIN = 0.012; // ~900 m de tolérance pour Morges même

export type GeoHit = { lat: number; lng: number; state?: string; city?: string; display: string };

export async function geocodeAddress(q: string): Promise<GeoHit | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=ch&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LaDecadente/0.1 (agenda culturel Lausanne)", "Accept-Language": "fr" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const [h] = (await res.json()) as { lat: string; lon: string; display_name: string; address?: Record<string, string> }[];
    if (!h) return null;
    return {
      lat: Number(h.lat),
      lng: Number(h.lon),
      state: h.address?.state,
      city: h.address?.city ?? h.address?.town ?? h.address?.village,
      display: h.display_name,
    };
  } catch {
    return null;
  }
}

export type ZoneCheck = { ok: true } | { ok: false; reason: "hors-vaud" | "ouest-morges" };

export function checkZone(hit: Pick<GeoHit, "lng" | "state">): ZoneCheck {
  if (hit.state && hit.state !== "Vaud") return { ok: false, reason: "hors-vaud" };
  if (hit.lng < MORGES_LNG - WEST_MARGIN) return { ok: false, reason: "ouest-morges" };
  return { ok: true };
}
