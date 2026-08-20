const escapeXML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

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

export const createCredentialTexture = (credential) => {
  const [titleOne, titleTwo = ""] = splitTitle(credential.name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1450" viewBox="0 0 1000 1450">
    <rect width="1000" height="1450" rx="46" fill="#f5eedf"/>
    <rect y="370" width="1000" height="850" fill="${credential.color}"/>
    <path d="M0 370h1000v850H0z" fill="url(#shine)"/>
    <rect y="1220" width="1000" height="230" fill="${credential.darkColor}"/>
    <rect x="405" y="65" width="190" height="48" rx="24" fill="#ded5c3" stroke="#a99f8d" stroke-width="6"/>
    <text x="500" y="188" text-anchor="middle" font-family="Space Mono,monospace" font-size="54" font-weight="700" fill="#2b231a" style="text-transform:uppercase">${escapeXML(titleOne)}</text>
    <text x="500" y="252" text-anchor="middle" font-family="Space Mono,monospace" font-size="54" font-weight="700" fill="#2b231a" style="text-transform:uppercase">${escapeXML(titleTwo)}</text>
    <text x="500" y="325" text-anchor="middle" font-family="Space Mono,monospace" font-size="36" fill="#6f6252">${escapeXML(credential.place)} · ${escapeXML(credential.year)}</text>
    <text x="500" y="575" text-anchor="middle" font-family="Space Mono,monospace" font-size="34" letter-spacing="12" fill="#fff" opacity=".75">CREDENCIAL</text>
    <text x="500" y="800" text-anchor="middle" font-family="Vollkorn,Georgia,serif" font-size="128" font-weight="600" fill="#fff">João Gabriel</text>
    <text x="500" y="920" text-anchor="middle" font-family="Vollkorn,Georgia,serif" font-size="76" font-style="italic" fill="#fff">de Almeida</text>
    <text x="500" y="1360" text-anchor="middle" font-family="Space Mono,monospace" font-size="64" font-weight="700" letter-spacing="9" fill="#fff" style="text-transform:uppercase">${escapeXML(credential.role)}</text>
    <defs><linearGradient id="shine" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".07"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
