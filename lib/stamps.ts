"use server";

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Tables: see lib/stamps.sql. `id` is the visitor number; look (shape, colours, rarity) comes from `seed`, rarity can be raised by `best`.
export type Stamp = { id: number; seed: number; ff: boolean; country: string | null; face: number | null; x: number | null; y: number | null; date: string; best: number };

const sql = () => neon(process.env.DATABASE_URL!);
const toStamp = (r: Record<string, unknown>): Stamp => ({
  id: r.id as number, seed: r.seed as number, ff: r.ff as boolean, country: r.country as string | null,
  face: r.face as number | null, x: r.x as number | null, y: r.y as number | null, date: new Date(r.created_at as string).toISOString(),
  best: (r.best as number | null) ?? 0,
});

export async function getStamps() {
  return (await sql()`select stamps.*, scores.best from stamps left join scores using (seed) where face is not null order by id`).map(toStamp);
}

// Seed = hash of what the server sees (IP, browser headers) + what the client reports (screen, timezone...). Only the hash is stored.
// ponytail: `device` is client-supplied, so a determined visitor can re-roll seeds (and rarity); add a per-IP limit (e.g. Vercel firewall rate rule) if that gets abused.
async function deviceSeed(device: unknown) {
  if (typeof device !== "string" || device.length > 300) throw new Error("Dispositivo inválido");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  return createHash("sha256").update([ip, h.get("user-agent"), h.get("accept-language"), device].join("\n")).digest().readInt32BE(0);
}

// One stamp per device: generating again returns the same row. A Family & Friends link upgrades a stamp that isn't stuck yet.
export async function generateStamp(device: string, ff: string) {
  const seed = await deviceSeed(device);
  const isFF = !!process.env.FF_TOKEN && ff === process.env.FF_TOKEN;
  const country = (await headers()).get("x-vercel-ip-country") ?? "";
  const [row] = await sql()`
    insert into stamps (seed, ff, country) values (${seed}, ${isFF}, ${/^[A-Z]{2}$/.test(country) ? country : null})
    on conflict (seed) do update set ff = stamps.ff or (stamps.face is null and excluded.ff)
    returning *, (select best from scores where scores.seed = stamps.seed) as best`;
  return toStamp(row);
}

// Stickers don't peel: a position is set once.
export async function placeStamp(device: string, face: number, x: number, y: number) {
  const seed = await deviceSeed(device);
  if (!Number.isInteger(face) || face < 0 || face > 500 || !(x >= 0 && x <= 100) || !(y >= 0 && y <= 5000)) throw new Error("Posição inválida");
  const [row] = await sql()`update stamps set face = ${face}, x = ${x}, y = ${y} where seed = ${seed} and face is null
    returning *, (select best from scores where scores.seed = stamps.seed) as best`;
  if (!row) throw new Error("Selo já colado");
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
