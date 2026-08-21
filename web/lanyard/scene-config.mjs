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

// Half the height of the card, measured on its collider.
export const CARD_HALF_HEIGHT = 1.125;

// Slack between the credential and the edge of the dialog box.
const DIALOG_SLACK = 0.3;

// bodyPositions spawns the card beside its anchor. The last offset it uses is
// how far to the right the drop starts.
const DIALOG_SPAWN = 2;

// How far below the anchor the dialog hangs the card at the start. Falling from
// anchor height would need a box three cards tall — the whole modal — and the
// credential would read tiny; from here it swings in at full size.
export const DIALOG_SPAWN_DROP = 2;

// Room on the other side of the anchor: the card crosses it on the way back up
// from the first swing, and it also decides how far from the edge of the modal
// the credential comes to rest.
const DIALOG_BACKSWING = 0.6;

// The box the drop lives in, edge by edge.
const DIALOG_LEFT = -(CARD_WIDTH / 2 + DIALOG_BACKSWING);
const DIALOG_RIGHT = DIALOG_SPAWN + CARD_WIDTH / 2 + DIALOG_SLACK;
const DIALOG_TOP =
  ANCHOR_HEIGHT - DIALOG_SPAWN_DROP + CARD_HALF_HEIGHT + DIALOG_SLACK;
const DIALOG_BOTTOM = CARD_BOTTOM - DIALOG_SLACK;

// World box the camera must keep visible for a single credential. The dialog
// canvas covers the whole modal, so the box holds the entire drop — the card
// where it spawns, the card where it rests, and the swing between them — and
// none of the animation is cropped.
export const DIALOG_FRAME = {
  width: Number((DIALOG_RIGHT - DIALOG_LEFT).toFixed(4)),
  height: Number((DIALOG_TOP - DIALOG_BOTTOM).toFixed(4)),
  center: Number(((DIALOG_TOP + DIALOG_BOTTOM) / 2).toFixed(4)),
  offset: Number(((DIALOG_RIGHT + DIALOG_LEFT) / 2).toFixed(4)),
  // The credential hangs from the top left of the modal, so the room the canvas
  // has to spare falls where the swing needs it: to the right of the strap and
  // below the card.
  align: { x: -1, y: 1 },
};

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

// A contain fit always leaves slack on the longer axis of the canvas. `align`
// says where the box sits inside it: 0 splits the slack evenly, -1 pins the box
// to the left or bottom edge, 1 to the right or top. The camera never rotates,
// so aiming it is a plain translation.
export const framePosition = (frame, fov, aspect, distance) => {
  const halfHeight = distance * Math.tan((fov * Math.PI) / 360);
  const align = frame.align || { x: 0, y: 0 };
  return [
    (frame.offset || 0) - align.x * (halfHeight * aspect - frame.width / 2),
    frame.center - align.y * (halfHeight - frame.height / 2),
  ];
};

export const isShortClick = (delta) => delta <= 5;
export const lerpFactor = (delta, speed) => Math.min(1, delta * speed);
export const pointerDelta = (start, end) =>
  Math.hypot(end.x - start.x, end.y - start.y);

// The rope bodies start on the line between the anchor and the card. `drop`
// hangs that line, and with it the card the scene swings into place, below the
// anchor instead of beside it.
export const bodyPositions = ([x, y, z], drop = 0) =>
  [0, 0.5, 1, 1.5, 2].map((offset) => [
    Number((x + offset).toFixed(4)),
    Number((y - (drop * offset) / 2).toFixed(4)),
    z,
  ]);
