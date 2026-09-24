"use client";

import type { PointerEvent } from "react";
import styles from "./iridescent_visit_card.module.css";
import Grime from "@/components/ui/grime";

// Tilt + holo shift via CSS vars; no re-render per pointer move.
// Listeners live on the flat .scene so the tilting card can't slip out from under the pointer (flicker).
function move(e: PointerEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const el = e.currentTarget.firstElementChild as HTMLElement;
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--rx", `${(0.5 - y) * 20}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 24}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
}

function reset(e: PointerEvent<HTMLDivElement>) {
  const s = (e.currentTarget.firstElementChild as HTMLElement).style;
  ["--rx", "--ry", "--mx", "--my"].forEach((p) => s.removeProperty(p));
}

export default function VisitCard() {
  return (
    <div className={styles.scene} onPointerMove={move} onPointerLeave={reset}>
      <div className={styles.card}>
        <div className={styles.cardHolo} />
        <div className={styles.cardChip} />
        {/* ponytail: QR placeholder, swap for a real QR image when the URL is final */}
        <div className={styles.cardQr} aria-hidden />
        <img
          className={styles.cardSignature}
          src="/logos/jalmeida-signature.svg"
          alt="Assinatura de João de Almeida"
        />
        <div className={styles.cardName}>
          <p>João de Almeida</p>
        </div>
        <div className={styles.cardText}>
          <p>Creative Developer</p>
          <p>Design • Code • Build</p>
        </div>
        <Grime />
        <div className={styles.cardGlare} />
      </div>
    </div>
  );
}
