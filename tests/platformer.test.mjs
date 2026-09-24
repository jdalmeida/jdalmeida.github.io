import { test } from "node:test";
import { strict as assert } from "node:assert";
import { STAGES, fresh, lash, loot, merge, step, validProgress } from "../components/ui/platformer.ts";

const idle = { left: false, right: false, jump: false, whip: false };
const run = (g, input, seconds) => { for (let t = 0; t < seconds; t += 1 / 60) step(g, { ...idle, ...input }, 1 / 60); return g; };

test("every stage is rectangular with one start, a door and loot", () => {
  STAGES.forEach(({ map }, i) => {
    for (const row of map) assert.equal(row.length, map[0].length);
    assert.equal(map.join("").split("P").length, 2);
    assert.match(map.join(""), /D/);
    assert.ok(loot(i) > 0);
  });
});

test("hero lands and stays on the floor", () => {
  const g = run(fresh(0), {}, 1);
  assert.ok(g.ground);
  assert.equal(g.state, "play");
});

test("walking right without jumping ends in boiling coffee or a skeleton", () => {
  assert.equal(run(fresh(0), { right: true }, 6).state, "dead");
});

test("the left edge is a wall", () => {
  assert.equal(run(fresh(0), { left: true }, 1).x, 0);
});

test("the whip hits only mid-swing, in front of the hero", () => {
  const g = run(fresh(0), {}, 1);
  step(g, { ...idle, whip: true }, 1 / 60);
  assert.equal(lash(g), null);
  run(g, { whip: true }, 0.1);
  assert.ok(lash(g).x >= g.x);
});

test("whipping a skeleton twice kills it", () => {
  const g = run(fresh(0), {}, 0.5);
  const skel = g.foes.find((f) => f.kind === "skel");
  Object.assign(skel, { x: g.x + 12, vx: 0 });
  for (let i = 0; i < 2; i++) { run(g, { whip: true }, 0.35); run(g, {}, 0.05); skel.x = g.x + 12; }
  assert.ok(skel.dead);
});

test("touching a foe costs one heart", () => {
  const g = run(fresh(0), {}, 0.5);
  Object.assign(g.foes.find((f) => f.kind === "skel"), { x: g.x, y: g.y, vx: 0 });
  run(g, {}, 0.1);
  assert.equal(g.hp, 3);
});

test("jumping through a ledge from below lands on top of it", () => {
  const g = fresh(0);
  // Under the first ledge (row 8, columns 30-34).
  Object.assign(g, { x: 31 * 8, y: 12 * 8 - 13 });
  run(g, { jump: true }, 0.4);
  run(g, {}, 0.6);
  assert.equal(g.y + 13, 8 * 8);
});

test("progress merges to the larger values and rejects nonsense", () => {
  assert.deepEqual(merge({ cleared: 2, best: [3] }, { cleared: 1, best: [1, 4] }), { cleared: 2, best: [3, 4, 0] });
  assert.ok(validProgress({ cleared: 1, best: [2, 0] }));
  assert.ok(!validProgress({ cleared: 9, best: [] }));
  assert.ok(!validProgress({ cleared: 1, best: [999] }));
  assert.ok(!validProgress(null));
});
