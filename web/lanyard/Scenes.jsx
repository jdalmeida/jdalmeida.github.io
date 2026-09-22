import { Suspense, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";

import {
  createCredentialBackTexture,
  createCredentialTexture,
  createLanyardTexture,
} from "./credential.mjs";
import { Band, LanyardLights, LooseStrap } from "./Lanyard.jsx";
import {
  ANCHOR_HEIGHT,
  BREEZE_PHASE_STEP,
  DIALOG_FRAME,
  DIALOG_SPAWN_DROP,
  LOOSE_STRAPS,
  fitDistance,
  framePosition,
  heroAnchors,
  heroFrame,
  heroHook,
  heroHooks,
  heroRopes,
  heroStrapWidths,
  heroYaws,
  looseStrapAnchors,
} from "./scene-config.mjs";

const FOV = 20;

// A fita do modal, medida contra o laço do engate no card.glb — que é por onde
// uma fita de verdade passa. Com 1.3 ela saía 70% mais larga que o laço, e o
// engate parecia pendurado nela em vez do contrário. Em 0.85 ela sobra uns 10%,
// a mesma folga que o molho do herói já tem.
//
// A conta não dá para herdar do herói: a largura é medida em unidades de mundo
// e a câmera do modal está bem mais perto, então o mesmo número rende
// espessuras diferentes nos dois lugares.
const DIALOG_STRAP_WIDTH = 0.85;

// Os cordões soltos do molho não pertencem a evento nenhum, então a fita vem em
// preto e branco da marca e sem nome escrito: é fita, não credencial.
const LOOSE_STRAP_CREDENTIAL = {
  name: "",
  color: "#2b2f36",
  darkColor: "#0a0a0b",
};

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

// Quem pediu menos movimento ao sistema não recebe a brisa: o molho fica parado
// até alguém arrastar um crachá.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function LanyardScene({ credentials, eventSource, mode, onReady, onSelect }) {
  const home = mode === "home";
  const frame = home ? heroFrame(credentials.length) : DIALOG_FRAME;
  const anchors = home
    ? heroAnchors(credentials.length)
    : [[0, ANCHOR_HEIGHT, 0]];
  const ropes = home ? heroRopes(credentials.length) : credentials.map(() => 1);
  const looseAnchors = home ? looseStrapAnchors(credentials.length) : [];
  const hook = home ? heroHook() : null;
  const hooks = home ? heroHooks(credentials.length) : [];
  const yaws = home ? heroYaws(credentials.length) : [];
  const strapWidths = home ? heroStrapWidths(credentials.length) : [];
  // A brisa é do molho. No modal a credencial cai e balança sozinha até parar.
  const withBreeze = home && !prefersReducedMotion();

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
        {/* A cena usa tone mapping ACES, que lava o que chega superexposto.
            Com a luz ambiente em PI as faixas de cor da credencial saíam bem
            mais claras e dessaturadas que o token da marca — `#0a7d4f` virava
            um verde-menta. Isso não aparecia no varal, onde todos os crachás
            olhavam para a frente; no molho cada um pega a luz num ângulo, e os
            virados para a esquerda lavavam de vez. */}
        <ambientLight intensity={1.1} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={1 / 60}>
            {credentials.map((credential, index) => (
              <Band
                key={credential.id}
                anchor={anchors[index]}
                frontImage={createCredentialTexture(credential)}
                backImage={createCredentialBackTexture(credential)}
                lanyardImage={createLanyardTexture(credential)}
                lanyardWidth={home ? strapWidths[index] : DIALOG_STRAP_WIDTH}
                spawnDrop={home ? 0 : DIALOG_SPAWN_DROP}
                ropeLength={ropes[index]}
                hook={hooks[index]}
                yaw={home ? yaws[index] : 0}
                depthTest={home}
                withBreeze={withBreeze}
                breezePhase={index * BREEZE_PHASE_STEP}
                onSelect={() => onSelect?.(credential.id)}
              />
            ))}
            {looseAnchors.map((anchor, index) => (
              <LooseStrap
                key={`loose-${index}`}
                anchor={anchor}
                lanyardImage={createLanyardTexture(LOOSE_STRAP_CREDENTIAL)}
                ropeLength={LOOSE_STRAPS[index].rope}
                hook={hook}
                withBreeze={withBreeze}
                breezePhase={(credentials.length + index) * BREEZE_PHASE_STEP}
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
