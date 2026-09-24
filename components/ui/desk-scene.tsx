"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./desk-scene.module.css";

// One-pixel slices extrude the same rounded outline as the tabletop.
const deskLayers = Array.from({ length: 24 }, (_, index) => index + 1);

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export default function DeskScene({ card, stickers }: { card: ReactNode; stickers: ReactNode }) {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scene.current!;
    const viewport = stage.current!;
    const surface = desk.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 640px) and (orientation: portrait)");
    let frame = 0;

    function update() {
      frame = 0;
      const height = viewport.clientHeight;
      const progress = motion.matches ? 1 : clamp(-root.getBoundingClientRect().top / Math.max(1, root.offsetHeight - height));
      const arrival = ease(progress / 0.5);
      const overhead = ease((progress - 0.36) / 0.54);
      const landing = ease((progress - 0.48) / 0.42);
      const travel = ease(progress / 0.9);
      const entry = height * 1.25 * (1 - arrival);
      const pitch = 78 * (1 - overhead);
      const turn = mobile.matches ? 90 * overhead : 0;
      const width = surface.offsetWidth;
      const values: Record<string, string | number> = {
        "--entry": `${entry}px`,
        "--pitch": `${pitch}deg`,
        "--turn": `${turn}deg`,
        "--card-y": `${(mobile.matches ? width * 0.23 : width * 0.085) * travel}px`,
        "--card-x": `${mobile.matches ? 0 : -width * 0.23 * travel}px`,
        "--card-pitch": `${pitch * landing}deg`,
        "--card-turn": `${-8 * travel}deg`,
        "--card-scale": 1 - (mobile.matches ? 0.5 : 0.72) * travel,
        "--card-type-scale": mobile.matches ? 1 + 0.6 * travel : 1,
        "--card-name-bottom": `${mobile.matches ? 9 - 5 * travel : 9}%`,
        "--card-text-bottom": `${mobile.matches ? 9 + 4 * travel : 9}%`,
        "--card-lift": `${1 + 45 * Math.sin(Math.PI * travel)}px`,
        "--card-tilt": 1 - travel,
        "--card-shadow-y": `${30 - 27 * landing}px`,
        "--card-shadow-blur": `${60 - 51 * landing}px`,
        "--card-shadow-spread": `${-20 + 22 * landing}px`,
        "--sticker-y": `${-height * progress * 1.35}px`,
        "--sticker-turn": `${-12 * progress}deg`,
        "--sticker-scale": 1 + progress * 0.3,
        "--sticker-opacity": 1 - ease((progress - 0.1) / 0.45),
      };
      for (const [key, value] of Object.entries(values)) root.style.setProperty(key, String(value));
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
    };
  }, []);

  return (
    <section ref={scene} className={styles.scene} aria-label="Da apresentação à minha escrivaninha">
      <div ref={stage} className={styles.stage}>
        <div className={styles.stickers} data-scene-stickers>{stickers}</div>
        <div className={styles.space}>
          <div ref={desk} className={styles.desk} data-desk>
            <div className={styles.furniture} aria-hidden="true">
              <div className={styles.leg} /><div className={styles.leg} />
              <div className={styles.leg} /><div className={styles.leg} />
              <div className={styles.drawers}><span /><span /></div>
              {deskLayers.map((depth) => (
                <div key={depth} className={styles.edge} style={{ "--depth": depth } as CSSProperties} />
              ))}
              <div className={styles.top} />
            </div>
            {/* Future objects placed here share the desk's perspective. */}
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
