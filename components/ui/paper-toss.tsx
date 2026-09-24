"use client";

import { useEffect, useRef, useState } from "react";
import { getScoreboard, setScoreName, submitScore } from "@/lib/stamps";
import { device, SCORE_TIERS, TIERS } from "./stamp";
import styles from "./paper-toss.module.css";

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
function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
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

type Board = Awaited<ReturnType<typeof getScoreboard>>;

function Game({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, best: 0, wind: 0 });
  const [board, setBoard] = useState<Board>();
  const [note, setNote] = useState("");

  useEffect(() => {
    dialog.current!.showModal();
    const el = canvas.current!, ctx = el.getContext("2d")!;
    // First throw is windless; each later one gets a new gust.
    let ball = fresh(), wind = 0, score = 0, best = 0, frame = 0, then = performance.now();
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
      if (step(ball, dt, wind) && ++score > best) { best = score; submitScore(device(), score).then(load, () => {}); }
      if ((ball.state === "in" || ball.state === "out") && ball.t > 0.6) {
        if (ball.state === "out") score = 0;
        ball = fresh(); wind = gust();
        setHud({ score, best, wind });
      }
      draw(ctx, ball, drag?.pull ?? null);
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
      drag.pull = { x, y };
    };
    const up = () => {
      if (!drag) return;
      const { x, y } = drag.pull;
      drag = null;
      if (Math.hypot(x, y) < 3) return;
      Object.assign(ball, { vx: -x * POWER, vy: -y * POWER, state: "flying" });
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
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
    <dialog ref={dialog} className={styles.room} aria-label="Basquete de papel" onClose={onClose}>
      <p className={styles.hud}>
        <span>Cestas {hud.score}</span>
        <span>Recorde {hud.best}</span>
        <span>Vento {hud.wind < 0 ? "←" : hud.wind > 0 ? "→" : "·"} {Math.abs(hud.wind / 10).toFixed(1)}</span>
      </p>
      <div className={styles.table}>
        <canvas ref={canvas} className={styles.court} width={W} height={H} aria-label="Arraste para trás e solte para arremessar a bolinha de papel na lata de lixo" />
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
      <p className={styles.hint}>Arraste para trás e solte para arremessar</p>
      <button type="button" className={styles.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the waste bin beside the desk (drawn in WebGL) gets an invisible button on top that opens paper-ball basketball.
export default function PaperToss() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.bin} aria-label="Lata de lixo" onClick={() => setOpen(true)} />
      {open && <Game onClose={() => setOpen(false)} />}
    </>
  );
}
