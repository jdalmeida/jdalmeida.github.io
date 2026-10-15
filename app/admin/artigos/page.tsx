import type { Metadata } from "next";
import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { Card, when } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Artigos · Admin", robots: { index: false, follow: false } };

type Post = { id: number; slug: string; title: string; published: boolean; published_at: string | null; updated_at: string; tags: string[]; reads: number; people: number };

export default async function Posts() {
  await requireAdmin();
  // Reads come from the visit log (article events), owner and hidden visitors left out.
  const posts = (await neon(process.env.DATABASE_URL!)`
    select p.id, p.slug, p.title, p.published, p.published_at, p.updated_at, p.tags,
      count(e.id)::int reads, count(distinct v.visitor)::int people
    from posts p
    left join visit_events e on e.type = 'article' and e.name = p.slug
    left join visits v on v.id = e.visit and v.visitor not in (select visitor from visitor_labels where hidden)
    group by p.id order by p.published, coalesce(p.published_at, p.updated_at) desc`) as Post[];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center">
        <h1 className="mr-auto text-xl font-semibold text-neutral-50">Artigos</h1>
        <Link href="/admin/artigos/novo" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Novo artigo</Link>
      </header>
      <Card title={`${posts.length} artigos`}>
        <ul className="divide-y divide-neutral-800 text-sm">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/artigos/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded px-2 py-3 hover:bg-neutral-800/40">
                <span className={`rounded px-1.5 py-0.5 text-xs ${p.published ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>{p.published ? "publicado" : "rascunho"}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-neutral-50">{p.title}</span>
                <span className="text-neutral-500">{p.tags.slice(0, 3).join(", ")}</span>
                <span className="tabular-nums text-neutral-400" title="leituras · pessoas">{p.reads} leituras · {p.people}p</span>
                <span className="w-32 text-right text-neutral-500">{p.published_at ? when(p.published_at) : `editado ${when(p.updated_at)}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
