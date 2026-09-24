"use server";

import { neon } from "@neondatabase/serverless";
import { validProgress, type Progress } from "@/components/ui/platformer";

// Table: see lib/stamps.sql. The key is a random UUID from the visitor's localStorage, so progress follows the browser, not the device.
// ponytail: progress is client-reported and can be faked; harmless while it only unlocks stages (add checks if it ever feeds a leaderboard).
const sql = () => neon(process.env.DATABASE_URL!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checkKey = (key: unknown) => { if (typeof key !== "string" || !UUID.test(key)) throw new Error("Chave inválida"); return key; };

export async function loadCastle(key: string): Promise<Progress> {
  const [row] = await sql()`select cleared, best from castle where key = ${checkKey(key)}`;
  return row ? { cleared: row.cleared, best: row.best } : { cleared: 0, best: [] };
}

// Merges in SQL too, so an older tab can't roll progress back.
export async function saveCastle(key: string, progress: Progress) {
  if (!validProgress(progress)) throw new Error("Progresso inválido");
  await sql()`
    insert into castle (key, cleared, best) values (${checkKey(key)}, ${progress.cleared}, ${progress.best})
    on conflict (key) do update set
      cleared = greatest(castle.cleared, excluded.cleared),
      best = array(select greatest(a, b) from unnest(castle.best, excluded.best) with ordinality as t(a, b, i) order by i),
      updated_at = now()`;
}
