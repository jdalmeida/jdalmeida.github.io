import { readdirSync } from "node:fs";
import VisitCard from "@/components/assets/iridescent_visit_card";
import Stickers from "@/components/ui/stickers";
import SignatureIntro from "@/components/ui/signature-intro";
import DeskScene from "@/components/ui/desk-scene";
import DeskNotebook from "@/components/ui/notebook";
import DeskCredentials from "@/components/ui/desk-credentials";
import { getCredentials } from "@/lib/credentials";
import { getArticles } from "@/lib/articles";
import { getProjects } from "@/lib/projects";
import { getStamps } from "@/lib/stamps";

// New SVG stickers need `bun run bake-assets` to produce the WebP used by the scene.
const stickers = readdirSync("public/stickers").filter((f) => f.endsWith(".webp")).map((f) => `/stickers/${f}`);

// Articles, projects and credentials come from Postgres; refetched at most once an hour (saving in /admin refreshes right away).
export const revalidate = 3600;

export default async function Home() {
  return (
    <main className="relative flex-1 bg-neutral-950">
      <DeskScene card={<VisitCard />} stickers={<Stickers srcs={stickers} />} notebook={<DeskNotebook articles={await getArticles()} projects={await getProjects()} stamps={await getStamps()} />}
        credentials={<DeskCredentials events={await getCredentials()} />} />
      <SignatureIntro />
    </main>
  );
}
