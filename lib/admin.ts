import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// One owner, one password: ADMIN_PASSWORD (Vercel env). The cookie holds an HMAC of it, so changing the password logs everyone out.
export const ADMIN_COOKIE = "jd-admin";
export const adminToken = () => createHmac("sha256", process.env.ADMIN_PASSWORD!).update("jd-admin-session").digest("hex");
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export const checkPassword = (password: string) => !!process.env.ADMIN_PASSWORD && same(password, process.env.ADMIN_PASSWORD);

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  return same((await cookies()).get(ADMIN_COOKIE)?.value ?? "", adminToken());
}

// For admin pages and server actions other than the dashboard (which shows the login form itself).
export async function requireAdmin() {
  if (!(await isAdmin())) (await import("next/navigation")).redirect("/admin");
}
