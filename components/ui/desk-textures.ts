import { rng, type Layer } from "@/components/ui/grime";
import { GUITAR, turnAt } from "./desk-geometry";

// Flat desk layers painted once into 2D canvases, then uploaded as WebGL textures. Sizes are CSS px of the desk.
// The wood itself is procedural (desk-shaders.ts WOOD); these canvases only carry what sits on it: stains,
// shadows baked from the lamp, paper clips, chalk, the rug.
export type Spot = { radius: number; x: number; y: number };
export const coffeeSpot = (r: () => number): Spot => ({ radius: 0.038 + r() * 0.008, x: 0.87 + r() * 0.05, y: 0.12 + r() * 0.08 });
// Cup centre, as a fraction of desk width / height; its diameter is 2 * radius of the desk width.
export const cupAt = (s: Spot) => [s.x - s.radius * 1.8, s.y + 0.035];

// Chalk grain: noise alpha, applied with destination-in.
export const CHALK: Layer = { filter: `<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.2 -1"/>` };

// The lamp, in desk space (px, origin at the tabletop centre, y towards the back, z up). Up and to the left,
// like the CSS shadows of the notebook and badges assume.
export const lampAt = (W: number, H: number): [number, number, number] => [-0.3 * W, 0.42 * H, 1.25 * W];

// Where the objects lie, in canvas fractions (y down) with canvas-clockwise angles; desk-gl.ts builds them from this.
export function deskLayout(W: number, H: number, mobile: boolean, spot: Spot) {
  const note = W * 0.085, [cx, cy] = cupAt(spot);
  return {
    pencil: { x: 0.205, y: 0.18, angle: 16, length: W * 0.17, d: Math.max(6, H * 0.0145) },
    pen: { x: 0.97, y: 0.506, angle: 78, length: W * 0.14, d: Math.max(5, H * 0.012) },
    note: { x: 0.5 + note / 2 / W, y: 0.7 + note / 2 / H, angle: mobile ? -84 : 5, size: note },
    cup: { x: cx, y: cy, d: W * spot.radius * 2 },
    plant: { x: 0.052, y: 0.1, r: W * 0.032 },
  };
}

type Ctx = CanvasRenderingContext2D;
type Assets = { grain: HTMLImageElement; font: string };
type Surface = ReturnType<typeof surface>;

function surface(w: number, h: number, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  // Draws only the shadow of what `draw` fills: the shape goes far off-canvas and its shadow is offset back.
  // Canvas shadows ignore the transform, so offsets and blur are converted to device px by hand.
  const shadow = (dx: number, dy: number, blur: number, color: string, draw: () => void) => {
    ctx.save();
    const m = ctx.getTransform(), inv = m.inverse(), far = 4 * (canvas.width + canvas.height);
    const a = inv.transformPoint(new DOMPoint(far, 0)), o = inv.transformPoint(new DOMPoint(0, 0));
    ctx.translate(a.x - o.x, a.y - o.y);
    Object.assign(ctx, { shadowOffsetX: dx * scale - far, shadowOffsetY: dy * scale, shadowBlur: blur * scale, shadowColor: color, fillStyle: "#000", strokeStyle: "#000" });
    draw();
    ctx.restore();
  };
  return { canvas, ctx, shadow, scale };
}

// CSS linear-gradient(<deg>, stops) over the w×h box at (x, y).
function linear(ctx: Ctx, deg: number, w: number, h: number, stops: [number, string][], x = 0, y = 0) {
  const a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2, cx = x + w / 2, cy = y + h / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// Draws in a w×h box whose top-left sits at (x, y), turned `deg` around its centre (CSS `rotate`).
function box(ctx: Ctx, x: number, y: number, w: number, h: number, deg: number, draw: () => void) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(deg * Math.PI / 180);
  ctx.translate(-w / 2, -h / 2);
  draw();
  ctx.restore();
}

// Shadow offset (canvas px, y down) of a point `h` above the desk at canvas (x, y), cast by the lamp.
function castFrom(W: number, H: number, x: number, y: number, h: number) {
  const [lx, ly, lz] = lampAt(W, H), k = h / Math.max(1, lz - h);
  return [(x - W / 2 - lx) * k, -(H / 2 - y - ly) * k];
}

// Shadow of something standing on the desk: a tight dark contact shadow, then a softer one cast away from the lamp,
// swept along so tall things leave long shadows. `shape(t)` adds the footprint at fraction t of the cast.
function standing(s: Surface, W: number, H: number, x: number, y: number, h: number, shape: (p: Path2D, dx: number, dy: number) => void, dark = 1) {
  const [dx, dy] = castFrom(W, H, x, y, h);
  const contact = new Path2D(), cast = new Path2D();
  shape(contact, 0, 0);
  for (let t = 0; t <= 1; t += 1 / 8) shape(cast, dx * t, dy * t);
  s.shadow(0, 0, 3, `rgb(8 4 2 / ${0.55 * dark})`, () => s.ctx.fill(contact));
  s.shadow(0, 0, 6 + h * 0.18, `rgb(10 6 3 / ${0.42 * dark})`, () => s.ctx.fill(cast));
}

function paintTop(s: Surface, W: number, H: number, mobile: boolean, spot: Spot) {
  const { ctx } = s, L = deskLayout(W, H, mobile, spot);
  ctx.clearRect(0, 0, W, H);
  // Coffee rings: a darker rim where the coffee dried, a faint wash inside, broken where the mug was lifted.
  const r = rng(Math.round(spot.x * 1e6));
  const [ringX, ringY] = cupAt(spot);
  for (const [dx, dy, radius, start, end] of [[0, 0, 1.08, 0.2, 5.6], [0.014, -0.01, 0.98, 1.4, 5.9], [-0.006, 0.02, 1.02, 3.6, 7.4]] as const) {
    const x = (ringX + dx) * W, y = (ringY + dy) * H, R = W * spot.radius * radius;
    ctx.fillStyle = "rgb(70 34 12 / .05)";
    ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.fill();
    for (let a = start; a < end; a += 0.12) {
      ctx.strokeStyle = `rgb(58 26 8 / ${0.25 + r() * 0.35})`;
      ctx.lineWidth = Math.max(0.8, W * 0.0016 * (0.6 + r()));
      ctx.beginPath(); ctx.arc(x, y, R * (0.995 + r() * 0.01), a, a + 0.14); ctx.stroke();
    }
  }
  // Shadows of everything desk-gl.ts stands on the top.
  const c = L.cup;
  standing(s, W, H, c.x * W, c.y * H, c.d * 0.85, (p, dx, dy) => {
    p.moveTo(c.x * W + dx + c.d * 0.5, c.y * H + dy); p.arc(c.x * W + dx, c.y * H + dy, c.d * 0.5, 0, 2 * Math.PI);
    p.moveTo(c.x * W + dx - c.d * 0.5, c.y * H + dy); p.ellipse(c.x * W + dx - c.d * 0.62, c.y * H + dy, c.d * 0.16, c.d * 0.05, 0, 0, 2 * Math.PI); // handle
  });
  const plant = L.plant;
  standing(s, W, H, plant.x * W, plant.y * H, plant.r * 1.1, (p, dx, dy) => { p.moveTo(plant.x * W + dx + plant.r, plant.y * H + dy); p.arc(plant.x * W + dx, plant.y * H + dy, plant.r, 0, 2 * Math.PI); });
  standing(s, W, H, plant.x * W, plant.y * H, plant.r * 1.9, (p, dx, dy) => { p.moveTo(plant.x * W + dx + plant.r * 1.05, plant.y * H + dy); p.arc(plant.x * W + dx, plant.y * H + dy, plant.r * 1.05, 0, 2 * Math.PI); }, 0.6);
  for (const k of ["pencil", "pen"] as const) {
    const o = L[k], total = o.length + o.d * 5.2;
    standing(s, W, H, o.x * W, o.y * H, o.d, (p, dx, dy) => {
      const a = o.angle * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), half = total / 2, w = o.d / 2;
      p.moveTo(o.x * W + dx - ux * half - uy * w * 0.2, o.y * H + dy - uy * half + ux * w * 0.2);
      for (const [l, sw] of [[half, w], [half, -w], [-half + o.d * 2.6, -w], [-half, 0], [-half + o.d * 2.6, w]] as const)
        p.lineTo(o.x * W + dx + ux * l - uy * sw, o.y * H + dy + uy * l + ux * sw);
      p.closePath();
    }, 0.8);
  }
  const n = L.note;
  standing(s, W, H, n.x * W, n.y * H, 3, (p, dx, dy) => {
    const a = n.angle * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), h = n.size / 2;
    p.moveTo(n.x * W + dx + (-h * ux + h * uy), n.y * H + dy + (-h * uy - h * ux));
    for (const [lx, ly] of [[h, -h], [h, h * 0.4], [h * 0.4, h], [-h, h]]) p.lineTo(n.x * W + dx + lx * ux - ly * uy, n.y * H + dy + lx * uy + ly * ux);
    p.closePath();
  }, 0.7);
  // Paper clips stay painted: steel wire with a highlight, and their own hairline shadow.
  const clip = new Path2D("M28 30 V82 a10 10 0 0 1 -20 0 V18 a14 14 0 0 1 28 0 V72");
  for (const [x, y, deg] of [[0.61, 0.83, -24], [0.635, 0.8, 38]]) {
    box(ctx, W * x, H * y, W * 0.013, W * 0.0325, deg, () => {
      ctx.scale(W * 0.013 / 40, W * 0.013 / 40);
      ctx.save(); Object.assign(ctx, { shadowOffsetX: 1.5 * s.scale, shadowOffsetY: 2 * s.scale, shadowBlur: 2 * s.scale, shadowColor: "#000a" });
      ctx.strokeStyle = "#9fa3a8"; ctx.lineWidth = 5.5; ctx.stroke(clip); ctx.restore();
      ctx.strokeStyle = "#e4e7ea"; ctx.lineWidth = 2; ctx.stroke(clip);
    });
  }
}

// The sticky note's own texture (uv covers the square, text upright).
function paintNote({ ctx }: Surface, size: number, a?: Assets) {
  ctx.fillStyle = linear(ctx, 160, size, size, [[0, "#fff59a"], [0.7, "#f6e46c"], [1, "#e9d352"]]);
  ctx.fillRect(0, 0, size, size);
  // Adhesive strip along the top reads as a slightly darker, flatter band.
  ctx.fillStyle = "#c9b23a1c"; ctx.fillRect(0, 0, size, size * 0.18);
  if (!a) return;
  const px = Math.min(17, Math.max(9, innerWidth * 0.0135));
  ctx.fillStyle = "#28334f"; ctx.font = `700 ${px}px ${a.font}`; ctx.textBaseline = "middle";
  ["TODO:", "– more code", "– more coffe"].forEach((line, i) => ctx.fillText(line, px * 0.6, px * (0.7 + 1.15 * (i + 0.5))));
}

// Chalk hints; units are % of desk height. The phone set is drawn upright on the 100x185 screen and turned back onto the desk.
const CHALK_TEXT = {
  wide: { stroke: 0.45, size: 5.5, text: [["Meus artigos e", 50, 36, 1], ["selos dos visitantes", 50, 43, 1], ["Meus contatos", 8, 94], ["Meus eventos", 148, 94]],
    paths: ["M52 34 C58 31 62 31 66 29", "M30 88 C34 87 36 85 37 81", "M152 88 C150 82 147 79 143 77"] },
  phone: { stroke: 0.6, size: 6.5, text: [["Meus contatos", 12, 20], ["Meus artigos e", 3, 80], ["selos dos visitantes", 3, 87], ["Meus", 76, 128], ["eventos", 76, 135]],
    paths: ["M52 17 C60 16 62 22 60 28", "M42 76 C52 73 60 77 62 84", "M74 126 C70 125 68 128 67 132"] },
} as const;

function paintChalk({ ctx }: Surface, W: number, H: number, mobile: boolean, a: Assets) {
  const set = CHALK_TEXT[mobile ? "phone" : "wide"];
  ctx.save();
  ctx.scale(W / 185, W / 185);
  if (mobile) { ctx.translate(0, 100); ctx.rotate(-Math.PI / 2); }
  ctx.fillStyle = ctx.strokeStyle = "#f1eee4";
  ctx.lineCap = "round";
  ctx.font = `700 ${set.size}px ${a.font}`;
  for (const [text, x, y, end] of set.text) {
    ctx.textAlign = end ? "end" : "start";
    ctx.fillText(text, x, y);
  }
  for (const d of set.paths) {
    ctx.lineWidth = set.stroke;
    ctx.stroke(new Path2D(d));
    // Arrow head along the last curve's end tangent (SVG marker, markerWidth 5 of a 10-unit box, in stroke widths).
    const [x2, y2, x, y] = d.split(/[ C]+/).slice(-4).map(Number);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.atan2(y - y2, x - x2)); ctx.scale(set.stroke / 2, set.stroke / 2);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(0, 0); ctx.lineTo(-7, 4); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(a.grain, 0, 0, W, H);
}

// A worn Persian-style rug: abrash-banded field, lattice, medallion, guard borders and fringe; weave grain once the noise is in.
function paintRug(ctx: Ctx, x: number, y: number, w: number, h: number, grain?: HTMLImageElement) {
  const u = Math.min(w, h) / 100, r = rng(7);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, u); ctx.clip();
  ctx.fillStyle = "#5a231d"; ctx.fillRect(x, y, w, h);
  // Abrash: hand-dyed wool batches leave soft bands of slightly different red across the rug.
  for (let k = 0; k < 14; k++) {
    ctx.fillStyle = `rgb(${90 + r() * 26} ${30 + r() * 10} ${24 + r() * 8} / .5)`;
    ctx.fillRect(x + w * k / 14, y, w / 14 + 1, h);
  }
  const band = (inset: number, width: number, color: string) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.strokeRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset); };
  band(u * 3, u * 6, "#1d2333"); band(u * 6.6, u * 0.6, "#b9a47c"); band(u * 9.6, u * 5, "#232b3e"); band(u * 12.4, u * 0.6, "#b9a47c");
  // Small rosettes along the main border.
  const rosette = (px: number, py: number, s: number) => {
    ctx.fillStyle = "#8c6230"; ctx.beginPath(); ctx.moveTo(px - s, py); ctx.lineTo(px, py - s); ctx.lineTo(px + s, py); ctx.lineTo(px, py + s); ctx.fill();
    ctx.fillStyle = "#c2ad84"; ctx.beginPath(); ctx.arc(px, py, s * 0.3, 0, 2 * Math.PI); ctx.fill();
  };
  for (let t = u * 9.6; t < w - u * 9.6; t += u * 3.4) { rosette(x + t, y + u * 9.6, u * 1.3); rosette(x + t, y + h - u * 9.6, u * 1.3); }
  for (let t = u * 9.6; t < h - u * 9.6; t += u * 3.4) { rosette(x + u * 9.6, y + t, u * 1.3); rosette(x + w - u * 9.6, y + t, u * 1.3); }
  // Field lattice and a stepped medallion.
  ctx.save();
  ctx.beginPath(); ctx.rect(x + u * 13, y + u * 13, w - u * 26, h - u * 26); ctx.clip();
  ctx.strokeStyle = "#7a3229"; ctx.lineWidth = u * 0.45;
  for (let k = -h; k < w + h; k += u * 7) {
    ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + h, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); ctx.stroke();
  }
  const cx = x + w / 2, cy = y + h / 2;
  for (const [s, color] of [[1, "#1f2638"], [0.9, "#b29a6c"], [0.84, "#5e241d"], [0.56, "#263049"], [0.48, "#a88a55"], [0.3, "#5e241d"], [0.14, "#c2ad84"]] as const) {
    ctx.fillStyle = color; ctx.beginPath();
    const rx = w * 0.17 * s, ry = h * 0.25 * s;
    for (let i = 0; i < 16; i++) { // stepped lozenge
      const a = i / 16 * 2 * Math.PI, k = i % 2 ? 0.86 : 1;
      ctx.lineTo(cx + Math.cos(a) * rx * k * (1 - 0.35 * Math.abs(Math.sin(a))), cy + Math.sin(a) * ry * k * (1 - 0.35 * Math.abs(Math.cos(a))));
    }
    ctx.fill();
  }
  ctx.restore();
  // Traffic wear: the middle is lighter and flatter, the pile darker where furniture pressed it.
  const wear = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
  wear.addColorStop(0, "#e8c9a014"); wear.addColorStop(1, "#0000");
  ctx.fillStyle = wear; ctx.fillRect(x, y, w, h);
  if (grain) {
    ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(grain, x, y, w, h);
    ctx.drawImage(grain, x + w, y + h, -w, -h);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
  // Fringe on the short ends.
  ctx.strokeStyle = "#b8a98ab0"; ctx.lineWidth = u * 0.3;
  for (let k = y + u; k < y + h - u; k += u * 0.9)
    for (const [x0, dir] of [[x, -1], [x + w, 1]] as const) {
      ctx.beginPath(); ctx.moveTo(x0, k); ctx.lineTo(x0 + dir * u * (2.2 + Math.sin(k * 7.3) * 0.6), k + Math.sin(k) * u * 0.3); ctx.stroke();
    }
}

// Rug, cable and the shadows the desk, its legs and the bin throw on the floor. The floor canvas covers
// desk x ∈ [-1.1W, 1.1W], y ∈ [-1.3H, 1.3H]; its pixel (fx, fy) is desk (fx - 1.1W, 1.3H - fy).
function paintFloor(s: Surface, W: number, H: number, leg: number, drawerHeight: number, grain?: HTMLImageElement) {
  const { ctx } = s, fw = W * 2.2, fh = H * 2.6, floorZ = -12 - leg, [lx, ly, lz] = lampAt(W, H);
  ctx.clearRect(0, 0, fw, fh);
  paintRug(ctx, fw * 0.18, fh * 0.2, fw * 0.64, fh * 0.6, grain);
  const cable = new Path2D();
  cable.addPath(new Path2D("M44 38 C38 30 30 40 24 34 S14 20 2 24"), new DOMMatrix().scale(fw / 100, fh / 100));
  const cord = (path: Path2D) => {
    s.shadow(2, 3, 3, "#000a", () => { ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.strokeStyle = "#000"; ctx.stroke(path); });
    ctx.strokeStyle = "#141413"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke(path);
    ctx.strokeStyle = "#ffffff14"; ctx.lineWidth = 1.2; ctx.stroke(path);
  };
  cord(cable);

  // Lamp projection of a desk-space point onto the floor, in floor canvas px.
  const proj = (x: number, y: number, z: number) => {
    const k = (lz - floorZ) / (lz - z);
    return [lx + (x - lx) * k + fw / 2, fh / 2 - (ly + (y - ly) * k)];
  };
  const poly = (pts: number[][]) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
  // Ambient occlusion: the floor under the desk sees little of the room.
  const ao = poly([[-W * 0.5, -H * 0.5], [W * 0.5, -H * 0.5], [W * 0.5, H * 0.5], [-W * 0.5, H * 0.5]].map(([x, y]) => [x + fw / 2, fh / 2 - y]));
  s.shadow(0, 0, 70, "rgb(0 0 0 / .45)", () => ctx.fill(ao));
  // Cast: tabletop, drawer block and legs.
  const top = poly([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(([x, y]) => proj(x, y, -12)));
  const drawers = poly([[-0.42 * W, -0.43 * H], [0.42 * W, -0.43 * H], [0.42 * W, 0.2 * H], [-0.42 * W, 0.2 * H]].map(([x, y]) => proj(x, y, -24 - drawerHeight)));
  s.shadow(0, 0, 26, "rgb(0 0 0 / .5)", () => { ctx.fill(top); ctx.fill(drawers); });
  for (const [x, y] of legsAt(W, H)) {
    const foot = [x + fw / 2, fh / 2 - y], head = proj(x, y, -12);
    s.shadow(0, 0, 8, "rgb(0 0 0 / .55)", () => { ctx.lineWidth = 22; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(foot[0], foot[1]); ctx.lineTo(head[0], head[1]); ctx.stroke(); });
    s.shadow(0, 0, 4, "rgb(0 0 0 / .7)", () => { ctx.beginPath(); ctx.arc(foot[0], foot[1], 15, 0, 2 * Math.PI); ctx.fill(); });
  }
  const b = binAt(W, H, leg), bh = 0.4 * leg;
  const bf = [b.x + fw / 2, fh / 2 - b.y], bt = proj(b.x, b.y, floorZ + bh);
  s.shadow(0, 0, 6, "rgb(0 0 0 / .65)", () => { ctx.beginPath(); ctx.arc(bf[0], bf[1], b.r * 1.02, 0, 2 * Math.PI); ctx.fill(); });
  s.shadow(0, 0, 18, "rgb(0 0 0 / .4)", () => {
    ctx.beginPath(); ctx.arc(bt[0], bt[1], b.r, 0, 2 * Math.PI); ctx.fill();
    ctx.lineWidth = b.r * 2; ctx.beginPath(); ctx.moveTo(bf[0], bf[1]); ctx.lineTo(bt[0], bt[1]); ctx.stroke();
  });
  // Guitar on its back and the amp: contact shadows, the amp's cast, and the cable between them, run under the desk.
  const fl = ([x, y]: number[]) => [x + fw / 2, fh / 2 - y];
  const g = guitarAt(W, H, leg), gp = (pt: number[]) => fl(turnAt(pt, [g.x, g.y], g.angle, g.s));
  const outline = poly(GUITAR.body.map(gp)), neck = poly(GUITAR.neck.map(gp));
  s.shadow(0, 0, 5, "rgb(0 0 0 / .7)", () => ctx.fill(outline));
  s.shadow(0, 0, 10, "rgb(0 0 0 / .45)", () => ctx.fill(neck));
  const a = ampAt(W, H, leg), corners = (z: number) => poly([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => proj(a.x + u * a.w / 2, a.y + v * a.d / 2, z)));
  s.shadow(0, 0, 4, "rgb(0 0 0 / .75)", () => ctx.fill(corners(floorZ)));
  s.shadow(0, 0, 16, "rgb(0 0 0 / .45)", () => {
    ctx.fill(corners(floorZ + a.h));
    const [f, t] = [fl([a.x, a.y]), proj(a.x, a.y, floorZ + a.h)];
    ctx.lineWidth = Math.min(a.w, a.d); ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
  });
  const [jx, jy] = gp(GUITAR.jack), [ex, ey] = fl([a.x - a.w * 0.4, a.y - a.d / 2 - a.w * 0.03 - 4]);
  const lead = new Path2D(), [c1x, c1y] = fl([-0.42 * W, -0.36 * H]), [c2x, c2y] = fl([0.25 * W, -0.05 * H]);
  lead.moveTo(jx, jy); lead.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
  cord(lead);
  for (const ball of ballsAt(W, H)) {
    const [x, y] = [ball.x + fw / 2, fh / 2 - ball.y];
    s.shadow(2, 3, 5, "rgb(0 0 0 / .6)", () => { ctx.beginPath(); ctx.arc(x, y, ball.r * 0.8, 0, 2 * Math.PI); ctx.fill(); });
  }
}

// Furniture positions shared by the floor shadows and the meshes (desk space).
export const legsAt = (W: number, H: number) => [-1, 1].flatMap((x) => [0.42, -0.41].map((y) => [x * (W * 0.45 - 12.5), y * H]));
export const binAt = (W: number, H: number, leg: number) => ({ x: 0.69 * W, y: -0.31 * H, r: 0.06 * W, z: -12 - leg });
// The guitar lies left of the desk, neck to the back; the amp stands back right, beside the bin.
export const guitarAt = (W: number, H: number, leg: number) => ({ x: -0.665 * W, y: -0.25 * H, angle: 6, s: 0.5 * W / GUITAR.length, z: -12 - leg });
export const ampAt = (W: number, H: number, leg: number) => { const w = 0.11 * W; return { x: 0.635 * W, y: 0.4 * H, w, d: 0.075 * W, h: Math.min(0.85 * w, 0.5 * leg), z: -12 - leg }; };
export const ballsAt = (W: number, H: number) => [{ x: 0.528 * W, y: -0.572 * H, r: W * 0.0143 }, { x: 0.737 * W, y: -0.442 * H, r: W * 0.0121 }];

const load = (src: string) => {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
};

// Paints what it can right away; baked images and the hand font land later, then `ready` fires with the grime
// images for the wood bake and the finished canvases.
export function paintDesk(W: number, H: number, mobile: boolean, seed: number, leg: number, drawerHeight: number,
  ready: (grime: { dirt: HTMLImageElement; wear: HTMLImageElement }) => void) {
  const dpr = Math.min(devicePixelRatio, 2);
  const spot = coffeeSpot(rng(seed)), L = deskLayout(W, H, mobile, spot);
  const top = surface(W, H, Math.min(dpr, 2048 / W));
  const chalk = surface(W, H, Math.min(dpr, 2048 / W));
  const floor = surface(W * 2.2, H * 2.6, Math.min(dpr, 2048 / (W * 2.2)));
  const note = surface(L.note.size, L.note.size, dpr * 1.5);
  paintTop(top, W, H, mobile, spot);
  paintFloor(floor, W, H, leg, drawerHeight);
  paintNote(note, L.note.size);

  let live = true;
  const font = getComputedStyle(document.body).getPropertyValue("--font-hand-title") || "cursive";
  // Loading baked textures waits for idle so the intro has priority.
  const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
  idle(() => Promise.all([
    load("/textures/baked/dirt.webp"), load("/textures/baked/wear.webp"),
    load("/textures/baked/chalk.webp"), // Best effort: next/font's fallback face is `local(Arial)`, which rejects on machines without Arial.
    document.fonts.load(`700 16px ${font}`).catch(() => {}),
  ]).then(([dirt, wear, grain]) => {
    if (!live) return;
    const assets = { grain, font };
    paintChalk(chalk, W, H, mobile, assets);
    paintNote(note, L.note.size, assets);
    paintFloor(floor, W, H, leg, drawerHeight, grain);
    ready({ dirt, wear });
  }));

  return { top: top.canvas, chalk: chalk.canvas, floor: floor.canvas, note: note.canvas, spot, layout: L, cancel: () => { live = false; } };
}
