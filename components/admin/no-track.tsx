"use client";

import { useEffect } from "react";
import { OPT_OUT } from "@/lib/track";

// Opening /admin marks this browser as the owner's, so its visits to the site stay out of the numbers.
export default function NoTrack() {
  useEffect(() => { try { localStorage.setItem(OPT_OUT, "1"); } catch {} }, []);
  return null;
}
