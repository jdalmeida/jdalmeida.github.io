import { Suspense, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";

import {
  createCredentialBackTexture,
  createCredentialTexture,
  createLanyardTexture,
} from "./credential.mjs";
import { Band, LanyardLights } from "./Lanyard.jsx";
import {
  ANCHOR_HEIGHT,
  DIALOG_FRAME,
  DIALOG_SPAWN_DROP,
  fitDistance,
  framePosition,
  homeAnchors,
  homeFrame,
} from "./scene-config.mjs";

const FOV = 20;

// Keeps the whole world box in frame at any canvas size, aligned the way the
// frame asks for. The camera never rotates, so aiming it is a plain translation.
function FitCamera({ frame }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    const distance = fitDistance(frame, FOV, aspect);
    const [x, y] = framePosition(frame, FOV, aspect, distance);
    camera.rotation.set(0, 0, 0);
    camera.position.set(x, y, distance);
    camera.updateProjectionMatrix();
  }, [camera, frame, size.width, size.height]);

  return null;
}

// The dialog canvas covers the whole modal and lets pointer events through, so
// it listens on the modal instead of on itself. That means measuring the
// pointer against the canvas rather than against whatever it landed on.
const computeFromCanvas = (event, state) => {
  const rect = state.gl.domElement.getBoundingClientRect();
  state.pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  state.raycaster.setFromCamera(state.pointer, state.camera);
};

export function LanyardScene({ credentials, eventSource, mode, onReady, onSelect }) {
  const home = mode === "home";
  const frame = home ? homeFrame(credentials.length) : DIALOG_FRAME;
  const anchors = home
    ? homeAnchors(credentials.length)
    : [[0, ANCHOR_HEIGHT, 0]];

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: [0, frame.center, 30], rotation: [0, 0, 0], fov: FOV }}
        dpr={[1, 2]}
        eventSource={eventSource}
        gl={{ alpha: true }}
        onCreated={(state) => {
          state.gl.setClearColor(new THREE.Color(0x000000), 0);
          if (eventSource) state.setEvents({ compute: computeFromCanvas });
          onReady?.();
        }}
      >
        <FitCamera frame={frame} />
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={1 / 60}>
            {credentials.map((credential, index) => (
              <Band
                key={credential.id}
                anchor={anchors[index]}
                frontImage={createCredentialTexture(credential)}
                backImage={createCredentialBackTexture(credential)}
                lanyardImage={createLanyardTexture(credential)}
                lanyardWidth={home ? 0.9 : 2}
                spawnDrop={home ? 0 : DIALOG_SPAWN_DROP}
                onSelect={() => onSelect?.(credential.id)}
              />
            ))}
          </Physics>
        </Suspense>
        <Suspense fallback={null}>
          <LanyardLights />
        </Suspense>
      </Canvas>
    </div>
  );
}
