/**
 * AnimatedPetModel - 在高精模型 pet.glb 上叠加整体动画与星尘特效
 *
 * 保留原 50 万面高精模型不变，用 useFrame 驱动：
 * 1. 整体动画：呼吸起伏、漂浮、轻微摇摆、情绪动作（整体位移/旋转/缩放，无需骨骼）
 * 2. 星尘特效：环绕模型的发光粒子 + 呼吸光晕
 * 3. 状态联动：低能量变暗、沉睡半透明 + 星尘飘散
 *
 * 防崩溃：useFrame 内所有数值 clamp，材质克隆避免污染共享资源。
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface AnimatedPetModelProps {
  /** 能量值 0-100 */
  energy?: number;
  /** 是否沉睡 */
  isSleeping?: boolean;
  /** 心情值 0-100（影响动作幅度） */
  mood?: number;
  /** 触发一次性动作（外部传入，如 "happy"/"sad"/"jump"） */
  gesture?: string | null;
  /** 模型路径（默认 /models/pet.glb，可传物种模型路径） */
  modelPath?: string;
  /** 渲染风格（写实动作指令集） */
  renderMode?: string;
}

export function AnimatedPetModel({
  energy = 80,
  isSleeping = false,
  mood = 75,
  gesture = null,
  modelPath = "/models/pet.glb",
  renderMode = "shaded",
}: AnimatedPetModelProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  // 用 ref 同步会动态变化的 props，确保 useFrame 每帧读取最新值（避免闭包捕获旧值）
  const energyRef = useRef(energy);
  const isSleepingRef = useRef(isSleeping);
  const moodRef = useRef(mood);
  const gestureRef = useRef(gesture);
  const renderModeRef = useRef(renderMode);
  energyRef.current = energy;
  isSleepingRef.current = isSleeping;
  moodRef.current = mood;
  gestureRef.current = gesture;
  renderModeRef.current = renderMode;
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  // 缓存所有材质（克隆后），供 useFrame 高效访问
  const materials = useMemo(() => {
    const list: THREE.Material[] = [];
    clonedScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) list.push(...mesh.material);
        else list.push(mesh.material);
      }
    });
    return list;
  }, [clonedScene]);

  // 星尘粒子几何体
  const dustGeometry = useMemo(() => {
    const count = 160;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // 分布在一个椭球壳内（围绕宠物身体）
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.9 + Math.random() * 1.4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8 + 0.5;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const dustRef = useRef<THREE.Points>(null);

  // 光晕（呼吸脉动）
  const haloRef = useRef<THREE.Mesh>(null);

  // 动画累计时间
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    const t = (timeRef.current += delta);
    const group = groupRef.current;
    if (!group) return;

    // 每帧读取最新 props（通过 ref）
    const liveEnergy = energyRef.current;
    const liveSleeping = isSleepingRef.current;
    const liveMood = moodRef.current;
    const liveGesture = gestureRef.current;

    // 防 NaN：delta 异常时兜底
    const dt = Number.isFinite(delta) ? Math.min(delta, 0.1) : 0.016;

    // 低能量系数
    const lowEnergy = liveEnergy < 50 ? 1 - liveEnergy / 50 : 0;

    // ---- 1. 整体动画 ----
    // 呼吸起伏（沉睡时更缓慢、幅度更小）
    const breatheSpeed = liveSleeping ? 0.8 : 2.0;
    const breatheAmp = liveSleeping ? 0.015 : 0.04;
    const breathe = Math.sin(t * breatheSpeed) * breatheAmp * (1 - lowEnergy * 0.4);

    // 轻微漂浮
    const floatY = Math.sin(t * 1.2) * 0.06 * (1 - lowEnergy * 0.5);

    // 轻微摇摆（情绪高时更明显）
    const sway = Math.sin(t * 0.6) * 0.03 * (liveMood / 100);

    // 一次性手势动作
    let gestureScale = 1;
    let gestureRotY = 0;
    let gesturePosY = 0;
    if (liveGesture === "happy") {
      gestureScale = 1 + Math.abs(Math.sin(t * 4)) * 0.06;
      gestureRotY = Math.sin(t * 3) * 0.25;
      gesturePosY = Math.abs(Math.sin(t * 6)) * 0.15;
    } else if (liveGesture === "sad") {
      gesturePosY = -0.12;
      gestureScale = 0.97;
    } else if (liveGesture === "jump") {
      gesturePosY = Math.abs(Math.sin(t * 5)) * 0.5;
    }

    group.position.y = floatY + breathe + gesturePosY;
    group.rotation.y = sway + gestureRotY;
    group.scale.setScalar(gestureScale * (1 + breathe * 2));

    // ---- 2. 状态联动：透明度 ----
    const targetOpacity = liveSleeping ? 0.5 : 1.0;
    for (const m of materials) {
      const mat = m as THREE.MeshStandardMaterial;
      if (mat && mat.transparent !== undefined) {
        mat.transparent = targetOpacity < 1.0;
        // 平滑过渡透明度
        mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, dt * 4);
      }
    }

    // ---- 2.5 渲染风格（写实动作指令集）----
    const mode = renderModeRef.current;
    for (const m of materials) {
      const mat = m as THREE.MeshStandardMaterial;
      if (!mat) continue;
      if (mode === "wireframe") {
        mat.wireframe = true;
        mat.transparent = false;
      } else if (mode === "xray") {
        // X 光射线：半透明 + 发光，模拟透视
        mat.transparent = true;
        mat.opacity = 0.45;
        mat.emissive = mat.emissive ?? new THREE.Color(0x66ccff);
        mat.emissiveIntensity = 0.6;
      } else if (mode === "rig" || mode === "voxel") {
        // 骨架/体素：线框 + 低透明
        mat.wireframe = true;
        mat.transparent = true;
        mat.opacity = 0.7;
      } else {
        // shaded / model3d / realistic-stardust：恢复实体
        mat.wireframe = false;
        mat.transparent = false;
        mat.opacity = 1.0;
      }
    }

    // ---- 3. 低能量/沉睡变暗 ----
    const darken = lowEnergy * 0.6 + (liveSleeping ? 0.4 : 0);
    for (const m of materials) {
      const mat = m as THREE.MeshStandardMaterial;
      if (mat && mat.color && mat.emissiveIntensity !== undefined) {
        // 用 emissive 强度模拟发光衰减（不直接改 color，避免影响原纹理色）
        mat.emissiveIntensity = Math.max(0, 0.15 - darken * 0.15);
      }
    }

    // ---- 4. 星尘粒子动画 ----
    const dust = dustRef.current;
    if (dust) {
      const pos = dustGeometry.getAttribute("position") as THREE.BufferAttribute;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        // 缓慢上升 + 环绕
        let y = pos.getY(i) + dt * 0.15 * (liveSleeping ? 0.5 : 1);
        if (y > 1.8) y = -0.3;
        pos.setY(i, y);
        // 水平微旋
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = dt * 0.2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        pos.setX(i, x * cosA - z * sinA);
        pos.setZ(i, x * sinA + z * cosA);
      }
      pos.needsUpdate = true;

      const mat = dust.material as THREE.PointsMaterial;
      mat.opacity = liveSleeping ? 0.9 : 0.5 + Math.sin(t * 2) * 0.15;
      mat.size = liveSleeping ? 0.05 : 0.035 + Math.sin(t * 3) * 0.01;
    }

    // ---- 5. 光晕脉动 ----
    const halo = haloRef.current;
    if (halo) {
      const haloMat = halo.material as THREE.MeshBasicMaterial;
      haloMat.opacity = (liveSleeping ? 0.15 : 0.4) + Math.sin(t * 2) * 0.1;
      const pulse = 1 + Math.sin(t * 2.5) * 0.08;
      halo.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1} position={[0, 0, 0]} />

      {/* 星尘粒子 */}
      <points ref={dustRef} geometry={dustGeometry}>
        <pointsMaterial
          color="#bfe9ff"
          size={0.04}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 呼吸光晕 */}
      <mesh ref={haloRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial
          color="#a0e8ff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
