"use client";

import { Pirata_One } from "next/font/google";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadCastle, saveCastle } from "@/lib/castle";
import { countStamp } from "@/lib/stamps";
import { track } from "@/lib/track";
import { ARENA, BOSS_HP, HP, PW, STAGES, T, WIND, beanShare, fresh, lash, loot, merge, retry, step, tileAt, validProgress, type Game, type Input, type Progress } from "./platformer";
import room from "./paper-toss.module.css";
import * as audio from "./castle-audio";
import { dive } from "./desk-dive";
import { device } from "./stamp";
import styles from "./coffee-run.module.css";

// Blackletter for the title card, loaded only with the castle.
const gothic = Pirata_One({ subsets: ["latin"], weight: "400" });

// Viewport in canvas px; CSS scales it up with `image-rendering: pixelated`.
const W = 192, H = 14 * T;
const KEYS: Record<string, keyof Input> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump", KeyZ: "jump", KeyX: "whip", KeyJ: "whip", KeyK: "whip",
};
const idle = (): Input => ({ left: false, right: false, jump: false, whip: false });
// One palette per stage, from the night gate to the last cup.
const LOOK = [
  { sky: "#17132e", far: "#262043", stone: "#5a5570", mortar: "#3c3852", top: "#7d7894" },
  { sky: "#140f0c", far: "#2a1f17", stone: "#5b4636", mortar: "#3a2c22", top: "#7a624d" },
  { sky: "#0e1822", far: "#1b2a38", stone: "#4d5a66", mortar: "#323c46", top: "#6f7d8a" },
  { sky: "#102521", far: "#24483c", stone: "#506b5b", mortar: "#304b3c", top: "#8ca98d" },
  { sky: "#29130d", far: "#542719", stone: "#76503b", mortar: "#4b2b20", top: "#c07842" },
  { sky: "#1d1022", far: "#3d2442", stone: "#67546e", mortar: "#40344c", top: "#b394b5" },
];

// Progress lives in localStorage (instant, offline) and in the database under a random key kept next to it.
const KEY = "cafe-castle-key", SAVE = "cafe-castle-progress";
const uuid = () => crypto.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
function key() {
  let k = localStorage.getItem(KEY);
  if (!k) localStorage.setItem(KEY, (k = uuid()));
  return k;
}
export function readLocal(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE) ?? "");
    if (validProgress(p)) return p;
  } catch {}
  return { cleared: 0, best: [] };
}
function store(p: Progress, remote = true) {
  localStorage.setItem(SAVE, JSON.stringify(p));
  if (remote) saveCastle(key(), p).catch(() => {});
}

function draw(ctx: CanvasRenderingContext2D, g: Game) {
  const look = LOOK[g.stage], map = STAGES[g.stage].map, LW = map[0].length * T;
  const cam = Math.round(Math.max(0, Math.min(LW - W, g.x - W / 2)));
  const now = g.t, wave = Math.floor(performance.now() / 200) % 4;
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x) - cam, Math.round(y), w, h); };
  ctx.fillStyle = look.sky; ctx.fillRect(0, 0, W, H);

  // Far layer scrolls slower than the level.
  ctx.fillStyle = look.far;
  if (g.stage === 0) {
    ctx.fillStyle = "#e9e2c4"; ctx.fillRect(150, 10, 12, 12); ctx.fillRect(149, 12, 14, 8); ctx.fillStyle = look.sky; ctx.fillRect(155, 11, 6, 7);
    ctx.fillStyle = look.far;
    for (let x = -((cam * 0.3) % 96); x < W; x += 96) {
      ctx.fillRect(x, 50, 40, 60); ctx.fillRect(x + 6, 34, 10, 20); ctx.fillRect(x + 26, 28, 10, 26); ctx.fillRect(x + 60, 60, 30, 50); ctx.fillRect(x + 70, 44, 8, 20);
      for (const tx of [6, 26, 70]) for (let i = 0; i < 3; i++) ctx.fillRect(x + tx + i * 4, tx === 26 ? 25 : tx === 6 ? 31 : 41, 2, 3);
    }
  } else if (g.stage === 1) {
    for (let y = 16; y < H; y += 6) for (let x = -((cam * 0.5) % 16) + (y % 12 ? 8 : 0) - 16; x < W; x += 16) ctx.fillRect(x, y, 15, 5);
    ctx.fillStyle = "#3b2a1c";
    for (let x = -((cam * 0.5) % 120); x < W; x += 120) { ctx.fillRect(x + 20, 70, 18, 26); ctx.fillRect(x + 40, 76, 18, 20); ctx.fillStyle = "#2a1d13"; ctx.fillRect(x + 20, 78, 18, 2); ctx.fillRect(x + 40, 84, 18, 2); ctx.fillStyle = "#3b2a1c"; }
  } else if (g.stage === 2) {
    const cx = 130 - ((cam * 0.2) % 400), cy = 40;
    for (let a = 0; a < 12; a++) ctx.fillRect(cx + Math.cos(a / 6 * Math.PI) * 26 - 2, cy + Math.sin(a / 6 * Math.PI) * 26 - 2, 4, 4);
    ctx.fillRect(cx - 1, cy - 18, 2, 18); ctx.fillRect(cx, cy - 1, 12, 2);
    for (let x = -((cam * 0.4) % 70); x < W; x += 70) { const r = (performance.now() / 600 + x) % 6; for (let a = 0; a < 8; a++) ctx.fillRect(x + 20 + Math.cos(a / 4 * Math.PI + r) * 10 - 2, 90 + Math.sin(a / 4 * Math.PI + r) * 10 - 2, 4, 4); }
  } else if (g.stage === 3) {
    for (let x = -((cam * 0.3) % 48); x < W; x += 48) {
      ctx.fillRect(x + 20, 22, 3, 68); ctx.fillRect(x + 8, 32, 26, 2);
      ctx.fillStyle = "#3e7050"; ctx.fillRect(x + 4, 25, 34, 12); ctx.fillRect(x + 10, 18, 22, 12); ctx.fillStyle = look.far;
    }
  } else if (g.stage === 4) {
    for (let x = -((cam * 0.4) % 64); x < W; x += 64) {
      ctx.fillRect(x + 8, 40, 30, 58); ctx.fillRect(x + 12, 31, 22, 9);
      ctx.fillStyle = "#d47b32"; ctx.fillRect(x + 16, 62 + wave, 14, 18 - wave); ctx.fillStyle = look.far;
    }
  } else {
    for (let x = -((cam * 0.25) % 56); x < W; x += 56) {
      ctx.fillRect(x + 5, 24, 6, 76); ctx.fillRect(x + 39, 24, 6, 76); ctx.fillRect(x + 5, 21, 40, 4);
      ctx.fillStyle = "#9a617a"; ctx.fillRect(x + 14, 30, 22, 30); ctx.fillStyle = look.far;
    }
  }

  for (let cy = 0; cy < map.length; cy++) for (let cx = Math.floor(cam / T); cx <= (cam + W) / T; cx++) {
    const c = tileAt(g.stage, cx, cy), x = cx * T, y = cy * T, taken = g.got.has(`${cx},${cy}`);
    if (c === "#") {
      rect(x, y, T, T, look.stone); rect(x, y + 3, T, 1, look.mortar); rect(x, y + 7, T, 1, look.mortar);
      rect(x + (cy % 2 ? 2 : 6), y, 1, 3, look.mortar); rect(x + (cy % 2 ? 5 : 1), y + 4, 1, 3, look.mortar);
      if (tileAt(g.stage, cx, cy - 1) !== "#") rect(x, y, T, 1, look.top);
    }
    if (c === "=") { rect(x, y, T, 3, look.top); rect(x, y + 3, T, 1, look.mortar); rect(x + 3, y + 4, 2, 2, look.mortar); }
    if (c === "~") { rect(x, y, T, T, "#4a2511"); rect(x + ((cx + wave) % 4) * 2, y + 1, 3, 1, "#8b5a34"); if ((cx + wave) % 3 === 0) rect(x + 3, y - 1 - (wave % 2), 2, 2, "#8b5a34"); }
    if (c === "o" && !taken) { rect(x + 2, y + 2, 4, 5, "#5a3013"); rect(x + 1, y + 3, 1, 3, "#5a3013"); rect(x + 6, y + 3, 1, 3, "#5a3013"); rect(x + 4, y + 3, 1, 3, "#2d1608"); }
    if (c === "i" && !taken) {
      rect(x + 2, y + 7, 4, 1, "#b08d57"); rect(x + 3, y + 4, 2, 3, "#efe6cf");
      rect(x + 3, y + 1 + (wave % 2), 2, 3 - (wave % 2), "#ff9a3c"); rect(x + 3, y + 3, 1, 1, "#ffe08a");
    }
    if (c === "D") {
      rect(x - 1, y - 9, T + 2, 17, look.top); rect(x, y - 8, T, 16, "#3a2414"); rect(x + 1, y - 9, T - 2, 1, look.top);
      rect(x + 3, y - 6, 2, 3, "#ffcc55"); rect(x + 5, y, 1, 2, "#b08d57");
    }
  }

  // Bones burst out of a hit skeleton, away from the whip, and tumble under gravity; a dead one scatters with its skull.
  const bones = (f: Game["foes"][number], t: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const vx = f.kick * (25 + (i % 3) * 18) + Math.cos(i * 2.4) * 20, vy = -80 - (i % 4) * 22;
      const x = f.x + 3 + vx * t, y = f.y + 5 + vy * t + 200 * t * t;
      if (i === 0 && f.dead) { rect(x - 1, y - 1, 3, 3, "#e6e2d3"); rect(x, y, 1, 1, "#1a1a1a"); }
      else if (Math.floor(t * 14 + i) % 2) rect(x - 1, y, 3, 1, "#e6e2d3"); else rect(x, y - 1, 1, 3, "#e6e2d3");
    }
  };
  for (const f of g.foes) {
    if (f.dead && f.kind === "skel") { if (f.t < 0.9) bones(f, f.t, 8); continue; }
    if (f.dead) { if (f.t < 0.3) for (let i = 0; i < 4; i++) rect(f.x + 3 + Math.cos(i * 1.6) * f.t * 30, f.y + 5 + Math.sin(i * 1.6) * f.t * 30, 2, 2, "#ff9a3c"); continue; }
    if (f.kind === "bat") {
      const up = Math.floor(f.t * 8) % 2;
      rect(f.x + 2, f.y + 2, 3, 3, "#6b3f8f"); rect(f.x + 2, f.y + 3, 1, 1, "#ff4b4b"); rect(f.x + 4, f.y + 3, 1, 1, "#ff4b4b");
      rect(f.x, f.y + (up ? 0 : 3), 2, 2, "#8a4fb8"); rect(f.x + 5, f.y + (up ? 0 : 3), 2, 2, "#8a4fb8");
    } else if (f.kind === "count") {
      // He trembles with golden eyes while winding up an attack, each with its own tell: crouching with a flared cape
      // before a dash, raising a brewing coffee orb before a cast, spreading his cape like wings before calling bats.
      // He turns crimson in his rage and leaves smoke when he blinks.
      const b = g.boss, wind = b.t < WIND && (b.act === "dash" || b.act === "cast" || b.act === "bats") ? b.act : null;
      if (b.act === "blink") { for (let i = 0; i < 6; i++) rect(f.x + 3 + Math.cos(i * 1.1) * b.t * 30, f.y + 6 + Math.sin(i * 1.1) * b.t * 18, 2, 2, "#6b4a73"); continue; }
      const x = f.x + (wind ? Math.floor(now * 30) % 2 : 0), eye = wind ? "#ffd36b" : "#e83f48", y = f.y + (wind === "dash" ? 3 : 0);
      const coat = f.ouch < 0.15 ? "#ff8a7a" : f.hp <= BOSS_HP / 2 ? "#5a1428" : "#301b33";
      if (b.act === "dash" && !wind) rect(x - b.dir * 5, f.y + 5, 4, 7, "#171019");
      if (wind === "dash") { rect(x - b.dir * 6, y + 1, 5, 4, "#171019"); rect(x - b.dir * 3 + Math.floor(now * 20) % 3, f.y + 12, 2, 1, "#8a7a6a"); }
      if (wind === "bats") { const up = Math.floor(now * 10) % 2; rect(x - 5, y + 2 + up, 5, 5, "#171019"); rect(x + 6, y + 2 + up, 5, 5, "#171019"); }
      rect(x - 1, y - 3, 8, 2, "#171019"); rect(x + 1, y - 6, 4, 3, "#171019");
      rect(x + 1, y, 4, 4, "#d5a281"); rect(x + 2, y + 2, 1, 1, eye); rect(x + 4, y + 2, 1, 1, eye);
      rect(x, y + 4, 6, 13 - (y - f.y) - 4, coat); rect(x + 2, y + 4, 2, 7 - (y - f.y), "#a63345");
      if (wind === "cast") {
        const hand = x + (b.dir > 0 ? 6 : -2), r = 1 + Math.floor((b.t / WIND) * 3);
        rect(hand, y - 2, 2, 6, coat); rect(hand + 1 - (r >> 1), y - 3 - r, r, r, "#4a2511"); rect(hand + 1 - (r >> 1), y - 3 - r, 1, 1, "#c98a4b");
      }
    } else {
      if (f.ouch < 0.6) bones(f, f.ouch, 3);
      const bone = f.ouch < 0.15 ? "#ff8a7a" : "#e6e2d3", left = f.vx < 0, step = Math.floor(f.x / 3) % 2;
      rect(f.x + 1, f.y, 4, 4, bone); rect(f.x + (left ? 1 : 3), f.y + 1, 1, 2, "#1a1a1a");
      rect(f.x + 2, f.y + 4, 2, 5, bone); for (let r = 5; r < 9; r += 2) rect(f.x, f.y + r, 6, 1, bone);
      rect(f.x + 1 + step, f.y + 9, 1, 4, bone); rect(f.x + 4 - step, f.y + 9, 1, 4, bone);
    }
  }

  for (const s of g.shots) { rect(s.x, s.y, 3, 3, "#4a2511"); rect(s.x + 1, s.y, 1, 1, "#c98a4b"); }
  // Once the Count wakes, iron gates close his hall and his health runs along the top.
  const count = g.foes.find((f) => f.kind === "count" && !f.dead);
  if (count && g.boss.act !== "sleep") {
    for (const x of [count.home - ARENA - 2, count.home + ARENA]) { rect(x, T, 2, count.y + 13 - T, "#2a2230"); for (let y = T + 4; y < count.y + 13; y += 12) rect(x - 1, y, 4, 1, "#2a2230"); }
    ctx.fillStyle = "#542536"; ctx.fillRect(46, 4, 100, 3);
    ctx.fillStyle = "#e34c55"; ctx.fillRect(46, 4, Math.ceil((count.hp / BOSS_HP) * 100), 3);
  }

  // Hero: a hunter in a coffee-brown coat. Blinks while invulnerable.
  if (!(g.hurt > 0 && Math.floor(now * 20) % 2)) {
    const spr = (dx: number, dy: number, w: number, h: number, color: string) => rect(g.face > 0 ? g.x + dx : g.x + PW - dx - w, g.y + dy, w, h, color);
    const walk = g.ground && g.vx ? Math.floor(g.x / 4) % 2 : 0;
    spr(1, 0, 4, 2, "#6b3b1f"); spr(1, 2, 4, 3, "#e8b48a"); spr(3, 3, 1, 1, "#1a1a1a"); spr(0, 1, 1, 3, "#6b3b1f");
    spr(0, 5, 6, 5, g.state === "dead" ? "#b43c3c" : "#7a2e1f"); spr(0, 8, 6, 1, "#3a2414");
    spr(1, 10, 2, 3 - walk, "#3b2a20"); spr(3, 10, 2, 3 - (1 - walk), "#3b2a20");
    const whip = lash(g);
    if (whip) { rect(whip.x, g.y + 5, whip.w, 1, "#c9a36b"); rect(g.face > 0 ? whip.x + whip.w - 2 : whip.x, g.y + 4, 2, 2, "#fff4d6"); }
    else if (g.whip > 0) spr(-5, 0, 6, 1, "#c9a36b");
  }
}

// The prologue, one caption at a time under the title (timed in coffee-run.module.css: 3.5s in, 3s each).
const PROLOGUE = [
  "Toda manhã, a Brasa da Aurora torrava o café que fazia o sol nascer.",
  "Até a noite em que o Conde D'arábica a roubou para o seu castelo.",
  "Desde então o relógio parou, as xícaras esfriaram e a madrugada não acaba.",
  "Esta noite, um caçador sobe a colina. A última xícara será servida.",
];
const ease = (x: number) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// Fixed pseudo-random numbers, so stars and windows stay put between frames.
const hash = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

// Title scene: out of the coffee, a stormy night, the moon behind the castle (its tallest tower is a steaming cup), bats
// and the hunter walking up the hill to the gate. `t` is seconds since the dive; `calm` drops lightning and motion.
function drawIntro(ctx: CanvasRenderingContext2D, t: number, calm: boolean) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const ring = (cx: number, cy: number, r: number, color: string) => { for (let a = 0, n = Math.max(8, r * 6); a < n; a++) rect(cx + Math.cos(a / n * 6.283) * r, cy + Math.sin(a / n * 6.283) * r * 0.6, 1, 1, color); };
  ctx.globalAlpha = 1;

  // Sky in dithered bands, from deep night to the red glow over the horizon.
  const SKY = ["#0b0716", "#130a20", "#1d0e28", "#2b1129", "#3f1527", "#5a1c22"];
  for (let i = 0; i < SKY.length; i++) {
    const y = i * 14;
    rect(0, y, W, 14, SKY[i]);
    if (i) for (let x = (y / 2) % 2; x < W; x += 2) { rect(x, y, 1, 1, SKY[i - 1]); rect(x + 1, y + 1, 1, 1, SKY[i - 1]); }
  }
  rect(0, 84, W, H - 84, SKY[SKY.length - 1]);

  // Lightning: a soft lift of the whole sky (never a white flash) plus a jagged bolt, every few seconds.
  const k = (t - 4.4) % 5.2, flash = calm || t < 4.4 ? 0 : k < 0.12 ? 1 : k > 0.22 && k < 0.3 ? 0.6 : 0;
  if (flash) {
    ctx.globalAlpha = 0.22 * flash; rect(0, 0, W, 84, "#b9a6d6"); ctx.globalAlpha = 1;
    let x = 30 + hash(Math.floor((t - 4.4) / 5.2)) * 50, y = 0;
    while (y < 62) { const nx = x + (hash(x * 3 + y) - 0.5) * 10, ny = y + 4 + hash(y + x) * 5; for (let s = 0; s < 6; s++) rect(x + (nx - x) * s / 6, y + (ny - y) * s / 6, 1, 1, "#efe6ff"); x = nx; y = ny; }
  }

  for (let i = 0; i < 40; i++) {
    const on = calm || hash(i + Math.floor(t * 2 + i)) > 0.15;
    if (on) rect(hash(i) * W, hash(i + 99) * 60, 1, 1, hash(i + 7) > 0.8 ? "#fff4d6" : "#8a7aa8");
  }

  // The moon rises over the graveyard.
  const my = 52 + 14 * (1 - ease(t / 4)), mx = 54;
  ctx.globalAlpha = 0.12; for (let dy = -20; dy <= 20; dy++) { const w = Math.sqrt(400 - dy * dy); rect(mx - w, my + dy, w * 2, 1, "#f1e6c8"); } ctx.globalAlpha = 1;
  for (let dy = -15; dy <= 15; dy++) { const w = Math.sqrt(225 - dy * dy); rect(mx - w, my + dy, w * 2, 1, "#efe2c0"); }
  for (const [cx, cy, s] of [[-6, -4, 4], [4, 3, 5], [-2, 8, 3], [7, -8, 2]]) rect(mx + cx, my + cy, s, s - 1, "#d6c49c");

  // Clouds drift across the moon.
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 5; i++) {
    const w = 40 + hash(i) * 50, x = ((hash(i + 3) * 300 - t * (4 + i * 1.5)) % 300 + 300) % 300 - 60, y = 12 + i * 9;
    rect(x, y, w, 3, "#1a0f24"); rect(x + 6, y - 2, w - 14, 2, "#1a0f24");
  }
  ctx.globalAlpha = 1;

  // Bats cross the sky, flapping.
  for (let i = 0; i < 5; i++) {
    const x = ((t * (22 + i * 5) + i * 53) % 260) - 30, y = 22 + i * 7 + Math.sin(t * 3 + i) * 5, up = Math.floor(t * 9 + i) % 2;
    rect(x + 2, y + 1, 3, 2, "#0d0912"); rect(x, y + (up ? 0 : 2), 2, 1, "#0d0912"); rect(x + 5, y + (up ? 0 : 2), 2, 1, "#0d0912");
  }

  // The castle on its cliff, one silhouette colour; its keep's tallest tower ends in a cup.
  const ink = "#07050c";
  const roof = (x: number, y: number, w: number, h: number) => { for (let r = 0; r < h; r++) { const half = Math.ceil((w / 2) * (r + 1) / h); rect(x + w / 2 - half, y + r, half * 2, 1, ink); } };
  const merlons = (x: number, y: number, w: number) => { for (let i = 0; i < w; i += 4) rect(x + i, y - 2, 2, 2, ink); };
  for (let x = 84; x < W; x += 4) rect(x, 68 + Math.round(6 - (x - 84) / 18) + (hash(x) > 0.6 ? 1 : 0), 4, H, ink);
  rect(116, 46, 58, 30, ink); merlons(116, 46, 58);
  rect(100, 52, 12, 24, ink); roof(98, 38, 16, 14);
  rect(176, 40, 12, 36, ink); roof(174, 24, 16, 16);
  rect(124, 40, 10, 8, ink); roof(122, 30, 14, 10);
  rect(160, 34, 9, 14, ink); merlons(160, 34, 9);
  rect(139, 34, 14, 14, ink); merlons(139, 34, 14);
  rect(137, 22, 18, 9, ink); rect(138, 31, 16, 1, ink); rect(155, 24, 3, 1, ink); rect(157, 24, 1, 5, ink); rect(155, 28, 3, 1, ink);
  if (!calm) for (let i = 0; i < 6; i++) { const y = 20 - ((t * 6 + i * 3) % 16); ctx.globalAlpha = 0.5 * (1 - (20 - y) / 16); rect(140 + i * 2.4 + Math.sin(t * 2 + i + y / 3) * 2, y, 1, 2, "#e8dcc8"); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) {
    const wx = [104, 108, 120, 128, 145, 145, 152, 164, 180, 182, 132, 168][i], wy = [58, 64, 54, 44, 38, 42, 54, 56, 48, 60, 62, 40][i];
    ctx.globalAlpha = calm ? 0.9 : 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7); rect(wx, wy, 1, 2, hash(i + 40) > 0.3 ? "#ffcc55" : "#ff8a3c");
  }
  ctx.globalAlpha = 1;
  rect(104, 66, 8, 10, "#1b0d08"); rect(105, 65, 6, 1, "#1b0d08"); rect(106, 64, 4, 1, "#1b0d08");
  for (let x = 105; x < 112; x += 2) rect(x, 66, 1, 9, "#3a2414");

  // Foreground hill with a dead tree, crosses and the path up to the gate.
  for (let x = 0; x < 112; x++) rect(x, 86 - Math.round(Math.max(0, x - 64) / 4) + (x < 20 ? Math.round((20 - x) / 7) : 0), 1, H, "#040207");
  rect(16, 56, 2, 30, "#040207"); rect(10, 62, 7, 1, "#040207"); rect(9, 61, 2, 1, "#040207"); rect(17, 66, 8, 1, "#040207"); rect(24, 64, 1, 2, "#040207"); rect(13, 58, 1, 4, "#040207");
  for (const cx of [34, 46, 58]) { rect(cx, 80, 1, 6, "#040207"); rect(cx - 2, 82, 5, 1, "#040207"); }

  // Fog rolling over the hill.
  for (let i = 0; i < 6; i++) {
    const x = ((i * 47 + t * (6 + i)) % 280) - 60, y = 86 + (i % 3) * 5;
    ctx.globalAlpha = 0.1; rect(x, y, 70, 4, "#a596c0"); rect(x + 10, y - 2, 46, 2, "#a596c0");
  }
  ctx.globalAlpha = 1;

  // The hunter walks up to the gate and stops to look at it.
  const walking = !calm && t > 1.4 && t < 7.4, hx = calm ? 76 : -8 + 84 * ease((t - 1.4) / 6), hy = 86 - Math.round(Math.max(0, hx + 3 - 64) / 4) - 13;
  const legs = walking ? Math.floor(t * 6) % 2 : 0;
  rect(hx + 1, hy, 4, 2, "#140a06"); rect(hx + 1, hy + 2, 4, 3, "#140a06"); rect(hx, hy + 1, 1, 3, "#140a06");
  rect(hx, hy + 5, 6, 5, "#160807"); rect(hx - 1 + (walking ? legs : 0), hy + 6, 1, 6, "#160807");
  rect(hx + 1, hy + 10, 2, 3 - legs, "#140a06"); rect(hx + 3, hy + 10, 2, 3 - (1 - legs), "#140a06");
  rect(hx - 1, hy + 7, 1, 4, "#2a1d12");

  // Out of the cup: the coffee surface the dive landed in thins out over the scene, its ripples spreading.
  if (!calm && t < 1.8) {
    const a = 1 - ease((t - 0.3) / 1.5);
    ctx.globalAlpha = a; rect(0, 0, W, H, "#1a0d05");
    for (let i = 0; i < 4; i++) { const r = (t * 70 + i * 26) % 110; ring(W / 2, H / 2, r, i % 2 ? "#6b3b1f" : "#c98a4b"); }
    for (let i = 0; i < 24; i++) { const ang = i * 0.5 + t * 3, r = i * 3.2; rect(W / 2 + Math.cos(ang) * r, H / 2 + Math.sin(ang) * r * 0.6, 2, 1, "#e0b27a"); }
    ctx.globalAlpha = 1;
  }

  // A vignette frames it like an old title card.
  ctx.globalAlpha = 0.35; rect(0, 0, W, 2, "#000"); rect(0, H - 2, W, 2, "#000"); rect(0, 0, 2, H, "#000"); rect(W - 2, 0, 2, H, "#000"); ctx.globalAlpha = 1;
}

// Sounds come from what changed in a frame, so the game logic stays silent (and testable in node).
type Before = { vy: number; ground: boolean; swing: number; got: number; hp: number; shots: number; act: Game["boss"]["act"]; foes: { hp: number; dead: boolean }[]; state: Game["state"] };
const snapshot = (g: Game): Before => ({
  vy: g.vy, ground: g.ground, swing: g.swing, got: g.got.size, hp: g.hp, shots: g.shots.length, act: g.boss.act,
  foes: g.foes.map((f) => ({ hp: f.hp, dead: f.dead })), state: g.state,
});
function listen(g: Game, b: Before) {
  const { sfx } = audio;
  if (g.swing > b.swing) sfx.whip();
  if (g.hp < b.hp) sfx.hurt();
  else if (g.vy < -100 && g.vy < b.vy - 100) sfx.jump();
  if (!b.ground && g.ground && b.vy > 200) sfx.land();
  for (const k of [...g.got].slice(b.got)) { const [cx, cy] = k.split(",").map(Number); if (tileAt(g.stage, cx, cy) === "i") sfx.candle(); else sfx.bean(); }
  b.foes.forEach((was, i) => {
    const f = g.foes[i];
    if (f.hp >= was.hp) return;
    if (f.kind === "count") { if (f.dead) sfx.bossDown(); else sfx.bossHit(); }
    else if (!f.dead) sfx.hit();
    else if (f.kind === "skel") sfx.bones();
    else sfx.bat();
  });
  if (g.boss.act !== b.act) {
    if (b.act === "sleep") sfx.wake();
    else if (g.boss.act === "dash" || g.boss.act === "cast" || g.boss.act === "bats" || g.boss.act === "blink") sfx[g.boss.act]();
  }
  if (g.shots.length > b.shots) sfx.shot();
  if (b.state === "play" && g.state === "dead") { audio.stop(); sfx.die(); }
  if (b.state === "play" && g.state === "won") { audio.stop(); if (g.stage === STAGES.length - 1) sfx.victory(); else sfx.clear(); }
  // The Count's theme while he is awake, silence once he falls, the stage theme otherwise.
  const count = g.foes.find((f) => f.kind === "count");
  if (g.state === "play") { if (!count || g.boss.act === "sleep") audio.play("stage"); else if (count.dead) audio.stop(); else audio.play("boss"); }
}

function Castle({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>(idle());
  const [progress, setProgress] = useState<Progress>({ cleared: 0, best: [] });
  const saved = useRef(progress);
  const [stage, setStage] = useState<number | null>(null);
  const [hud, setHud] = useState({ hp: HP, beans: 0, state: "play" as Game["state"] });
  const [note, setNote] = useState("");
  // Opening: the title scene (the desk camera has just dived into the mug) plays until a key or tap.
  const [intro, setIntro] = useState(true);
  const [sound, setSound] = useState(() => !audio.muted());
  const toggleSound = () => setSound((on) => { audio.setMuted(on); return !on; });
  // Set when the Count falls, so the menu's nocturne waits for the victory fanfare to end.
  const fanfare = useRef(0);

  useEffect(() => {
    audio.unlock();
    // M toggles the sound anywhere in the castle.
    const mute = (e: KeyboardEvent) => { if (e.code === "KeyM" && !e.repeat) toggleSound(); };
    addEventListener("keydown", mute);
    return () => { removeEventListener("keydown", mute); audio.stop(); };
  }, []);

  useEffect(() => {
    dialog.current!.showModal();
    track("game", "coffee-run");
    const apply = (p: Progress, remote: boolean) => { saved.current = p; setProgress(p); store(p, remote); };
    apply(readLocal(), false);
    // Server and local copies merge, so progress made offline or on an older tab isn't lost; the merged copy goes back up.
    loadCastle(key()).then((p) => apply(merge(saved.current, p), true), () => {});
  }, []);

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    if (stage === null && intro) {
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches, start = performance.now();
      let frame = 0;
      const tick = () => { drawIntro(ctx, (performance.now() - start) / 1000, calm); if (!calm) frame = requestAnimationFrame(tick); };
      frame = requestAnimationFrame(tick);
      // Any key but Escape (closes) and Tab ends it; on keyup, so the space that skipped can't also press the menu button it focuses.
      const skip = (e: KeyboardEvent) => {
        if (e.code === "Escape" || e.code === "Tab") return;
        e.preventDefault();
        if (e.type === "keyup") { audio.sfx.select(); setIntro(false); }
      };
      addEventListener("keydown", skip);
      addEventListener("keyup", skip);
      return () => { cancelAnimationFrame(frame); removeEventListener("keydown", skip); removeEventListener("keyup", skip); };
    }
    if (stage === null) { draw(ctx, fresh(Math.min(saved.current.cleared, STAGES.length - 1))); return; }
    input.current = idle();
    let g = fresh(stage), frame = 0, then = performance.now(), shown = "";
    function tick(now: number) {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      const was = g.state, before = snapshot(g);
      step(g, input.current, dt);
      listen(g, before);
      if (g.state === "won" && was === "play") {
        const best = [...saved.current.best]; best[g.stage] = g.beans;
        const next = merge(saved.current, { cleared: g.stage + 1, best });
        saved.current = next; setProgress(next); store(next);
        track("won", String(g.stage), { beans: g.beans });
      }
      if (g.state === "dead" && g.t > 1) g = retry(g);
      if (g.state === "won" && g.t > 1.5) {
        if (g.stage + 1 < STAGES.length) { setStage(g.stage + 1); return; }
        fanfare.current = performance.now() + 2500;
        // Creates (or raises the rarity of) the Count's stamp now; the notebook hands it over for sticking.
        countStamp(device(), beanShare(saved.current)!).catch(() => {});
        track("stamp", "conde", { beans: beanShare(saved.current) });
        setNote(`Você venceu o Conde D'arábica. O relógio voltou a andar, a última xícara foi servida e o sol nasceu. Ganhou o selo do Conde (${beanShare(saved.current)}% dos grãos): cole no caderno.`); setStage(null); return;
      }
      // Only re-render React when the HUD actually changes.
      const key = `${g.hp}|${g.beans}|${g.state}`;
      if (key !== shown) { shown = key; setHud({ hp: g.hp, beans: g.beans, state: g.state }); }
      draw(ctx, g);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    const press = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      input.current[k] = e.type === "keydown";
    };
    addEventListener("keydown", press);
    addEventListener("keyup", press);
    return () => { cancelAnimationFrame(frame); removeEventListener("keydown", press); removeEventListener("keyup", press); };
  }, [stage, intro]);

  // Title and menu play the nocturne (stages pick their own song in `listen`).
  useEffect(() => {
    if (stage !== null) return;
    const wait = Math.max(0, fanfare.current - performance.now()), later = setTimeout(() => audio.play("night"), wait);
    if (wait) audio.stop();
    return () => clearTimeout(later);
  }, [stage]);

  // Touch pad: each button holds its input while pressed.
  const pad = (k: keyof Input, label: string, glyph: string) => (
    <button type="button" aria-label={label} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); input.current[k] = true; }}
      onPointerUp={() => { input.current[k] = false; }} onPointerCancel={() => { input.current[k] = false; }} onContextMenu={(e) => e.preventDefault()}>{glyph}</button>
  );
  const play = (i: number) => { audio.sfx.start(); setNote(""); setStage(i); track("stage", String(i)); };
  const speaker = (
    <button type="button" className={styles.menu} aria-pressed={sound} onClick={toggleSound} title="Som (M)">{sound ? "♪ Som" : "♪ Mudo"}</button>
  );

  return (
    <dialog ref={dialog} className={`${room.room} ${styles.arrive}`} aria-label="Castelo do Café" onClose={onClose} onPointerDown={audio.unlock}>
      <p className={`${room.hud} ${styles.hud}`}>
        {stage === null ? <><span>{intro ? "\u00a0" : "Castelo do Café"}</span>{speaker}</> : <>
          <span>{STAGES[stage].name}</span>
          <span aria-label={`${hud.hp} de ${HP} corações`}>{"♥".repeat(Math.max(0, hud.hp))}<span className={styles.lost}>{"♥".repeat(HP - Math.max(0, hud.hp))}</span></span>
          <span>Grãos {hud.beans}/{loot(stage)}</span>
          {hud.state !== "play" && <span role="status">{hud.state === "won" ? "Fase concluída!" : "Você caiu…"}</span>}
          {speaker}
          <button type="button" className={styles.menu} onClick={() => setStage(null)}>Fases</button>
        </>}
      </p>
      <div className={styles.frame}>
        <canvas ref={canvas} className={`${room.court} ${styles.level}`} width={W} height={H}
          aria-label="Jogo de plataforma: setas ou A e D para andar, espaço ou Z para pular, X ou J para o chicote" />
        {stage === null && intro && (
          <div className={styles.intro} onPointerUp={() => { audio.sfx.select(); setIntro(false); }}>
            <h2 className={`${gothic.className} ${styles.title}`}><span>Castelo</span> <small>do</small> <span>Café</span></h2>
            <p className={styles.subtitle}>— A Brasa da Aurora —</p>
            <div className={styles.prologue}>
              {PROLOGUE.map((line, i) => <p key={line} style={{ "--i": i } as CSSProperties}>{line}</p>)}
              <p className={styles.press} style={{ "--i": PROLOGUE.length } as CSSProperties}>Aperte uma tecla ou toque para entrar</p>
            </div>
            <button type="button" className={styles.skip} onClick={() => setIntro(false)}>Pular ›</button>
          </div>
        )}
        {stage === null && !intro && (
          <div className={styles.stages}>
            {note && <p role="status">{note}</p>}
            <ol>
              {STAGES.map((s, i) => (
                <li key={s.name}>
                  <button type="button" disabled={i > progress.cleared} onClick={() => play(i)} autoFocus={i === Math.min(progress.cleared, STAGES.length - 1)}>
                    <span>{i + 1}. {s.name}</span>
                    <span className={styles.synopsis}>{s.story}</span>
                    <small>{i > progress.cleared ? "Trancada" : i < progress.cleared ? `✓ ${progress.best[i] ?? 0}/${loot(i)} grãos` : "Nova"}</small>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {stage !== null && <p className={styles.story}>{STAGES[stage].story}</p>}
      {(stage !== null || !intro) && <p className={`${room.hint} ${styles.hint}`}>← → andar · espaço/Z pular · X/J chicote · pule por baixo das plataformas finas</p>}
      {stage !== null && (
        <div className={styles.pad}>
          <span>{pad("left", "Andar para a esquerda", "◀")}{pad("right", "Andar para a direita", "▶")}</span>
          <span>{pad("whip", "Chicote", "B")}{pad("jump", "Pular", "A")}</span>
        </div>
      )}
      <p className={styles.rotate}>Gire o celular para jogar maior</p>
      <button type="button" className={room.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the coffee mug on the desk (drawn in WebGL) gets an invisible button on top that opens a pixel castle platformer.
// The desk camera dives into the coffee first, and climbs back out when the castle closes.
export default function CoffeeRun() {
  const [open, setOpen] = useState(false);
  const mug = useRef<HTMLButtonElement>(null);
  return (
    <>
      <span className={styles.steam} aria-hidden="true"><span /><span /><span /></span>
      <button ref={mug} type="button" className={styles.mug} aria-label="Caneca de café" onClick={() => { audio.unlock(); dive(mug.current, "cup", true, () => setOpen(true)); }} />
      {open && <Castle onClose={() => { setOpen(false); dive(mug.current, "cup", false); }} />}
    </>
  );
}
