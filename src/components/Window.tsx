"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Devil } from "./Devil";

export type MenuItem = { href: string; label: string };

/** Fenêtre principale. La croix ouvre le trou noir (easter egg). */
export function Window({
  title,
  menu,
  children,
  headingLevel = 1,
}: {
  title: string;
  menu: MenuItem[];
  children: React.ReactNode;
  headingLevel?: 1 | 2;
}) {
  const path = usePathname();
  const [sucked, setSucked] = useState(false);

  useEffect(() => {
    const on = () => setSucked(true);
    const off = () => setSucked(false);
    window.addEventListener("decadente:boom", on);
    window.addEventListener("decadente:unboom", off);
    return () => {
      window.removeEventListener("decadente:boom", on);
      window.removeEventListener("decadente:unboom", off);
    };
  }, []);

  const boom = (e: React.MouseEvent) => {
    window.dispatchEvent(new CustomEvent("decadente:boom", { detail: { x: e.clientX, y: e.clientY } }));
  };

  const H = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={`win ${sucked ? "sucked" : ""}`} aria-label={title} id="contenu">
      <div className="tbar">
        <Devil px={2} />
        <H className="ttxt">{title}</H>
        <span className="sp" />
        <button className="b tb" type="button" aria-label="Réduire" tabIndex={-1}>
          _
        </button>
        <button className="b tb" type="button" aria-label="Agrandir" tabIndex={-1}>
          □
        </button>
        <button className="b tb" type="button" aria-label="Fermer" onClick={boom}>
          ×
        </button>
      </div>
      <nav className="menu" aria-label="Principal">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} aria-current={path === m.href ? "page" : undefined}>
            {m.label}
          </Link>
        ))}
      </nav>
      {children}
    </section>
  );
}
