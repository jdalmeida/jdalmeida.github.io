import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";

import { createCredentialTexture } from "./credential.mjs";
import { Band, LanyardLights } from "./Lanyard.jsx";
import { homeAnchors } from "./scene-config.mjs";

function SceneReady({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

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
