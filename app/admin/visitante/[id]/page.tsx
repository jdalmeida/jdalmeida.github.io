import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NoTrack from "@/components/admin/no-track";
import { Card, duration, flag, when } from "@/components/admin/ui";
import { STAGES } from "@/components/ui/platformer";
import { isAdmin } from "@/lib/admin";
import { describe, stampNo, visitor } from "@/lib/analytics";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "Visitante · Admin", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOT: Record<string, string> = { game: "bg-emerald-400", stage: "bg-emerald-400", won: "bg-emerald-400", score: "bg-emerald-400", stamp: "bg-amber-400", article: "bg-sky-400", share: "bg-sky-400" };

// One browser's journey: every visit with where it came from, and what it did, linked to its stamps and games.
export default async function Visitor({ params }: PageProps<"/admin/visitante/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [data, titles] = await Promise.all([
    visitor(id),
    getArticles().then((a) => Object.fromEntries(a.map((x) => [x.slug, x.title])), () => ({} as Record<string, string>)),
  ]);
  if (!data) notFound();
  const first = data.visits[data.visits.length - 1];

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-200 sm:px-8">
      <NoTrack />
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <Link href="/admin" className="text-sm text-sky-400 hover:underline">← Analytics</Link>
          <h1 className="mt-2 text-xl font-semibold text-neutral-50">Visitante <span className="font-mono text-base text-neutral-400">{id.slice(0, 8)}</span></h1>
          <p className="text-sm text-neutral-400">
            {data.visits.length} {data.visits.length === 1 ? "visita" : "visitas"} · primeira em {when(first.started_at as string)} vindo de <b className="text-neutral-200">{first.source as string}</b>
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <Card title="Selos">
            {data.stamps.length ? (
              <ul className="space-y-1 text-sm">
                {data.stamps.map((s) => (
                  <li key={s.id}>
                    <b className="text-neutral-50">{stampNo(s.id)}</b>{" "}
                    <span className="text-neutral-400">
                      {s.beans !== null ? `do Conde (${s.beans}% dos grãos)` : "de visitante"}{s.ff && " · F&F"} · {s.face === null ? "ainda não colado" : `colado na página ${s.face}`} · {when(s.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-neutral-500">Não gerou selo.</p>}
          </Card>
          <Card title="Basquete de papel">
            {data.scores.length ? data.scores.map((s, i) => (
              <p key={i} className="text-sm">Recorde <b className="text-neutral-50">{s.best}</b>{s.name && <> como <b className="text-neutral-50">{s.name}</b></>} <span className="text-neutral-500">· {when(s.updated_at)}</span></p>
            )) : <p className="text-sm text-neutral-500">Sem placar.</p>}
          </Card>
          <Card title="Castelo do Café">
            {data.castle.length ? data.castle.map((c, i) => (
              <p key={i} className="text-sm">
                <b className="text-neutral-50">{c.cleared}/{STAGES.length}</b> fases vencidas
                {c.best.length > 0 && <span className="text-neutral-400"> · grãos por fase: {c.best.join(", ")}</span>}
              </p>
            )) : <p className="text-sm text-neutral-500">Não abriu o castelo.</p>}
          </Card>
        </div>

        {data.visits.map((v) => (
          <Card key={v.id as string} title={`${when(v.started_at as string)} · ${duration((new Date(v.last_at as string).getTime() - new Date(v.started_at as string).getTime()) / 1000)}`}>
            <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              {([
                ["Origem", v.source], ["Referência", v.referrer], ["Campanha", [v.utm_campaign, v.utm_medium, v.utm_content, v.utm_term].filter(Boolean).join(" · ")],
                ["Entrada", v.landing], ["Local", [v.city, v.region].filter(Boolean).join(", ") + (v.country ? ` ${flag(v.country as string)}` : "")],
                ["Dispositivo", [v.device_type, v.browser, v.os].filter(Boolean).join(" · ")], ["Tela", v.screen], ["Idioma", v.language],
                ["Family & Friends", v.ff ? "sim" : null],
              ] as [string, unknown][]).filter(([, value]) => value).map(([k, value]) => (
                <div key={k} className="min-w-0"><dt className="text-xs text-neutral-500">{k}</dt><dd className="truncate" title={String(value)}>{String(value)}</dd></div>
              ))}
            </dl>
            <ol className="space-y-1 border-l border-neutral-800 pl-4 text-sm">
              {v.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[21px] top-1.5 size-2 rounded-full ${DOT[e.type as string] ?? "bg-neutral-600"}`} aria-hidden />
                  <span className="mr-2 tabular-nums text-neutral-500">{new Date(e.at as string).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                  <span className={e.type === "show" || e.type === "hide" ? "text-neutral-500" : ""}>
                    {describe(e as { type: string; name: string | null; detail: Record<string, unknown> | null }, titles)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </main>
  );
}
