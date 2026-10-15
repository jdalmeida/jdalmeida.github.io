import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { LAYERS, layerUrl } from "../components/ui/grime";
import { CHALK } from "../components/ui/desk-textures";

// Tileable surfaces for the notebook room (stitchTiles keeps the noise seamless across repeats).
const PAPER = { filter: `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch" seed="S" result="n"/>
  <feTurbulence type="fractalNoise" baseFrequency=".012 .9" numOctaves="2" stitchTiles="stitch" seed="S"/>
  <feComposite in2="n" operator="arithmetic" k2=".25" k3=".75"/>
  <feColorMatrix values="0 0 0 0 .32  0 0 0 0 .27  0 0 0 0 .2  1.1 0 0 0 -.5"/>` };
// Bookcloth: warp and weft threads, for multiplying over the cover colour.
const LINEN = { filter: `<feTurbulence type="fractalNoise" baseFrequency="1.6 .05" numOctaves="2" stitchTiles="stitch" seed="S" result="a"/>
  <feTurbulence type="fractalNoise" baseFrequency=".05 1.6" numOctaves="2" stitchTiles="stitch" seed="S"/>
  <feComposite in2="a" operator="arithmetic" k2=".5" k3=".5"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.8 0 0 0 1.05"/>` };
// Dark walnut with long streaky grain, the desk the open notebook lies on (one landscape sheet, drawn to cover).
const WALNUT = { filter: `<feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="5" stitchTiles="stitch" seed="S"/>
  <feColorMatrix values=".4 0 0 0 .07  .25 0 0 0 .038  .15 0 0 0 .016  0 0 0 0 1"/>` };

const output = new URL("../public/textures/baked/", import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, layer, width, height] of [
  ["dirt", LAYERS[0], 1024, 640],
  ["grease", LAYERS[1], 1024, 640],
  ["wear", LAYERS[2], 1024, 640],
  ["chalk", CHALK, 1024, 640],
  ["paper", PAPER, 256, 256],
  ["linen", LINEN, 256, 256],
  ["walnut", WALNUT, 1536, 768],
] as const) {
  const svg = decodeURIComponent(layerUrl(layer, width, height, 241).split(",", 2)[1]);
  await sharp(Buffer.from(svg), { density: 72 }).webp({ quality: 90, effort: 5 })
    .toFile(new URL(`${name}.webp`, output).pathname);
}
// Evidence room surfaces, drawn as SVG filters in scripts/textures. As CSS backgrounds they were re-rasterized
// whenever the room's camera moved; as images they decode once.
for (const [name, width, height] of [["plaster-grain", 256, 256], ["plaster-stains", 512, 512], ["cork", 600, 600]] as const) {
  await sharp(new URL(`textures/${name}.svg`, import.meta.url).pathname, { density: 144 }).resize(width, height)
    .webp({ quality: 88, effort: 5 }).toFile(new URL(`${name}.webp`, output).pathname);
}
await sharp(new URL("../public/textures/holo-foil.svg", import.meta.url).pathname, { density: 144 })
  .resize(1024, 640)
  .webp({ quality: 90, effort: 5 })
  .toFile(new URL("holo-foil.webp", output).pathname);
console.log("Baked 11 surface textures.");
