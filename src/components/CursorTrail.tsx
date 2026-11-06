"use client";

import { useEffect, useRef } from "react";

// Traînée de pixels derrière les fenêtres (réglage "Traînée du curseur" dans Apparence).
// Inactive sur écran tactile et si l'appareil demande moins d'animations.
// L'animation s'arrête dès qu'il n'y a plus de pixels à dessiner.

type P = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string };

const GRID = 4;
const MAX = 160;
const snap = (v: number) => Math.round(v / GRID) * GRID;

export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const root = document.documentElement;
    const parts: P[] = [];
    let colors: string[] = [];
    let colorsAt = 0;
    let raf = 0;
    let last = 0;
    let lx = -1;
    let ly = -1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();

    const readColors = (now: number) => {
      if (now - colorsAt < 800 && colors.length) return;
      const cs = getComputedStyle(root);
      colors = ["--acc", "--sel", "--acc2"].map((v) => cs.getPropertyValue(v).trim()).filter(Boolean);
      colorsAt = now;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt * 1.4;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt; // retombe doucement
        ctx.globalAlpha = Math.min(1, p.life * 1.3);
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + p.life * 0.5);
        ctx.fillRect(snap(p.x), snap(p.y), s, s);
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || root.dataset.trail === "off") return;
      readColors(performance.now());
      const dist = lx < 0 ? 0 : Math.hypot(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
      const n = Math.min(3, 1 + Math.floor(dist / 18));
      for (let k = 0; k < n && parts.length < MAX; k++) {
        parts.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.6 + Math.random() * 0.4,
          size: GRID * (1 + Math.floor(Math.random() * 2)),
          color: colors[Math.floor(Math.random() * colors.length)] || "#C6FF00",
        });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="trail" aria-hidden="true" />;
}
