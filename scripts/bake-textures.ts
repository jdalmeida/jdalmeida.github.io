import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { LAYERS, layerUrl } from "../components/ui/grime";
import { CHALK } from "../components/ui/desk-textures";

const output = new URL("../public/textures/baked/", import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, layer, width, height] of [
  ["dirt", LAYERS[0], 1024, 640],
  ["grease", LAYERS[1], 1024, 640],
  ["wear", LAYERS[2], 1024, 640],
  ["chalk", CHALK, 1024, 640],
] as const) {
  const svg = decodeURIComponent(layerUrl(layer, width, height, 241).split(",", 2)[1]);
  await sharp(Buffer.from(svg), { density: 72 }).webp({ quality: 90, effort: 5 })
    .toFile(new URL(`${name}.webp`, output).pathname);
}
await sharp(new URL("../public/textures/holo-foil.svg", import.meta.url).pathname, { density: 144 })
  .resize(1024, 640)
  .webp({ quality: 90, effort: 5 })
  .toFile(new URL("holo-foil.webp", output).pathname);
console.log("Baked 5 surface textures.");
