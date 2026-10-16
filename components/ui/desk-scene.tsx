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

export default function DeskScene({ card, stickers, notebook, credentials }: { card: ReactNode; stickers: ReactNode; notebook: ReactNode; credentials: ReactNode }) {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scene.current!;
    const viewport = stage.current!;
    const surface = desk.current!;
    const card = surface.nextElementSibling!.firstElementChild as HTMLElement;
    const stickers = viewport.firstElementChild as HTMLElement;
    const [name, text] = [...card.querySelectorAll<HTMLElement>("[data-card-type]")];
    const gl = createDeskGL(surface.parentElement!, styles.gl);
    if (!gl) surface.dataset.flat = "";
    else for (const [key, value] of [["--cup-x", gl.cup.x], ["--cup-y", gl.cup.y], ["--cup-d", gl.cup.d]] as const) surface.style.setProperty(key, `${value * 100}%`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 640px) and (orientation: portrait)");
    let frame = 0, drawn = "", arrived = false, dive = 0, diving = 0, aim: DiveTarget = "cup";

    function update() {
      frame = 0;
      const height = viewport.clientHeight;
      const progress = motion.matches ? 1 : clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height));
      const width = surface.offsetWidth;
      const cardHeight = card.offsetHeight;
      // Past the scene (or between identical frames) nothing moves: skip the style writes and the redraw.
      const key = `${progress}|${width}|${viewport.clientWidth}|${height}|${mobile.matches}|${dive}|${aim}`;
      if (key === drawn) return;
      drawn = key;
      const arrival = ease(progress / 0.5);
      const overhead = ease((progress - 0.36) / 0.54);
      const landing = ease((progress - 0.48) / 0.42);
      const travel = ease(progress / 0.9);
      const entry = height * 1.25 * (1 - arrival);
      const pitch = 78 * (1 - overhead);
      const turn = mobile.matches ? 90 * overhead : 0;
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
      set(card, {
        "--card-y": `${(mobile.matches ? -width * 0.23 : width * 0.085) * travel}px`,
        "--card-x": `${mobile.matches ? 0 : -width * 0.23 * travel}px`,
        "--card-pitch": `${pitch * landing}deg`,
        "--card-turn": `${-8 * travel}deg`,
        "--card-scale": 1 - (mobile.matches ? 0.5 : 0.72) * travel,
        "--card-lift": `${1 + 45 * Math.sin(Math.PI * travel)}px`,
        "--card-tilt": 1 - travel,
        "--card-landing": landing,
        "--dive-x": `${shift[0]}px`, "--dive-y": `${-shift[1]}px`, "--dive-z": `${shift[2]}px`,
      });
      // Phones: name and text grow to 1.6x (laid out at that size, see the CSS) and the name drops, the text rises.
      const typeScale = mobile.matches ? (1 + 0.6 * travel) / 1.6 : 1;
      set(name, { "--card-type-scale": typeScale, "--card-type-y": `${mobile.matches ? cardHeight * 0.05 * travel : 0}px` });
      set(text, { "--card-type-scale": typeScale, "--card-type-y": `${mobile.matches ? -cardHeight * 0.04 * travel : 0}px` });
      const fade = 1 - ease((progress - 0.1) / 0.45);
      set(stickers, {
        "--sticker-y": `${-height * progress * 1.35}px`,
        "--sticker-turn": `${-12 * progress}deg`,
        "--sticker-scale": 1 + progress * 0.3,
        "--sticker-opacity": fade,
      });
      // Faded out, the sticker layer stays: hiding it dropped its tiles, and scrolling back up re-rasterized all of it
      // (~60ms of GPU on a mid-range phone) and stalled the scroll animation for ~100ms.
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
            <div className={styles.card} data-desk-card>{card}</div>
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
