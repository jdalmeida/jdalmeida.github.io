import Link from "next/link";
import type { ReactNode } from "react";
import type { Count } from "@/lib/analytics";

// Small server-rendered pieces of the /admin dashboard. One hue (sky) for every magnitude bar; text stays in neutral ink.

export const duration = (s: number) => s < 60 ? `${Math.round(s)}s` : s < 3600 ? `${Math.floor(s / 60)}min ${Math.round(s % 60)}s` : `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}min`;
export const flag = (c: string | null) => c && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((l) => 0x1f1a5 + l.charCodeAt(0))) + " " + c : c ?? "—";
export const when = (d: string | Date) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">{title}</h2>
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-neutral-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

// Ranked list with a thin bar per row; `href` turns a row into a filter link.
export function BarList({ rows, label = (l) => l ?? "—", href, empty = "Nada ainda." }: {
  rows: Count[]; label?: (l: string | null) => ReactNode; href?: (l: string | null) => string; empty?: string;
}) {
  if (!rows.length) return <p className="text-sm text-neutral-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <ul className="space-y-1.5 text-sm">
      {rows.map((r) => {
        const body = (
          <>
            <span className="absolute inset-y-0 left-0 rounded bg-sky-500/20" style={{ width: `${(r.n / max) * 100}%` }} aria-hidden />
            <span className="relative truncate text-neutral-200">{label(r.label)}</span>
            <span className="relative ml-auto shrink-0 tabular-nums text-neutral-400" title={`${r.n} no total, ${r.people} pessoas`}>
              {r.n}<span className="text-neutral-600"> · {r.people}p</span>
            </span>
          </>
        );
        const cls = "relative flex items-center gap-3 rounded px-2 py-1";
        return <li key={r.label ?? "∅"}>{href ? <Link href={href(r.label)} className={`${cls} hover:bg-neutral-800`}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
      })}
    </ul>
  );
}

// Visits per day (single series): bars anchored to the baseline, hover shows the day's numbers.
export function DailyChart({ days }: { days: { day: string; n: number; people: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  const label = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return (
    <div>
      <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Visitas por dia">
        {days.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t-[4px] bg-sky-500 transition-opacity group-hover:opacity-80" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 2 : 0 }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 shadow group-hover:block">
              {label(d.day)}: <b>{d.n}</b> visitas · {d.people} pessoas
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between border-t border-neutral-800 pt-1 text-xs text-neutral-500">
        <span>{label(days[0].day)}</span><span>max {max}</span><span>{label(days[days.length - 1].day)}</span>
      </div>
    </div>
  );
}

// Steps as bars against the first one; the small number is the share that made it from the previous step.
export function Funnel({ steps }: { steps: { label: string; n: number }[] }) {
  const top = Math.max(1, steps[0]?.n ?? 0);
  return (
    <ol className="space-y-2 text-sm">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.n;
        return (
          <li key={s.label} className="grid grid-cols-[9rem_1fr_6.5rem] items-center gap-3 sm:grid-cols-[12rem_1fr_7rem]">
            <span className="truncate text-neutral-300">{s.label}</span>
            <span className="h-6 rounded bg-neutral-800/60" title={`${s.n} pessoas`}>
              <span className="block h-full rounded bg-sky-500" style={{ width: `${(s.n / top) * 100}%`, minWidth: s.n ? 4 : 0 }} />
            </span>
            <span className="text-right tabular-nums text-neutral-200">
              {s.n} <span className="text-neutral-500">· {Math.round((s.n / top) * 100)}%</span>
              {i > 0 && <span className="block text-xs text-neutral-500">{prev ? `${Math.round((s.n / prev) * 100)}% da etapa anterior` : "—"}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
