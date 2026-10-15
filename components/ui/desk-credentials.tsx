"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import events from "@/lib/events.json";
import { track } from "@/lib/track";
import EvidenceBoard from "./evidence-board";
import styles from "./desk-credentials.module.css";

// Round braided cord laid flat on the desk, folded back on itself beside its badge, ending in a crimp. Drawn in a box
// above the badge (60% of its width, 87 units = 0.87 badge widths tall; the loop runs on past it). The cord is a
// cylinder lit from the top left: dark underside, body, lit flank and a specular line, each offset towards the lamp.
const CORD = "M30 55 C21 33 5 4 -1 -22 C-4 -36 4 -46 12 -40 C18 -35 18 -16 22 2 C25 18 29 36 30 55";
function Lanyard() {
  return (
    <svg className={styles.lanyard} viewBox="0 0 60 87" aria-hidden="true">
      <path d={CORD} className={styles.cordShade} />
      <path d={CORD} className={styles.cordBody} />
      <path d={CORD} className={styles.cordBraid} />
      <path d={CORD} className={styles.cordLit} />
      <path d={CORD} className={styles.cordSpec} />
    </svg>
  );
}

// The hardware, drawn over the badge: crimp, jump ring, lobster clasp and the split ring that goes through the card's
// own punched slot (the only hole: the vinyl holder is open at the top).
function Clasp() {
  return (
    <svg className={`${styles.lanyard} ${styles.clasp}`} viewBox="0 0 60 87" aria-hidden="true">
      <rect x="27.2" y="49.5" width="5.6" height="7.5" rx="1.2" fill="url(#credential-metal)" stroke="#5c5d5f" strokeWidth=".35" />
      <path d="M27.6 51.5 H32.4 M27.6 53.2 H32.4 M27.6 54.9 H32.4" stroke="#0004" strokeWidth=".35" />
      <circle cx="30" cy="59.5" r="2.4" fill="none" stroke="url(#credential-metal)" strokeWidth="1.1" />
      <path d="M30 62 C26.4 62.4 25.7 67 26.7 70.4 C27.5 73.2 29 74.9 30 76.6 C31 74.9 32.5 73.2 33.3 70.4 C34.3 67 33.6 62.4 30 62 Z" fill="url(#credential-metal)" stroke="#55565a" strokeWidth=".4" />
      <path d="M31 64.6 C32.2 66.3 32.2 69.6 31.3 71.8" fill="none" stroke="#2c2d30" strokeWidth=".6" strokeLinecap="round" />
      <rect x="32.3" y="66.2" width="1.4" height="2.6" rx=".35" fill="#9b9ca0" />
      {/* split ring threaded through the slot: the top arcs over the card, the bottom runs dim inside the hole */}
      <path d="M28.2 82.4 A2.5 2.9 0 0 0 31.8 82.4" fill="none" stroke="#4b4c4f" strokeWidth=".9" strokeLinecap="round" />
      <path d="M28.2 82.4 A2.5 2.9 0 1 1 31.8 82.4" fill="none" stroke="url(#credential-metal)" strokeWidth="1" strokeLinecap="round" />
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
          onClick={() => { setOpen(event); track("credential", event.id); }}
        >
          <Lanyard />
          <Image className={styles.badge} src={`/credentials/${event.id}.svg`} alt="" width={1000} height={1450} draggable={false} />
          <span className={styles.sleeve} aria-hidden="true" />
          <Clasp />
        </button>
      ))}
      {open && <EvidenceBoard key={open.id} event={open} onClose={() => setOpen(undefined)} />}
    </div>
  );
}
