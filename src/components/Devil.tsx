// Logo de La Décadente : diable 16×16 au sourire carnassier.
const ROWS = [
  ".X............X.",
  ".XX..........XX.",
  ".XXX........XXX.",
  "..XXX.XXXX.XXX..",
  "..XXXXXXXXXXXX..",
  ".XXXXXXXXXXXXXX.",
  ".XXX..XXXX..XXX.",
  ".XXXX.XXXX.XXXX.",
  ".X.XXXXXXXXXX.X.",
  ".X...X.XX.X...X.",
  ".XX..X.XX.X..XX.",
  "..XX..X..X..XX..",
  "..XXXXXXXXXXXX..",
  "....XXXXXXXX....",
  "......XXXX......",
  ".......XX.......",
];
const CELLS = ROWS.join("").split("");

export function Devil({ px = 2, className }: { px?: number; className?: string }) {
  return (
    <span className={`devil ${className ?? ""}`} style={{ "--px": `${px}px` } as React.CSSProperties} aria-hidden="true">
      {CELLS.map((c, i) => (
        <i key={i} className={c === "X" ? "x" : undefined} />
      ))}
    </span>
  );
}

/** Même dessin en SVG (favicon, partage). */
export function devilSvg(color = "#8B3DFF") {
  const rects: string[] = [];
  ROWS.forEach((r, y) => {
    let x = 0;
    while (x < 16) {
      if (r[x] === "X") {
        const s = x;
        while (x < 16 && r[x] === "X") x++;
        rects.push(`<rect x="${s}" y="${y}" width="${x - s}" height="1"/>`);
      } else x++;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><g fill="${color}">${rects.join("")}</g></svg>`;
}
