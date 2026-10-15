// Chiptune for the café castle, on the shared WebAudio engine (chiptune.ts). Silent until `unlock()` runs inside a user
// gesture (the click on the mug), as browsers require.

import * as chip from "./chiptune";
import { hiss, hz, jingle, once, tone, type Song } from "./chiptune";

const MUTE = "cafe-castle-sound";
export const unlock = () => chip.unlock(MUTE);
export const muted = () => chip.muted(MUTE);
export const setMuted = (off: boolean) => chip.setMuted(MUTE, off);

// --- Music ---------------------------------------------------------------------------------------------------------
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

export const play = (name: SongName) => chip.play(SONGS[name]);
export const stop = chip.stop;

// --- Effects -------------------------------------------------------------------------------------------------------
export const sfx = {
  jump: () => once("jump", (t) => tone("square", t, 0.13, 0.06, 180, 560)),
  land: () => once("land", (t) => hiss(t, 0.06, 0.12, "lowpass", 600, 200)),
  whip: () => once("whip", (t) => { hiss(t, 0.14, 0.22, "bandpass", 900, 4500); tone("square", t + 0.09, 0.03, 0.05, 2200, 1400); }),
  bean: () => once("bean", (t) => { tone("square", t, 0.05, 0.06, hz(83)); tone("square", t + 0.05, 0.12, 0.06, hz(88)); }),
  candle: () => once("candle", (t) => { hiss(t, 0.2, 0.15, "bandpass", 3000, 600); tone("triangle", t, 0.15, 0.1, hz(76), hz(88)); }),
  hit: () => once("hit", (t) => { tone("square", t, 0.08, 0.07, 260, 120); hiss(t, 0.06, 0.15, "bandpass", 2500); }),
  bones: () => once("bones", (t) => { for (let i = 0; i < 4; i++) hiss(t + i * 0.045, 0.05, 0.16, "bandpass", 1200 + i * 500); tone("triangle", t, 0.25, 0.1, 400, 90); }),
  bat: () => once("bat", (t) => tone("square", t, 0.16, 0.05, 1500, 300)),
  hurt: () => once("hurt", (t) => { tone("square", t, 0.28, 0.08, 520, 90); hiss(t, 0.15, 0.12, "lowpass", 1500, 300); }),
  shot: () => once("shot", (t) => tone("sawtooth", t, 0.3, 0.06, 160, 70)),
  wake: () => once("wake", (t) => { tone("triangle", t, 1.6, 0.22, 55); tone("square", t, 1.2, 0.03, 110, 104); hiss(t, 1.2, 0.1, "lowpass", 900, 100); }),
  // The Count's tells, matching the drawn ones: a growl before the dash, a bubbling brew before the cast, a screech before the bats.
  dash: () => once("dash", (t) => tone("sawtooth", t, 0.45, 0.06, 70, 130)),
  cast: () => once("cast", (t) => { for (let i = 0; i < 5; i++) tone("sine", t + i * 0.08, 0.06, 0.12, 300 + i * 90); }),
  bats: () => once("bats", (t) => tone("square", t, 0.4, 0.04, 2400, 900)),
  blink: () => once("blink", (t) => hiss(t, 0.35, 0.18, "bandpass", 400, 5000)),
  bossHit: () => once("bossHit", (t) => { tone("square", t, 0.12, 0.08, 180, 70); hiss(t, 0.1, 0.2, "bandpass", 1600, 400); }),
  bossDown: () => once("bossDown", (t) => { for (let i = 0; i < 6; i++) hiss(t + i * 0.12, 0.25, 0.25, "lowpass", 2000 - i * 250, 100); tone("triangle", t, 1.2, 0.2, 220, 40); }),
  select: () => once("select", (t) => tone("square", t, 0.06, 0.05, hz(81))),
  start: () => once("start", (t) => { tone("square", t, 0.07, 0.06, hz(74)); tone("square", t + 0.07, 0.07, 0.06, hz(81)); tone("square", t + 0.14, 0.16, 0.06, hz(86)); }),
  clear: () => jingle([["d5", 1], ["f5", 1], ["a5", 1], ["d6", 3], ["c6", 1], ["d6", 4]], 0.09, "d3"),
  die: () => once("die", (t) => { for (let i = 0; i < 4; i++) tone("square", t + i * 0.16, 0.15, 0.07, hz(69 - i * 2), hz(68 - i * 2)); }),
  // Last cup served: the sun rises.
  victory: () => jingle([["d5", 2], ["f5", 2], ["a5", 2], ["d6", 4], ["c6", 2], ["bb5", 2], ["a5", 2], ["bb5", 4], [".", 1], ["a5", 2], ["f#5", 2], ["a5", 2], ["d6", 8]], 0.11, "d3"),
};
