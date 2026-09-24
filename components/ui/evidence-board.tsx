"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type events from "@/lib/events.json";
import styles from "./evidence-board.module.css";

type Event = (typeof events)[number];

// Pin spots on the board (percent of its width/height); each clipping hangs from its pin.
const PINS = { note: [21, 43], photoA: [56, 31], photoB: [82, 47] } as const;
const STRINGS = [["note", "photoA"], ["photoA", "photoB"]] as const;
const FONTS = ["Georgia, serif", "Impact, 'Arial Black', sans-serif", "'Courier New', monospace", "'Times New Roman', serif", "'Trebuchet MS', sans-serif", "Verdana, sans-serif"];
const PAPERS = ["#f4efe2", "#111", "#d9352b", "#f2d64b", "#fff", "#1e4fa8", "#e8e1cf"];

// Sagging red thread between two pins.
const thread = ([x1, y1]: readonly number[], [x2, y2]: readonly number[]) =>
  `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + Math.hypot(x2 - x1, y2 - y1) * 0.12} ${x2} ${y2}`;

// Magazine ransom-note letters: style picked from the letter's position so it stays stable across renders.
function Cutouts({ text }: { text: string }) {
  return (
    <h2 className={styles.title} aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span key={w} className={styles.word} aria-hidden="true">
          {[...word].map((char, i) => {
            const k = w * 7 + i * 3;
            const paper = PAPERS[k % PAPERS.length];
            return (
              <span key={i} className={styles.letter} style={{
                fontFamily: FONTS[(k + w) % FONTS.length], background: paper,
                color: paper === "#111" || paper === "#1e4fa8" || paper === "#d9352b" ? "#f4efe2" : "#111",
                transform: `rotate(${((k * 37) % 13) - 6}deg) translateY(${((k * 11) % 5) - 2}px)`,
                fontSize: `${0.85 + ((k * 5) % 4) * 0.12}em`,
              }}>{char}</span>
            );
          })}
        </span>
      ))}
    </h2>
  );
}

// Crime-investigation board in a CSS 3D room; the camera dollies in on open and back out on close.
export default function EvidenceBoard({ event, onClose }: { event: Event; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => dialog.current!.showModal(), []);

  const close = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) onClose();
    else setClosing(true);
  };

  return (
    <dialog
      ref={dialog}
      className={styles.room}
      data-closing={closing}
      aria-label={`Quadro de investigação: ${event.name}`}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onAnimationEnd={(e) => { if (closing && e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.camera}>
        <div className={styles.ceiling} />
        <div className={styles.floor} />
        <div className={styles.side} data-side="left" />
        <div className={styles.side} data-side="right" />
        <div className={styles.wall}>
          <div className={styles.board}>
            <Cutouts text={event.name} />
            <div className={styles.note}>
              <p>{event.note}</p>
              <small>{event.role} · {event.place}, {event.year}</small>
            </div>
            {event.images.map((src, i) => (
              <figure key={src} className={styles.polaroid} data-photo={i}>
                <Image src={src} alt={`${event.name}, foto ${i + 1}`} width={480} height={480} />
                <figcaption>{event.number}{i ? "-B" : "-A"}</figcaption>
              </figure>
            ))}
            <svg className={styles.threads} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {STRINGS.map(([a, b]) => <path key={a + b} d={thread(PINS[a], PINS[b])} />)}
            </svg>
            {Object.entries(PINS).map(([key, [x, y]]) => (
              <span key={key} className={styles.pin} style={{ left: `${x}%`, top: `${y}%` } as CSSProperties} />
            ))}
          </div>
        </div>
      </div>
      <button type="button" className={styles.back} onClick={close}>← Voltar à mesa</button>
    </dialog>
  );
}
