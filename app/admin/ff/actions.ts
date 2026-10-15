"use server";

import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { cleanLook } from "@/lib/look";

// Family & Friends links (ff_tokens). Redeeming happens in generateStamp (lib/stamps.ts).
const sql = () => neon(process.env.DATABASE_URL!);
const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/[\p{C}]/gu, "").trim().slice(0, max);

// New token, or (with `id`) new name/design/uses for an existing one; stamps already redeemed keep the design they got.
export async function saveToken(form: FormData) {
  await requireAdmin();
  const name = text(form.get("name"), 60), note = text(form.get("note"), 300) || null;
  const uses = Math.min(100, Math.max(1, Math.round(Number(form.get("max_uses")) || 1)));
  let look;
  try { look = cleanLook(JSON.parse(String(form.get("look") ?? "{}"))); } catch { look = {}; }
  if (!name) throw new Error("Dê um nome");
  const id = Number(form.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await sql()`update ff_tokens set name = ${name}, note = ${note}, max_uses = ${uses}, look = ${JSON.stringify(look)}::jsonb where id = ${id}`;
  } else {
    await sql()`insert into ff_tokens (token, name, note, max_uses, look) values (${randomBytes(8).toString("base64url")}, ${name}, ${note}, ${uses}, ${JSON.stringify(look)}::jsonb)`;
  }
  revalidatePath("/admin/ff");
}

export async function setRevoked(form: FormData) {
  await requireAdmin();
  await sql()`update ff_tokens set revoked = ${form.get("revoked") === "1"} where id = ${Number(form.get("id"))}`;
  revalidatePath("/admin/ff");
}
