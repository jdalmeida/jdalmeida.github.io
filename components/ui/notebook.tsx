"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { Article } from "@/lib/articles";
import { countStamp, generateStamp, placeStamp, type Stamp } from "@/lib/stamps";
import { readLocal } from "./coffee-run";
import { beanShare } from "./platformer";
import { rng } from "./grime";
import StampSticker, { device, DOODLES, pad, strokes, TIERS, tier } from "./stamp";
import styles from "./notebook.module.css";

// A few doodles per page, kept in the margins so they don't cover the text.
// ponytail: doodles in the same margin can overlap; place them in a grid if that looks bad.
function Doodles({ seed, back }: { seed: number; back: boolean }) {
  const r = rng(seed);
  return Array.from({ length: Math.floor(r() * 4) }, (_, i) => {
    const spot = r();
    const [size, pos]: [number, CSSProperties] =
      spot < 0.3 ? [5 + r() * 2, { top: "1.5cqi", left: `${16 + r() * 60}cqi` }]
      : spot < 0.65 ? [6 + r() * 4, { bottom: "1.5cqi", left: `${14 + r() * 56}cqi` }]
      : [6 + r() * 2, { top: `${15 + r() * 65}%`, [back ? "right" : "left"]: "2cqi" }];
    const d = strokes(DOODLES[Math.floor(r() * DOODLES.length)](r), r);
    return (
      <svg key={i} className={styles.doodle} viewBox="-5 -5 110 110" aria-hidden style={{ ...pos, width: `${size}cqi`, rotate: `${(r() - 0.5) * 40}deg` }}>
        <path d={d} />
      </svg>
    );
  });
}

// Stamps stuck at the bottom edge of the first screen are nudged up so they don't make the page scroll
// (12.8cqi: half the box of a 20cqi sticker rotated up to 20deg).
// ponytail: stamps further down a long page aren't clamped; the content height isn't known in CSS.
const onFace = (stamps: Stamp[], f: number) =>
  stamps.filter((s) => s.face === f).map((s) => <StampSticker key={s.id} s={s} style={{ left: `${s.x}%`, top: s.y! > 100 ? `${s.y}%` : `min(${s.y}%, 100% - 12.8cqi)` }} />);

// Is `el` (the sticker being placed) over any text or image of the page? Both rects are in screen space,
// so the book's 3D tilt distorts them alike. The sticker's transparent corners don't count.
// ponytail: text reflows per device (fonts, mobile layout), so a stamp can end up touching text elsewhere.
function overText(face: HTMLElement, el: HTMLElement) {
  const b = el.getBoundingClientRect(), p = b.width * 0.15;
  const hit = (r: DOMRect) => r.right > b.left + p && r.left < b.right - p && r.bottom > b.top + p && r.top < b.bottom - p;
  const range = document.createRange(), walk = document.createTreeWalker(face, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode()); ) {
    range.selectNodeContents(n);
    if (n.textContent!.trim() && [...range.getClientRects()].some(hit)) return true;
  }
  return [...face.querySelectorAll("img")].some((img) => !img.closest("[data-stamp]") && hit(img.getBoundingClientRect()));
}

// Closed notebook on the desk (pages, cover); hovering peeks the cover open, clicking opens the book.
// A Family & Friends link (?ff=...) opens it straight away.
export default function DeskNotebook({ articles, stamps: initial }: { articles: Article[]; stamps: Stamp[] }) {
  const [open, setOpen] = useState(false);
  const [stamps, setStamps] = useState(initial);
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("ff")) return;
    const timer = setTimeout(() => setOpen(true)); // after hydration: the server can't see the query (static page)
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <button type="button" className={styles.notebook} aria-label="Abrir caderno: artigos e livro de visitas" onClick={() => setOpen(true)}>
        <span className={styles.backCover} />
        <span className={styles.cover}><span className={styles.label}>Anotações</span>{onFace(stamps, 0)}</span>
        <span className={styles.band} />
      </button>
      {open && <Book articles={articles} stamps={stamps} onPlaced={(s) => setStamps((all) => [...all, s])} onClose={() => setOpen(false)} />}
    </>
  );
}

// Faces are read in pairs: leaf n shows faces[2n] on its front and faces[2n + 1] on its back.
// With `flipped` leaves turned, the spread is faces[2 * flipped - 1] (left) and faces[2 * flipped] (right).
function Book({ articles, stamps, onPlaced, onClose }: { articles: Article[]; stamps: Stamp[]; onPlaced: (s: Stamp) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [[flipped, from], setFlip] = useState([0, 0]);
  const [closing, setClosing] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1e5));
  const [mine, setMine] = useState<Stamp | null>(null); // generated, being placed
  const [note, setNote] = useState<ReactNode>(null);
  const [left, setLeft] = useState(true); // phones: which page of the spread the camera is on
  const [beans] = useState(() => beanShare(readLocal())); // % of castle beans, once the Count is beaten in this browser
  const go = (n: number, l = true) => {
    setFlip(([now]) => [Math.max(0, Math.min(leaves, n)), now]);
    setLeft(l);
  };
  const goFace = (f: number) => go(Math.ceil(f / 2), f % 2 === 1);

  // Links to another post (old blog URLs) turn to it here; anything else opens in a new tab so the notebook stays open.
  const followLink = (e: MouseEvent) => {
    const link = (e.target as Element).closest("a");
    if (!link) return;
    e.preventDefault();
    const i = articles.findIndex((a) => link.pathname === `/blog/${a.slug}`);
    if (i >= 0) go(i + 3);
    else open(link.href, "_blank", "noopener");
  };

  const generate = async (count = false) => {
    setNote("Gerando…");
    try {
      const s = count ? await countStamp(device(), beans!) : await generateStamp(device(), new URLSearchParams(location.search).get("ff") ?? "");
      if (s.face === null) {
        setMine(s);
        setNote(null);
      } else setNote(<>Este dispositivo já colou o selo {pad(s.id)}. <button type="button" onClick={() => goFace(s.face!)}>Ver onde →</button></>);
    } catch {
      setNote("Não deu para gerar agora. Tenta de novo?");
    }
  };

  // While placing, the sticker follows the pointer; it goes grey over text.
  const aim = (e: MouseEvent<HTMLDivElement>) => {
    const layer = e.currentTarget, ghost = layer.firstElementChild as HTMLElement;
    const { offsetX: x, offsetY: y } = e.nativeEvent, r = ghost.offsetWidth * 0.64; // half the box of a sticker rotated up to 20deg
    Object.assign(ghost.style, { left: `${x}px`, top: `${y}px` });
    // Keep the whole sticker on the page: past the edges it's cut off or makes the page scroll.
    ghost.dataset.ok = String(x > r && y > r && x < layer.offsetWidth - r && y < layer.offsetHeight - r && !overText(layer.parentElement!, ghost));
  };
  const drop = async (e: MouseEvent<HTMLDivElement>, f: number) => {
    aim(e);
    const layer = e.currentTarget, face = layer.parentElement!;
    if ((layer.firstElementChild as HTMLElement).dataset.ok !== "true") return;
    const x = (e.nativeEvent.offsetX / face.clientWidth) * 100, y = (e.nativeEvent.offsetY / face.clientHeight) * 100;
    if (!confirm("Colar o selo aqui? Adesivo não descola.")) return;
    try {
      onPlaced(await placeStamp(device(), f, x, y, mine!.beans !== null));
      setMine(null);
      setNote("Colado! Obrigado pela visita.");
    } catch {
      alert("Não deu para colar. Tenta de novo?");
    }
  };

  const faces: ReactNode[] = [
    <div key="cover" className={styles.coverFace}><span className={styles.label}>Anotações</span><small>João de Almeida</small></div>,
    <div key="owner" className={styles.owner}>
      <p>Este caderno pertence a</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/jalmeida-signature.svg" alt="João de Almeida" />
      <p>Se encontrar, pode ler. Depois deixe seu selo onde quiser.</p>
    </div>,
    <section key="guestbook" className={styles.guestbook} aria-label="Livro de visitas">
      <h2>Livro de visitas</h2>
      {mine ? (
        <p>Seu selo {pad(mine.id)} ({mine.ff ? "Family & Friends" : TIERS[tier(mine)]}) está na mão. Vire as páginas e clique onde quer colar: capa, páginas, onde quiser, só não em cima do texto.{" "}
          <button type="button" onClick={() => setMine(null)}>Guardar para depois</button></p>
      ) : (
        <p>Passou por aqui? Gere um adesivo só seu, feito a partir do seu dispositivo, e cole neste caderno.{" "}
          <button type="button" onClick={() => generate()}>Gerar meu selo</button></p>
      )}
      {!mine && beans !== null && (
        <p>Venceu o Conde D&apos;arábica no castelo do café ({beans}% dos grãos)? O selo dele também é seu.{" "}
          <button type="button" onClick={() => generate(true)}>Pegar selo do Conde</button></p>
      )}
      {note && <p>{note}</p>}
      <ol className={styles.visitors}>
        {stamps.map((s) => (
          <li key={s.id}><button type="button" onClick={() => goFace(s.face!)}>
            {pad(s.id)} · {s.country ?? "??"} · {new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} · {s.ff ? "family & friends" : TIERS[tier(s)]}
          </button></li>
        ))}
      </ol>
    </section>,
    <div key="free" aria-label="Página para selos" />,
    <nav key="toc" className={styles.toc} aria-label="Sumário">
      <h2>Sumário</h2>
      <ol>
        <li><button type="button" onClick={() => go(1)}><span>Livro de visitas</span><i>2</i></button></li>
        {articles.map((a, i) => (
          <li key={a.slug}><button type="button" onClick={() => go(i + 3)}><span>{a.title}</span><i>{5 + 2 * i}</i></button></li>
        ))}
      </ol>
    </nav>,
    ...articles.flatMap((a) => [
      <header key={a.slug} className={styles.titlePage}>
        <time>{a.date}</time>
        <h2>{a.title}</h2>
        <p>{a.excerpt}</p>
        <ul>{a.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      </header>,
      <article key={a.slug + "-body"} className={styles.prose}>
        <div dangerouslySetInnerHTML={{ __html: a.html }} onClick={followLink} />
      </article>,
    ]),
    <div key="back" className={styles.coverFace} />,
  ];
  const leaves = faces.length / 2;
  // Phones see one page at a time: the camera pans left page -> right page before the leaf turns.
  const pan = () => matchMedia("(max-width: 640px) and (orientation: portrait)").matches && flipped > 0 && flipped < leaves;
  const next = () => (pan() && left ? setLeft(false) : go(flipped + 1));
  const prev = () => (pan() && !left ? setLeft(true) : go(flipped - 1, false));

  useEffect(() => {
    dialog.current!.showModal();
    // Arrive closed, then open the cover.
    const timer = setTimeout(() => go(1), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On window, not the dialog: a clicked sumário entry goes inert after the flip and focus falls to <body>.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  const close = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    go(0);
    setClosing(true);
  };

  return (
    <dialog
      ref={dialog}
      className={styles.room}
      data-closing={closing}
      aria-label="Caderno"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onAnimationEnd={(e) => { if (closing && e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.book} data-state={flipped === 0 ? "closed" : flipped === leaves ? "end" : "open"} data-page={left ? "left" : "right"}>
        {Array.from({ length: leaves }, (_, i) => {
          const turned = i < flipped;
          // Leaves turned in one jump go one after the other, starting from the one nearest the reader.
          const order = flipped > from ? i - from : from - 1 - i;
          return (
            <div key={i} className={styles.leaf} data-turned={turned} style={{ "--z": `${turned ? i : -i}px`, "--delay": `${Math.max(0, Math.min(order, 8)) * 90}ms` } as CSSProperties}>
              {[2 * i, 2 * i + 1].map((f) => (
                <div key={f} className={styles.face} data-side={f % 2 ? "back" : "front"} inert={f !== 2 * flipped - 1 && f !== 2 * flipped}>
                  {f > 0 && f < faces.length - 1 && <Doodles seed={seed + f * 7919} back={f % 2 === 1} />}
                  {faces[f]}
                  {f > 0 && f < faces.length - 1 && <span className={styles.folio}>{f}</span>}
                  {onFace(stamps, f)}
                  {mine && (
                    // Covers the whole scrollable page, so offsetX/Y are page coordinates (in the face's own, untilted space).
                    <div className={styles.placeLayer} ref={(el) => { if (el) el.style.height = `${el.parentElement!.scrollHeight}px`; }} onMouseMove={aim} onClick={(e) => drop(e, f)}>
                      <StampSticker s={mine} ghost />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <button type="button" className={styles.back} onClick={close}>← Voltar à mesa</button>
      <div className={styles.nav}>
        <button type="button" onClick={prev} disabled={flipped === 0} aria-label="Página anterior">←</button>
        <button type="button" onClick={() => go(1)} disabled={flipped === 1}>Sumário</button>
        <button type="button" onClick={next} disabled={flipped === leaves} aria-label="Próxima página">→</button>
      </div>
    </dialog>
  );
}
