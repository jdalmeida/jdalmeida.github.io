"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/links";

// Posts live in the same table as the old blog (no id sequence there, so new ids are max + 1).
// Saving revalidates the whole site: the notebook and /blog/<slug> pages are cached for an hour.
const sql = () => neon(process.env.DATABASE_URL!);

export type SaveResult = { ok: true; id: number } | { ok: false; error: string };

export async function savePost(form: FormData): Promise<SaveResult> {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const slug = slugify(String(form.get("slug") || title)).slice(0, 120);
  const excerpt = String(form.get("excerpt") ?? "").trim().slice(0, 600);
  const content = String(form.get("content") ?? "");
  const tags = [...new Set(String(form.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 12);
  const published = form.get("published") === "on";
  const date = String(form.get("published_at") ?? "");
  const at = date && !isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
  if (!title || !slug) return { ok: false, error: "Título e endereço são obrigatórios." };
  const id = Number(form.get("id"));
  const [taken] = await sql()`select id from posts where slug = ${slug} and id <> ${Number.isInteger(id) ? id : -1}`;
  if (taken) return { ok: false, error: `Já existe um artigo com o endereço /blog/${slug}.` };
  let row;
  if (Number.isInteger(id) && id > 0) {
    [row] = await sql()`update posts set title = ${title}, slug = ${slug}, excerpt = ${excerpt}, content = ${content}, tags = ${JSON.stringify(tags)}::jsonb,
      published = ${published}, published_at = coalesce(${at}::timestamptz, case when ${published} then coalesce(published_at, now()) end), updated_at = now()
      where id = ${id} returning id`;
  } else {
    [row] = await sql()`insert into posts (id, slug, title, excerpt, content, tags, published, published_at)
      values ((select coalesce(max(id), 0) + 1 from posts), ${slug}, ${title}, ${excerpt}, ${content}, ${JSON.stringify(tags)}::jsonb, ${published},
        coalesce(${at}::timestamptz, case when ${published} then now() end))
      returning id`;
  }
  if (!row) return { ok: false, error: "Artigo não encontrado." };
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  await sql()`delete from posts where id = ${Number(form.get("id"))}`;
  revalidatePath("/", "layout");
  (await import("next/navigation")).redirect("/admin/artigos");
}
