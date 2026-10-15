"use client";

import { useState } from "react";
import { saveToken } from "@/app/admin/ff/actions";
import StampSticker from "@/components/ui/stamp";
import { DOODLE_NAMES, FINISHES, LABEL_MAX, PAPER_SWATCH, PAPERS, SHAPE_NAMES, SHAPES, type Look } from "@/lib/look";

const input = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-neutral-100 outline-none focus:border-sky-500";
const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs ${on ? "border-sky-500 bg-sky-500/10 text-sky-200" : "border-neutral-700 text-neutral-300 hover:border-neutral-500"}`;

export type TokenDraft = { id?: number; name: string; note: string; max_uses: number; look: Look };

// Designs the sticker a Family & Friends link gives, with a live preview. Choices left on "aleatório" come from the
// visitor's device, like a regular stamp; "Sortear" shows other outcomes.
export default function FFEditor({ initial, nextId, onDone }: { initial?: TokenDraft; nextId: number; onDone?: () => void }) {
  const [d, setD] = useState<TokenDraft>(initial ?? { name: "", note: "", max_uses: 1, look: { shape: "heart" } });
  const [seed, setSeed] = useState(() => (initial?.id ?? 1) * 7919);
  const look = (patch: Partial<Look>) => setD({ ...d, look: Object.fromEntries(Object.entries({ ...d.look, ...patch }).filter(([, v]) => v !== undefined && v !== "")) });
  const stamp = { id: nextId, seed, ff: true, country: "BR", face: null, x: null, y: null, date: new Date().toISOString(), best: 0, beans: null, look: d.look };

  return (
    <form action={async (f) => { await saveToken(f); if (!d.id) setD({ name: "", note: "", max_uses: 1, look: d.look }); onDone?.(); }}
      className="grid gap-6 text-sm lg:grid-cols-[1fr_260px]">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <input type="hidden" name="look" value={JSON.stringify(d.look)} />
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
          <label className="flex flex-col gap-1 text-neutral-400">Para quem<input name="name" required maxLength={60} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="ex.: Mãe, Ana, turma do Inovathon" className={input} /></label>
          <label className="flex flex-col gap-1 text-neutral-400">Nota<input name="note" maxLength={300} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="opcional" className={input} /></label>
          <label className="flex flex-col gap-1 text-neutral-400">Aparelhos<input name="max_uses" type="number" min={1} max={100} value={d.max_uses} onChange={(e) => setD({ ...d, max_uses: Number(e.target.value) })} className={input} /></label>
        </div>
        <fieldset className="space-y-2"><legend className="mb-1 text-neutral-400">Formato</legend>
          <div className="flex flex-wrap gap-2">{SHAPES.map((s) => <button key={s} type="button" className={chip((d.look.shape ?? "heart") === s)} onClick={() => look({ shape: s })}>{SHAPE_NAMES[s]}</button>)}</div>
        </fieldset>
        <fieldset className="space-y-2"><legend className="mb-1 text-neutral-400">Cor do papel</legend>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={chip(d.look.paper === undefined)} onClick={() => look({ paper: undefined })}>Aleatória</button>
            {PAPERS.map((p, i) => (
              <button key={p} type="button" title={p} aria-label={p} onClick={() => look({ paper: i })}
                className={`size-7 rounded-full border-2 ${d.look.paper === i ? "border-sky-400" : "border-neutral-700"}`} style={{ background: PAPER_SWATCH[i] }} />
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2"><legend className="mb-1 text-neutral-400">Desenho</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(d.look.doodle === undefined)} onClick={() => look({ doodle: undefined })}>Aleatório</button>
            {DOODLE_NAMES.map((n, i) => <button key={n} type="button" className={chip(d.look.doodle === i)} onClick={() => look({ doodle: i })}>{n}</button>)}
          </div>
        </fieldset>
        <fieldset className="space-y-2"><legend className="mb-1 text-neutral-400">Acabamento</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(d.look.tier === undefined)} onClick={() => look({ tier: undefined })}>Aleatório</button>
            {FINISHES.map((n, i) => <button key={n} type="button" className={chip(d.look.tier === i)} onClick={() => look({ tier: i as 0 | 1 | 2 })}>{n}</button>)}
          </div>
          <p className="text-xs text-neutral-500">Metálico e holográfico trocam a cor do papel pelo próprio brilho.</p>
        </fieldset>
        <label className="flex flex-col gap-1 text-neutral-400">Texto da faixa
          <input maxLength={LABEL_MAX} value={d.look.label ?? ""} onChange={(e) => look({ label: e.target.value.toUpperCase() || undefined })} placeholder="FAMILY & FRIENDS" className={`${input} uppercase`} />
        </label>
        <button className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500">{d.id ? "Salvar alterações" : "Criar link"}</button>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full max-w-[260px] rounded-xl bg-[#f4efe2] [aspect-ratio:1] [container-type:inline-size]">
          <StampSticker s={stamp} style={{ left: "50%", top: "50%", width: "70cqi" }} />
        </div>
        <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))} className="text-xs text-sky-400 hover:underline">Sortear o que está aleatório</button>
        <p className="text-center text-xs text-neutral-500">O número sai na hora em que a pessoa gera o selo.</p>
      </div>
    </form>
  );
}
