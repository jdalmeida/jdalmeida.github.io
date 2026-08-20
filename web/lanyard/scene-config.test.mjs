import test from "node:test";
import assert from "node:assert/strict";

import {
  DIALOG_FRAME,
  bodyPositions,
  fitDistance,
  homeAnchors,
  homeFrame,
  isShortClick,
  lerpFactor,
  pointerDelta,
} from "./scene-config.mjs";

test("places four anchors around the center of one physics world", () => {
  assert.deepEqual(homeAnchors(4), [
    [-3.6, 4, -0.15],
    [-1.2, 4, 0.15],
    [1.2, 4, -0.15],
    [3.6, 4, 0.15],
  ]);
});

test("keeps every home anchor inside the frame the camera fits", () => {
  for (const count of [1, 4, 5, 8]) {
    const outer = Math.max(...homeAnchors(count).map(([x]) => Math.abs(x)));
    assert.ok(outer + 1.62 / 2 < homeFrame(count).width / 2, `${count} anchors`);
  }
});

test("backs the camera off for the shorter axis of the canvas", () => {
  const wide = fitDistance(homeFrame(4), 20, 16 / 9);
  const narrow = fitDistance(homeFrame(4), 20, 1);
  assert.equal(Math.round(wide * 100) / 100, 17.86);
  assert.equal(Math.round(narrow * 100) / 100, 26.66);
  assert.ok(narrow > wide);
});

test("backs the camera off further for a longer row", () => {
  assert.ok(
    fitDistance(homeFrame(4), 20, 16 / 9) < fitDistance(homeFrame(5), 20, 16 / 9),
  );
});

test("frames one dialog credential closer than the home row", () => {
  assert.ok(
    fitDistance(DIALOG_FRAME, 20, 0.5) < fitDistance(homeFrame(4), 20, 0.5),
  );
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

test("caps rope interpolation after a delayed frame", () => {
  assert.equal(lerpFactor(1 / 60, 30), 0.5);
  assert.equal(lerpFactor(2, 30), 1);
});

test("measures movement for the pointer that started a drag", () => {
  assert.equal(pointerDelta({ x: 10, y: 20 }, { x: 13, y: 24 }), 5);
});
