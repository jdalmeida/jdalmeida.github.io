import test from "node:test";
import assert from "node:assert/strict";

import { homeAnchors, isShortClick } from "./scene-config.mjs";

test("places four anchors around the center of one physics world", () => {
  assert.deepEqual(homeAnchors(4), [
    [-5.4, 4, 0],
    [-1.8, 4, 0.15],
    [1.8, 4, -0.15],
    [5.4, 4, 0],
  ]);
});

test("selects only a pointer release with little movement", () => {
  assert.equal(isShortClick(4), true);
  assert.equal(isShortClick(7), false);
});
