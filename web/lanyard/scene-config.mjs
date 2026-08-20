const HOME_ANCHORS = [
  [-5.4, 4, 0],
  [-1.8, 4, 0.15],
  [1.8, 4, -0.15],
  [5.4, 4, 0],
];

export const homeAnchors = (count) => HOME_ANCHORS.slice(0, count);
export const isShortClick = (delta) => delta <= 5;
