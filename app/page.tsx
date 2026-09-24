import { readdirSync } from "node:fs";
import VisitCard from "@/components/assets/iridescent_visit_card";
import Stickers from "@/components/ui/stickers";
import SignatureIntro from "@/components/ui/signature-intro";
import DeskScene from "@/components/ui/desk-scene";

// Read at build time: new files in public/stickers show up with no code change.
const stickers = readdirSync("public/stickers").map((f) => `/stickers/${f}`);

export default function Home() {
  return (
    <main className="relative flex-1 bg-neutral-950">
      <DeskScene card={<VisitCard />} stickers={<Stickers srcs={stickers} />} />
      <SignatureIntro />
    </main>
  );
}
