// Pure game logic for Solo de Strato (guitar-hero.tsx draws it), kept React- and canvas-free so node can test it.
// A jam is one lead line over a drum loop. The lead is one char per eighth-note step: "." rest, "-" hold the note before,
// "a".."k" a note of E minor pentatonic from E3 to E5. The chart *is* that line: each note falls down the string its
// pitch belongs to (low, mid, high), and a hit plays it. Times are seconds from the song's first step.

export const SCALE = ["e3", "g3", "a3", "b3", "d4", "e4", "g4", "a4", "b4", "d5", "e5"];
const KEYS = "abcdefghijk";
export const laneOf = (pitch: number) => (pitch < 4 ? 0 : pitch < 7 ? 1 : 2);
// Drum loops, one 4/4 bar of eighths each, in chiptune.ts drum tokens.
export const DRUMS = [
  { name: "Rock", notes: "k h s h k k s h" },
  { name: "Punk", notes: "k s k s k s k s" },
  { name: "Meio-tempo", notes: "k h h h s h h h" },
];
export const MAX_STEPS = 256, BARS = 8;

export type Jam = { title: string; bpm: number; drums: number; lead: string; bass?: string };
export type Judge = "perfect" | "good" | "miss";
export type Note = { step: number; pitch: number; lane: number; len: number; judge?: Judge; at?: number };
export type Play = {
  notes: Note[]; step: number; count: number; end: number;
  score: number; combo: number; max: number; meter: number; // meter: the crowd, 0..100; empty boos you off
  hits: Record<Judge, number>; over: null | "done" | "failed";
};

// Hit windows either side of the note, in seconds; points per hit before the combo multiplier.
export const WINDOW = { perfect: 0.05, good: 0.11 };
const POINTS = { perfect: 100, good: 50 };
export const LOOK = 1.6; // how long a note takes to fall the whole neck

export function chart(lead: string): Note[] {
  const notes: Note[] = [];
  [...lead].forEach((c, step) => {
    const pitch = KEYS.indexOf(c);
    if (pitch >= 0) notes.push({ step, pitch, lane: laneOf(pitch), len: 1 });
    else if (c === "-" && notes.length && notes.at(-1)!.step + notes.at(-1)!.len === step) notes.at(-1)!.len++;
  });
  return notes;
}

// Lead or bass line → chiptune.ts tokens, with `count` silent steps in front (the count-in) and `down` octaves lower.
export const tokens = (line: string, count = 0, down = 0) => [...".".repeat(count) + line].map((c) => {
  if (c === "." || c === "-") return c;
  const n = SCALE[KEYS.indexOf(c)];
  return n.slice(0, -1) + (+n.slice(-1) - down);
}).join(" ");

export const stepOf = (bpm: number) => 60 / bpm / 2;
// Whole bars of count-in, enough for the first note to fall the full neck.
export const countIn = (bpm: number) => 8 * Math.ceil(LOOK / (8 * stepOf(bpm)));

export function fresh(jam: Jam): Play {
  const step = stepOf(jam.bpm), count = countIn(jam.bpm);
  return {
    notes: chart(jam.lead), step, count, end: (count + jam.lead.length + 1) * step,
    score: 0, combo: 0, max: 0, meter: 60, hits: { perfect: 0, good: 0, miss: 0 }, over: null,
  };
}

export const timeOf = (p: Play, n: Note) => (p.count + n.step) * p.step;
export const mult = (combo: number) => Math.min(4, 1 + Math.floor(combo / 10));

function judge(p: Play, n: Note, j: Judge, t: number) {
  n.judge = j; n.at = t; p.hits[j]++;
  if (j === "miss") {
    p.combo = 0; p.meter = Math.max(0, p.meter - 5);
    if (!p.meter) p.over = "failed";
    return;
  }
  p.combo++; p.max = Math.max(p.max, p.combo);
  p.score += POINTS[j] * mult(p.combo);
  p.meter = Math.min(100, p.meter + 3);
}

// A strum on `lane` at time t: judges the closest open note on that string inside the window. Returns it, or null for a
// strum at nothing (no penalty: an open string just rings).
export function strum(p: Play, lane: number, t: number): Note | null {
  if (p.over) return null;
  let best: Note | null = null, gap = WINDOW.good;
  for (const n of p.notes) {
    if (n.judge || n.lane !== lane) continue;
    const d = Math.abs(timeOf(p, n) - t);
    if (d <= gap) { best = n; gap = d; }
  }
  if (best) judge(p, best, gap <= WINDOW.perfect ? "perfect" : "good", t);
  return best;
}

// Time moves on to t: notes past their window are missed, and the song ends after its last step. Returns the new misses.
export function advance(p: Play, t: number): Note[] {
  if (p.over) return [];
  const missed = p.notes.filter((n) => !n.judge && t > timeOf(p, n) + WINDOW.good);
  for (const n of missed) { judge(p, n, "miss", t); if (p.over) return missed; }
  if (t >= p.end) p.over = "done";
  return missed;
}

// The best score a jam allows: every note perfect.
export const best = (jam: Jam) => chart(jam.lead).reduce((s, _, i) => s + POINTS.perfect * mult(i + 1), 0);

// --- Links ---------------------------------------------------------------------------------------------------------
// A visitor's jam travels in the URL hash (#jam=…&bpm=…&d=…&t=…), so it never reaches the server: nothing is stored,
// the link is the song. Anything that doesn't parse cleanly (whole bars, known notes, sane tempo) is refused.
export function encode(jam: Jam) {
  return new URLSearchParams({ jam: jam.lead, bpm: String(jam.bpm), d: String(jam.drums), t: jam.title }).toString();
}

export function decode(hash: string): Jam | null {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const lead = q.get("jam"), bpm = Number(q.get("bpm")), drums = Number(q.get("d") ?? 0);
  if (!lead || lead.length > MAX_STEPS || lead.length % 8 || !/^[.\-a-k]+$/.test(lead) || !chart(lead).length) return null;
  if (!Number.isInteger(bpm) || bpm < 60 || bpm > 200 || !Number.isInteger(drums) || !DRUMS[drums]) return null;
  return { lead, bpm, drums, title: cleanTitle(q.get("t") ?? "") || "Sem título" };
}

export const cleanTitle = (t: string) => t.replace(/[\p{C}]/gu, "").trim().slice(0, 40);

// --- The song ------------------------------------------------------------------------------------------------------
// "Guitar Villain": an original E minor riff (A), a climbing solo (B), the riff again. Bass follows the roots.
const A = ["a.afa.gf", "a.afa.hg", "a.afa.gf", "c.chg.fd"];
const B = ["f.g.h-i-", "j-i-h.g.", "f.g.h-i-", "k---j-i-", "h.i.j-k-", "j-i-h-g-", "f.g.h.i.", "f-------"];
const bassBar = (r: string, up: string) => `${r}.${r}${r}.${r}${up}${r}`;
const BASS_A = [bassBar("a", "f"), bassBar("a", "f"), bassBar("a", "f"), "c.cc" + "b.bb"];
const BASS_B = ["a", "c", "b", "d", "a", "c", "d", "a"].map((r) => bassBar(r, r));
export const SONG: Jam = {
  title: "Guitar Villain", bpm: 132, drums: 0,
  lead: [...A, ...A, ...B, ...A].join(""),
  bass: [...BASS_A, ...BASS_A, ...BASS_B, ...BASS_A].join(""),
};
