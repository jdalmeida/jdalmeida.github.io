// Client-side visit log for the /admin dashboard. Table and columns: lib/visits.sql; receiver: app/api/track/route.ts.
// Event types (name / detail):
//   view (path) · show / hide (tab came back / went away; keeps the visit's duration honest)
//   open (caderno) · article (slug) · share (slug) · credential (event id)
//   game (paper-toss | coffee-run) · score (paper-toss, { throws, max }) · stage / won (castle stage index, { beans })
//   stamp (gerado | colado | conde, { id?, beans? })
export type TrackType = "view" | "show" | "hide" | "open" | "article" | "share" | "credential" | "game" | "score" | "stage" | "won" | "stamp";

// What the client adds to the device seed (the server adds IP and browser headers). Same string the stamps use.
export const device = () => [screen.width, screen.height, devicePixelRatio, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency, navigator.language].join("|");

const VISITOR = "jd-visitor", VISIT = "jd-visit", CASTLE = "cafe-castle-key";
export const OPT_OUT = "jd-no-track"; // set by /admin, so the owner's own browsing stays out of the numbers
const IDLE = 30 * 60e3; // a tab quiet for longer than this starts a new visit

const uuid = () => crypto.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));

function ids() {
  let visitor = localStorage.getItem(VISITOR);
  if (!visitor) localStorage.setItem(VISITOR, (visitor = uuid()));
  let visit: { id: string; at: number } | null = null;
  try { visit = JSON.parse(sessionStorage.getItem(VISIT) ?? ""); } catch {}
  if (!visit || Date.now() - visit.at > IDLE) visit = { id: uuid(), at: 0 };
  visit.at = Date.now();
  sessionStorage.setItem(VISIT, JSON.stringify(visit));
  return { visitor, visit: visit.id };
}

// Sent with every event; the server keeps it only from the visit's first one.
function info() {
  const q = new URLSearchParams(location.search);
  return {
    landing: location.pathname, referrer: document.referrer, ff: q.has("ff"), castle: localStorage.getItem(CASTLE),
    screen: `${screen.width}x${screen.height}`, language: navigator.language,
    utm_source: q.get("utm_source") ?? q.get("ref") ?? q.get("source"), utm_medium: q.get("utm_medium"),
    utm_campaign: q.get("utm_campaign"), utm_content: q.get("utm_content"), utm_term: q.get("utm_term"),
  };
}

// Fire and forget: tracking never breaks the page.
export function track(type: TrackType, name?: string, detail?: Record<string, unknown>) {
  try {
    if (localStorage.getItem(OPT_OUT) || location.pathname.startsWith("/admin")) return;
    const body = JSON.stringify({ ...ids(), device: device(), info: info(), events: [{ type, name, detail }] });
    // A hidden tab may be about to die: the beacon survives that, fetch may not.
    if (type === "hide" && navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  } catch {}
}
