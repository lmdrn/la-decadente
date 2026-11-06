import { getEventBySlug } from "@/lib/queries";

// Fichier .ics : ajouter l'événement à n'importe quel calendrier.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const data = await getEventBySlug(slug);
  if (!data) return new Response("Introuvable", { status: 404 });
  const { event: e, venue: v } = data;
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 3 * 3600_000);
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/evenement/${e.slug}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Decadente//Agenda//FR",
    "BEGIN:VEVENT",
    `UID:${e.id}@la-decadente`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(`${v.name}, ${v.address === "à compléter" ? "" : v.address + ", "}${v.city}`)}`,
    `DESCRIPTION:${esc([e.lineup, e.description, url].filter(Boolean).join("\n"))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
