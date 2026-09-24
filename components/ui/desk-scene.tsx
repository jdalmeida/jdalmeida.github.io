"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./desk-scene.module.css";
import DeskCredentials from "./desk-credentials";
import PaperToss from "./paper-toss";
import CoffeeRun from "./coffee-run";
import { createDeskGL } from "./desk-gl";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export default function DeskScene({ card, stickers, notebook }: { card: ReactNode; stickers: ReactNode; notebook: ReactNode }) {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scene.current!;
    const viewport = stage.current!;
    const surface = desk.current!;
    const card = surface.nextElementSibling as HTMLElement;
    const stickers = viewport.firstElementChild as HTMLElement;
    const gl = createDeskGL(surface.parentElement!, styles.gl);
    if (!gl) surface.dataset.flat = "";
    else for (const [key, value] of [["--cup-x", gl.cup.x], ["--cup-y", gl.cup.y], ["--cup-d", gl.cup.d]] as const) surface.style.setProperty(key, `${value * 100}%`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 640px) and (orientation: portrait)");
    let frame = 0, drawn = "";

    function update() {
      frame = 0;
      const height = viewport.clientHeight;
      const progress = motion.matches ? 1 : clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height));
      const width = surface.offsetWidth;
      // Past the scene (or between identical frames) nothing moves: skip the style writes and the redraw.
      const key = `${progress}|${width}|${viewport.clientWidth}|${height}|${mobile.matches}`;
      if (key === drawn) return;
      drawn = key;
      const arrival = ease(progress / 0.5);
      const overhead = ease((progress - 0.36) / 0.54);
      const landing = ease((progress - 0.48) / 0.42);
      const travel = ease(progress / 0.9);
      const entry = height * 1.25 * (1 - arrival);
      const pitch = 78 * (1 - overhead);
      const turn = mobile.matches ? 90 * overhead : 0;
      // Each element gets only its own variables, so a scroll frame restyles three small subtrees, not the whole scene.
      const set = (el: HTMLElement, values: Record<string, string | number>) => {
        for (const [key, value] of Object.entries(values)) el.style.setProperty(key, String(value));
      };
      // The mug is 0.85 of its diameter tall (desk-gl.ts `cup`); its button floats at rim height.
      set(surface, { "--entry": `${entry}px`, "--pitch": `${pitch}deg`, "--turn": `${turn}deg`, "--cup-z": `${width * (gl?.cup.d ?? 0) * 0.85}px` });
      set(card, {
        "--card-y": `${(mobile.matches ? -width * 0.23 : width * 0.085) * travel}px`,
        "--card-x": `${mobile.matches ? 0 : -width * 0.23 * travel}px`,
        "--card-pitch": `${pitch * landing}deg`,
        "--card-turn": `${-8 * travel}deg`,
        "--card-scale": 1 - (mobile.matches ? 0.5 : 0.72) * travel,
        "--card-type-scale": mobile.matches ? 1 + 0.6 * travel : 1,
        "--card-name-bottom": `${mobile.matches ? 9 - 5 * travel : 9}%`,
        "--card-text-bottom": `${mobile.matches ? 9 + 4 * travel : 9}%`,
        "--card-lift": `${1 + 45 * Math.sin(Math.PI * travel)}px`,
        "--card-tilt": 1 - travel,
        "--card-landing": landing,
      });
      set(stickers, {
        "--sticker-y": `${-height * progress * 1.35}px`,
        "--sticker-turn": `${-12 * progress}deg`,
        "--sticker-scale": 1 + progress * 0.3,
        "--sticker-opacity": 1 - ease((progress - 0.1) / 0.45),
      });
      gl?.draw({
        width: viewport.clientWidth, height, desk: width, leg: Math.min(250, Math.max(140, innerWidth * 0.22)),
        mobile: mobile.matches, entry, pitch, turn, floor: overhead,
      });
      root.dataset.started = String(progress > 0.03);
      root.dataset.landed = String(landing > 0.99);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(surface);
    addEventListener("scroll", schedule, { passive: true });
    motion.addEventListener("change", schedule);
    mobile.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
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
            <DeskCredentials />
            <PaperToss />
            <CoffeeRun />
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
