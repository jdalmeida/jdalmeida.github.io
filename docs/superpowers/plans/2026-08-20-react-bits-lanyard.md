# React Bits Lanyard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the React Bits Lanyard to desktop credentials while the mobile layout stays unchanged.

**Architecture:** React will mount inside two Go-rendered islands. The home island will place four Lanyards in one Rapier world. The dialog island will place one Lanyard in a separate world.

**Tech Stack:** Go 1.24, HTMX 2, React 19, Three.js, React Three Fiber, Drei, React Three Rapier, MeshLine, esbuild, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-19-react-bits-lanyard-design.md`

## Global Constraints

- Desktop mode starts at 821 pixels.
- Mobile mode ends at 820 pixels.
- Mobile mode must not download the desktop bundle.
- The four home credentials must share one Rapier physics world.
- The mobile home and dialog must keep the current HTML and CSS.
- HTMX must still open and navigate event dialogs.
- A failed enhancement must leave the HTML credentials visible.
- Use the React Bits `card.glb`, `lanyard.png`, physics, lighting, and material settings.

---

### Task 1: Credential data and texture

**Files:**

- Create: `package.json`
- Create: `web/lanyard/credential.mjs`
- Create: `web/lanyard/credential.test.mjs`

**Interfaces:**

- Produces: `readCredential(element): Credential`
- Produces: `createCredentialTexture(credential): string`
- Produces: `splitTitle(value, maximum): string[]`
- `Credential` has `id`, `name`, `place`, `year`, `role`, `color`, and `darkColor` strings.

- [ ] **Step 1: Add the failing credential tests**

Create `web/lanyard/credential.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and verify the failure**

Run:

```bash
node --test web/lanyard/credential.test.mjs
```

Expected: FAIL because `web/lanyard/credential.mjs` does not exist.

- [ ] **Step 3: Add the credential module**

Create `web/lanyard/credential.mjs` with these functions:

```js
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1450">
    <rect width="1000" height="1450" rx="46" fill="#f5eedf"/>
    <rect y="370" width="1000" height="850" fill="${credential.color}"/>
    <rect y="1220" width="1000" height="230" fill="${credential.darkColor}"/>
    <rect x="405" y="65" width="190" height="48" rx="24" fill="#ded5c3" stroke="#a99f8d" stroke-width="6"/>
    <text x="500" y="188" text-anchor="middle" font-family="monospace" font-size="54" font-weight="700" fill="#2b231a">${escapeXML(titleOne)}</text>
    <text x="500" y="252" text-anchor="middle" font-family="monospace" font-size="54" font-weight="700" fill="#2b231a">${escapeXML(titleTwo)}</text>
    <text x="500" y="325" text-anchor="middle" font-family="monospace" font-size="36" fill="#6f6252">${escapeXML(credential.place)} · ${escapeXML(credential.year)}</text>
    <text x="500" y="575" text-anchor="middle" font-family="monospace" font-size="34" letter-spacing="12" fill="#fff" opacity=".78">CREDENCIAL</text>
    <text x="500" y="800" text-anchor="middle" font-family="Georgia,serif" font-size="128" font-weight="700" fill="#fff">João Gabriel</text>
    <text x="500" y="920" text-anchor="middle" font-family="Georgia,serif" font-size="76" font-style="italic" fill="#fff">de Almeida</text>
    <text x="500" y="1360" text-anchor="middle" font-family="monospace" font-size="64" font-weight="700" letter-spacing="9" fill="#fff">${escapeXML(credential.role).toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
```

Create `package.json`:

```json
{
  "name": "jdalmeida-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "build:lanyard": "esbuild web/lanyard/index.jsx --bundle --format=esm --minify --sourcemap --outfile=public/build/lanyard-desktop.js",
    "test:lanyard": "node --test web/lanyard/*.test.mjs"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.4",
    "@react-three/fiber": "^9.3.0",
    "@react-three/rapier": "^2.1.0",
    "meshline": "^3.3.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.180.0"
  },
  "devDependencies": {
    "esbuild": "^0.25.0"
  }
}
```

- [ ] **Step 4: Run the credential tests**

Run:

```bash
npm run test:lanyard
```

Expected: PASS with three tests.

- [ ] **Step 5: Commit the credential module**

```bash
git add package.json web/lanyard/credential.mjs web/lanyard/credential.test.mjs
git commit -m "feat: add credential texture generator"
```

---

### Task 2: Shared React Bits physics scene

**Files:**

- Create: `web/lanyard/scene-config.mjs`
- Create: `web/lanyard/scene-config.test.mjs`
- Create: `web/lanyard/Lanyard.jsx`
- Create: `web/lanyard/Scenes.jsx`
- Create: `web/lanyard/index.jsx`
- Create: `web/lanyard/lanyard.css`
- Create: `public/assets/lanyard/card.glb`
- Create: `public/assets/lanyard/lanyard.png`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `package-lock.json`

**Interfaces:**

- Consumes: `Credential`, `readCredential`, and `createCredentialTexture` from Task 1.
- Produces: `homeAnchors(count): [number, number, number][]`
- Produces: `isShortClick(delta): boolean`
- Produces: `LanyardScene({ credentials, mode, onReady, onSelect })`
- Produces: `mountLanyards(root): void`

- [ ] **Step 1: Add the failing scene configuration tests**

Create `web/lanyard/scene-config.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";

import { homeAnchors, isShortClick } from "./scene-config.mjs";

test("places four anchors around the center of one physics world", () => {
  assert.deepEqual(homeAnchors(4), [
    [-5.4, 4, 0],
    [-1.8, 4, 0.15],
    [1.8, 4, -0.15],
    [5.4, 4, 0],
  ]);
});

test("selects only a pointer release with little movement", () => {
  assert.equal(isShortClick(4), true);
  assert.equal(isShortClick(7), false);
});
```

- [ ] **Step 2: Run the scene tests and verify the failure**

Run:

```bash
npm run test:lanyard
```

Expected: FAIL because `web/lanyard/scene-config.mjs` does not exist.

- [ ] **Step 3: Add the scene configuration module**

Create `web/lanyard/scene-config.mjs`:

```js
const HOME_ANCHORS = [
  [-5.4, 4, 0],
  [-1.8, 4, 0.15],
  [1.8, 4, -0.15],
  [5.4, 4, 0],
];

export const homeAnchors = (count) => HOME_ANCHORS.slice(0, count);
export const isShortClick = (delta) => delta <= 5;
```

- [ ] **Step 4: Run the scene tests**

Run:

```bash
npm run test:lanyard
```

Expected: PASS with five tests.

- [ ] **Step 5: Install the exact component dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` records React 19 and the React Bits physics dependencies.

- [ ] **Step 6: Add the React Bits assets**

Download these two files without modification:

```text
https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/Lanyard/card.glb
https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/Lanyard/lanyard.png
```

Save them as `public/assets/lanyard/card.glb` and `public/assets/lanyard/lanyard.png`.

- [ ] **Step 7: Add the adapted React Bits component**

Create `web/lanyard/Lanyard.jsx` from the approved React Bits source.

Use these asset constants:

```js
const cardGLB = "/assets/lanyard/card.glb";
const lanyardImage = "/assets/lanyard/lanyard.png";
```

Keep the React Bits texture atlas, joints, curve, material, drag code, environment, and light values.

Export `Band` and `LanyardLights` for the shared scene.

Import `isShortClick` from `scene-config.mjs`.

Change `Band` to accept these exact props:

```js
function Band({
  anchor = [0, 4, 0],
  frontImage,
  isMobile = false,
  lanyardWidth = 1,
  onSelect,
})
```

Place the existing rigid-body group at `anchor`. Use `event.delta` in `onPointerUp`:

```jsx
onPointerUp={(event) => {
  event.target.releasePointerCapture(event.pointerId);
  drag(false);
  if (isShortClick(event.delta)) onSelect?.();
}}
```

Keep one `CuboidCollider` on each card. Keep one `BallCollider` on each rope segment.

- [ ] **Step 8: Add the shared and dialog scenes**

Create `web/lanyard/Scenes.jsx` with one shared `Physics` element for home:

```jsx
import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";

import { createCredentialTexture } from "./credential.mjs";
import { Band, LanyardLights } from "./Lanyard.jsx";
import { homeAnchors } from "./scene-config.mjs";

export function LanyardScene({ credentials, mode, onReady, onSelect }) {
  const home = mode === "home";
  const anchors = home ? homeAnchors(credentials.length) : [[0, 4, 0]];
  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: [0, 0, home ? 32 : 30], fov: home ? 34 : 20 }}
        dpr={[1, 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={1 / 60}>
            {credentials.map((credential, index) => (
              <Band
                key={credential.id}
                anchor={anchors[index]}
                frontImage={createCredentialTexture(credential)}
                lanyardWidth={home ? 0.72 : 1}
                onSelect={() => onSelect?.(credential.id)}
              />
            ))}
          </Physics>
          <LanyardLights />
          <SceneReady onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

Use this readiness component inside the shared Suspense boundary:

```jsx
function SceneReady({ onReady }) {
  useEffect(() => onReady?.(), [onReady]);
  return null;
}
```

Move the four React Bits `Lightformer` elements into `LanyardLights` without value changes.

- [ ] **Step 9: Add island mounting**

Create `web/lanyard/index.jsx`. Export and call `mountLanyards(root = document)`.

Import `Component` from React for the error boundary.

The home mount must read all `[data-lanyard-event]` buttons. A selection must focus and click the matching button.

Use this selection code to keep the existing gallery preload:

```js
const selectEvent = (id) => {
  const button = document.querySelector(`[data-lanyard-event][data-event-id="${CSS.escape(id)}"]`);
  button?.focus({ preventScroll: true });
  button?.click();
};
```

The dialog mount must read `[data-lanyard-dialog]`. Add `lanyard-react-root` to every host before React mounts.

Pass this callback to each scene:

```js
const markReady = () => {
  host.dataset.lanyardMounted = "true";
};
```

Add this React error boundary around each scene:

```jsx
class LanyardErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    delete this.props.host.dataset.lanyardMounted;
    console.error("The desktop lanyard could not start.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
```

Listen for `htmx:afterSwap` and call `mountLanyards(event.target)`. Use a `Map` to prevent duplicate roots.

Use one `MutationObserver` to unmount removed roots:

```js
const roots = new Map();
const observer = new MutationObserver(() => {
  for (const [host, root] of roots) {
    if (!host.isConnected) {
      root.unmount();
      roots.delete(host);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

- [ ] **Step 10: Add component CSS and attribution**

Create `web/lanyard/lanyard.css`:

```css
.lanyard-react-root,
.lanyard-react-root .lanyard-wrapper,
.lanyard-react-root canvas {
  width: 100%;
  height: 100%;
}

.lanyard-react-root {
  position: relative;
  touch-action: none;
}

.lanyard-react-root canvas {
  display: block;
}
```

Create `THIRD_PARTY_NOTICES.md`:

```markdown
# Third-party notices

## React Bits Lanyard

Source: https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/Lanyard

License: MIT

This project adapts `Lanyard.jsx`, `Lanyard.css`, `card.glb`, and `lanyard.png`.
```

- [ ] **Step 11: Build the React island**

Run:

```bash
npm run build:lanyard
```

Expected: esbuild creates `public/build/lanyard-desktop.js` and its source map without warnings.

- [ ] **Step 12: Commit the physics scene**

```bash
git add package.json package-lock.json web/lanyard public/assets/lanyard public/build THIRD_PARTY_NOTICES.md
git commit -m "feat: add shared React Bits lanyard scene"
```

---

### Task 3: Go and HTMX integration

**Files:**

- Modify: `site/app_test.go`
- Modify: `site/app.go`
- Modify: `site/templates/common.html`
- Modify: `site/templates/home.html`
- Modify: `site/templates/event-dialog.html`
- Create: `public/lanyard-loader.js`
- Modify: `vercel.json`

**Interfaces:**

- Consumes: `mountLanyards(root)` from Task 2.
- Produces: `[data-lanyard-event]` server data for each home credential.
- Produces: `[data-lanyard-home]` and `[data-lanyard-dialog]` mount hosts.
- Produces: `/lanyard-loader.js` and `/build/` static routes.

- [ ] **Step 1: Add failing Go integration tests**

Add these tests to `site/app_test.go`:

```go
func TestHomeProvidesDesktopLanyardDataAndMobileFallback(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))
	body := response.Body.String()

	if strings.Count(body, `data-lanyard-event`) != len(events) {
		t.Fatal("the home page does not provide one Lanyard event for each credential")
	}
	for _, value := range []string{
		`data-lanyard-home`,
		`data-event-name="South Summit Brazil"`,
		`data-event-color="#fd525b"`,
		`hx-get="/partials/events/south-summit"`,
		`class="event-badge"`,
	} {
		if !strings.Contains(body, value) {
			t.Fatalf("the home page does not contain %q", value)
		}
	}
}

func TestEventDialogProvidesDesktopLanyardAndMobileFallback(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	response := httptest.NewRecorder()
	New().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/partials/events/south-summit", nil))
	body := response.Body.String()

	for _, value := range []string{
		`data-lanyard-dialog`,
		`data-event-id="south-summit"`,
		`class="lanyard-wrap"`,
		`class="event-badge"`,
	} {
		if !strings.Contains(body, value) {
			t.Fatalf("the event dialog does not contain %q", value)
		}
	}
}

func TestLanyardStaticFilesAreServed(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Chdir("..")
	handler := New()
	for _, path := range []string{"/lanyard-loader.js", "/build/lanyard-desktop.js"} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		if response.Code != http.StatusOK {
			t.Fatalf("GET %s status = %d, want 200", path, response.Code)
		}
	}
}
```

- [ ] **Step 2: Run the Go tests and verify the failure**

Run:

```bash
GOCACHE=/tmp/jdalmeida-go-cache go test ./site -run 'Test(HomeProvidesDesktopLanyardDataAndMobileFallback|EventDialogProvidesDesktopLanyardAndMobileFallback|LanyardStaticFilesAreServed)$' -count=1
```

Expected: FAIL because the hosts and loader route do not exist.

- [ ] **Step 3: Add home event data and the home host**

Add these attributes to each existing `.badge-button` in `site/templates/home.html`:

```html
data-lanyard-event
data-event-id="{{ $event.ID }}"
data-event-name="{{ $event.Name }}"
data-event-place="{{ $event.ShortPlace }}"
data-event-year="{{ $event.Year }}"
data-event-role="{{ $event.Role }}"
data-event-color="{{ $event.Color }}"
data-event-dark-color="{{ $event.DarkColor }}"
```

Add this host after `.badge-stack`:

```html
<div class="desktop-lanyard desktop-lanyard-home" data-lanyard-home aria-label="Credenciais interativas"></div>
```

- [ ] **Step 4: Add dialog data and the dialog host**

Keep `.lanyard-wrap` unchanged. Add this sibling in `site/templates/event-dialog.html`:

```html
<div class="desktop-lanyard desktop-lanyard-dialog"
     data-lanyard-dialog
     data-event-id="{{ .Event.ID }}"
     data-event-name="{{ .Event.Name }}"
     data-event-place="{{ .Event.ShortPlace }}"
     data-event-year="{{ .Event.Year }}"
     data-event-role="{{ .Event.Role }}"
     data-event-color="{{ .Event.Color }}"
     data-event-dark-color="{{ .Event.DarkColor }}"
     aria-label="Credencial interativa de {{ .Event.Name }}"></div>
```

- [ ] **Step 5: Add the desktop-only loader**

Create `public/lanyard-loader.js`:

```js
(() => {
  "use strict";
  const desktop = window.matchMedia("(min-width: 821px)");
  let requested = false;
  const load = () => {
    if (!desktop.matches || requested) return;
    requested = true;
    import("/build/lanyard-desktop.js").catch((error) => {
      requested = false;
      console.error("The desktop lanyard could not start.", error);
    });
  };
  desktop.addEventListener("change", load);
  load();
})();
```

Load `/lanyard-loader.js?v=20260820-1` after HTMX and before `/site.js` in `site/templates/common.html`.

- [ ] **Step 6: Add static routes and cache headers**

Add these handlers in `site/app.go`:

```go
mux.Handle("GET /build/", public)
mux.Handle("GET /lanyard-loader.js", public)
```

Add immutable cache headers for `/build/(.*)` in `vercel.json`. Keep the current asset and upload headers.

- [ ] **Step 7: Run the Go integration tests**

Run:

```bash
GOCACHE=/tmp/jdalmeida-go-cache go test ./site -run 'Test(HomeProvidesDesktopLanyardDataAndMobileFallback|EventDialogProvidesDesktopLanyardAndMobileFallback|LanyardStaticFilesAreServed)$' -count=1
```

Expected: PASS with three tests.

- [ ] **Step 8: Commit the server integration**

```bash
git add site/app_test.go site/app.go site/templates/common.html site/templates/home.html site/templates/event-dialog.html public/lanyard-loader.js vercel.json
git commit -m "feat: mount desktop lanyard islands"
```

---

### Task 4: Responsive fallback and full verification

**Files:**

- Modify: `public/styles.css`
- Modify: `site/templates/common.html`
- Modify: `README.md`

**Interfaces:**

- Consumes: `data-lanyard-mounted="true"` from Task 2.
- Produces: desktop Canvas dimensions and mounted fallback states.
- Preserves: all current mobile credential styles through 820 pixels.

- [ ] **Step 1: Add desktop island styles**

Append these rules to `public/styles.css`:

```css
.desktop-lanyard {
  display: none;
}

@media (min-width: 821px) {
  .desktop-lanyard {
    display: block;
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }

  .desktop-lanyard[data-lanyard-mounted="true"] {
    position: relative;
    visibility: visible;
    pointer-events: auto;
  }

  .home-events:has(.desktop-lanyard-home[data-lanyard-mounted="true"]) .badge-stack {
    position: absolute;
    width: 1px;
    height: 1px;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    pointer-events: none;
  }

  .desktop-lanyard-home {
    width: min(1180px, 100vw);
    height: 640px;
    margin: 20px auto -30px;
  }

  .dialog-body:has(.desktop-lanyard-dialog[data-lanyard-mounted="true"]) .lanyard-wrap {
    display: none;
  }

  .desktop-lanyard-dialog {
    width: 310px;
    height: 554px;
  }
}
```

Do not change any rule inside a mobile media query.

- [ ] **Step 2: Update asset cache versions**

Change the stylesheet query in `site/templates/common.html` to `/styles.css?v=20260820-1`.

Keep the existing site script query unchanged because this task does not change `public/site.js`.

- [ ] **Step 3: Document the frontend build**

Add this section to `README.md`:

````markdown
## Desktop Lanyard

The desktop event section uses the React Bits Lanyard in a React island. Mobile browsers keep the server-rendered credential layout.

Install the frontend dependencies and rebuild the committed bundle after a change in `web/lanyard`.

```bash
npm install
npm run test:lanyard
npm run build:lanyard
```
````

- [ ] **Step 4: Run all automated checks**

Run:

```bash
npm run test:lanyard
npm run build:lanyard
GOCACHE=/tmp/jdalmeida-go-cache go test ./...
GOCACHE=/tmp/jdalmeida-go-cache go vet ./...
GOCACHE=/tmp/jdalmeida-go-cache go build ./cmd/server
git diff --check
```

Expected: every command exits with code 0. The test output has no failures.

- [ ] **Step 5: Verify desktop behavior in Chrome**

Start the Go server with `DATABASE_URL=` and `PORT=4173`.

Use a 1440 by 1100 viewport. Verify one Canvas contains four credentials.

Drag one credential into another. Verify that both credentials respond to the collision.

Use a short click on one credential. Verify that the matching event dialog opens.

Verify that the desktop dialog contains one Canvas. Use the previous, next, and close controls.

Verify that the browser console has no errors.

- [ ] **Step 6: Verify mobile behavior in Chrome**

Use a 390 by 844 viewport and a new browser profile. Load the home page.

Verify that four HTML credentials remain visible. Verify that the current mobile grid stays unchanged.

Open one event. Verify that the current mobile event layout remains unchanged.

Verify that the mobile dialog does not contain a desktop Canvas.

Inspect performance resources. Verify that `/build/lanyard-desktop.js` is absent.

- [ ] **Step 7: Commit the responsive integration**

```bash
git add public/styles.css site/templates/common.html README.md public/build
git commit -m "feat: finish responsive lanyard integration"
```
