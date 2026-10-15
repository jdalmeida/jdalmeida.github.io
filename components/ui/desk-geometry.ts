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
