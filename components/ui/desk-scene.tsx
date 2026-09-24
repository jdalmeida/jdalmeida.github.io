"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Grime, { LAYERS, layerImage, rng, type Layer } from "@/components/ui/grime";
import styles from "./desk-scene.module.css";
import DeskCredentials from "./desk-credentials";

// One-pixel slices extrude the same rounded outline as the tabletop.
const deskLayers = Array.from({ length: 24 }, (_, index) => index + 1);
const cupSides = Array.from({ length: 48 }, (_, index) => ({
  "--angle": `${index * 7.5}deg`,
  "--shade": `${78 + 16 * Math.cos((index * 7.5 - 35) * Math.PI / 180)}%`,
} as CSSProperties));
// Close both contours of the handle instead of stacking edge-on rings.
const handleSides = [0, .075].flatMap((inset) => Array.from({ length: 48 }, (_, index) => {
  const a = index * Math.PI / 24, b = (index + 1) * Math.PI / 24;
  const rx = .24 - inset, ry = .33 - inset;
  const dx = rx * (Math.cos(b) - Math.cos(a)), dy = ry * (Math.sin(b) - Math.sin(a));
  return {
    "--handle-x": .24 + rx * (Math.cos(a) + Math.cos(b)) / 2,
    "--handle-y": .33 + ry * (Math.sin(a) + Math.sin(b)) / 2,
    "--handle-length": Math.hypot(dx, dy),
    "--handle-angle": `${Math.atan2(dy, dx)}rad`,
    "--handle-light": `${76 + 12 * Math.cos(a - Math.PI / 4)}%`,
  } as CSSProperties;
}));
const binSides = Array.from({ length: 24 }, (_, index) => ({
  "--angle": `${index * 15}deg`,
  "--shade": `${34 + 14 * Math.cos((index * 15 - 35) * Math.PI / 180)}%`,
} as CSSProperties));
const coffeeSpot = (r: () => number) => ({ radius: 0.038 + r() * 0.008, x: 0.87 + r() * 0.05, y: 0.12 + r() * 0.08 });

// Coffee-cup rings: one spot where the mug always goes, 1–4 overlapping rings, mostly broken arcs like dried stains.
// ponytail: spot kept on the right half, since the card lands on the left.
const COFFEE: Layer = {
  blend: "multiply", opacity: 0.8,
  filter: `<feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" seed="S"/>
    <feDisplacementMap in="SourceGraphic" scale="5"/>
    <feGaussianBlur stdDeviation=".7"/>`,
  body: (w, h, r) => {
    const spot = coffeeSpot(r);
    const R = w * spot.radius, cx = w * spot.x, cy = h * spot.y;
    let rings = "";
    for (let n = 1 + Math.floor(r() * 4); n--; ) {
      const rad = R * (0.95 + r() * 0.1), c = 2 * Math.PI * rad, arc = c * (0.55 + r() * 0.45);
      rings += `<circle cx="${(cx + (r() - 0.5) * R * 0.7).toFixed(1)}" cy="${(cy + (r() - 0.5) * R * 0.7).toFixed(1)}" r="${rad.toFixed(1)}"
        fill-opacity="${(0.05 + r() * 0.12).toFixed(2)}" stroke-width="${(1.2 + r() * 2.3).toFixed(1)}" stroke-opacity="${(0.45 + r() * 0.45).toFixed(2)}"
        stroke-dasharray="${arc.toFixed(1)} ${c.toFixed(1)}" stroke-dashoffset="${(r() * c).toFixed(1)}"/>`;
    }
    // The empty rect makes the filter box span the whole image, so the wobble isn't clipped at the rings' bounds.
    return `<g fill="#6b3f1d" stroke="#3a1d0b" filter="url(#f)"><rect width="100%" height="100%" fill="none" stroke="none"/>${rings}</g>`;
  },
};

// Card grime minus grease: its light smears read as bleached patches on the dark wood.
const [dirt, , wear] = LAYERS;
const DESK_LAYERS = [dirt, wear];

function CoffeeCup() {
  const paint = (el: HTMLDivElement | null) => {
    if (!el) return;
    const seed = Math.floor(Math.random() * 1e5);
    const spot = coffeeSpot(rng(seed));
    el.style.setProperty("--cup-x", `${(spot.x - spot.radius * 1.8) * 100}%`);
    el.style.setProperty("--cup-y", `${(spot.y + 0.035) * 100}%`);
    el.style.setProperty("--cup-size", `${spot.radius * 200}%`);
    (el.firstElementChild as HTMLElement).style.backgroundImage = layerImage(COFFEE, el.offsetWidth, el.offsetHeight, seed);
    const resize = () => el.style.setProperty("--cup-diameter", `${el.offsetWidth * spot.radius * 2}px`);
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => observer.disconnect();
  };

  return (
    <div ref={paint} className={styles.coffee} aria-hidden="true">
      <div className={styles.coffeeStains} />
      <div className={styles.cup}>
        <div className={styles.cupShadow} />
        <div className={styles.cupBase} />
        <div className={styles.cupHandle}>
          <div className={styles.handleFace} />
          <div className={styles.handleFace} />
          {handleSides.map((style, index) => (
            <div key={index} className={styles.handleSide} style={style} />
          ))}
        </div>
        {cupSides.map((style, index) => (
          <div key={index} className={styles.cupWall} style={style} />
        ))}
        {cupSides.map((style, index) => (
          <div key={index} className={styles.cupInnerWall} style={style} />
        ))}
        <div className={styles.cupCoffee} />
        <div className={styles.cupRim} />
      </div>
    </div>
  );
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export default function DeskScene({ card, stickers, notebook }: { card: ReactNode; stickers: ReactNode; notebook: ReactNode }) {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scene.current!;
    const viewport = stage.current!;
    const surface = desk.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 640px) and (orientation: portrait)");
    let frame = 0;

    function update() {
      frame = 0;
      const height = viewport.clientHeight;
      const progress = motion.matches ? 1 : clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height));
      const arrival = ease(progress / 0.5);
      const overhead = ease((progress - 0.36) / 0.54);
      const landing = ease((progress - 0.48) / 0.42);
      const travel = ease(progress / 0.9);
      const entry = height * 1.25 * (1 - arrival);
      const pitch = 78 * (1 - overhead);
      const turn = mobile.matches ? 90 * overhead : 0;
      const width = surface.offsetWidth;
      const values: Record<string, string | number> = {
        "--entry": `${entry}px`,
        "--pitch": `${pitch}deg`,
        "--turn": `${turn}deg`,
        "--card-y": `${(mobile.matches ? -width * 0.23 : width * 0.085) * travel}px`,
        "--card-x": `${mobile.matches ? 0 : -width * 0.23 * travel}px`,
        "--floor": overhead,
        "--card-pitch": `${pitch * landing}deg`,
        "--card-turn": `${-8 * travel}deg`,
        "--card-scale": 1 - (mobile.matches ? 0.5 : 0.72) * travel,
        "--card-type-scale": mobile.matches ? 1 + 0.6 * travel : 1,
        "--card-name-bottom": `${mobile.matches ? 9 - 5 * travel : 9}%`,
        "--card-text-bottom": `${mobile.matches ? 9 + 4 * travel : 9}%`,
        "--card-lift": `${1 + 45 * Math.sin(Math.PI * travel)}px`,
        "--card-tilt": 1 - travel,
        "--card-shadow-y": `${30 - 27 * landing}px`,
        "--card-shadow-blur": `${60 - 51 * landing}px`,
        "--card-shadow-spread": `${-20 + 22 * landing}px`,
        "--sticker-y": `${-height * progress * 1.35}px`,
        "--sticker-turn": `${-12 * progress}deg`,
        "--sticker-scale": 1 + progress * 0.3,
        "--sticker-opacity": 1 - ease((progress - 0.1) / 0.45),
      };
      for (const [key, value] of Object.entries(values)) root.style.setProperty(key, String(value));
      root.dataset.started = String(progress > 0.03);
      root.dataset.landed = String(landing > 0.99);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(surface);
    addEventListener("scroll", schedule, { passive: true });
    motion.addEventListener("change", schedule);
    mobile.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("scroll", schedule);
      motion.removeEventListener("change", schedule);
      mobile.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <section ref={scene} className={styles.scene} aria-label="Da apresentação à minha escrivaninha">
      <div ref={stage} className={styles.stage}>
        <div className={styles.stickers} data-scene-stickers>{stickers}</div>
        <div className={styles.space}>
          <div ref={desk} className={styles.desk} data-desk>
            <div className={styles.furniture} aria-hidden="true">
              <div className={styles.floor}>
                <div className={styles.rug} />
                <svg className={styles.cable} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M44 38 C38 30 30 40 24 34 S14 20 2 24" />
                </svg>
                <span className={styles.paperBall} /><span className={styles.paperBall} />
              </div>
              <div className={styles.leg} /><div className={styles.leg} />
              <div className={styles.leg} /><div className={styles.leg} />
              <div className={styles.drawers}><span /><span /></div>
              {deskLayers.map((depth) => (
                <div key={depth} className={styles.edge} style={{ "--depth": depth } as CSSProperties} />
              ))}
              <div className={styles.top}><Grime layers={DESK_LAYERS} /></div>
            </div>
            <CoffeeCup />
            <div className={styles.bin} aria-hidden="true">
              <div className={styles.binBottom}><span /><span /></div>
              {binSides.map((style, index) => <div key={index} className={styles.binSide} style={style} />)}
              <div className={styles.binRim} />
            </div>
            <div className={styles.clutter} aria-hidden="true">
              <div className={styles.pencil} />
              <div className={styles.pen} />
              <div className={styles.sticky}>TODO:<br />– more code<br />– more coffe</div>
              <svg className={styles.clip} viewBox="0 0 40 100"><path d="M28 30 V82 a10 10 0 0 1 -20 0 V18 a14 14 0 0 1 28 0 V72" /></svg>
              <svg className={styles.clip} viewBox="0 0 40 100"><path d="M28 30 V82 a10 10 0 0 1 -20 0 V18 a14 14 0 0 1 28 0 V72" /></svg>
              {/* Chalk hints; units are % of desk height. The phone set is drawn upright on the 100x185 screen and turned back onto the desk. */}
              <svg className={styles.chalk} viewBox="0 0 185 100">
                <defs>
                  <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" />
                    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.2 -1" />
                    <feComposite in="SourceGraphic" operator="in" />
                  </filter>
                  <marker id="chalk-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M1 1 L8 5 L1 9" />
                  </marker>
                </defs>
                <g className={styles.chalkWide}>
                  <text x="50" y="36" textAnchor="end">Meus artigos e</text>
                  <text x="50" y="43" textAnchor="end">selos dos visitantes</text>
                  <path d="M52 34 C58 31 62 31 66 29" />
                  <text x="8" y="94">Meus contatos</text>
                  <path d="M30 88 C34 87 36 85 37 81" />
                  <text x="148" y="94">Meus eventos</text>
                  <path d="M152 88 C150 82 147 79 143 77" />
                </g>
                <g className={styles.chalkPhone} transform="translate(0 100) rotate(-90)">
                  <text x="12" y="20">Meus contatos</text>
                  <path d="M52 17 C60 16 62 22 60 28" />
                  <text x="3" y="80">Meus artigos e</text>
                  <text x="3" y="87">selos dos visitantes</text>
                  <path d="M42 76 C52 73 60 77 62 84" />
                  <text x="76" y="128">Meus</text>
                  <text x="76" y="135">eventos</text>
                  <path d="M74 126 C70 125 68 128 67 132" />
                </g>
              </svg>
            </div>
            {notebook}
            <DeskCredentials />
          </div>
          <div className={styles.cardAnchor}>
            <div className={styles.card} data-desk-card>{card}</div>
          </div>
        </div>
        <a className={styles.scrollCue} href="#escrivaninha">
          <span>Role para explorar</span><span className={styles.arrow} aria-hidden="true">↓</span>
        </a>
      </div>
      <div id="escrivaninha" className={styles.destination} tabIndex={-1} aria-label="Minha escrivaninha" />
    </section>
  );
}
