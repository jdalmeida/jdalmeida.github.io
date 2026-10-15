"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

// Moderation of visitor stamps. The notebook (/) is revalidated so changes show right away.
const sql = () => neon(process.env.DATABASE_URL!);
const id = (form: FormData) => { const n = Number(form.get("id")); if (!Number.isInteger(n)) throw new Error("Selo inválido"); return n; };
const done = () => { revalidatePath("/", "layout"); };

// Back in the visitor's hand: their device can stick it again.
export async function unstickStamp(form: FormData) {
  await requireAdmin();
  await sql()`update stamps set face = null, x = null, y = null where id = ${id(form)}`;
  done();
}

export async function moveStamp(form: FormData) {
  await requireAdmin();
  const face = Number(form.get("face")), x = Number(form.get("x")), y = Number(form.get("y"));
  if (!Number.isInteger(face) || face < 0 || face > 500 || !(x >= 0 && x <= 100) || !(y >= 0 && y <= 5000)) throw new Error("Posição inválida");
  await sql()`update stamps set face = ${face}, x = ${x}, y = ${y} where id = ${id(form)}`;
  done();
}

// Gone for good; the device can generate a new one (with a new number).
export async function deleteStamp(form: FormData) {
  await requireAdmin();
  await sql()`delete from stamps where id = ${id(form)}`;
  done();
}
