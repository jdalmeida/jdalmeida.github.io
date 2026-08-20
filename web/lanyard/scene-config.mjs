// The strap hangs 3 units below the anchor and the card center sits 1.5 below
// that, so a credential fills the world box between these two heights.
export const ANCHOR_HEIGHT = 4;
export const CARD_BOTTOM = -1.75;
export const CARD_WIDTH = 1.62;

const HOME_SPACING = 2.2;

// Breathing room between the outer credential and the edge of the home frame.
const HOME_MARGIN = 0.7;

// Every other credential hangs a little lower, so the row reads as a rack of
// badges instead of a fence and neighbours never line up corner to corner.
const HOME_DROP = 0.6;

// Slack above the anchor and below the lowest card, so nothing touches the
// edge of the frame the camera fits. It stays inside the room the width of the
// row already leaves, so the stagger costs no size.
const HOME_PADDING = 0.35;

// World box the camera must keep visible for a single credential. The dialog
// box crops the strap so one credential reads much larger.
export const DIALOG_FRAME = { width: 2.6, height: 4.6, center: 0.35 };

export const homeDrop = (index) => (index % 2 ? HOME_DROP : 0);

// The home box grows with the row, so a credential added to the stack does not
// push the ones on the ends out of the frame.
export const homeFrame = (count) => {
  const floor = CARD_BOTTOM - HOME_DROP - HOME_PADDING;
  const ceiling = ANCHOR_HEIGHT + HOME_PADDING;
  return {
    width: Number(
      ((count - 1) * HOME_SPACING + CARD_WIDTH + HOME_MARGIN * 2).toFixed(4),
    ),
    height: Number((ceiling - floor).toFixed(4)),
    center: Number(((ceiling + floor) / 2).toFixed(4)),
  };
};

export const homeAnchors = (count) => {
  const start = -((count - 1) * HOME_SPACING) / 2;
  return Array.from(Array(count), (_, index) => [
    Number((start + index * HOME_SPACING).toFixed(4)),
    ANCHOR_HEIGHT - homeDrop(index),
    index % 2 ? 0.15 : -0.15,
  ]);
};

// Contain fit: the camera backs off far enough for the shorter axis of the
// canvas, so no credential leaves the frame on a narrow desktop window.
export const fitDistance = (frame, fov, aspect) => {
  const half = Math.tan((fov * Math.PI) / 360);
  return Math.max(frame.height / (2 * half), frame.width / (2 * half * aspect));
};

export const isShortClick = (delta) => delta <= 5;
export const lerpFactor = (delta, speed) => Math.min(1, delta * speed);
export const pointerDelta = (start, end) =>
  Math.hypot(end.x - start.x, end.y - start.y);

export const bodyPositions = ([x, y, z]) =>
  [0, 0.5, 1, 1.5, 2].map((offset) => [Number((x + offset).toFixed(4)), y, z]);
