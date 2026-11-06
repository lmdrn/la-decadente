"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type Pin = { slug: string; name: string; address: string; city: string; lat: number; lng: number; tonight: { slug: string; title: string; time: string }[] };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function MapView({ pins, focus, labels }: { pins: Pin[]; focus?: string; labels: { tonight: string; nothing: string; program: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([46.5197, 6.6323], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const bounds: [number, number][] = [];
      for (const p of pins) {
        const active = p.tonight.length > 0;
        const icon = L.divIcon({
          className: "",
          html: `<span class="pin ${active ? "on" : ""}" aria-hidden="true">${active ? p.tonight.length : ""}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const list = p.tonight.length
          ? `<ul style="margin:6px 0 0;padding-left:16px">${p.tonight.map((e) => `<li><b>${esc(e.time)}</b> <a href="/evenement/${esc(e.slug)}">${esc(e.title)}</a></li>`).join("")}</ul>`
          : `<div style="margin-top:4px">${esc(labels.nothing)}</div>`;
        const m = L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: true })
          .addTo(map)
          .bindPopup(`<b><a href="/lieu/${esc(p.slug)}">${esc(p.name)}</a></b><br>${esc(p.address)}, ${esc(p.city)}<br><i>${esc(labels.tonight)}</i>${list}<div style="margin-top:6px"><a href="/lieu/${esc(p.slug)}">${esc(labels.program)}</a></div>`);
        if (p.slug === focus) {
          map.setView([p.lat, p.lng], 17);
          m.openPopup();
        }
        bounds.push([p.lat, p.lng]);
      }
      if (!focus && bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins, focus, labels]);
  return <div ref={ref} style={{ height: "min(70dvh, 640px)", width: "100%" }} role="region" aria-label="Carte des lieux" />;
}
