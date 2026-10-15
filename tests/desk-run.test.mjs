import { test } from "node:test";
import { strict as assert } from "node:assert";
import { rng } from "../lib/rng.ts";
import { CHASE, WALLS, act, covers, fresh, place, score, step } from "../components/ui/runner.ts";

const run = (r, seconds, each) => { for (let t = 0; t < seconds && !r.over; t += 1 / 60) { each?.(r); step(r, 1 / 60); } return r; };
const empty = () => fresh(rng(1), { build: false, steady: true });

test("every stretch of generated desk leaves a lane open at ground level", () => {
  for (const seed of [1, 2, 3, 42, 777]) {
    const r = fresh(rng(seed));
    // Walk the desk in jumps, keeping each obstacle before the run drops it behind.
    const seen = new Set();
    for (let d = 0; d < 6000; d += 40) { r.dist = d; step(r, 0); r.obs.forEach((o) => seen.add(o)); r.over = false; }
    const obs = [...seen];
    assert.ok(obs.length > 400);
    const end = Math.max(...obs.map((o) => o.z + o.d));
    for (let z = 0; z < end; z += 0.25) {
      const open = [-1, 0, 1].filter((lane) => !obs.some((o) => {
        if (!WALLS.includes(o.kind) || !covers(o, lane) || o.z > z || o.z + o.d < z) return false;
        // A notebook with a ruler leaning on it can be climbed.
        return !(o.kind === "notebook" && obs.some((p) => p.kind === "ruler" && p.lane === lane && p.z + p.d === o.z));
      }));
      assert.ok(open.length > 0, `seed ${seed}: no open lane at z=${z}`);
    }
  }
});

test("running into a pencil ends the run; hopping it doesn't", () => {
  const r = empty(); place(r, "pencil", 0, 10);
  assert.equal(run(r, 2).over, "front");
  const h = empty(); place(h, "pencil", 0, 10);
  run(h, 2, (g) => { if (g.dist > 7 && g.dist < 8) act(g, "jump"); });
  assert.equal(h.over, false);
  assert.ok(h.dist > 20);
});

test("the lanyard is passed by sliding under it", () => {
  const r = empty(); place(r, "cord", 0, 10);
  assert.equal(run(r, 2).over, "front");
  const s = empty(); place(s, "cord", 0, 10);
  run(s, 2, (g) => { if (g.dist > 7 && g.dist < 8) act(g, "slide"); });
  assert.equal(s.over, false);
});

test("the ruler carries her up onto the notebook, and she runs along its cover", () => {
  const r = empty(); place(r, "ruler", 0, 10); place(r, "notebook", 0, 14);
  run(r, 1.4);
  assert.equal(r.over, false);
  assert.ok(r.dist > 16 && r.dist < 26);
  assert.ok(Math.abs(r.y - 2.2) < 0.01, `y=${r.y}`);
  const w = empty(); place(w, "notebook", 0, 10);
  assert.equal(run(w, 2).over, "front");
});

test("a knock to the side is a stumble; a second one inside the chase is the paw", () => {
  const r = empty(); place(r, "postit", 1, 4); place(r, "postit", 1, 40);
  run(r, 4 / 14); // alongside the first sticky note
  act(r, "right");
  assert.equal(r.lane, 0);
  assert.equal(r.over, false);
  assert.equal(r.chase, CHASE);
  run(r, (40 - r.dist) / 14 + 0.01);
  act(r, "right");
  assert.equal(r.over, "caught");
});

test("drops count ten points each on top of the distance", () => {
  const r = empty();
  r.items.push({ kind: "drop", lane: 0, z: 5, y: 0.5, taken: false }, { kind: "drop", lane: 1, z: 6, y: 0.5, taken: false });
  run(r, 1);
  assert.equal(r.drops, 1);
  assert.equal(score(r), Math.floor(r.dist) + 10);
});

test("the sun pulls drops in from the other lanes", () => {
  const r = empty();
  r.items.push({ kind: "sun", lane: 0, z: 3, y: 0.5, taken: false }, { kind: "drop", lane: -1, z: 12, y: 0.5, taken: false });
  run(r, 1.2);
  assert.ok(r.magnet > 0);
  assert.equal(r.drops, 1);
});
