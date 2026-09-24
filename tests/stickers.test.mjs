import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";

test("every sticker has a baked raster image for the scene", () => {
  const files = readdirSync("public/stickers");
  for (const svg of files.filter((file) => file.endsWith(".svg"))) {
    const webp = svg.replace(/\.svg$/, ".webp");
    assert.ok(files.includes(webp), `${webp} is missing`);
    assert.equal(readFileSync(`public/stickers/${webp}`).toString("ascii", 8, 12), "WEBP");
  }
});
