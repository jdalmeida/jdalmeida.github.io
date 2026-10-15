// A Family & Friends sticker's design, picked in /admin (ff_tokens.look) and copied onto the stamp it gives (stamps.look).
// Anything left out comes from the stamp's seed, like any other sticker. Drawn by art() in components/ui/stamp.tsx.
export type Look = { paper?: number; doodle?: number; tier?: 0 | 1 | 2; shape?: Shape; label?: string };
export type Shape = (typeof SHAPES)[number];

// Same order as PAPER and DOODLES in stamp.tsx.
export const PAPERS = ["Creme e vermelho", "Azul-marinho", "Mostarda", "Menta", "Rosa", "Laranja", "Lavanda", "Preto e amarelo"];
export const PAPER_SWATCH = ["#f4ecd8", "#1c3452", "#e9b949", "#bfe3d0", "#f6c6cf", "#ef7d3c", "#d8c8f0", "#1d1a16"];
export const DOODLE_NAMES = ["Estrela", "Espiral", "Coração", "Cubo", "Seta", "Raio", "Sol", "Sorriso", "Flor", "Laços", "Check", "Jogo da velha"];
export const SHAPES = ["heart", "round", "passport"] as const;
export const SHAPE_NAMES: Record<Shape, string> = { heart: "Coração", round: "Adesivo redondo", passport: "Carimbo de passaporte" };
export const FINISHES = ["Fosco", "Metálico", "Holográfico"];
export const LABEL_MAX = 18;

const int = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < max ? (v as number) : undefined);

// Drops anything that isn't a valid choice, so a stored look can always be drawn.
export function cleanLook(v: unknown): Look {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.replace(/[\p{C}]/gu, "").trim().toUpperCase().slice(0, LABEL_MAX) : "";
  const look: Look = {
    paper: int(o.paper, PAPERS.length), doodle: int(o.doodle, DOODLE_NAMES.length), tier: int(o.tier, 3) as Look["tier"],
    shape: SHAPES.includes(o.shape as Shape) ? (o.shape as Shape) : undefined, label: label || undefined,
  };
  return Object.fromEntries(Object.entries(look).filter(([, x]) => x !== undefined)) as Look;
}
