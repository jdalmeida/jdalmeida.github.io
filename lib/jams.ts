"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { deviceSeed } from "./device";

// Solo de Strato leaderboard, official song only. Table: see lib/stamps.sql (`jams`), keyed by the same device seed as the stamps.
// ponytail: the score is client-reported, like the paper toss; same cap-and-rate-limit upgrade path if the board gets spammed.
const sql = () => neon(process.env.DATABASE_URL!);

// Only raises the best; called when a song ends past the known record. 34300 is every note of the song perfect.
export async function submitJam(device: string, score: number) {
  const seed = await deviceSeed(device);
  if (!Number.isInteger(score) || score < 1 || score > 34300) throw new Error("Pontuação inválida");
  await sql()`
    insert into jams (seed, best) values (${seed}, ${score})
    on conflict (seed) do update set best = excluded.best, updated_at = now() where jams.best < excluded.best`;
  revalidatePath("/");
}

export async function setJamName(device: string, name: string) {
  const seed = await deviceSeed(device);
  const clean = typeof name === "string" ? name.replace(/[\p{C}]/gu, "").trim().slice(0, 20) : "";
  if (!clean) throw new Error("Nome inválido");
  await sql()`insert into jams (seed, name) values (${seed}, ${clean}) on conflict (seed) do update set name = excluded.name`;
  return clean;
}

// Top 10 named players, plus this device's own row. Its name falls back to the one it gave another game, to prefill the form.
export async function getJamBoard(device: string) {
  const seed = await deviceSeed(device);
  const [top, [me]] = await Promise.all([
    sql()`select name, best from jams where name is not null and best > 0 order by best desc, updated_at limit 10`,
    sql()`select coalesce(j.name, r.name, s.name) as name, coalesce(j.best, 0) as best
      from (select ${seed}::int as seed) d left join jams j using (seed) left join runs r using (seed) left join scores s using (seed)`,
  ]);
  return { top: top as { name: string; best: number }[], me: (me ?? { name: null, best: 0 }) as { name: string | null; best: number } };
}
