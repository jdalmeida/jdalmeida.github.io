import { readdir } from "node:fs/promises";
import sharp from "sharp";

const dir = new URL("../public/stickers/", import.meta.url);
const files = (await readdir(dir)).filter((file) => file.endsWith(".svg"));
for (const file of files) {
  await sharp(new URL(file, dir).pathname, { density: 144 })
    .resize(400, 400)
    .webp({ quality: 90, effort: 5 })
    .toFile(new URL(file.replace(/\.svg$/, ".webp"), dir).pathname);
}
console.log(`Baked ${files.length} stickers.`);
