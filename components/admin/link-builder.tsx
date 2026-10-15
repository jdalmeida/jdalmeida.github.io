"use client";

import { useState } from "react";
import { saveLink } from "@/app/admin/links/actions";
import { linkUrl, PRESETS, slugify } from "@/lib/links";
import Copy from "./copy";

const input = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-neutral-100 outline-none focus:border-sky-500";

// Pick a channel, tweak, copy. Saving keeps it in the list below with its visits.
export default function LinkBuilder({ base, pages }: { base: string; pages: { path: string; title: string }[] }) {
  const [v, setV] = useState({ label: PRESETS[0].label, source: PRESETS[0].source, medium: PRESETS[0].medium, campaign: PRESETS[0].campaign, content: "", path: "/" });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  const url = linkUrl(base, { ...v, source: slugify(v.source), medium: slugify(v.medium), campaign: slugify(v.campaign), content: slugify(v.content) });
  return (
    <form action={async (f) => { await saveLink(f); }} className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => setV({ ...v, ...p })}
            className={`rounded-full border px-3 py-1 ${v.label === p.label ? "border-sky-500 bg-sky-500/10 text-sky-200" : "border-neutral-700 text-neutral-300 hover:border-neutral-500"}`}>{p.label}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-neutral-400">Nome (só para você)<input name="label" required value={v.label} onChange={set("label")} className={input} /></label>
        <label className="flex flex-col gap-1 text-neutral-400">Página<select name="path" value={v.path} onChange={set("path")} className={input}>
          {pages.map((p) => <option key={p.path} value={p.path}>{p.title}</option>)}
        </select></label>
        <label className="flex flex-col gap-1 text-neutral-400">Origem (utm_source)<input name="source" required value={v.source} onChange={set("source")} className={input} /></label>
        <label className="flex flex-col gap-1 text-neutral-400">Meio (utm_medium)<input name="medium" value={v.medium} onChange={set("medium")} className={input} /></label>
        <label className="flex flex-col gap-1 text-neutral-400">Campanha (utm_campaign)<input name="campaign" required value={v.campaign} onChange={set("campaign")} className={input} /></label>
        <label className="flex flex-col gap-1 text-neutral-400">Variação (utm_content, opcional)<input name="content" value={v.content} onChange={set("content")} placeholder="ex.: story-1, outubro" className={input} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
        <code className="min-w-0 flex-1 break-all text-sky-300">{url}</code>
        <Copy text={url} />
        <button className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500">Salvar na lista</button>
      </div>
    </form>
  );
}
