"use client";

import { Bungee } from "next/font/google";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getScoreboard, setScoreName, submitScore } from "@/lib/stamps";
import { track } from "@/lib/track";
import { dive } from "./desk-dive";
import * as audio from "./paper-audio";
import { device, SCORE_TIERS, TIERS } from "./stamp";
import styles from "./paper-toss.module.css";
import card from "./coffee-run.module.css";

// Scoreboard display face for the title card, loaded only with the game.
const arena = Bungee({ subsets: ["latin"], weight: "400" });

// Playfield in canvas px; CSS scales it up with `image-rendering: pixelated`. Speeds are px/s, accelerations px/s².
const W = 160, H = 100, FLOOR = 90, G = 150, R = 3, PULL = 40, POWER = 4;
const START = { x: 22, y: FLOOR - R };
const CAN = { left: 118, right: 138, top: 62 };

type Ball = { x: number; y: number; vx: number; vy: number; state: "ready" | "flying" | "in" | "out"; t: number };
const fresh = (): Ball => ({ ...START, vx: 0, vy: 0, state: "ready", t: 0 });
const gust = () => Math.round((Math.random() * 2 - 1) * 30);

// One pure physics step, so it can be checked without a canvas. Returns true when the ball just dropped in.
export function step(b: Ball, dt: number, wind: number) {
  if (b.state === "in") { b.y = Math.min(b.y + 50 * dt, FLOOR - R); b.t += dt; return false; }
  if (b.state !== "flying") { b.t += dt; return false; }
  const prevY = b.y;
  b.vx += wind * dt; b.vy += G * dt;
  b.x += b.vx * dt; b.y += b.vy * dt;
  // The rim's two top corners bounce the ball like points.
  for (const rx of [CAN.left, CAN.right]) {
    const dx = b.x - rx, dy = b.y - CAN.top, d = Math.hypot(dx, dy);
    if (d >= R || !d) continue;
    const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
    if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; }
    b.x = rx + nx * R; b.y = CAN.top + ny * R;
  }
  if (prevY < CAN.top && b.y >= CAN.top && b.x > CAN.left && b.x < CAN.right) { b.state = "in"; b.t = 0; return true; }
  // Beside the can, below the rim: its walls push the ball out.
  if (b.y > CAN.top && b.x > CAN.left - R && b.x < CAN.right + R) {
    b.x = b.x < (CAN.left + CAN.right) / 2 ? CAN.left - R : CAN.right + R;
    b.vx *= -0.5;
  }
  if (b.y > FLOOR - R) {
    b.y = FLOOR - R; b.vy *= -0.35; b.vx *= 0.6;
    if (Math.abs(b.vy) < 15) { b.state = "out"; b.t = 0; }
  }
  if (b.x < -R || b.x > W + R) { b.state = "out"; b.t = 0; }
  return false;
}

// Crisp pixel circle (canvas arcs antialias into blur once scaled up).
export function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
    if (dx * dx + dy * dy <= r * r + r * 0.8) ctx.fillRect(Math.round(x) + dx, Math.round(y) + dy, 1, 1);
}

function draw(ctx: CanvasRenderingContext2D, b: Ball, pull: { x: number; y: number } | null) {
  ctx.fillStyle = "#34332e"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2b2a26"; for (let x = 0; x < W; x += 12) ctx.fillRect(x, 0, 1, FLOOR - 3);
  ctx.fillStyle = "#1e1d1a"; ctx.fillRect(0, FLOOR - 3, W, 3);
  ctx.fillStyle = "#5b4330"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = "#4a3526"; for (let x = 6; x < W; x += 20) ctx.fillRect(x, FLOOR, 1, H - FLOOR);
  if (pull) {
    ctx.fillStyle = "#ffffff88";
    for (let i = 1; i <= 8; i++) {
      const t = i * 0.07;
      ctx.fillRect(Math.round(START.x - pull.x * POWER * t), Math.round(START.y - pull.y * POWER * t + G * t * t / 2), 1, 1);
    }
  }
  disc(ctx, b.x, b.y, R, "#e3ddcf");
  ctx.fillStyle = "#a9a28f";
  ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y), 1, 1);
  ctx.fillRect(Math.round(b.x) + 1, Math.round(b.y) - 1, 1, 1);
  // Can drawn last, so a ball that dropped in disappears behind it.
  ctx.fillStyle = "#1a1917"; ctx.fillRect(CAN.left - 1, FLOOR, CAN.right - CAN.left + 4, 2);
  ctx.fillStyle = "#5c5e59"; ctx.fillRect(CAN.left, CAN.top, CAN.right - CAN.left, FLOOR - CAN.top);
  ctx.fillStyle = "#4a4c47"; for (let x = CAN.left + 3; x < CAN.right; x += 4) ctx.fillRect(x, CAN.top + 2, 1, FLOOR - CAN.top - 2);
  ctx.fillStyle = "#8b8d88"; ctx.fillRect(CAN.left - 1, CAN.top - 1, CAN.right - CAN.left + 2, 2);
}

const ease = (x: number) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// Fixed pseudo-random numbers, so city lights and paper scraps stay put between frames.
const hash = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
// The demo throw: launched every PERIOD seconds from START, it drops into the can after FLIGHT seconds (no wind).
const PERIOD = 2.4, LAUNCH = 0.3, FLIGHT = 1.1, AIM = (CAN.left + CAN.right) / 2;
const VX = (AIM - START.x) / FLIGHT, VY = (CAN.top - START.y - (G / 2) * FLIGHT * FLIGHT) / FLIGHT;

// Title scene: out of the bin, the office after hours. The city lights up the window, a lamp spots the can, scraps of
// paper drift down and a ball keeps swishing in. Drawn over `draw`'s room, so the court is the one you'll play on.
// `t` is seconds since the dive; `calm` drops motion.
function drawIntro(ctx: CanvasRenderingContext2D, t: number, calm: boolean) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const u = calm ? LAUNCH + FLIGHT / 2 : t % PERIOD, f = Math.max(0, u - LAUNCH);
  const ball = fresh();
  if (f > FLIGHT) Object.assign(ball, { x: AIM, y: Math.min(FLOOR - R, CAN.top + 50 * (f - FLIGHT)) });
  else if (f > 0) Object.assign(ball, { x: START.x + VX * f, y: START.y + VY * f + (G / 2) * f * f });
  draw(ctx, ball, null);

  // The window: night sky, a moon, the city's lit windows blinking on and off.
  rect(34, 8, 64, 42, "#1e1d1a"); rect(36, 10, 60, 38, "#0f1a2b"); rect(36, 34, 60, 14, "#14223a");
  rect(84, 14, 4, 4, "#f4ecd2"); rect(85, 13, 2, 1, "#f4ecd2"); rect(83, 15, 1, 2, "#f4ecd2");
  for (let i = 0; i < 9; i++) {
    const x = 36 + i * 7, top = 26 + Math.round(hash(i) * 12);
    rect(x, top, 6, 48 - top, "#0a1120");
    for (let y = top + 2; y < 46; y += 3) for (let k = 0; k < 2; k++) if (hash(i * 31 + y * 7 + k + Math.floor(calm ? 0 : t / 3 + hash(y + i))) > 0.55) rect(x + 1 + k * 3, y, 1, 1, "#f2c94c");
  }
  rect(65, 10, 2, 38, "#1e1d1a"); rect(36, 28, 60, 1, "#1e1d1a");

  // A desk lamp's cone on the can, swaying a little.
  ctx.globalAlpha = 0.08;
  const aim = AIM + (calm ? 0 : Math.sin(t * 1.3) * 4);
  for (let y = 0; y < FLOOR; y++) { const k = y / FLOOR, half = 3 + 18 * k; rect(140 + (aim - 140) * k - half, y, half * 2, 1, "#fff0c4"); }
  ctx.globalAlpha = 1;

  // Scraps of paper drifting down like confetti.
  for (let i = 0; i < 14; i++) {
    const y = calm ? hash(i + 5) * FLOOR : ((t * (6 + hash(i) * 6) + hash(i + 5) * 110) % 110) - 10;
    rect(hash(i + 9) * W + (calm ? 0 : Math.sin(t * 2 + i) * 3), y, 2, 1, i % 2 ? "#e3ddcf" : "#a9a28f");
  }
  // Swish: a sparkle over the rim as the ball drops in.
  if (!calm && f > FLIGHT && f < FLIGHT + 0.4) for (const [dx, dy] of [[-8, -4], [8, -5], [-4, -9], [5, -10]]) rect(AIM + dx, CAN.top + dy - (f - FLIGHT) * 10, 1, 1, "#fff3b0");

  // Out of the bin: the room opens up from the can's mouth.
  if (!calm && t < 1.6) {
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(AIM, CAN.top, 4 + 190 * ease(t / 1.5), 0, Math.PI * 2, true); ctx.fill();
  }
  ctx.globalAlpha = 0.35; rect(0, 0, W, 2, "#000"); rect(0, H - 2, W, 2, "#000"); rect(0, 0, 2, H, "#000"); rect(W - 2, 0, 2, H, "#000"); ctx.globalAlpha = 1;
}

// The prologue, one caption at a time under the title (timed in coffee-run.module.css: 3.5s in, 3s each).
const PROLOGUE = [
  "Sexta, 18h. O escritório esvaziou, mas a lixeira do canto ficou de olho.",
  "Hoje é a final da liga de basquete de papel.",
  "Só você, uma bolinha amassada e o vento do ar-condicionado.",
];

// Sounds come from what changed in a step, so `step` stays pure. The rim and the bin's sides are told apart from the
// floor by where the ball is; any kick beyond gravity and wind means it hit something.
function listen(b: Ball, was: Ball, dt: number, wind: number) {
  if (was.state !== "flying") return;
  const { sfx } = audio;
  const kick = Math.hypot(b.vx - (was.vx + wind * dt), b.vy - (was.vy + G * dt));
  if (b.y >= FLOOR - R && was.vy > 0 && b.vy <= 0) sfx.floor(was.vy / 150);
  else if (kick > 20 && b.state === "flying") { if (b.y < CAN.top + R) sfx.rim(); else sfx.side(); }
}

type Board = Awaited<ReturnType<typeof getScoreboard>>;

function Game({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // Opening: the title scene (the desk camera has just dived into the bin) plays until a key or tap.
  const [intro, setIntro] = useState(true);
  const introRef = useRef(intro);
  const enter = () => { if (!introRef.current) return; introRef.current = false; setIntro(false); audio.sfx.basket(1); audio.play(); };
  const [hud, setHud] = useState({ score: 0, best: 0, wind: 0 });
  const [board, setBoard] = useState<Board>();
  const [note, setNote] = useState("");
  const [sound, setSound] = useState(() => !audio.muted());
  const toggleSound = () => setSound((on) => { audio.setMuted(on); return !on; });

  useEffect(() => {
    audio.unlock();
    audio.title();
    // M toggles the sound anywhere in the game (but not while typing a name).
    const mute = (e: KeyboardEvent) => { if (e.code === "KeyM" && !e.repeat && !(e.target instanceof HTMLInputElement)) toggleSound(); };
    addEventListener("keydown", mute);
    return () => { removeEventListener("keydown", mute); audio.stop(); };
  }, []);

  useEffect(() => {
    dialog.current!.showModal();
    const el = canvas.current!, ctx = el.getContext("2d")!;
    // First throw is windless; each later one gets a new gust.
    let ball = fresh(), wind = 0, score = 0, best = 0, frame = 0, then = performance.now(), throws = 0, max = 0, cheered = false;
    const opened = then, calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    track("game", "paper-toss");
    let drag: { x: number; y: number; pull: { x: number; y: number } } | null = null;
    const load = () => getScoreboard(device()).then((b) => {
      best = Math.max(best, b.me.best);
      setBoard(b);
      setHud((h) => ({ ...h, best }));
    }).catch(() => {});
    load();

    function tick(now: number) {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      // Each basket past the record is saved right away, so closing mid-streak loses nothing.
      const was = { ...ball };
      if (step(ball, dt, wind)) {
        max = Math.max(max, ++score);
        audio.sfx.basket(score);
        if (score > best) {
          // One fanfare per visit, the first time a streak passes the saved record.
          if (best > 0 && !cheered) { cheered = true; setTimeout(audio.sfx.record, 450); }
          best = score; submitScore(device(), score).then(load, () => {});
        }
      } else listen(ball, was, dt, wind);
      if ((ball.state === "in" || ball.state === "out") && ball.t > 0.6) {
        if (ball.state === "out") { if (score > 0) audio.sfx.miss(); score = 0; }
        ball = fresh(); wind = gust();
        if (wind) audio.sfx.wind(Math.abs(wind) / 30);
        setHud({ score, best, wind });
      }
      if (introRef.current) drawIntro(ctx, (now - opened) / 1000, calm);
      else draw(ctx, ball, drag?.pull ?? null);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (ball.state !== "ready") return;
      el.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, pull: { x: 0, y: 0 } };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const scale = W / el.clientWidth;
      let x = (e.clientX - drag.x) * scale, y = (e.clientY - drag.y) * scale;
      const len = Math.hypot(x, y);
      if (len > PULL) { x *= PULL / len; y *= PULL / len; }
      // A creak each time the pull stretches another notch.
      const notch = Math.floor(Math.min(len, PULL) / 8), last = Math.floor(Math.hypot(drag.pull.x, drag.pull.y) / 8);
      if (notch > last) audio.sfx.stretch(notch / (PULL / 8));
      drag.pull = { x, y };
    };
    const up = () => {
      if (!drag) return;
      const { x, y } = drag.pull;
      drag = null;
      if (Math.hypot(x, y) < 3) return;
      Object.assign(ball, { vx: -x * POWER, vy: -y * POWER, state: "flying" });
      audio.sfx.throw(Math.hypot(x, y) / PULL);
      throws++;
    };
    // Any key but Escape (closes) and Tab ends the title, on keyup, so it can't also press a button behind it.
    const skip = (e: KeyboardEvent) => {
      if (!introRef.current || e.code === "Escape" || e.code === "Tab") return;
      e.preventDefault();
      if (e.type === "keyup") enter();
    };
    addEventListener("keydown", skip);
    addEventListener("keyup", skip);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      removeEventListener("keydown", skip);
      removeEventListener("keyup", skip);
      if (throws) track("score", "paper-toss", { throws, max });
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  const saveName = async (form: FormData) => {
    try {
      const name = await setScoreName(device(), String(form.get("name")));
      setBoard(await getScoreboard(device()));
      setNote(`Salvo como ${name}.`);
    } catch {
      setNote("Não deu para salvar. Tenta de novo?");
    }
  };

  return (
    <dialog ref={dialog} className={`${styles.room} ${card.arrive}`} aria-label="Basquete de papel" onClose={onClose} onPointerDown={audio.unlock}>
      <p className={styles.hud}>
        {intro ? <span>{"\u00a0"}</span> : <>
          <span>Cestas {hud.score}</span>
          <span>Recorde {hud.best}</span>
          <span>Vento {hud.wind < 0 ? "←" : hud.wind > 0 ? "→" : "·"} {Math.abs(hud.wind / 10).toFixed(1)}</span>
        </>}
        <button type="button" className={styles.sound} aria-pressed={sound} onClick={toggleSound} title="Som (M)">{sound ? "♪ Som" : "♪ Mudo"}</button>
      </p>
      <div className={styles.table}>
        <div className={styles.stage}>
          <canvas ref={canvas} className={styles.court} width={W} height={H} aria-label="Arraste para trás e solte para arremessar a bolinha de papel na lata de lixo" />
          {intro && (
            <div className={card.intro} onPointerUp={enter}>
              <h2 className={`${arena.className} ${styles.logo}`}>Basquete <small>de</small> Papel</h2>
              <p className={card.subtitle}>— A Final do Expediente —</p>
              <div className={card.prologue}>
                {PROLOGUE.map((line, i) => <p key={line} style={{ "--i": i } as CSSProperties}>{line}</p>)}
                <p className={card.press} style={{ "--i": PROLOGUE.length } as CSSProperties}>Aperte uma tecla ou toque para arremessar</p>
              </div>
              <button type="button" className={card.skip} onClick={enter}>Pular ›</button>
            </div>
          )}
        </div>
        <aside className={styles.board}>
          <h2>Top 10</h2>
          <ol>
            {board?.top.map((p, i) => <li key={i}><span>{p.name}</span><span>{p.best}</span></li>)}
            {board && !board.top.length && <li>Ninguém ainda. Seja o primeiro!</li>}
          </ol>
          <form action={saveName}>
            <label htmlFor="toss-name">Seu nome no placar</label>
            <span>
              <input id="toss-name" name="name" required maxLength={20} defaultValue={board?.me.name ?? ""} key={board?.me.name ?? ""} autoComplete="nickname" />
              <button type="submit">Salvar</button>
            </span>
            {note && <small role="status">{note}</small>}
          </form>
          <small>Acertos seguidos melhoram seu selo do caderno: {SCORE_TIERS[0]} deixam ele {TIERS[1]}, {SCORE_TIERS[1]} deixam ele {TIERS[2]}.</small>
        </aside>
      </div>
      <p className={styles.hint}>Arraste para trás e solte para arremessar · M som</p>
      <button type="button" className={styles.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the waste bin beside the desk (drawn in WebGL) gets an invisible button on top that opens paper-ball basketball.
// The desk camera dives into the bin first, and climbs back out when the game closes.
export default function PaperToss() {
  const [open, setOpen] = useState(false);
  const bin = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={bin} type="button" className={styles.bin} aria-label="Lata de lixo" onClick={() => { audio.unlock(); dive(bin.current, "bin", true, () => setOpen(true)); }} />
      {open && <Game onClose={() => { setOpen(false); dive(bin.current, "bin", false); }} />}
    </>
  );
}
