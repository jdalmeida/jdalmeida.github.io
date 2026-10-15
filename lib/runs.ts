"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { deviceSeed } from "./device";

// Corrida na Mesa leaderboard. Table: see lib/stamps.sql (`runs`), keyed by the same device seed as the stamps.
// ponytail: the score is client-reported, like the paper toss; same cap-and-rate-limit upgrade path if the board gets spammed.
const sql = () => neon(process.env.DATABASE_URL!);

// Only raises the best; called when a run ends past the known record.
export async function submitRun(device: string, score: number) {
  const seed = await deviceSeed(device);
  if (!Number.isInteger(score) || score < 1 || score > 200000) throw new Error("Pontuação inválida");
  await sql()`
    insert into runs (seed, best) values (${seed}, ${score})
    on conflict (seed) do update set best = excluded.best, updated_at = now() where runs.best < excluded.best`;
  revalidatePath("/");
}

export async function setRunName(device: string, name: string) {
  const seed = await deviceSeed(device);
  const clean = typeof name === "string" ? name.replace(/[\p{C}]/gu, "").trim().slice(0, 20) : "";
  if (!clean) throw new Error("Nome inválido");
  await sql()`insert into runs (seed, name) values (${seed}, ${clean}) on conflict (seed) do update set name = excluded.name`;
  return clean;
}

// Top 10 named runners, plus this device's own row. Its name falls back to the one it gave the paper toss, to prefill the form.
export async function getRunBoard(device: string) {
  const seed = await deviceSeed(device);
  const [top, [me]] = await Promise.all([
    sql()`select name, best from runs where name is not null and best > 0 order by best desc, updated_at limit 10`,
    sql()`select coalesce(r.name, s.name) as name, coalesce(r.best, 0) as best
      from (select ${seed}::int as seed) d left join runs r using (seed) left join scores s using (seed)`,
  ]);
  return { top: top as { name: string; best: number }[], me: (me ?? { name: null, best: 0 }) as { name: string | null; best: number } };
}
