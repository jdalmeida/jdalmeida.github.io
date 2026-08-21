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
  bodyPositions,
  isShortClick,
  lerpFactor,
  pointerDelta,
} from "./scene-config.mjs";

const cardGLB = "/assets/lanyard/card.glb";
const defaultLanyardImage = "/assets/lanyard/lanyard.png";

extend({ MeshLineGeometry, MeshLineMaterial });

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
      <Lightformer
        intensity={10}
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
        anchor[0],
        anchor[1],
        anchor[2],
      ]),
    [anchor],
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
      ]),
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
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
      curve.points[3].copy(fixed.current.translation());
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
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const [fixedPosition, j1Position, j2Position, j3Position, cardPosition] =
    bodyPositions(anchor, spawnDrop);

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
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
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
          depthTest={false}
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
