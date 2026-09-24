"use client";

import { useEffect, useRef, useState } from "react";
import { loadCastle, saveCastle } from "@/lib/castle";
import { HP, PW, STAGES, T, fresh, lash, loot, merge, step, tileAt, validProgress, type Game, type Input, type Progress } from "./platformer";
import room from "./paper-toss.module.css";
import styles from "./coffee-run.module.css";

// Viewport in canvas px; CSS scales it up with `image-rendering: pixelated`.
const W = 192, H = 14 * T;
const KEYS: Record<string, keyof Input> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump", KeyZ: "jump", KeyX: "whip", KeyJ: "whip", KeyK: "whip",
};
const idle = (): Input => ({ left: false, right: false, jump: false, whip: false });
// One palette per stage, from the night gate to the last cup.
const LOOK = [
  { sky: "#17132e", far: "#262043", stone: "#5a5570", mortar: "#3c3852", top: "#7d7894" },
  { sky: "#140f0c", far: "#2a1f17", stone: "#5b4636", mortar: "#3a2c22", top: "#7a624d" },
  { sky: "#0e1822", far: "#1b2a38", stone: "#4d5a66", mortar: "#323c46", top: "#6f7d8a" },
  { sky: "#102521", far: "#24483c", stone: "#506b5b", mortar: "#304b3c", top: "#8ca98d" },
  { sky: "#29130d", far: "#542719", stone: "#76503b", mortar: "#4b2b20", top: "#c07842" },
  { sky: "#1d1022", far: "#3d2442", stone: "#67546e", mortar: "#40344c", top: "#b394b5" },
];

// Progress lives in localStorage (instant, offline) and in the database under a random key kept next to it.
const KEY = "cafe-castle-key", SAVE = "cafe-castle-progress";
const uuid = () => crypto.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
function key() {
  let k = localStorage.getItem(KEY);
  if (!k) localStorage.setItem(KEY, (k = uuid()));
  return k;
}
function readLocal(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE) ?? "");
    if (validProgress(p)) return p;
  } catch {}
  return { cleared: 0, best: [] };
}
function store(p: Progress, remote = true) {
  localStorage.setItem(SAVE, JSON.stringify(p));
  if (remote) saveCastle(key(), p).catch(() => {});
}

function draw(ctx: CanvasRenderingContext2D, g: Game) {
  const look = LOOK[g.stage], map = STAGES[g.stage].map, LW = map[0].length * T;
  const cam = Math.round(Math.max(0, Math.min(LW - W, g.x - W / 2)));
  const now = g.t, wave = Math.floor(performance.now() / 200) % 4;
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x) - cam, Math.round(y), w, h); };
  ctx.fillStyle = look.sky; ctx.fillRect(0, 0, W, H);

  // Far layer scrolls slower than the level.
  ctx.fillStyle = look.far;
  if (g.stage === 0) {
    ctx.fillStyle = "#e9e2c4"; ctx.fillRect(150, 10, 12, 12); ctx.fillRect(149, 12, 14, 8); ctx.fillStyle = look.sky; ctx.fillRect(155, 11, 6, 7);
    ctx.fillStyle = look.far;
    for (let x = -((cam * 0.3) % 96); x < W; x += 96) {
      ctx.fillRect(x, 50, 40, 60); ctx.fillRect(x + 6, 34, 10, 20); ctx.fillRect(x + 26, 28, 10, 26); ctx.fillRect(x + 60, 60, 30, 50); ctx.fillRect(x + 70, 44, 8, 20);
      for (const tx of [6, 26, 70]) for (let i = 0; i < 3; i++) ctx.fillRect(x + tx + i * 4, tx === 26 ? 25 : tx === 6 ? 31 : 41, 2, 3);
    }
  } else if (g.stage === 1) {
    for (let y = 16; y < H; y += 6) for (let x = -((cam * 0.5) % 16) + (y % 12 ? 8 : 0) - 16; x < W; x += 16) ctx.fillRect(x, y, 15, 5);
    ctx.fillStyle = "#3b2a1c";
    for (let x = -((cam * 0.5) % 120); x < W; x += 120) { ctx.fillRect(x + 20, 70, 18, 26); ctx.fillRect(x + 40, 76, 18, 20); ctx.fillStyle = "#2a1d13"; ctx.fillRect(x + 20, 78, 18, 2); ctx.fillRect(x + 40, 84, 18, 2); ctx.fillStyle = "#3b2a1c"; }
  } else if (g.stage === 2) {
    const cx = 130 - ((cam * 0.2) % 400), cy = 40;
    for (let a = 0; a < 12; a++) ctx.fillRect(cx + Math.cos(a / 6 * Math.PI) * 26 - 2, cy + Math.sin(a / 6 * Math.PI) * 26 - 2, 4, 4);
    ctx.fillRect(cx - 1, cy - 18, 2, 18); ctx.fillRect(cx, cy - 1, 12, 2);
    for (let x = -((cam * 0.4) % 70); x < W; x += 70) { const r = (performance.now() / 600 + x) % 6; for (let a = 0; a < 8; a++) ctx.fillRect(x + 20 + Math.cos(a / 4 * Math.PI + r) * 10 - 2, 90 + Math.sin(a / 4 * Math.PI + r) * 10 - 2, 4, 4); }
  } else if (g.stage === 3) {
    for (let x = -((cam * 0.3) % 48); x < W; x += 48) {
      ctx.fillRect(x + 20, 22, 3, 68); ctx.fillRect(x + 8, 32, 26, 2);
      ctx.fillStyle = "#3e7050"; ctx.fillRect(x + 4, 25, 34, 12); ctx.fillRect(x + 10, 18, 22, 12); ctx.fillStyle = look.far;
    }
  } else if (g.stage === 4) {
    for (let x = -((cam * 0.4) % 64); x < W; x += 64) {
      ctx.fillRect(x + 8, 40, 30, 58); ctx.fillRect(x + 12, 31, 22, 9);
      ctx.fillStyle = "#d47b32"; ctx.fillRect(x + 16, 62 + wave, 14, 18 - wave); ctx.fillStyle = look.far;
    }
  } else {
    for (let x = -((cam * 0.25) % 56); x < W; x += 56) {
      ctx.fillRect(x + 5, 24, 6, 76); ctx.fillRect(x + 39, 24, 6, 76); ctx.fillRect(x + 5, 21, 40, 4);
      ctx.fillStyle = "#9a617a"; ctx.fillRect(x + 14, 30, 22, 30); ctx.fillStyle = look.far;
    }
  }

  for (let cy = 0; cy < map.length; cy++) for (let cx = Math.floor(cam / T); cx <= (cam + W) / T; cx++) {
    const c = tileAt(g.stage, cx, cy), x = cx * T, y = cy * T, taken = g.got.has(`${cx},${cy}`);
    if (c === "#") {
      rect(x, y, T, T, look.stone); rect(x, y + 3, T, 1, look.mortar); rect(x, y + 7, T, 1, look.mortar);
      rect(x + (cy % 2 ? 2 : 6), y, 1, 3, look.mortar); rect(x + (cy % 2 ? 5 : 1), y + 4, 1, 3, look.mortar);
      if (tileAt(g.stage, cx, cy - 1) !== "#") rect(x, y, T, 1, look.top);
    }
    if (c === "=") { rect(x, y, T, 3, look.top); rect(x, y + 3, T, 1, look.mortar); rect(x + 3, y + 4, 2, 2, look.mortar); }
    if (c === "~") { rect(x, y, T, T, "#4a2511"); rect(x + ((cx + wave) % 4) * 2, y + 1, 3, 1, "#8b5a34"); if ((cx + wave) % 3 === 0) rect(x + 3, y - 1 - (wave % 2), 2, 2, "#8b5a34"); }
    if (c === "o" && !taken) { rect(x + 2, y + 2, 4, 5, "#5a3013"); rect(x + 1, y + 3, 1, 3, "#5a3013"); rect(x + 6, y + 3, 1, 3, "#5a3013"); rect(x + 4, y + 3, 1, 3, "#2d1608"); }
    if (c === "i" && !taken) {
      rect(x + 2, y + 7, 4, 1, "#b08d57"); rect(x + 3, y + 4, 2, 3, "#efe6cf");
      rect(x + 3, y + 1 + (wave % 2), 2, 3 - (wave % 2), "#ff9a3c"); rect(x + 3, y + 3, 1, 1, "#ffe08a");
    }
    if (c === "D") {
      rect(x - 1, y - 9, T + 2, 17, look.top); rect(x, y - 8, T, 16, "#3a2414"); rect(x + 1, y - 9, T - 2, 1, look.top);
      rect(x + 3, y - 6, 2, 3, "#ffcc55"); rect(x + 5, y, 1, 2, "#b08d57");
    }
  }

  // Bones burst out of a hit skeleton, away from the whip, and tumble under gravity; a dead one scatters with its skull.
  const bones = (f: Game["foes"][number], t: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const vx = f.kick * (25 + (i % 3) * 18) + Math.cos(i * 2.4) * 20, vy = -80 - (i % 4) * 22;
      const x = f.x + 3 + vx * t, y = f.y + 5 + vy * t + 200 * t * t;
      if (i === 0 && f.dead) { rect(x - 1, y - 1, 3, 3, "#e6e2d3"); rect(x, y, 1, 1, "#1a1a1a"); }
      else if (Math.floor(t * 14 + i) % 2) rect(x - 1, y, 3, 1, "#e6e2d3"); else rect(x, y - 1, 1, 3, "#e6e2d3");
    }
  };
  for (const f of g.foes) {
    if (f.dead && f.kind === "skel") { if (f.t < 0.9) bones(f, f.t, 8); continue; }
    if (f.dead) { if (f.t < 0.3) for (let i = 0; i < 4; i++) rect(f.x + 3 + Math.cos(i * 1.6) * f.t * 30, f.y + 5 + Math.sin(i * 1.6) * f.t * 30, 2, 2, "#ff9a3c"); continue; }
    if (f.kind === "bat") {
      const up = Math.floor(f.t * 8) % 2;
      rect(f.x + 2, f.y + 2, 3, 3, "#6b3f8f"); rect(f.x + 2, f.y + 3, 1, 1, "#ff4b4b"); rect(f.x + 4, f.y + 3, 1, 1, "#ff4b4b");
      rect(f.x, f.y + (up ? 0 : 3), 2, 2, "#8a4fb8"); rect(f.x + 5, f.y + (up ? 0 : 3), 2, 2, "#8a4fb8");
    } else if (f.kind === "count") {
      const coat = f.ouch < 0.15 ? "#ff8a7a" : "#301b33";
      rect(f.x - 1, f.y - 3, 8, 2, "#171019"); rect(f.x + 1, f.y - 6, 4, 3, "#171019");
      rect(f.x + 1, f.y, 4, 4, "#d5a281"); rect(f.x + 2, f.y + 2, 1, 1, "#e83f48"); rect(f.x + 4, f.y + 2, 1, 1, "#e83f48");
      rect(f.x, f.y + 4, 6, 9, coat); rect(f.x + 2, f.y + 4, 2, 7, "#a63345");
      rect(f.x - 1, f.y - 10, 8, 1, "#542536"); rect(f.x - 1, f.y - 10, Math.ceil((f.hp / 5) * 8), 1, "#e34c55");
    } else {
      if (f.ouch < 0.6) bones(f, f.ouch, 3);
      const bone = f.ouch < 0.15 ? "#ff8a7a" : "#e6e2d3", left = f.vx < 0, step = Math.floor(f.x / 3) % 2;
      rect(f.x + 1, f.y, 4, 4, bone); rect(f.x + (left ? 1 : 3), f.y + 1, 1, 2, "#1a1a1a");
      rect(f.x + 2, f.y + 4, 2, 5, bone); for (let r = 5; r < 9; r += 2) rect(f.x, f.y + r, 6, 1, bone);
      rect(f.x + 1 + step, f.y + 9, 1, 4, bone); rect(f.x + 4 - step, f.y + 9, 1, 4, bone);
    }
  }

  // Hero: a hunter in a coffee-brown coat. Blinks while invulnerable.
  if (!(g.hurt > 0 && Math.floor(now * 20) % 2)) {
    const spr = (dx: number, dy: number, w: number, h: number, color: string) => rect(g.face > 0 ? g.x + dx : g.x + PW - dx - w, g.y + dy, w, h, color);
    const walk = g.ground && g.vx ? Math.floor(g.x / 4) % 2 : 0;
    spr(1, 0, 4, 2, "#6b3b1f"); spr(1, 2, 4, 3, "#e8b48a"); spr(3, 3, 1, 1, "#1a1a1a"); spr(0, 1, 1, 3, "#6b3b1f");
    spr(0, 5, 6, 5, g.state === "dead" ? "#b43c3c" : "#7a2e1f"); spr(0, 8, 6, 1, "#3a2414");
    spr(1, 10, 2, 3 - walk, "#3b2a20"); spr(3, 10, 2, 3 - (1 - walk), "#3b2a20");
    const whip = lash(g);
    if (whip) { rect(whip.x, g.y + 5, whip.w, 1, "#c9a36b"); rect(g.face > 0 ? whip.x + whip.w - 2 : whip.x, g.y + 4, 2, 2, "#fff4d6"); }
    else if (g.whip > 0) spr(-5, 0, 6, 1, "#c9a36b");
  }
}

function Castle({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>(idle());
  const [progress, setProgress] = useState<Progress>({ cleared: 0, best: [] });
  const saved = useRef(progress);
  const [stage, setStage] = useState<number | null>(null);
  const [hud, setHud] = useState({ hp: HP, beans: 0, state: "play" as Game["state"] });
  const [note, setNote] = useState("");

  useEffect(() => {
    dialog.current!.showModal();
    const apply = (p: Progress, remote: boolean) => { saved.current = p; setProgress(p); store(p, remote); };
    apply(readLocal(), false);
    // Server and local copies merge, so progress made offline or on an older tab isn't lost; the merged copy goes back up.
    loadCastle(key()).then((p) => apply(merge(saved.current, p), true), () => {});
  }, []);

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    if (stage === null) { draw(ctx, fresh(Math.min(saved.current.cleared, STAGES.length - 1))); return; }
    input.current = idle();
    let g = fresh(stage), frame = 0, then = performance.now(), shown = "";
    function tick(now: number) {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      const was = g.state;
      step(g, input.current, dt);
      if (g.state === "won" && was === "play") {
        const best = [...saved.current.best]; best[g.stage] = g.beans;
        const next = merge(saved.current, { cleared: g.stage + 1, best });
        saved.current = next; setProgress(next); store(next);
      }
      if (g.state === "dead" && g.t > 1) g = fresh(g.stage);
      if (g.state === "won" && g.t > 1.5) {
        if (g.stage + 1 < STAGES.length) { setStage(g.stage + 1); return; }
        setNote("Você venceu o Conde D'arábica. O relógio voltou a andar, a última xícara foi servida e o sol nasceu."); setStage(null); return;
      }
      // Only re-render React when the HUD actually changes.
      const key = `${g.hp}|${g.beans}|${g.state}`;
      if (key !== shown) { shown = key; setHud({ hp: g.hp, beans: g.beans, state: g.state }); }
      draw(ctx, g);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    const press = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      input.current[k] = e.type === "keydown";
    };
    addEventListener("keydown", press);
    addEventListener("keyup", press);
    return () => { cancelAnimationFrame(frame); removeEventListener("keydown", press); removeEventListener("keyup", press); };
  }, [stage]);

  // Touch pad: each button holds its input while pressed.
  const pad = (k: keyof Input, label: string, glyph: string) => (
    <button type="button" aria-label={label} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); input.current[k] = true; }}
      onPointerUp={() => { input.current[k] = false; }} onPointerCancel={() => { input.current[k] = false; }} onContextMenu={(e) => e.preventDefault()}>{glyph}</button>
  );
  const play = (i: number) => { setNote(""); setStage(i); };

  return (
    <dialog ref={dialog} className={room.room} aria-label="Castelo do Café" onClose={onClose}>
      <p className={`${room.hud} ${styles.hud}`}>
        {stage === null ? <span>Castelo do Café</span> : <>
          <span>{STAGES[stage].name}</span>
          <span aria-label={`${hud.hp} de ${HP} corações`}>{"♥".repeat(Math.max(0, hud.hp))}<span className={styles.lost}>{"♥".repeat(HP - Math.max(0, hud.hp))}</span></span>
          <span>Grãos {hud.beans}/{loot(stage)}</span>
          {hud.state !== "play" && <span role="status">{hud.state === "won" ? "Fase concluída!" : "Você caiu…"}</span>}
          <button type="button" className={styles.menu} onClick={() => setStage(null)}>Fases</button>
        </>}
      </p>
      <div className={styles.frame}>
        <canvas ref={canvas} className={`${room.court} ${styles.level}`} width={W} height={H}
          aria-label="Jogo de plataforma: setas ou A e D para andar, espaço ou Z para pular, X ou J para o chicote" />
        {stage === null && (
          <div className={styles.stages}>
            {note && <p role="status">{note}</p>}
            <ol>
              {STAGES.map((s, i) => (
                <li key={s.name}>
                  <button type="button" disabled={i > progress.cleared} onClick={() => play(i)} autoFocus={i === Math.min(progress.cleared, STAGES.length - 1)}>
                    <span>{i + 1}. {s.name}</span>
                    <span className={styles.synopsis}>{s.story}</span>
                    <small>{i > progress.cleared ? "Trancada" : i < progress.cleared ? `✓ ${progress.best[i] ?? 0}/${loot(i)} grãos` : "Nova"}</small>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {stage !== null && <p className={styles.story}>{STAGES[stage].story}</p>}
      <p className={`${room.hint} ${styles.hint}`}>← → andar · espaço/Z pular · X/J chicote · pule por baixo das plataformas finas</p>
      {stage !== null && (
        <div className={styles.pad}>
          <span>{pad("left", "Andar para a esquerda", "◀")}{pad("right", "Andar para a direita", "▶")}</span>
          <span>{pad("whip", "Chicote", "B")}{pad("jump", "Pular", "A")}</span>
        </div>
      )}
      <p className={styles.rotate}>Gire o celular para jogar maior</p>
      <button type="button" className={room.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the coffee mug on the desk (drawn in WebGL) gets an invisible button on top that opens a pixel castle platformer.
export default function CoffeeRun() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.mug} aria-label="Caneca de café" onClick={() => setOpen(true)} />
      {open && <Castle onClose={() => setOpen(false)} />}
    </>
  );
}
