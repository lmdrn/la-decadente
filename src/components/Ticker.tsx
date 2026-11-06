import { connection } from "next/server";
import { listEvents, NO_FILTERS } from "@/lib/queries";
import { todayAgenda, fmtTime } from "@/lib/dates";
import type { Lang } from "@/lib/taxonomy";



export async function Ticker({ lang }: { lang: Lang }) {
  await connection();
  const today = todayAgenda();
  let rows: Awaited<ReturnType<typeof listEvents>> = [];
  try {
    rows = await listEvents(today, today, NO_FILTERS);
  } catch {
    rows = [];
  }
  const n = rows.length;
  const head = lang === "fr" ? `ce soir ${n} ${n > 1 ? "événements" : "événement"}` : `tonight ${n} ${n === 1 ? "event" : "events"}`;
  const items = rows
    .filter((r) => r.accessibility.includes("safe") || r.isFree || r.isPayWhatYouWant || r.category === "concert" || r.category === "club")
    .slice(0, 6)
    .map((r) => {
      const extra = r.isFree ? (lang === "fr" ? ", gratuit" : ", free") : r.isPayWhatYouWant ? (lang === "fr" ? ", prix libre" : ", pay what you want") : r.accessibility.includes("safe") ? ", safe space" : "";
      return `${r.title.toLowerCase()} ${lang === "fr" ? "à" : "at"} ${r.venueName.toLowerCase()} ${fmtTime(r.startsAt)}${extra}`;
    });
  const line = ["", head, ...items, ""].join(" ★ ");
  return (
    <div className="ticker" aria-hidden="true">
      <span>
        {line}
        {line}
      </span>
    </div>
  );
}
