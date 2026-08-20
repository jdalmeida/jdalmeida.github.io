import test from "node:test";
import assert from "node:assert/strict";

import {
  ANCHOR_HEIGHT,
  CARD_BOTTOM,
  CARD_HALF_HEIGHT,
  CARD_WIDTH,
  DIALOG_FRAME,
  DIALOG_SPAWN_DROP,
  bodyPositions,
  fitDistance,
  framePosition,
  homeAnchors,
  homeDrop,
  homeFrame,
  isShortClick,
  lerpFactor,
  pointerDelta,
} from "./scene-config.mjs";

const round = (value) => Math.round(value * 1000) / 1000;

test("places four anchors around the center of one physics world", () => {
  assert.deepEqual(homeAnchors(4), [
    [-3.3, 4, -0.15],
    [-1.1, 3.4, 0.15],
    [1.1, 4, -0.15],
    [3.3, 3.4, 0.15],
  ]);
});

test("hangs every other credential lower than its neighbours", () => {
  const heights = homeAnchors(5).map(([, y]) => y);
  for (const [index, height] of heights.entries()) {
    assert.notEqual(height, heights[index + 1]);
    assert.equal(height, 4 - homeDrop(index));
  }
});

test("keeps every home anchor inside the frame the camera fits", () => {
  for (const count of [1, 4, 5, 8]) {
    const frame = homeFrame(count);
    const outer = Math.max(...homeAnchors(count).map(([x]) => Math.abs(x)));
    assert.ok(outer + CARD_WIDTH / 2 < frame.width / 2, `${count} wide`);

    // The frame runs from above the anchors to below the lowest card.
    const top = frame.center + frame.height / 2;
    const bottom = frame.center - frame.height / 2;
    const lowest = Math.min(...homeAnchors(count).map(([, y]) => y));
    assert.ok(top > 4, `${count} top`);
    assert.ok(bottom < CARD_BOTTOM - (4 - lowest), `${count} bottom`);
  }
});

// The stagger only uses the room the width of the row already leaves, so the
// credentials keep their size on the canvas the home page gives the scene.
test("fits the staggered row without backing the camera off further", () => {
  const aspect = 1240 / 760;
  const frame = homeFrame(5);
  const flat = { ...frame, height: frame.height - 0.6 };
  assert.equal(
    Math.round(fitDistance(frame, 20, aspect) * 100),
    Math.round(fitDistance(flat, 20, aspect) * 100),
  );
});

test("backs the camera off for the shorter axis of the canvas", () => {
  const wide = fitDistance(homeFrame(4), 20, 16 / 9);
  const narrow = fitDistance(homeFrame(4), 20, 1);
  assert.equal(Math.round(wide * 100) / 100, 19.99);
  assert.equal(Math.round(narrow * 100) / 100, 27.28);
  assert.ok(narrow > wide);
});

test("never brings the camera closer as the row grows", () => {
  const distance = (count) => fitDistance(homeFrame(count), 20, 1240 / 760);
  assert.ok(distance(5) >= distance(4));
  assert.ok(distance(8) > distance(5));
});

test("frames one dialog credential closer than the home row", () => {
  assert.ok(
    fitDistance(DIALOG_FRAME, 20, 0.5) < fitDistance(homeFrame(4), 20, 0.5),
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
  const frame = homeFrame(4);
  const aspect = 16 / 9;
  const distance = fitDistance(frame, 20, aspect);
  assert.deepEqual(framePosition(frame, 20, aspect, distance), [0, frame.center]);
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

test("hangs the rope bodies on the line down to a dropped card", () => {
  assert.deepEqual(bodyPositions([0, 4, 0], 2), [
    [0, 4, 0],
    [0.5, 3.5, 0],
    [1, 3, 0],
    [1.5, 2.5, 0],
    [2, 2, 0],
  ]);
});

test("caps rope interpolation after a delayed frame", () => {
  assert.equal(lerpFactor(1 / 60, 30), 0.5);
  assert.equal(lerpFactor(2, 30), 1);
});

test("measures movement for the pointer that started a drag", () => {
  assert.equal(pointerDelta({ x: 10, y: 20 }, { x: 13, y: 24 }), 5);
});
