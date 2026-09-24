"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import events from "@/lib/events.json";
import EvidenceBoard from "./evidence-board";
import styles from "./desk-credentials.module.css";

// Pile on the desk; hovering (or focusing) fans them out, clicking opens that event's evidence board.
export default function DeskCredentials() {
  const [open, setOpen] = useState<(typeof events)[number]>();
  const mid = (events.length - 1) / 2;
  return (
    <div className={styles.pile} role="group" aria-label="Credenciais dos eventos">
      {events.map((event, index) => (
        <button
          key={event.id}
          type="button"
          className={styles.credential}
          style={{ "--i": index, "--fan": `${(index - mid) * 16}deg`, "--tilt": `${(index % 2 ? 1 : -1) * (2 + index * 1.5)}deg`, "--color": event.color, "--dark": event.darkColor } as CSSProperties}
          aria-label={`${event.name}, ${event.year}`}
          onClick={() => setOpen(event)}
        >
          <span className={styles.strap} aria-hidden="true" />
          <span className={styles.clasp} aria-hidden="true" />
          <Image className={styles.badge} src={`/credentials/${event.id}.svg`} alt="" width={1000} height={1450} draggable={false} />
        </button>
      ))}
      {open && <EvidenceBoard key={open.id} event={open} onClose={() => setOpen(undefined)} />}
    </div>
  );
}
