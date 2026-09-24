import { LAYERS, layerUrl, rng, type Layer } from "@/components/ui/grime";

// Flat desk surfaces painted once into 2D canvases, then uploaded as WebGL textures. Sizes are CSS px of the desk.
export type Spot = { radius: number; x: number; y: number };
const coffeeSpot = (r: () => number): Spot => ({ radius: 0.038 + r() * 0.008, x: 0.87 + r() * 0.05, y: 0.12 + r() * 0.08 });
// Cup centre, as a fraction of desk width / height; its diameter is 2 * radius of the desk width.
export const cupAt = (s: Spot) => [s.x - s.radius * 1.8, s.y + 0.035];

// Coffee-cup rings: one spot where the mug always goes, 1–4 overlapping rings, mostly broken arcs like dried stains.
// ponytail: spot kept on the right half, since the card lands on the left.
const COFFEE: Layer = {
  blend: "multiply", opacity: 0.8,
  filter: `<feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" seed="S"/>
    <feDisplacementMap in="SourceGraphic" scale="5"/>
    <feGaussianBlur stdDeviation=".7"/>`,
  body: (w, h, r) => {
    const spot = coffeeSpot(r);
    const R = w * spot.radius, cx = w * spot.x, cy = h * spot.y;
    let rings = "";
    for (let n = 1 + Math.floor(r() * 4); n--; ) {
      const rad = R * (0.95 + r() * 0.1), c = 2 * Math.PI * rad, arc = c * (0.55 + r() * 0.45);
      rings += `<circle cx="${(cx + (r() - 0.5) * R * 0.7).toFixed(1)}" cy="${(cy + (r() - 0.5) * R * 0.7).toFixed(1)}" r="${rad.toFixed(1)}"
        fill-opacity="${(0.05 + r() * 0.12).toFixed(2)}" stroke-width="${(1.2 + r() * 2.3).toFixed(1)}" stroke-opacity="${(0.45 + r() * 0.45).toFixed(2)}"
        stroke-dasharray="${arc.toFixed(1)} ${c.toFixed(1)}" stroke-dashoffset="${(r() * c).toFixed(1)}"/>`;
    }
    // The empty rect makes the filter box span the whole image, so the wobble isn't clipped at the rings' bounds.
    return `<g fill="#6b3f1d" stroke="#3a1d0b" filter="url(#f)"><rect width="100%" height="100%" fill="none" stroke="none"/>${rings}</g>`;
  },
};
// Card grime minus grease: its light smears read as bleached patches on the dark wood.
const [DIRT, , WEAR] = LAYERS;
// Chalk grain: noise alpha, applied with destination-in.
const CHALK: Layer = { filter: `<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.2 -1"/>` };

type Ctx = CanvasRenderingContext2D;
type Assets = { dirt: HTMLImageElement; wear: HTMLImageElement; coffee: HTMLImageElement; grain: HTMLImageElement; font: string };

function surface(w: number, h: number, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  // Canvas shadows ignore the transform, so they're scaled by hand.
  const shadow = (x: number, y: number, blur: number, color: string) =>
    Object.assign(ctx, { shadowOffsetX: x * scale, shadowOffsetY: y * scale, shadowBlur: blur * scale, shadowColor: color });
  return { canvas, ctx, shadow };
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

function paintTop({ ctx, shadow }: ReturnType<typeof surface>, W: number, H: number, mobile: boolean, spot: Spot, a?: Assets) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = linear(ctx, 95, W, H, [[0, "#493326"], [0.32, "#654938"], [0.68, "#58402e"], [1, "#3d2b20"]]);
  ctx.fillRect(0, 0, W, H);
  for (let y = H; y > 0; y -= 13) {
    ctx.fillStyle = "#120b051c"; ctx.fillRect(0, y - 1, W, 1);
    ctx.fillStyle = "#c3a0730b"; ctx.fillRect(0, y - 7, W, 2);
  }
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 180); ctx.fillStyle = "#21130935";
  for (let y = -H; y < H; y += 91) ctx.fillRect(-W, y + 42.5, 2 * W, 2);
  ctx.restore();
  ctx.fillStyle = linear(ctx, 105, W, H, [[0, "#ffffff09"], [0.45, "#ffffff00"], [0.45, "#00000000"], [1, "#0003"]]);
  ctx.fillRect(0, 0, W, H);

  if (a) {
    for (const [img, l] of [[a.dirt, DIRT], [a.wear, WEAR], [a.coffee, COFFEE]] as const) {
      ctx.globalCompositeOperation = l.blend as GlobalCompositeOperation;
      ctx.globalAlpha = l.opacity ?? 1;
      ctx.drawImage(img, 0, 0, W, H);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  // Worn, darker rim (Grime's inset shadow) and the lit edge.
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.clip();
  ctx.beginPath(); ctx.rect(-100, -100, W + 200, H + 200); ctx.roundRect(0, 0, W, H, 14);
  shadow(0, 0, 18, "rgb(58 42 26 / .35)"); ctx.fill("evenodd");
  ctx.restore();
  ctx.strokeStyle = "#c09b6b40"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.stroke();

  // Cup shadow; the cup itself is 3D.
  const [cx, cy] = cupAt(spot), D = W * spot.radius * 2;
  ctx.save();
  shadow(9, 12, 12, "#160c0870"); ctx.fillStyle = "#160c0880";
  ctx.beginPath(); ctx.arc(cx * W, cy * H, D * 0.47 + 2, 0, 2 * Math.PI); ctx.fill();
  ctx.restore();

  ctx.save();
  box(ctx, W * 0.11, H * 0.17, W * 0.17, H * 0.014, 16, () => { // pencil
    const w = W * 0.17, h = H * 0.014;
    ctx.save();
    shadow(3, 5, 3, "#15100a90");
    ctx.fillStyle = linear(ctx, 180, w, h, [[0, "#f7c948"], [0.45, "#e8a91c"], [1, "#b9800e"]]);
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, [0, 2, 2, 0]); ctx.fill();
    ctx.restore();
    ctx.fillStyle = linear(ctx, 90, h * 2.4, h, [[0.18, "#333"], [0.2, "#e8c9a0"]], -h * 2.4);
    ctx.beginPath(); ctx.moveTo(-h * 2.4, h / 2); ctx.lineTo(0, 0); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = linear(ctx, 90, h * 2.6, h, [[0, "#bdbdb6"], [0.3, "#eee"], [0.55, "#999"], [0.6, "#bdbdb6"], [0.62, "#e58c8a"], [1, "#d77471"]], w);
    ctx.beginPath(); ctx.roundRect(w, 0, h * 2.6, h, [0, 3, 3, 0]); ctx.fill();
  });
  box(ctx, W * 0.9, H * 0.5, W * 0.14, H * 0.011, 78, () => { // pen
    const w = W * 0.14, h = H * 0.011;
    ctx.save();
    shadow(3, 5, 3, "#15100a90");
    ctx.fillStyle = linear(ctx, 180, w, h, [[0, "#3b4b6b"], [0.6, "#1b2438"], [1, "#0e1320"]]);
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, Math.PI / 2, Math.PI * 1.5); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.fill();
    ctx.restore();
    ctx.fillStyle = linear(ctx, 180, w * 0.3, h * 0.45, [[0, "#eee"], [1, "#999"]], w * 0.64, -h * 0.3);
    ctx.beginPath(); ctx.roundRect(w * 0.64, -h * 0.3, w * 0.3, h * 0.45, 2); ctx.fill();
  });
  const note = W * 0.085;
  box(ctx, W * 0.5, H * 0.7, note, note, mobile ? -84 : 5, () => { // sticky note
    ctx.fillStyle = linear(ctx, 160, note, note, [[0, "#fff59a"], [0.7, "#f5e36a"], [1, "#e8d24f"]]);
    for (const [x, y, blur, color] of [[1, 2, 1, "#0003"], [4, 8, 8, "#130b0866"]] as const) {
      ctx.save(); shadow(x, y, blur, color); ctx.fillRect(0, 0, note, note); ctx.restore();
    }
    if (!a) return;
    const size = Math.min(17, Math.max(9, innerWidth * 0.0135));
    ctx.fillStyle = "#28334f"; ctx.font = `700 ${size}px ${a.font}`; ctx.textBaseline = "middle";
    ["TODO:", "– more code", "– more coffe"].forEach((line, i) => ctx.fillText(line, size * 0.6, size * (0.7 + 1.15 * (i + 0.5))));
  });
  const clip = new Path2D("M28 30 V82 a10 10 0 0 1 -20 0 V18 a14 14 0 0 1 28 0 V72");
  for (const [x, y, deg] of [[0.61, 0.83, -24], [0.635, 0.8, 38]]) {
    box(ctx, W * x, H * y, W * 0.013, W * 0.0325, deg, () => { // paper clips
      ctx.scale(W * 0.013 / 40, W * 0.013 / 40);
      shadow(1, 2, 1, "#000a");
      ctx.strokeStyle = "#c9ccd0"; ctx.lineWidth = 5; ctx.stroke(clip);
    });
  }
  ctx.restore();
}

// Chalk hints; units are % of desk height. The phone set is drawn upright on the 100x185 screen and turned back onto the desk.
const CHALK_TEXT = {
  wide: { stroke: 0.45, size: 5.5, text: [["Meus artigos e", 50, 36, 1], ["selos dos visitantes", 50, 43, 1], ["Meus contatos", 8, 94], ["Meus eventos", 148, 94]],
    paths: ["M52 34 C58 31 62 31 66 29", "M30 88 C34 87 36 85 37 81", "M152 88 C150 82 147 79 143 77"] },
  phone: { stroke: 0.6, size: 6.5, text: [["Meus contatos", 12, 20], ["Meus artigos e", 3, 80], ["selos dos visitantes", 3, 87], ["Meus", 76, 128], ["eventos", 76, 135]],
    paths: ["M52 17 C60 16 62 22 60 28", "M42 76 C52 73 60 77 62 84", "M74 126 C70 125 68 128 67 132"] },
} as const;

function paintChalk({ ctx }: ReturnType<typeof surface>, W: number, H: number, mobile: boolean, a: Assets) {
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

// Plank floor with a rug and a cable, fading out towards its edges.
function paintFloor({ ctx, shadow }: ReturnType<typeof surface>, w: number, h: number) {
  const plank = w * 0.0625;
  for (let i = 0; i * plank < w; i++) {
    ctx.fillStyle = ["#2c2722", "#26211d", "#302a24"][i % 3];
    ctx.fillRect(i * plank, 0, plank + 1, h);
    ctx.fillStyle = "#0b0a09";
    ctx.fillRect(i * plank, 0, 2, h);
  }
  ctx.fillStyle = "#0000000d";
  for (let y = h; y > 0; y -= 11) ctx.fillRect(0, y - 4, w, 1);

  const rw = w * 0.64, rh = h * 0.6, rx = (w - rw) / 2, ry = (h - rh) / 2;
  const rect = (inset: number, r: number) => { ctx.beginPath(); ctx.roundRect(rx + inset, ry + inset, rw - 2 * inset, rh - 2 * inset, r); };
  ctx.save(); shadow(0, 6, 18, "#0008"); ctx.fillStyle = "#3a1a16"; rect(-20, 26); ctx.fill(); ctx.restore();
  ctx.fillStyle = "#5c2b24"; rect(-12, 18); ctx.fill();
  ctx.fillStyle = linear(ctx, 180, rw, rh, [[0, "#7a3a2e"], [1, "#6b3027"]], rx, ry); rect(2, 4); ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.translate(w / 2, h / 2);
  for (const [turn, color] of [[1, "#ffffff08"], [-1, "#0000001a"]] as const) {
    ctx.save(); ctx.rotate(turn * Math.PI / 4); ctx.fillStyle = color;
    for (let x = -w; x < w; x += 20) ctx.fillRect(x + 18, -w, 2, 2 * w);
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = "#d9c9a133"; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); rect(2.5, 4); ctx.stroke(); ctx.setLineDash([]);

  const cable = new Path2D();
  cable.addPath(new Path2D("M44 38 C38 30 30 40 24 34 S14 20 2 24"), new DOMMatrix().scale(w / 100, h / 100));
  ctx.save(); shadow(2, 3, 2, "#0009"); ctx.strokeStyle = "#0e0e0d"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke(cable); ctx.restore();

  ctx.globalCompositeOperation = "destination-in";
  ctx.translate(w / 2, h / 2); ctx.scale(w / 2, h / 2);
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fade.addColorStop(0.45, "#000"); fade.addColorStop(0.95, "#0000");
  ctx.fillStyle = fade; ctx.fillRect(-1, -1, 2, 2);
}

function paintDrawers({ ctx }: ReturnType<typeof surface>, w: number, h: number) {
  ctx.fillStyle = "#231910"; ctx.fillRect(0, 0, w, h);
  const pw = (w - 10) / 2;
  for (const x of [3, 7 + pw]) {
    ctx.fillStyle = linear(ctx, 100, pw, h - 6, [[0, "#493326"], [0.5, "#59402f"], [1, "#3a291e"]], x, 3);
    ctx.fillRect(x, 3, pw, h - 6);
    ctx.fillStyle = "#171815"; ctx.beginPath(); ctx.roundRect(x + pw * 0.405, 23, pw * 0.19, 5, 3); ctx.fill();
    ctx.fillStyle = "#8e8b7444"; ctx.fillRect(x + pw * 0.405 + 2, 28, pw * 0.19 - 4, 1);
  }
}

const load = (src: string) => {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
};

// Paints what it can right away; noise images and the hand font land later, then `ready` fires with the finished top and chalk.
export function paintDesk(W: number, H: number, mobile: boolean, seed: number, drawerHeight: number, ready: () => void) {
  const dpr = Math.min(devicePixelRatio, 2);
  const top = surface(W, H, Math.min(dpr, 4096 / W));
  const chalk = surface(W, H, Math.min(dpr, 4096 / W));
  const floor = surface(W * 2.2, H * 2.6, Math.min(dpr, 2048 / (W * 2.2)));
  const drawers = surface(W * 0.84, drawerHeight, dpr);
  const spot = coffeeSpot(rng(seed));
  paintTop(top, W, H, mobile, spot);
  paintFloor(floor, W * 2.2, H * 2.6);
  paintDrawers(drawers, W * 0.84, drawerHeight);

  let live = true;
  const font = getComputedStyle(document.body).getPropertyValue("--font-hand-title") || "cursive";
  // The SVG noise rasterizes on the main thread; wait for idle so it can't stutter the intro.
  const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
  idle(() => Promise.all([
    load(layerUrl(DIRT, W, H, seed)), load(layerUrl(WEAR, W, H, seed + 101)), load(layerUrl(COFFEE, W, H, seed)),
    load(layerUrl(CHALK, W, H, 0)), // Best effort: next/font's fallback face is `local(Arial)`, which rejects on machines without Arial.
    document.fonts.load(`700 16px ${font}`).catch(() => {}),
  ]).then(([dirt, wear, coffee, grain]) => {
    if (!live) return;
    const assets = { dirt, wear, coffee, grain, font };
    paintTop(top, W, H, mobile, spot, assets);
    paintChalk(chalk, W, H, mobile, assets);
    ready();
  }));

  return { top: top.canvas, chalk: chalk.canvas, floor: floor.canvas, drawers: drawers.canvas, spot, cancel: () => { live = false; } };
}
