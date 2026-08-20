import test from "node:test";
import assert from "node:assert/strict";

import {
  createCredentialBackTexture,
  createCredentialTexture,
  createLanyardTexture,
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

test("paints the card back with the event palette and event text", () => {
  const svg = decodeURIComponent(
    createCredentialBackTexture({
      id: "event",
      name: "Build & Ship",
      place: "Porto Alegre",
      year: "2026",
      role: "Dev & Leader",
      color: "#123456",
      darkColor: "#081522",
    }).split(",", 2)[1],
  );

  assert.match(svg, /fill="#081522"/);
  assert.match(svg, /fill="#123456"/);
  assert.match(svg, /Build &amp; Ship/);
  assert.match(svg, /Porto Alegre/);
  assert.match(svg, /2026/);
  assert.doesNotMatch(svg, /#f5eedf/);
});

test("paints the strap with the event palette and a fitted title", () => {
  const svg = decodeURIComponent(
    createLanyardTexture({
      id: "event",
      name: "3º Hackathon de Venâncio Aires",
      place: "Venâncio Aires",
      year: "2024",
      role: "Dev & Leader",
      color: "#1f46bf",
      darkColor: "#0e1b62",
    }).split(",", 2)[1],
  );

  assert.match(svg, /fill="#0e1b62"/);
  assert.match(svg, /fill="#1f46bf"/);
  assert.match(svg, /textLength="424"/);
  assert.match(svg, /3º Hackathon de Venâncio Aires/);
});

test("prints the eyelet where the card model has its slot", () => {
  const credential = {
    id: "event",
    name: "Amcham SX",
    place: "Flores da Cunha",
    year: "2025",
    role: "Atendee",
    color: "#1739c9",
    darkColor: "#091747",
  };
  const front = decodeURIComponent(
    createCredentialTexture(credential).split(",", 2)[1],
  );
  const back = decodeURIComponent(
    createCredentialBackTexture(credential).split(",", 2)[1],
  );

  // The slot of card.glb, in the coordinates of each texture.
  assert.match(front, /x="475" y="98" width="50" height="54"/);
  assert.match(back, /x="476" y="94" width="50" height="55"/);
  // No text may run into the slot. The first line starts below it.
  assert.match(front, /<text x="500" y="212"/);
  assert.match(back, /<text x="500" y="258"/);
});
