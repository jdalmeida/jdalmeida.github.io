import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("builds JSX with the React automatic runtime", async () => {
  const packageJSON = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(packageJSON.scripts["build:lanyard"], /--jsx=automatic/);
});
