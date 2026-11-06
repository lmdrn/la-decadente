"use client";

import { useEffect, useRef } from "react";

// Traînée de pixels derrière les fenêtres (réglage "Traînée du curseur" dans Apparence).
// Inactive sur écran tactile et si l'appareil demande moins d'animations.
// L'animation s'arrête dès qu'il n'y a plus de pixels à dessiner.

type P = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string; alpha: number };

const GRID = 4;
const MAX = 700;
const STEP = 8; // un pixel tous les 8 px le long du chemin : ligne continue
const LIFE = 2.0; // secondes
const FADE = 0.5; // les dernières secondes, ça s'efface
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
    let outline = false; // mode jour : contour noir, pour se détacher du fond tramé
    let raf = 0;
    let last = 0;
    let colorIndex = 0;
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
      const mode = root.dataset.mode;
      outline = mode === "day" || (mode !== "night" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
      colorsAt = now;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = Math.min(1, p.life / FADE); // 1 tant que le pixel est "frais"
        ctx.globalAlpha = k * p.alpha;
        // Nuit : léger halo néon autour de chaque pixel (le pixel reste net)
        ctx.shadowColor = outline ? "transparent" : p.color;
        ctx.shadowBlur = outline ? 0 : 10;
        const s = Math.max(GRID, Math.round((p.size * (0.5 + 0.5 * k)) / GRID) * GRID);
        if (outline) {
          ctx.fillStyle = "#000";
          ctx.fillRect(snap(p.x) - 2, snap(p.y) - 2, s + 4, s + 4);
        }
        ctx.fillStyle = p.color;
        ctx.fillRect(snap(p.x), snap(p.y), s, s);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = parts.length ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || root.dataset.trail === "off") return;
      readColors(performance.now());
      const x = e.clientX;
      const y = e.clientY;
      const fromX = lx < 0 ? x : lx;
      const fromY = ly < 0 ? y : ly;
      const dist = Math.hypot(x - fromX, y - fromY);
      const n = Math.max(1, Math.min(24, Math.floor(dist / STEP)));
      lx = x;
      ly = y;
      for (let k = 1; k <= n && parts.length < MAX; k++) {
        const t = k / n;
        parts.push({
          x: fromX + (x - fromX) * t,
          y: fromY + (y - fromY) * t,
          vx: (Math.random() - 0.5) * 8, // dérive très légère
          vy: (Math.random() - 0.5) * 8,
          life: LIFE * (0.85 + Math.random() * 0.3),
          size: GRID * 2,
          color: colors[(colorIndex = (colorIndex + 1) % Math.max(1, colors.length))] || "#C6FF00",
          alpha: 1,
        });
        // Pixels diffus autour de la ligne
        if (Math.random() < 0.55 && parts.length < MAX) {
          const a = Math.random() * Math.PI * 2;
          const r = 5 + Math.random() * 9;
          parts.push({
            x: fromX + (x - fromX) * t + Math.cos(a) * r,
            y: fromY + (y - fromY) * t + Math.sin(a) * r,
            vx: Math.cos(a) * (6 + Math.random() * 14),
            vy: Math.sin(a) * (6 + Math.random() * 14),
            life: LIFE * (0.5 + Math.random() * 0.5),
            size: GRID,
            color: colors[Math.floor(Math.random() * colors.length)] || "#C6FF00",
            alpha: 0.45 + Math.random() * 0.35,
          });
        }
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onLeave = () => {
      lx = -1;
      ly = -1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="trail" aria-hidden="true" />;
}
