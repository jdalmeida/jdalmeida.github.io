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
import { DIALOG_FRAME, HOME_FRAME, fitDistance, homeAnchors } from "./scene-config.mjs";

const FOV = 20;

// Keeps the whole world box in frame at any canvas size. The camera never
// rotates, so the box center is a plain vertical offset.
function FitCamera({ frame }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    camera.rotation.set(0, 0, 0);
    camera.position.set(
      0,
      frame.center,
      fitDistance(frame, FOV, size.width / size.height),
    );
    camera.updateProjectionMatrix();
  }, [camera, frame, size.width, size.height]);

  return null;
}

export function LanyardScene({ credentials, mode, onReady, onSelect }) {
  const home = mode === "home";
  const frame = home ? HOME_FRAME : DIALOG_FRAME;
  const anchors = home ? homeAnchors(credentials.length) : [[0, 4, 0]];

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: [0, frame.center, 30], rotation: [0, 0, 0], fov: FOV }}
        dpr={[1, 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
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
