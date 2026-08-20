# React Bits Lanyard Design

## Status

The user approved this design on August 19, 2026.

## Context

The portfolio uses Go templates, HTMX, CSS, and plain JavaScript. It does not have a frontend build configuration.

The event section shows four HTML credentials. Each credential opens an HTMX event dialog.

The desktop experience will use the [React Bits Lanyard](https://www.reactbits.dev/components/lanyard). The implementation will follow the [React Bits source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Lanyard/Lanyard.jsx).

## Goals

- Use the React Bits model, rope, physics, lighting, materials, and drag behavior.
- Convert the current credential design into a texture for the model.
- Let the four desktop credentials collide in one physics world.
- Use one Lanyard in the desktop event dialog.
- Keep the current HTML and CSS experience below 821 pixels.
- Keep HTMX event navigation and gallery preload behavior.

## Non-goals

- Do not convert the portfolio into a React application.
- Do not change the mobile credential layout.
- Do not change event data, gallery data, or admin features.
- Do not replace HTMX navigation.

## Breakpoint

Desktop mode starts at 821 pixels. Mobile mode ends at 820 pixels.

Mobile mode will not download the React, Three.js, or Rapier bundle. A small loader will check the breakpoint first.

If the viewport becomes wider, the loader will import the desktop bundle. A later narrow resize can hide the Canvas without another download.

## Desktop architecture

The page will use React as an island. Go will still render the complete page and all fallback content.

The home event section will contain one Canvas and one Rapier physics world. Four Lanyard instances will share this world.

Each instance will use the React Bits rope joints and card collider. Shared Rapier colliders will make the credentials interact.

The event dialog will contain a separate Canvas. This Canvas will use one Lanyard instance and the same component code.

## React Bits fidelity

The implementation will preserve these React Bits parts:

- The `card.glb` model.
- The `lanyard.png` texture.
- The MeshLine rope.
- The Rapier rope joints and spherical joint.
- The card and rope colliders.
- The Catmull-Rom curve update.
- The card angular correction.
- The environment lights.
- The physical card material.
- The pointer capture and kinematic drag.

The shared scene needs two extensions. A Lanyard instance will accept an anchor position and an event selection callback.

These extensions will not replace the original physics. They only place each instance and connect a short click to HTMX.

## Credential texture

The model will receive the current credential as a front texture. The Canvas will create one SVG data URL for each event.

The texture will include these values:

- Event name.
- Short location.
- Year.
- Participant name.
- Role.
- Event color.
- Dark event color.

The texture will use the model's current front UV rectangle. The model will keep its original edge, clip, clamp, and back materials.

## Home interaction

Each credential will start from a different anchor position. The four credentials will share the same depth range.

A pointer drag will use the React Bits kinematic movement. A release will return the credential to Rapier control.

Card and rope colliders will respond when credentials touch. The ropes can also affect nearby cards through their segment colliders.

A pointer release with little movement will select the event. The React island will activate the existing hidden HTMX button.

The HTMX button will keep its preload attributes. The gallery preload behavior will not change.

## Dialog interaction

The desktop dialog will mount one Lanyard with the selected event texture. The current event record and gallery will stay unchanged.

The previous, next, and close controls will keep their current HTMX behavior. A new HTMX swap will mount the next dialog Lanyard.

The mobile dialog will keep its current responsive layout. This layout hides the credential below 821 pixels.

## Fallback behavior

The server will always render the current HTML credentials. The desktop Canvas will replace them only after a successful mount.

If WebGL or the bundle fails, the HTML credentials will remain visible. The event dialog will use the same fallback rule.

The loader will report this error: `The desktop lanyard could not start.`

## Files and build output

The implementation will add these source areas:

- `web/lanyard/` for React source and tests.
- `public/assets/lanyard/` for the React Bits model and rope texture.
- `public/build/` for the generated desktop bundle.
- `package.json` and `package-lock.json` for build dependencies.

The build will use esbuild. The `npm run build:lanyard` command will create the browser bundle.

The repository will include the generated bundle. Vercel and the Go server will serve it as a static file.

The project will record the React Bits MIT source in its third-party notice.

## Tests

Node tests will verify texture output, text escaping, and event data parsing. The tests will run before each related implementation change.

Go tests will verify desktop hosts, mobile fallback content, loader order, and static routes.

The build check will create the desktop bundle without warnings. Go tests, Go vet, and the Go build must also pass.

Chrome will verify these behaviors:

1. Load four credentials in one desktop Canvas.
2. Drag one credential into another credential.
3. Open an event with a short click.
4. Load one Lanyard in the desktop dialog.
5. Keep the HTML credential layout on mobile.
6. Avoid the desktop bundle request on an initial mobile load.
7. Show no browser console errors.

## Acceptance criteria

- Desktop credentials use the React Bits 3D component.
- The four home credentials interact through Rapier collisions.
- The existing credential design appears on each 3D model.
- Desktop drag and short-click behavior both work.
- The desktop dialog uses the same 3D component.
- Mobile home and dialog views keep the current implementation.
- A failed desktop enhancement leaves a working HTML fallback.
- All automated checks pass.
