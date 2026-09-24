import { readdirSync } from "node:fs";
import VisitCard from "@/components/assets/iridescent_visit_card";
import Stickers from "@/components/ui/stickers";
import SignatureIntro from "@/components/ui/signature-intro";
import DeskScene from "@/components/ui/desk-scene";
import DeskNotebook from "@/components/ui/notebook";
import { getArticles } from "@/lib/articles";
import { getStamps } from "@/lib/stamps";

// Read at build time: new files in public/stickers show up with no code change.
const stickers = readdirSync("public/stickers").map((f) => `/stickers/${f}`);

// Articles come from the blog's Postgres; refetched at most once an hour.
export const revalidate = 3600;

export default async function Home() {
  return (
    <main className="relative flex-1 bg-neutral-950">
      <DeskScene card={<VisitCard />} stickers={<Stickers srcs={stickers} />} notebook={<DeskNotebook articles={await getArticles()} stamps={await getStamps()} />} />
      <SignatureIntro />
    </main>
  );
}
