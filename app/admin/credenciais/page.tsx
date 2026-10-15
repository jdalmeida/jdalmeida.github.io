import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import CredentialEditor, { type CredentialDraft } from "@/components/admin/credential-editor";
import { Card, when } from "@/components/admin/ui";
import CredentialBadge from "@/components/ui/credential-badge";
import { requireAdmin } from "@/lib/admin";
import { deleteCredential } from "./actions";

export const metadata: Metadata = { title: "Credenciais · Admin", robots: { index: false, follow: false } };

type Row = CredentialDraft & { id: string; updated_at: string };

// Event credentials: the badge pile on the desk and the evidence board each one opens.
export default async function Credentials() {
  await requireAdmin();
  let rows: Row[] | null;
  try {
    rows = (await neon(process.env.DATABASE_URL!)`
      select id, name, year, location, place, role, number, color, dark_color "darkColor", note, images, position, published, updated_at
      from credentials order by position, created_at`) as Row[];
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") throw e;
    rows = null;
  }

  if (!rows) return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <h1 className="text-xl font-semibold text-neutral-50">Credenciais</h1>
      <Card title="Falta criar a tabela">
        <p className="text-sm text-neutral-400">Rode <code className="text-neutral-200">lib/credentials.sql</code> no banco Neon. Ele cria as tabelas e importa as credenciais que hoje estão em <code className="text-neutral-200">lib/events.json</code>.</p>
      </Card>
    </main>
  );

  const next = rows.reduce((max, r) => Math.max(max, Number(r.number.replace(/\D/g, "")) || 0), 0) + 1;
  const blank: CredentialDraft = {
    name: "", year: String(new Date().getFullYear()), location: "", place: "", role: "", number: `Nº ${String(next).padStart(3, "0")}`,
    color: "#153df5", darkColor: "#0a1f8a", note: "", images: [], position: Math.max(0, ...rows.map((r) => r.position)) + 1, published: true,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <h1 className="text-xl font-semibold text-neutral-50">Credenciais</h1>
      <p className="text-xs text-neutral-500">
        Ficam empilhadas na mesa em ordem crescente de “Ordem”; clicar em uma abre o quadro do evento com a descrição, as duas fotos e a ficha do caso.
      </p>
      <Card title="Nova credencial">
        <CredentialEditor initial={blank} />
      </Card>
      <Card title={`Suas credenciais (${rows.length})`}>
        {rows.length ? (
          <ul className="divide-y divide-neutral-800 text-sm">
            {rows.map((c) => (
              <li key={c.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 rounded px-2 py-3 hover:bg-neutral-800/40">
                    <CredentialBadge event={c} className="w-7 shrink-0 rounded-sm" />
                    <span className={`rounded px-1.5 py-0.5 text-xs ${c.published ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}>{c.published ? "publicada" : "oculta"}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-50">{c.name}</span>
                    <span className="text-neutral-500">{c.year} · {c.images.length} foto{c.images.length === 1 ? "" : "s"}</span>
                    <span className="w-32 text-right text-neutral-500">editada {when(c.updated_at)}</span>
                  </summary>
                  <div className="space-y-3 px-2 pb-4 pt-1">
                    <CredentialEditor key={c.updated_at} initial={c} />
                    <form action={deleteCredential} className="text-right">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-neutral-500 hover:text-red-400">Excluir credencial</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-neutral-500">Nenhuma credencial ainda. Adicione uma acima.</p>}
      </Card>
    </main>
  );
}
