// A game on the desk asks the camera to dive into its object (`into`) or back out; `done` runs when it gets there.
export type DiveTarget = "cup" | "bin" | "plant";
export type DiveRequest = { into: boolean; target: DiveTarget; done?: () => void; handled?: boolean };

// Dispatched from the object's button up to the desk (desk-scene.tsx); with no camera to move (flat desk, reduced
// motion, no scene listening) `done` runs right away.
export function dive(from: HTMLElement | null, target: DiveTarget, into: boolean, done?: () => void) {
  const request: DiveRequest = { into, target, done };
  from?.dispatchEvent(new CustomEvent("desk-dive", { bubbles: true, detail: request }));
  if (!request.handled) done?.();
}
