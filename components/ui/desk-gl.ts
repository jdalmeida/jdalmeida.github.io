import { Camera, Geometry, Mat4, Mesh, Program, Renderer, RenderTarget, Texture, Transform, Vec3 } from "ogl";
import { ballsAt, binAt, coffeeSpot, cupAt, lampAt, legsAt, paintDesk } from "./desk-textures";
import { bin, buf, cuboid, lathe, MAT, mug, paperBall, pen, pencil, plane, stickyNote, succulent, tabletop, type Buf, type V } from "./desk-geometry";
import { LIGHTMAP, SOLID, SURFACE, WOOD } from "./desk-shaders";
import { rng } from "./grime";

// The desk's furniture, objects, bin and floor in one WebGL canvas, placed exactly under the CSS-transformed `.desk`
// (which keeps only the interactive notebook, badges, mug button and bin button). Units are CSS px; the camera mirrors
// `.space`'s `perspective: 1400px`, so a point at z = 0 lands on the same pixel in both.
//
// Cost model: everything expensive is computed once per layout into textures: procedural wood, shadows and decals,
// and, since the lamp is fixed to the desk, the diffuse light of the top and floor (light maps). A scroll frame is
// one pass of ~13k triangles; the big surfaces cost one texture read and a highlight per pixel. Nothing renders
// while nothing moves.
export type DeskView = {
  width: number; height: number; // stage
  desk: number; leg: number; mobile: boolean;
  entry: number; pitch: number; turn: number; floor: number;
  dive?: [number, number, number]; // world shift that brings the camera down into the mug (desk-scene.tsx)
  glint?: number; // 1 normally; fades highlights out at the bottom of the dive
};

const PERSPECTIVE = 1400;
const DEG = Math.PI / 180;
const X = new Vec3(1, 0, 0), Z = new Vec3(0, 0, 1), shift = new Vec3();
const EXPOSURE = 1;

// Owns its canvas: two OGL renderers on one context (React's dev double mount) desync OGL's cached GL state.
export function createDeskGL(parent: HTMLElement, className: string) {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(devicePixelRatio, 2);
  const renderer = new Renderer({ canvas, dpr, alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: "high-performance" });
  const gl = renderer.gl;
  if (!gl) return null;
  parent.prepend(canvas);
  gl.clearColor(0, 0, 0, 0);
  const camera = new Camera(gl, { near: 10, far: 10000 });
  camera.position.set(0, 0, PERSPECTIVE);
  const scene = new Transform(), desk = new Transform();
  desk.matrixAutoUpdate = false;
  desk.setParent(scene);

  // Lighting uniforms are shared objects, so one write per frame reaches every program.
  const shared = { uLight: { value: new Vec3() }, uEye: { value: new Vec3() }, uLightZ: { value: 1000 }, uExposure: { value: EXPOSURE }, uGlint: { value: 1 } };
  const blank = new Texture(gl, { image: new Uint8Array(4), width: 1, height: 1, generateMipmaps: false });
  const solid = (transparent: boolean) => new Program(gl, { ...SOLID, transparent, cullFace: gl.BACK, uniforms: { ...shared, uOpacity: { value: 1 } } });
  const surface = (transparent: boolean, extra: Record<string, number> = {}) => new Program(gl, {
    ...SURFACE, transparent, depthWrite: !transparent, cullFace: gl.BACK,
    uniforms: {
      ...shared, tMap: { value: blank }, tDecal: { value: blank }, uTexel: { value: [0, 0] },
      ...Object.fromEntries(Object.entries({ uBump: 0, uSpec: 0.1, uGloss: 20, uMode: 0, uFade: 0, uOpacity: 1, ...extra }).map(([k, value]) => [k, { value }])),
    },
  });
  const programs = {
    solid: solid(false), faded: solid(true),
    top: surface(false, { uMode: 2, uSpec: 0.065, uGloss: 40 }),
    edge: surface(false, { uBump: 1, uSpec: 0.1, uGloss: 40 }),
    note: surface(false, { uSpec: 0.06, uGloss: 12 }),
    floor: surface(true, { uMode: 2, uSpec: 0, uFade: 1 }), // matte: its light map is all it needs
    chalk: surface(true, { uMode: 1 }),
  };
  const wood = new Program(gl, { ...WOOD, depthTest: false, depthWrite: false, uniforms: {
    uSize: { value: [1, 1] }, uSeed: { value: 0 }, uBoard: { value: 100 }, uPlank: { value: 1e5 }, uRing: { value: 9 },
    uLightWood: { value: [0, 0, 0] }, uDarkWood: { value: [0, 0, 0] }, uVertical: { value: 0 }, uSeam: { value: 0 },
    tDirt: { value: blank }, tWear: { value: blank }, uGrime: { value: 0 },
  } });
  const lightmap = new Program(gl, { ...LIGHTMAP, depthTest: false, depthWrite: false, uniforms: {
    ...shared, tMap: { value: blank }, tDecal: { value: blank }, uTexel: { value: [0, 0] }, uBump: { value: 1 },
    uOrigin: { value: [0, 0] }, uExtent: { value: [1, 1] }, uZ: { value: 0 },
  } });
  const quad = new Mesh(gl, { geometry: new Geometry(gl, { position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) }, uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) } }), program: wood });

  const seed = Math.floor(Math.random() * 1e5);
  let layout = "", last: DeskView | undefined, timer = 0, built: (() => void) | undefined;

  type WoodLook = { size: [number, number]; board: number; plank: number; ring: number; light: string; dark: string; vertical: boolean; seam: number };
  const lin = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  // Renders `program` over all of `target` once, then mipmaps it so the grain doesn't shimmer when the desk tilts away.
  function bake(target: RenderTarget, program: Program) {
    quad.program = program;
    renderer.render({ scene: quad, target, clear: false });
    if (!renderer.isWebgl2) return;
    target.texture.bind();
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    target.texture.state.minFilter = gl.LINEAR_MIPMAP_LINEAR;
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, renderer.parameters.maxAnisotropy ?? 1));
  }

  function woodInto(target: RenderTarget, look: WoodLook, grime?: { dirt: Texture; wear: Texture }) {
    const u = wood.uniforms;
    u.uSize.value = look.size; u.uSeed.value = seed % 997; u.uBoard.value = look.board; u.uPlank.value = look.plank; u.uRing.value = look.ring;
    u.uLightWood.value = lin(look.light); u.uDarkWood.value = lin(look.dark); u.uVertical.value = look.vertical ? 1 : 0; u.uSeam.value = look.seam;
    u.tDirt.value = grime?.dirt ?? blank; u.tWear.value = grime?.wear ?? blank; u.uGrime.value = grime ? 1 : 0;
    bake(target, wood);
  }
  // Light map of a horizontal surface at height z covering desk [x0, x0 + w] × [y0, y0 + h].
  function lightInto(target: RenderTarget, albedo: RenderTarget, decal: Texture, [x0, y0, w, h, z]: number[], bump: number) {
    const u = lightmap.uniforms;
    u.tMap.value = albedo.texture; u.tDecal.value = decal; u.uTexel.value = [1 / albedo.width, 1 / albedo.height];
    u.uOrigin.value = [x0, y0]; u.uExtent.value = [w, h]; u.uZ.value = z; u.uBump.value = bump;
    bake(target, lightmap);
  }

  const free = (t: RenderTarget) => { gl.deleteFramebuffer(t.buffer); gl.deleteTexture(t.texture.texture); };

  function build(v: DeskView) {
    built?.();
    const W = v.desk, H = W / 1.85, floorZ = -12 - v.leg, drawerHeight = v.mobile ? 46 : 65;
    const textures: Texture[] = [], targets: RenderTarget[] = [];
    const lamp = lampAt(W, H);
    shared.uLight.value.set(...lamp);
    shared.uLightZ.value = lamp[2];

    const scale = Math.min(dpr, 2048 / W);
    const floorScale = Math.min(dpr * 0.75, 2048 / (W * 2.2));
    const target = (w: number, h: number) => {
      const t = new RenderTarget(gl, { width: Math.round(w), height: Math.round(h), depth: false });
      targets.push(t);
      return t;
    };
    // Albedo + gloss (the edge and drawer fronts sample it lit live), and the light maps the top and floor show.
    const topWood = target(W * scale, H * scale), topLit = target(W * scale, H * scale);
    const floorWood = target(W * 2.2 * floorScale, H * 2.6 * floorScale), floorLit = target(W * 2.2 * floorScale, H * 2.6 * floorScale);
    // Wood is sized for a 1080px desk whatever its size on screen: it is the same desk, just seen from further away.
    const S = 1080 / W;
    const topLook: WoodLook = { size: [W * S, H * S], board: H * S / 4.6, plank: 1e5, ring: 14, light: "#6f4f37", dark: "#3b281b", vertical: false, seam: 0.22 };
    const floorLook: WoodLook = { size: [W * 2.2 * S, H * 2.6 * S], board: W * S * 0.1375, plank: W * S * 0.95, ring: 9, light: "#5d4c3e", dark: "#2c231c", vertical: true, seam: 0.6 };
    woodInto(topWood, topLook);
    woodInto(floorWood, floorLook);

    const upload = (image: HTMLCanvasElement | HTMLImageElement, premultiplyAlpha = true) => {
      const t = new Texture(gl, { image, premultiplyAlpha, anisotropy: 8, minFilter: renderer.isWebgl2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR });
      textures.push(t);
      return t;
    };
    const lightAll = () => {
      lightInto(topLit, topWood, decal.top, [-W / 2, -H / 2, W, H, 0], 1.2);
      lightInto(floorLit, floorWood, decal.floor, [-1.1 * W, -1.3 * H, 2.2 * W, 2.6 * H, floorZ], 0.8);
    };
    const paint = paintDesk(W, H, v.mobile, seed, v.leg, drawerHeight, ({ dirt, wear }) => {
      for (const t of Object.values(decal)) t.needsUpdate = true;
      woodInto(topWood, topLook, { dirt: upload(dirt, false), wear: upload(wear, false) });
      lightAll();
      // Nothing samples the floor's albedo after its last light bake: give the memory back (it is the biggest target).
      targets.splice(targets.indexOf(floorWood), 1);
      free(floorWood);
      render();
    });
    const decal = { top: upload(paint.top), floor: upload(paint.floor), chalk: upload(paint.chalk), note: upload(paint.note) };
    lightAll();
    const P = programs;
    P.top.uniforms.tMap = { value: topLit.texture };
    P.floor.uniforms.tMap = { value: floorLit.texture };
    Object.assign(P.edge.uniforms, { tMap: { value: topWood.texture }, uTexel: { value: [1 / topWood.width, 1 / topWood.height] } });
    P.chalk.uniforms.tMap = { value: decal.chalk };
    P.note.uniforms.tMap = { value: decal.note };

    const parts = { top: buf(), edge: buf(), note: buf(), solid: buf(), floor: buf(), faded: buf(), chalk: buf() };
    tabletop(parts.top, parts.edge, W, H);
    // Desk-space position of a layout point given in canvas fractions.
    const at = (x: number, y: number, z = 0): V => [(x - 0.5) * W, (0.5 - y) * H, z];
    const L = paint.layout;
    mug(parts.solid, at(L.cup.x, L.cup.y).slice(0, 2) as [number, number], L.cup.d);
    pencil(parts.solid, at(L.pencil.x, L.pencil.y), -L.pencil.angle, L.pencil.length, L.pencil.d);
    pen(parts.solid, at(L.pen.x, L.pen.y), -L.pen.angle, L.pen.length, L.pen.d);
    stickyNote(parts.note, at(L.note.x, L.note.y), -L.note.angle, L.note.size);
    succulent(parts.solid, at(L.plant.x, L.plant.y), L.plant.r, seed);

    // Powder-coated steel legs with a levelling foot, hanging from under the top.
    for (const [x, y] of legsAt(W, H))
      lathe(parts.solid, [[0, floorZ, "#1d1e1c", MAT.matte], [11, floorZ, "#1d1e1c", MAT.matte], [12, floorZ + 4, "#2a2b28", MAT.metal], [12, floorZ + 4, "#2a2b28", MAT.metal],
        [12.5, floorZ + 8, "#30312e", MAT.metal], [12.5, -14, "#383936", MAT.metal], [12.5, -14, "#383936", MAT.metal], [0, -14, "#383936", MAT.metal]], [x, y, 0], 24);
    // Drawer block: dark carcass, two wood fronts with a shadow gap, brushed steel bar pulls.
    const front = -0.43 * H, dz = -24 - drawerHeight;
    cuboid(parts.solid, [-0.42 * W, front, dz], [0.42 * W, 0.2 * H, -24], "#1e150e");
    const pw = (0.84 * W - 10) / 2;
    for (const x0 of [-0.42 * W + 3, -0.42 * W + 7 + pw]) {
      const uv = (x: number, z: number): [number, number] => [x / W + 0.5, 0.1 + (z - dz) / H];
      const c: V[] = [[x0, front - 2, dz + 3], [x0 + pw, front - 2, dz + 3], [x0 + pw, front - 2, -27], [x0, front - 2, -27]];
      plane(parts.edge, c, [0, -1, 0], c.map(([x, , z]) => uv(x, z)));
      const hx = x0 + pw / 2, hz = -24 - Math.min(26, drawerHeight * 0.4);
      cuboid(parts.solid, [hx - pw * 0.12, front - 8, hz - 2], [hx + pw * 0.12, front - 5, hz + 2], "#b9b9b2", MAT.chrome);
      for (const s of [-1, 1]) cuboid(parts.solid, [hx + s * pw * 0.1 - 1.5, front - 6, hz - 1.5], [hx + s * pw * 0.1 + 1.5, front - 2, hz + 1.5], "#8d8d87", MAT.metal);
    }
    plane(parts.floor, [[-1.1 * W, -1.3 * H, floorZ], [1.1 * W, -1.3 * H, floorZ], [1.1 * W, 1.3 * H, floorZ], [-1.1 * W, 1.3 * H, floorZ]], [0, 0, 1]);
    plane(parts.chalk, [[-W / 2, -H / 2, 0.3], [W / 2, -H / 2, 0.3], [W / 2, H / 2, 0.3], [-W / 2, H / 2, 0.3]], [0, 0, 1]);
    // Waste bin beside the desk with two paper balls in it, and two more on the floor; all fade in with the floor.
    const b = binAt(W, H, v.leg), bh = 0.4 * v.leg;
    bin(parts.faded, [b.x, b.y, floorZ], b.r, bh);
    paperBall(parts.faded, b.r * 0.4, [b.x - b.r * 0.2, b.y + b.r * 0.05, floorZ + 2 + b.r * 0.38], "#e8e2d4", seed);
    paperBall(parts.faded, b.r * 0.34, [b.x + b.r * 0.3, b.y - b.r * 0.22, floorZ + 2 + b.r * 0.33], "#ddd6c6", seed + 1);
    ballsAt(W, H).forEach((ball, i) => paperBall(parts.faded, ball.r, [ball.x, ball.y, floorZ + ball.r * 0.9], i ? "#ddd6c6" : "#e8e2d4", seed + 2 + i));

    const order: Record<keyof typeof parts, number> = { top: 0, edge: 0, note: 0, solid: 0, floor: 1, faded: 2, chalk: 3 };
    const meshes = (Object.entries(parts) as [keyof typeof parts, Buf][]).map(([key, b]) => {
      const geometry = new Geometry(gl, {
        position: { size: 3, data: new Float32Array(b.p) }, normal: { size: 3, data: new Float32Array(b.n) },
        color: { size: 3, data: new Float32Array(b.c) }, uv: { size: 2, data: new Float32Array(b.t) }, mat: { size: 2, data: new Float32Array(b.m) },
      });
      const mesh = new Mesh(gl, { geometry, program: P[key], frustumCulled: false });
      mesh.renderOrder = order[key];
      mesh.setParent(desk);
      if (order[key]) fading.push(mesh);
      return mesh;
    });
    built = () => {
      fading.length = 0;
      paint.cancel();
      for (const mesh of meshes) { mesh.setParent(null); mesh.geometry.remove(); }
      for (const texture of textures) gl.deleteTexture(texture.texture);
      targets.forEach(free);
    };
  }

  // Floor, bin and chalk fade in with the overhead view; at zero they are skipped rather than drawn invisible.
  const fading: Mesh[] = [];
  const inverse = new Mat4();
  function render() {
    const v = last;
    if (!v || !built) return;
    const [dx, dy, dz] = v.dive ?? [0, 0, 0];
    desk.matrix.identity().translate(shift.set(dx, dy - v.entry, dz)).rotate(-v.pitch * DEG, X).rotate(-v.turn * DEG, Z);
    desk.worldMatrixNeedsUpdate = true;
    // The camera, seen from the desk: specular highlights slide across the varnish as the view tilts.
    shared.uEye.value.copy(camera.position).applyMatrix4(inverse.inverse(desk.matrix));
    shared.uGlint.value = v.glint ?? 1;
    programs.faded.uniforms.uOpacity.value = programs.floor.uniforms.uOpacity.value = v.floor;
    programs.chalk.uniforms.uOpacity.value = v.floor * 0.8;
    for (const mesh of fading) mesh.visible = v.floor > 0;
    renderer.render({ scene, camera, frustumCull: false });
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
      for (const p of [...Object.values(programs), wood, lightmap]) p.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}
