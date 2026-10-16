// Client-side visit log for the /admin dashboard. Table and columns: lib/visits.sql; receiver: app/api/track/route.ts.
// Event types (name / detail):
//   view (path) · show / hide (tab came back / went away; keeps the visit's duration honest) · desk (scrolled down to the desk)
//   open (caderno) · article (slug) · share (slug) · credential (event id)
//   game (paper-toss | coffee-run | desk-run | guitar) · score (paper-toss, { throws, max } | desk-run, { cm, drops, score } | guitar, { score, notes, max, custom }) · stage / won (castle stage index, { beans })
//   stamp (gerado | colado | conde, { id?, beans? })
export type TrackType = "view" | "show" | "hide" | "desk" | "open" | "article" | "share" | "credential" | "game" | "score" | "stage" | "won" | "stamp";

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
// Landing is read once: the notebook rewrites the address bar before the first interaction flushes the queue.
let landing = "";
function info() {
  const q = new URLSearchParams(location.search);
  return {
    landing: landing || location.pathname, referrer: document.referrer, ff: q.has("ff"), castle: localStorage.getItem(CASTLE),
    screen: `${screen.width}x${screen.height}`, language: navigator.language,
    utm_source: q.get("utm_source") ?? q.get("ref") ?? q.get("source"), utm_medium: q.get("utm_medium"),
    utm_campaign: q.get("utm_campaign"), utm_content: q.get("utm_content"), utm_term: q.get("utm_term"),
  };
}

// Link checkers (Instagram/Meta's own included) open the page in a real browser but never touch it,
// so nothing is sent until a person scrolls, taps, moves the mouse or presses a key. Until then events wait here;
// a page nobody touches leaves no visit at all.
// ponytail: a reader who opens the page and never moves isn't counted either; that's the price of dropping the checkers.
type Event = { type: TrackType; name?: string; detail?: Record<string, unknown> };
let queue: Event[] | null = null, human = false;
const HUMAN = ["pointerdown", "pointermove", "touchstart", "keydown", "wheel", "scroll"] as const;

function waitForHuman() {
  queue = [];
  landing = location.pathname;
  const go = () => {
    HUMAN.forEach((e) => removeEventListener(e, go, true));
    human = true;
    if (queue!.length) send(queue!.splice(0));
  };
  HUMAN.forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
}

function send(events: Event[], beacon = false) {
  const body = JSON.stringify({ ...ids(), device: device(), info: info(), events });
  // A hidden tab may be about to die: the beacon survives that, fetch may not.
  if (beacon && navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}

// Fire and forget: tracking never breaks the page.
export function track(type: TrackType, name?: string, detail?: Record<string, unknown>) {
  try {
    if (localStorage.getItem(OPT_OUT) || location.pathname.startsWith("/admin") || navigator.webdriver) return;
    if (!queue) waitForHuman();
    if (!human) { if (queue!.length < 10) queue!.push({ type, name, detail }); return; }
    send([{ type, name, detail }], type === "hide");
  } catch {}
}
