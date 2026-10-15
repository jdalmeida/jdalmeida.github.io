import { neon } from "@neondatabase/serverless";
import type { Credential } from "./credential-meta";
import seed from "./events.json";

// Table: see lib/credentials.sql; edited in /admin/credenciais.
export async function getCredentials(): Promise<Credential[]> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    return (await sql`select id, name, year, location, place, role, number, color, dark_color "darkColor", note, images
      from credentials where published order by position, created_at`) as Credential[];
  } catch (e) {
    // Table not created yet (42P01): keep showing the credentials from before the admin existed (lib/events.json).
    if ((e as { code?: string }).code === "42P01") return seed;
    throw e;
  }
}

// id → event name for the analytics labels, hidden credentials included.
export async function getCredentialNames(): Promise<Record<string, string>> {
  try {
    const rows = (await neon(process.env.DATABASE_URL!)`select id, name from credentials`) as { id: string; name: string }[];
    return Object.fromEntries(rows.map((r) => [r.id, r.name]));
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return Object.fromEntries(seed.map((r) => [r.id, r.name]));
    throw e;
  }
}
