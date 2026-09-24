import { Camera, Geometry, Mesh, Program, Renderer, Texture, Transform, Vec3 } from "ogl";
import { coffeeSpot, cupAt, paintDesk } from "./desk-textures";
import { rng } from "./grime";

// The desk's furniture, cup, bin and floor in one WebGL canvas, placed exactly under the CSS-transformed `.desk`
// (which keeps only the interactive notebook and credentials). Units are CSS px; the camera mirrors `.space`'s
// `perspective: 1400px`, so a point at z = 0 lands on the same pixel in both.
export type DeskView = {
  width: number; height: number; // stage
  desk: number; leg: number; mobile: boolean;
  entry: number; pitch: number; turn: number; floor: number;
};

const PERSPECTIVE = 1400;
const DEG = Math.PI / 180;
const X = new Vec3(1, 0, 0), Z = new Vec3(0, 0, 1), shift = new Vec3();

// Lit meshes use vertex colours and one fixed light in desk space, like the old baked CSS shading. Output is premultiplied.
const LIT = {
  vertex: `attribute vec3 position; attribute vec3 normal; attribute vec3 color;
    uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec3 vColor;
    void main() {
      vColor = color * (.72 + .42 * max(dot(normal, normalize(vec3(-.35, .45, .82))), 0.));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }`,
  fragment: `precision mediump float; uniform float uOpacity; varying vec3 vColor;
    void main() { gl_FragColor = vec4(vColor, 1.) * uOpacity; }`,
};
const TEX = {
  vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragment: `precision mediump float; uniform sampler2D tMap; uniform float uOpacity; varying vec2 vUv;
    void main() { gl_FragColor = texture2D(tMap, vUv) * uOpacity; }`,
};

type V = [number, number, number];
type Vx = { p: V; n: V; c: V; t?: [number, number] };
type Buf = { p: number[]; n: number[]; c: number[]; t: number[] };
const buf = (): Buf => ({ p: [], n: [], c: [], t: [] });
const hex = (h: string): V => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V;

// Winding follows the vertex normals, so callers never care about vertex order.
function tri(b: Buf, v0: Vx, v1: Vx, v2: Vx) {
  const [a, c, d] = [v0.p, v1.p, v2.p];
  const e = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], f = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const cross = [e[1] * f[2] - e[2] * f[1], e[2] * f[0] - e[0] * f[2], e[0] * f[1] - e[1] * f[0]];
  const n = [0, 1, 2].map((i) => v0.n[i] + v1.n[i] + v2.n[i]);
  if (cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2] < 0) [v1, v2] = [v2, v1];
  for (const v of [v0, v1, v2]) { b.p.push(...v.p); b.n.push(...v.n); b.c.push(...v.c); b.t.push(...(v.t ?? [0, 0])); }
}
const quad = (b: Buf, v0: Vx, v1: Vx, v2: Vx, v3: Vx) => { tri(b, v0, v1, v2); tri(b, v0, v2, v3); };

// Surface of revolution around z; profile is [radius, z, colour]. Each profile step gets its own normal, so rims stay crisp.
function lathe(b: Buf, profile: [number, number, string][], at: V, segments = 32, ribs = 1) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, z0, c0] = profile[i], [r1, z1, c1] = profile[i + 1];
    const len = Math.hypot(r1 - r0, z1 - z0) || 1, nr = (z1 - z0) / len, nz = (r0 - r1) / len;
    for (let j = 0; j < segments; j++) {
      const a0 = j / segments * 2 * Math.PI, a1 = (j + 1) / segments * 2 * Math.PI, shade = j % 2 && !nz ? ribs : 1; // ribs on walls only
      const v = (r: number, z: number, a: number, c: string): Vx => ({
        p: [at[0] + r * Math.cos(a), at[1] + r * Math.sin(a), at[2] + z], n: [nr * Math.cos(a), nr * Math.sin(a), nz], c: hex(c).map((x) => x * shade) as V,
      });
      quad(b, v(r0, z0, a0, c0), v(r0, z0, a1, c0), v(r1, z1, a1, c1), v(r1, z1, a0, c1));
    }
  }
}
const sphere = (b: Buf, r: number, at: V, color: string) =>
  lathe(b, Array.from({ length: 9 }, (_, i) => [r * Math.sin(i / 8 * Math.PI), -r * Math.cos(i / 8 * Math.PI), color]), at, 16);

function cuboid(b: Buf, [x0, y0, z0]: V, [x1, y1, z1]: V, color: string) {
  const c = hex(color), v = (x: number, y: number, z: number, n: V): Vx => ({ p: [x, y, z], n, c });
  for (const s of [-1, 1]) {
    const x = s < 0 ? x0 : x1, y = s < 0 ? y0 : y1, z = s < 0 ? z0 : z1;
    quad(b, v(x, y0, z0, [s, 0, 0]), v(x, y1, z0, [s, 0, 0]), v(x, y1, z1, [s, 0, 0]), v(x, y0, z1, [s, 0, 0]));
    quad(b, v(x0, y, z0, [0, s, 0]), v(x1, y, z0, [0, s, 0]), v(x1, y, z1, [0, s, 0]), v(x0, y, z1, [0, s, 0]));
    quad(b, v(x0, y0, z, [0, 0, s]), v(x1, y0, z, [0, 0, s]), v(x1, y1, z, [0, 0, s]), v(x0, y1, z, [0, 0, s]));
  }
}

// Flat textured rectangle; `corners` go round the edge, uv follows them from (0,0).
function plane(b: Buf, corners: V[], n: V) {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const v = corners.map((p, i): Vx => ({ p, n, c: [1, 1, 1], t: uv[i] }));
  quad(b, v[0], v[1], v[2], v[3]);
}

// The tabletop: rounded outline, textured top (uv over the full rectangle) and a 24px edge darkening downwards.
function tabletop(top: Buf, body: Buf, W: number, H: number) {
  const R = 14, outline: [number, number][] = [];
  for (const [cx, cy, a] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]])
    for (let i = 0; i <= 6; i++) {
      const t = (a + i * 15) * DEG;
      outline.push([cx * (W / 2 - R) + R * Math.cos(t), cy * (H / 2 - R) + R * Math.sin(t)]);
    }
  const light = hex("#654934"), dark = hex("#342217");
  const center: Vx = { p: [0, 0, 0], n: [0, 0, 1], c: [1, 1, 1], t: [0.5, 0.5] };
  outline.forEach(([x, y], i) => {
    const [x1, y1] = outline[(i + 1) % outline.length];
    const at = (px: number, py: number, z: number, n: V, c: V): Vx => ({ p: [px, py, z], n, c, t: [px / W + 0.5, py / H + 0.5] });
    tri(top, center, at(x, y, 0, [0, 0, 1], [1, 1, 1]), at(x1, y1, 0, [0, 0, 1], [1, 1, 1]));
    const len = Math.hypot(x1 - x, y1 - y), side: V = [(y1 - y) / len, (x - x1) / len, 0];
    quad(body, at(x, y, 0, side, light), at(x1, y1, 0, side, light), at(x1, y1, -24, side, dark), at(x, y, -24, side, dark));
    tri(body, { ...center, p: [0, 0, -24], n: [0, 0, -1], c: dark }, at(x, y, -24, [0, 0, -1], dark), at(x1, y1, -24, [0, 0, -1], dark));
  });
}

// Mug: open cylinder with a rim and coffee inside, plus a handle swept along half an ellipse. D is its diameter.
function cup(b: Buf, [x, y]: [number, number], D: number) {
  const r = D / 2, h = D * 0.85, inner = D * 0.43;
  lathe(b, [
    [r, 0, "#d9ceba"], [r, h, "#e2d8c6"], [inner, h, "#e7dcc7"], [inner, D * 0.7, "#8c795e"],
    [inner, D * 0.7, "#8a542a"], [inner * 0.9, D * 0.7, "#2c150a"], [inner * 0.4, D * 0.7, "#321a0c"], [0, D * 0.7, "#4a2814"],
  ], [x, y, 0]);
  const cx = x - D * 0.58, cz = h * 0.52, rx = D * 0.2, rz = D * 0.29, tube = D * 0.045, c = hex("#d4c8b2");
  const ring = (a: number, f: number): Vx => {
    const len = Math.hypot(Math.cos(a) / rx, Math.sin(a) / rz), nx = Math.cos(a) / rx / len, nz = Math.sin(a) / rz / len;
    const n: V = [Math.cos(f) * nx, Math.sin(f), Math.cos(f) * nz];
    return { p: [cx + rx * Math.cos(a) + tube * n[0], y + tube * n[1], cz + rz * Math.sin(a) + tube * n[2]], n, c };
  };
  for (let i = 0; i < 22; i++)
    for (let k = 0; k < 12; k++) {
      const a0 = (70 + i * 10) * DEG, a1 = (80 + i * 10) * DEG, f0 = k / 12 * 2 * Math.PI, f1 = (k + 1) / 12 * 2 * Math.PI;
      quad(b, ring(a0, f0), ring(a1, f0), ring(a1, f1), ring(a0, f1));
    }
}

// Owns its canvas: two OGL renderers on one context (React's dev double mount) desync OGL's cached GL state.
export function createDeskGL(parent: HTMLElement, className: string) {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new Renderer({ canvas, dpr: Math.min(devicePixelRatio, 2), alpha: true, premultipliedAlpha: true, antialias: true });
  const gl = renderer.gl;
  if (!gl) return null;
  parent.prepend(canvas);
  gl.clearColor(0, 0, 0, 0);
  const camera = new Camera(gl, { near: 50, far: 10000 });
  camera.position.set(0, 0, PERSPECTIVE);
  const scene = new Transform(), desk = new Transform();
  desk.matrixAutoUpdate = false;
  desk.setParent(scene);

  const program = (shader: typeof LIT, transparent: boolean, extra = {}) => new Program(gl, {
    ...shader, transparent, depthWrite: shader === LIT || !transparent, cullFace: shader === LIT && gl.BACK,
    uniforms: { uOpacity: { value: 1 }, ...extra },
  });
  const lit = program(LIT, false), fading = program(LIT, true);
  const surfaces = { top: false, chalk: true, floor: true, drawers: false } as const;
  const flat = Object.fromEntries(Object.entries(surfaces).map(([k, t]) => [k, program(TEX, t, { tMap: { value: null } })])) as Record<keyof typeof surfaces, Program>;

  const seed = Math.floor(Math.random() * 1e5);
  let layout = "", last: DeskView | undefined, timer = 0, built: (() => void) | undefined;

  function build(v: DeskView) {
    built?.();
    const W = v.desk, H = W / 1.85, floorZ = -12 - v.leg, drawerHeight = v.mobile ? 46 : 65;
    const textures: Texture[] = [];
    const paint = paintDesk(W, H, v.mobile, seed, drawerHeight, () => {
      for (const t of textures) t.needsUpdate = true;
      render();
    });
    for (const key of Object.keys(surfaces) as (keyof typeof surfaces)[]) {
      const texture = new Texture(gl, { image: paint[key], premultiplyAlpha: true, anisotropy: 8 });
      flat[key].uniforms.tMap.value = texture;
      textures.push(texture);
    }

    const parts = { top: buf(), chalk: buf(), floor: buf(), drawers: buf(), solid: buf(), faded: buf() };
    tabletop(parts.top, parts.solid, W, H);
    const [cx, cy] = cupAt(paint.spot);
    cup(parts.solid, [(cx - 0.5) * W, (0.5 - cy) * H], W * paint.spot.radius * 2);
    // Legs hang from under the top at 8% / 91% of its depth, 5% in from the sides.
    for (const x of [-1, 1]) for (const y of [0.42, -0.41])
      lathe(parts.solid, [[0, floorZ, "#2e2f2b"], [12.5, floorZ, "#2e2f2b"], [12.5, -12, "#3a3b36"], [0, -12, "#3a3b36"]], [x * (W * 0.45 - 12.5), y * H, 0], 12);
    const front = -0.43 * H;
    cuboid(parts.solid, [-0.42 * W, front, -24 - drawerHeight], [0.42 * W, 0.2 * H, -24], "#231910");
    plane(parts.drawers, [[-0.42 * W, front - 0.2, -24 - drawerHeight], [0.42 * W, front - 0.2, -24 - drawerHeight], [0.42 * W, front - 0.2, -24], [-0.42 * W, front - 0.2, -24]], [0, -1, 0]);
    plane(parts.floor, [[-1.1 * W, -1.3 * H, floorZ], [1.1 * W, -1.3 * H, floorZ], [1.1 * W, 1.3 * H, floorZ], [-1.1 * W, 1.3 * H, floorZ]], [0, 0, 1]);
    plane(parts.chalk, [[-W / 2, -H / 2, 0.5], [W / 2, -H / 2, 0.5], [W / 2, H / 2, 0.5], [-W / 2, H / 2, 0.5]], [0, 0, 1]);
    // Waste bin beside the desk with two paper balls in it, and two more on the floor; all fade in with the floor.
    const bin: V = [0.69 * W, -0.31 * H, floorZ], br = 0.06 * W, bh = 0.4 * v.leg;
    lathe(parts.faded, [[br, 0, "#3a3b38"], [br, bh, "#4a4c47"], [br - 4, bh, "#8b8d88"], [br - 4, 2, "#252623"], [0, 2, "#1c1d1a"]], bin, 48, 0.6);
    sphere(parts.faded, br * 0.38, [bin[0] - br * 0.18, bin[1] + br * 0.02, floorZ + 2 + br * 0.38], "#e3ddcf");
    sphere(parts.faded, br * 0.32, [bin[0] + br * 0.28, bin[1] - br * 0.2, floorZ + 2 + br * 0.32], "#d9d3c4");
    sphere(parts.faded, W * 0.0143, [0.528 * W, -0.572 * H, floorZ + W * 0.0143], "#e3ddcf");
    sphere(parts.faded, W * 0.0121, [0.737 * W, -0.442 * H, floorZ + W * 0.0121], "#d9d3c4");

    const meshes = Object.entries(parts).map(([key, b]) => {
      const geometry = new Geometry(gl, {
        position: { size: 3, data: new Float32Array(b.p) }, normal: { size: 3, data: new Float32Array(b.n) },
        color: { size: 3, data: new Float32Array(b.c) }, uv: { size: 2, data: new Float32Array(b.t) },
      });
      const mesh = new Mesh(gl, { geometry, program: key === "solid" ? lit : key === "faded" ? fading : flat[key as keyof typeof surfaces] });
      mesh.renderOrder = key === "floor" ? 1 : key === "faded" ? 2 : key === "chalk" ? 3 : 0;
      mesh.setParent(desk);
      return mesh;
    });
    built = () => {
      paint.cancel();
      for (const mesh of meshes) { mesh.setParent(null); mesh.geometry.remove(); }
      for (const texture of textures) gl.deleteTexture(texture.texture);
    };
  }

  function render() {
    const v = last;
    if (!v || !built) return;
    desk.matrix.identity().translate(shift.set(0, -v.entry, 0)).rotate(-v.pitch * DEG, X).rotate(-v.turn * DEG, Z);
    desk.worldMatrixNeedsUpdate = true;
    fading.uniforms.uOpacity.value = flat.floor.uniforms.uOpacity.value = v.floor;
    flat.chalk.uniforms.uOpacity.value = v.floor * 0.8;
    renderer.render({ scene, camera });
  }

  // Called from the scroll handler's animation frame, so canvas and DOM move in the same frame.
  function draw(v: DeskView) {
    if (v.width !== last?.width || v.height !== last?.height) {
      renderer.setSize(v.width, v.height);
      camera.perspective({ fov: 2 * Math.atan(v.height / 2 / PERSPECTIVE) / DEG, aspect: v.width / v.height });
    }
    last = v;
    const key = `${v.desk}|${v.leg}|${v.mobile}`;
    if (key !== layout) {
      clearTimeout(timer);
      // First build is immediate; rebuilds while resizing wait for it to settle (textures are the slow part).
      if (!layout) build(v);
      else timer = window.setTimeout(() => { build(last!); render(); }, 150);
      layout = key;
    }
    render();
  }

  // Where the mug stands, as desk fractions (diameter is of the width), so the flat layer can put a button on it.
  const spot = coffeeSpot(rng(seed)), [x, y] = cupAt(spot);
  return {
    draw,
    cup: { x, y, d: spot.radius * 2 },
    dispose() {
      clearTimeout(timer);
      built?.();
      for (const p of [lit, fading, ...Object.values(flat)]) p.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}
