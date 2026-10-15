import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";
import Copy from "@/components/admin/copy";
import LinkBuilder from "@/components/admin/link-builder";
import { Card, when } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { getArticles } from "@/lib/articles";
import { linkUrl } from "@/lib/links";
import { deleteLink } from "./actions";

export const metadata: Metadata = { title: "Links · Admin", robots: { index: false, follow: false } };

type Row = { id: number; label: string; source: string; medium: string | null; campaign: string; content: string | null; path: string; created_at: string; visits: number; people: number; last_at: string | null };

// Tracked links and how each one is doing (all time, hidden visitors left out).
export default async function Links() {
  await requireAdmin();
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const [rows, articles] = await Promise.all([
    neon(process.env.DATABASE_URL!)`
      select l.*, count(v.id)::int visits, count(distinct v.visitor)::int people, max(v.started_at) last_at
      from campaign_links l left join visits v on v.source = l.source and v.utm_campaign = l.campaign
        and (l.content is null or v.utm_content = l.content)
        and v.visitor not in (select visitor from visitor_labels where hidden)
      group by l.id order by l.created_at desc`.then((r) => r as Row[]),
    getArticles().catch(() => []),
  ]);
  const pages = [{ path: "/", title: "Início (a mesa)" }, ...articles.map((a) => ({ path: `/blog/${a.slug}`, title: `Artigo: ${a.title}` }))];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <h1 className="text-xl font-semibold text-neutral-50">Links rastreados</h1>
      <Card title="Criar link">
        <LinkBuilder base={base} pages={pages} />
      </Card>
      <Card title={`Seus links (${rows.length})`}>
        {rows.length ? (
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-neutral-500">
                <tr>{["Link", "Origem / campanha", "Visitas", "Pessoas", "Última visita", ""].map((t) => <th key={t} className="px-4 py-2 font-medium">{t}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {rows.map((l) => {
                  const url = linkUrl(base, l);
                  return (
                    <tr key={l.id}>
                      <td className="px-4 py-2"><b className="font-medium text-neutral-50">{l.label}</b><div className="max-w-md truncate text-xs text-neutral-500" title={url}>{url}</div></td>
                      <td className="px-4 py-2 text-neutral-400">{l.source} · {l.campaign}{l.content && ` · ${l.content}`}</td>
                      <td className="px-4 py-2 tabular-nums">{l.visits}</td>
                      <td className="px-4 py-2 tabular-nums">{l.people}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-neutral-400">{l.last_at ? when(l.last_at) : "—"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Copy text={url} />
                          <form action={deleteLink}><input type="hidden" name="id" value={l.id} /><button className="text-xs text-neutral-500 hover:text-red-400">Excluir</button></form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-neutral-500">Nenhum link salvo ainda. Crie um acima e use no lugar do link puro.</p>}
      </Card>
    </main>
  );
}
