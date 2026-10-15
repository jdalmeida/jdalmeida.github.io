"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { ProjectLink } from "@/lib/projects";

// Table: lib/projects.sql. Saving revalidates the whole site: the notebook (home and /blog/<slug>) is cached for an hour.
const sql = () => neon(process.env.DATABASE_URL!);

// One link per line: "Rótulo | https://..." (a bare URL gets the label "Link").
function parseLinks(text: string): ProjectLink[] {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8).map((line) => {
    const [label, href] = line.includes("|") ? line.split("|", 2).map((s) => s.trim()) : ["Link", line];
    if (!/^https?:\/\/\S+$/.test(href)) throw new Error(`Link inválido: ${line}`);
    return { label: label.slice(0, 40) || "Link", href };
  });
}

export async function saveProject(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const year = String(form.get("year") ?? "").trim().slice(0, 20) || null;
  const description = String(form.get("description") ?? "").trim().slice(0, 1200);
  const tags = [...new Set(String(form.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 8);
  const links = parseLinks(String(form.get("links") ?? ""));
  const position = Number(form.get("position")) || 0;
  const published = form.get("published") === "on";
  if (!name) throw new Error("O projeto precisa de um nome");
  const id = Number(form.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await sql()`update projects set name = ${name}, year = ${year}, description = ${description}, tags = ${JSON.stringify(tags)}::jsonb,
      links = ${JSON.stringify(links)}::jsonb, position = ${position}, published = ${published}, updated_at = now() where id = ${id}`;
  } else {
    await sql()`insert into projects (name, year, description, tags, links, position, published)
      values (${name}, ${year}, ${description}, ${JSON.stringify(tags)}::jsonb, ${JSON.stringify(links)}::jsonb, ${position}, ${published})`;
  }
  revalidatePath("/", "layout");
}

export async function deleteProject(form: FormData) {
  await requireAdmin();
  await sql()`delete from projects where id = ${Number(form.get("id"))}`;
  revalidatePath("/", "layout");
}
