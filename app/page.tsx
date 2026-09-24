import { readdirSync } from "node:fs";
import VisitCard from "@/components/assets/iridescent_visit_card";
import Stickers from "@/components/ui/stickers";

// Read at build time: new files in public/stickers show up with no code change.
const stickers = readdirSync("public/stickers").map((f) => `/stickers/${f}`);

export default function Home() {
  return (
    <main className="relative flex flex-1 items-center justify-center bg-neutral-950 p-6">
      <Stickers srcs={stickers} />
      <VisitCard />
    </main>
  );
}
