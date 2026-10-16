"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./desk-scene.module.css";
import PaperToss from "./paper-toss";
import CoffeeRun from "./coffee-run";
import DeskRun from "./desk-run";
import { createDeskGL } from "./desk-gl";
import { binAt } from "./desk-textures";
import type { DiveRequest, DiveTarget } from "./desk-dive";
import { track } from "@/lib/track";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const DEG = Math.PI / 180, PERSPECTIVE = 1400; // `.space`'s perspective, which desk-gl.ts's camera mirrors
const FLIPPED = "translate3d(0px, 0px, 100px) rotateX(0deg) rotateZ(0deg) scale(0.9)"; // turned over on the desk: up, facing you

type Dims = { width: number; height: number; cardHeight: number; mobile: boolean };
// Where everything is at scroll progress p. The card, its type and the stickers are sampled from this into keyframes.
function pose(p: number, { width, height, cardHeight, mobile }: Dims) {
  const overhead = ease((p - 0.36) / 0.54), landing = ease((p - 0.48) / 0.42), travel = ease(p / 0.9);
  const pitch = 78 * (1 - overhead);
  // Phones: name and text grow to 1.6x (laid out at that size, see the CSS) and the name drops, the text rises.
  const typeScale = mobile ? (1 + 0.6 * travel) / 1.6 : 1;
  return {
    arrival: ease(p / 0.5), overhead, landing, travel, pitch,
    flight: `translate3d(${mobile ? 0 : -width * 0.23 * travel}px, ${(mobile ? -width * 0.23 : width * 0.085) * travel}px, ${1 + 45 * Math.sin(Math.PI * travel)}px) `
      + `rotateX(${pitch * landing}deg) rotateZ(${-8 * travel}deg) scale(${1 - (mobile ? 0.5 : 0.72) * travel})`,
    name: `translateY(${mobile ? cardHeight * 0.05 * travel : 0}px) scale(${typeScale})`,
    text: `translateY(${mobile ? -cardHeight * 0.04 * travel : 0}px) scale(${typeScale})`,
    stickers: `translateY(${-height * p * 1.35}px) rotate(${-12 * p}deg) scale(${1 + p * 0.3})`,
    fade: 1 - ease((p - 0.1) / 0.45),
  };
}
// The eases' breakpoints plus an even grid: played back linearly between samples, the curves stay within a pixel.
const SAMPLES = [...new Set([...Array.from({ length: 41 }, (_, i) => i / 40), 0.1, 0.36, 0.48, 0.5, 0.55, 0.9])].sort((a, b) => a - b);
type ViewTimelineClass = new (options: { subject: Element; axis: "block" }) => AnimationTimeline;

export default function DeskScene({ card, stickers, notebook, credentials }: { card: ReactNode; stickers: ReactNode; notebook: ReactNode; credentials: ReactNode }) {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scene.current!;
    const viewport = stage.current!;
    const surface = desk.current!;
    const card = surface.nextElementSibling!.firstElementChild as HTMLElement;
    const flight = card.firstElementChild as HTMLElement;
    const stickers = viewport.firstElementChild as HTMLElement;
    const [name, text] = [...card.querySelectorAll<HTMLElement>("[data-card-type]")];
    const face = card.querySelector<HTMLElement>("[data-flipped]")!; // the visit card, which says when it is turned over
    const gl = createDeskGL(surface.parentElement!, styles.gl);
    if (!gl) surface.dataset.flat = "";
    else for (const [key, value] of [["--cup-x", gl.cup.x], ["--cup-y", gl.cup.y], ["--cup-d", gl.cup.d]] as const) surface.style.setProperty(key, `${value * 100}%`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 640px) and (orientation: portrait)");
    let frame = 0, drawn = "", arrived = false, dive = 0, diving = 0, aim: DiveTarget = "cup";
    // Card and stickers are animations. Where the browser has view timelines the scroll drives them on the compositor,
    // so they keep moving while the main thread is busy (the desk, drawn in WebGL, can't); elsewhere, and with reduced
    // motion, the same animations sit paused and update() scrubs them.
    const ViewTimeline = (window as unknown as { ViewTimeline?: ViewTimelineClass }).ViewTimeline;
    const timeline = ViewTimeline && new ViewTimeline({ subject: root, axis: "block" });
    let animations: Animation[] = [], built = "", flipped = false, turnOver: Animation | undefined;

    function animate(dims: Dims) {
      animations.forEach((a) => a.cancel());
      turnOver?.cancel(); // newer animations draw over older ones: update() turns the card over again on top of these
      flipped = false;
      const poses = SAMPLES.map((p) => pose(p, dims));
      const driven = timeline && !motion.matches;
      // `contain` is the stretch where the scene fills the screen, the same span update()'s progress runs over.
      const options = (driven ? { timeline, rangeStart: "contain 0%", rangeEnd: "contain 100%", fill: "both" } : { duration: 1, fill: "both" }) as KeyframeAnimationOptions;
      const play = (el: HTMLElement, key: "flight" | "name" | "text" | "stickers") =>
        el.animate(poses.map((v, i) => ({ offset: SAMPLES[i], transform: v[key], ...(key === "stickers" && { opacity: v.fade }) })), options);
      animations = [play(flight, "flight"), play(name, "name"), play(text, "text"), play(stickers, "stickers")];
      if (!driven) animations.forEach((a) => a.pause());
    }

    function update() {
      frame = 0;
      const height = viewport.clientHeight;
      const width = surface.offsetWidth;
      const dims: Dims = { width, height, cardHeight: card.offsetHeight, mobile: mobile.matches };
      const layout = `${width}|${height}|${dims.cardHeight}|${dims.mobile}|${motion.matches}`;
      if (layout !== built) { built = layout; animate(dims); }
      // Driven by the timeline, the desk takes its progress from it too, so desk and card agree on where the scroll is.
      const timed = timeline && !motion.matches ? animations[0].effect?.getComputedTiming().progress : undefined;
      const progress = motion.matches ? 1 : typeof timed === "number" ? timed : clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height));
      if (animations[0].playState === "paused") for (const a of animations) a.currentTime = progress;
      // Past the scene (or between identical frames) nothing moves: skip the style writes and the redraw.
      const key = `${progress}|${layout}|${viewport.clientWidth}|${dive}|${aim}|${face.dataset.flipped}`;
      if (key === drawn) return;
      drawn = key;
      const { arrival, overhead, landing, travel, pitch, flight: pose1 } = pose(progress, dims);
      const entry = height * 1.25 * (1 - arrival);
      const turn = dims.mobile ? 90 * overhead : 0;
      const leg = Math.min(250, Math.max(140, innerWidth * 0.22));
      // The dive moves the camera from where it sits straight down to just over its object, close enough for it to fill
      // the screen; done as the opposite shift of the whole world, so the CSS desk and the canvas move as one.
      let shift: [number, number, number] = [0, 0, 0];
      if (dive && gl) {
        const c = Math.cos(turn * DEG), s = Math.sin(turn * DEG), cp = Math.cos(pitch * DEG), sp = Math.sin(pitch * DEG);
        // What it dives to, in desk space (y up), and the radius around it that should fill the screen.
        const [x0, y0, z0, r] = (() => {
          const H = width / 1.85;
          if (aim === "bin") { const b = binAt(width, H, leg); return [b.x, b.y, b.z + 0.4 * leg, 0.85 * b.r]; } // into the bin, over its rim
          if (aim === "plant") { const r = width * 0.032; return [(0.052 - 0.5) * width, (0.5 - 0.1) * H, 0.9 * r, 1.25 * r]; } // the rosette
          const D = gl.cup.d * width;
          return [(gl.cup.x - 0.5) * width, (0.5 - gl.cup.y) * H, 0.68 * D, 0.445 * D]; // the coffee surface
        })();
        const x = x0 * c + y0 * s, y1 = -x0 * s + y0 * c, y = y1 * cp + z0 * sp - entry, z = -y1 * sp + z0 * cp;
        const stop = Math.max(24, (r * PERSPECTIVE) / (0.5 * Math.hypot(viewport.clientWidth, height)));
        shift = [-dive * x, -dive * y, -dive * (z + stop - PERSPECTIVE)];
      }
      // Each element gets only its own variables, so a scroll frame restyles three small subtrees, not the whole scene.
      const set = (el: HTMLElement, values: Record<string, string | number>) => {
        for (const [key, value] of Object.entries(values)) el.style.setProperty(key, String(value));
      };
      // The mug is 0.85 of its diameter tall (desk-gl.ts `cup`); its button floats at rim height. The succulent's rosette tops out near 1.4 pot radii.
      set(surface, {
        "--entry": `${entry}px`, "--pitch": `${pitch}deg`, "--turn": `${turn}deg`,
        "--dive-x": `${shift[0]}px`, "--dive-y": `${-shift[1]}px`, "--dive-z": `${shift[2]}px`, "--cup-z": `${width * (gl?.cup.d ?? 0) * 0.85}px`, "--plant-z": `${width * 0.032 * 1.4}px`,
      });
      set(card, { "--dive-x": `${shift[0]}px`, "--dive-y": `${-shift[1]}px`, "--dive-z": `${shift[2]}px` });
      // The visit card's tilt and landing shadow read these (main thread; small motions, so a late frame doesn't show).
      set(flight, { "--card-tilt": 1 - travel, "--card-landing": landing });
      // Turned over once landed, the card comes up to face you: an animation over the scroll-driven one, reversed to
      // set it back down (or when the scroll carries the desk away).
      const turned = landing > 0.99 && face.dataset.flipped === "true";
      if (turned !== flipped) {
        flipped = turned;
        if (turned) {
          turnOver?.cancel();
          turnOver = flight.animate([{ transform: pose1 }, { transform: FLIPPED }], { duration: motion.matches ? 0 : 550, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
        } else turnOver?.reverse();
      }
      gl?.draw({
        width: viewport.clientWidth, height, desk: width, leg,
        mobile: mobile.matches, entry, pitch, turn, floor: overhead, dive: shift, glint: aim === "cup" ? 1 - ease((dive - 0.45) / 0.45) : 1,
      });
      root.dataset.diving = String(dive > 0);
      root.dataset.started = String(progress > 0.03);
      root.dataset.landed = String(landing > 0.99);
      if (landing > 0.99 && !arrived) { arrived = true; track("desk"); } // funnel step in /admin
    }

    function onDive(e: Event) {
      const request = (e as CustomEvent<DiveRequest>).detail;
      if (!gl || motion.matches) return; // flat desk or reduced motion: the caller opens right away
      request.handled = true;
      cancelAnimationFrame(diving);
      aim = request.target;
      const from = dive, to = request.into ? 1 : 0, start = performance.now(), ms = request.into ? 1500 : 1100;
      const tick = (now: number) => {
        const t = clamp((now - start) / ms);
        // Going in it gathers speed and plunges; coming out it eases off as the desk settles back.
        dive = from + (to - from) * (request.into ? t * t * t * (t * (6 * t - 15) + 10) : ease(t));
        update();
        if (t < 1) diving = requestAnimationFrame(tick);
        else request.done?.();
      };
      diving = requestAnimationFrame(tick);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(surface);
    const flips = new MutationObserver(schedule);
    flips.observe(face, { attributeFilter: ["data-flipped"] });
    addEventListener("scroll", schedule, { passive: true });
    surface.addEventListener("desk-dive", onDive);
    motion.addEventListener("change", schedule);
    mobile.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(diving);
      surface.removeEventListener("desk-dive", onDive);
      observer.disconnect();
      flips.disconnect();
      animations.forEach((a) => a.cancel());
      turnOver?.cancel();
      removeEventListener("scroll", schedule);
      motion.removeEventListener("change", schedule);
      mobile.removeEventListener("change", schedule);
      gl?.dispose();
    };
  }, []);

  return (
    <section ref={scene} className={styles.scene} aria-label="Da apresentação à minha escrivaninha">
      <div ref={stage} className={styles.stage}>
        <div className={styles.stickers} data-scene-stickers>{stickers}</div>
        <div className={styles.space}>
          <div ref={desk} className={styles.desk} data-desk>
            {notebook}
            {credentials}
            <PaperToss />
            <CoffeeRun />
            <DeskRun />
          </div>
          <div className={styles.cardAnchor}>
            <div className={styles.card} data-desk-card><div className={styles.flight}>{card}</div></div>
          </div>
        </div>
        <a className={styles.scrollCue} href="#escrivaninha">
          <span>Role para explorar</span><span className={styles.arrow} aria-hidden="true">↓</span>
        </a>
      </div>
      <div id="escrivaninha" className={styles.destination} tabIndex={-1} aria-label="Minha escrivaninha" />
    </section>
  );
}
