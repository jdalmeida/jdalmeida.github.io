// A tiny WebAudio chiptune engine shared by the desk's games (no audio files): square leads, triangle bass and noise
// drums, like the NES they imitate. Songs are step sequences; effects are short sweeps. Everything is silent until
// `unlock()` runs inside a user gesture, as browsers require. Each game remembers its own mute choice under `key`.

type Wave = OscillatorType;
type Track = { wave: Wave | "drums"; vol: number; notes: string };
export type Song = { step: number; tracks: Track[] };

let ctx: AudioContext | null = null, master: GainNode, music: GainNode, effects: GainNode, noise: AudioBuffer;
const LOUD = 0.5;

export function unlock(key: string) {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
    effects = ctx.createGain(); effects.gain.value = 0.9; effects.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  master.gain.value = muted(key) ? 0 : LOUD;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function muted(key: string) {
  try { return localStorage.getItem(key) === "off"; } catch { return false; }
}
export function setMuted(key: string, off: boolean) {
  try { localStorage.setItem(key, off ? "off" : "on"); } catch {}
  if (ctx) master.gain.setTargetAtTime(off ? 0 : LOUD, ctx.currentTime, 0.02);
}

export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const NAMES: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// "d5", "c#4", "bb2" → MIDI number.
export const midi = (n: string) => {
  const m = /^([a-g])(#|b)?(\d)$/.exec(n)!;
  return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
};

// A note: oscillator from `from` Hz (sliding to `to`), quick attack, held, then released by the end.
function note(out: AudioNode, wave: Wave, at: number, dur: number, vol: number, from: number, to = from) {
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
// Filtered noise burst: hats, snares, whip cracks, splashes.
function burst(out: AudioNode, at: number, dur: number, vol: number, type: BiquadFilterType, from: number, to = from) {
  const c = ctx!, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise; s.loop = true;
  f.type = type; f.frequency.setValueAtTime(from, at);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  s.connect(f).connect(g).connect(out);
  s.start(at, Math.random()); s.stop(at + dur + 0.02);
}
// The same two, on the effects bus.
export const tone = (wave: Wave, at: number, dur: number, vol: number, from: number, to = from) => note(effects, wave, at, dur, vol, from, to);
export const hiss = (at: number, dur: number, vol: number, type: BiquadFilterType, from: number, to = from) => burst(effects, at, dur, vol, type, from, to);

// --- Music ---------------------------------------------------------------------------------------------------------
// Each token is one step: a note, "-" to hold the previous one, "." for silence; drums use k (kick), s (snare), h (hat).
let playing: Song | null = null, timer = 0, bus: GainNode | null = null, tempo = 1;

function drum(out: AudioNode, kind: string, at: number) {
  if (kind === "k") note(out, "sine", at, 0.12, 0.35, 150, 40);
  else if (kind === "s") burst(out, at, 0.12, 0.18, "bandpass", 1800, 900);
  else if (kind === "h") burst(out, at, 0.04, 0.06, "highpass", 7000);
}

// `rate` speeds the song up from the next step on, without restarting it (a runner that gets faster).
export function play(song: Song, rate = 1) {
  if (!ctx) return;
  tempo = rate;
  if (playing === song) return;
  stop();
  playing = song;
  const c = ctx, out = (bus = c.createGain());
  out.connect(music);
  const tracks = song.tracks.map((t) => ({ ...t, steps: t.notes.split(/\s+/) }));
  const length = Math.max(...tracks.map((t) => t.steps.length));
  let index = 0, next = c.currentTime + 0.05;
  // Looks a little ahead and schedules on the audio clock, so timer jitter never reaches the beat.
  const pump = () => {
    const step = song.step / tempo;
    while (next < c.currentTime + 0.15) {
      for (const t of tracks) {
        const s = t.steps[index % t.steps.length];
        if (t.wave === "drums") { drum(out, s, next); continue; }
        if (s === "-" || s === ".") continue;
        let held = 1;
        while (t.steps[(index + held) % t.steps.length] === "-" && held < t.steps.length) held++;
        note(out, t.wave, next, held * step * 0.95, t.vol, hz(midi(s)));
      }
      index = (index + 1) % length;
      next += step;
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
export function jingle(notes: [string, number][], step: number, root?: string) {
  if (!ctx) return;
  let at = ctx.currentTime + 0.02;
  if (root) note(effects, "triangle", at, notes.reduce((n, [, d]) => n + d, 0) * step, 0.14, hz(midi(root)));
  for (const [n, d] of notes) { if (n !== ".") note(effects, "square", at, d * step * 0.92, 0.07, hz(midi(n))); at += d * step; }
}

const last: Record<string, number> = {};
// Plays an effect unless the same one just played (several pickups in one frame make one sound).
export function once(name: string, fn: (at: number) => void) {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - (last[name] ?? -1) < 0.04) return;
  last[name] = now;
  fn(now);
}
