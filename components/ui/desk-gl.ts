import { Camera, Geometry, Mat4, Mesh, Program, Renderer, Texture, Transform, Vec3 } from "ogl";
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

// Lighting lives in desk space, so it turns with the desk like the baked CSS shading did: a warm key from the upper
// left (the same direction the textures' painted shadows assume), a cool fill from the viewer's side and a sky/floor
// hemisphere for ambient. Specular comes from a lamp at a point, so varnish and glaze catch a highlight that slides as
// the camera moves. Everything is lit in linear light and soft-clipped back to sRGB. Output is premultiplied.
const KEY: V = [-0.35, 0.45, 0.82];
const LIGHT = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec3 uEye; uniform vec3 uLamp; uniform vec3 uPool; uniform float uOpacity;
  const vec3 KEY = normalize(vec3(${KEY.join(", ")}));
  const vec3 KEY_COLOR = vec3(1., .9, .76), FILL = normalize(vec3(.4, -.6, .5)), FILL_COLOR = vec3(.6, .62, .68);
  const vec3 SKY = vec3(.42, .42, .46), GROUND = vec3(.3, .22, .15);
  vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
  vec3 toSrgb(vec3 c) {
    c = mix(c, c / (.28 + .9 * c), step(.8, c)); // linear up to .8, then a soft shoulder instead of a hard clip
    return pow(c, vec3(1. / 2.2));
  }
  // Pool of lamplight: brightest under the lamp, falling off towards the room's edges.
  float pool(vec3 p) { vec2 d = (p.xy - uPool.xy) / uPool.z; return mix(.62, 1.12, exp(-dot(d, d))); }
  // albedo is linear; mat = (shininess, specular strength).
  vec3 shade(vec3 albedo, vec3 n, vec3 p, vec2 mat, float occlusion) {
    vec3 v = normalize(uEye - p), l = normalize(uLamp - p), h = normalize(l + v);
    float nv = max(dot(n, v), 0.), light = pool(p);
    float fresnel = .04 + .96 * pow(1. - nv, 5.);
    vec3 hemi = mix(GROUND, SKY, n.z * .5 + .5);
    vec3 diffuse = hemi * .9 * occlusion
      + KEY_COLOR * max(dot(n, KEY), 0.) * .95 * light
      + FILL_COLOR * max(dot(n, FILL), 0.) * .35;
    float spec = pow(max(dot(n, h), 0.), mat.x) * (mat.x + 8.) / 25.;
    vec3 reflection = KEY_COLOR * spec * max(dot(n, l), 0.) * light + hemi * fresnel * .6 * occlusion;
    return albedo * diffuse * (1. - fresnel * mat.y) + reflection * mat.y * mix(.25, 1., fresnel);
  }`;
const LIT = {
  vertex: `attribute vec3 position; attribute vec3 normal; attribute vec3 color; attribute vec2 material;
    uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
    varying vec3 vColor; varying vec3 vNormal; varying vec3 vPos; varying vec2 vMat;
    void main() {
      vColor = color; vNormal = normal; vPos = position; vMat = material;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }`,
  fragment: `${LIGHT}
    varying vec3 vColor; varying vec3 vNormal; varying vec3 vPos; varying vec2 vMat;
    void main() {
      vec3 n = normalize(vNormal);
      // Undersides and faces pointing down get less of the room's bounce light.
      float occlusion = mix(.55, 1., smoothstep(-1., .3, n.z));
      gl_FragColor = vec4(toSrgb(shade(toLinear(vColor), n, vPos, vMat, occlusion)), 1.) * uOpacity;
    }`,
};
// Textured surfaces get the same light, plus relief read off the texture's own luminance (grain, plank gaps, wear).
const TEX = {
  vertex: `attribute vec3 position; attribute vec3 normal; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
    void main() { vUv = uv; vNormal = normal; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragment: `${LIGHT}
    uniform sampler2D tMap; uniform vec2 uStep; uniform vec2 uMat; uniform float uBump; uniform float uLit;
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
    float height(vec2 uv) { vec4 t = texture2D(tMap, uv); return dot(t.rgb, vec3(.3, .59, .11)); }
    void main() {
      vec4 t = texture2D(tMap, vUv);
      if (uLit < .5) { gl_FragColor = t * uOpacity; return; }
      vec3 albedo = toLinear(t.a > 0. ? t.rgb / t.a : vec3(0.));
      // Tangents follow uv: u runs along +x, v along +y on every plane here (floor, top) or +z (drawer front).
      vec3 n = normalize(vNormal), tu = vec3(1., 0., 0.), tv = normalize(cross(n, tu));
      float dx = height(vUv + vec2(uStep.x, 0.)) - height(vUv - vec2(uStep.x, 0.));
      float dy = height(vUv + vec2(0., uStep.y)) - height(vUv - vec2(0., uStep.y));
      n = normalize(n - (tu * dx + tv * dy) * uBump);
      gl_FragColor = vec4(toSrgb(shade(albedo, n, vPos, uMat, 1.)), 1.) * t.a * uOpacity;
    }`,
};
// Soft contact shadows: a blurred rounded box per caster, drawn as premultiplied black onto the floor.
const SHADOW = {
  vertex: `attribute vec3 position; attribute vec2 uv; attribute vec4 shape; attribute float strength;
    uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vLocal; varying vec4 vShape; varying float vStrength;
    void main() { vLocal = uv; vShape = shape; vStrength = strength; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragment: `precision mediump float; uniform float uOpacity; varying vec2 vLocal; varying vec4 vShape; varying float vStrength;
    void main() {
      vec2 q = abs(vLocal) - vShape.xy + vShape.z;
      float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - vShape.z;
      float a = 1. - smoothstep(-vShape.w, vShape.w, d);
      gl_FragColor = vec4(0., 0., 0., a * a * vStrength * uOpacity);
    }`,
};

type V = [number, number, number];
type M = [number, number]; // shininess, specular strength
const MATTE: M = [6, 0.03], WOOD: M = [24, 0.14], CERAMIC: M = [110, 0.55], COFFEE: M = [320, 0.9];
const STEEL: M = [40, 0.45], TIN: M = [60, 0.6], PAPER: M = [3, 0.02];
type Vx = { p: V; n: V; c: V; t?: [number, number]; m?: M };
type Buf = { p: number[]; n: number[]; c: number[]; t: number[]; m: number[] };
const buf = (): Buf => ({ p: [], n: [], c: [], t: [], m: [] });
const hex = (h: string): V => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as V;

// Winding follows the vertex normals, so callers never care about vertex order.
function tri(b: Buf, v0: Vx, v1: Vx, v2: Vx) {
  const [a, c, d] = [v0.p, v1.p, v2.p];
  const e = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], f = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const cross = [e[1] * f[2] - e[2] * f[1], e[2] * f[0] - e[0] * f[2], e[0] * f[1] - e[1] * f[0]];
  const n = [0, 1, 2].map((i) => v0.n[i] + v1.n[i] + v2.n[i]);
  if (cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2] < 0) [v1, v2] = [v2, v1];
  for (const v of [v0, v1, v2]) { b.p.push(...v.p); b.n.push(...v.n); b.c.push(...v.c); b.t.push(...(v.t ?? [0, 0])); b.m.push(...(v.m ?? MATTE)); }
}
const quad = (b: Buf, v0: Vx, v1: Vx, v2: Vx, v3: Vx) => { tri(b, v0, v1, v2); tri(b, v0, v2, v3); };

// Surface of revolution around z; profile is [radius, z, colour, material?]. Each profile step gets its own normal, so
// rims stay crisp; a step's material is its first point's, else `mat`.
function lathe(b: Buf, profile: [number, number, string, M?][], at: V, segments = 32, ribs = 1, mat = MATTE) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, z0, c0, m = mat] = profile[i], [r1, z1, c1] = profile[i + 1];
    const len = Math.hypot(r1 - r0, z1 - z0) || 1, nr = (z1 - z0) / len, nz = (r0 - r1) / len;
    for (let j = 0; j < segments; j++) {
      const a0 = j / segments * 2 * Math.PI, a1 = (j + 1) / segments * 2 * Math.PI, shade = j % 2 && !nz ? ribs : 1; // ribs on walls only
      const v = (r: number, z: number, a: number, c: string): Vx => ({
        p: [at[0] + r * Math.cos(a), at[1] + r * Math.sin(a), at[2] + z], n: [nr * Math.cos(a), nr * Math.sin(a), nz], c: hex(c).map((x) => x * shade) as V, m,
      });
      quad(b, v(r0, z0, a0, c0), v(r0, z0, a1, c0), v(r1, z1, a1, c1), v(r1, z1, a0, c1));
    }
  }
}
// Crumpled paper: each ring of the sphere gets a slightly different radius and shade, so it reads as folds, not a ball.
const sphere = (b: Buf, r: number, at: V, color: string) =>
  lathe(b, Array.from({ length: 9 }, (_, i) => {
    const k = i % 8 ? 1 + (((i * 7) % 5) - 2) * 0.04 : 1, c = hex(color).map((x) => x * (1 - (i % 3) * 0.04));
    return [r * k * Math.sin(i / 8 * Math.PI), -r * k * Math.cos(i / 8 * Math.PI), "#" + c.map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")];
  }), at, 16, 1, PAPER);

function cuboid(b: Buf, [x0, y0, z0]: V, [x1, y1, z1]: V, color: string, m = MATTE) {
  const c = hex(color), v = (x: number, y: number, z: number, n: V): Vx => ({ p: [x, y, z], n, c, m });
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
    const at = (px: number, py: number, z: number, n: V, c: V): Vx => ({ p: [px, py, z], n, c, t: [px / W + 0.5, py / H + 0.5], m: WOOD });
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
    [inner, D * 0.7, "#8a542a", COFFEE], [inner * 0.9, D * 0.7, "#2c150a", COFFEE], [inner * 0.4, D * 0.7, "#321a0c", COFFEE], [0, D * 0.7, "#4a2814"],
  ], [x, y, 0], 48, 1, CERAMIC);
  const cx = x - D * 0.58, cz = h * 0.52, rx = D * 0.2, rz = D * 0.29, tube = D * 0.045, c = hex("#d4c8b2");
  const ring = (a: number, f: number): Vx => {
    const len = Math.hypot(Math.cos(a) / rx, Math.sin(a) / rz), nx = Math.cos(a) / rx / len, nz = Math.sin(a) / rz / len;
    const n: V = [Math.cos(f) * nx, Math.sin(f), Math.cos(f) * nz];
    return { p: [cx + rx * Math.cos(a) + tube * n[0], y + tube * n[1], cz + rz * Math.sin(a) + tube * n[2]], n, c, m: CERAMIC };
  };
  for (let i = 0; i < 22; i++)
    for (let k = 0; k < 12; k++) {
      const a0 = (70 + i * 10) * DEG, a1 = (80 + i * 10) * DEG, f0 = k / 12 * 2 * Math.PI, f1 = (k + 1) / 12 * 2 * Math.PI;
      quad(b, ring(a0, f0), ring(a1, f0), ring(a1, f1), ring(a0, f1));
    }
}

// A soft shadow at height z: box half-size (hw, hh), corner radius, blur (px). Lifted towards the viewer by `lift` and
// pushed away from the key light by `cast`, the caster's height above the surface it falls on.
type Shade = { p: number[]; t: number[]; s: number[]; a: number[] };
function shadow(b: Shade, [x, y, z]: V, hw: number, hh: number, radius: number, blur: number, strength: number, cast = 0) {
  const ox = x - KEY[0] / KEY[2] * cast, oy = y - KEY[1] / KEY[2] * cast, ex = hw + blur * 2, ey = hh + blur * 2;
  for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
    b.p.push(ox + u * ex, oy + v * ey, z); b.t.push(u * ex, v * ey); b.s.push(hw, hh, Math.min(radius, hw, hh), blur); b.a.push(strength);
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

  // Shared by reference, so moving the camera or lamp updates every program at once.
  const light = { uEye: { value: new Vec3() }, uLamp: { value: new Vec3() }, uPool: { value: new Vec3() } };
  const program = (shader: typeof LIT, transparent: boolean, extra = {}) => new Program(gl, {
    ...shader, transparent, depthWrite: shader === LIT || !transparent, cullFace: shader === LIT && gl.BACK,
    uniforms: { uOpacity: { value: 1 }, ...light, ...extra },
  });
  const lit = program(LIT, false), fading = program(LIT, true), shading = program(SHADOW, true);
  // Per surface: transparent?, material, relief, lit? The chalk is drawn light on dark, so it stays as painted.
  const surfaces = { top: [false, [30, 0.22], 2.2, 1], chalk: [true, MATTE, 0, 0], floor: [true, [14, 0.1], 3, 1], drawers: [false, WOOD, 1.5, 1] } as const;
  const flat = Object.fromEntries(Object.entries(surfaces).map(([k, [t, mat, bump, on]]) => [k, program(TEX, t, {
    tMap: { value: null }, uStep: { value: [0, 0] }, uMat: { value: mat }, uBump: { value: bump }, uLit: { value: on },
  })])) as Record<keyof typeof surfaces, Program>;
  const inverse = new Mat4();

  const seed = Math.floor(Math.random() * 1e5);
  let layout = "", last: DeskView | undefined, timer = 0, built: (() => void) | undefined;

  function build(v: DeskView) {
    built?.();
    const W = v.desk, H = W / 1.85, floorZ = -12 - v.leg, drawerHeight = v.mobile ? 46 : 65;
    const textures: Texture[] = [];
    // Lamp above the desk's back-left corner, along the key light; its pool centres a little in from there.
    light.uLamp.value.set(-0.3 * W, 0.35 * H, 1.1 * W);
    light.uPool.value.set(-0.12 * W, 0.1 * H, 1.15 * W);
    const span = { top: [W, H], chalk: [W, H], floor: [W * 2.2, H * 2.6], drawers: [W * 0.84, drawerHeight] };
    const paint = paintDesk(W, H, v.mobile, seed, drawerHeight, () => {
      for (const t of textures) t.needsUpdate = true;
      render();
    });
    for (const key of Object.keys(surfaces) as (keyof typeof surfaces)[]) {
      const texture = new Texture(gl, { image: paint[key], premultiplyAlpha: true, anisotropy: 8 });
      flat[key].uniforms.tMap.value = texture;
      flat[key].uniforms.uStep.value = [1 / span[key][0], 1 / span[key][1]]; // one CSS px
      textures.push(texture);
    }

    const parts = { top: buf(), chalk: buf(), floor: buf(), drawers: buf(), solid: buf(), faded: buf() };
    tabletop(parts.top, parts.solid, W, H);
    const [cx, cy] = cupAt(paint.spot);
    cup(parts.solid, [(cx - 0.5) * W, (0.5 - cy) * H], W * paint.spot.radius * 2);
    // Legs hang from under the top at 8% / 91% of its depth, 5% in from the sides.
    for (const x of [-1, 1]) for (const y of [0.42, -0.41])
      lathe(parts.solid, [[0, floorZ, "#2e2f2b"], [12.5, floorZ, "#2e2f2b"], [12.5, -12, "#3a3b36"], [0, -12, "#3a3b36"]], [x * (W * 0.45 - 12.5), y * H, 0], 16, 1, STEEL);
    const front = -0.43 * H;
    cuboid(parts.solid, [-0.42 * W, front, -24 - drawerHeight], [0.42 * W, 0.2 * H, -24], "#231910", WOOD);
    plane(parts.drawers, [[-0.42 * W, front - 0.2, -24 - drawerHeight], [0.42 * W, front - 0.2, -24 - drawerHeight], [0.42 * W, front - 0.2, -24], [-0.42 * W, front - 0.2, -24]], [0, -1, 0]);
    plane(parts.floor, [[-1.1 * W, -1.3 * H, floorZ], [1.1 * W, -1.3 * H, floorZ], [1.1 * W, 1.3 * H, floorZ], [-1.1 * W, 1.3 * H, floorZ]], [0, 0, 1]);
    plane(parts.chalk, [[-W / 2, -H / 2, 0.5], [W / 2, -H / 2, 0.5], [W / 2, H / 2, 0.5], [-W / 2, H / 2, 0.5]], [0, 0, 1]);
    // Waste bin beside the desk with two paper balls in it, and two more on the floor; all fade in with the floor.
    const bin: V = [0.69 * W, -0.31 * H, floorZ], br = 0.06 * W, bh = 0.4 * v.leg;
    lathe(parts.faded, [[br, 0, "#3a3b38"], [br, bh, "#4a4c47"], [br - 4, bh, "#8b8d88"], [br - 4, 2, "#252623"], [0, 2, "#1c1d1a"]], bin, 48, 0.6, TIN);
    sphere(parts.faded, br * 0.38, [bin[0] - br * 0.18, bin[1] + br * 0.02, floorZ + 2 + br * 0.38], "#e3ddcf");
    sphere(parts.faded, br * 0.32, [bin[0] + br * 0.28, bin[1] - br * 0.2, floorZ + 2 + br * 0.32], "#d9d3c4");
    sphere(parts.faded, W * 0.0143, [0.528 * W, -0.572 * H, floorZ + W * 0.0143], "#e3ddcf");
    sphere(parts.faded, W * 0.0121, [0.737 * W, -0.442 * H, floorZ + W * 0.0121], "#d9d3c4");

    // Shadows on the floor, all fading in with it: the desk's (cast from its top, 12 + leg px up), the drawers', each leg's
    // foot, the bin's and the stray paper balls'.
    const shades: Shade = { p: [], t: [], s: [], a: [] }, onFloor = floorZ + 0.4, rise = -floorZ;
    shadow(shades, [0, 0, onFloor], W * 0.5, H * 0.5, 14, rise * 0.45, 0.6, rise * 0.35);
    shadow(shades, [0, -0.115 * H, onFloor], W * 0.42, H * 0.32, 8, rise * 0.18, 0.4, (rise - 24 - drawerHeight) * 0.5);
    for (const x of [-1, 1]) for (const y of [0.42, -0.41]) shadow(shades, [x * (W * 0.45 - 12.5), y * H, onFloor], 12.5, 12.5, 12.5, 7, 0.75, 4);
    shadow(shades, [bin[0], bin[1], onFloor], br, br, br, br * 0.35, 0.8, br * 0.3);
    for (const [x, y, r] of [[0.528 * W, -0.572 * H, W * 0.0143], [0.737 * W, -0.442 * H, W * 0.0121]])
      shadow(shades, [x, y, onFloor], r * 0.8, r * 0.8, r, r * 0.5, 0.7, r * 0.8);
    const shadowGeometry = new Geometry(gl, {
      position: { size: 3, data: new Float32Array(shades.p) }, uv: { size: 2, data: new Float32Array(shades.t) },
      shape: { size: 4, data: new Float32Array(shades.s) }, strength: { size: 1, data: new Float32Array(shades.a) },
    });
    const shadowMesh = new Mesh(gl, { geometry: shadowGeometry, program: shading });
    shadowMesh.renderOrder = 1.5; // over the floor, under the bin
    shadowMesh.setParent(desk);

    const meshes = Object.entries(parts).map(([key, b]) => {
      const geometry = new Geometry(gl, {
        position: { size: 3, data: new Float32Array(b.p) }, normal: { size: 3, data: new Float32Array(b.n) },
        color: { size: 3, data: new Float32Array(b.c) }, uv: { size: 2, data: new Float32Array(b.t) },
        material: { size: 2, data: new Float32Array(b.m) },
      });
      const mesh = new Mesh(gl, { geometry, program: key === "solid" ? lit : key === "faded" ? fading : flat[key as keyof typeof surfaces] });
      mesh.renderOrder = key === "floor" ? 1 : key === "faded" ? 2 : key === "chalk" ? 3 : 0;
      mesh.setParent(desk);
      return mesh;
    });
    meshes.push(shadowMesh);
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
    // The camera, seen from desk space: what view-dependent light (highlights, fresnel) is measured against.
    light.uEye.value.set(0, 0, PERSPECTIVE).applyMatrix4(inverse.inverse(desk.matrix));
    fading.uniforms.uOpacity.value = flat.floor.uniforms.uOpacity.value = shading.uniforms.uOpacity.value = v.floor;
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
      for (const p of [lit, fading, shading, ...Object.values(flat)]) p.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}
