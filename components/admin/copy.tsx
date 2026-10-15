"use client";

import { useState } from "react";

export default function Copy({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="whitespace-nowrap rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-sky-500 hover:text-sky-300"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}>
      {done ? "Copiado!" : label}
    </button>
  );
}
