"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Devil } from "./Devil";

// Easter egg : la croix de la fenêtre aspire la page dans un trou noir.
// Three.js n'est chargé qu'au premier clic sur la croix.

const FS_BH = `
uniform float uTime; uniform float uProg; uniform vec2 uRes;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
vec3 sky(vec2 p){vec2 g=p*55.;vec2 id=floor(g);vec2 f=fract(g)-.5;float h=hash(id);vec2 o=vec2(hash(id+1.3),hash(id+7.1))-.5;float s=smoothstep(.07,0.,length(f-o*.6))*step(.92,h);vec3 sc=mix(vec3(.85,.75,1.),vec3(.85,1.,.6),hash(id+3.));float n=fbm(p*2.2+vec2(0.,uTime*.03));vec3 neb=mix(vec3(.05,.01,.12),vec3(.3,.1,.55),n)*n*.7;return sc*s*1.6+neb;}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 float g=1.-pow(1.-uProg,3.);
 float rs=.15*g+1e-4;
 float r=length(uv);
 vec2 dir=uv/max(r,1e-4);
 vec2 bg=uv-dir*(rs*rs*2.4/max(r,rs*.5));
 float sw=g*rs*1.6/(r+.05);
 bg=mat2(cos(sw),-sin(sw),sin(sw),cos(sw))*bg;
 vec3 col=sky(bg);
 vec2 d=vec2(uv.x,uv.y/.27);
 float dr=length(d);float a=atan(d.y,d.x);
 float inner=rs*1.6,outer=rs*5.2;
 float band=smoothstep(inner,inner*1.12,dr)*(1.-smoothstep(outer*.55,outer,dr));
 float t=uTime;
 float ang=a+t*1.7-3.*rs/max(dr,1e-3);
 float sw2=fbm(vec2(cos(ang),sin(ang))*1.6+vec2(dr/rs*1.4-t*.5));
 float st=.5+.5*sin(a*16.+t*7.-dr/rs*7.);
 float dens=band*(.3+sw2)*(.7+.3*st);
 float heat=1.-smoothstep(inner,outer,dr);
 vec3 hot=vec3(1.,1.,.88),lime=vec3(.78,1.,0.),vio=vec3(.55,.24,1.),pink=vec3(1.,.36,.88);
 vec3 dc=mix(pink,vio,smoothstep(0.,.45,heat));dc=mix(dc,lime,smoothstep(.45,.8,heat));dc=mix(dc,hot,smoothstep(.86,1.,heat));
 float dop=1.+.75*cos(a+.3);
 vec3 disk=dc*dens*dop*2.4;
 float ring=exp(-pow((r-rs*1.52)/(rs*.1),2.));
 float aa=atan(uv.y,uv.x)+t*2.2;
 float arc=exp(-pow((r-rs*1.22)/(rs*.2),2.))*(.5+.5*fbm(vec2(cos(aa),sin(aa))*2.4+vec2(r*18.)));
 vec3 halo=mix(vio,lime,.35)*arc*1.7+vec3(1.,.96,1.)*ring*1.5;
 float hole=1.-smoothstep(rs*.97,rs,r);
 float front=1.-step(0.,uv.y);
 float bgA=smoothstep(0.,.5,uProg);
 col=(col*bgA+halo)*(1.-hole);
 col+=disk*mix(1.-hole,1.,front);
 col+=vio*.3*exp(-r/(rs*3.2))*g;
 col=1.-exp(-col*1.35);
 col*=1.-.3*dot(uv,uv)*bgA;
 float lum=max(col.r,max(col.g,col.b));
 float al=clamp(max(max(bgA,lum*1.6),hole*step(.02,g)),0.,1.);
 gl_FragColor=vec4(col,al);
}`;


type Running = { stop: () => void };

async function startScene(el: HTMLCanvasElement): Promise<Running | null> {
  let THREE: typeof import("three");
  try {
    THREE = await import("three");
  } catch {
    return null;
  }
  let renderer: import("three").WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const W = () => el.clientWidth || window.innerWidth;
  const H = () => el.clientHeight || window.innerHeight;
  const U = {
    uTime: { value: 0 },
    uProg: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  // Trou noir : un seul triangle plein écran
  const bhGeo = new THREE.BufferGeometry();
  bhGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const bhMat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: FS_BH,
  });
  const bh = new THREE.Mesh(bhGeo, bhMat);
  bh.frustumCulled = false;
  bh.renderOrder = 0;
  scene.add(bh);


  const resize = () => {
    const w = W(), h = H();
    renderer.setSize(w, h, false);
    U.uRes.value.set(w * dpr, h * dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  let raf = 0;
  let alive = true;
  const frame = (now: number) => {
    if (!alive) return;
    const t = reduce ? 4 : (now - t0) / 1000;
    U.uTime.value = t;
    U.uProg.value = Math.min(Math.max((t - 0.15) / 1.5, 0), 1);
    renderer.render(scene, camera);
    if (!reduce) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      bhGeo.dispose();
      bhMat.dispose();
      renderer.dispose();
    },
  };
}

export function BlackHole({ title, button }: { title: string; button: string }) {
  const [active, setActive] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const running = useRef<Running | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => {
      setNoGl(false);
      setActive(true);
    };
    window.addEventListener("decadente:boom", on);
    return () => window.removeEventListener("decadente:boom", on);
  }, []);

  const close = useCallback(() => {
    running.current?.stop();
    running.current = null;
    setActive(false);
    window.dispatchEvent(new CustomEvent("decadente:unboom"));
  }, []);

  useEffect(() => {
    if (!active) return;
    // Pas de barre de défilement ni de défilement pendant le trou noir
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const tm = window.setTimeout(() => btn.current?.focus(), 2100);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tm);
      document.documentElement.style.overflow = prev;
    };
  }, [active, close]);

  // Une seule scène par canvas (React peut monter deux fois en développement).
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    if (!el) return;
    let cancelled = false;
    let run: Running | null = null;
    startScene(el).then((r) => {
      if (cancelled) return r?.stop();
      if (!r) setNoGl(true);
      else running.current = run = r;
    });
    return () => {
      cancelled = true;
      run?.stop();
      if (running.current === run) running.current = null;
    };
  }, []);

  useEffect(() => () => running.current?.stop(), []);

  if (!active) return null;
  return (
    <div className={`bh ${noGl ? "nogl" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="bh-t">
      {!noGl && <canvas ref={canvasRef} aria-hidden="true" />}
      <div className="bh-devil">
        <Devil px={4} />
      </div>
      <div className="bh-low">
        <div className="bh-msg">
          <p id="bh-t" className="bh-t">
            {title}
          </p>
          <button ref={btn} className="b strong" type="button" onClick={close}>
            {button}
          </button>
        </div>
      </div>
    </div>
  );
}
