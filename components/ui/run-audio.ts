// Music and effects for Corrida na Mesa, on the shared WebAudio engine (chiptune.ts). Silent until `unlock()` runs inside
// a user gesture (the tap on the succulent), as browsers require.
import * as chip from "./chiptune";
import { hiss, hz, jingle, midi, once, tone, type Song } from "./chiptune";

const MUTE = "desk-run-sound";
export const unlock = () => chip.unlock(MUTE);
export const muted = () => chip.muted(MUTE);
export const setMuted = (off: boolean) => chip.setMuted(MUTE, off);

// --- Music ---------------------------------------------------------------------------------------------------------
const SONGS: Record<"title" | "garden" | "run", Song> = {
  // Title scene: sunrise on the windowsill, a slow music-box tune in G over rolling arpeggios.
  title: {
    step: 60 / 76 / 2,
    tracks: [
      { wave: "square", vol: 0.035, notes: "d5 - g5 - b5 - a5 g5 e5 - - - d5 - - - c5 - e5 - a5 - g5 f#5 d5 - - - - - . . b4 - d5 - g5 - f#5 e5 c5 - e5 - d5 - c5 b4 a4 - c5 - b4 - a4 f#4 g4 - - - - - . ." },
      { wave: "sine", vol: 0.05, notes: ". . . . . . d6 . . . . . . . g5 . . . . . . . e6 . . . . . a5 . f#5 . . . . . . . d6 . . . . . . . e5 . . . . . . . c6 . . . . . d5 . b5 ." },
      { wave: "triangle", vol: 0.1, notes: "g2 - d3 - b3 - d3 - c3 - g3 - e3 - g3 - a2 - e3 - c3 - e3 - d3 - a3 - f#3 - a3 - g2 - d3 - b2 - d3 - c3 - g3 - e3 - g3 - d3 - a3 - f#3 - c3 - g2 - d3 - g3 - - -" },
    ],
  },
  // Before the run and after it: a lazy G-major tune for a sunny windowsill.
  garden: {
    step: 60 / 92 / 2,
    tracks: [
      { wave: "square", vol: 0.04, notes: "b4 - d5 - g5 - - - f#5 - e5 - d5 - - - c5 - e5 - a5 - - - g5 - f#5 - e5 - - - d5 - g5 - b5 - a5 - g5 - e5 - d5 - - - c5 - b4 - a4 - - - d5 - - - - - - -" },
      { wave: "triangle", vol: 0.05, notes: "g4 - - - - - - - g4 - - - - - - - e4 - - - - - - - e4 - - - - - - - g4 - - - - - - - b4 - - - g4 - - - e4 - - - f#4 - - - - - - - - - - -" },
      { wave: "triangle", vol: 0.11, notes: "g2 - d3 - b2 - d3 - g2 - d3 - b2 - d3 - c3 - g3 - e3 - g3 - c3 - g3 - e3 - g3 - g2 - d3 - b2 - d3 - e2 - b2 - g2 - b2 - c3 - g2 - a2 - e3 - d3 - a2 - f#2 - a2 -" },
    ],
  },
  // The run: a bouncy major chase that speeds up with the ladybug.
  run: {
    step: 60 / 140 / 2,
    tracks: [
      { wave: "square", vol: 0.04, notes: "g5 . d5 g5 b5 - a5 g5 e5 - g5 - d5 - - - c5 . e5 g5 c6 - b5 a5 g5 - e5 - d5 - - - g5 . d5 g5 b5 - a5 g5 e5 - g5 - c6 - b5 - a5 - f#5 - d5 - f#5 - a5 - g5 - - - . -" },
      { wave: "square", vol: 0.022, notes: "b4 - - - d5 - - - c5 - - - b4 - - - e4 - - - g4 - - - g4 - - - f#4 - - - b4 - - - d5 - - - c5 - - - e5 - - - d5 - - - c5 - - - b4 - - - . - - -" },
      { wave: "triangle", vol: 0.12, notes: "g2 . g3 . g2 . g3 . e2 . e3 . e2 . e3 . c2 . c3 . c2 . c3 . d2 . d3 . d2 . d3 . g2 . g3 . g2 . g3 . e2 . e3 . c2 . c3 . d2 . d3 . d2 . d3 . g2 . d2 . g2 . . ." },
      { wave: "drums", vol: 1, notes: "k . h k s . h . k . h k s . h h k . h k s . h . k . h k s s h s k . h k s . h . k . h k s . h h k . h k s . h . k k s . s s s s" },
    ],
  },
};
export type SongName = keyof typeof SONGS;

// `rate` > 1 plays the run faster as the desk speeds up.
export const play = (name: SongName, rate = 1) => chip.play(SONGS[name], rate);
export const stop = chip.stop;

// --- Effects -------------------------------------------------------------------------------------------------------
// Drops climb a pentatonic scale as they're collected in a row, so a long line of them sings.
const DROP = [0, 2, 4, 7, 9, 12, 14, 16];
export const sfx = {
  start: () => once("start", (t) => { tone("square", t, 0.07, 0.05, hz(79)); tone("square", t + 0.07, 0.07, 0.05, hz(83)); tone("square", t + 0.14, 0.16, 0.05, hz(86)); }),
  lane: () => once("lane", (t) => hiss(t, 0.08, 0.07, "bandpass", 1200, 3200)),
  jump: () => once("jump", (t) => tone("square", t, 0.14, 0.05, 220, 660)),
  // The spring's super jump: a boing.
  boing: () => once("boing", (t) => { tone("triangle", t, 0.35, 0.14, 160, 900); tone("square", t, 0.2, 0.03, 330, 1200); }),
  land: () => once("land", (t) => hiss(t, 0.05, 0.1, "lowpass", 700, 200)),
  slide: () => once("slide", (t) => hiss(t, 0.22, 0.1, "bandpass", 3000, 800)),
  drop: (n: number) => once("drop", (t) => tone("sine", t, 0.09, 0.16, hz(79 + DROP[n % DROP.length]) * 0.7, hz(79 + DROP[n % DROP.length]))),
  sun: () => once("sun", (t) => { for (let i = 0; i < 5; i++) tone("triangle", t + i * 0.05, 0.12, 0.1, hz(midi("g5") + [0, 4, 7, 12, 16][i])); }),
  spring: () => once("spring", (t) => { for (let i = 0; i < 3; i++) tone("square", t + i * 0.07, 0.1, 0.05, 300 + i * 200, 700 + i * 300); }),
  slip: () => once("slip", (t) => { tone("sine", t, 0.4, 0.12, 900, 250); hiss(t, 0.3, 0.06, "lowpass", 1500, 400); }),
  bump: () => once("bump", (t) => { tone("square", t, 0.1, 0.07, 200, 90); hiss(t, 0.06, 0.12, "lowpass", 900); }),
  // The cat notices her: a meow rising then falling.
  meow: () => once("meow", (t) => { tone("sawtooth", t, 0.18, 0.05, 520, 820); tone("sawtooth", t + 0.18, 0.3, 0.05, 820, 420); }),
  crash: () => once("crash", (t) => { tone("square", t, 0.3, 0.08, 400, 70); hiss(t, 0.25, 0.18, "lowpass", 2500, 200); }),
  // Caught: the paw thumps down.
  swat: () => once("swat", (t) => { tone("sine", t, 0.25, 0.3, 140, 40); hiss(t, 0.15, 0.2, "lowpass", 1200, 150); }),
  over: () => jingle([["d5", 2], ["c5", 2], ["b4", 2], ["a4", 2], ["g4", 6]], 0.1, "g2"),
  record: () => jingle([["g5", 1], ["b5", 1], ["d6", 1], ["g6", 3], ["f#6", 1], ["g6", 4]], 0.09, "g3"),
};
