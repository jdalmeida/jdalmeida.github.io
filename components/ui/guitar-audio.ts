// Music and effects for Solo de Strato, on the shared WebAudio engine (chiptune.ts). Silent until `unlock()` runs inside
// a user gesture (the click on the guitar), as browsers require. The backing track plays the drums and bass; the lead
// is the player's: each hit sounds its note, so a missed note is a missing one.
import * as chip from "./chiptune";
import { hiss, hz, jingle, midi, once, tone, type Song } from "./chiptune";
import { countIn, DRUMS, SCALE, stepOf, tokens, type Jam } from "./guitar";

const MUTE = "guitar-sound";
export const unlock = () => chip.unlock(MUTE);
export const muted = () => chip.muted(MUTE);
export const setMuted = (off: boolean) => chip.setMuted(MUTE, off);
export const clock = chip.clock;
export const stop = chip.stop;

// `lead` adds the lead line to the mix (the editor's preview); a game leaves it to the player.
export function play(jam: Jam, lead = false) {
  const count = countIn(jam.bpm), drums = DRUMS[jam.drums].notes;
  const song: Song = {
    step: stepOf(jam.bpm),
    tracks: [
      // The count-in is hats only, then the loop; the bass and lead wait out the same steps.
      { wave: "drums", vol: 1, notes: "h . ".repeat(count / 2) + ` ${drums}`.repeat(Math.ceil(jam.lead.length / 8)) },
      ...(jam.bass ? [{ wave: "triangle" as const, vol: 0.12, notes: tokens(jam.bass, count, 1) }] : []),
      ...(lead ? [{ wave: "square" as const, vol: 0.05, notes: tokens(jam.lead, count) }] : []),
    ],
  };
  chip.play(song);
}

// A hit note: two detuned squares and a saw an octave down, a little crunch like a cranked practice amp.
export function pluck(pitch: number, seconds: number) {
  const f = hz(midi(SCALE[pitch]));
  once(`pluck${pitch}`, (at) => {
    tone("square", at, seconds, 0.05, f);
    tone("square", at, seconds, 0.035, f * 1.006);
    tone("sawtooth", at, seconds * 0.8, 0.03, f / 2);
    hiss(at, 0.03, 0.05, "highpass", 3000);
  });
}

export const sfx = {
  // A strum at nothing, or a missed note: a muted, scratchy plec.
  plec: () => once("plec", (t) => { hiss(t, 0.06, 0.12, "bandpass", 1800, 600); tone("square", t, 0.05, 0.03, 110, 80); }),
  miss: () => once("miss", (t) => tone("sawtooth", t, 0.18, 0.04, 140, 90)),
  // The crowd gave up: feedback squeal, then the amp cuts out.
  fail: () => once("fail", (t) => { tone("square", t, 0.7, 0.05, 1900, 2600); tone("sawtooth", t + 0.6, 0.4, 0.08, 200, 40); hiss(t + 0.6, 0.4, 0.1, "lowpass", 1500, 100); }),
  done: () => jingle([["e5", 1], ["g5", 1], ["b5", 1], ["e6", 4]], 0.09, "e3"),
  record: () => jingle([["e5", 1], ["g5", 1], ["a5", 1], ["b5", 1], ["d6", 1], ["e6", 4], ["d6", 1], ["e6", 4]], 0.08, "e3"),
};
