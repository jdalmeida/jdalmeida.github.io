// Mesh builders for the desk scene. Everything is in desk space: CSS px, origin at the tabletop centre, z up.
// Each vertex carries a colour (sRGB) and a material pair [specular, gloss] so one lit program draws every solid.
export type V = [number, number, number];
type M = [number, number];
type Vx = { p: V; n: V; c: V; t?: [number, number]; m?: M };
export type Buf = { p: number[]; n: number[]; c: number[]; t: number[]; m: number[] };
export const buf = (): Buf => ({ p: [], n: [], c: [], t: [], m: [] });
export const hex = (h: string): V => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V;
const DEG = Math.PI / 180;
const norm = (v: V): V => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Material presets: [specular, gloss exponent].
export const MAT = {
  matte: [0.04, 8], paint: [0.1, 36], glaze: [0.9, 160], coffee: [1.4, 400], metal: [0.9, 70],
  chrome: [1.6, 220], plastic: [0.4, 60], leaf: [0.12, 20], clay: [0.06, 10], paper: [0.05, 10], wood: [0.15, 30],
} satisfies Record<string, M>;

// Winding follows the vertex normals, so callers never care about vertex order.
function tri(b: Buf, v0: Vx, v1: Vx, v2: Vx) {
  const n = [0, 1, 2].map((i) => v0.n[i] + v1.n[i] + v2.n[i]) as V;
  const f = cross(sub(v1.p, v0.p), sub(v2.p, v0.p));
  if (f[0] * n[0] + f[1] * n[1] + f[2] * n[2] < 0) [v1, v2] = [v2, v1];
  for (const v of [v0, v1, v2]) {
    b.p.push(...v.p); b.n.push(...v.n); b.c.push(...v.c); b.t.push(...(v.t ?? [0, 0])); b.m.push(...(v.m ?? MAT.matte));
  }
}
const quad = (b: Buf, v0: Vx, v1: Vx, v2: Vx, v3: Vx) => { tri(b, v0, v1, v2); tri(b, v0, v2, v3); };

// Applies `f` (a rigid placement) to every vertex added since `from`; normals get the rotation only.
function place(b: Buf, from: number, f: (p: V, dir: boolean) => V) {
  for (let i = from * 3; i < b.p.length; i += 3) {
    const p = f([b.p[i], b.p[i + 1], b.p[i + 2]], false), n = f([b.n[i], b.n[i + 1], b.n[i + 2]], true);
    for (let k = 0; k < 3; k++) { b.p[i + k] = p[k]; b.n[i + k] = n[k]; }
  }
}
const mark = (b: Buf) => b.p.length / 3;

// Lays a mesh built around the z axis down along direction `angle` (degrees, in the desk plane), its axis `lift` above `at`.
function layDown(b: Buf, from: number, at: V, angle: number, lift: number, roll = 0) {
  const a = angle * DEG, d: V = [Math.cos(a), Math.sin(a), 0], s: V = [-Math.sin(a), Math.cos(a), 0];
  const cr = Math.cos(roll * DEG), sr = Math.sin(roll * DEG);
  place(b, from, ([x, y, z], dir) => {
    const u = x * cr - y * sr, w = x * sr + y * cr; // roll around the axis first
    const o = dir ? [0, 0, 0] : [at[0], at[1], at[2] + lift];
    return [o[0] + d[0] * z - s[0] * w, o[1] + d[1] * z - s[1] * w, o[2] + u]; // (up, -side, dir) keeps the basis right-handed
  });
}

// Surface of revolution around z. Profile points are [radius, z, colour, material?]; a repeated point is a crease,
// everything else is smooth-shaded. `flat` facets the sides (hex pencil), `ribs` darkens every other segment.
type P = [number, number, string, M?];
export function lathe(b: Buf, profile: P[], at: V, segments = 48, { flat = false, ribs = 1, phase = 0 } = {}) {
  const seg = profile.slice(0, -1).map((p, i) => {
    const q = profile[i + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    return len ? [(q[1] - p[1]) / len, (p[0] - q[0]) / len] : null;
  });
  // Normal of segment i at its end k (0 start, 1 end), averaged with the neighbour unless a crease separates them.
  const nAt = (i: number, k: number) => {
    const own = seg[i]!, other = seg[i + (k ? 1 : -1)];
    if (!other) return own;
    const l = Math.hypot(own[0] + other[0], own[1] + other[1]) || 1;
    return [(own[0] + other[0]) / l, (own[1] + other[1]) / l];
  };
  for (let i = 0; i < seg.length; i++) {
    if (!seg[i]) continue;
    const [r0, z0, c0, m0] = profile[i], [r1, z1, c1, m1] = profile[i + 1];
    const n0 = nAt(i, 0), n1 = nAt(i, 1);
    for (let j = 0; j < segments; j++) {
      const a0 = phase + j / segments * 2 * Math.PI, a1 = phase + (j + 1) / segments * 2 * Math.PI, mid = (a0 + a1) / 2;
      const shade = j % 2 && Math.abs(n0[1]) < 0.5 ? ribs : 1;
      const v = (r: number, z: number, a: number, c: string, n: number[], m?: M): Vx => {
        const na = flat ? mid : a;
        return { p: [at[0] + r * Math.cos(a), at[1] + r * Math.sin(a), at[2] + z], n: norm([n[0] * Math.cos(na), n[0] * Math.sin(na), n[1]]), c: hex(c).map((x) => x * shade) as V, m };
      };
      quad(b, v(r0, z0, a0, c0, n0, m0), v(r0, z0, a1, c0, n0, m0), v(r1, z1, a1, c1, n1, m1), v(r1, z1, a0, c1, n1, m1));
    }
  }
}

export function cuboid(b: Buf, [x0, y0, z0]: V, [x1, y1, z1]: V, color: string, m: M = MAT.matte) {
  const c = hex(color), v = (x: number, y: number, z: number, n: V): Vx => ({ p: [x, y, z], n, c, m });
  for (const s of [-1, 1]) {
    const x = s < 0 ? x0 : x1, y = s < 0 ? y0 : y1, z = s < 0 ? z0 : z1;
    quad(b, v(x, y0, z0, [s, 0, 0]), v(x, y1, z0, [s, 0, 0]), v(x, y1, z1, [s, 0, 0]), v(x, y0, z1, [s, 0, 0]));
    quad(b, v(x0, y, z0, [0, s, 0]), v(x1, y, z0, [0, s, 0]), v(x1, y, z1, [0, s, 0]), v(x0, y, z1, [0, s, 0]));
    quad(b, v(x0, y0, z, [0, 0, s]), v(x1, y0, z, [0, 0, s]), v(x1, y1, z, [0, 0, s]), v(x0, y1, z, [0, 0, s]));
  }
}

// Flat textured rectangle; `corners` go round the edge, uv follows them from (0,0) unless given.
export function plane(b: Buf, corners: V[], n: V, uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]) {
  const v = corners.map((p, i): Vx => ({ p, n, c: [1, 1, 1], t: uv[i] }));
  quad(b, v[0], v[1], v[2], v[3]);
}

// The tabletop: rounded outline, textured top, and an edge that rolls over a bullnose, drops and chamfers back under.
// The edge samples the same baked wood as the top at its own x/y, so long-side grain runs on over the edge.
export function tabletop(top: Buf, edge: Buf, W: number, H: number, T = 24) {
  const R = 14, outline: [number, number, number][] = []; // x, y, outward angle
  for (const [cx, cy, a] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]])
    for (let i = 0; i <= 8; i++) {
      const t = (a + i * 90 / 8) * DEG;
      outline.push([cx * (W / 2 - R) + R * Math.cos(t), cy * (H / 2 - R) + R * Math.sin(t), t]);
    }
  // Cross-section: [inset from the outline, z, outward normal weight, up normal weight].
  const B = 5, section: [number, number, number, number][] = [[B, 0, 0, 1]];
  for (let i = 1; i <= 5; i++) {
    const a = i / 5 * Math.PI / 2;
    section.push([B - B * Math.sin(a), -B + B * Math.cos(a), Math.sin(a), Math.cos(a)]);
  }
  section.push([0, -T + 3, 1, 0], [0, -T + 3, 0.7, -0.7], [3, -T, 0.7, -0.7], [3, -T, 0, -1]);
  const uvAt = (x: number, y: number): [number, number] => [x / W + 0.5, y / H + 0.5];
  const center: Vx = { p: [0, 0, 0], n: [0, 0, 1], c: [1, 1, 1], t: [0.5, 0.5] };
  outline.forEach(([x, y, a], i) => {
    const [x1, y1, a1] = outline[(i + 1) % outline.length];
    const inset = (px: number, py: number, ang: number, d: number) => [px - Math.cos(ang) * d, py - Math.sin(ang) * d];
    const [tx, ty] = inset(x, y, a, B), [tx1, ty1] = inset(x1, y1, a1, B);
    tri(top, center, { p: [tx, ty, 0], n: [0, 0, 1], c: [1, 1, 1], t: uvAt(tx, ty) }, { p: [tx1, ty1, 0], n: [0, 0, 1], c: [1, 1, 1], t: uvAt(tx1, ty1) });
    for (let k = 0; k < section.length - 1; k++) {
      const s0 = section[k], s1 = section[k + 1];
      if (s0[0] === s1[0] && s0[1] === s1[1]) continue;
      const vx = (px: number, py: number, ang: number, s: typeof s0): Vx => {
        const [ix, iy] = inset(px, py, ang, s[0]);
        const shade = 1 - 0.3 * Math.max(0, -s[1] / T); // the lower edge sees less of the room
        return { p: [ix, iy, s[1]], n: norm([Math.cos(ang) * s[2], Math.sin(ang) * s[2], s[3]]), c: [shade, shade, shade], t: uvAt(ix * 0.995, iy * 0.99) };
      };
      quad(edge, vx(x, y, a, s0), vx(x1, y1, a1, s0), vx(x1, y1, a1, s1), vx(x, y, a, s1));
    }
    const bottom = (px: number, py: number, ang: number): Vx => { const [ix, iy] = inset(px, py, ang, 3); return { p: [ix, iy, -T], n: [0, 0, -1], c: [0.4, 0.4, 0.4], t: uvAt(ix, iy) }; };
    tri(edge, { ...center, p: [0, 0, -T], n: [0, 0, -1], c: [0.4, 0.4, 0.4] }, bottom(x, y, a), bottom(x1, y1, a1));
  });
}

// Stoneware mug: glazed body with a rounded rim and foot, coffee with a crema ring, and a handle swept along half an ellipse.
// D is its diameter; it stands 0.85 D tall (desk-scene.tsx floats the mug's button at that height).
export function mug(b: Buf, [x, y]: [number, number], D: number) {
  const r = D / 2, h = D * 0.85, ri = r - D * 0.055, cz = D * 0.68, g = MAT.glaze;
  const body = "#d8cdb9", lip = "#ebe3d4", inside = "#e6ddcc";
  lathe(b, [
    [r * 0.78, 0.5, "#8d8170", MAT.matte], [r * 0.86, 0, "#a39682", MAT.matte], [r * 0.86, 0, "#a39682", MAT.matte], // unglazed foot ring
    [r * 0.94, D * 0.02, "#c9bea9", g], [r * 0.99, D * 0.07, body, g], [r * 1.01, h * 0.45, body, g],
    [r, h - D * 0.04, body, g], [r - D * 0.008, h - D * 0.008, lip, g], [r - D * 0.028, h, lip, g],
    [ri + D * 0.004, h - D * 0.012, lip, g], [ri, h - D * 0.04, inside, g], [ri - D * 0.004, cz + D * 0.03, "#b9ab92", g],
    [ri - D * 0.005, cz, "#7a6a55", g], [ri - D * 0.005, cz, "#5a361c", MAT.coffee],
    [ri * 0.93, cz, "#2e1a0c", MAT.coffee], [ri * 0.75, cz, "#1a0d05", MAT.coffee], [0, cz, "#140904", MAT.coffee],
  ], [x, y, 0], 64);
  // Handle: a tube of radius `tube` around half an ellipse in the xz plane, on the -x side.
  const cx = x - D * 0.56, hz = h * 0.5, rx = D * 0.19, rz = D * 0.27, tube = D * 0.05, c = hex(body);
  const ring = (a: number, f: number): Vx => {
    const len = Math.hypot(Math.cos(a) / rx, Math.sin(a) / rz), nx = Math.cos(a) / rx / len, nz = Math.sin(a) / rz / len;
    const n: V = [Math.cos(f) * nx, Math.sin(f) * 1.25, Math.cos(f) * nz]; // flattened tube: wider than deep
    return { p: [cx + rx * Math.cos(a) + tube * n[0], y + tube * n[1], hz + rz * Math.sin(a) + tube * n[2]], n: norm(n), c, m: g };
  };
  for (let i = 0; i < 28; i++)
    for (let k = 0; k < 16; k++) {
      const a0 = (75 + i * 7.5) * DEG, a1 = (75 + (i + 1) * 7.5) * DEG, f0 = k / 16 * 2 * Math.PI, f1 = (k + 1) / 16 * 2 * Math.PI;
      quad(b, ring(a0, f0), ring(a1, f0), ring(a1, f1), ring(a0, f1));
    }
}

// Hexagonal pencil lying on the desk, sharpened end towards -x of its own axis. L is the painted body, d its width.
export function pencil(b: Buf, at: V, angle: number, L: number, d: number) {
  const from = mark(b), r = d / 2, tip = d * 2.6, ferrule = d * 1.5, eraser = d * 1.1;
  const yellow: P[] = [[0, 0, "#3a3a3a", MAT.metal], [r * 0.18, tip * 0.18, "#3a3a3a", MAT.metal], [r * 0.18, tip * 0.18, "#e2c193", MAT.matte],
    [r, tip, "#d9b98c", MAT.matte], [r, tip, "#f2b929", MAT.paint], [r, tip + L, "#f2b929", MAT.paint], [r, tip + L, "#f2b929", MAT.paint], [0, tip + L, "#f2b929", MAT.paint]];
  lathe(b, yellow, [0, 0, -tip - L / 2], 6, { flat: true, phase: Math.PI / 6 });
  lathe(b, [[0, 0, "#c9c9c4", MAT.metal], [r * 1.04, 0, "#c9c9c4", MAT.metal], [r * 1.04, ferrule, "#e2e2dc", MAT.metal], [r * 0.98, ferrule, "#b7b7b0", MAT.metal]], [0, 0, L / 2], 16, { ribs: 0.75 });
  lathe(b, [[r * 0.98, ferrule, "#e0847f", MAT.matte], [r * 0.98, ferrule + eraser * 0.7, "#e0847f", MAT.matte], [r * 0.7, ferrule + eraser, "#d97772", MAT.matte], [0, ferrule + eraser, "#d97772", MAT.matte]], [0, 0, L / 2], 16);
  // Hex apothem rests on the desk.
  layDown(b, from, at, angle, r * Math.cos(Math.PI / 6), 0);
}

// Ballpoint: round barrel with a tapered tip, a chrome cap band and clip. Tip towards -x of its axis.
export function pen(b: Buf, at: V, angle: number, L: number, d: number) {
  const from = mark(b), r = d / 2, barrel = "#22314f", m: M = MAT.plastic;
  lathe(b, [[0, 0, "#9a9a96", MAT.chrome], [r * 0.25, L * 0.04, "#d8d8d2", MAT.chrome], [r * 0.6, L * 0.08, barrel, m], [r, L * 0.2, barrel, m],
    [r, L * 0.62, barrel, m], [r, L * 0.62, "#cfcfca", MAT.chrome], [r * 1.05, L * 0.66, "#cfcfca", MAT.chrome], [r * 1.05, L * 0.66, "#1a2540", m],
    [r * 1.05, L * 0.95, "#1a2540", m], [r * 0.7, L, "#1a2540", m], [0, L, "#1a2540", m]], [0, 0, -L / 2], 24);
  const clip = mark(b);
  cuboid(b, [r * 0.85, -r * 0.28, L * 0.62], [r * 1.35, r * 0.28, L * 0.97], "#d6d6d0", MAT.chrome);
  place(b, clip, ([x, y, z], dir) => [x, y, dir ? z : z - L / 2]);
  layDown(b, from, at, angle, r * 1.05, 70); // rolled so the clip sits off to one side, like a pen at rest
}

// Sticky note: a square of paper whose free corner curls up. Texture uv covers the square.
export function stickyNote(b: Buf, at: V, angle: number, s: number) {
  const N = 12, lift = (u: number, v: number) => s * 0.8 * Math.max(0, (u + v) / 2 - 0.62) ** 2; // bottom-right corner
  const a = angle * DEG, ca = Math.cos(a), sa = Math.sin(a);
  const pos = (u: number, v: number): V => {
    const lx = (u - 0.5) * s, ly = (0.5 - v) * s; // v grows downwards on the paper, like the texture
    return [at[0] + lx * ca - ly * sa, at[1] + lx * sa + ly * ca, at[2] + 0.6 + lift(u, v)];
  };
  const vx = (u: number, v: number): Vx => {
    const e = 1 / N, du = sub(pos(u + e, v), pos(u - e, v)), dv = sub(pos(u, v - e), pos(u, v + e));
    return { p: pos(u, v), n: norm(cross(du, dv)), c: [1, 1, 1], t: [u, 1 - v], m: MAT.paper };
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) quad(b, vx(i / N, j / N), vx((i + 1) / N, j / N), vx((i + 1) / N, (j + 1) / N), vx(i / N, (j + 1) / N));
}

// Deterministic jitter so shared vertices of a crumpled sphere move together.
const jitter = (p: V, seed: number) => {
  const s = Math.sin(p[0] * 12.9898 + p[1] * 78.233 + p[2] * 37.719 + seed) * 43758.5453;
  return s - Math.floor(s);
};
// Crumpled paper ball: a coarse sphere with jittered radius and faceted normals.
export function paperBall(b: Buf, r: number, at: V, color: string, seed: number) {
  const rings = 7, segs = 11, pt = (i: number, j: number): V => {
    const th = i / rings * Math.PI, ph = j / segs * 2 * Math.PI, u: V = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), -Math.cos(th)];
    const k = 1 + (jitter(i === 0 || i === rings ? [0, 0, u[2]] : u, seed) - 0.5) * 0.42;
    return [at[0] + u[0] * r * k, at[1] + u[1] * r * k, at[2] + u[2] * r * k];
  };
  const c = hex(color);
  const face = (p0: V, p1: V, p2: V) => {
    let n = norm(cross(sub(p1, p0), sub(p2, p0)));
    const out = sub(mix(mix(p0, p1, 0.5), p2, 1 / 3), at);
    if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = [-n[0], -n[1], -n[2]];
    const tone = 0.86 + jitter(n, seed + 1) * 0.14; // creases catch the light differently
    const cc = c.map((x) => x * tone) as V;
    tri(b, { p: p0, n, c: cc, m: MAT.paper }, { p: p1, n, c: cc, m: MAT.paper }, { p: p2, n, c: cc, m: MAT.paper });
  };
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < segs; j++) {
      const a = pt(i, j), bb = pt(i, j + 1), cc = pt(i + 1, j + 1), d = pt(i + 1, j);
      if (i > 0) face(a, bb, cc);
      if (i < rings - 1) face(a, cc, d);
    }
}

// Echeveria in a terracotta pot: leaves in a golden-angle rosette, cupped and blushing pink at the tips.
export function succulent(b: Buf, at: V, R: number, seed: number) {
  const ph = R * 1.05, soil = ph - R * 0.12;
  lathe(b, [
    [R * 0.72, 0, "#7d4128", MAT.clay], [R * 0.8, 0, "#8a4a2d", MAT.clay], [R * 0.8, 0, "#9c5532", MAT.clay], [R * 0.93, ph * 0.72, "#b5663e", MAT.clay],
    [R * 0.93, ph * 0.72, "#a85c37", MAT.clay], [R, ph * 0.75, "#bd6e44", MAT.clay], [R, ph, "#c47549", MAT.clay], [R * 0.92, ph, "#a85d3a", MAT.clay],
    [R * 0.88, soil + R * 0.04, "#6e3a22", MAT.clay], [R * 0.88, soil + R * 0.04, "#3a2a1e", MAT.matte], [0, soil, "#2c2017", MAT.matte],
  ], at, 40);
  const r = (k: number) => jitter([k, seed, 0.5], seed);
  const base = hex("#4f7a5e"), light = hex("#86ad8f"), blush = hex("#b8606f");
  const N = 26;
  for (let i = N - 1; i >= 0; i--) {
    const k = i / (N - 1); // 0 = centre, 1 = outermost
    const az = i * 137.508 * DEG + r(i) * 0.2, L = R * (0.32 + 0.62 * Math.pow(k, 0.7)) * (0.92 + r(i + 40) * 0.16);
    const el = (78 - 66 * Math.pow(k, 0.8)) * DEG, Wd = L * 0.42;
    const dir: V = [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
    const side: V = [-Math.sin(az), Math.cos(az), 0], up = norm(cross(dir, side));
    const root: V = [at[0] + Math.cos(az) * R * 0.06 * k, at[1] + Math.sin(az) * R * 0.06 * k, at[2] + soil + R * 0.05 * (1 - k)];
    const S = 7, T = 4;
    const pos = (s: number, t: number): V => {
      const w = Wd * Math.pow(s, 0.45) * Math.pow(1 - s, 0.55) * 1.6, droop = -L * 0.18 * k * s * s, cup = Math.abs(t) ** 2 * w * 0.45;
      return [0, 1, 2].map((j) => root[j] + dir[j] * s * L + side[j] * t * w + up[j] * (cup + droop + s * (1 - s) * L * 0.08)) as V;
    };
    const vx = (s: number, t: number, flip: number): Vx => {
      const e = 0.02, n = norm(cross(sub(pos(Math.min(1, s + e), t), pos(Math.max(0, s - e), t)), sub(pos(s, t + e), pos(s, t - e))));
      const nn = (n[2] < 0 ? -1 : 1) * flip;
      const c = mix(mix(base, light, (1 - Math.abs(t)) * 0.5 * (1 - k * 0.4)), blush, Math.max(0, s - 0.72) / 0.28 * 0.8);
      return { p: pos(s, t), n: [n[0] * nn, n[1] * nn, n[2] * nn], c: c.map((x) => x * (0.62 + 0.38 * (1 - (1 - k) * 0.5))) as V, m: MAT.leaf };
    };
    for (const flip of [1, -1])
      for (let si = 0; si < S; si++)
        for (let ti = -T; ti < T; ti++) {
          const s0 = si / S, s1 = (si + 1) / S, t0 = ti / T, t1 = (ti + 1) / T;
          quad(b, vx(s0, t0, flip), vx(s1, t0, flip), vx(s1, t1, flip), vx(s0, t1, flip));
        }
  }
}

// Wire-mesh waste bin: dark powder-coated rim and base, perforated wall drawn as ribs, open top.
export function bin(b: Buf, at: V, r: number, h: number) {
  const m = MAT.metal;
  lathe(b, [[r * 0.92, 0, "#1c1d1b", m], [r * 0.92, 0, "#2a2b28", m], [r, h * 0.06, "#2e2f2c", m], [r, h * 0.06, "#3a3c38", m], [r * 1.0, h * 0.94, "#4a4c47", m],
    [r * 1.0, h * 0.94, "#5b5d58", m], [r * 1.03, h * 0.97, "#6d6f69", m], [r * 1.02, h, "#83857e", m], [r * 0.96, h, "#5b5d58", m], [r * 0.95, h * 0.94, "#2a2b28", m],
    [r * 0.95, h * 0.94, "#1d1e1b", MAT.matte], [r * 0.9, 2, "#141513", MAT.matte], [r * 0.9, 2, "#141513", MAT.matte], [0, 2, "#111210", MAT.matte]], at, 64, { ribs: 0.55 });
}

// Ear clipping for a simple polygon without holes: index triples, counter-clockwise.
function triangulate(pts: [number, number][]) {
  const area = pts.reduce((a, [x, y], i) => { const [x1, y1] = pts[(i + 1) % pts.length]; return a + x * y1 - x1 * y; }, 0);
  const idx = pts.map((_, i) => i);
  if (area < 0) idx.reverse();
  const turn = (a: number[], b: number[], c: number[]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const out: number[][] = [];
  while (idx.length > 3) {
    const n = idx.length;
    const i = idx.findIndex((_, i) => {
      const [a, b, c] = [idx[(i + n - 1) % n], idx[i], idx[(i + 1) % n]], [A, B, C] = [pts[a], pts[b], pts[c]];
      const t = turn(A, B, C);
      if (Math.abs(t) < 1e-9) return (B[0] - A[0]) * (C[0] - B[0]) + (B[1] - A[1]) * (C[1] - B[1]) > 0; // a point on a straight run: drop it
      return t > 0 && !idx.some((k) => k !== a && k !== b && k !== c && turn(A, B, pts[k]) > 0 && turn(B, C, pts[k]) > 0 && turn(C, A, pts[k]) >= 0);
    });
    if (i < 0) break; // degenerate outline: leave the rest open rather than loop
    out.push([idx[(i + n - 1) % n], idx[i], idx[(i + 1) % n]]);
    idx.splice(i, 1);
  }
  if (idx.length === 3) out.push(idx);
  return out;
}

// A flat outline extruded from z0 to z1, its top edge rounded over by `bevel`; smooth sides, no bottom (it rests on something).
function slab(b: Buf, outline: [number, number][], z0: number, z1: number, bevel: number, color: string, m: M) {
  const c = hex(color), N = outline.length;
  const area = outline.reduce((a, [x, y], i) => { const [x1, y1] = outline[(i + 1) % N]; return a + x * y1 - x1 * y; }, 0), o = area < 0 ? -1 : 1;
  const edge = outline.map(([x, y], i) => { const [x1, y1] = outline[(i + 1) % N], l = Math.hypot(x1 - x, y1 - y) || 1; return [o * (y1 - y) / l, o * (x - x1) / l]; });
  const out = outline.map((_, i) => { const e0 = edge[(i + N - 1) % N], e1 = edge[i], l = Math.hypot(e0[0] + e1[0], e0[1] + e1[1]) || 1; return [(e0[0] + e1[0]) / l, (e0[1] + e1[1]) / l]; });
  const inner = outline.map(([x, y], i): [number, number] => [x - out[i][0] * bevel, y - out[i][1] * bevel]);
  for (const t of triangulate(inner)) tri(b, ...t.map((i): Vx => ({ p: [inner[i][0], inner[i][1], z1], n: [0, 0, 1], c, m })) as [Vx, Vx, Vx]);
  const v = (i: number, inset: boolean, z: number, up: number): Vx => {
    const [x, y] = inset ? inner[i] : outline[i];
    return { p: [x, y, z], n: norm([out[i][0] * (1 - up), out[i][1] * (1 - up), up]), c, m };
  };
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    quad(b, v(i, true, z1, 0.7), v(j, true, z1, 0.7), v(j, false, z1 - bevel, 0.25), v(i, false, z1 - bevel, 0.25));
    quad(b, v(i, false, z1 - bevel, 0.25), v(j, false, z1 - bevel, 0.25), v(j, false, z0, 0), v(i, false, z0, 0));
  }
}

// Closed Catmull-Rom curve through `pts`, n samples a span; a point given twice stays a sharp corner.
function smooth(pts: [number, number][], n = 4) {
  const L = pts.length, out: [number, number][] = [];
  for (let i = 0; i < L; i++) {
    const [p1, p2] = [pts[i], pts[(i + 1) % L]];
    let [p0, p3] = [pts[(i + L - 1) % L], pts[(i + 2) % L]];
    const same = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];
    if (same(p1, p2)) continue;
    if (same(p0, p1)) p0 = [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]]; // a corner: leave it along a straight tangent
    if (same(p2, p3)) p3 = [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const q = [0, 1].map((a) => 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3)) as [number, number];
      const last = out[out.length - 1];
      if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 1e-6) out.push(q);
    }
  }
  return out;
}

// Stands everything built since `from` (along z, from the origin) on `a`, pointing along `dir` (the jack plug, the cable, the trem arm).
function aim(b: Buf, from: number, a: V, dir: V) {
  const w = norm(dir), u = norm(cross(Math.abs(w[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], w)), v = cross(w, u);
  place(b, from, (p, d) => {
    const q = [0, 1, 2].map((k) => u[k] * p[0] + v[k] * p[1] + w[k] * p[2]) as V;
    return d ? q : [q[0] + a[0], q[1] + a[1], q[2] + a[2]];
  });
}
// A round rod from a to b.
function rod(b: Buf, a: V, e: V, r: number, color: string, m: M) {
  const from = mark(b), d = sub(e, a);
  lathe(b, [[r, 0, color, m], [r, Math.hypot(...d), color, m]], [0, 0, 0], 10);
  aim(b, from, a, d);
}

// A thin flat strip from a to b at height z, facing up (strings, the trem arm).
function ribbon(b: Buf, [x0, y0]: [number, number], [x1, y1]: [number, number], z: number, w: number, color: string, m: M) {
  const l = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l * w / 2, ny = (x1 - x0) / l * w / 2, c = hex(color);
  const v = (x: number, y: number): Vx => ({ p: [x, y, z], n: [0, 0, 1], c, m });
  quad(b, v(x0 + nx, y0 + ny), v(x1 + nx, y1 + ny), v(x1 - nx, y1 - ny), v(x0 - nx, y0 - ny));
}

// Turns, scales and moves everything built since `from` (local cm, z up from what it stands on) into desk space.
function settle(b: Buf, from: number, at: V, angle: number, s: number) {
  place(b, from, (p, dir) => { const q = turnAt(p, dir ? [0, 0, 0] : at, angle, dir ? 1 : s); return [q[0], q[1], (dir ? 0 : at[2]) + p[2] * (dir ? 1 : s)]; });
}
// A local point of something placed at `at`, turned `angle` degrees and scaled by s, in desk space (x, y only).
export function turnAt([x, y]: number[], at: number[], angle: number, s: number): [number, number] {
  const a = angle * DEG, c = Math.cos(a), sn = Math.sin(a);
  return [at[0] + (x * c - y * sn) * s, at[1] + (x * sn + y * c) * s];
}

// The guitar, in cm with the body centre at the origin, the neck axis on x = 0 and the neck along +y: a Stratocaster in
// satin black with a gloss black guard, maple neck, black hardware and HSS pickups, lying on its back. The outlines and
// part positions are traced from Landon Campbell's CC0 Stratocaster CAD model (printables.com/model/489337), so the
// body, guard, headstock and hardware sit where a real Strat's do. desk-textures.ts reads the body and neck outlines
// and the point where the cable meets the floor for its shadow and the cable on.
export const GUITAR = {
  thick: 4.4, nut: 56.56, scale: 64.8, length: 97.5, jack: [10, -28.5] as [number, number],
  body: [
    [0.59, -22.23], [4.53, -22.24], [6.53, -22.11], [8.49, -21.8], [9.78, -21.41], [11.28, -20.76], [12.04, -20.34], [13.22, -19.45],
    [13.81, -18.86], [14.37, -18.13], [14.76, -17.54], [15.2, -16.58], [15.46, -15.74], [15.67, -14.15], [15.67, -12.33], [15.54, -10.65],
    [15.44, -9.73], [15.23, -8.69], [14.86, -7.39], [13.98, -5.06], [11.48, 0.21], [11.15, 1.15], [11, 2.05], [11.05, 3.24], [11.33, 4.54],
    [12.89, 8.43], [13.31, 10.01], [13.49, 11.38], [13.5, 12.7], [13.41, 13.52], [13.27, 14.23], [13.13, 14.69], [12.85, 15.3], [12.57, 15.72],
    [12.23, 16.08], [11.82, 16.3], [11.38, 16.38], [11.04, 16.38], [10.58, 16.29], [10.15, 16.02], [9.82, 15.53], [9.61, 14.94], [9.32, 13.63],
    [9, 12.62], [8.6, 11.87], [8.14, 11.33], [7.38, 10.87], [6.52, 10.63], [5.03, 10.46], [4.54, 10.5], [4.06, 10.61], [3.51, 10.89],
    [3.14, 11.17], [2.84, 11.47], [2.72, 11.68], [2.69, 16.17], [2.64, 16.37], [2.5, 16.53], [2.18, 16.64], [-2.54, 16.63], [-2.83, 16.45],
    [-3.25, 15.8], [-3.64, 15.29], [-4.24, 14.94], [-4.74, 14.84], [-5.36, 14.87], [-6.06, 15.02], [-6.42, 15.16], [-7.09, 15.62],
    [-7.83, 16.35], [-8.24, 16.79], [-8.6, 17.41], [-8.8, 18.28], [-8.94, 20.72], [-9.09, 21.32], [-9.29, 21.74], [-9.67, 22.19],
    [-9.98, 22.38], [-10.39, 22.46], [-10.84, 22.39], [-11.41, 22.13], [-11.85, 21.77], [-12.26, 21.28], [-12.64, 20.61], [-13.04, 19.39],
    [-13.32, 17.59], [-13.38, 17], [-13.38, 15.75], [-13.22, 14.51], [-12.89, 12.89], [-12.25, 10.4], [-11.05, 6.21], [-10.91, 4.75],
    [-11.09, 2.96], [-11.26, 2.18], [-11.51, 1.36], [-12.54, -0.91], [-14.52, -5.66], [-14.89, -6.74], [-15.15, -7.73], [-15.38, -9.33],
    [-15.38, -10.75], [-15.22, -12.32], [-14.81, -14.68], [-14.6, -15.32], [-14.05, -16.47], [-13.41, -17.43], [-12.73, -18.27], [-11.95, -19],
    [-11.08, -19.67], [-9.78, -20.55], [-8.88, -21.05], [-7.45, -21.6], [-6.13, -21.87], [-4.79, -22.06], [-2.57, -22.16], [0.57, -22.22]] as [number, number][],
  guard: [
    [12.97, -13.89], [13.63, -13.89], [14, -13.79], [14.29, -13.58], [14.5, -13.16], [14.6, -12.11], [14.47, -10.49], [14.29, -9.32],
    [13.94, -8], [13.14, -5.82], [12.44, -4.2], [11, -1.31], [10.31, 0.32], [10.01, 1.4], [9.93, 2.14], [10.01, 3.48], [10.31, 4.81],
    [11.78, 8.48], [12.19, 9.85], [12.32, 10.47], [12.45, 11.72], [12.39, 13.18], [12.21, 14.12], [12, 14.64], [11.73, 15.09], [11.56, 15.25],
    [11.36, 15.32], [11.03, 15.31], [10.84, 15.22], [10.64, 14.7], [10.29, 13.17], [9.92, 12.07], [9.33, 11.08], [8.96, 10.63], [8.67, 10.39],
    [8.15, 10.06], [7.16, 9.68], [6.18, 9.48], [5.08, 9.4], [4.57, 9.43], [3.87, 9.56], [3.39, 9.73], [2.85, 10.04], [2.8, 8.66], [2.61, 8.38],
    [2.26, 8.23], [-2.16, 8.23], [-2.46, 8.28], [-2.72, 8.47], [-2.85, 8.77], [-2.8, 11.41], [-2.85, 11.64], [-3.29, 11.75], [-5.11, 11.7],
    [-5.72, 11.74], [-6.57, 12], [-7.3, 12.39], [-7.78, 12.58], [-8.03, 12.62], [-8.23, 12.54], [-8.38, 12.27], [-8.4, 11.84], [-8.36, 11.51],
    [-8.2, 10.96], [-7.87, 10.37], [-6.67, 8.82], [-6.37, 8.32], [-6.11, 7.6], [-5.9, 6.81], [-5.61, 5.16], [-5.43, 3.44], [-5.43, 2.59],
    [-5.48, 1.97], [-5.7, 0.92], [-6.68, -2.08], [-7.48, -4.01], [-7.66, -4.65], [-7.77, -5.42], [-7.74, -6.3], [-7.5, -7.36], [-7.2, -7.99],
    [-6.86, -8.47], [-6.3, -8.99], [-5.31, -9.62], [-4.93, -9.75], [-4.27, -9.77], [-4.05, -9.73], [-4, -9.66], [-3.97, -8.16], [-3.85, -7.96],
    [-3.62, -7.84], [3.62, -7.84], [3.85, -7.99], [3.96, -8.22], [3.98, -9.61], [4.01, -9.75], [4.98, -9.8], [6.1, -9.94], [7.24, -10.22],
    [8.21, -10.56], [8.55, -10.73], [9.32, -11.26], [11.97, -13.47], [12.45, -13.74], [12.95, -13.88]] as [number, number][],
  neck: [
    [-2.38, 8.87], [2.33, 8.86], [2.67, 9.04], [2.78, 9.23], [2.84, 9.42], [2.07, 57.69], [2.36, 59.02], [2.54, 59.47], [2.76, 59.85],
    [3.66, 60.85], [4.21, 61.27], [4.64, 61.45], [4.73, 61.61], [4.71, 62.26], [4.26, 64.63], [3.52, 67.47], [3.28, 69.15], [3.27, 69.57],
    [3.33, 69.79], [3.48, 70], [4.46, 70.6], [4.77, 70.87], [4.97, 71.12], [5.33, 71.78], [5.47, 72.49], [5.47, 73.04], [5.37, 73.55],
    [5.11, 74.13], [4.89, 74.42], [4.19, 74.99], [3.8, 75.15], [3.2, 75.28], [2.69, 75.27], [2.22, 75.14], [1.36, 74.75], [1.07, 74.47],
    [0.72, 73.8], [-3.39, 60.28], [-3.6, 59.31], [-3.6, 58.92], [-3.52, 58.7], [-3.38, 58.55], [-2.66, 58.06], [-2.41, 57.84], [-2.3, 57.65],
    [-2.11, 56.94], [-2.88, 10.09], [-2.88, 9.52], [-2.82, 9.25], [-2.66, 9.01], [-2.4, 8.87]] as [number, number][],
  board: [
    [-2.4, 8.23], [2.31, 8.23], [2.49, 8.28], [2.66, 8.4], [2.78, 8.55], [2.85, 8.76], [2.08, 57.28], [2.05, 57.7], [1.94, 57.77],
    [-1.96, 57.77], [-2.06, 57.75], [-2.09, 57.66], [-2.87, 10.48], [-2.86, 8.69], [-2.72, 8.43], [-2.58, 8.3], [-2.42, 8.24]] as [number, number][],
  bridge: [
    [-3.98, -12.1], [4.94, -12.12], [5, -12.08], [5.01, -11.99], [5, -9.9], [4.92, -9.83], [4.13, -9.83], [4.01, -9.79], [3.98, -8.18],
    [3.84, -7.94], [3.61, -7.81], [-3.64, -7.81], [-3.89, -7.97], [-4.01, -8.22], [-3.99, -12.09]] as [number, number][],
  jackPlate: [
    [9.24, -19.96], [10.1, -19.97], [10.66, -19.8], [11.01, -19.55], [11.21, -19.25], [11.31, -19], [11.35, -18.71], [11.32, -18.27],
    [11.09, -17.54], [10.71, -16.84], [10.13, -16.07], [9.28, -15.22], [8.46, -14.57], [7.72, -14.09], [6.51, -13.5], [5.52, -13.19],
    [4.98, -13.12], [4.16, -13.17], [3.87, -13.26], [3.53, -13.47], [3.26, -13.82], [3.14, -14.15], [3.12, -14.71], [3.19, -15.04],
    [3.35, -15.5], [3.7, -16.15], [4.41, -17.1], [5.24, -17.92], [5.98, -18.51], [6.72, -18.99], [8.05, -19.64], [9.22, -19.96]] as [number, number][],
  coil: [
    [-2.83, -0.17], [2.82, -0.17], [3.15, -0.02], [3.4, 0.23], [3.55, 0.58], [3.56, 0.92], [3.43, 1.27], [3.28, 1.47], [3.03, 1.64],
    [2.68, 1.74], [-2.73, 1.73], [-3.03, 1.65], [-3.24, 1.52], [-3.44, 1.29], [-3.54, 1.09], [-3.58, 0.91], [-3.57, 0.55], [-3.41, 0.21],
    [-3.19, -0.02], [-2.85, -0.16]] as [number, number][],
  coil2: [
    [2.23, -5.99], [2.71, -5.99], [3.06, -5.84], [3.3, -5.58], [3.42, -5.33], [3.45, -4.92], [3.36, -4.61], [3.18, -4.37], [2.97, -4.21],
    [2.81, -4.13], [-2.63, -3.25], [-2.88, -3.28], [-3.23, -3.43], [-3.44, -3.65], [-3.58, -3.93], [-3.61, -4.07], [-3.62, -4.31],
    [-3.53, -4.63], [-3.3, -4.95], [-2.98, -5.13], [2.21, -5.98]] as [number, number][],
};
export function guitar(b: Buf, at: V, angle: number, s: number) {
  const from = mark(b), { thick: T, nut, scale } = GUITAR, top = T + 0.64, G = T + 0.32, black = "#111112", hw: M = [0.7, 60], gloss: M = [0.9, 140];
  slab(b, GUITAR.body, 0, T, 0.9, "#19191a", [0.1, 14]);
  slab(b, GUITAR.guard, T, G, 0.12, "#08080a", gloss);
  // Maple neck and headstock (the headstock face is flush with the body top), the board on it with black dots,
  // 22 frets and a bone nut; tuners on a slant up the bass side, their keys out past the edge.
  const maple = "#dcb26c", width = (y: number) => 5.72 + (4.17 - 5.72) * (y - 8.8) / (nut - 8.8);
  slab(b, GUITAR.neck, T - 1.9, T, 0.3, maple, [0.45, 60]);
  slab(b, GUITAR.board, T, top, 0.15, maple, [0.45, 60]);
  ribbon(b, [1.3, nut + 5.6], [2.1, nut + 10.6], T + 0.01, 0.45, "#2a2a2a", MAT.paint); // the decal, from afar
  cuboid(b, [-2.08, nut, T], [2.08, nut + 0.31, T + 1], "#efe8d6", MAT.plastic);
  const fret = (n: number) => nut - scale * (1 - 2 ** (-n / 12));
  for (let n = 1; n <= 22; n++) { const y = fret(n), w = width(y) / 2 - 0.1; cuboid(b, [-w, y - 0.12, top], [w, y + 0.12, top + 0.15], "#cfcfc8", MAT.metal); }
  const dot = (x: number, y: number, z: number, r: number, color: string, m: M = MAT.plastic) => lathe(b, [[r, 0, color, m], [r, 0.06, color, m], [0, 0.06, color, m]], [x, y, z], 14);
  for (const n of [3, 5, 7, 9, 15, 17, 19, 21]) dot(0, (fret(n) + fret(n - 1)) / 2, top, 0.3, black);
  for (const x of [-1.1, 1.1]) dot(x, (fret(12) + fret(11)) / 2, top, 0.3, black);
  const posts: [number, number][] = [[-2.1, 60.55], [-1.38, 62.91], [-0.67, 65.27], [0.04, 67.63], [0.75, 69.99], [1.47, 72.34]];
  for (const [x, y] of posts) {
    lathe(b, [[0.5, 0, black, hw], [0.5, 0.2, black, hw], [0.3, 0.25, black, hw], [0.3, 0.8, black, hw], [0, 0.8, black, hw]], [x, y, T], 14);
    cuboid(b, [x - 1.6, y - 0.15, T - 1.1], [x - 0.5, y + 0.15, T - 0.8], black, hw);
    slab(b, smooth([[x - 1.5, y], [x - 1.95, y - 0.7], [x - 2.4, y], [x - 1.95, y + 0.7]], 3), T - 1.3, T - 0.6, 0.15, black, hw);
  }
  cuboid(b, [0, 62.8, T], [1.4, 63.3, T + 0.5], black, hw); // string tree over B and E
  // Pickups: black single coils at the neck and middle, a black humbucker at the bridge, with steel poles.
  const pole = (y: number, z: number, r: number) => { for (let i = 0; i < 6; i++) dot(-2.62 + i * 1.048, y, z, r, "#a9a9a3", MAT.metal); };
  for (const dy of [5.36, 0]) { slab(b, GUITAR.coil.map(([x, y]): [number, number] => [x, y + dy]), G, T + 0.95, 0.3, black, MAT.plastic); pole(0.71 + dy, T + 0.95, 0.2); }
  slab(b, [[-3.5, -6.6], [3.5, -6.6], [3.5, -2.8], [-3.5, -2.8]], G, T + 0.9, 0.25, black, MAT.plastic);
  pole(-3.75, T + 0.9, 0.22); pole(-5.65, T + 0.9, 0.18);
  // Black trem: plate, six saddles (their front edge is the scale length from the nut), the arm.
  slab(b, GUITAR.bridge, T, T + 0.2, 0.05, black, hw);
  [0.25, 0.35, 0.2, 0.1, 0.2, 0].forEach((dy, i) => { const x = -2.62 + i * 1.048; cuboid(b, [x - 0.45, -10.7 - dy, T + 0.2], [x + 0.45, nut - scale + 0.25 - dy, T + 0.95], black, hw); });
  const arm: V[] = [[3.6, -10.6, T], [3.6, -10.6, T + 1.3], [9.6, -19.4, T + 1.9]];
  rod(b, arm[0], arm[1], 0.25, black, hw);
  rod(b, arm[1], arm[2], 0.25, black, hw);
  const tip = mark(b);
  lathe(b, [[0.45, 0, black, MAT.plastic], [0.45, 2, black, MAT.plastic], [0.3, 2.3, black, MAT.plastic], [0, 2.35, black, MAT.plastic]], [0, 0, 0], 12);
  aim(b, tip, arm[2], sub(arm[2], arm[1]));
  // Volume, two tones and the five-way switch: a lever out of its slot with a black tip.
  for (const [x, y] of [[5.88, -5.83], [8.7, -6.87], [10.96, -9.05]])
    lathe(b, [[0.95, 0, black, MAT.plastic], [0.95, 0.2, black, MAT.plastic], [0.8, 0.3, black, MAT.plastic], [0.75, 1, black, MAT.plastic], [0.62, 1.2, black, MAT.plastic], [0, 1.25, black, MAT.plastic]], [x, y, G], 20, { ribs: 0.85 });
  ribbon(b, [7.1, -4.3], [8.7, -2.3], G + 0.01, 0.3, "#000000", MAT.matte);
  rod(b, [7.9, -3.3, G], [8.08, -3.06, G + 1.7], 0.12, "#2a2a2a", hw);
  const knob = mark(b);
  lathe(b, [[0.35, 0, black, MAT.plastic], [0.35, 0.8, black, MAT.plastic], [0.2, 1, black, MAT.plastic], [0, 1, black, MAT.plastic]], [0, 0, 0], 12);
  aim(b, knob, [8.08, -3.06, G + 1.5], [0.1, 0.14, 1]);
  // Strings: saddles to nut over the frets, then fanning out to the posts.
  for (let i = 0; i < 6; i++) {
    const w = 0.09 + (5 - i) * 0.025, c = i < 3 ? "#b9b4a6" : "#d8d8d2";
    ribbon(b, [-2.62 + i * 1.048, nut - scale], [-1.75 + i * 0.7, nut], top + 0.3, w, c, MAT.chrome);
    ribbon(b, [-1.75 + i * 0.7, nut], posts[i], T + 0.6, w, c, MAT.chrome);
  }
  // Football jack in its cup on the lower bout; the plug leans out towards the tail and its cable drops to the floor.
  slab(b, GUITAR.jackPlate, T - 0.05, T + 0.25, 0.1, black, hw);
  const out: V = [0.27, -0.83, 0.5], base: V = [7.2, -16.78, T], plug = mark(b);
  lathe(b, [[0.5, 0, "#b8b8b2", MAT.chrome], [0.5, 0.4, "#b8b8b2", MAT.chrome], [0.75, 0.4, "#1c1c1c", MAT.plastic], [0.75, 3.2, "#1c1c1c", MAT.plastic], [0.38, 4, "#141414", MAT.matte], [0, 4, "#141414", MAT.matte]], [0, 0, 0], 16);
  aim(b, plug, base, out);
  const p0: V = [base[0] + out[0] * 4, base[1] + out[1] * 4, base[2] + out[2] * 4], p1: V = [p0[0] + out[0] * 3, p0[1] + out[1] * 3, p0[2] + 1.5], p2: V = [...GUITAR.jack, 0.35];
  const bez = (t: number) => mix(mix(p0, p1, t), mix(p1, p2, t), t);
  for (let i = 0; i < 8; i++) rod(b, bez(i / 8), bez(Math.min(1, (i + 1.15) / 8)), 0.35, "#141413", MAT.plastic);
  settle(b, from, at, angle, s);
}

// Small practice combo (the Machintec Maxx 15): black tolex box, grille in front with the logo, a control panel along the
// top front with five knobs, the input jack and a green LED, a strap handle and corner protectors. Front faces -y.
export function amp(b: Buf, [x, y, z]: V, w: number, d: number, h: number) {
  const tolex: M = [0.12, 16], X0 = x - w / 2, X1 = x + w / 2, Y0 = y - d / 2, Y1 = y + d / 2, Z1 = z + h, e = w * 0.03;
  cuboid(b, [X0, Y0, z], [X1, Y1, Z1], "#1b1b1b", tolex);
  cuboid(b, [X0 + e, Y0 - e * 0.3, z + e], [X1 - e, Y0, z + h * 0.74], "#0c0c0c", MAT.matte);
  cuboid(b, [x - w * 0.24, Y0 - e * 0.5, z + h * 0.36], [x + w * 0.24, Y0 - e * 0.3, z + h * 0.4], "#e9e7e2", MAT.paint);
  cuboid(b, [X0 + e, Y0 + e * 0.4, Z1], [X1 - e, Y0 + d * 0.3, Z1 + e * 0.15], "#101010", MAT.plastic);
  const k = w * 0.032;
  for (let i = 0; i < 5; i++)
    lathe(b, [[k, 0, "#0e0e0e", MAT.plastic], [k, k * 1.1, "#0e0e0e", MAT.plastic], [k * 0.85, k * 1.35, "#3a3a3a", MAT.plastic], [0, k * 1.4, "#3a3a3a", MAT.plastic]],
      [X0 + w * (0.24 + i * 0.1), Y0 + d * 0.15, Z1], 18, { ribs: 0.75 });
  lathe(b, [[k * 0.7, 0, "#a5a5a0", MAT.chrome], [k * 0.7, k * 0.3, "#a5a5a0", MAT.chrome], [k * 0.4, k * 0.3, "#050505", MAT.matte], [0, k * 0.3, "#050505", MAT.matte]], [X0 + w * 0.1, Y0 + d * 0.15, Z1], 18);
  lathe(b, [[k * 0.25, 0, "#6cff8c", [1, 80]], [0, k * 0.3, "#b9ffc8", [1, 80]]], [X0 + w * 0.76, Y0 + d * 0.15, Z1], 10);
  cuboid(b, [X1 - w * 0.13, Y0 + d * 0.08, Z1], [X1 - w * 0.07, Y0 + d * 0.22, Z1 + k * 0.5], "#0a0a0a", MAT.plastic);
  // Handle: a strap between two mounts.
  for (const s of [-1, 1]) cuboid(b, [x + s * w * 0.2 - e, y + d * 0.05, Z1], [x + s * w * 0.2 + e, y + d * 0.35, Z1 + e * 0.8], "#121212", MAT.plastic);
  cuboid(b, [x - w * 0.2, y + d * 0.1, Z1 + e * 0.6], [x + w * 0.2, y + d * 0.3, Z1 + e * 1.4], "#151515", [0.2, 24]);
  for (const cx of [X0, X1]) for (const cy of [Y0, Y1]) for (const [z0, z1] of [[z, z + 2 * e], [Z1 - e, Z1 + e * 0.4]])
    cuboid(b, [cx - e, cy - e, z0], [cx + e, cy + e, z1], "#262626", [0.3, 30]);
  // The guitar's cable comes in at the jack and drops over the front.
  cuboid(b, [X0 + w * 0.1 - k * 0.4, Y0 + d * 0.15 - k * 0.4, Z1], [X0 + w * 0.1 + k * 0.4, Y0 + d * 0.15 + k * 0.4, Z1 + k * 2], "#1d1d1d", MAT.plastic);
  ribbon(b, [X0 + w * 0.1, Y0 + d * 0.15], [X0 + w * 0.1, Y0 - e], Z1 + k * 0.8, 5, "#141413", MAT.plastic);
  cuboid(b, [X0 + w * 0.1 - 2.5, Y0 - e - 5, z], [X0 + w * 0.1 + 2.5, Y0 - e, Z1 + k * 0.8], "#141413", MAT.plastic);
}
