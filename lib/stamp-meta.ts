import { rng } from "./rng";
import type { Stamp } from "./stamps";

// Rarity is the sticker's finish: 70% matte, 25% metallic, 5% chroma.
// Own random stream, so tweaking the look code never changes anyone's rarity.
// A paper-toss best streak raises it (never lowers): SCORE_TIERS[i] baskets in a row earn tier i + 1.
export const TIERS = ["comum", "raro", "lendário"] as const;
export const SCORE_TIERS = [10, 25];
// Corrida na Mesa does the same with its best score (cm run + 10 per drop): RUN_TIERS[i] earns tier i + 1. Whichever game is higher wins.
export const RUN_TIERS = [2000, 5000];
// And Solo de Strato with its best on the official song (34300 is all perfect): JAM_TIERS[i] earns tier i + 1.
export const JAM_TIERS = [15000, 28000];
// The Count D'arábica stamp skips both: its rarity is the % of castle beans taken, COUNT_TIERS[i] earns tier i + 1.
export const COUNT_TIERS = [80, 100];
export const tier = ({ seed, best, beans, run = 0, jam = 0 }: Pick<Stamp, "seed" | "best" | "beans" | "run" | "jam">) => {
  if (beans !== null) return COUNT_TIERS.filter((n) => beans >= n).length;
  const v = rng(seed ^ 0x5eed)();
  return Math.max(v < 0.05 ? 2 : v < 0.3 ? 1 : 0, SCORE_TIERS.filter((n) => best >= n).length, RUN_TIERS.filter((n) => run >= n).length, JAM_TIERS.filter((n) => jam >= n).length);
};

export const pad = (n: number) => `Nº ${String(n).padStart(4, "0")}`;
