"use client";

import { useEffect, useRef, useState } from "react";
import { getRunBoard, setRunName, submitRun } from "@/lib/runs";
import { rng } from "@/lib/rng";
import { track } from "@/lib/track";
import { act, BASE, covers, fresh, LANE, MAX, score, step, top, type Action, type Kind, type Ob, type Run } from "./runner";
import * as audio from "./run-audio";
import { device, RUN_TIERS, TIERS } from "./stamp";
import room from "./paper-toss.module.css";
import styles from "./desk-run.module.css";

// Portrait viewport in canvas px; CSS scales it up with `image-rendering: pixelated`.
// Camera: CAMD behind the ladybug, looking down the desk; F is the focal length in px, HOR the horizon row.
const W = 120, H = 160, F = 80, CAMD = 5, HOR = 46, CX = W / 2, NEAR = 0.6, FAR = 80;
const KEYS: Record<string, Action> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump", ArrowDown: "slide", KeyS: "slide",
};
const CRASH: Record<Kind, string> = {
  pencil: "Tropeçou no lápis", clip: "Enroscou no clipe", cord: "Bateu no cordão do crachá", postit: "Colou no post-it",
  mug: "Trombou na caneca", notebook: "Bateu no caderno", ruler: "Escorregou da régua", stain: "Escorregou no café",
};

type Cam = { x: number; y: number };
type RGB = [number, number, number];
const hex = (c: string): RGB => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as RGB;
const EDGE = 4.4;
const WOOD = hex("#8f5b33"), WOOD_DARK = hex("#5e3a20"), FLOOR = hex("#17120e"), FOG = hex("#241a13");
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// One plank per lane plus a margin of desk either side, seen from just behind the ladybug; past its edges, the dark floor far below.
function ground(img: ImageData, dist: number, cam: Cam) {
  const d = img.data;
  for (let sy = HOR + 1; sy < H; sy++) {
    const zc = (cam.y * F) / (sy - HOR), s = F / zc, z = dist + zc - CAMD, fog = Math.min(1, zc / FAR) ** 0.8;
    for (let sx = 0; sx < W; sx++) {
      const x = cam.x + (sx - CX) / s, i = (sy * W + sx) * 4;
      let c: RGB;
      if (Math.abs(x) > EDGE) c = FLOOR;
      else {
        const plank = Math.floor((x + 3) / LANE), seam = Math.abs(x + 3 - Math.round((x + 3) / LANE) * LANE) * s;
        const grain = Math.sin(x * 11 + Math.sin(z * 0.23 + plank * 2.1) * 2.2 + plank * 5) * 0.5 + 0.5;
        const joint = (((z + plank * 9.7) % 26) + 26) % 26 < 0.12 + 0.6 / s;
        c = mix(WOOD, WOOD_DARK, grain * 0.45 + (Math.abs(x) > EDGE - 0.08 ? 0.6 : 0));
        if (seam < 0.6 || joint) c = WOOD_DARK;
      }
      c = mix(c, FOG, fog);
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, img: ImageData, r: Run, cam: Cam, now: number) {
  ctx.putImageData(img, 0, 0);
  // The room beyond the desk: dark wall, warm lamp glow over the far end.
  const sky = ctx.createLinearGradient(0, 0, 0, HOR);
  sky.addColorStop(0, "#0c0a08"); sky.addColorStop(1, "#2a1f17");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HOR + 1);
  ctx.fillStyle = "#3a2b1f55"; ctx.beginPath(); ctx.ellipse(CX, HOR, 46, 14, 0, Math.PI, 0); ctx.fill();

  const proj = (x: number, y: number, z: number) => {
    const zc = z - r.dist + CAMD, s = F / zc;
    return [Math.round(CX + (x - cam.x) * s), Math.round(HOR + (cam.y - y) * s), s] as const;
  };
  const poly = (pts: (readonly [number, number, number])[], color: string) => {
    ctx.fillStyle = color; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
  };
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  // A box from x0..x1, y0..y1, z0..z1 (world), cut at the near plane; faces drawn back to front.
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, [front, lid, side]: string[]) => {
    const near = r.dist - CAMD + NEAR;
    if (z1 < near) return null;
    const cut = z0 < near;
    z0 = Math.max(z0, near);
    if (x1 < cam.x) poly([proj(x1, y0, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x1, y0, z1)], side);
    if (x0 > cam.x) poly([proj(x0, y0, z0), proj(x0, y1, z0), proj(x0, y1, z1), proj(x0, y0, z1)], side);
    if (y1 < cam.y) poly([proj(x0, y1, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x0, y1, z1)], lid);
    const [ax, ay, s] = proj(x0, y1, z0), [bx, by] = proj(x1, y0, z0);
    if (!cut) rect(ax, ay, bx - ax, by - ay, front);
    return { x: ax, y: ay, w: bx - ax, h: by - ay, s, cut };
  };

  const shadow = (x: number, z: number, w: number) => {
    const [sx, sy, s] = proj(x, 0, z);
    if (z - r.dist + CAMD < NEAR) return;
    ctx.fillStyle = "#00000044"; ctx.beginPath(); ctx.ellipse(sx, sy, w * s, w * s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  };

  function obstacle(o: Ob) {
    const lx = o.lane * LANE, z = o.z;
    switch (o.kind) {
      case "pencil": {
        shadow(lx, z + 0.35, 1);
        const f = box(lx - 0.9, lx + 0.9, 0, 0.55, z, z + 0.7, ["#e8b83a", "#f6d36a", "#a87a1c"]);
        if (f && !f.cut) {
          rect(f.x, f.y, f.w * 0.12, f.h, "#e7cfa2"); rect(f.x, f.y + f.h * 0.3, f.w * 0.04, f.h * 0.4, "#3a3a3a");
          rect(f.x + f.w * 0.84, f.y, f.w * 0.05, f.h, "#c9ccd1"); rect(f.x + f.w * 0.89, f.y, f.w * 0.11, f.h, "#e58a9a");
          rect(f.x + f.w * 0.12, f.y + f.h * 0.45, f.w * 0.72, 1, "#c8962a");
        }
        return;
      }
      case "clip": {
        const [ax, ay, s] = proj(lx - 0.45, 0.7, z), [bx, by] = proj(lx + 0.45, 0, z);
        if (z - r.dist + CAMD < NEAR) return;
        const t = Math.max(1, s * 0.09);
        for (const [i, c] of [[0, "#d7dbe0"], [0.22, "#9aa0a8"]] as const) {
          const k = i * s, x0 = ax + k, x1 = bx - k, y0 = ay + k, y1 = by;
          rect(x0, y0, x1 - x0, t, c); rect(x0, y0, t, y1 - y0, c); rect(x1 - t, y0, t, y1 - y0, c);
        }
        return;
      }
      case "cord": {
        if (z - r.dist + CAMD < NEAR) return;
        const [ax, ay, s] = proj(lx - 1, 0.95, z), [bx, by] = proj(lx + 1, 0.6, z), [, topY] = proj(lx, 3.4, z);
        rect(ax, topY, Math.max(1, s * 0.06), ay - topY, "#1b2a6b"); rect(bx - Math.max(1, s * 0.06), topY, Math.max(1, s * 0.06), ay - topY, "#1b2a6b");
        rect(ax, ay, bx - ax, by - ay, "#2346b8"); rect(ax, ay, bx - ax, Math.max(1, (by - ay) * 0.25), "#4a6be0");
        const [cx, cy] = proj(lx, 2.3, z), cw = s * 0.7, ch = s * 0.9;
        rect(cx - cw / 2, cy, cw, ch, "#f4f1ea"); rect(cx - cw / 2, cy + ch * 0.35, cw, ch * 0.4, "#2346b8");
        return;
      }
      case "postit": {
        shadow(lx, z + 0.2, 1);
        const f = box(lx - 0.9, lx + 0.9, 0, 2.6, z, z + 0.4, ["#f2e27a", "#f8ee9e", "#c9b84c"]);
        if (f && !f.cut) for (let i = 0; i < 3; i++) rect(f.x + f.w * 0.15, f.y + f.h * (0.22 + i * 0.18), f.w * (0.7 - i * 0.15), Math.max(1, f.s * 0.08), "#6b6a63");
        return;
      }
      case "mug": {
        const cx = lx + 1;
        shadow(cx, z + 1.6, 2);
        const f = box(cx - 1.8, cx + 1.8, 0, 3.2, z, z + 3.2, ["#ece3d2", "#3a2414", "#cfc4ae"]);
        if (f && !f.cut) {
          rect(f.x, f.y, f.w * 0.12, f.h, "#d6ccb8"); rect(f.x + f.w * 0.88, f.y, f.w * 0.12, f.h, "#cdbfa6"); rect(f.x + f.w * 0.3, f.y, f.w * 0.1, f.h, "#f7f1e6");
          rect(f.x, f.y, f.w, Math.max(1, f.s * 0.12), "#f7f1e6");
          const hw = f.s * 0.6, hx = f.x + f.w, hy = f.y + f.h * 0.25, t = Math.max(1, f.s * 0.16);
          rect(hx, hy, hw, t, "#e2d8c4"); rect(hx + hw - t, hy, t, f.h * 0.45, "#e2d8c4"); rect(hx, hy + f.h * 0.45 - t, hw, t, "#e2d8c4");
        }
        return;
      }
      case "notebook": {
        const f = box(lx - 0.9, lx + 0.9, 0, 2.2, z, z + o.d, ["#efe7d2", "#1f3a68", "#16294a"]);
        // The label and the elastic band on the cover.
        if (2.2 < cam.y) {
          const zs = Math.max(z + 2.5, r.dist - CAMD + NEAR);
          if (zs < z + 5.5) poly([proj(lx - 0.6, 2.2, zs), proj(lx + 0.6, 2.2, zs), proj(lx + 0.6, 2.2, z + 5.5), proj(lx - 0.6, 2.2, z + 5.5)], "#f1ede2");
          const zb = z + 9;
          if (zb - r.dist + CAMD > NEAR) poly([proj(lx - 0.9, 2.2, zb), proj(lx + 0.9, 2.2, zb), proj(lx + 0.9, 2.2, zb + 0.3), proj(lx - 0.9, 2.2, zb + 0.3)], "#0e0e10");
        }
        if (f && !f.cut) {
          rect(f.x, f.y, f.w, Math.max(1, f.h * 0.1), "#1f3a68"); rect(f.x, f.y + f.h * 0.9, f.w, Math.max(1, f.h * 0.1), "#1f3a68");
          for (let i = 1; i < 6; i++) rect(f.x, f.y + f.h * (0.1 + i * 0.13), f.w, 1, "#d6ccb4");
        }
        return;
      }
      case "ruler": {
        const near = r.dist - CAMD + NEAR;
        if (z + o.d < near) return;
        const z0 = Math.max(z, near), y0 = top(o, z0);
        poly([proj(lx - 0.8, y0, z0), proj(lx + 0.8, y0, z0), proj(lx + 0.8, o.hi, z + o.d), proj(lx - 0.8, o.hi, z + o.d)], "#d9c48f");
        for (let k = Math.ceil(z0 * 2) / 2; k < z + o.d; k += 0.5) {
          const [ax, ay] = proj(lx - 0.8, top(o, k), k), [bx] = proj(lx - (Number.isInteger(k) ? 0.3 : 0.55), 0, k);
          rect(ax, ay, bx - ax, 1, "#6e5a33");
        }
        return;
      }
      case "stain": {
        if (z - r.dist + CAMD < NEAR) return;
        ctx.fillStyle = "#3b2312dd"; ctx.beginPath();
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2, wob = 1 + 0.15 * Math.sin(i * 2.7 + z);
          const [x, y] = proj(lx + Math.cos(a) * 0.85 * wob, 0, z + o.d / 2 + Math.sin(a) * (o.d / 2) * wob);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.fill();
        return;
      }
    }
  }

  function pickup(i: Run["items"][number]) {
    if (i.taken || i.z - r.dist + CAMD < NEAR) return;
    const [x, y, s] = proj(i.lane * LANE, i.y + Math.sin(now * 4 + i.z) * 0.08, i.z);
    const u = Math.max(1, s * 0.12);
    if (i.kind === "drop") {
      rect(x - u, y - u * 3, u * 2, u, "#6cc4f0"); rect(x - u * 2, y - u * 2, u * 4, u * 3, "#6cc4f0"); rect(x - u, y + u, u * 2, u, "#3f97c9");
      rect(x - u, y - u, u, u, "#e2f6ff");
    } else if (i.kind === "sun") {
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + now * 2; rect(x + Math.cos(a) * u * 4 - u / 2, y + Math.sin(a) * u * 4 - u / 2, u, u, "#ffd84a"); }
      rect(x - u * 2, y - u * 2, u * 4, u * 4, "#ffc21f"); rect(x - u, y - u, u, u, "#fff3b0");
    } else {
      for (let k = 0; k < 4; k++) rect(x - u * 2 + (k % 2) * u * 2, y - u * 3 + k * u * 1.5, u * 2, u, "#c9ccd1");
      rect(x - u * 2, y + u * 3, u * 4, u, "#8d939b");
    }
  }

  // Far to near; whatever is fully behind the ladybug (between her and the camera) goes after her.
  const key = (z: number, d: number) => (z + d > r.dist ? Math.max(z, r.dist + 0.01) : z + d);
  const things: [number, () => void][] = [
    ...r.obs.map((o) => [key(o.z, o.d), () => obstacle(o)] as [number, () => void]),
    ...r.items.map((i) => [key(i.z, 0), () => pickup(i)] as [number, () => void]),
    [r.dist, () => ladybug(ctx, r, proj, now)],
  ];
  things.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
  if (r.chase > 0 || r.over === "caught") paw(ctx, r, proj, now);
}

type Proj = (x: number, y: number, z: number) => readonly [number, number, number];

// Seen from behind: red shell with black spots, an echeveria leaf held overhead like a parasol, six legs scurrying.
function ladybug(ctx: CanvasRenderingContext2D, r: Run, proj: Proj, now: number) {
  const [gx, gy] = proj(r.x, groundUnder(r), r.dist), [px, py0] = proj(r.x, r.y, r.dist);
  const shake = r.bump > 0 ? Math.round(Math.sin(now * 80)) : 0, px2 = px + shake, py = py0;
  const dot = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(px2 + x, py + y, w, h); };
  ctx.fillStyle = "#00000055"; ctx.beginPath(); ctx.ellipse(gx, gy, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  const oval = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    ctx.fillStyle = c;
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y / (ry + 0.5)) ** 2)); ctx.fillRect(px2 + cx - w, py + cy + y, w * 2, 1); }
  };
  if (r.over === "front") {
    // On her back, legs in the air, the leaf dropped beside her.
    oval(0, -5, 8, 4, "#1d1a1a");
    for (let i = 0; i < 3; i++) { const k = Math.round(Math.sin(now * 20 + i)); dot(-6 + i * 5, -11 + k, 1, 3, "#1d1a1a"); }
    leaf(ctx, px2 + 12, py - 2, 0.6, now, true);
    return;
  }
  const low = r.slide > 0, run = r.vy === 0 ? Math.floor(now * 14) % 2 : 0, ry = low ? 3 : 6, cy = low ? -4 : -7;
  for (let i = 0; i < 3; i++) {
    const lift = (i + run) % 2;
    dot(-9, cy + 1 + i * 2 - lift, 2, 1, "#1d1a1a"); dot(7, cy + 1 + i * 2 - (1 - lift), 2, 1, "#1d1a1a");
  }
  oval(0, cy, 8, ry, "#9e2a20");
  oval(0, cy - 1, 8, ry - 1, "#d23a2c");
  dot(0, cy - ry, 1, ry * 2, "#1d1a1a");
  for (const [x, y] of [[-5, -0.5], [3, -0.5], [-4, 0.4], [3, 0.4]]) dot(x, Math.round(cy + y * ry * 1.4), 2, 2, "#1d1a1a");
  dot(-5, cy - ry + 1, 2, 1, "#f27b68");
  leaf(ctx, px2, py + (low ? -9 : -16), low ? 0.8 : 1, now, false);
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, now: number, fallen: boolean) {
  const sway = fallen ? 0 : Math.round(Math.sin(now * 9));
  const L = Math.round(8 * k);
  for (let i = -L; i <= L; i++) {
    const t = (i + L) / (2 * L), h = Math.max(1, Math.round(3.2 * k * Math.sin(Math.PI * Math.pow(t, 0.8))));
    ctx.fillStyle = t > 0.82 ? "#b8606f" : "#5f8f6c";
    ctx.fillRect(x + i, y - h + Math.round(sway * (i / L)), 1, h * 2);
    if (t > 0.1 && t < 0.8) { ctx.fillStyle = "#8fb898"; ctx.fillRect(x + i, y - h + Math.round(sway * (i / L)), 1, 1); }
  }
}

// The cat's paw creeps up from behind while she's being chased; it lands on her if she's caught.
function paw(ctx: CanvasRenderingContext2D, r: Run, proj: Proj, now: number) {
  const [px, py] = proj(r.x, r.y, r.dist);
  const caught = r.over === "caught", x = Math.round(caught ? px : px + Math.sin(now * 3) * 6), y = caught ? py - 22 : H - 16 + Math.round(Math.sin(now * 6) * 3);
  const rect = (dx: number, dy: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
  rect(-13, 4, 26, 40, "#e9e4dc"); rect(-11, 0, 22, 6, "#e9e4dc"); rect(-13, 14, 26, 3, "#bdb5a8"); rect(-13, 24, 26, 3, "#bdb5a8");
  for (const dx of [-10, -3, 4]) rect(dx, 2, 6, 5, "#e79aa6");
  rect(-7, 10, 14, 9, "#e79aa6");
}

const groundUnder = (r: Run) => {
  let g = 0;
  for (const o of r.obs) if (covers(o, r.lane) && o.lo === 0 && o.z <= r.dist && o.z + o.d >= r.dist && top(o, r.dist) <= r.y + 0.01) g = Math.max(g, top(o, r.dist));
  return g;
};

// Sounds come from what changed in the run, so the game logic stays silent (and testable in node).
type Before = { lane: number; vy: number; y: number; slide: number; slip: number; drops: number; magnet: number; spring: number; bump: number; chase: number };
const snapshot = (r: Run): Before => ({ lane: r.lane, vy: r.vy, y: r.y, slide: r.slide, slip: r.slip, drops: r.drops, magnet: r.magnet, spring: r.spring, bump: r.bump, chase: r.chase });
function listen(r: Run, b: Before) {
  const { sfx } = audio;
  if (r.lane !== b.lane) sfx.lane();
  if (r.vy > b.vy + 5 && b.vy === 0) { if (r.spring > 0) sfx.boing(); else sfx.jump(); }
  else if (b.vy < -8 && r.vy === 0) sfx.land();
  if (r.slide > b.slide + 0.1) sfx.slide();
  if (r.drops > b.drops) sfx.drop(r.drops);
  if (r.magnet > b.magnet + 0.1) sfx.sun();
  if (r.spring > b.spring + 0.1) sfx.spring();
  if (r.slip > 0 && b.slip === 0) sfx.slip();
  if (r.bump > b.bump) sfx.bump();
  if (r.chase > b.chase + 0.1) sfx.meow();
  if (r.over === "caught") sfx.swat();
  else if (r.over) sfx.crash();
}

type Board = Awaited<ReturnType<typeof getRunBoard>>;
type Phase = "ready" | "running" | "paused" | "over";

function Game({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<{ start: () => void; pause: (p: boolean) => void } | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ cm: 0, drops: 0, best: 0, magnet: 0, spring: 0, chase: false });
  const [end, setEnd] = useState({ score: 0, line: "", record: false });
  const [board, setBoard] = useState<Board>();
  const [note, setNote] = useState("");
  const [sound, setSound] = useState(() => !audio.muted());
  const toggleSound = () => setSound((on) => { audio.setMuted(on); return !on; });

  useEffect(() => {
    audio.unlock();
    audio.play("garden");
    // M toggles the sound anywhere in the game.
    const mute = (e: KeyboardEvent) => { if (e.code === "KeyM" && !e.repeat && !(e.target instanceof HTMLInputElement)) toggleSound(); };
    addEventListener("keydown", mute);
    return () => { removeEventListener("keydown", mute); audio.stop(); };
  }, []);

  useEffect(() => {
    dialog.current!.showModal();
    const el = canvas.current!, ctx = el.getContext("2d")!, img = ctx.createImageData(W, H);
    const steady = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let r = fresh(rng(Date.now() | 0), { steady }), state: Phase = "ready", best = 0, frame = 0, then = performance.now(), shown = "";
    const cam: Cam = { x: 0, y: 5 };
    track("game", "desk-run");
    const load = () => getRunBoard(device()).then((b) => { best = Math.max(best, b.me.best); setBoard(b); setHud((h) => ({ ...h, best })); }).catch(() => {});
    load();

    const set = (p: Phase) => { state = p; setPhase(p); };
    function finish() {
      const s = score(r), record = s > best;
      setEnd({ score: s, record, line: r.over === "caught" ? "A pata do gato pegou a joaninha" : CRASH[r.hit ?? "pencil"] });
      track("score", "desk-run", { cm: Math.floor(r.dist), drops: r.drops, score: s });
      if (record && s > 0) { best = s; submitRun(device(), s).then(load, () => {}); }
      audio.stop();
      // The crash first, then the tune for how it went, then back to the windowsill tune.
      setTimeout(() => { if (state === "over") (record && s > 0 ? audio.sfx.record : audio.sfx.over)(); }, 400);
      setTimeout(() => { if (state === "over") audio.play("garden"); }, 2200);
      set("over");
    }

    function tick(now: number) {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      if (state === "running") {
        const before = snapshot(r);
        step(r, dt);
        listen(r, before);
        audio.play("run", 1 + 0.4 * (r.speed - BASE) / (MAX - BASE));
        if (r.over) finish();
      }
      // The camera trails her across lanes and rises a little when she's up on the notebook.
      cam.x += (r.x * 0.45 - cam.x) * Math.min(1, dt * 8);
      cam.y += (5 + groundUnder(r) * 0.6 - cam.y) * Math.min(1, dt * 6);
      ground(img, r.dist, cam);
      draw(ctx, img, r, cam, now / 1000);
      const h = { cm: Math.floor(r.dist), drops: r.drops, best, magnet: Math.ceil(r.magnet), spring: Math.ceil(r.spring), chase: r.chase > 0 };
      const k = JSON.stringify(h);
      if (k !== shown) { shown = k; setHud(h); }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    game.current = {
      start: () => { audio.unlock(); audio.sfx.start(); r = fresh(rng(Date.now() | 0), { steady }); set("running"); el.focus(); },
      pause: (p) => {
        if (p && state === "running") { set("paused"); audio.stop(); }
        else if (!p && state === "paused") { audio.unlock(); set("running"); el.focus(); }
      },
    };
    const press = (e: KeyboardEvent) => {
      const a = KEYS[e.code];
      if (!a) return;
      e.preventDefault();
      if (e.repeat) return;
      if (state === "running") { const before = snapshot(r); act(r, a); listen(r, before); }
      else if (a === "jump" && state !== "over") game.current!.start();
    };
    // Swipes act as soon as the finger has travelled far enough, not on release, like the original.
    let swipe: { x: number; y: number; used: boolean } | null = null;
    const down = (e: PointerEvent) => { swipe = { x: e.clientX, y: e.clientY, used: false }; };
    const move = (e: PointerEvent) => {
      if (!swipe || swipe.used || state !== "running") return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      if (Math.hypot(dx, dy) < 22) return;
      swipe.used = true;
      const before = snapshot(r);
      act(r, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "jump" : "slide");
      listen(r, before);
    };
    const up = () => { swipe = null; };
    const hide = () => { if (document.hidden) game.current?.pause(true); };
    addEventListener("keydown", press);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("keydown", press);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  const saveName = async (form: FormData) => {
    try {
      const name = await setRunName(device(), String(form.get("name")));
      setBoard(await getRunBoard(device()));
      setNote(`Salvo como ${name}.`);
    } catch {
      setNote("Não deu para salvar. Tenta de novo?");
    }
  };

  return (
    <dialog ref={dialog} className={`${room.room} ${styles.room}`} aria-label="Corrida na Mesa" onClose={onClose} onPointerDown={audio.unlock}>
      <p className={`${room.hud} ${styles.hud}`}>
        <span>{hud.cm} cm</span>
        <span>💧 {hud.drops}</span>
        <span>Recorde {hud.best}</span>
        {hud.magnet > 0 && <span className={styles.power}>☀ {hud.magnet}</span>}
        {hud.spring > 0 && <span className={styles.power}>⇈ {hud.spring}</span>}
        {hud.chase && <span className={styles.chase}>O gato!</span>}
        <button type="button" className={styles.sound} aria-pressed={sound} onClick={toggleSound} title="Som (M)">{sound ? "♪ Som" : "♪ Mudo"}</button>
      </p>
      <div className={room.table}>
        <div className={styles.frame}>
          <canvas ref={canvas} className={`${room.court} ${styles.track}`} width={W} height={H} tabIndex={-1}
            aria-label="A joaninha corre pela mesa com a folha da suculenta. Setas ou deslizar: trocar de faixa, pular e abaixar" />
          {phase !== "running" && (
            <div className={styles.overlay}>
              {phase === "ready" && <>
                <p className={styles.title}>Corrida na Mesa</p>
                <p className={styles.story}>Uma folha caiu da suculenta. A joaninha vai levá-la para brotar longe daqui, antes que o gato a pegue.</p>
                <button type="button" onClick={() => game.current?.start()}>Correr</button>
              </>}
              {phase === "paused" && <button type="button" onClick={() => game.current?.pause(false)}>Continuar</button>}
              {phase === "over" && <>
                <p className={styles.title}>{end.line}</p>
                <p>{end.score} pontos{end.record && <><br /><b className={styles.record}>Novo recorde!</b></>}</p>
                <button type="button" onClick={() => game.current?.start()}>Correr de novo</button>
              </>}
            </div>
          )}
        </div>
        <aside className={room.board}>
          <h2>Top 10</h2>
          <ol>
            {board?.top.map((p, i) => <li key={i}><span>{p.name}</span><span>{p.best}</span></li>)}
            {board && !board.top.length && <li>Ninguém ainda. Seja o primeiro!</li>}
          </ol>
          <form action={saveName}>
            <label htmlFor="run-name">Seu nome no placar</label>
            <span>
              <input id="run-name" name="name" required maxLength={20} defaultValue={board?.me.name ?? ""} key={board?.me.name ?? ""} autoComplete="nickname" />
              <button type="submit">Salvar</button>
            </span>
            {note && <small role="status">{note}</small>}
          </form>
          <small>Pontos são centímetros corridos mais 10 por gota. Seu recorde melhora o selo do caderno: {RUN_TIERS[0]} deixam ele {TIERS[1]}, {RUN_TIERS[1]} deixam ele {TIERS[2]}.</small>
        </aside>
      </div>
      <p className={room.hint}>← → trocar de faixa · ↑ pular · ↓ abaixar · M som · no celular, deslize</p>
      <button type="button" className={room.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the succulent on the desk (drawn in WebGL) gets an invisible button on top that opens the runner.
export default function DeskRun() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.plant} aria-label="Suculenta" onClick={() => { audio.unlock(); setOpen(true); }} />
      {open && <Game onClose={() => setOpen(false)} />}
    </>
  );
}
