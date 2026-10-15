"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import events from "@/lib/events.json";
import EvidenceBoard from "./evidence-board";
import styles from "./desk-credentials.module.css";

// Lanyard laid flat on the desk: a woven ribbon loop crimped into a split ring, and a lobster clasp hooked through
// the badge's punched slot. Drawn in a box above the badge (60% of its width, 87 units = 0.87 badge widths tall);
// the loop runs on past the box, the way a long lanyard lies folded beside its badge.
function Lanyard() {
  const loop = "M30 55 C21 33 5 4 -1 -22 C-4 -36 4 -46 12 -40 C18 -35 18 -16 22 2 C25 18 29 36 30 55";
  return (
    <svg className={styles.lanyard} viewBox="0 0 60 87" aria-hidden="true">
      <path d={loop} className={styles.ribbonEdge} />
      <path d={loop} className={styles.ribbon} />
      <path d={loop} className={styles.weave} />
      {/* where the ribbon lies twisted, its unprinted back shows */}
      <path d="M-1.5 -20 C-3.5 -32 1 -42 7 -42.5" className={styles.twist} />
      <path d="M17.5 -18 C19 -8 20.5 2 22.5 12" className={styles.sheen} />
      <rect x="27" y="50" width="6" height="7" rx="1" fill="url(#credential-metal)" stroke="#5c5d5f" strokeWidth=".4" />
      <circle cx="30" cy="61" r="2.8" fill="none" stroke="url(#credential-metal)" strokeWidth="1.3" />
      <path d="M30 63.5 C25.8 64 25 69.5 26.2 73.5 C27.2 77 29 79 30 82 C31 79 32.8 77 33.8 73.5 C35 69.5 34.2 64 30 63.5 Z" fill="url(#credential-metal)" stroke="#55565a" strokeWidth=".45" />
      <path d="M31.2 66.5 C32.6 68.5 32.6 72.5 31.5 75" fill="none" stroke="#2c2d30" strokeWidth=".7" strokeLinecap="round" />
      <rect x="32.6" y="68" width="1.6" height="3" rx=".4" fill="#9b9ca0" />
    </svg>
  );
}

// Pile on the desk; hovering (or focusing) fans them out, clicking opens that event's evidence board.
export default function DeskCredentials() {
  const [open, setOpen] = useState<(typeof events)[number]>();
  const mid = (events.length - 1) / 2;
  return (
    <div className={styles.pile} role="group" aria-label="Credenciais dos eventos">
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="credential-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f4f2" /><stop offset=".35" stopColor="#a9aaad" /><stop offset=".55" stopColor="#e6e7e8" /><stop offset="1" stopColor="#77787c" />
          </linearGradient>
        </defs>
      </svg>
      {events.map((event, index) => (
        <button
          key={event.id}
          type="button"
          className={styles.credential}
          style={{ "--i": index, "--fan": `${(index - mid) * 16}deg`, "--tilt": `${(index % 2 ? 1 : -1) * (2 + index * 1.5)}deg`, "--color": event.color, "--dark": event.darkColor } as CSSProperties}
          aria-label={`${event.name}, ${event.year}`}
          onClick={() => setOpen(event)}
        >
          <Lanyard />
          <Image className={styles.badge} src={`/credentials/${event.id}.svg`} alt="" width={1000} height={1450} draggable={false} />
          <span className={styles.sleeve} aria-hidden="true" />
        </button>
      ))}
      {open && <EvidenceBoard key={open.id} event={open} onClose={() => setOpen(undefined)} />}
    </div>
  );
}
