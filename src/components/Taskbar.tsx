"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Devil } from "./Devil";
import { saveAppearance, setLang } from "@/app/actions";
import { DEFAULT_APPEARANCE, serializeAppearance, type Resolved } from "@/lib/appearance";
import type { Dict } from "@/lib/i18n";

type Props = {
  t: Dict;
  lang: "fr" | "en";
  user: { name: string; canModerate: boolean } | null;
  appearance: Resolved;
};

const PALETTE_LABELS: Record<Resolved["palette"], { fr: string; en: string; sw: [string, string] }> = {
  citron: { fr: "Violet et citron (défaut)", en: "Violet and lime (default)", sw: ["#9B4DFF", "#C6FF00"] },
  violet: { fr: "Rave", en: "Rave", sw: ["#07060B", "#9B4DFF"] },
  rouge: { fr: "Punk", en: "Punk", sw: ["#0E0A0A", "#E10600"] },
  contraste: { fr: "Haut contraste", en: "High contrast", sw: ["#000000", "#FFE600"] },
};
const FONT_LABELS: Record<Resolved["font"], { fr: string; en: string }> = {
  base: { fr: "Défaut", en: "Default" },
  affiche: { fr: "Affiche club", en: "Club poster" },
  hacker: { fr: "Hacker", en: "Hacker" },
  tattoo: { fr: "Tattoo", en: "Tattoo" },
  gothique: { fr: "Gothique", en: "Gothic" },
  pixel: { fr: "Pixel", en: "Pixel" },
};
const MODE_LABELS: Record<Resolved["mode"], { fr: string; en: string }> = {
  auto: { fr: "Comme l'appareil", en: "Like my device" },
  day: { fr: "Jour (1-bit)", en: "Day (1-bit)" },
  night: { fr: "Nuit (rave)", en: "Night (rave)" },
};

function apply(a: Resolved) {
  const h = document.documentElement;
  h.dataset.palette = a.palette;
  h.dataset.font = a.font;
  h.dataset.mode = a.mode;
  h.dataset.trail = a.trail;
}

export function Taskbar({ t, lang, user, appearance }: Props) {
  const router = useRouter();
  const [start, setStart] = useState(false);
  const [cfg, setCfg] = useState(false);
  const [app, setApp] = useState<Resolved>(appearance);
  const snap = useRef<Resolved>(appearance);
  const [clock, setClock] = useState("");
  const [, startT] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const dlgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () =>
      setClock(new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!start) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setStart(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStart(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [start]);

  useEffect(() => {
    const open = () => {
      snap.current = app;
      setStart(false);
      setCfg(true);
    };
    window.addEventListener("decadente:apparence", open);
    return () => window.removeEventListener("decadente:apparence", open);
  }, [app]);

  useEffect(() => {
    if (cfg) dlgRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed='true']")?.focus();
  }, [cfg]);

  const pick = (patch: Partial<Resolved>) => {
    const next = { ...app, ...patch };
    setApp(next);
    apply(next);
  };
  const openCfg = () => {
    snap.current = app;
    setStart(false);
    setCfg(true);
  };
  const cancel = () => {
    setApp(snap.current);
    apply(snap.current);
    setCfg(false);
  };
  const ok = () => {
    setCfg(false);
    startT(() => saveAppearance(serializeAppearance(app)));
  };
  const switchLang = () => {
    setStart(false);
    startT(async () => {
      await setLang(lang === "fr" ? "en" : "fr");
      router.refresh();
    });
  };

  return (
    <>
      <div className="task">
        <div ref={menuRef} style={{ display: "contents" }}>
          {start && (
            <nav className="win smenu" aria-label={t.demarrer}>
              <div className="sban" aria-hidden="true">
                La Décadente
              </div>
              <div className="sitems" onClick={(e) => (e.target as HTMLElement).closest("a") && setStart(false)}>
                <Link href="/"><span className="sico" aria-hidden="true" />{t.agenda}</Link>
                <Link href="/lieux"><span className="sico" aria-hidden="true" />{t.lieux}</Link>
                <Link href="/carte"><span className="sico" aria-hidden="true" />{t.carte}</Link>
                <Link href="/favoris"><span className="sico" aria-hidden="true" />{t.favoris}</Link>
                <div className="ssep" />
                <Link href="/ajouter/evenement"><span className="sico" aria-hidden="true" />{t.ajouterEvent}</Link>
                <Link href="/ajouter/lieu"><span className="sico" aria-hidden="true" />{t.ajouterLieu}</Link>
                <div className="ssep" />
                <button type="button" onClick={openCfg}><span className="sico" aria-hidden="true" />{t.apparence}</button>
                <button type="button" onClick={switchLang}><span className="sico" aria-hidden="true" />{t.langue} : {lang === "fr" ? "FR / en" : "fr / EN"}</button>
                <div className="ssep" />
                <Link href="/charte"><span className="sico" aria-hidden="true" />{t.charte}</Link>
                <Link href="/a-propos"><span className="sico" aria-hidden="true" />{t.aPropos}</Link>
                <Link href="/contact"><span className="sico" aria-hidden="true" />{t.contact}</Link>
                <div className="ssep" />
                {user?.canModerate && (
                  <Link href="/admin"><span className="sico" aria-hidden="true" />{t.admin}</Link>
                )}
                <Link href={user ? "/compte" : "/connexion"}><span className="sico" aria-hidden="true" />{user ? `${t.monCompte} (${user.name})` : t.connexion}</Link>
              </div>
            </nav>
          )}
          <button className={`b strong ${start ? "on" : ""}`} type="button" aria-expanded={start} onClick={() => setStart((s) => !s)}>
            <Devil px={2} />
            {t.demarrer}
          </button>
        </div>
        <Link className="b hide-s" href="/" style={{ minWidth: 150 }}>{t.agenda}</Link>
        <Link className="b hide-s" href="/carte" style={{ minWidth: 150 }}>{t.carte}</Link>
        <span className="sunk clock" suppressHydrationWarning>
          {lang.toUpperCase()} {clock}
        </span>
      </div>

      {cfg && (
        <div className="ov" onMouseDown={(e) => e.target === e.currentTarget && cancel()} onKeyDown={(e) => e.key === "Escape" && cancel()}>
          <section ref={dlgRef} className="win dlg" role="dialog" aria-modal="true" aria-labelledby="cfg-t">
            <div className="tbar">
              <h2 id="cfg-t" className="ttxt">{lang === "fr" ? "Propriétés d'affichage" : "Display properties"}</h2>
              <span className="sp" />
              <button className="b tb" type="button" aria-label="Fermer" onClick={cancel}>×</button>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="sunk pv" aria-hidden="true">
                <div className="pvw">
                  <div className="pvt">{lang === "fr" ? "Aperçu" : "Preview"}</div>
                  <div className="pvr"><b>21:00</b> Le Romandie</div>
                  <div className="pvr sel"><b>23:00</b> Les Docks</div>
                  <div className="pvr"><b>00:00</b> MAD</div>
                </div>
              </div>
              <fieldset className="g">
                <legend>{lang === "fr" ? "Modèle de couleurs" : "Colour scheme"}</legend>
                <div className="choices">
                  {(Object.keys(PALETTE_LABELS) as Resolved["palette"][]).map((k) => (
                    <button key={k} type="button" className="b" aria-pressed={app.palette === k} onClick={() => pick({ palette: k })}>
                      <span className="sw" style={{ background: PALETTE_LABELS[k].sw[0] }} aria-hidden="true" />
                      <span className="sw" style={{ background: PALETTE_LABELS[k].sw[1] }} aria-hidden="true" />
                      {PALETTE_LABELS[k][lang]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="g">
                <legend>{lang === "fr" ? "Police" : "Font"}</legend>
                <div className="choices">
                  {(Object.keys(FONT_LABELS) as Resolved["font"][]).map((k) => (
                    <button key={k} type="button" className="b" data-font-preview={k} aria-pressed={app.font === k} onClick={() => pick({ font: k })}>
                      Aa {FONT_LABELS[k][lang]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="g">
                <legend>{lang === "fr" ? "Mode" : "Mode"}</legend>
                <div className="choices">
                  {(Object.keys(MODE_LABELS) as Resolved["mode"][]).map((k) => (
                    <button key={k} type="button" className="b" aria-pressed={app.mode === k} onClick={() => pick({ mode: k })}>
                      {MODE_LABELS[k][lang]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="g">
                <legend>{lang === "fr" ? "Traînée du curseur" : "Pointer trails"}</legend>
                <div className="choices">
                  {(["on", "off"] as const).map((k) => (
                    <button key={k} type="button" className="b" aria-pressed={app.trail === k} onClick={() => pick({ trail: k })}>
                      {k === "on" ? (lang === "fr" ? "Oui" : "On") : lang === "fr" ? "Non" : "Off"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <p className="mu" style={{ margin: 0 }}>
                {lang === "fr"
                  ? "Ton apparence est gardée sur ton compte, ou dans ce navigateur si tu n'es pas connecté·e."
                  : "Your appearance is saved to your account, or in this browser if you're not logged in."}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                <button className="b" type="button" onClick={() => { setApp(DEFAULT_APPEARANCE); apply(DEFAULT_APPEARANCE); }}>
                  {lang === "fr" ? "Par défaut" : "Default"}
                </button>
                <button className="b" type="button" onClick={cancel}>{lang === "fr" ? "Annuler" : "Cancel"}</button>
                <button className="b strong" type="button" style={{ minWidth: 80, justifyContent: "center" }} onClick={ok}>OK</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
