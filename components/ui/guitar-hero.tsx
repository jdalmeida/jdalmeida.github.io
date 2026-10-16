"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getJamBoard, setJamName, submitJam } from "@/lib/jams";
import { track } from "@/lib/track";
import { dive } from "./desk-dive";
import * as audio from "./guitar-audio";
import { advance, BARS, cleanTitle, decode, DRUMS, encode, fresh, LOOK, MAX_STEPS, mult, SCALE, SONG, strum, timeOf, type Jam, type Judge, type Play } from "./guitar";
import { disc } from "./paper-toss";
import { device, JAM_TIERS, TIERS } from "./stamp";
import room from "./paper-toss.module.css";
import run from "./desk-run.module.css";
import styles from "./guitar-hero.module.css";

// Portrait neck in canvas px; CSS scales it up with `image-rendering: pixelated`. Notes fall LOOK seconds down to LINE.
const W = 120, H = 160, LINE = 140, LANES = [36, 60, 84];
const COLORS = ["#5fd16a", "#e5534b", "#f2c94c"], DARK = ["#2c6a33", "#7a2622", "#8a6a1c"];
const KEYS: Record<string, number> = { KeyA: 0, ArrowLeft: 0, KeyS: 1, ArrowDown: 1, KeyD: 2, ArrowRight: 2 };
const SAY: Record<Judge, string> = { perfect: "Perfeito!", good: "Boa", miss: "Errou" };
const OFFSET = "guitar-offset", DRAFT = "guitar-draft";
const yOf = (ahead: number) => LINE - (ahead / LOOK) * LINE;

// The maple fretboard of the Strat on the floor, seen from above: frets scroll by on the beat, notes ride the strings.
function draw(ctx: CanvasRenderingContext2D, p: Play | null, t: number, held: number[]) {
  ctx.fillStyle = "#0e0e0f"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#c99a5b"; ctx.fillRect(20, 0, 80, H);
  ctx.fillStyle = "#b8874a"; for (const x of [27, 41, 53, 71, 88]) ctx.fillRect(x, 0, 1, H);
  const beat = 2 * (p?.step ?? 60 / SONG.bpm / 2);
  for (let k = Math.ceil((t - 0.3) / beat); k * beat <= t + LOOK; k++) {
    const y = Math.round(yOf(k * beat - t));
    ctx.fillStyle = "#8a6a3e"; ctx.fillRect(20, y + 1, 80, 1);
    ctx.fillStyle = "#e2e0d8"; ctx.fillRect(20, y, 80, 1);
    if (((k % 8) + 8) % 8 === 3) disc(ctx, 60, yOf((k + 0.5) * beat - t), 2, "#2a1d12"); // inlay dot
  }
  LANES.forEach((x, i) => { ctx.fillStyle = "#e6e2d8"; ctx.fillRect(x - (i ? 0 : 1), 0, i ? 1 : 2, H); });
  ctx.fillStyle = "#0e0e0f88"; ctx.fillRect(20, LINE - 1, 80, 3);
  LANES.forEach((x, i) => { disc(ctx, x, LINE, 6, COLORS[i]); disc(ctx, x, LINE, 4, held[i] ? COLORS[i] + "aa" : "#1a1410"); });
  if (p) {
    for (const n of p.notes) {
      const x = LANES[n.lane];
      if (n.judge && n.judge !== "miss") { if (t - n.at! < 0.15) disc(ctx, x, LINE, 8, "#fff8"); continue; }
      const ahead = timeOf(p, n) - t, y = yOf(ahead);
      if (y < -40 || y > H + 6) continue;
      if (n.len > 1) { ctx.fillStyle = n.judge ? "#555" : DARK[n.lane]; const top = yOf(ahead + (n.len - 1) * p.step); ctx.fillRect(x - 1, top, 3, y - top); }
      disc(ctx, x, y, 5, n.judge ? "#333" : DARK[n.lane]);
      disc(ctx, x, y, 4, n.judge ? "#666" : COLORS[n.lane]);
      ctx.fillStyle = "#fff9"; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 1, 1);
    }
    // The crowd meter: down the left edge, empty means booed off.
    ctx.fillStyle = "#222"; ctx.fillRect(6, 20, 5, 100);
    ctx.fillStyle = p.meter < 30 ? "#e5534b" : p.meter < 60 ? "#f2c94c" : "#5fd16a";
    ctx.fillRect(6, 120 - p.meter, 5, p.meter);
  }
}

// A one-bar-a-row step grid: each column is an eighth note, each row a note of the scale (high at the top), coloured by
// the string it falls on. One note per step.
// ponytail: no held notes in the editor (every note is one step); add a hold tool if people ask for sustains.
function Editor({ draft, setDraft, onPlay, onBack }: { draft: Jam; setDraft: (j: Jam) => void; onPlay: () => void; onBack: () => void }) {
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState(false);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const pages = Math.ceil(draft.lead.length / 16), from = page * 16;
  const notes = /[a-k]/.test(draft.lead);
  const edit = (j: Partial<Jam>) => { setDraft({ ...draft, ...j }); setLink(""); setNote(""); if (preview) { audio.stop(); setPreview(false); } };
  const put = (i: number, key: string) => edit({ lead: draft.lead.slice(0, i) + (draft.lead[i] === key ? "." : key) + draft.lead.slice(i + 1) });
  const bars = (n: number) => {
    const lead = n > 0 ? (draft.lead + ".".repeat(8 * n)).slice(0, MAX_STEPS) : draft.lead.slice(0, Math.max(8, draft.lead.length + 8 * n));
    edit({ lead });
    setPage((p) => Math.min(p, Math.ceil(lead.length / 16) - 1));
  };
  const listen = () => { audio.unlock(); if (preview) audio.stop(); else audio.play(draft, true); setPreview(!preview); };
  const share = async () => {
    const url = `${location.origin}${location.pathname}#${encode({ ...draft, title: cleanTitle(draft.title) || "Sem título" })}`;
    setLink(url);
    try { await navigator.clipboard.writeText(url); setNote("Link copiado. Quem abrir toca a sua música."); }
    catch { setNote("Copie o link abaixo."); }
  };
  useEffect(() => () => audio.stop(), []);

  return (
    <div className={styles.editor}>
      <p className={run.title}>Criar música</p>
      <div className={styles.fields}>
        <label>Título <input value={draft.title} maxLength={40} onChange={(e) => edit({ title: e.target.value })} placeholder="Minha música" /></label>
        <label>BPM <input type="number" min={60} max={200} value={draft.bpm} onChange={(e) => edit({ bpm: Math.max(60, Math.min(200, Math.round(+e.target.value) || 120)) })} /></label>
        <label>Bateria <select value={draft.drums} onChange={(e) => edit({ drums: +e.target.value })}>{DRUMS.map((d, i) => <option key={i} value={i}>{d.name}</option>)}</select></label>
      </div>
      <div className={styles.grid} role="group" aria-label={`Passos ${from + 1} a ${from + 16}`}>
        {SCALE.map((_, r) => {
          const pitch = SCALE.length - 1 - r, key = "abcdefghijk"[pitch], lane = pitch < 4 ? 0 : pitch < 7 ? 1 : 2;
          return (
            <div key={r} className={styles.row} style={{ "--lane": COLORS[lane] } as CSSProperties}>
              <span className={styles.pitch}>{SCALE[pitch]}</span>
              {Array.from({ length: 16 }, (_, c) => {
                const i = from + c, on = draft.lead[i] === key;
                if (i >= draft.lead.length) return <span key={c} />;
                return <button key={c} type="button" aria-pressed={on} aria-label={`${SCALE[pitch]}, passo ${i + 1}`} className={styles.cell} onClick={() => put(i, key)} />;
              })}
            </div>
          );
        })}
      </div>
      <div className={styles.bar}>
        <button type="button" disabled={!page} onClick={() => setPage(page - 1)} aria-label="Compassos anteriores">◀</button>
        <span>Compassos {page * 2 + 1}–{Math.min(page * 2 + 2, draft.lead.length / 8)} de {draft.lead.length / 8}</span>
        <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Próximos compassos">▶</button>
        <button type="button" disabled={draft.lead.length >= MAX_STEPS} onClick={() => bars(1)}>+ compasso</button>
        <button type="button" disabled={draft.lead.length <= 8} onClick={() => bars(-1)}>− compasso</button>
        <button type="button" onClick={() => edit({ lead: ".".repeat(8 * BARS) })}>Limpar</button>
      </div>
      <div className={styles.bar}>
        <button type="button" onClick={listen} disabled={!notes}>{preview ? "■ Parar" : "▶ Ouvir"}</button>
        <button type="button" onClick={onPlay} disabled={!notes}>Jogar</button>
        <button type="button" onClick={share} disabled={!notes}>Copiar link</button>
        <button type="button" onClick={onBack}>Voltar</button>
      </div>
      {note && <small role="status">{note}</small>}
      {link && <input className={styles.link} readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link da música" />}
      <small className={styles.legal}>Use só músicas que você compôs. A música vai inteira dentro do link: ela não fica salva neste site.</small>
    </div>
  );
}

type Board = Awaited<ReturnType<typeof getJamBoard>>;
type Phase = "ready" | "playing" | "over" | "edit";

function readDraft(): Jam {
  try { const j = decode(localStorage.getItem(DRAFT) ?? ""); if (j) return j; } catch {}
  return { title: "", bpm: 120, drums: 0, lead: SONG.lead.slice(0, 8 * BARS) };
}

function Game({ shared, onClose }: { shared: Jam | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<{ start: () => void; halt: () => void } | null>(null);
  const [jam, setJam] = useState<Jam>(shared ?? SONG);
  const jamRef = useRef(jam);
  const [draft, setDraftState] = useState<Jam>(readDraft);
  const [phase, setPhase] = useState<Phase>("ready");
  const phaseRef = useRef(phase);
  const [hud, setHud] = useState({ score: 0, combo: 0, best: 0, judge: "" });
  const [end, setEnd] = useState({ score: 0, notes: 0, max: 0, record: false, failed: false });
  const [board, setBoard] = useState<Board>();
  const [note, setNote] = useState("");
  const [sound, setSound] = useState(() => !audio.muted());
  const [offset, setOffsetState] = useState(() => { try { return Number(localStorage.getItem(OFFSET)) || 0; } catch { return 0; } });
  const offsetRef = useRef(offset);
  const toggleSound = () => setSound((on) => { audio.setMuted(on); return !on; });
  const custom = jam !== SONG;

  const choose = (j: Jam) => { jamRef.current = j; setJam(j); };
  const setDraft = (j: Jam) => { setDraftState(j); try { localStorage.setItem(DRAFT, encode(j)); } catch {} };
  // The audio calibration knob: some speakers and Bluetooth headphones lag; notes are judged that much later.
  const setOffset = (ms: number) => { offsetRef.current = ms; setOffsetState(ms); try { localStorage.setItem(OFFSET, String(ms)); } catch {} };
  const show = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => {
    audio.unlock();
    // M toggles the sound anywhere in the game (but not while typing).
    const mute = (e: KeyboardEvent) => { if (e.code === "KeyM" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) toggleSound(); };
    addEventListener("keydown", mute);
    return () => { removeEventListener("keydown", mute); audio.stop(); };
  }, []);

  useEffect(() => {
    dialog.current!.showModal();
    const el = canvas.current!, ctx = el.getContext("2d")!;
    let p: Play | null = null, t = 0, t0 = 0, best = 0, frame = 0, judge = "", shown = "";
    const held = [0, 0, 0], fingers = new Map<number, number>();
    track("game", "guitar");
    const load = () => getJamBoard(device()).then((b) => { best = Math.max(best, b.me.best); setBoard(b); setHud((h) => ({ ...h, best })); }).catch(() => {});
    load();
    // The song's clock is the audio clock, so a hit is judged against what the ear hears; with no audio, the page's clock.
    const now = () => (audio.clock() ?? (performance.now() - t0) / 1000) - offsetRef.current / 1000;

    function finish(p: Play) {
      audio.stop();
      const isCustom = jamRef.current !== SONG, done = p.over === "done", record = done && !isCustom && p.score > best;
      const notes = Math.round(((p.hits.perfect + p.hits.good) / p.notes.length) * 100);
      setEnd({ score: p.score, notes, max: p.max, record, failed: !done });
      track("score", "guitar", { score: p.score, notes, max: p.max, custom: isCustom });
      if (record) { best = p.score; submitJam(device(), p.score).then(load, () => {}); }
      if (done) setTimeout(record ? audio.sfx.record : audio.sfx.done, 300); else audio.sfx.fail();
      show("over");
    }

    function tick() {
      if (phaseRef.current === "playing" && p) {
        t = now();
        if (advance(p, t).length) { audio.sfx.miss(); judge = SAY.miss; }
        if (p.over) finish(p);
      }
      draw(ctx, p, t, held);
      const h = { score: p?.score ?? 0, combo: p?.combo ?? 0, best, judge };
      const k = JSON.stringify(h);
      if (k !== shown) { shown = k; setHud(h); }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const hit = (lane: number) => {
      held[lane] = 1;
      if (phaseRef.current !== "playing" || !p) return;
      const n = strum(p, lane, now());
      if (n) { audio.pluck(n.pitch, n.len * p.step * 0.95); judge = SAY[n.judge!]; }
      else audio.sfx.plec();
    };
    game.current = {
      start: () => {
        audio.unlock();
        p = fresh(jamRef.current); t = 0; judge = "";
        audio.play(jamRef.current);
        t0 = performance.now() + 50;
        show("playing");
        el.focus();
      },
      halt: () => { audio.stop(); p = null; t = 0; },
    };
    const press = (e: KeyboardEvent) => {
      if (phaseRef.current === "edit" || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const lane = KEYS[e.code];
      if (lane === undefined) {
        if (e.code === "Space" && (phaseRef.current === "ready" || phaseRef.current === "over") && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); game.current!.start(); }
        return;
      }
      e.preventDefault();
      if (!e.repeat) hit(lane);
    };
    const release = (e: KeyboardEvent) => { const lane = KEYS[e.code]; if (lane !== undefined) held[lane] = 0; };
    // Touch: each finger strums the string under it, so chords of two lanes work.
    const down = (e: PointerEvent) => {
      const lane = Math.min(2, Math.max(0, Math.floor((e.offsetX / el.clientWidth) * 3)));
      fingers.set(e.pointerId, lane);
      hit(lane);
    };
    const up = (e: PointerEvent) => { const lane = fingers.get(e.pointerId); fingers.delete(e.pointerId); if (lane !== undefined) held[lane] = 0; };
    // ponytail: leaving the tab ends the song instead of pausing it; resuming would need the song restarted mid-way.
    const hide = () => { if (document.hidden && phaseRef.current === "playing") { game.current!.halt(); show("ready"); } };
    addEventListener("keydown", press);
    addEventListener("keyup", release);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("keydown", press);
      removeEventListener("keyup", release);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  const edit = () => { game.current?.halt(); show("edit"); };
  const playDraft = () => { choose({ ...draft, title: cleanTitle(draft.title) || "Sem título" }); show("ready"); };
  const saveName = async (form: FormData) => {
    try {
      const name = await setJamName(device(), String(form.get("name")));
      setBoard(await getJamBoard(device()));
      setNote(`Salvo como ${name}.`);
    } catch {
      setNote("Não deu para salvar. Tenta de novo?");
    }
  };

  return (
    <dialog ref={dialog} className={`${room.room} ${run.room}`} aria-label="Solo de Strato" onClose={onClose} onPointerDown={audio.unlock}>
      <p className={`${room.hud} ${run.hud}`}>
        <span>{hud.score} pts</span>
        <span>Combo {hud.combo} · x{mult(hud.combo)}</span>
        {!custom && <span>Recorde {hud.best}</span>}
        {phase === "playing" && hud.judge && <span className={run.power}>{hud.judge}</span>}
        <button type="button" className={run.sound} aria-pressed={sound} onClick={toggleSound} title="Som (M)">{sound ? "♪ Som" : "♪ Mudo"}</button>
      </p>
      <div className={room.table}>
        {phase === "edit" && <Editor draft={draft} setDraft={setDraft} onPlay={playDraft} onBack={() => show("ready")} />}
        <div className={run.frame} hidden={phase === "edit"}>
          <canvas ref={canvas} className={`${room.court} ${run.track}`} width={W} height={H} tabIndex={-1}
            aria-label="Braço da guitarra: as notas descem pelas três cordas. A, S, D ou setas, ou toque na corda, quando a nota chegar na linha" />
          {phase !== "playing" && phase !== "edit" && (
            <div className={run.overlay}>
              {phase === "ready" && <>
                <p className={run.title}>{jam.title}</p>
                <p className={run.story}>{custom
                  ? "Uma música feita por um visitante, que chegou por link."
                  : "A Strato estava largada no chão, já plugada no amp. As notas descem pelo braço: toque a corda quando elas chegarem na linha."}</p>
                <button type="button" onClick={() => game.current?.start()}>Tocar</button>
                {custom && <button type="button" onClick={() => choose(SONG)}>Música oficial</button>}
                {custom && <button type="button" onClick={() => { setDraft(jam); edit(); }}>Editar uma cópia</button>}
                <button type="button" onClick={edit}>Criar música</button>
              </>}
              {phase === "over" && <>
                <p className={run.title}>{end.failed ? "O público vaiou" : "Fim da música"}</p>
                <p>{end.score} pontos · {end.notes}% das notas · combo {end.max}{end.record && <><br /><b className={run.record}>Novo recorde!</b></>}</p>
                <button type="button" onClick={() => game.current?.start()}>Tocar de novo</button>
                <button type="button" onClick={edit}>Criar música</button>
              </>}
            </div>
          )}
        </div>
        <aside className={room.board}>
          {custom ? <>
            <h2>Música de visitante</h2>
            <small>O placar só conta na música oficial. Esta música veio dentro do link, que guarda a música inteira: ela não fica salva neste site.</small>
          </> : <>
            <h2>Top 10</h2>
            <ol>
              {board?.top.map((p, i) => <li key={i}><span>{p.name}</span><span>{p.best}</span></li>)}
              {board && !board.top.length && <li>Ninguém ainda. Seja o primeiro!</li>}
            </ol>
            <form action={saveName}>
              <label htmlFor="jam-name">Seu nome no placar</label>
              <span>
                <input id="jam-name" name="name" required maxLength={20} defaultValue={board?.me.name ?? ""} key={board?.me.name ?? ""} autoComplete="nickname" />
                <button type="submit">Salvar</button>
              </span>
              {note && <small role="status">{note}</small>}
            </form>
            <small>Música completa conta para o recorde. Seu recorde melhora o selo do caderno: {JAM_TIERS[0]} pontos deixam ele {TIERS[1]}, {JAM_TIERS[1]} deixam ele {TIERS[2]}.</small>
          </>}
          <div className={styles.offset}>
            <span>Atraso do áudio</span>
            <span>
              <button type="button" onClick={() => setOffset(offset - 10)} aria-label="Menos atraso">−</button>
              <output>{offset} ms</output>
              <button type="button" onClick={() => setOffset(offset + 10)} aria-label="Mais atraso">+</button>
            </span>
            <small>Se os acertos parecem adiantados ou atrasados (fone bluetooth, por exemplo), ajuste aqui.</small>
          </div>
        </aside>
      </div>
      <p className={room.hint}>A S D ou ← ↓ → tocar as cordas · espaço começar · M som · no celular, toque na corda</p>
      <button type="button" className={room.back} onClick={() => dialog.current!.close()}>← Voltar à mesa</button>
    </dialog>
  );
}

// Easter egg: the Stratocaster on the floor (drawn in WebGL) gets an invisible button on top that opens the rhythm game.
// The desk camera dives down its neck first, and climbs back out when the game closes. A shared jam link (#jam=…) opens
// the game straight away with that song.
export default function GuitarHero() {
  const [open, setOpen] = useState<null | { shared: Jam | null }>(null);
  const guitar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const shared = decode(location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hash only exists in the browser, after hydration
    if (shared) setOpen({ shared });
  }, []);
  const close = () => {
    if (open?.shared) history.replaceState(null, "", location.pathname + location.search);
    else dive(guitar.current, "guitar", false);
    setOpen(null);
  };
  return (
    <>
      <button ref={guitar} type="button" className={styles.guitar} aria-label="Guitarra" onClick={() => { audio.unlock(); dive(guitar.current, "guitar", true, () => setOpen({ shared: null })); }} />
      {open && <Game shared={open.shared} onClose={close} />}
    </>
  );
}
