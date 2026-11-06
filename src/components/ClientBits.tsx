"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { countVisit, toggleFavorite } from "@/app/actions";

/** Envoie le formulaire de filtres dès qu'une case change. */
export function AutoSubmitForm({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    // Sur téléphone, les filtres sont repliés pour voir la liste tout de suite.
    if (window.matchMedia("(max-width: 760px)").matches) {
      ref.current?.querySelectorAll("details").forEach((d) => (d.open = false));
    }
  }, []);
  return (
    <form
      ref={ref}
      {...props}
      onChange={(e) => {
        const el = e.target as unknown as HTMLInputElement;
        if (el.type === "checkbox" || el.tagName === "SELECT") ref.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}

export function FavButton({ id, initial, labels }: { id: string; initial: boolean; labels: [string, string] }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className="b fav"
      aria-pressed={fav}
      aria-label={fav ? labels[1] : labels[0]}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavorite(id);
          if (r.login) router.push(`/connexion?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          else if (r.ok) setFav(!!r.fav);
        })
      }
    >
      <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M1 2h3v1h2V2h3v3H8v1H7v1H6v1H4V7H3V6H2V5H1z" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fav ? 0 : 0.8} />
      </svg>
    </button>
  );
}

export function VisitCounter({ label }: { label: string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    countVisit().then(setN).catch(() => setN(null));
  }, []);
  if (n === null) return null;
  return (
    <span className="sunk fn" style={{ fontSize: 16 }}>
      {label} <span style={{ color: "var(--acc2)" }}>{String(n).padStart(7, "0")}</span>
    </span>
  );
}

export function AppearanceButton({ label }: { label: string }) {
  return (
    <button type="button" className="b" onClick={() => window.dispatchEvent(new CustomEvent("decadente:apparence"))}>
      <svg width="16" height="16" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M2 0h4v1h1v1h1v3H7v1H5V5H4v2H3v1H1V7H0V2h1V1h1z" fill="currentColor" />
      </svg>
      {label}
    </button>
  );
}
