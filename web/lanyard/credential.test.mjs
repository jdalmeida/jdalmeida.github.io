import test from "node:test";
import assert from "node:assert/strict";

import {
  createCredentialTexture,
  readCredential,
  splitTitle,
} from "./credential.mjs";

test("reads event values from a server-rendered element", () => {
  const credential = readCredential({
    dataset: {
      eventId: "south-summit",
      eventName: "South Summit Brazil",
      eventPlace: "Porto Alegre",
      eventYear: "2026",
      eventRole: "Corps",
      eventColor: "#fd525b",
      eventDarkColor: "#370c3b",
    },
  });

  assert.deepEqual(credential, {
    id: "south-summit",
    name: "South Summit Brazil",
    place: "Porto Alegre",
    year: "2026",
    role: "Corps",
    color: "#fd525b",
    darkColor: "#370c3b",
  });
});

test("splits a long event title into two balanced lines", () => {
  assert.deepEqual(splitTitle("Techstars Startup Weekend", 18), [
    "Techstars Startup",
    "Weekend",
  ]);
});

test("creates an encoded SVG texture with escaped event text", () => {
  const texture = createCredentialTexture({
    id: "event",
    name: "Build & Ship <2026>",
    place: "Porto Alegre",
    year: "2026",
    role: "Dev & Leader",
    color: "#123456",
    darkColor: "#081522",
  });

  assert.match(texture, /^data:image\/svg\+xml;charset=utf-8,/);
  const svg = decodeURIComponent(texture.split(",", 2)[1]);
  assert.match(svg, /Build &amp; Ship/);
  assert.match(svg, /&lt;2026&gt;/);
  assert.match(svg, /fill="#123456"/);
  assert.match(svg, /Dev &amp; Leader/);
});
