/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from "react";
import { extend, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

import {
  DRAPE_AT,
  DRAPE_SAG,
  LOOSE_STRAP_JOINTS,
  ROPE_TO_CARD,
  bodyPositions,
  breeze,
  isShortClick,
  lerpFactor,
  looseBodyPositions,
  pointerDelta,
  yawTarget,
} from "./scene-config.mjs";

const cardGLB = "/assets/lanyard/card.glb";
const defaultLanyardImage = "/assets/lanyard/lanyard.png";

extend({ MeshLineGeometry, MeshLineMaterial });

// Posiciona o ponto de barriga da fita entre a corda e o gancho. A queda cresce
// com a distância que a fita tem de vencer, como a de um cabo entre dois postes.
// Empurra um corpo com a aceleração da brisa. O passo é limitado porque, na
// volta de uma aba em segundo plano, o `delta` chega enorme e viraria um tranco.
const pushWithBreeze = (body, wind, delta) => {
  const impulse = body.mass() * Math.min(delta, 1 / 30);
  body.applyImpulse({ x: wind.x * impulse, y: 0, z: wind.z * impulse }, true);
};

const drapeBetween = (target, rope, hook) => {
  target.copy(rope).lerp(hook, DRAPE_AT);
  target.y -= DRAPE_SAG * (0.4 + Math.hypot(hook.x - rope.x, hook.z - rope.z));
  return target;
};

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export function LanyardLights() {
  return (
    <Environment blur={0.75}>
      <Lightformer
        intensity={2}
        color="white"
        position={[0, -1, 5]}
        rotation={[0, 0, Math.PI / 3]}
        scale={[100, 0.1, 1]}
      />
      <Lightformer
        intensity={3}
        color="white"
        position={[-1, -1, 1]}
        rotation={[0, 0, Math.PI / 3]}
        scale={[100, 0.1, 1]}
      />
      <Lightformer
        intensity={3}
        color="white"
        position={[1, 1, 1]}
        rotation={[0, 0, Math.PI / 3]}
        scale={[100, 0.1, 1]}
      />
      {/* O refletor principal. Em 10 ele estourava qualquer crachá que
          virasse para este lado — no varal ninguém virava, no molho todos
          viram. */}
      <Lightformer
        intensity={4}
        color="white"
        position={[-10, 0, 14]}
        rotation={[0, Math.PI / 2, Math.PI / 3]}
        scale={[100, 10, 1]}
      />
    </Environment>
  );
}

export function Band({
  anchor = [0, 4, 0],
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  spawnDrop = 0,
  ropeLength = 1,
  // Onde a fita é desenhada no alto. Sem isso ela nasce na âncora da física,
  // e um molho de âncoras espalhadas vira um varal de cordões paralelos.
  hook = null,
  // O molho sobrepõe cordão e crachá, então lá a fita respeita a profundidade.
  // No varal e no modal nada se cruza, e desenhar por cima evita o z-fighting
  // da fita contra o clipe de metal.
  depthTest = false,
  // O giro de descanso do crachá em torno do próprio eixo vertical, em radianos.
  // Num molho as credenciais não olham todas para a frente. A gravidade não tem
  // o que dizer sobre esse giro — ela endireita o que pende, não o que gira —
  // então quem segura o ângulo é a mola de rotação lá embaixo, que devolve o
  // crachá ao lugar depois de cada arrasto.
  yaw = 0,
  // Liga a brisa que balança o crachá parado. `breezePhase` diz quando o vento
  // chega a este cordão, para o molho não balançar em bloco.
  withBreeze = false,
  breezePhase = 0,
  onSelect,
}) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const pointerStart = useRef(null);
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || defaultLanyardImage);
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);
  const initialLine = useMemo(
    () =>
      new Float32Array([
        anchor[0],
        anchor[1] - 3,
        anchor[2],
        ...(hook || anchor),
      ]),
    [anchor, hook],
  );
  const linePoints = useMemo(
    () => new Float32Array((isMobile ? 17 : 33) * 3),
    [isMobile],
  );

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image;
    const width = baseImg.width;
    const height = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return baseMap;
    context.drawImage(baseImg, 0, 0, width, height);

    const drawFitted = (image, rect) => {
      const rectX = rect.x * width;
      const rectY = rect.y * height;
      const rectWidth = rect.w * width;
      const rectHeight = rect.h * height;
      const pick = imageFit === "contain" ? Math.min : Math.max;
      const scale = pick(rectWidth / image.width, rectHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = rectX + (rectWidth - drawWidth) / 2;
      const drawY = rectY + (rectHeight - drawHeight) / 2;
      context.save();
      context.beginPath();
      context.rect(rectX, rectY, rectWidth, rectHeight);
      context.clip();
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();
    };

    if (frontImage && frontTex.image) {
      drawFitted(frontTex.image, FRONT_UV_RECT);
    }
    if (backImage && backTex.image) {
      drawFitted(backTex.image, BACK_UV_RECT);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);

  useEffect(() => {
    if (cardMap === materials.base.map) return undefined;
    return () => cardMap.dispose();
  }, [cardMap, materials.base.map]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const hookVec = useMemo(() => new THREE.Vector3(), []);
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, ROPE_TO_CARD, 0],
  ]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
        );
        const speed = minSpeed + clampedDistance * (maxSpeed - minSpeed);
        ref.current.lerped.lerp(
          ref.current.translation(),
          lerpFactor(delta, speed),
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      if (hook) {
        hookVec.set(hook[0], hook[1], hook[2]);
      } else {
        hookVec.copy(fixed.current.translation());
      }
      drapeBetween(curve.points[3], j1.current.lerped, hookVec);
      curve.points[4].copy(hookVec);
      const curvePoints = curve.getPoints(isMobile ? 16 : 32);
      let valid = true;
      curvePoints.forEach((point, index) => {
        const offset = index * 3;
        linePoints[offset] = point.x;
        linePoints[offset + 1] = point.y;
        linePoints[offset + 2] = point.z;
        valid &&= Number.isFinite(point.x + point.y + point.z);
      });
      if (valid) {
        band.current.geometry.setPoints(linePoints);
      }
      const wind = withBreeze ? breeze(state.clock.elapsedTime, breezePhase) : null;
      if (wind && !dragged) pushWithBreeze(card.current, wind, delta);
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({
        x: ang.x,
        y: ang.y - (rot.y - yawTarget(yaw + (wind?.yaw ?? 0))) * 0.25,
        z: ang.z,
      });
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const [fixedPosition, j1Position, j2Position, j3Position, cardPosition] =
    bodyPositions(anchor, spawnDrop, ropeLength);

  return (
    <>
        <RigidBody position={fixedPosition} ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={j1Position} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={j2Position} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={j3Position} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={cardPosition}
          rotation={[0, yaw, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={(event) => {
              event.stopPropagation();
              hover(true);
            }}
            onPointerOut={() => hover(false)}
            onPointerUp={(event) => {
              event.stopPropagation();
              event.target.releasePointerCapture(event.pointerId);
              drag(false);
              const start = pointerStart.current;
              pointerStart.current = null;
              if (
                start?.id === event.pointerId &&
                isShortClick(
                  pointerDelta(start, { x: event.clientX, y: event.clientY }),
                )
              ) {
                onSelect?.();
              }
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.target.setPointerCapture(event.pointerId);
              pointerStart.current = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              };
              drag(
                new THREE.Vector3()
                  .copy(event.point)
                  .sub(vec.copy(card.current.translation())),
              );
            }}
            onPointerCancel={() => {
              pointerStart.current = null;
              drag(false);
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              {/* Crachá de evento é PVC impresso, não metal. No varal todos
                  olhavam para a frente e o reflexo era igual em todos; no molho
                  cada um está virado para um lado, e os que viram para a
                  esquerda pegavam em cheio o refletor daquele lado — a cor
                  lavava. `envMapIntensity` segura o quanto do ambiente o cartão
                  devolve, que é o que produzia o véu. O verniz continua, mais
                  fraco: é o brilho do plástico, não um espelho. */}
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 0.15}
                clearcoatRoughness={0.35}
                roughness={0.85}
                metalness={0.05}
                envMapIntensity={0.08}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
      </RigidBody>
      <mesh ref={band}>
        <meshLineGeometry points={initialLine} />
        <meshLineMaterial
          color="white"
          depthTest={depthTest}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

// Um cordão sem credencial: os que sobram no molho de quem guarda crachá de
// evento. É volume visual, não conteúdo — não recebe ponteiro, não abre nada e
// não representa evento nenhum. A corda é mais longa que a de uma credencial e
// termina num peso pequeno, que é o que a faz cair em vez de flutuar.
export function LooseStrap({
  anchor = [0, 4, 0],
  isMobile = false,
  lanyardImage = null,
  lanyardWidth = 0.9,
  ropeLength = 1.5,
  hook = null,
  withBreeze = false,
  breezePhase = 0,
}) {
  const band = useRef();
  const bodies = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const texture = useTexture(lanyardImage || defaultLanyardImage);
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  useRopeJoint(bodies[0], bodies[1], [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(bodies[1], bodies[2], [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(bodies[2], bodies[3], [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(bodies[3], bodies[4], [[0, 0, 0], [0, 0, 0], ropeLength]);

  const positions = looseBodyPositions(anchor, ropeLength);
  const initialLine = useMemo(
    () =>
      new Float32Array([
        anchor[0],
        anchor[1] - ropeLength * LOOSE_STRAP_JOINTS,
        anchor[2],
        ...(hook || anchor),
      ]),
    [anchor, hook, ropeLength],
  );
  const linePoints = useMemo(
    () => new Float32Array((isMobile ? 17 : 33) * 3),
    [isMobile],
  );
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from(Array(LOOSE_STRAP_JOINTS + 2), () => new THREE.Vector3()),
      ),
  );
  const hookVec = useMemo(() => new THREE.Vector3(), []);

  // Desenhada da ponta solta para o gancho, como a da credencial.
  useFrame((state, delta) => {
    if (!bodies[0].current || !band.current) return;
    // Sem crachá, o vento pega só no peso da ponta — é ele que arrasta a fita.
    if (withBreeze && bodies.at(-1).current) {
      pushWithBreeze(
        bodies.at(-1).current,
        breeze(state.clock.elapsedTime, breezePhase),
        delta,
      );
    }
    for (const [index, ref] of bodies.slice(1).reverse().entries()) {
      if (!ref.current) return;
      curve.points[index].copy(ref.current.translation());
    }
    const top = bodies[1].current.translation();
    if (hook) {
      hookVec.set(hook[0], hook[1], hook[2]);
    } else {
      hookVec.copy(bodies[0].current.translation());
    }
    drapeBetween(curve.points[LOOSE_STRAP_JOINTS], top, hookVec);
    curve.points[LOOSE_STRAP_JOINTS + 1].copy(hookVec);
    const curvePoints = curve.getPoints(isMobile ? 16 : 32);
    let valid = true;
    curvePoints.forEach((point, index) => {
      const offset = index * 3;
      linePoints[offset] = point.x;
      linePoints[offset + 1] = point.y;
      linePoints[offset + 2] = point.z;
      valid &&= Number.isFinite(point.x + point.y + point.z);
    });
    if (valid) band.current.geometry.setPoints(linePoints);
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <RigidBody position={positions[0]} ref={bodies[0]} {...segmentProps} type="fixed" />
      {positions.slice(1, -1).map((position, index) => (
        <RigidBody key={index} position={position} ref={bodies[index + 1]} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
      ))}
      <RigidBody position={positions.at(-1)} ref={bodies.at(-1)} {...segmentProps}>
        <BallCollider args={[0.12]} />
      </RigidBody>
      <mesh ref={band}>
        <meshLineGeometry points={initialLine} />
        <meshLineMaterial
          color="white"
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(cardGLB);
