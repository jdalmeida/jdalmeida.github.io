"use client";

import { LAYERS, layerImage, rng, type Layer } from "@/components/ui/grime";

type Props = {
  /** Sticker image URLs, e.g. every file in /public/stickers. */
  srcs: string[];
  /** Fixed seed for a repeatable layout; omit for a new random layout per page load. */
  seed?: number;
  /** Average px between stickers. Lower = denser. */
  spacing?: number;
  className?: string;
};

// Sticker-only wear on top of the card's Grime layers: ink rubbed off to the white vinyl.
const RUB: Layer = {
  blend: "normal", opacity: 0.75,
  filter: `<feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="4" seed="S"/>
    <feColorMatrix values="0 0 0 0 .96 0 0 0 0 .95 0 0 0 0 .92 7 0 0 0 -4.3"/>`,
};
// Mask with small torn-out holes; `K` (higher = fewer holes) is replaced per sticker.
const HOLES = (k: number): Layer => ({
  filter: `<feTurbulence type="fractalNoise" baseFrequency=".16" numOctaves="2" seed="S"/>
    <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -14 0 0 0 ${k}"/>`,
});

const abs = "position:absolute;inset:0;";
const shape = (src: string) => `url('${src}') center / 100% 100% no-repeat`;

// One sticker: Grime + rub inside its shape, holes in its alpha, and maybe a peeled corner.
// Peel = cut the sticker along a fold line, then draw the cut-off part mirrored over the line as the backing paper.
function sticker(src: string, size: number, r: () => number) {
  const s = Math.floor(r() * 1e5), amount = 0.6 + r() * 0.8;
  // Colour variant so repeats don't read as copies: random hue/saturation, and some inverted so black stickers vary too.
  const tint = `${r() < 0.25 ? "invert(1) " : ""}hue-rotate(${Math.round(r() * 360)}deg) saturate(${(0.7 + r() * 0.9).toFixed(2)})`;
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="${abs}"><img src="${src}" alt="" draggable="false" style="${abs}width:100%;height:100%;filter:${tint}"></div>`;
  const body = wrap.firstElementChild as HTMLElement;

  [...LAYERS, RUB].forEach((l, i) => {
    const d = document.createElement("div");
    d.style.cssText = abs;
    Object.assign(d.style, {
      backgroundImage: layerImage(l, size, size, s + i * 101),
      mixBlendMode: l.blend, opacity: String(Math.min(1, (l.opacity ?? 1) * amount)), mask: shape(src),
    });
    body.append(d);
  });

  const masks = [layerImage(HOLES(12 - amount * 0.7), size, size, s + 7)];
  if (r() < 0.45) {
    const th = r() * Math.PI * 2, nx = Math.cos(th), ny = Math.sin(th);
    const dist = size * (0.2 + r() * 0.14); // fold line distance from the centre
    const a = (th * 180) / Math.PI + 90; // CSS gradient angle pointing along the fold normal
    const t = 50 + (dist / (size * (Math.abs(nx) + Math.abs(ny)))) * 100; // fold position on the gradient line, %
    masks.push(`linear-gradient(${a}deg, #000 ${t}%, transparent ${t}%)`);

    const flap = document.createElement("div");
    flap.style.cssText = `${abs}filter:drop-shadow(0 2px 3px rgb(0 0 0 / .5))`;
    flap.innerHTML = `<div style="${abs}
      background:linear-gradient(${a}deg, #9d978b ${t}%, #f3f0e9 100%);
      mask:${shape(src)}, linear-gradient(${a}deg, transparent ${t}%, #000 ${t}%);mask-composite:intersect;
      transform:matrix(${1 - 2 * nx * nx},${-2 * nx * ny},${-2 * nx * ny},${1 - 2 * ny * ny},${2 * dist * nx},${2 * dist * ny})"></div>`;
    wrap.append(flap);
  }
  Object.assign(body.style, { maskImage: masks.join(","), maskSize: "100% 100%", maskComposite: "intersect" });
  return wrap;
}

// Procedurally scatters stickers over its parent. Drop inside any `position: relative` box.
// Jittered grid: one slot per cell, nudged randomly, so stickers spread evenly without piling up.
// Built after mount (like Grime) so SSR and client markup match and the grid fits the element's px size.
export default function Stickers({ srcs, seed, spacing = 130, className }: Props) {
  const paint = (el: HTMLDivElement | null) => {
    if (!el || !srcs.length) return;
    const r = rng(seed ?? Math.floor(Math.random() * 1e5));
    const cols = Math.max(1, Math.round(el.offsetWidth / spacing));
    const rows = Math.max(1, Math.round(el.offsetHeight / spacing));
    let bag: string[] = [];
    const pick = () => {
      // Shuffled bag: no sticker repeats until all were used.
      if (!bag.length) bag = [...srcs].sort(() => r() - 0.5);
      return bag.pop()!;
    };

    el.replaceChildren();
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (r() < 0.1) continue; // empty cells keep it organic
        const size = Math.round(100 + r() * 110); // bigger than a cell, so neighbours overlap
        const s = sticker(pick(), size, r);
        // ponytail: positions in %, so a resize stretches the layout instead of re-rolling it.
        Object.assign(s.style, {
          position: "absolute",
          left: `${((x + r()) / cols) * 100}%`,
          top: `${((y + r()) / rows) * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          translate: "-50% -50%",
          rotate: `${(r() - 0.5) * 50}deg`,
        });
        el.append(s);
      }

    // Stop-motion entrance: each sticker is "slapped" on in a few held frames at 12fps, one after another in random order.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const F = 1000 / 12;
    [...el.children].sort(() => Math.random() - 0.5).forEach((s, i) => {
      const j = () => `${(Math.random() - 0.5) * 16}deg`;
      s.animate(
        // Per-keyframe steps(1): each pose is held, no tweening between them.
        [
          { transform: `scale(1.6) rotate(${j()})`, opacity: 0, easing: "steps(1, end)" },
          { transform: `scale(1.25) rotate(${j()})`, opacity: 1, easing: "steps(1, end)" },
          { transform: `scale(0.94) rotate(${j()})`, easing: "steps(1, end)" },
          { transform: "none" },
        ],
        { duration: F * 3, delay: 300 + i * F * 2, fill: "backwards" },
      );
    });
  };

  return <div ref={paint} className={className} aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} />;
}
