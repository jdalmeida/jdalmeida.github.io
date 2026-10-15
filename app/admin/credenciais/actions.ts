"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { isUpload, MAX_PHOTOS, photoUrl } from "@/lib/credential-meta";

// Tables: lib/credentials.sql. Saving revalidates the whole site: the desk on the home page is cached for an hour.
const sql = () => neon(process.env.DATABASE_URL!);

const COLOR = /^#[0-9a-f]{6}$/i;
const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_PHOTO_BYTES = 1_500_000; // the editor resizes to 960px WebP first, which lands around 100–250 KB

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "evento";

// Removes uploaded photos no longer used by any credential.
async function dropPhotos(urls: string[]) {
  const ids = urls.filter(isUpload).map((u) => Number(u.split("/").pop())).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length) await sql()`delete from credential_photos where id = any(${ids}::int[])`;
}

export async function saveCredential(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 120);
  if (!name) throw new Error("A credencial precisa do nome do evento");
  const color = COLOR.test(text(form, "color", 7)) ? text(form, "color", 7) : "#153df5";
  const darkColor = COLOR.test(text(form, "darkColor", 7)) ? text(form, "darkColor", 7) : "#0a1f8a";
  const fields = {
    year: text(form, "year", 20), location: text(form, "location", 160), place: text(form, "place", 60), role: text(form, "role", 40),
    number: text(form, "number", 20), note: text(form, "note", 1200),
  };
  const position = Number(form.get("position")) || 0;
  const published = form.get("published") === "on";

  const id = text(form, "id", 64);
  const [current] = id ? (await sql()`select images from credentials where id = ${id}`) as { images: string[] }[] : [];
  if (id && !current) throw new Error("Credencial não encontrada");

  // Photos: the ones kept (only from those it already had, in the order given) plus the new uploads.
  let keep: string[] = [];
  try { keep = JSON.parse(String(form.get("images") ?? "[]")); } catch {}
  keep = (Array.isArray(keep) ? keep : []).filter((u) => current?.images.includes(u));
  const files = form.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0).slice(0, Math.max(0, MAX_PHOTOS - keep.length));
  for (const f of files) {
    if (!PHOTO_TYPES.includes(f.type)) throw new Error(`Formato de foto não suportado: ${f.type || f.name}`);
    if (f.size > MAX_PHOTO_BYTES) throw new Error(`Foto grande demais: ${f.name}`);
  }
  const added: string[] = [];
  for (const f of files) {
    const hex = Buffer.from(await f.arrayBuffer()).toString("hex");
    const [row] = (await sql()`insert into credential_photos (type, data) values (${f.type}, decode(${hex}, 'hex')) returning id`) as { id: number }[];
    added.push(photoUrl(row.id));
  }
  const images = JSON.stringify([...keep, ...added]);

  if (current) {
    await sql()`update credentials set name = ${name}, year = ${fields.year}, location = ${fields.location}, place = ${fields.place},
      role = ${fields.role}, number = ${fields.number}, color = ${color}, dark_color = ${darkColor}, note = ${fields.note},
      images = ${images}::jsonb, position = ${position}, published = ${published}, updated_at = now() where id = ${id}`;
    await dropPhotos(current.images.filter((u) => !keep.includes(u)));
  } else {
    // The id is the slug of the name (-2, -3… when taken); it names the credential in the analytics, so it never changes.
    const base = slugify(name);
    const taken = new Set(((await sql()`select id from credentials where id like ${base + "%"}`) as { id: string }[]).map((r) => r.id));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    await sql()`insert into credentials (id, name, year, location, place, role, number, color, dark_color, note, images, position, published)
      values (${slug}, ${name}, ${fields.year}, ${fields.location}, ${fields.place}, ${fields.role}, ${fields.number}, ${color}, ${darkColor},
        ${fields.note}, ${images}::jsonb, ${position}, ${published})`;
  }
  revalidatePath("/", "layout");
}

export async function deleteCredential(form: FormData) {
  await requireAdmin();
  const [row] = (await sql()`delete from credentials where id = ${text(form, "id", 64)} returning images`) as { images: string[] }[];
  if (row) await dropPhotos(row.images);
  revalidatePath("/", "layout");
}
