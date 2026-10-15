import { createHash } from "node:crypto";
import { headers } from "next/headers";

// Seed = hash of what the server sees (IP, browser headers) + what the client reports (screen, timezone...). Only the hash is stored.
// Shared by the stamps (lib/stamps.ts) and the visit log (app/api/track), so a visit joins its stamp and score by seed.
// ponytail: `device` is client-supplied, so a determined visitor can re-roll seeds (and rarity); add a per-IP limit (e.g. Vercel firewall rate rule) if that gets abused.
// `salt` gives the same device another seed (the Count's stamp); "" keeps the visitor stamp's seed.
export async function deviceSeed(device: unknown, salt = "") {
  if (typeof device !== "string" || device.length > 300) throw new Error("Dispositivo inválido");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  return createHash("sha256").update([ip, h.get("user-agent"), h.get("accept-language"), device].join("\n") + salt).digest().readInt32BE(0);
}
