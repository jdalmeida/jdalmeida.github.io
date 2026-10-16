"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { deviceSeed } from "./device";
import { cleanLook, type Look } from "./look";

// Tables: see lib/stamps.sql. `id` is the visitor number; look (shape, colours, rarity) comes from `seed`, rarity can be raised by `best`.
// `run` is the Corrida na Mesa best and `jam` the Solo de Strato best, which can raise rarity too.
// `beans` is set only on the Count D'arábica stamp, and sets its rarity.
export type Stamp = { id: number; seed: number; ff: boolean; country: string | null; face: number | null; x: number | null; y: number | null; date: string; best: number; beans: number | null; run?: number; jam?: number; look?: Look | null };

const sql = () => neon(process.env.DATABASE_URL!);
const toStamp = (r: Record<string, unknown>): Stamp => ({
  id: r.id as number, seed: r.seed as number, ff: r.ff as boolean, country: r.country as string | null,
  face: r.face as number | null, x: r.x as number | null, y: r.y as number | null, date: new Date(r.created_at as string).toISOString(),
  best: (r.best as number | null) ?? 0, run: (r.run as number | null | undefined) ?? 0, jam: (r.jam as number | null | undefined) ?? 0, beans: (r.beans as number | null | undefined) ?? null, // undefined before the migration adds the column
  look: r.look ? cleanLook(r.look) : null,
});

export async function getStamps() {
  return (await sql()`select stamps.*, scores.best, runs.best as run, jams.best as jam from stamps left join scores using (seed) left join runs using (seed) left join jams using (seed) where face is not null order by id`).map(toStamp);
}

// One stamp per device: generating again returns the same row. A Family & Friends link upgrades a stamp that isn't stuck yet.
// Links come from /admin (ff_tokens, each with its sticker design and a number of devices it serves) or the old shared FF_TOKEN.
export async function generateStamp(device: string, ff: string) {
  const seed = await deviceSeed(device);
  // This device's own earlier redemption doesn't count against the token, so generating again still works.
  const [token] = typeof ff === "string" && ff && ff.length <= 64 ? await sql()`
    select id, look from ff_tokens t where token = ${ff} and not revoked
      and (select count(*) from stamps where ff_token = t.id and seed <> ${seed}) < max_uses` : [];
  const isFF = !!token || (!!process.env.FF_TOKEN && ff === process.env.FF_TOKEN);
  const country = (await headers()).get("x-vercel-ip-country") ?? "";
  const [row] = await sql()`
    insert into stamps (seed, ff, country, ff_token, look)
    values (${seed}, ${isFF}, ${/^[A-Z]{2}$/.test(country) ? country : null}, ${token?.id ?? null}, ${token ? JSON.stringify(token.look) : null}::jsonb)
    on conflict (seed) do update set ff = stamps.ff or (stamps.face is null and excluded.ff),
      ff_token = case when stamps.face is null and excluded.ff_token is not null then excluded.ff_token else stamps.ff_token end,
      look = case when stamps.face is null and excluded.ff_token is not null then excluded.look else stamps.look end
    returning *, (select best from scores where scores.seed = stamps.seed) as best, (select best from runs where runs.seed = stamps.seed) as run, (select best from jams where jams.seed = stamps.seed) as jam`;
  return toStamp(row);
}

// Stickers don't peel: a position is set once.
export async function placeStamp(device: string, face: number, x: number, y: number, count = false) {
  const seed = await deviceSeed(device, count ? "conde" : "");
  if (!Number.isInteger(face) || face < 0 || face > 500 || !(x >= 0 && x <= 100) || !(y >= 0 && y <= 5000)) throw new Error("Posição inválida");
  const [row] = await sql()`update stamps set face = ${face}, x = ${x}, y = ${y} where seed = ${seed} and face is null
    returning *, (select best from scores where scores.seed = stamps.seed) as best, (select best from runs where runs.seed = stamps.seed) as run, (select best from jams where jams.seed = stamps.seed) as jam`;
  if (!row) throw new Error("Selo já colado");
  revalidatePath("/");
  return toStamp(row);
}

// Beating the Count D'arábica earns a second stamp: its own seed (so its own shape and colours), rarity from `beans` (% of beans taken).
// A later run with more beans raises it, even once stuck. Returns the same row on every call, like generateStamp.
// ponytail: the win and the % are client-reported, like the paper-toss score; same upgrade path.
export async function countStamp(device: string, beans: number) {
  const seed = await deviceSeed(device, "conde");
  if (!Number.isInteger(beans) || beans < 0 || beans > 100) throw new Error("Grãos inválidos");
  const country = (await headers()).get("x-vercel-ip-country") ?? "";
  const [row] = await sql()`
    insert into stamps (seed, country, beans) values (${seed}, ${/^[A-Z]{2}$/.test(country) ? country : null}, ${beans})
    on conflict (seed) do update set beans = greatest(stamps.beans, excluded.beans)
    returning *`;
  revalidatePath("/");
  return toStamp(row);
}

// Paper toss. Only raises the best; called on each basket past the known record.
// ponytail: the score is client-reported, so it can be faked (and buy rarity); cap + per-IP rate limit is the upgrade if the board gets spammed.
export async function submitScore(device: string, score: number) {
  const seed = await deviceSeed(device);
  if (!Number.isInteger(score) || score < 1 || score > 500) throw new Error("Pontuação inválida");
  await sql()`
    insert into scores (seed, best) values (${seed}, ${score})
    on conflict (seed) do update set best = excluded.best, updated_at = now() where scores.best < excluded.best`;
  revalidatePath("/");
}

export async function setScoreName(device: string, name: string) {
  const seed = await deviceSeed(device);
  const clean = typeof name === "string" ? name.replace(/[\p{C}]/gu, "").trim().slice(0, 20) : "";
  if (!clean) throw new Error("Nome inválido");
  await sql()`insert into scores (seed, name) values (${seed}, ${clean}) on conflict (seed) do update set name = excluded.name`;
  return clean;
}

// Top 10 named players, plus this device's own row.
export async function getScoreboard(device: string) {
  const seed = await deviceSeed(device);
  const [top, [me]] = await Promise.all([
    sql()`select name, best from scores where name is not null and best > 0 order by best desc, updated_at limit 10`,
    sql()`select name, best from scores where seed = ${seed}`,
  ]);
  return { top: top as { name: string; best: number }[], me: (me ?? { name: null, best: 0 }) as { name: string | null; best: number } };
}
