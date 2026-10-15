import type { Metadata } from "next";
import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";
import Copy from "@/components/admin/copy";
import FFEditor from "@/components/admin/ff-editor";
import { Card, when } from "@/components/admin/ui";
import StampSticker from "@/components/ui/stamp";
import { requireAdmin } from "@/lib/admin";
import { cleanLook } from "@/lib/look";
import { pad } from "@/lib/stamp-meta";
import { setRevoked } from "./actions";

export const metadata: Metadata = { title: "Family & Friends · Admin", robots: { index: false, follow: false } };

type Token = { id: number; token: string; name: string; note: string | null; look: unknown; max_uses: number; revoked: boolean; created_at: string; stamps: { id: number; face: number | null }[] | null };

// One link per person, each giving a sticker designed here. The old shared FF_TOKEN link keeps working.
export default async function FamilyFriends() {
  await requireAdmin();
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const sql = neon(process.env.DATABASE_URL!);
  const [tokens, [{ next }]] = await Promise.all([
    sql`select t.*, (select json_agg(json_build_object('id', s.id, 'face', s.face) order by s.id) from stamps s where s.ff_token = t.id) stamps
      from ff_tokens t order by t.revoked, t.created_at desc`.then((r) => r as Token[]),
    sql`select coalesce(max(id), 0) + 1 as next from stamps`.then((r) => r as { next: number }[]),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <h1 className="text-xl font-semibold text-neutral-50">Family &amp; Friends</h1>
      <Card title="Criar link">
        <FFEditor nextId={next} />
      </Card>
      <Card title={`Links (${tokens.length})`}>
        <ul className="divide-y divide-neutral-800">
          {tokens.map((t) => {
            const look = cleanLook(t.look), url = `${base}/?ff=${t.token}`, used = t.stamps?.length ?? 0;
            return (
              <li key={t.id} className={`py-4 ${t.revoked ? "opacity-50" : ""}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative size-20 shrink-0 [container-type:inline-size]">
                    <StampSticker s={{ id: t.stamps?.[0]?.id ?? next, seed: t.id * 7919, ff: true, country: "BR", face: null, x: null, y: null, date: t.created_at, best: 0, beans: null, look }}
                      style={{ left: "50%", top: "50%", width: "100%" }} />
                  </div>
                  <div className="min-w-56 flex-1 text-sm">
                    <p className="font-medium text-neutral-50">{t.name}{t.revoked && <span className="ml-2 text-xs font-normal text-red-400">revogado</span>}</p>
                    {t.note && <p className="text-neutral-400">{t.note}</p>}
                    <p className="text-neutral-500">
                      Usado em {used}/{t.max_uses} {t.max_uses === 1 ? "aparelho" : "aparelhos"} · criado {when(t.created_at)}
                      {used > 0 && <> · {t.stamps!.map((s) => `${pad(s.id)}${s.face === null ? " (não colado)" : ""}`).join(", ")}</>}
                    </p>
                    <code className="mt-1 block break-all text-xs text-sky-300">{url}</code>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Copy text={url} label="Copiar link" />
                    <form action={setRevoked}>
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="revoked" value={t.revoked ? "0" : "1"} />
                      <button className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:border-red-500">{t.revoked ? "Reativar" : "Revogar"}</button>
                    </form>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-sky-400 hover:underline">Editar</summary>
                  <div className="mt-3 rounded-lg border border-neutral-800 p-4">
                    <FFEditor nextId={next} initial={{ id: t.id, name: t.name, note: t.note ?? "", max_uses: t.max_uses, look }} />
                    <p className="mt-3 text-xs text-neutral-500">Mudanças valem para quem ainda vai usar o link; selos já gerados mantêm o desenho que receberam.</p>
                  </div>
                </details>
              </li>
            );
          })}
          {!tokens.length && <li className="py-6 text-center text-sm text-neutral-500">Nenhum link ainda.</li>}
        </ul>
      </Card>
    </main>
  );
}
