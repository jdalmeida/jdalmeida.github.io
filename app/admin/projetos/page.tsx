import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import { Card, when } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { Project } from "@/lib/projects";
import { deleteProject, saveProject } from "./actions";

export const metadata: Metadata = { title: "Projetos · Admin", robots: { index: false, follow: false } };

type Row = Project & { position: number; published: boolean; updated_at: string };

const input = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500";

// Same form for a new project and for editing one (`p` given).
function ProjectForm({ p }: { p?: Row }) {
  return (
    <form action={saveProject} className="space-y-3 text-sm">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 md:grid-cols-[1fr_10rem_6rem]">
        <label className="flex flex-col gap-1 text-neutral-400">Nome
          <input name="name" required defaultValue={p?.name} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400">Ano
          <input name="year" defaultValue={p?.year ?? ""} placeholder="2026" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400">Ordem
          <input name="position" type="number" defaultValue={p?.position ?? 0} className={`${input} tabular-nums`} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-neutral-400">Descrição
        <textarea name="description" rows={3} defaultValue={p?.description} className={input} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-neutral-400">Tags (separadas por vírgula)
          <input name="tags" defaultValue={p?.tags.join(", ")} placeholder="Next.js, Go, Postgres" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400">Links (um por linha: Rótulo | https://…)
          <textarea name="links" rows={2} defaultValue={p?.links.map((l) => `${l.label} | ${l.href}`).join("\n")}
            placeholder={"Código | https://github.com/…\nVer online | https://…"} className={`${input} font-mono text-xs`} />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-neutral-200">
          <input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="accent-sky-500" /> Publicado
        </label>
        <button className="ml-auto rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500">{p ? "Salvar" : "Adicionar projeto"}</button>
      </div>
    </form>
  );
}

// Personal projects for the notebook's "Projetos" section.
export default async function Projects() {
  await requireAdmin();
  const rows = (await neon(process.env.DATABASE_URL!)`
    select id, name, year, description, tags, links, position, published, updated_at from projects order by position, id`) as Row[];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <h1 className="text-xl font-semibold text-neutral-50">Projetos</h1>
      <p className="text-xs text-neutral-500">
        Aparecem no caderno depois dos artigos, uma página por projeto, em ordem crescente de “Ordem”. Só os selos colados na contracapa andam junto quando a lista muda.
      </p>
      <Card title="Novo projeto">
        <ProjectForm />
      </Card>
      <Card title={`Seus projetos (${rows.length})`}>
        {rows.length ? (
          <ul className="divide-y divide-neutral-800 text-sm">
            {rows.map((p) => (
              <li key={p.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 rounded px-2 py-3 hover:bg-neutral-800/40">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${p.published ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>{p.published ? "publicado" : "oculto"}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-50">{p.name}</span>
                    <span className="text-neutral-500">{p.tags.slice(0, 3).join(", ")}</span>
                    <span className="w-32 text-right text-neutral-500">editado {when(p.updated_at)}</span>
                  </summary>
                  <div className="space-y-3 px-2 pb-4 pt-1">
                    <ProjectForm p={p} />
                    <form action={deleteProject} className="text-right">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs text-neutral-500 hover:text-red-400">Excluir projeto</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-neutral-500">Nenhum projeto ainda. Adicione um acima.</p>}
      </Card>
    </main>
  );
}
