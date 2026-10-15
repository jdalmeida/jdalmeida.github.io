import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";
import { deviceSeed } from "@/lib/device";
import type { TrackType } from "@/lib/track";

// Receives lib/track.ts events. Tables: lib/visits.sql.
// The device seeds (same hash as the stamps) are what link a visit to its stamp, paper-toss score and castle progress.
// ponytail: anyone can post here; ids are random UUIDs, so the worst case is junk rows. Add a Vercel firewall rate rule if that happens.
const sql = () => neon(process.env.DATABASE_URL!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set<TrackType>(["view", "show", "hide", "open", "article", "share", "credential", "game", "score", "stage", "won", "stamp"]);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|whatsapp|telegram/i;
const text = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function host(url: string | null) {
  try { return url ? new URL(url).hostname.replace(/^www\./, "") : null; } catch { return null; }
}

function client(ua: string) {
  const deviceType = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung"
    : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Instagram/.test(ua) ? "Instagram" : /FBAN|FBAV/.test(ua) ? "Facebook"
    : /LinkedInApp/.test(ua) ? "LinkedIn" : /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "outro";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "outro";
  return { deviceType, browser, os };
}

export async function POST(request: Request) {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  try {
    const body = await request.json();
    const { visit, visitor } = body;
    if (!UUID.test(visit) || !UUID.test(visitor)) throw new Error("ids");
    const [seed, countSeed] = await Promise.all([deviceSeed(body.device), deviceSeed(body.device, "conde")]);
    const i = body.info ?? {};
    const referrer = text(i.referrer, 1000);
    const refHost = host(referrer);
    const self = host(request.url);
    const source = text(i.utm_source, 100)?.toLowerCase() ?? (refHost && refHost !== self ? refHost : "direto");
    const castle = typeof i.castle === "string" && UUID.test(i.castle) ? i.castle : null;
    const { deviceType, browser, os } = client(ua);
    const geo = (k: string) => { try { return text(decodeURIComponent(h.get(k) ?? ""), 100); } catch { return null; } };

    // Visit details are kept from the first event; later ones only extend it (and pick up the castle key once there is one).
    await sql()`
      insert into visits (id, visitor, seed, count_seed, castle, landing, referrer, source, utm_medium, utm_campaign, utm_content, utm_term,
        ff, country, region, city, device_type, browser, os, language, screen, user_agent)
      values (${visit}, ${visitor}, ${seed}, ${countSeed}, ${castle}, ${text(i.landing, 300)}, ${refHost === self ? null : referrer}, ${source},
        ${text(i.utm_medium, 100)}, ${text(i.utm_campaign, 100)}, ${text(i.utm_content, 100)}, ${text(i.utm_term, 100)},
        ${i.ff === true}, ${geo("x-vercel-ip-country")}, ${geo("x-vercel-ip-country-region")}, ${geo("x-vercel-ip-city")},
        ${deviceType}, ${browser}, ${os}, ${text(i.language, 20)}, ${text(i.screen, 20)}, ${ua.slice(0, 400)})
      on conflict (id) do update set last_at = now(), castle = coalesce(visits.castle, excluded.castle)`;

    const events = (Array.isArray(body.events) ? body.events : []).slice(0, 10).filter((e: { type?: unknown }) => TYPES.has(e?.type as TrackType));
    for (const e of events) {
      const detail = e.detail && typeof e.detail === "object" ? JSON.stringify(e.detail) : null;
      await sql()`insert into visit_events (visit, type, name, detail)
        values (${visit}, ${e.type}, ${text(e.name, 200)}, ${detail && detail.length <= 1000 ? detail : null})`;
    }
  } catch {
    return new Response(null, { status: 400 });
  }
  return new Response(null, { status: 204 });
}
