// Pure game logic for Corrida na Mesa (desk-run.tsx draws it), kept React- and canvas-free so node can test it.
// World units: the three lanes sit LANE apart in x, z runs forward along the desk (the score counts it as cm), y is up from the wood.
// The ladybug stands at z = dist; obstacles and items keep fixed z and the run moves past them.
export const LANE = 2, G = 40, STEP = 0.4, BODY = 0.3;
export const TALL = 1, LOW = 0.45, SLIDE = 0.65, SLIP = 0.6, CHASE = 8, POWER = 8;
export const BASE = 14, MAX = 30, RAMP = 180, AHEAD = 90;
const JUMP = Math.sqrt(2 * G * 1.7), HIGH = Math.sqrt(2 * G * 4.6), DIVE = 25;

export type Kind = "pencil" | "clip" | "cord" | "postit" | "mug" | "notebook" | "ruler" | "stain";
// `span` lanes from `lane` rightwards; `lo`/`hi` are the bottom and top (a ruler rises from 0 to `hi` along its depth `d`).
export type Ob = { kind: Kind; lane: number; span: number; z: number; d: number; lo: number; hi: number };
export type Item = { kind: "drop" | "sun" | "spring"; lane: number; z: number; y: number; taken: boolean };
export type Action = "left" | "right" | "jump" | "slide";
export type Run = {
  rand: () => number; steady: boolean;
  t: number; dist: number; speed: number; lane: number; x: number; y: number; vy: number;
  slide: number; slip: number; queued: -1 | 1 | 0; chase: number; magnet: number; spring: number; bump: number;
  drops: number; obs: Ob[]; items: Item[]; built: number; lastPower: number; over: false | "front" | "caught"; hit: Kind | null;
};

const SIZE: Record<Kind, [d: number, lo: number, hi: number]> = {
  pencil: [0.7, 0, 0.55], clip: [0.3, 0, 0.7], cord: [0.3, 0.6, 3.4], postit: [0.4, 0, 2.6],
  mug: [3.2, 0, 3.2], notebook: [12, 0, 2.2], ruler: [4, 0, 2.2], stain: [2.5, 0, 0],
};
// What can't be passed at ground level without a ramp: a lane only these cover is shut.
export const WALLS: Kind[] = ["postit", "mug", "notebook"];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const covers = (o: Ob, lane: number) => lane >= o.lane && lane < o.lane + o.span;
export const top = (o: Ob, z: number) => (o.kind === "ruler" ? o.hi * clamp((z - o.z) / o.d, 0, 1) : o.hi);
export const score = (r: Run) => Math.floor(r.dist) + 10 * r.drops;

// `build: false` leaves the desk empty, for tests that place their own obstacles.
export function fresh(rand: () => number, { steady = false, build = true } = {}): Run {
  return {
    rand, steady, t: 0, dist: 0, speed: BASE, lane: 0, x: 0, y: 0, vy: 0,
    slide: 0, slip: 0, queued: 0, chase: 0, magnet: 0, spring: 0, bump: 0,
    drops: 0, obs: [], items: [], built: build ? 30 : Infinity, lastPower: 0, over: false, hit: null,
  };
}

export function place(r: Run, kind: Kind, lane: number, z: number, span = 1) {
  const [d, lo, hi] = SIZE[kind];
  const o = { kind, lane, span, z, d, lo, hi };
  r.obs.push(o);
  return o;
}
const item = (r: Run, kind: Item["kind"], lane: number, z: number, y = 0.5) => r.items.push({ kind, lane, z, y, taken: false });
const line = (r: Run, lane: number, z: number, n: number, y = 0.5) => { for (let i = 0; i < n; i++) item(r, "drop", lane, z + i * 2.5, y); };
// Drops in a hop over something low at z.
const arc = (r: Run, lane: number, z: number) => { for (let i = -2; i <= 2; i++) item(r, "drop", lane, z + i * 1.6, 0.6 + 1.3 * (1 - (i / 2.5) ** 2)); };

// Builds the next stretch of desk at r.built and returns its length. Every row leaves at least one lane open at ground level.
function piece(r: Run) {
  const z = r.built, k = Math.min(1, z / 4000), rand = r.rand;
  const pick = () => Math.floor(rand() * 3) - 1;
  const others = (l: number) => [-1, 0, 1].filter((x) => x !== l);
  const roll = Math.floor(rand() * (k < 0.15 ? 4 : 8));
  switch (roll) {
    case 0: { // a pencil to hop
      const l = pick();
      place(r, "pencil", l, z); arc(r, l, z);
      if (k > 0.3) place(r, "clip", others(l)[Math.floor(rand() * 2)], z + 3);
      return 6;
    }
    case 1: { // a row of things to hop: pencils and a clip
      const c = pick();
      for (const l of [-1, 0, 1]) place(r, l === c ? "clip" : "pencil", l, z);
      arc(r, c, z);
      return 4;
    }
    case 2: { // a lanyard strung low: slide under
      const n = 1 + Math.floor(rand() * 3), from = n === 3 ? -1 : n === 2 ? (rand() < 0.5 ? -1 : 0) : pick();
      for (let l = from; l < from + n; l++) place(r, "cord", l, z);
      line(r, from, z - 2.5, 3, 0.3);
      return 4;
    }
    case 3: { // two sticky notes standing: take the free lane
      const free = pick();
      for (const l of others(free)) place(r, "postit", l, z);
      line(r, free, z - 4, 4);
      return 6;
    }
    case 4: { // sticky-note slalom
      const order = [-1, 0, 1].sort(() => rand() - 0.5);
      order.forEach((l, i) => place(r, "postit", l, z + i * 9));
      line(r, order[1], z - 3, 2); line(r, order[0], z + 4, 2); line(r, order[1], z + 13, 2);
      return 20;
    }
    case 5: { // the mug, two lanes wide; coffee spilt in the third
      const left = rand() < 0.5 ? -1 : 0, free = left === -1 ? 1 : -1;
      place(r, "mug", left, z, 2);
      if (k > 0.3) place(r, "stain", free, z - 1);
      line(r, free, z - 3, 3);
      return 6;
    }
    case 6: { // the notebook: climb the ruler and run along the cover
      const l = pick(), [a, b] = others(l);
      place(r, "ruler", l, z);
      place(r, "notebook", l, z + SIZE.ruler[0]);
      line(r, l, z + 5, 4, 2.7);
      if (rand() < 0.5) place(r, "notebook", a, z + SIZE.ruler[0] + 2);
      else place(r, "pencil", a, z + 8);
      place(r, rand() < 0.5 ? "stain" : "clip", b, z + 10);
      return 18;
    }
    default: { // spilt coffee and clips
      const l = pick(), [a, b] = others(l);
      place(r, "stain", l, z); place(r, "stain", a, z + 2);
      place(r, "clip", b, z + 3); arc(r, b, z + 3);
      return 6;
    }
  }
}

function build(r: Run) {
  while (r.built < r.dist + AHEAD) {
    const len = piece(r);
    const gap = 26 - 10 * Math.min(1, r.built / 4000);
    // Powers float in the empty gap after a piece, so they're always reachable.
    if (r.built - r.lastPower > 450 && r.rand() < 0.4) {
      item(r, r.rand() < 0.5 ? "sun" : "spring", Math.floor(r.rand() * 3) - 1, r.built + len + gap / 2, 0.8);
      r.lastPower = r.built;
    }
    r.built += len + gap;
  }
}

const height = (r: Run) => (r.slide > 0 ? LOW : TALL);
// Something in `lane` that the body at its current height runs into.
const wall = (r: Run, o: Ob, lane: number) =>
  covers(o, lane) && o.hi > 0 && o.z <= r.dist + BODY && o.z + o.d >= r.dist - BODY &&
  o.lo < r.y + height(r) && top(o, clamp(r.dist, o.z, o.z + o.d)) > r.y + STEP;

// Two knocks inside CHASE seconds and the cat's paw gets her.
function stumble(r: Run) {
  r.bump = 0.25;
  if (r.chase > 0) r.over = "caught";
  else r.chase = CHASE;
}

function shift(r: Run, dir: -1 | 1) {
  const lane = r.lane + dir;
  if (lane < -1 || lane > 1) return;
  if (r.obs.some((o) => wall(r, o, lane))) stumble(r);
  else r.lane = lane;
}

export function act(r: Run, a: Action) {
  if (r.over) return;
  const grounded = r.vy === 0;
  if (a === "left" || a === "right") {
    const dir = a === "left" ? -1 : 1;
    if (r.slip > 0) r.queued = dir; // coffee underfoot: the step comes late
    else shift(r, dir);
  } else if (a === "jump") {
    if (grounded) { r.vy = r.spring > 0 ? HIGH : JUMP; r.slide = 0; }
  } else {
    if (!grounded) r.vy = -DIVE;
    r.slide = SLIDE;
  }
}

export function step(r: Run, dt: number) {
  if (r.over) return;
  r.t += dt;
  r.speed = r.steady ? BASE : BASE + (MAX - BASE) * Math.min(1, r.t / RAMP);
  r.dist += r.speed * dt;
  for (const k of ["slide", "chase", "magnet", "spring", "bump"] as const) r[k] = Math.max(0, r[k] - dt);
  if (r.slip > 0 && (r.slip -= dt) <= 0) {
    r.slip = 0;
    if (r.queued) shift(r, r.queued);
    r.queued = 0;
  }
  const goal = r.lane * LANE;
  r.x += clamp(goal - r.x, -16 * dt, 16 * dt);

  build(r);
  r.obs = r.obs.filter((o) => o.z + o.d > r.dist - 8);
  r.items = r.items.filter((i) => i.z > r.dist - 8);

  // Falling, then standing on the highest thing underfoot that's within a step of the feet (a ruler lifts her as she climbs).
  const prevY = r.y;
  r.vy -= G * dt;
  r.y += r.vy * dt;
  let ground = 0;
  for (const o of r.obs) {
    if (!covers(o, r.lane) || o.lo > 0 || o.z > r.dist || o.z + o.d < r.dist) continue;
    const h = top(o, r.dist);
    if (h <= Math.max(r.y, prevY) + STEP) ground = Math.max(ground, h);
  }
  if (r.y <= ground) { r.y = ground; r.vy = 0; }

  const hit = r.obs.find((o) => wall(r, o, r.lane));
  if (hit) { r.over = "front"; r.hit = hit.kind; return; }
  if (r.y === 0 && !r.slip && r.obs.some((o) => o.kind === "stain" && covers(o, r.lane) && o.z <= r.dist && o.z + o.d >= r.dist)) r.slip = SLIP;

  for (const i of r.items) {
    if (i.taken) continue;
    const near = Math.abs(i.z - r.dist) < 0.8;
    const pulled = r.magnet > 0 && i.kind === "drop" && Math.abs(i.z - r.dist) < 6;
    if (pulled) { i.lane = r.lane; i.y += (r.y + 0.5 - i.y) * Math.min(1, 10 * dt); }
    if (!near || i.lane !== r.lane || Math.abs(i.y - (r.y + 0.5)) > 1.2) continue;
    i.taken = true;
    if (i.kind === "drop") r.drops++;
    else r[i.kind === "sun" ? "magnet" : "spring"] = POWER;
  }
}
