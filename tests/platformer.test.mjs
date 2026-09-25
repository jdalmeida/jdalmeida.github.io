import { test } from "node:test";
import { strict as assert } from "node:assert";
import { ARENA, BOSS_HP, STAGES, WIND, beanShare, fresh, lash, loot, merge, retry, step, validProgress } from "../components/ui/platformer.ts";

const idle = { left: false, right: false, jump: false, whip: false };
const run = (g, input, seconds) => { for (let t = 0; t < seconds; t += 1 / 60) step(g, { ...idle, ...input }, 1 / 60); return g; };

test("every stage is rectangular with one start, a door and loot", () => {
  assert.equal(STAGES.length, 6);
  STAGES.forEach(({ map }, i) => {
    for (const row of map) assert.equal(row.length, map[0].length);
    assert.equal(map.join("").split("P").length, 2);
    assert.match(map.join(""), /D/);
    assert.ok(loot(i) > 0);
  });
});

test("ground enemies start with solid floor beneath them", () => {
  STAGES.forEach(({ map, name }) => map.forEach((row, y) => [...row].forEach((tile, x) => {
    if (tile === "s" || tile === "v")
      assert.match(map[y + 1]?.[x] ?? "", /[#=]/, `${name}: ${tile} at ${x},${y} lacks floor`);
  })));
});

test("old three-stage progress remains valid and the campaign extends to six", () => {
  assert.ok(validProgress({ cleared: 3, best: [0, 0, 0] }));
  assert.ok(validProgress({ cleared: 6, best: [0, 0, 0, 0, 0, 0] }));
});

test("the final door opens only after the Count is defeated", () => {
  const g = fresh(5);
  const count = g.foes.find((f) => f.kind === "count");
  assert.ok(count);
  const cy = STAGES[5].map.findIndex((row) => row.includes("D"));
  const cx = STAGES[5].map[cy].indexOf("D");
  Object.assign(g, { x: cx * 8, y: (cy + 1) * 8 - 13, ground: true });
  step(g, idle, 1 / 60);
  assert.equal(g.state, "play");
  count.dead = true;
  step(g, idle, 1 / 60);
  assert.equal(g.state, "won");
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

test("a whipped skeleton slides back away from the hero and does no contact damage meanwhile", () => {
  const g = run(fresh(0), {}, 0.5);
  const skel = g.foes.find((f) => f.kind === "skel");
  Object.assign(skel, { x: g.x + 12, vx: 0 });
  const before = skel.x;
  run(g, { whip: true }, 0.35);
  assert.equal(skel.hp, 1);
  assert.ok(skel.x > before + 5, `moved ${skel.x - before}`);
  assert.equal(g.hp, 4);
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
  assert.deepEqual(merge({ cleared: 2, best: [3] }, { cleared: 1, best: [1, 4] }), { cleared: 2, best: [3, 4, 0, 0, 0, 0] });
  assert.ok(validProgress({ cleared: 1, best: [2, 0] }));
  assert.ok(!validProgress({ cleared: 9, best: [] }));
  assert.ok(!validProgress({ cleared: 1, best: [999] }));
  assert.ok(!validProgress(null));
});

// Puts the hero on the hall floor a given distance left of the sleeping Count.
const hall = (gap) => {
  const g = fresh(5), count = g.foes.find((f) => f.kind === "count");
  Object.assign(g, { x: count.home - gap, y: count.y, ground: true });
  return { g, count };
};

test("the Count wakes when the hero comes near and locks the hall", () => {
  const { g, count } = hall(100);
  run(g, {}, 0.1);
  assert.equal(g.boss.act, "sleep");
  run(g, { right: true }, 0.5);
  assert.notEqual(g.boss.act, "sleep");
  run(g, { left: true }, 1);
  assert.equal(g.x, count.home - ARENA);
});

test("the Count winds up, then throws boiling coffee that costs a heart", (t) => {
  t.mock.method(Math, "random", () => 0.5); // walk, dash, cast, bats → cast
  const { g } = hall(60);
  run(g, {}, 0.8);
  assert.equal(g.boss.act, "cast");
  assert.equal(g.shots.length, 0);
  run(g, {}, WIND);
  assert.equal(g.shots.length, 3);
  run(g, {}, 1.5);
  assert.ok(g.hp < 4, `hp ${g.hp}`);
});

test("below half health the Count can blink, and whipping him stops all his tricks", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const { g, count } = hall(60);
  count.hp = BOSS_HP / 2;
  run(g, {}, 0.5);
  assert.equal(g.boss.act, "blink");
  run(g, {}, 0.45);
  assert.ok(Math.abs(count.x - (g.x + 36)) < 2, "reappears beside the hero");
  count.hp = 1; count.x = g.x + 12; g.face = 1; g.boss.act = "rest"; g.boss.t = 0;
  run(g, { whip: true }, 0.2);
  assert.ok(count.dead);
  assert.equal(g.shots.length, 0);
});

test("dying to the Count restarts at his hall", () => {
  const { g, count } = hall(60);
  run(g, {}, 0.1);
  assert.equal(retry(g).x, count.home - ARENA + 2);
  assert.notEqual(retry(fresh(5)).x, count.home - ARENA + 2);
});

test("bean share counts only once the Count is beaten, rounded down", () => {
  const all = STAGES.map((_, i) => loot(i));
  assert.equal(beanShare({ cleared: STAGES.length - 1, best: all }), null);
  assert.equal(beanShare({ cleared: STAGES.length, best: all }), 100);
  assert.equal(beanShare({ cleared: STAGES.length, best: [] }), 0);
  assert.equal(beanShare({ cleared: STAGES.length, best: all.map((n, i) => (i ? n : n - 1)) }), 98); // 94 of 95: one missing bean is no longer 100%
});
