"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";

const SRC = "/logos/jalmeida-signature-animated.svg";
const DRAW_MS = 2800; // animated SVG finishes at ~2.53s
const FLY_MS = 1100;

// Black screen → signature draws itself → flies onto the card's signature (#card-signature) and gets "engraved".
export default function SignatureIntro() {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const sig = useRef<HTMLImageElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  preload(SRC, { as: "image" });

  // Start drawing only once the page is idle: Grime/Stickers rasterize their feTurbulence textures on mount,
  // on the same main thread that ticks the SVG animation, which made the first strokes stutter.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // overlay hidden via motion-reduce:hidden
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300)); // Safari has no rIC
    const start = () => idle(() => setReady(true), { timeout: 1500 });
    if (document.readyState === "complete") start();
    else addEventListener("load", start, { once: true });
    return () => {
      removeEventListener("load", start);
      clearTimeout(timer.current);
    };
  }, []);

  function fly() {
    const target = document.getElementById("card-signature")!;
    const from = sig.current!.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    target.style.opacity = "0";
    const ease = "cubic-bezier(.7,0,.2,1)";
    overlay.current!.animate([{ backgroundColor: "#000" }, { backgroundColor: "#0000" }], { duration: FLY_MS, easing: ease, fill: "forwards" });
    sig.current!
      .animate(
        [{ transform: "none" }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})` }],
        { duration: FLY_MS, easing: ease, fill: "forwards" },
      )
      .finished.then(() => {
        target.style.opacity = "";
        // engrave: bright flash that settles into the card's normal shadow
        target.animate(
          [{ filter: "brightness(2.5) drop-shadow(0 0 10px #fff)" }, { filter: "drop-shadow(0 1px 1px #0004)" }],
          { duration: 700, easing: "ease-out" },
        );
        setDone(true);
      });
  }

  if (done) return null;
  return (
    <div ref={overlay} className="fixed inset-0 z-50 flex items-center justify-center bg-black motion-reduce:hidden" aria-hidden>
      {/* invert: the animated SVG is filled dark. SVG animation starts on load, so the fly timer does too. */}
      {ready && (
        <img ref={sig} src={SRC} alt="" onLoad={() => (timer.current = setTimeout(fly, DRAW_MS))}
          className="w-[min(80vw,720px)] origin-top-left invert will-change-transform" />
      )}
    </div>
  );
}
