"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/links";

const sql = () => neon(process.env.DATABASE_URL!);
// Same normalisation as the builder: lowercase, no spaces or accents, so the link and the stored visit match.
const slug = (v: unknown) => slugify(String(v ?? ""));

export async function saveLink(form: FormData) {
  await requireAdmin();
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const [source, medium, campaign, content] = ["source", "medium", "campaign", "content"].map((k) => slug(form.get(k)));
  const path = String(form.get("path") ?? "/");
  if (!label || !source || !campaign || !/^\/[\w/-]*$/.test(path)) throw new Error("Link inválido");
  await sql()`insert into campaign_links (label, source, medium, campaign, content, path)
    values (${label}, ${source}, ${medium || null}, ${campaign}, ${content || null}, ${path})`;
  revalidatePath("/admin/links");
}

export async function deleteLink(form: FormData) {
  await requireAdmin();
  await sql()`delete from campaign_links where id = ${Number(form.get("id"))}`;
  revalidatePath("/admin/links");
}
