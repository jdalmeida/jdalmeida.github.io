import type { Metadata } from "next";
import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { Card, when } from "@/components/admin/ui";
import StampSticker from "@/components/ui/stamp";
import { pad, TIERS, tier } from "@/lib/stamp-meta";
import { requireAdmin } from "@/lib/admin";
import { getArticles } from "@/lib/articles";
import { faceCount, faceName } from "@/lib/faces";
import { cleanLook } from "@/lib/look";
import type { Stamp } from "@/lib/stamps";
import { deleteStamp, moveStamp, unstickStamp } from "./actions";

export const metadata: Metadata = { title: "Selos · Admin", robots: { index: false, follow: false } };

const FILTERS = { todos: "Todos", visitante: "Visitante", ff: "Family & Friends", conde: "Conde", soltos: "Não colados" } as const;
type Row = Record<string, unknown>;
const input = "w-16 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-neutral-100";

// Every stamp in the guestbook, with where it's stuck and whose device it belongs to; unstick, move or delete.
export default async function Stamps({ searchParams }: PageProps<"/admin/selos">) {
  await requireAdmin();
  const f = String((await searchParams).f ?? "todos") as keyof typeof FILTERS;
  const [rows, articles] = await Promise.all([
    neon(process.env.DATABASE_URL!)`
      select s.*, sc.best, sc.name as player, t.name as token_name, v.visitor, l.name as visitor_name
      from stamps s
      left join scores sc on sc.seed = s.seed
      left join ff_tokens t on t.id = s.ff_token
      left join lateral (select visitor from visits where seed = s.seed or count_seed = s.seed order by started_at desc limit 1) v on true
      left join visitor_labels l on l.visitor = v.visitor
      order by s.id desc` as unknown as Promise<Row[]>,
    getArticles().catch(() => []),
  ]);
  const titles = articles.map((a) => a.title);
  const stamps = rows.map((r) => ({
    r, s: {
      id: r.id as number, seed: r.seed as number, ff: r.ff as boolean, country: r.country as string | null, face: r.face as number | null,
      x: r.x as number | null, y: r.y as number | null, date: new Date(r.created_at as string).toISOString(), best: (r.best as number | null) ?? 0,
      beans: r.beans as number | null, look: r.look ? cleanLook(r.look) : null,
    } satisfies Stamp,
  })).filter(({ s }) => f === "ff" ? s.ff : f === "conde" ? s.beans !== null : f === "visitante" ? !s.ff && s.beans === null : f === "soltos" ? s.face === null : true);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-neutral-50">Selos ({rows.length})</h1>
        <nav className="flex flex-wrap rounded-lg border border-neutral-800 p-0.5 text-sm">
          {Object.entries(FILTERS).map(([k, label]) => (
            <Link key={k} href={`/admin/selos?f=${k}`} className={`rounded-md px-3 py-1 ${k === f ? "bg-neutral-800 text-neutral-50" : "text-neutral-400 hover:text-neutral-200"}`}>{label}</Link>
          ))}
        </nav>
      </header>
      <Card title="Moderação">
        <p className="mb-4 text-sm text-neutral-500">
          Descolar devolve o selo para a pessoa (ela pode colar de novo). Excluir apaga de vez: o aparelho pode gerar outro, com outro número.
          Posição: x e y em % da página (y passa de 100 em páginas longas).
        </p>
        <ul className="divide-y divide-neutral-800">
          {stamps.map(({ r, s }) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 py-3">
              <div className="relative size-20 shrink-0 [container-type:inline-size]">
                <StampSticker s={s} style={{ left: "50%", top: "50%", width: "100%" }} />
              </div>
              <div className="min-w-56 flex-1 text-sm">
                <p className="font-medium text-neutral-50">
                  {pad(s.id)} · {s.beans !== null ? `Conde (${s.beans}% dos grãos)` : s.ff ? `Family & Friends${r.token_name ? ` · ${r.token_name}` : ""}` : `Visitante · ${TIERS[tier(s)]}`}
                </p>
                <p className="text-neutral-400">
                  {s.country ?? "??"} · {when(s.date)} · <span className={s.face === null ? "text-amber-300" : ""}>{faceName(s.face, titles)}</span>
                  {s.face !== null && <span className="text-neutral-600"> ({Math.round(s.x!)}%, {Math.round(s.y!)}%)</span>}
                </p>
                <p className="text-neutral-500">
                  {r.visitor ? <Link className="text-sky-400 hover:underline" href={`/admin/visitante/${r.visitor}`}>{(r.visitor_name as string) ?? `visitante ${(r.visitor as string).slice(0, 8)}`}</Link> : "sem visita registrada"}
                  {s.best > 0 && <> · basquete {s.best}{r.player ? ` (${r.player})` : ""}</>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <form action={moveStamp} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={s.id} />
                  <select name="face" defaultValue={s.face ?? 3} className="max-w-40 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-neutral-100">
                    {Array.from({ length: faceCount(titles.length) }, (_, i) => <option key={i} value={i}>{i} · {faceName(i, titles)}</option>)}
                  </select>
                  <input name="x" type="number" min={0} max={100} step="any" defaultValue={s.x ?? 50} aria-label="x (%)" className={input} />
                  <input name="y" type="number" min={0} max={5000} step="any" defaultValue={s.y ?? 50} aria-label="y (%)" className={input} />
                  <button className="rounded border border-neutral-700 px-2 py-0.5 text-neutral-300 hover:border-sky-500">{s.face === null ? "Colar" : "Mover"}</button>
                </form>
                {s.face !== null && (
                  <form action={unstickStamp}><input type="hidden" name="id" value={s.id} />
                    <button className="rounded border border-neutral-700 px-2 py-0.5 text-neutral-300 hover:border-amber-400">Descolar</button></form>
                )}
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded border border-neutral-700 px-2 py-0.5 text-neutral-400 hover:border-red-500 hover:text-red-400">Excluir</summary>
                  <form action={deleteStamp} className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-lg">
                    <input type="hidden" name="id" value={s.id} />
                    <p className="mb-2 text-neutral-300">Apagar {pad(s.id)} de vez?</p>
                    <button className="w-full rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-500">Sim, excluir</button>
                  </form>
                </details>
              </div>
            </li>
          ))}
          {!stamps.length && <li className="py-6 text-center text-sm text-neutral-500">Nenhum selo aqui.</li>}
        </ul>
      </Card>
    </main>
  );
}
