// Chiptune for the café castle, synthesised with WebAudio (no files): square leads, triangle bass and noise drums,
// like the NES it imitates. Songs are step sequences; effects are short sweeps. Everything is silent until `unlock()`
// runs inside a user gesture (the click on the mug), as browsers require.

type Wave = OscillatorType;
type Track = { wave: Wave | "drums"; vol: number; notes: string };
type Song = { step: number; tracks: Track[] };

const MUTE = "cafe-castle-sound";
let ctx: AudioContext | null = null, master: GainNode, music: GainNode, effects: GainNode, noise: AudioBuffer;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted() ? 0 : 0.5; master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
    effects = ctx.createGain(); effects.gain.value = 0.9; effects.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function muted() {
  try { return localStorage.getItem(MUTE) === "off"; } catch { return false; }
}
export function setMuted(off: boolean) {
  try { localStorage.setItem(MUTE, off ? "off" : "on"); } catch {}
  if (ctx) master.gain.setTargetAtTime(off ? 0 : 0.5, ctx.currentTime, 0.02);
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const NAMES: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// "d5", "c#4", "bb2" → MIDI number.
const midi = (n: string) => {
  const m = /^([a-g])(#|b)?(\d)$/.exec(n)!;
  return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
};

// A note: oscillator from `from` Hz (sliding to `to`), quick attack, held, then released by the end.
function tone(out: AudioNode, wave: Wave, at: number, dur: number, vol: number, from: number, to = from) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(from, at);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.005);
  g.gain.setValueAtTime(vol, at + Math.max(0.006, dur * 0.7));
  g.gain.linearRampToValueAtTime(0, at + dur);
  o.connect(g).connect(out);
  o.start(at); o.stop(at + dur + 0.02);
}
// Filtered noise burst: hats, snares, whip cracks, crumbling bones.
function hiss(out: AudioNode, at: number, dur: number, vol: number, type: BiquadFilterType, from: number, to = from) {
  const c = ctx!, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise; s.loop = true;
  f.type = type; f.frequency.setValueAtTime(from, at);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  s.connect(f).connect(g).connect(out);
  s.start(at, Math.random()); s.stop(at + dur + 0.02);
}

// --- Music ---------------------------------------------------------------------------------------------------------
// Each token is one step: a note, "-" to hold the previous one, "." for silence; drums use k (kick), s (snare), h (hat).
const SONGS: Record<"night" | "stage" | "boss", Song> = {
  // Title and menu: a slow nocturne in D minor.
  night: {
    step: 60 / 96 / 2,
    tracks: [
      { wave: "square", vol: 0.045, notes: "d5 - a4 - f5 - e5 d5 c#5 - - - a4 - - - d5 - a4 - g5 - f5 e5 f5 - e5 - d5 - - - bb4 - c5 - d5 - f5 - e5 - d5 - c#5 - a4 - d5 - f5 - a5 - g5 f5 e5 - c#5 - d5 - - -" },
      { wave: "triangle", vol: 0.06, notes: "f4 - - - - - - - e4 - - - - - - - bb4 - - - - - - - a4 - - - - - - - g4 - - - - - - - a4 - - - e4 - - - f4 - - - - - - - a4 - - - f4 - - -" },
      { wave: "triangle", vol: 0.12, notes: "d3 - a2 - d3 - a2 - a2 - e2 - a2 - e2 - g2 - d2 - g2 - d2 - d3 - a2 - d3 - a2 - bb2 - f2 - bb2 - f2 - a2 - e2 - a2 - e2 - d3 - a2 - d3 - a2 - a2 - e2 - d3 - a2 -" },
    ],
  },
  // Stages: driving octave bass under a whip-cracking lead.
  stage: {
    step: 60 / 150 / 2,
    tracks: [
      { wave: "square", vol: 0.045, notes: "d5 - - a4 d5 e5 f5 - e5 d5 c5 - a4 - - - bb4 - d5 - f5 - g5 f5 e5 - c5 - g4 - c5 - d5 - - a4 d5 e5 f5 g5 a5 - g5 f5 e5 - d5 - f5 - e5 d5 bb4 - d5 - c#5 - - - e5 - a4 -" },
      { wave: "triangle", vol: 0.12, notes: "d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 bb1 bb2 bb1 bb2 bb1 bb2 bb1 bb2 c2 c3 c2 c3 c2 c3 c2 c3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 d2 d3 bb1 bb2 bb1 bb2 bb1 bb2 bb1 bb2 a1 a2 a1 a2 a1 a2 a1 a2" },
      { wave: "drums", vol: 1, notes: "k . h . s . h . k . h . s . h k k . h . s . h . k . h . s h s s k . h . s . h . k . h . s . h k k . h . s . h . k . h . s s s s" },
    ],
  },
  // The Count: faster, in E minor, with a chromatic edge.
  boss: {
    step: 60 / 172 / 2,
    tracks: [
      { wave: "square", vol: 0.045, notes: "e5 - b4 - g5 - f#5 e5 f5 - c5 - a5 - g#5 f5 e5 g5 b5 g5 e5 g5 b5 g5 d6 - c6 b5 a5 - g#5 - e5 e5 e6 - d6 c6 b5 a5 g#5 - a5 - b5 - c6 - b5 - g5 - e5 - g5 - f#5 - d#5 - b4 - d#5 -" },
      { wave: "triangle", vol: 0.12, notes: "e2 e3 e2 e3 e2 e3 e2 e3 f2 f3 f2 f3 f2 f3 f2 f3 e2 e3 e2 e3 e2 e3 e2 e3 d2 d3 d2 d3 d#2 d#3 d#2 d#3 e2 e3 e2 e3 e2 e3 e2 e3 a1 a2 a1 a2 a1 a2 a1 a2 e2 e3 e2 e3 e2 e3 e2 e3 b1 b2 b1 b2 b1 b2 b1 b2" },
      { wave: "drums", vol: 1, notes: "k h s h k h s h k h s h k k s s k h s h k h s h k h s h s s s s k h s h k h s h k h s h k k s s k h s h k h s h k h s h s s s s" },
    ],
  },
};
export type SongName = keyof typeof SONGS;

let playing: SongName | null = null, timer = 0, bus: GainNode | null = null;

function drum(out: AudioNode, kind: string, at: number) {
  if (kind === "k") tone(out, "sine", at, 0.12, 0.35, 150, 40);
  else if (kind === "s") hiss(out, at, 0.12, 0.18, "bandpass", 1800, 900);
  else if (kind === "h") hiss(out, at, 0.04, 0.06, "highpass", 7000);
}

export function play(name: SongName) {
  if (!ctx || playing === name) return;
  stop();
  playing = name;
  const song = SONGS[name], c = ctx, out = (bus = c.createGain());
  out.connect(music);
  const tracks = song.tracks.map((t) => ({ ...t, steps: t.notes.split(/\s+/) }));
  const length = Math.max(...tracks.map((t) => t.steps.length));
  let index = 0, next = c.currentTime + 0.05;
  // Looks a little ahead and schedules on the audio clock, so timer jitter never reaches the beat.
  const pump = () => {
    while (next < c.currentTime + 0.15) {
      for (const t of tracks) {
        const s = t.steps[index % t.steps.length];
        if (t.wave === "drums") { drum(out, s, next); continue; }
        if (s === "-" || s === ".") continue;
        let held = 1;
        while (t.steps[(index + held) % t.steps.length] === "-" && held < t.steps.length) held++;
        tone(out, t.wave, next, held * song.step * 0.95, t.vol, hz(midi(s)));
      }
      index = (index + 1) % length;
      next += song.step;
    }
  };
  pump();
  timer = window.setInterval(pump, 25);
}

export function stop() {
  clearInterval(timer);
  if (ctx && bus) {
    const old = bus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => old.disconnect(), 400);
  }
  bus = null; playing = null;
}

// --- Effects -------------------------------------------------------------------------------------------------------
// Short melodies (fanfares) as [note, steps] pairs on one square voice over a triangle root.
function jingle(notes: [string, number][], step: number, root?: string) {
  if (!ctx) return;
  let at = ctx.currentTime + 0.02;
  if (root) tone(effects, "triangle", at, notes.reduce((n, [, d]) => n + d, 0) * step, 0.14, hz(midi(root)));
  for (const [n, d] of notes) { if (n !== ".") tone(effects, "square", at, d * step * 0.92, 0.07, hz(midi(n))); at += d * step; }
}

const last: Record<string, number> = {};
// Plays an effect unless the same one just played (several bones or beans in one frame make one sound).
function once(name: string, fn: (at: number) => void) {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - (last[name] ?? -1) < 0.04) return;
  last[name] = now;
  fn(now);
}

export const sfx = {
  jump: () => once("jump", (t) => tone(effects, "square", t, 0.13, 0.06, 180, 560)),
  land: () => once("land", (t) => hiss(effects, t, 0.06, 0.12, "lowpass", 600, 200)),
  whip: () => once("whip", (t) => { hiss(effects, t, 0.14, 0.22, "bandpass", 900, 4500); tone(effects, "square", t + 0.09, 0.03, 0.05, 2200, 1400); }),
  bean: () => once("bean", (t) => { tone(effects, "square", t, 0.05, 0.06, hz(83)); tone(effects, "square", t + 0.05, 0.12, 0.06, hz(88)); }),
  candle: () => once("candle", (t) => { hiss(effects, t, 0.2, 0.15, "bandpass", 3000, 600); tone(effects, "triangle", t, 0.15, 0.1, hz(76), hz(88)); }),
  hit: () => once("hit", (t) => { tone(effects, "square", t, 0.08, 0.07, 260, 120); hiss(effects, t, 0.06, 0.15, "bandpass", 2500); }),
  bones: () => once("bones", (t) => { for (let i = 0; i < 4; i++) hiss(effects, t + i * 0.045, 0.05, 0.16, "bandpass", 1200 + i * 500); tone(effects, "triangle", t, 0.25, 0.1, 400, 90); }),
  bat: () => once("bat", (t) => tone(effects, "square", t, 0.16, 0.05, 1500, 300)),
  hurt: () => once("hurt", (t) => { tone(effects, "square", t, 0.28, 0.08, 520, 90); hiss(effects, t, 0.15, 0.12, "lowpass", 1500, 300); }),
  shot: () => once("shot", (t) => tone(effects, "sawtooth", t, 0.3, 0.06, 160, 70)),
  wake: () => once("wake", (t) => { tone(effects, "triangle", t, 1.6, 0.22, 55); tone(effects, "square", t, 1.2, 0.03, 110, 104); hiss(effects, t, 1.2, 0.1, "lowpass", 900, 100); }),
  // The Count's tells, matching the drawn ones: a growl before the dash, a bubbling brew before the cast, a screech before the bats.
  dash: () => once("dash", (t) => tone(effects, "sawtooth", t, 0.45, 0.06, 70, 130)),
  cast: () => once("cast", (t) => { for (let i = 0; i < 5; i++) tone(effects, "sine", t + i * 0.08, 0.06, 0.12, 300 + i * 90); }),
  bats: () => once("bats", (t) => tone(effects, "square", t, 0.4, 0.04, 2400, 900)),
  blink: () => once("blink", (t) => hiss(effects, t, 0.35, 0.18, "bandpass", 400, 5000)),
  bossHit: () => once("bossHit", (t) => { tone(effects, "square", t, 0.12, 0.08, 180, 70); hiss(effects, t, 0.1, 0.2, "bandpass", 1600, 400); }),
  bossDown: () => once("bossDown", (t) => { for (let i = 0; i < 6; i++) hiss(effects, t + i * 0.12, 0.25, 0.25, "lowpass", 2000 - i * 250, 100); tone(effects, "triangle", t, 1.2, 0.2, 220, 40); }),
  select: () => once("select", (t) => tone(effects, "square", t, 0.06, 0.05, hz(81))),
  start: () => once("start", (t) => { tone(effects, "square", t, 0.07, 0.06, hz(74)); tone(effects, "square", t + 0.07, 0.07, 0.06, hz(81)); tone(effects, "square", t + 0.14, 0.16, 0.06, hz(86)); }),
  clear: () => jingle([["d5", 1], ["f5", 1], ["a5", 1], ["d6", 3], ["c6", 1], ["d6", 4]], 0.09, "d3"),
  die: () => { if (ctx) for (let i = 0; i < 4; i++) tone(effects, "square", ctx.currentTime + i * 0.16, 0.15, 0.07, hz(69 - i * 2), hz(68 - i * 2)); },
  // Last cup served: the sun rises.
  victory: () => jingle([["d5", 2], ["f5", 2], ["a5", 2], ["d6", 4], ["c6", 2], ["bb5", 2], ["a5", 2], ["bb5", 4], [".", 1], ["a5", 2], ["f#5", 2], ["a5", 2], ["d6", 8]], 0.11, "d3"),
};
