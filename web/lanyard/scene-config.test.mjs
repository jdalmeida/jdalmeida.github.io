import test from "node:test";
import assert from "node:assert/strict";

import {
  ANCHOR_HEIGHT,
  BREEZE_PHASE_STEP,
  BREEZE_STRENGTH,
  BREEZE_YAW,
  CARD_BOTTOM,
  CARD_HALF_HEIGHT,
  CARD_WIDTH,
  DIALOG_FRAME,
  DIALOG_SPAWN_DROP,
  LOOSE_STRAPS,
  LOOSE_STRAP_JOINTS,
  bodyPositions,
  breeze,
  fitDistance,
  framePosition,
  heroAnchors,
  heroCardCenter,
  heroFrame,
  heroHook,
  heroHooks,
  heroRopes,
  heroStrapWidths,
  heroYaws,
  isShortClick,
  lerpFactor,
  looseBodyPositions,
  looseStrapAnchors,
  pointerDelta,
  yawTarget,
} from "./scene-config.mjs";

const round = (value) => Math.round(value * 1000) / 1000;

test("hangs the whole bunch from one hook", () => {
  for (const [, y] of heroAnchors(5)) {
    assert.equal(y, ANCHOR_HEIGHT);
  }
  const [, hookY] = heroHook();
  assert.ok(hookY > ANCHOR_HEIGHT, "the hook sits above every anchor");
});

// The card collider is 0.01 deep, so two credentials on different layers never
// touch. That is what lets them overlap on screen instead of shoving each other
// sideways — without it the bunch would push itself back into a row.
test("gives every credential its own depth layer", () => {
  for (const count of [1, 4, 5, 8]) {
    const depths = heroAnchors(count).map(([, , z]) => z);
    assert.equal(new Set(depths).size, count, `${count} layers`);
  }
});

test("puts the most recent event at the front of the bunch", () => {
  const depths = heroAnchors(5).map(([, , z]) => z);
  assert.equal(Math.max(...depths), depths[0]);
  assert.equal(Math.min(...depths), depths.at(-1));
});

// A credential straight behind another is a credential nobody can see.
test("never hangs two credentials from the same spot", () => {
  const columns = heroAnchors(5).map(([x]) => x);
  assert.equal(new Set(columns).size, 5);
});

test("varies the rope, and with it the height each card rests at", () => {
  const heights = heroRopes(5).map(heroCardCenter);
  assert.equal(new Set(heights).size, 5);
  for (const height of heights) {
    assert.ok(height < ANCHOR_HEIGHT, "every card hangs below the hook");
  }
});

test("gives the straps different widths", () => {
  assert.ok(new Set(heroStrapWidths(5)).size > 1);
});

// No credential faces the camera head on: each one is turned a different way,
// and that is what makes the set read as a bunch instead of parallel cards.
test("turns every credential a different way", () => {
  const yaws = heroYaws(5);
  assert.equal(new Set(yaws).size, 5);
  assert.ok(
    yaws.some((yaw) => yaw > 0) && yaws.some((yaw) => yaw < 0),
    "the bunch opens both ways",
  );
  for (const yaw of yaws) {
    const degrees = Math.abs((yaw * 180) / Math.PI);
    assert.ok(degrees >= 5 && degrees <= 30, `${degrees} degrees`);
  }
});

// The rotation spring compares the quaternion's y component, not the angle.
test("aims the rotation spring at the quaternion, not the angle", () => {
  assert.equal(yawTarget(0), 0);
  assert.equal(yawTarget(Math.PI / 2), Number(Math.SQRT1_2.toFixed(6)));
  for (const yaw of heroYaws(5)) {
    assert.equal(Math.sign(yawTarget(yaw)), Math.sign(yaw));
  }
});

// No two straps meet the hook at the same spot, or the ends gather into a
// perfect point; and they converge in depth only part of the way, or every
// strap would cross in the same plane and the overlap would go.
test("lands each strap on its own spot of the hook", () => {
  const hooks = heroHooks(5);
  assert.equal(new Set(hooks.map(([x]) => x)).size, 5);
  const [hookX, hookY] = heroHook();
  for (const [index, [x, y, z]] of hooks.entries()) {
    assert.ok(Math.abs(x - hookX) < 0.25, "near the hook");
    assert.ok(y <= hookY && y > hookY - 0.25, "just under the top");
    const depth = heroAnchors(5)[index][2];
    assert.ok(Math.abs(z) < Math.abs(depth) || depth === 0, "pulled toward the middle");
    assert.equal(Math.sign(z), Math.sign(depth));
  }
});

test("keeps every card, and the hook, inside the frame the camera fits", () => {
  for (const count of [1, 4, 5, 8]) {
    const frame = heroFrame(count);
    const top = frame.center + frame.height / 2;
    const bottom = frame.center - frame.height / 2;
    const right = frame.offset + frame.width / 2;
    const left = frame.offset - frame.width / 2;

    assert.ok(top > heroHook()[1], `${count} hook`);
    for (const [index, [x]] of heroAnchors(count).entries()) {
      assert.ok(x + CARD_WIDTH / 2 < right, `${count} right`);
      assert.ok(x - CARD_WIDTH / 2 > left, `${count} left`);
      const card = heroCardCenter(heroRopes(count)[index]);
      assert.ok(card - CARD_HALF_HEIGHT > bottom, `${count} bottom`);
    }
  }
});

// The floor follows the longest rope in play, so a credential that hangs lower
// than the ones before it is not cropped.
test("drops the floor when a longer rope joins the bunch", () => {
  const floor = (count) => heroFrame(count).center - heroFrame(count).height / 2;
  assert.ok(Math.max(...heroRopes(5)) > Math.max(...heroRopes(2)));
  assert.ok(floor(5) < floor(2));
});

test("hangs the loose straps behind the deepest credential", () => {
  const deepest = Math.min(...heroAnchors(5).map(([, , z]) => z));
  const loose = looseStrapAnchors(5);
  assert.equal(loose.length, LOOSE_STRAPS.length);
  for (const [, y, z] of loose) {
    assert.equal(y, ANCHOR_HEIGHT);
    assert.ok(z < deepest, "a loose strap never crosses in front of a card");
  }
});

test("backs the camera off for the shorter axis of the canvas", () => {
  // The bunch is a tall box, so a portrait canvas is fitted on its height and
  // only a canvas wider than the box itself is fitted on its width.
  const frame = heroFrame(5);
  const tall = fitDistance(frame, 20, 0.5);
  const square = fitDistance(frame, 20, 1);
  assert.ok(tall > square);
  assert.equal(round(square), round(frame.height / (2 * Math.tan(Math.PI / 18))));
});

test("never brings the camera closer as the bunch grows", () => {
  const distance = (count) => fitDistance(heroFrame(count), 20, 547 / 716);
  assert.ok(distance(5) >= distance(4));
  assert.ok(distance(8) >= distance(5));
});

test("frames one dialog credential closer than the whole bunch", () => {
  assert.ok(
    fitDistance(DIALOG_FRAME, 20, 0.5) < fitDistance(heroFrame(4), 20, 0.5),
  );
});

// The dialog canvas covers the whole modal, so anything the camera drops out of
// frame is cropped in plain sight. The credential has to fit from the moment it
// spawns to the moment it settles.
test("holds the credential the dialog drops, from spawn to rest", () => {
  const card = bodyPositions([0, ANCHOR_HEIGHT, 0], DIALOG_SPAWN_DROP).at(-1);
  const top = DIALOG_FRAME.center + DIALOG_FRAME.height / 2;
  const bottom = DIALOG_FRAME.center - DIALOG_FRAME.height / 2;
  const right = DIALOG_FRAME.offset + DIALOG_FRAME.width / 2;
  const left = DIALOG_FRAME.offset - DIALOG_FRAME.width / 2;

  assert.ok(card[1] + CARD_HALF_HEIGHT < top, "spawn top");
  assert.ok(card[0] + CARD_WIDTH / 2 < right, "spawn side");
  assert.ok(CARD_BOTTOM > bottom, "rest bottom");
  assert.ok(-CARD_WIDTH / 2 > left, "rest side");
});

test("centers a frame that asks for no edge in particular", () => {
  const frame = heroFrame(5);
  const aspect = 16 / 9;
  const distance = fitDistance(frame, 20, aspect);
  assert.deepEqual(framePosition(frame, 20, aspect, distance), [
    frame.offset,
    frame.center,
  ]);
});

// The room a contain fit leaves over falls to the right of the strap and below
// the card, which is where the swing needs it.
test("pins the dialog box to the top left of its canvas", () => {
  const aspect = 1058 / 810;
  const distance = fitDistance(DIALOG_FRAME, 20, aspect);
  const [x, y] = framePosition(DIALOG_FRAME, 20, aspect, distance);
  const halfHeight = distance * Math.tan((20 * Math.PI) / 360);

  assert.equal(
    round(x - halfHeight * aspect),
    round(DIALOG_FRAME.offset - DIALOG_FRAME.width / 2),
  );
  assert.equal(
    round(y + halfHeight),
    round(DIALOG_FRAME.center + DIALOG_FRAME.height / 2),
  );
  assert.ok(x + halfHeight * aspect > DIALOG_FRAME.offset + DIALOG_FRAME.width / 2);
});

test("selects only a pointer release with little movement", () => {
  assert.equal(isShortClick(4), true);
  assert.equal(isShortClick(7), false);
});

test("places every rope body in the anchor world space", () => {
  assert.deepEqual(bodyPositions([-5.4, 4, 0.15]), [
    [-5.4, 4, 0.15],
    [-4.9, 4, 0.15],
    [-4.4, 4, 0.15],
    [-3.9, 4, 0.15],
    [-3.4, 4, 0.15],
  ]);
});

// A longer rope spawns its bodies further apart, so the strap starts slack
// instead of taut and the scene opens without a jerk.
test("spreads the rope bodies by the length of the rope", () => {
  assert.deepEqual(bodyPositions([0, 4, 0], 0, 1.5), [
    [0, 4, 0],
    [0.75, 4, 0],
    [1.5, 4, 0],
    [2.25, 4, 0],
    [3, 4, 0],
  ]);
});

test("hangs the rope bodies on the line down to a dropped card", () => {
  assert.deepEqual(bodyPositions([0, 4, 0], 2), [
    [0, 4, 0],
    [0.5, 3.5, 0],
    [1, 3, 0],
    [1.5, 2.5, 0],
    [2, 2, 0],
  ]);
});

test("gives a loose strap one body per joint, plus the weight on the end", () => {
  const bodies = looseBodyPositions([0, 4, 0], 1.5);
  assert.equal(bodies.length, LOOSE_STRAP_JOINTS + 1);
  assert.deepEqual(bodies.at(-1), [3, 4, 0]);
});

test("caps rope interpolation after a delayed frame", () => {
  assert.equal(lerpFactor(1 / 60, 30), 0.5);
  assert.equal(lerpFactor(2, 30), 1);
});

test("measures movement for the pointer that started a drag", () => {
  assert.equal(pointerDelta({ x: 10, y: 20 }, { x: 13, y: 24 }), 5);
});

test("the breeze stays gentle and never stops", () => {
  let moving = 0;
  for (let step = 0; step < 2000; step += 1) {
    const time = step * 0.05;
    const { x, z, yaw } = breeze(time, 1.1);
    assert.ok(Math.hypot(x, z) <= BREEZE_STRENGTH * 1.1, "never more than a breeze");
    assert.ok(Math.abs(yaw) <= BREEZE_YAW, "twists only a few degrees");
    if (Math.abs(x) > BREEZE_STRENGTH * 0.1) moving += 1;
  }
  assert.ok(moving > 1000, "the bunch is swaying most of the time");
});

test("the breeze reaches each strap a little later", () => {
  const first = breeze(3, 0);
  const second = breeze(3, BREEZE_PHASE_STEP);
  assert.notEqual(first.x, second.x);
  assert.deepEqual(breeze(3 + BREEZE_PHASE_STEP, 0), second);
});
