"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, checkPassword, isAdmin } from "@/lib/admin";

export async function login(form: FormData) {
  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1000)); // slows down guessing
    redirect("/admin?erro=1");
  }
  (await cookies()).set(ADMIN_COOKIE, adminToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 60 * 60 * 24 * 30 });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

// Names a visitor (shown in the list and their journey); `hidden` drops them from every number (the owner, a bot, a test).
export async function labelVisitor(form: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const visitor = String(form.get("visitor"));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitor)) throw new Error("Visitante inválido");
  const clean = (k: string, max: number) => String(form.get(k) ?? "").replace(/[\p{C}]/gu, "").trim().slice(0, max) || null;
  const hidden = form.get("hidden") === "on";
  await neon(process.env.DATABASE_URL!)`
    insert into visitor_labels (visitor, name, note, hidden) values (${visitor}, ${clean("name", 60)}, ${clean("note", 500)}, ${hidden})
    on conflict (visitor) do update set name = excluded.name, note = excluded.note, hidden = excluded.hidden, updated_at = now()`;
  revalidatePath("/admin", "layout");
}
