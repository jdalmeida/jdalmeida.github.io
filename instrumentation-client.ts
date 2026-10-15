import { track } from "@/lib/track";

// Visit log for /admin (see lib/track.ts): the first page, tab switches and client-side navigations.
track("view", location.pathname);
document.addEventListener("visibilitychange", () => track(document.visibilityState === "hidden" ? "hide" : "show"));

export function onRouterTransitionStart(url: string) {
  track("view", new URL(url, location.href).pathname);
}
