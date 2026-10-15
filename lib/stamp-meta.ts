import { rng } from "./rng";
import type { Stamp } from "./stamps";

// Rarity is the sticker's finish: 70% matte, 25% metallic, 5% chroma.
// Own random stream, so tweaking the look code never changes anyone's rarity.
// A paper-toss best streak raises it (never lowers): SCORE_TIERS[i] baskets in a row earn tier i + 1.
export const TIERS = ["comum", "raro", "lendário"] as const;
export const SCORE_TIERS = [10, 25];
// The Count D'arábica stamp skips both: its rarity is the % of castle beans taken, COUNT_TIERS[i] earns tier i + 1.
export const COUNT_TIERS = [80, 100];
export const tier = ({ seed, best, beans }: Pick<Stamp, "seed" | "best" | "beans">) => {
  if (beans !== null) return COUNT_TIERS.filter((n) => beans >= n).length;
  const v = rng(seed ^ 0x5eed)();
  return Math.max(v < 0.05 ? 2 : v < 0.3 ? 1 : 0, SCORE_TIERS.filter((n) => best >= n).length);
};

export const pad = (n: number) => `Nº ${String(n).padStart(4, "0")}`;
