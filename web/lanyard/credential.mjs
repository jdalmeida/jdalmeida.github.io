const escapeXML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const toDataURI = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// The card model has a real slot punched through it. These rectangles are the
// slot, converted from the card.glb UV bounds into the coordinates of each
// texture. Keep them aligned with the model, or the printed eyelet drifts away
// from the metal clasp that hooks through the slot.
const FRONT_SLOT = { x: 475, y: 98, w: 50, h: 54 };
const BACK_SLOT = { x: 476, y: 94, w: 50, h: 55 };

// The clasp covers the slot itself, so the printed eyelet only shows as a ring
// around the clasp. The area inside the slot maps to the wall of the hole, where
// a dark fill reads as depth.
const RING_X = 26;
const RING_Y = 16;

const eyelet = ({ x, y, w, h }, ring, edge, wall) =>
  `<rect x="${x - RING_X}" y="${y - RING_Y}" width="${w + RING_X * 2}" height="${h + RING_Y * 2}" rx="${(h + RING_Y * 2) / 2}" fill="${ring}" stroke="${edge}" stroke-width="6"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${wall}"/>`;

// Tokens da marca assados na textura: um SVG num canvas WebGL não lê a folha de
// estilo, então os valores de `surface-100`, `ink-100`, `ink-300` e `on-accent`
// vivem aqui. Trocar um token do sistema pede a troca aqui junto.
const SURFACE = "#ffffff";
const SURFACE_SUNK = "#e9ebef";
const INK = "#0a0a0b";
const INK_MUTED = "#6b6f77";
const ON_FILL = "#ffffff";
const FONT_DISPLAY = "Space Grotesk,Helvetica Neue,Arial,sans-serif";
const FONT_SANS = "Instrument Sans,Helvetica Neue,Arial,sans-serif";
const FONT_MONO = "JetBrains Mono,ui-monospace,SF Mono,Menlo,monospace";

export const readCredential = (element) => ({
  id: element.dataset.eventId,
  name: element.dataset.eventName,
  place: element.dataset.eventPlace,
  year: element.dataset.eventYear,
  role: element.dataset.eventRole,
  color: element.dataset.eventColor,
  darkColor: element.dataset.eventDarkColor,
});

export const splitTitle = (value, maximum = 22) => {
  const words = value.trim().split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1);
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maximum || lines.length === 2) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }
  return lines;
};

// Space Grotesk Bold draws a bit under three fifths of an em per letter, so
// this keeps the longest line inside the card instead of letting a long event
// name run off the edge.
export const titleFontSize = (lines, maximum = 96) => {
  const longest = Math.max(...lines.map((line) => line.length), 1);
  return Math.min(maximum, Math.round(900 / (longest * 0.58)));
};

export const createCredentialTexture = (credential) => {
  const [titleOne, titleTwo = ""] = splitTitle(credential.name, 16);
  const size = titleFontSize([titleOne, titleTwo]);
  // A one-line title drops to the middle of the band, where two lines sit.
  const firstLine = titleTwo ? 640 : 700;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1450" viewBox="0 0 1000 1450">
    <rect width="1000" height="1450" rx="24" fill="${SURFACE}"/>
    <rect y="370" width="1000" height="850" fill="${credential.color}"/>
    <rect y="1220" width="1000" height="230" fill="${credential.darkColor}"/>
    <rect x="0" y="362" width="1000" height="8" fill="${INK}"/>
    ${eyelet(FRONT_SLOT, SURFACE_SUNK, INK, INK)}
    <text x="500" y="230" text-anchor="middle" font-family="${FONT_MONO}" font-size="30" font-weight="600" letter-spacing="12" fill="${INK_MUTED}">CREDENCIAL</text>
    <text x="500" y="300" text-anchor="middle" font-family="${FONT_SANS}" font-size="34" font-weight="600" fill="${INK}">João Gabriel de Almeida</text>
    <text x="500" y="${firstLine}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="${size}" font-weight="700" fill="${ON_FILL}">${escapeXML(titleOne)}</text>
    <text x="500" y="${firstLine + size + 4}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="${size}" font-weight="700" fill="${ON_FILL}">${escapeXML(titleTwo)}</text>
    <rect x="350" y="838" width="300" height="4" fill="${ON_FILL}" opacity=".5"/>
    <text x="500" y="948" text-anchor="middle" font-family="${FONT_MONO}" font-size="86" font-weight="600" letter-spacing="18" dx="9" fill="${ON_FILL}">${escapeXML(credential.year)}</text>
    <text x="500" y="1030" text-anchor="middle" font-family="${FONT_MONO}" font-size="32" letter-spacing="10" fill="${ON_FILL}" opacity=".82" style="text-transform:uppercase">${escapeXML(credential.place)}</text>
    <text x="500" y="1360" text-anchor="middle" font-family="${FONT_MONO}" font-size="64" font-weight="600" letter-spacing="9" fill="${ON_FILL}" style="text-transform:uppercase">${escapeXML(credential.role)}</text>
    <rect x="3" y="3" width="994" height="1444" rx="22" fill="none" stroke="${INK}" stroke-width="6"/>
  </svg>`;
  return toDataURI(svg);
};

// The card back keeps the event palette so a spinning credential still reads as
// the same event. It leads with the year and the title, like the front, and
// closes with the name in small type.
export const createCredentialBackTexture = (credential) => {
  const [titleOne, titleTwo = ""] = splitTitle(credential.name, 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1450" viewBox="0 0 1000 1450">
    <rect width="1000" height="1450" rx="24" fill="${credential.darkColor}"/>
    <rect width="1000" height="300" fill="${credential.color}"/>
    ${eyelet(BACK_SLOT, "rgba(255,255,255,.18)", "rgba(255,255,255,.4)", INK)}
    <text x="500" y="258" text-anchor="middle" font-family="${FONT_MONO}" font-size="98" font-weight="600" letter-spacing="18" fill="${ON_FILL}">${escapeXML(credential.year)}</text>
    <text x="500" y="560" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="62" font-weight="700" letter-spacing="2" fill="${ON_FILL}" style="text-transform:uppercase">${escapeXML(titleOne)}</text>
    <text x="500" y="646" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="62" font-weight="700" letter-spacing="2" fill="${ON_FILL}" style="text-transform:uppercase">${escapeXML(titleTwo)}</text>
    <text x="500" y="742" text-anchor="middle" font-family="${FONT_MONO}" font-size="38" letter-spacing="6" fill="${ON_FILL}" opacity=".72">${escapeXML(credential.place)}</text>
    <rect x="250" y="856" width="500" height="8" fill="${credential.color}"/>
    <rect x="250" y="890" width="500" height="8" fill="${credential.color}" opacity=".6"/>
    <rect x="250" y="924" width="500" height="8" fill="${credential.color}" opacity=".3"/>
    <text x="500" y="1108" text-anchor="middle" font-family="${FONT_MONO}" font-size="28" font-weight="600" letter-spacing="11" fill="${ON_FILL}" opacity=".66">CREDENCIAL DE</text>
    <text x="500" y="1180" text-anchor="middle" font-family="${FONT_SANS}" font-size="52" font-weight="400" fill="${ON_FILL}" opacity=".92">João Gabriel de Almeida</text>
    <rect y="1290" width="1000" height="160" fill="${credential.color}"/>
    <text x="500" y="1398" text-anchor="middle" font-family="${FONT_MONO}" font-size="58" font-weight="600" letter-spacing="9" fill="${ON_FILL}" style="text-transform:uppercase">${escapeXML(credential.role)}</text>
  </svg>`;
  return toDataURI(svg);
};

// One seamless strap tile. textLength forces any event title to fill the same
// width, so a long name shrinks instead of overflowing the tile.
export const createLanyardTexture = (credential) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128" viewBox="0 0 512 128">
    <rect width="512" height="128" fill="${credential.darkColor}"/>
    <rect y="10" width="512" height="5" fill="${credential.color}"/>
    <rect y="113" width="512" height="5" fill="${credential.color}"/>
    <text x="256" y="80" text-anchor="middle" textLength="424" lengthAdjust="spacingAndGlyphs" font-family="${FONT_MONO}" font-size="48" font-weight="600" fill="${ON_FILL}" opacity=".92" style="text-transform:uppercase">${escapeXML(credential.name)}</text>
  </svg>`;
  return toDataURI(svg);
};
