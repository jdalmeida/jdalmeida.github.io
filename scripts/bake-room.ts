import sharp from "sharp";

// Light maps for the evidence room (components/ui/evidence-board.module.css), computed on the CPU once: the same
// recipe as the desk's WebGL light maps (desk-shaders.ts). The room is an open CSS 3D box; each face gets an image
// with its material and the pendant lamp's light already in it, so the browser only draws pictures.
//
// Room space is CSS px for a 1440×900 viewport (the camera's z = 0 plane), y down, z towards the viewer:
// back wall x ∈ [-360, 1800], y ∈ [-225, 1125] at z = -700; floor y = 1125; ceiling y = -225; sides x = -360 / 1800.
const D = 700, X0 = -360, X1 = 1800, Y0 = -225, Y1 = 1125;
// Pendant lamp hanging over the board, shade opening at LAMP, aimed down and back at the board.
const LAMP = [720, -40, -260] as const;
const AIM = norm([0, 1, -0.62]);
const out = new URL("../public/textures/baked/", import.meta.url);

type V3 = [number, number, number];
function norm(v: readonly number[]): V3 { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; }
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const hex = (h: string): V3 => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V3;

// Value noise and fbm, same shape as the GLSL one.
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), ux), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux), uy);
}
function fbm(x: number, y: number, o = 5) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * noise(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; a *= 0.5; } return s; }

// Lamp: a spot with a soft edge and inverse-square falloff, plus a dim bounce from the lit board and floor.
function light(p: V3, n: V3): number {
  const l = [LAMP[0] - p[0], LAMP[1] - p[1], LAMP[2] - p[2]], d2 = l[0] ** 2 + l[1] ** 2 + l[2] ** 2, d = Math.sqrt(d2);
  const L: V3 = [l[0] / d, l[1] / d, l[2] / d];
  const ndl = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
  const cone = smooth(Math.cos(62 * Math.PI / 180), Math.cos(26 * Math.PI / 180), -(L[0] * AIM[0] + L[1] * AIM[1] + L[2] * AIM[2]));
  const spill = 0.12; // the shade leaks a little light sideways
  return 1.7 * 9e5 / (d2 + 2e5) * ndl * (spill + (1 - spill) * cone);
}
// Ambient occlusion where two faces of the box meet: distances (px) to the neighbouring edges.
const ao = (...dist: number[]) => dist.reduce((a, x) => a * (0.45 + 0.55 * smooth(0, 260, x)), 1);
const tone = (x: number) => Math.sqrt(clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));

async function bake(name: string, w: number, h: number, at: (u: number, v: number) => { p: V3; n: V3; albedo: V3; occl: number }) {
  const px = Buffer.alloc(w * h * 3);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const { p, n, albedo, occl } = at((i + 0.5) / w, (j + 0.5) / h);
      const amb = 0.075 * occl, lit = light(p, n) * (0.55 + 0.45 * occl);
      for (let c = 0; c < 3; c++) px[(j * w + i) * 3 + c] = Math.round(255 * tone(albedo[c] ** 2 * (amb + lit) * [1, 0.86, 0.7][c] ** 0.5));
    }
  await sharp(px, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 86, effort: 5 }).toFile(new URL(`${name}.webp`, out).pathname);
}

// Aged plaster, a greenish institutional grey, with damp stains, trowel marks and fine grain.
function plaster(x: number, y: number): V3 {
  const base = hex("#78765f"), stain = fbm(x * 0.0022, y * 0.0022), trowel = fbm(x * 0.012 + y * 0.004, y * 0.012, 3), grain = noise(x * 0.9, y * 0.9);
  const k = 1 - 0.1 * smooth(0.5, 0.78, stain) - 0.08 * (trowel - 0.5) - 0.06 * (grain - 0.5);
  return [base[0] * k, base[1] * k * 1.01, base[2] * k * 0.98];
}
// Dark walnut floorboards running into the room.
function boards(x: number, z: number): V3 {
  const w = 150, b = Math.floor(x / w), s = hash(b, 3), seam = Math.min(x - b * w, (b + 1) * w - x);
  const joint = Math.floor((z + s * 900) / 900), js = hash(b, joint);
  const grain = fbm(x * 0.03 + s * 50, z * 0.0025 + js * 9, 4), ring = Math.sin((x - b * w) * 0.25 + grain * 9 + js * 6) * 0.5 + 0.5;
  const base = hex("#4a3324"), k = (0.82 + 0.3 * js) * (0.86 + 0.22 * grain) * (0.94 + 0.08 * ring);
  const along = (((z + s * 900) % 900) + 900) % 900, gap = 0.35 + 0.65 * smooth(0, 2.2, seam) * smooth(0, 2.2, Math.min(along, 900 - along));
  return [base[0] * k * gap, base[1] * k * gap, base[2] * k * gap];
}

// Back wall, with a stained-wood skirting board along the floor.
await bake("room-wall", 1600, 1000, (u, v) => {
  const x = mix(X0, X1, u), y = mix(Y0, Y1, v), skirting = Y1 - y < 70;
  const albedo: V3 = skirting ? (Y1 - y > 64 ? hex("#2a1c13") : hex("#3a271a")).map((c) => c * (0.9 + 0.2 * fbm(x * 0.02, y * 0.3, 3))) as V3 : plaster(x, y);
  return { p: [x, y, -D], n: [0, 0, 1], albedo, occl: ao(x - X0, X1 - x, y - Y0, Y1 - y) * (skirting ? 1 : 1 - 0.35 * smooth(0, 14, 14 - (Y1 - 70 - y))) };
});
await bake("room-floor", 1600, 520, (u, v) => {
  const x = mix(X0, X1, u), z = mix(-D, 0, v);
  return { p: [x, Y1, z], n: [0, -1, 0], albedo: boards(x - X0, z), occl: ao(x - X0, X1 - x, z + D) };
});
await bake("room-ceiling", 1600, 520, (u, v) => {
  const x = mix(X0, X1, u), z = mix(-D, 0, v), rose = Math.hypot(x - LAMP[0], z - LAMP[2]);
  const albedo = plaster(x + 3000, z).map((c) => c * 0.75) as V3;
  const disc = rose < 34 ? 0.6 : 1; // ceiling rose the lamp hangs from
  return { p: [x, Y0, z], n: [0, 1, 0], albedo: albedo.map((c) => c * disc) as V3, occl: ao(x - X0, X1 - x, z + D) };
});
await bake("room-side", 520, 1000, (u, v) => {
  const z = mix(-D, 0, u), y = mix(Y0, Y1, v), skirting = Y1 - y < 70;
  const albedo: V3 = skirting ? hex("#2f2016") : plaster(z + 7000, y);
  return { p: [X0, y, z], n: [1, 0, 0], albedo, occl: ao(z + D, y - Y0, Y1 - y) };
});

// The left wall is the right one seen in a mirror (the lamp hangs on the room's axis); CSS lays it out flipped.
await sharp(new URL("room-side.webp", out).pathname).flop().webp({ quality: 86, effort: 5 }).toFile(new URL("room-side-left.webp", out).pathname);

// Cork: pressed granules of different sizes and shades, a tileable jittered-grid Voronoi (one seed per grid cell,
// so each pixel checks only its 3×3 neighbourhood), each granule lit as a little bump, with dark flecks.
{
  const S = 512, G = 72, cell = S / G, px = Buffer.alloc(S * S * 3), light = hex("#c99d6c"), dark = hex("#8f5f37");
  const seed = (gx: number, gy: number) => { const x = ((gx % G) + G) % G, y = ((gy % G) + G) % G; return [gx * cell + hash(x, y + 0.5) * cell, gy * cell + hash(x + 0.5, y) * cell, hash(x * 1.3, y * 7.7)]; };
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const gx = Math.floor(i / cell), gy = Math.floor(j / cell);
      let d1 = 1e9, d2 = 1e9, t = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const [x, y, k] = seed(gx + ox, gy + oy), d = Math.hypot(i - x, j - y);
        if (d < d1) { d2 = d1; d1 = d; t = k; } else if (d < d2) d2 = d;
      }
      const edge = smooth(0, 1.4, d2 - d1), bump = 1 - 0.12 * clamp(d1 / cell);
      const fleck = hash(i * 7.1, j * 3.3) > 0.975 ? 0.55 : 1;
      for (let c = 0; c < 3; c++) px[(j * S + i) * 3 + c] = Math.round(255 * clamp(mix(dark[c], light[c], t) * (0.86 + 0.14 * edge) * bump * fleck * (0.94 + 0.12 * hash(i, j))));
    }
  await sharp(px, { raw: { width: S, height: S, channels: 3 } }).webp({ quality: 84, effort: 5 }).toFile(new URL("cork.webp", out).pathname);
}
console.log("Baked the evidence room light maps and cork.");
