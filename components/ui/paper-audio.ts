// Music and effects for Basquete de papel, on the shared WebAudio engine (chiptune.ts). Silent until `unlock()` runs
// inside a user gesture (the click on the bin), as browsers require.
import * as chip from "./chiptune";
import { hiss, hz, jingle, once, tone, type Song } from "./chiptune";

const MUTE = "paper-toss-sound";
export const unlock = () => chip.unlock(MUTE);
export const muted = () => chip.muted(MUTE);
export const setMuted = (off: boolean) => chip.setMuted(MUTE, off);

// --- Music ---------------------------------------------------------------------------------------------------------
// Office lounge: a swung loop over F - Dm - Gm - C7, three steps per beat (long-short swing), walking bass under it.
const LOUNGE: Song = {
  step: 60 / 104 / 3,
  tracks: [
    { wave: "square", vol: 0.03, notes: "c5 - a4 c5 - d5 e5 - - . - - d5 - f5 a5 - g5 f5 - - d5 - - bb4 - d5 f5 - e5 d5 - c5 bb4 - - e5 - g5 bb5 - a5 g5 - e5 c5 - -" },
    { wave: "triangle", vol: 0.05, notes: "a4 - - - - - - - - - - - f4 - - - - - - - - - - - bb4 - - - - - - - - - - - e4 - - - - - - - - - - -" },
    { wave: "triangle", vol: 0.12, notes: "f2 - - a2 - - c3 - - e3 - - d2 - - f2 - - a2 - - c3 - - g2 - - bb2 - - d3 - - f3 - - c3 - - e3 - - g2 - - bb2 - -" },
    { wave: "drums", vol: 1, notes: "k . . h . h h . . h . h k . . h . h h . . h . h k . . h . h h . . h . h k . . h . h h . . h s s" },
  ],
};
export const play = () => chip.play(LOUNGE);
export const stop = chip.stop;

// --- Effects -------------------------------------------------------------------------------------------------------
// Baskets in a row climb a major pentatonic, so a streak sings its way up.
const UP = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const sfx = {
  // Pulling the ball back: a rubber-band creak that rises with the pull (0..1).
  stretch: (k: number) => once("stretch", (t) => tone("triangle", t, 0.05, 0.05, 200 + 500 * k)),
  // The throw: a whoosh as strong as the pull.
  throw: (k: number) => once("throw", (t) => { hiss(t, 0.25, 0.06 + 0.12 * k, "bandpass", 500, 2500 + 2500 * k); tone("square", t, 0.06, 0.03, 300, 700); }),
  // The ball clips the bin's rim or bumps its side: tinny metal.
  rim: () => once("rim", (t) => { tone("square", t, 0.12, 0.05, 1240, 1180); tone("square", t, 0.09, 0.035, 1790); tone("triangle", t, 0.25, 0.08, 620, 600); }),
  side: () => once("side", (t) => { tone("triangle", t, 0.15, 0.12, 260, 200); hiss(t, 0.06, 0.08, "bandpass", 1500); }),
  // Crumpled paper landing on the floor, softer as the bounces die out (speed 0..1).
  floor: (k: number) => once("floor", (t) => hiss(t, 0.05 + 0.05 * k, 0.04 + 0.16 * clamp(k), "lowpass", 900, 300)),
  // In: a swish into the bin, then a note for the streak.
  basket: (streak: number) => once("basket", (t) => {
    hiss(t, 0.2, 0.14, "highpass", 4000, 1500);
    const n = hz(72 + UP[Math.min(streak - 1, UP.length - 1)]);
    tone("square", t + 0.1, 0.08, 0.05, n); tone("square", t + 0.18, 0.18, 0.05, n * 1.5);
  }),
  // A miss after a streak: the count drops back to zero.
  miss: () => once("miss", (t) => { tone("square", t, 0.14, 0.05, hz(67)); tone("square", t + 0.15, 0.3, 0.05, hz(62), hz(60)); }),
  // A new gust: air through the room, as strong as the wind.
  wind: (k: number) => once("wind", (t) => hiss(t, 0.9, 0.03 + 0.07 * k, "bandpass", 300, 300 + 900 * k)),
  record: () => jingle([["c5", 1], ["e5", 1], ["g5", 1], ["c6", 3], ["b5", 1], ["c6", 4]], 0.08, "c3"),
};
