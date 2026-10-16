import { test } from "node:test";
import { strict as assert } from "node:assert";
import { advance, best, chart, decode, encode, fresh, SONG, strum, timeOf, WINDOW } from "../components/ui/guitar.ts";

const jam = (lead, bpm = 120) => ({ title: "t", bpm, drums: 0, lead });

test("the lead line is the chart: notes, holds and lanes by pitch", () => {
  assert.deepEqual(chart("a-.f..k-").map(({ step, lane, len }) => [step, lane, len]), [[0, 0, 2], [3, 1, 1], [6, 2, 2]]);
  assert.equal(chart(".-a").length, 1); // a hold after a rest holds nothing
});

test("strums are judged by distance to the note; a strum at nothing costs nothing", () => {
  const p = fresh(jam("a.f.k..."));
  const [a, f, k] = p.notes;
  assert.equal(strum(p, 0, timeOf(p, a) + WINDOW.perfect / 2)?.judge, "perfect");
  assert.equal(strum(p, 1, timeOf(p, f) - (WINDOW.perfect + WINDOW.good) / 2)?.judge, "good");
  assert.equal(strum(p, 1, timeOf(p, k)), null); // wrong string
  assert.equal(p.combo, 2);
  assert.deepEqual(advance(p, timeOf(p, k) + WINDOW.good + 0.01), [k]);
  assert.equal(k.judge, "miss");
  assert.equal(p.combo, 0);
  advance(p, p.end);
  assert.equal(p.over, "done");
  assert.equal(p.score, 150);
});

test("too many misses boo the player off", () => {
  const p = fresh(jam("a".repeat(24)));
  advance(p, p.end);
  assert.equal(p.over, "failed");
  assert.equal(p.hits.miss, 12); // a meter of 60, 5 a miss
});

test("perfect play of the song scores its best, the server's cap", () => {
  const p = fresh(SONG);
  for (const n of p.notes) strum(p, n.lane, timeOf(p, n));
  advance(p, p.end);
  assert.equal(p.over, "done");
  assert.equal(p.score, best(SONG));
  assert.equal(best(SONG), 34300); // lib/jams.ts and JAM_TIERS assume this
});

test("links round-trip, and anything off is refused", () => {
  const j = { title: "Riff & cia", bpm: 140, drums: 2, lead: "a.f-h...".repeat(2) };
  assert.deepEqual(decode("#" + encode(j)), j);
  for (const bad of ["jam=a.f&bpm=120&d=0", "jam=a.f.....z&bpm=120&d=0", "jam=a.......&bpm=20&d=0", "jam=a.......&bpm=120&d=9", "jam=........&bpm=120&d=0"])
    assert.equal(decode(bad), null, bad);
  assert.equal(decode(`jam=a.......&bpm=120&d=0&t=${encodeURIComponent("\u0000  ")}`).title, "Sem título");
});
