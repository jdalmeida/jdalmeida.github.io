// Pure game logic for the café castle (coffee-run.tsx draws it), kept React- and canvas-free so node can test it.
// Units are canvas px; speeds px/s, accelerations px/s². Map: `#` stone, `=` ledge (jump up through it), `~` boiling coffee,
// `o` bean, `i` candle (whip it for a bean), `b` bat, `s` skeleton, `v` Count, `P` start, `D` the door out.
export const T = 8, PW = 6, PH = 13, HP = 4;
const extendedMap = (rows: string[]) => {
  const width = Math.max(96, ...rows.map((row) => row.length));
  return rows.map((row, y) => row.padEnd(width, y >= 12 ? "#" : "."));
};
export const STAGES = [
  {
    name: "Portão do castelo",
    story: "A caneca leva você ao castelo. Atravesse o portão e siga os rastros da Brasa da Aurora.",
    map: [
      "..............................................................................................................",
      "..............................................................................................................",
      "..............................................................................................................",
      "..............................................................................................................",
      "..............................................................................................................",
      "........................................................................................b.....................",
      ".........................................b....................................................................",
      "...............................o.o................................................................b...........",
      "..............................=====............o..............................................................",
      "..............................................===........................oo...................................",
      "......i......i.....i........i........i.................i.........i......####.........i.........i..............",
      "..P.............s.........................................s...........s.####..............oo..............D...",
      "#####################...######################...###########################....##############################",
      "#####################~~~######################~~~###########################~~~~##############################",
    ],
  },
  {
    name: "Adega",
    story: "Entre barris antigos, os servos deixaram pistas: D'arábica levou a brasa para o alto.",
    map: [
      "########################################################################################################################",
      "########################################################################################################################",
      "........................................................................................................................",
      "........................................................................................................................",
      "....................................b...................................................................................",
      "......................b...................................................................b.............................",
      "......................................o......................................b..............................b...........",
      ".....................................===.....................................................o..........................",
      "..................................o.................oo......................................===.........................",
      ".................................===................##...................................o..............................",
      "........i...............i....................i......##.i........o.........i.......i.....===.........i.........i.........",
      "..P.........s..............s......................s.##...s..............s.......s......................s.........s...D..",
      "###############....############..........####################...#...##################..........########################",
      "###############~~~~############~~~~~~~~~~####################~~~#~~~##################~~~~~~~~~~########################",
    ],
  },
  {
    name: "Torre do relógio",
    story: "O relógio parou na última madrugada. Uma passagem no topo leva à estufa suspensa.",
    map: [
      "##########################################################################################",
      "..........................................................................................",
      "..........................................oo...........b................................D.",
      "......................b..................====...o.....................................####",
      "..............................................#####............................b......####",
      "..........................oo..........i.......#####................................oo.....",
      ".........................====.......====............===...............b...........====....",
      "..........................................................o...............................",
      ".........................................................===..............................",
      "....................====......=====..........................................====.........",
      "......i.........i...............................................i.......i.......i.........",
      "..P.........s...................s.................................s.......s...............",
      "####################........########################.........#############################",
      "####################~~~~~~~~########################~~~~~~~~~#############################",
    ],
  },
  {
    name: "Estufa suspensa",
    story: "A última planta de café ainda vive acima da torre. Encontre sua semente.",
    map: extendedMap([
      "................................................................................................",
      "................................................................................................",
      "................................................................................................",
      ".........................................b......................................................",
      "..............................o.o.............................o.o...............................",
      ".............................=====...........................=====...............................",
      "......................b...........................b..............................b...............",
      ".................o.o........................o.o......................o.o.........................",
      "................=====......................=====....................=====.........................",
      "......................................i...................i.....................................",
      "......i...............i..........i...................i..................i..........i.............",
      "..P........s................s..................s................s.......................s..D......",
      "##################...##################...##################...##################...############",
      "##################~~~##################~~~##################~~~##################~~~############",
    ]),
  },
  {
    name: "Fornalha de torra",
    story: "Com a semente, reacenda a Brasa da Aurora nas fornalhas do castelo.",
    map: extendedMap([
      "################################################################################################",
      "................................................................................................",
      "................................................................................................",
      "................................................................................................",
      "........................b..............................b.............................b..........",
      "............................o.o.............................o.o.................................",
      "...........................=====...........................=====.................................",
      ".................b..............................b.............................b.................",
      "..............o.o..........................o.o............................o.o....................",
      ".............=====........................=====..........................=====....................",
      "......i............i..........i..............i.............i...............i.............i......",
      "..P.........s.............s..............s..............s.....................s.......s.....D.....",
      "##############...################...################...################...#######################",
      "##############~~~################~~~################~~~################~~~#######################",
    ]),
  },
  {
    name: "Salão da última xícara",
    story: "A brasa está acesa. Vença o Conde D'arábica para preparar a última xícara.",
    map: extendedMap([
      "################################################################################################",
      "................................................................................................",
      "................................................................................................",
      "................................................................................................",
      "........................b............................................................b..........",
      "..............................o.o................................o.o...........................",
      ".............................=====..............................=====...........................",
      "................................................................................................",
      ".................o.o.....................o.o.......................o.o..........................",
      "................=====...................=====.....................=====..........................",
      "......i...............i.................i...................i.................i...................",
      "..P........s...............s...................s....................v.......................D....",
      "################################################################################################",
      "################################################################################################",
    ]),
  },
];
const SPEED = 55, G = 480, JUMP = 190, FALL = 280, WHIP = 0.32, REACH = 18, HURT = 1, BUFFER = 0.1, COYOTE = 0.08;
export const STUN = 0.3;
const SIZE = { bat: [7, 6], skel: [6, 13], count: [6, 13] } as const;

// `ouch` is seconds since the last whip hit; `kick` the direction it came from.
export type Foe = { kind: "bat" | "skel" | "count"; x: number; y: number; vx: number; home: number; hp: number; hit: number; t: number; dead: boolean; ouch: number; kick: 1 | -1 };
export type Game = {
  stage: number; x: number; y: number; vx: number; vy: number; face: 1 | -1; ground: boolean; air: number; buffer: number;
  hp: number; hurt: number; kick: number; whip: number; swing: number; prev: { jump: boolean; whip: boolean };
  got: Set<string>; beans: number; foes: Foe[]; state: "play" | "dead" | "won"; t: number;
};
export type Input = { left: boolean; right: boolean; jump: boolean; whip: boolean };
export type Progress = { cleared: number; best: number[] };

// Beans on the map plus candles: the most a stage can give.
export const loot = (stage: number) => STAGES[stage].map.join("").replace(/[^oi]/g, "").length;
// Outside the map sideways is wall, above and below is air.
export const tileAt = (stage: number, cx: number, cy: number) => {
  const map = STAGES[stage].map;
  if (cx < 0 || cx >= map[0].length) return "#";
  const c = map[cy]?.[cx] ?? ".";
  return "Pbsv".includes(c) ? "." : c;
};

export function fresh(stage: number): Game {
  const foes: Foe[] = [];
  let x = 0, y = 0;
  STAGES[stage].map.forEach((row, cy) => [...row].forEach((c, cx) => {
    if (c === "P") { x = cx * T + 1; y = (cy + 1) * T - PH; }
    if (c === "b") foes.push({ kind: "bat", x: cx * T, y: cy * T + 1, vx: 0, home: cy * T + 1, hp: 1, hit: 0, t: 0, dead: false, ouch: 99, kick: 1 });
    if (c === "s") foes.push({ kind: "skel", x: cx * T + 1, y: (cy + 1) * T - SIZE.skel[1], vx: -15, home: 0, hp: 2, hit: 0, t: 0, dead: false, ouch: 99, kick: 1 });
    if (c === "v") foes.push({ kind: "count", x: cx * T + 1, y: (cy + 1) * T - SIZE.count[1], vx: -20, home: 0, hp: 5, hit: 0, t: 0, dead: false, ouch: 99, kick: 1 });
  }));
  return {
    stage, x, y, vx: 0, vy: 0, face: 1, ground: false, air: 0, buffer: 0, hp: HP, hurt: 0, kick: 0, whip: 0, swing: 0,
    prev: { jump: false, whip: false }, got: new Set(), beans: 0, foes, state: "play", t: 0,
  };
}

type Box = { x: number; y: number; w: number; h: number };
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function tilesIn(b: Box, test: (cx: number, cy: number) => boolean) {
  for (let cy = Math.floor(b.y / T); cy <= Math.floor((b.y + b.h - 0.01) / T); cy++)
    for (let cx = Math.floor(b.x / T); cx <= Math.floor((b.x + b.w - 0.01) / T); cx++)
      if (test(cx, cy)) return true;
  return false;
}
export const hero = (g: Game): Box => ({ x: g.x, y: g.y, w: PW, h: PH });
export const foeBox = (f: Foe): Box => ({ x: f.x, y: f.y, w: SIZE[f.kind][0], h: SIZE[f.kind][1] });
// The whip only hurts mid-swing, after the wind-up.
export const lash = (g: Game): Box | null =>
  g.whip > 0.06 && g.whip < WHIP - 0.1 ? { x: g.face > 0 ? g.x + PW : g.x - REACH, y: g.y + 3, w: REACH, h: 4 } : null;

function sub(g: Game, input: Input, dt: number) {
  const tile = (cx: number, cy: number) => tileAt(g.stage, cx, cy);
  const wall = (cx: number, cy: number) => tile(cx, cy) === "#";
  g.hurt -= dt; g.whip -= dt; g.buffer -= dt; g.air += dt;
  if (input.jump && !g.prev.jump) g.buffer = BUFFER;
  if (input.whip && !g.prev.whip && g.whip <= 0) { g.whip = WHIP; g.swing++; }
  g.prev = { jump: input.jump, whip: input.whip };

  // Just hit: knocked back and deaf to input for a moment.
  if (g.hurt > HURT - 0.3) g.vx = g.kick * 60;
  else {
    const dir = Number(input.right) - Number(input.left);
    if (dir && g.whip <= 0) g.face = dir as 1 | -1;
    g.vx = g.whip > 0 && g.ground ? 0 : dir * SPEED;
    // Jump presses are buffered a bit before landing and allowed a bit after walking off an edge.
    if (g.buffer > 0 && g.air < COYOTE) { g.vy = -JUMP; g.buffer = 0; g.air = COYOTE; }
    if (!input.jump && g.vy < -JUMP / 3) g.vy = -JUMP / 3;
  }

  g.vy = Math.min(g.vy + G * dt, FALL);
  g.x += g.vx * dt;
  if (tilesIn(hero(g), wall)) { g.x = g.vx > 0 ? Math.floor((g.x + PW) / T) * T - PW : Math.floor(g.x / T) * T + T; g.vx = 0; }
  const feet = g.y + PH;
  g.y += g.vy * dt;
  g.ground = false;
  if (g.vy > 0 && tilesIn(hero(g), (cx, cy) => wall(cx, cy) || (tile(cx, cy) === "=" && feet <= cy * T + 0.01))) {
    g.y = Math.floor((g.y + PH) / T) * T - PH; g.vy = 0; g.ground = true; g.air = 0;
  } else if (g.vy < 0 && tilesIn(hero(g), wall)) { g.y = Math.floor(g.y / T) * T + T; g.vy = 0; }

  tilesIn(hero(g), (cx, cy) => {
    if (tile(cx, cy) === "o" && !g.got.has(`${cx},${cy}`)) { g.got.add(`${cx},${cy}`); g.beans++; }
    return false;
  });
  const whip = lash(g);
  if (whip) tilesIn(whip, (cx, cy) => {
    if (tile(cx, cy) === "i" && !g.got.has(`${cx},${cy}`)) { g.got.add(`${cx},${cy}`); g.beans++; }
    return false;
  });

  for (const f of g.foes) {
    f.t += dt; f.ouch += dt;
    if (f.dead) continue;
    if (f.kind === "bat") {
      // Bats sleep until the hero comes near, then swoop along in a wave.
      if (!f.vx && Math.abs(g.x - f.x) < 90) { f.vx = g.x < f.x ? -45 : 45; f.t = 0; }
      if (f.vx) { f.x += f.vx * dt; f.y = f.home + Math.sin(f.t * 5) * 10; }
    } else {
      // Skeletons pace and turn at walls and ledge ends; a hit slides them back (never off a ledge) and stops them briefly.
      const floor = Math.round((f.y + SIZE.skel[1]) / T);
      const edge = (x: number, dir: number) => {
        const ahead = Math.floor((dir > 0 ? x + SIZE.skel[0] : x) / T);
        return wall(ahead, floor - 1) || !(wall(ahead, floor) || tile(ahead, floor) === "=");
      };
      if (f.ouch < STUN) { const x = f.x + f.kick * 90 * (1 - f.ouch / STUN) * dt; if (!edge(x, f.kick)) f.x = x; }
      else { f.x += f.vx * dt; if (edge(f.x, f.vx)) { f.vx *= -1; f.x += f.vx * dt; } }
    }
    if (whip && f.hit !== g.swing && overlap(whip, foeBox(f))) {
      f.hit = g.swing; f.ouch = 0; f.kick = g.face;
      if (--f.hp <= 0) { f.dead = true; f.t = 0; }
      continue;
    }
    if (g.hurt <= 0 && f.ouch >= STUN && overlap(hero(g), foeBox(f))) {
      g.hp--; g.hurt = HURT; g.kick = g.x + PW / 2 < f.x + SIZE[f.kind][0] / 2 ? -1 : 1; g.vy = -120;
    }
  }

  const rows = STAGES[g.stage].map.length;
  if (g.hp <= 0 || g.y > rows * T || tilesIn(hero(g), (cx, cy) => tile(cx, cy) === "~")) { g.state = "dead"; g.t = 0; }
  else if (!g.foes.some((f) => f.kind === "count" && !f.dead) && tilesIn(hero(g), (cx, cy) => tile(cx, cy) === "D")) { g.state = "won"; g.t = 0; }
}

// Small fixed substeps keep a fast fall from tunnelling through a one-tile floor.
export function step(g: Game, input: Input, dt: number) {
  g.t += dt;
  if (g.state !== "play") return;
  const n = Math.ceil(dt * 240);
  for (let i = 0; i < n && g.state === "play"; i++) sub(g, input, dt / n);
}

// Progress only grows: the furthest stage cleared and the most beans per stage, whichever side has more.
export const merge = (a: Progress, b: Progress): Progress => ({
  cleared: Math.max(a.cleared, b.cleared),
  best: STAGES.map((_, i) => Math.max(a.best[i] ?? 0, b.best[i] ?? 0)),
});
export function validProgress(p: unknown): p is Progress {
  const q = p as Progress;
  return !!q && Number.isInteger(q.cleared) && q.cleared >= 0 && q.cleared <= STAGES.length && Array.isArray(q.best) &&
    q.best.length <= STAGES.length && q.best.every((n, i) => Number.isInteger(n) && n >= 0 && n <= loot(i));
}
