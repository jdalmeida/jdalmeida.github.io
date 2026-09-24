"use client";

import type { CSSProperties, PointerEvent } from "react";
import type { Stamp } from "@/lib/stamps";
import { rng } from "./grime";
import styles from "./stamp.module.css";

// Pen doodles in a 100x100 box, as strokes of points; `r` adds per-doodle variation.
export type P = [number, number];
const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, rad: number, a: number): P => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
const range = (n: number, f: (t: number, i: number) => P) => Array.from({ length: n }, (_, i) => f(i / (n - 1), i));
const heart = (u: number, s: number, cy: number): P => [50 + s * Math.sin(u) ** 3, cy - s / 16 * (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u))];
export const DOODLES: ((r: () => number) => P[][])[] = [
  (r) => { const k = 16 + r() * 8; return [range(11, (_, i) => polar(50, 54, i % 2 ? k : 46, i * TAU / 10 - TAU / 4))]; }, // star
  (r) => { const a = r() * TAU; return [range(70, (t) => polar(50, 50, 4 + t * 42, a + t * TAU * 3.2))]; }, // spiral
  () => [range(48, (t) => heart(t * TAU * 1.05, 42, 42))], // heart
  () => [[[15, 35], [55, 35], [55, 75], [15, 75], [15, 35]], [[33, 17], [73, 17], [73, 57], [33, 57], [33, 17]], [[15, 35], [33, 17]], [[55, 35], [73, 17]], [[55, 75], [73, 57]], [[15, 75], [33, 57]]], // cube
  () => [range(24, (t) => [8 * (1 - t) ** 2 + 30 * (1 - t) * t + 88 * t * t, 85 * (1 - t) ** 2 + 30 * (1 - t) * t + 28 * t * t]), [[75, 34], [88, 28], [78, 18]]], // arrow
  () => [[[60, 4], [28, 54], [50, 54], [36, 96], [78, 40], [56, 40], [74, 4], [60, 4]]], // lightning
  (r) => [range(40, (t) => polar(50, 50, 16, t * TAU * 1.15)), ...Array.from({ length: 9 }, (_, i): P[] => { const a = i * TAU / 9; return [polar(50, 50, 24, a), polar(50, 50, 34 + r() * 12, a)]; })], // sun
  (r) => { const a = r() * TAU; return [range(50, (t) => polar(50, 50, 42, a + t * TAU * 1.1)), [[36, 32], [37, 44]], [[62, 32], [63, 44]], range(16, (t) => polar(50, 50, 26, Math.PI * (0.15 + 0.7 * t)))]; }, // smiley
  () => [range(90, (t) => polar(50, 38, 30 * Math.abs(Math.cos(3 * t * TAU)), t * TAU)), range(14, (t) => polar(50, 38, 5, t * TAU)), [[50, 50], [49, 75], [47, 98]]], // flower
  () => [range(80, (t) => { const u = t * TAU * 3; return [10 + 4.3 * u - 9 * Math.sin(u), 50 + 12 * Math.cos(u)]; })], // loops
  () => [[[15, 22], [78, 20], [80, 85], [16, 84], [15, 22]], [[26, 50], [45, 74], [96, 4]]], // checkbox
  () => [[[36, 4], [31, 96]], [[66, 4], [61, 96]], [[4, 36], [96, 32]], [[4, 66], [96, 62]], [[40, 42], [56, 56]], [[56, 42], [40, 56]]], // tic-tac-toe
];
export const strokes = (s: P[][], r = () => 0.5) => s.map((st) => "M" + st.map(([x, y]) => `${(x + r() - 0.5).toFixed(1)} ${(y + r() - 0.5).toFixed(1)}`).join("L")).join("");

// Rarity is the sticker's finish: 70% matte, 25% metallic, 5% chroma.
// Own random stream, so tweaking the look code never changes anyone's rarity.
export const TIERS = ["comum", "raro", "lendário"] as const;
export const tier = (seed: number) => { const v = rng(seed ^ 0x5eed)(); return v < 0.05 ? 2 : v < 0.3 ? 1 : 0; };
export const pad = (n: number) => `Nº ${String(n).padStart(4, "0")}`;

const PAPER = [["#f4ecd8", "#b3261e"], ["#1c3452", "#f4efe2"], ["#e9b949", "#1d1a16"], ["#bfe3d0", "#1c3452"], ["#f6c6cf", "#7a1f3d"], ["#ef7d3c", "#fff4e0"], ["#d8c8f0", "#3b2a7a"], ["#1d1a16", "#f2d64b"]];
const METAL = [["#f4f6f9", "#8f97a3", "#1f2a38"], ["#f7e6a6", "#a9822f", "#3a2a0c"]]; // silver, gold: light, dark, ink
const MONTHS = "JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ".split(" ");
const path = (pts: P[]) => "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
const data = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Outline as a radius per angle: superellipse (circle, oval, squircle, rounded rect) or polygon, maybe scalloped or starburst.
function outline(r: () => number, passport: boolean): P[] {
  const a = passport ? 42 : 38 + r() * 4, b = passport ? 27 + r() * 6 : r() < 0.35 ? a * (0.8 + r() * 0.15) : a;
  const n = passport ? 3 + r() * 5 : [2, 2, 2.6, 4][Math.floor(r() * 4)];
  const sides = !passport && r() < 0.25 ? 6 + 2 * Math.floor(r() * 2) : 0, step = TAU / (sides || 1), spin = r() * TAU;
  const edge = r(), m = 10 + Math.floor(r() * 10);
  return range(180, (t) => {
    const u = t * TAU, c = Math.cos(u), s = Math.sin(u);
    let R = sides ? a * Math.cos(step / 2) / Math.cos(((u + spin) % step) - step / 2) : (Math.abs(c / a) ** n + Math.abs(s / b) ** n) ** (-1 / n);
    if (edge < 0.2) R *= 0.96 + 0.04 * Math.abs(Math.cos(u * m / 2)); // scalloped
    else if (edge < 0.35 && !passport) R *= 0.9 + 0.1 * Math.abs(((u * m / TAU) % 1) * 2 - 1); // starburst
    return [50 + R * c, 50 + R * s];
  });
}

// The whole sticker as one SVG image, all from the seed: family (passport stamp / round sticker), shape, colours, doodle, ink wear.
// An image, not live DOM: SVG filters inside the book's 3D transforms would freeze the page (see Grime).
function art(s: Stamp) {
  const r = rng(s.seed), t = tier(s.seed), passport = !s.ff && r() < 0.45, fs = s.seed & 0xffff;
  const pts = s.ff ? range(180, (u) => heart(u * TAU, 40, 45)) : outline(r, passport);
  const d = path(pts), inner = path(pts.map(([x, y]) => [50 + (x - 50) * 0.84, 50 + (y - 50) * 0.84]));
  const rmin = Math.min(...pts.map(([x, y]) => Math.hypot(x - 50, y - 50)));
  const [paper, paperInk] = PAPER[Math.floor(r() * PAPER.length)], metal = METAL[Math.floor(r() * METAL.length)];
  const fill = t ? "url(#m)" : paper, ink = t === 1 ? metal[2] : t === 2 ? "#2b2350" : paperInk;
  const [g0, g1] = t === 1 ? metal : ["#fdfcff", "#d9d0ec"];
  const doodle = strokes(DOODLES[Math.floor(r() * DOODLES.length)](r), r);
  const dashed = r() < 0.5 ? `stroke-dasharray="3 2"` : "";
  const dt = new Date(s.date), date = `${String(dt.getUTCDate()).padStart(2, "0")} ${MONTHS[dt.getUTCMonth()]} ${String(dt.getUTCFullYear()).slice(2)}`;
  const text = (y: number, size: number, str: string, style = "") => `<text x="50" y="${y.toFixed(1)}" font-size="${size}" style="${style}">${str}</text>`;
  const frame = `<path class="l" d="${inner}" stroke-width="1.4" ${dashed}/>`;
  const mark = (x: number, y: number, k: number, o = 1) => `<path class="l" d="${doodle}" transform="translate(${x} ${y}) scale(${k})" stroke-width="${2.2 / k}" opacity="${o}"/>`;

  const body = s.ff
    ? frame + mark(28, 30, 0.44, 0.18) + `<rect x="14" y="44" width="72" height="12" fill="${ink}" clip-path="url(#c)"/>`
      + text(52.2, 5.4, "FAMILY &amp; FRIENDS", `fill:${fill};letter-spacing:.4px`) + text(70, 9, pad(s.id))
    : passport
      ? frame + mark(28, 28, 0.44, 0.16) + text(50 - rmin * 0.84 + 9, 6.5, ["ENTRADA", "VISITA", "CHEGADA", "ARRIVAL"][Math.floor(r() * 4)], "letter-spacing:2px")
        + text(55, 12, pad(s.id)) + text(50 + rmin * 0.84 - 5.5, 5.5, `${s.country ?? "??"} · ${date}`, "letter-spacing:.5px")
      : frame + `<path id="a" d="M${50 - rmin * 0.72} 50A${rmin * 0.72} ${rmin * 0.72} 0 0 1 ${50 + rmin * 0.72} 50" fill="none"/>`
        + `<text font-size="6.5" style="letter-spacing:1px"><textPath href="#a" startOffset="50%">• VISITANTE •</textPath></text>`
        + mark(35, 32, 0.3) + `<rect x="24" y="65" width="52" height="13" rx="1.5" fill="${ink}"/>` + text(74.4, 9, pad(s.id), `fill:${fill}`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <style>text{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;fill:${ink};text-anchor:middle}.l{fill:none;stroke:${ink};stroke-linecap:round;stroke-linejoin:round}</style>
    <defs>
      <clipPath id="c"><path d="${d}"/></clipPath>
      <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset=".5" stop-color="${g1}"/><stop offset="1" stop-color="${g0}"/></linearGradient>
      <filter id="s"><feGaussianBlur stdDeviation="1.2"/></filter>
      <filter id="w" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="3" seed="${fs}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -9 0 0 0 6.2" result="n"/><feComposite in="SourceGraphic" in2="n" operator="in"/></filter>
      <filter id="f" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="${fs + 1}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3 0 0 0 -1.5"/></filter>
      <filter id="g" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${fs + 2}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2 0 0 0 1.2"/></filter>
    </defs>
    <path d="${d}" transform="translate(.8 1.6)" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round" opacity=".35" filter="url(#s)"/>
    <path d="${d}" fill="#fbfaf5" stroke="#fbfaf5" stroke-width="7" stroke-linejoin="round"/>
    <path d="${d}" fill="${fill}"/>
    <g filter="url(#w)">${body}</g>
    <rect width="100" height="100" filter="url(#f)" clip-path="url(#c)" opacity=".35"/>
    <rect width="100" height="100" filter="url(#g)" clip-path="url(#c)" opacity=".12"/>
  </svg>`;
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${d}"/></svg>`;
  return { src: data(svg), mask: `url("${data(mask)}")`, rot: (r() - 0.5) * 40, t };
}

// Finish follows the pointer, like the visit card's holo.
function shine(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget, { offsetX, offsetY } = e.nativeEvent;
  el.style.setProperty("--mx", `${(offsetX / el.offsetWidth) * 100}%`);
  el.style.setProperty("--my", `${(offsetY / el.offsetHeight) * 100}%`);
}

// A visitor's sticker, centred on `style.left/top`. Drop inside any positioned box with a container (size is in cqi).
export default function StampSticker({ s, style, ghost }: { s: Stamp; style?: CSSProperties; ghost?: boolean }) {
  const { src, mask, rot, t } = art(s);
  return (
    <span data-stamp data-tier={t} className={`${styles.stamp} ${ghost ? styles.ghost : ""}`} style={{ ...style, rotate: `${rot}deg`, "--mask": mask } as CSSProperties} onPointerMove={shine}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={ghost ? "" : `Selo do visitante ${pad(s.id)} (${s.ff ? "Family & Friends" : TIERS[t]})`} draggable={false} />
      <span className={styles.finish} />
    </span>
  );
}
