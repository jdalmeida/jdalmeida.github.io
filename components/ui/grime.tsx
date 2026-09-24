"use client";

import type { CSSProperties } from "react";

type Props = {
  /** Overall strength, 0–1. */
  amount?: number;
  className?: string;
};

const layer: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", backgroundSize: "100% 100%" };

// Noise filters per layer. `seed="S"` is replaced by the real seed. Noise is in px, so it doesn't stretch with element size.
export type Layer = { blend?: CSSProperties["mixBlendMode"]; opacity?: number; filter: string; body?: (w: number, h: number, rand: () => number) => string };
export const LAYERS: Layer[] = [
  { // dirt: brown blotches + dark specks
    blend: "multiply", opacity: 0.30,
    filter: `<feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="5" seed="S"/>
      <feColorMatrix values="0 0 0 0 .42 0 0 0 0 .33 0 0 0 0 .22 4 0 0 0 -2.3" result="b"/>
      <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="S"/>
      <feColorMatrix values="0 0 0 0 .2 0 0 0 0 .15 0 0 0 0 .1 14 0 0 0 -10"/>
      <feMerge><feMergeNode in="b"/><feMergeNode/></feMerge>`,
  },
  { // grease: soft oily smears that catch light
    blend: "soft-light", opacity: 0.9,
    filter: `<feTurbulence type="fractalNoise" baseFrequency=".005 .008" numOctaves="3" seed="S"/>
      <feColorMatrix values="0 0 0 0 1 0 0 0 0 .96 0 0 0 0 .82 3.2 0 0 0 -1.5"/>
      <feGaussianBlur stdDeviation="3"/>`,
  },
  { // wear: scratches, drawn by scratches() below; displacement adds a slight hand-made wobble
    blend: "screen", opacity: 0.6,
    filter: `<feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="S"/>
      <feDisplacementMap in="SourceGraphic" scale="3"/>`,
    body: scratches,
  },
];

// Seeded PRNG (mulberry32): same seed -> same scratches.
export function rng(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Scratches come in clusters (one rub = several near-parallel marks of mixed length) plus a few loose strays.
function scratches(w: number, h: number, r: () => number) {
  let paths = "";
  const add = (x: number, y: number, ang: number, len: number) => {
    const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
    const bend = (r() - 0.5) * len * 0.15; // slight curve, perpendicular to the scratch
    const f = (n: number) => n.toFixed(1);
    paths += `<path d="M${f(x - dx)} ${f(y - dy)}Q${f(x - dy * bend / len * 2)} ${f(y + dx * bend / len * 2)} ${f(x + dx)} ${f(y + dy)}" stroke-width="${f(0.4 + r() * 0.9)}" stroke-opacity="${(0.25 + r() * 0.75).toFixed(2)}"/>`;
  };
  const clusters = 3 + Math.floor(r() * 6);
  for (let c = 0; c < clusters; c++) {
    const cx = r() * w, cy = r() * h, ang = r() * Math.PI, spread = 15 + r() * 90, len = 15 + r() * 130;
    for (let n = 3 + Math.floor(r() * 16); n--; )
      add(cx + (r() - 0.5) * spread * 2, cy + (r() - 0.5) * spread, ang + (r() - 0.5) * 0.3, len * (0.2 + r()));
  }
  for (let n = 8 + Math.floor(r() * 20); n--; ) add(r() * w, r() * h, r() * Math.PI, 4 + r() * 60 * r());
  return `<g fill="none" stroke="#ffffff40" stroke-linecap="round" filter="url(#f)">${paths}</g>`;
}

// One layer as an SVG data URL of w×h px (drawn into canvas textures by the desk's WebGL scene).
export function layerUrl(l: Layer, w: number, h: number, seed: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <filter id="f" x="0" y="0" width="100%" height="100%">${l.filter.replaceAll(`seed="S"`, `seed="${seed}"`)}</filter>
    ${l.body?.(w, h, rng(seed)) ?? `<rect width="100%" height="100%" filter="url(#f)"/>`}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Baked dirt + grease + wear overlay. Drop inside any `position: relative; overflow: hidden` box.
export default function Grime({ amount = 1, className }: Props) {
  const opacity = (o: number) => Math.min(1, o * amount);
  return (
    <div className={className} aria-hidden
      style={{ ...layer, boxShadow: `inset 0 0 18px rgb(58 42 26 / ${opacity(0.35)})` }}>
      {LAYERS.map((l, i) => <div key={i} style={{ ...layer, backgroundImage: `url(/textures/baked/${["dirt", "grease", "wear"][i]}.webp)`, mixBlendMode: l.blend, opacity: opacity(l.opacity ?? 1) }} />)}
    </div>
  );
}
