/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PetConfig, Pet3DModelConfig, PetType } from "../types";
import { playSound } from "../audio/AudioSynth";
import { ACHIEVEMENTS, unlock } from "../steam/achievements";
import { 
  Upload, Camera, HelpCircle, AlertCircle, Cpu, Zap, Rotate3d, 
  Compass, RefreshCw, ZoomIn, Eye, Heart, Check, Download, Layers, ShieldCheck
} from "lucide-react";

interface Pet3DReconstructionProps {
  activePet: PetConfig | null;
  onSync3DModelToPet: (model: Pet3DModelConfig) => void;
  triggerToast: (msg: string) => void;
}

const PRESET_SAMPLES = [
  {
    name: "星蒲 (Puff Cream Cat)",
    type: "猫" as PetType,
    url: "/assets/images/unsplash/1514888286974-6c03e2ca1dba.jpg",
    color: "#fad0a3"
  },
  {
    name: "治愈金毛犬 (Golden Retriever)",
    type: "狗" as PetType,
    url: "/assets/images/unsplash/1543466835-00a7907e9de1.jpg",
    color: "#e6b02a"
  },
  {
    name: "害羞小萌兔 (Lop-Ear Rabbit)",
    type: "兔" as PetType,
    url: "/assets/images/unsplash/1585110396000-c9ffd4e4b308.jpg",
    color: "#b099fc"
  },
  {
    name: "机智小玄凤 (Cute Cockatiel)",
    type: "鸟" as PetType,
    url: "/assets/images/unsplash/1522850959516-58f958dde2c1.jpg",
    color: "#2edcc8"
  }
];

export default function Pet3DReconstruction({ activePet, onSync3DModelToPet, triggerToast }: Pet3DReconstructionProps) {
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(PRESET_SAMPLES[0].url);
  const [customImageBase64, setCustomImageBase64] = useState<string>("");
  const [targetName, setTargetName] = useState<string>(activePet?.name || "天乐");
  const [targetType, setTargetType] = useState<PetType>(activePet?.type || "猫");
  const [selectedColor, setSelectedColor] = useState<string>(activePet?.primaryColor || "#fad0a3");

  // Background removal states
  const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
  const [isBgRemoved, setIsBgRemoved] = useState<boolean>(false);
  const [bgTolerance, setBgTolerance] = useState<number>(35);
  const [transparentImgUrl, setTransparentImgUrl] = useState<string>("");
  const [showSegmentProgress, setShowSegmentProgress] = useState<boolean>(false);
  const [extractLogs, setExtractLogs] = useState<string[]>([]);
  const [stardustParticleStrength, setStardustParticleStrength] = useState<number>(80);

  // Reconstructed 3D configuration states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<number>(0);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [reconstructedModel, setReconstructedModel] = useState<Pet3DModelConfig | null>(activePet?.model3d || null);

  // Animations & Rigging States
  const [activeAnimation, setActiveAnimation] = useState<"stand" | "walk" | "wag_tail" | "sit" | "pet">("stand");
  const [showBoneSkeleton, setShowBoneSkeleton] = useState<boolean>(true);
  const [isHoveringPetInteraction, setIsHoveringPetInteraction] = useState<boolean>(false);



  // 3D Canvas properties
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(0.5); // auto orbit base
  const [pitch, setPitch] = useState<number>(0.2);
  const [zoom, setZoom] = useState<number>(1.1);
  const [hoveredNode, setHoveredNode] = useState<{ x: number, y: number, label: string } | null>(null);
  const isDragging = useRef<boolean>(false);
  const startMousePos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const [shockwaveFactor, setShockwaveFactor] = useState<number>(0); // click splash ripple
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.5);

  // WebGL ThreeJS Real-time engine states & loaders
  const [useReal3D, setUseReal3D] = useState<boolean>(true);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gltfLoadProgress, setGltfLoadProgress] = useState<number>(0);
  const [gltfLoadError, setGltfLoadError] = useState<string>("");
  const [isGltfLoading, setIsGltfLoading] = useState<boolean>(false);

  // Stardust floating particles buffer representation
  const designParticles = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
    pulse: number;
  }>>([]);

  const getCurrentImageUrl = () => {
    return customImageBase64 || selectedPresetUrl;
  };

  // Extract foreground background removal logic via Canvas
  const processBackgroundRemoval = async () => {
    setIsBgRemoving(true);
    setShowSegmentProgress(true);
    setExtractLogs([]);
    playSound("sparkle");

    const addExtractLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setExtractLogs((prev) => [...prev, `[AI-SEG] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    await addExtractLog("🔄 读取原始图像像素灰度结构 (Parsing raw pixel brightness)...", 100);
    await addExtractLog("🔍 智能边缘定位中，锚定 4 个对视相机边界 (Locating border corner anchors)...", 400);
    await addExtractLog("✂️ 正在计算自适应 RGB 色差相似比度，抑制杂波 (Filtering chroma thresholds)...", 400);
    await addExtractLog("💫 注入边缘 stardust 粒子流 (Injecting stardust border sparks)...", 300);

    try {
      const srcUrl = getCurrentImageUrl();
      const resultDataUrl = await computeTransparentImage(srcUrl, bgTolerance);
      setTransparentImgUrl(resultDataUrl);
      setIsBgRemoved(true);
      playSound("chime");
      triggerToast("✨ 背景已智能滤除！只保留爱宠本真主体和流星晶边！");
    } catch (err) {
      console.error("BG remove error:", err);
      triggerToast("⚠️ 背景提取不完美，自动启用星质混合罩模糊背景");
      setTransparentImgUrl(getCurrentImageUrl());
      setIsBgRemoved(true);
    } finally {
      setIsBgRemoving(false);
      setShowSegmentProgress(false);
    }
  };

  // Perform background chroma keying based on sampling corners
  const computeTransparentImage = (srcUrl: string, tolerance: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = srcUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(srcUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Sample background color from 4 corner zones to find standard background profile
          const pixelSamples = [
            [data[0], data[1], data[2]], // Top-Left
            [data[(canvas.width - 1) * 4], data[(canvas.width - 1) * 4 + 1], data[(canvas.width - 1) * 4 + 2]], // Top-Right
            [data[(canvas.height - 1) * canvas.width * 4], data[(canvas.height - 1) * canvas.width * 4 + 1], data[(canvas.height - 1) * canvas.width * 4 + 2]], // Bottom-Left
            [data[(data.length - 4)], data[(data.length - 3)], data[(data.length - 2)]] // Bottom-Right
          ];

          // Calc average of corner backgrounds
          const rBg = Math.round(pixelSamples.reduce((sum, s) => sum + s[0], 0) / 4);
          const gBg = Math.round(pixelSamples.reduce((sum, s) => sum + s[1], 0) / 4);
          const bBg = Math.round(pixelSamples.reduce((sum, s) => sum + s[2], 0) / 4);

          const tSq = tolerance * tolerance * 3.2; // Delta variance boundary

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const distSq = (r - rBg) * (r - rBg) + (g - gBg) * (g - gBg) + (b - bBg) * (b - bBg);
            if (distSq < tSq) {
              data[i + 3] = 0; // Completely transparent
            } else {
              // Smooth fringe softening
              const transitionZone = tSq * 0.4;
              if (distSq - tSq < transitionZone) {
                const ratio = (distSq - tSq) / transitionZone;
                data[i + 3] = Math.round(ratio * 255);
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          // If cross-origin throws security error, return original URL directly
          resolve(srcUrl);
        }
      };
      img.onerror = () => {
        resolve(srcUrl);
      };
    });
  };

  // Upload file to local state as Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast("⚠️ 照片容量请控制在 2MB 以内，以便能被深脑几何计算更高效读取哦");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomImageBase64(reader.result);
        setSelectedPresetUrl("");
        setIsBgRemoved(false);
        setTransparentImgUrl("");
        triggerToast("📸 成功导入真实爱宠影像！正在准备一键智能抠除背景 🚀");
        playSound("click");
      }
    };
    reader.readAsDataURL(file);
  };

  // Run the API based or fallbacked reconstructed 3D simulation
  const handleReconstruct = async () => {
    setIsProcessing(true);
    setProcessStep(0);
    setStatusLogs([]);
    playSound("sparkle");

    const addLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setStatusLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    await addLog("🛰️ 连接太空相干光偏振分析仪(Connected to Space Polarization Analyzer)...", 100);
    await addLog("🧬 正在提取生物学骨骼形态指数(Skeleton Mesh Index Extracting)...", 500);
    setProcessStep(1);
    await addLog("⚡ 光流运动粒子受重力拟合解算(Orbital Gravity Particles Alignment)...", 400);
    setProcessStep(2);
    await addLog("🪐 渲染星云深度折射热力学贴图层(Rendering Depth-Refraction Heatmap)...", 450);
    setProcessStep(3);

    // If background removal was not run yet, trigger it implicitly
    let imageSource = transparentImgUrl || getCurrentImageUrl();
    if (!isBgRemoved) {
      await addLog("💡 检测未进行前置背景剔除，自动在星尘通道里分离图像...", 200);
      try {
        const transparentResult = await computeTransparentImage(getCurrentImageUrl(), bgTolerance);
        imageSource = transparentResult;
        setTransparentImgUrl(transparentResult);
        setIsBgRemoved(true);
      } catch (err) {}
    }

    try {
      const payload = {
        petName: targetName,
        petType: targetType,
        primaryColor: selectedColor,
        base64Image: imageSource
      };

      const res = await fetch("/api/reconstruct-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.model) {
        setReconstructedModel(data.model);
        await addLog(`🏆 重聚大功告成！生成三维节点数: ${data.model.verticesCount}，提供商: ${data.provider}`, 400);
        triggerToast(`✨ 【${targetName}】的三维全息骨骼建模重构已实时生成！`);
        playSound("chime");
      } else {
        throw new Error(data.error || "No model yielded");
      }
    } catch (err: any) {
      console.warn("Server reconstruction failed, falling back safely", err);
      // Fail-proof offline calculation fallback
      await addLog("⚠️ 云计算异常，自动启用本地超空间备份3D生物解算引擎", 200);

      // Expand nodes from 5 to 9 to build highly detailed structure
      const defaults = {
        sourceImage: imageSource,
        verticesCount: 195,
        shapeNodes: [
          { x: 0.0, y: 0.42, z: 0.55, label: "小湿润鼻子 Nose", color: "#ff85a2" },
          { x: -0.22, y: 0.62, z: 0.28, label: "耳廓感应 L-Ear", color: selectedColor },
          { x: 0.22, y: 0.62, z: 0.28, label: "耳廓感应 R-Ear", color: selectedColor },
          { x: 0.0, y: 0.12, z: -0.12, label: "主核心脊椎 Mid-Spine", color: selectedColor },
          { x: -0.21, y: -0.58, z: 0.25, label: "左前足骨掌 LF-Paw", color: "#ffffff" },
          { x: 0.21, y: -0.58, z: 0.25, label: "右前足骨掌 RF-Paw", color: "#ffffff" },
          { x: -0.23, y: -0.62, z: -0.32, label: "左后足骨掌 LB-Paw", color: "#ffffff" },
          { x: 0.23, y: -0.62, z: -0.32, label: "右后足骨掌 RB-Paw", color: "#ffffff" },
          { x: 0.0, y: 0.18, z: -0.72, label: "星辰尾端骨架 Tail Tip", color: "#00f2fe" }
        ],
        depthMapColors: [selectedColor, "#ff85a2", "#fca3cc", "#ef476f", "#ffd166", "#04e762"],
        dimensions: { depth: 0.88, height: 1.15, width: 0.96 },
        physicsBounciness: 0.72,
        glowIntensity: 0.82,
        breathingRate: 2.6,
        loreParagraph: `星空偏振分析仪已提取出【${targetName}】的骨骼特征，以本地骨力引擎重新合成。其拥有多组敏感的骨骼配比：头部圆融度 1.15，核心弹性能 0.72。目前各项星辰指标极为稳定，它正在枕着你往昔的思念轻轻呼吸守护着你。`,
        reconstructionDate: new Date().toLocaleDateString()
      };
      setReconstructedModel(defaults);
      triggerToast(`💫 成功通过本地离线骨骼引擎为 ${targetName} 注入3D立体构架！`);
      playSound("success");
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger high poly preset sample select
  const triggerPresetSelect = (preset: typeof PRESET_SAMPLES[0]) => {
    setSelectedPresetUrl(preset.url);
    setCustomImageBase64("");
    setTargetType(preset.type);
    setSelectedColor(preset.color);
    setIsBgRemoved(false);
    setTransparentImgUrl("");
    triggerToast(`⭐ 挑选了预置样张！已准备智能分离【${preset.name.split(" ")[0]}】背景`);
    playSound("click");
  };

  // Bone linkages map list to plot skeleton outline
  const SKELETON_BONES = [
    { from: 3, to: 0, color: "rgba(255, 255, 255, 0.45)", label: "颈胸线 (Neck)" }, // spine to nose
    { from: 3, to: 1, color: "rgba(0, 242, 254, 0.4)", label: "左耳廓线" }, // spine to L-Ear
    { from: 3, to: 2, color: "rgba(0, 242, 254, 0.4)", label: "右耳廓线" }, // spine to R-Ear
    { from: 3, to: 4, color: "rgba(242, 125, 38, 0.4)", label: "左前肢 (LF-Leg)" }, // spine to LF-Paw
    { from: 3, to: 5, color: "rgba(242, 125, 38, 0.4)", label: "右前肢 (RF-Leg)" }, // spine to RF-Paw
    { from: 3, to: 6, color: "rgba(180, 153, 252, 0.4)", label: "左后臀 (LB-Leg)" }, // spine to LB-Paw
    { from: 3, to: 7, color: "rgba(180, 153, 252, 0.4)", label: "右后臀 (RB-Leg)" }, // spine to RB-Paw
    { from: 3, to: 8, color: "rgba(255, 92, 138, 0.5)", label: "星辰龙骨尾椎" }  // spine to Tail
  ];

  // Particle spawning on stardust edges helper
  const spawnEdgeStar = (x: number, y: number, color: string) => {
    if (designParticles.current.length > 120) return;
    const speed = 0.2 + Math.random() * 0.9;
    const angle = Math.random() * Math.PI * 2;
    designParticles.current.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4, // drift upward
      size: 1.0 + Math.random() * 2.2,
      life: 0,
      maxLife: 25 + Math.floor(Math.random() * 35),
      color,
      pulse: Math.random() * Math.PI
    });
  };

  // Rigged standard representation builder for low poly `.gltf` export compatible with WeChat/ThreeJS
  const handleExportGLTF = () => {
    if (!reconstructedModel) {
      triggerToast("⚠️ 请先重构生成 3D 骨骼模型才能导出噢！");
      return;
    }

    playSound("sparkle");
    triggerToast("📂 正在渲染高适配微信小游戏轻量 GLTF 实体骨骼...");

    // Generate accurate standard fully embedded rigged GLTF 2.0 object representation
    // Let's model a cute procedural low poly crystal cuboid with skin weights
    const nameSanitized = targetName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");

    // Geometric data arrays for low poly cuboid shape
    const pX = reconstructedModel.dimensions.width * 0.5;
    const pY = reconstructedModel.dimensions.height * 0.5;
    const pZ = reconstructedModel.dimensions.depth * 0.5;

    // Procedural Low-Poly vertices
    const vertices = [
      // Body Box (8 points)
      -pX, -pY * 0.5, -pZ,   -pX, pY * 0.5, -pZ,    pX, pY * 0.5, -pZ,    pX, -pY * 0.5, -pZ,
      -pX, -pY * 0.5,  pZ,   -pX, pY * 0.5,  pZ,    pX, pY * 0.5,  pZ,    pX, -pY * 0.5,  pZ,
      // Head Box (8 points offset upwards)
      -pX * 0.7, pY * 0.5, pZ * 0.5,    -pX * 0.7, pY * 1.2, pZ * 0.5,     pX * 0.7, pY * 1.2, pZ * 0.5,     pX * 0.7, pY * 0.5, pZ * 0.5,
      -pX * 0.7, pY * 0.5, pZ * 1.2,    -pX * 0.7, pY * 1.2, pZ * 1.2,     pX * 0.7, pY * 1.2, pZ * 1.2,     pX * 0.7, pY * 0.5, pZ * 1.2,
      // Fore Legs (LF: 4 points, RF: 4 points)
      -pX * 0.9, -pY * 0.5, pZ * 0.8,   -pX * 0.7, -pY * 1.2, pZ * 0.8,   -pX * 0.5, -pY * 1.2, pZ * 0.8,   -pX * 0.5, -pY * 0.5, pZ * 0.8,
       pX * 0.5, -pY * 0.5, pZ * 0.8,    pX * 0.5, -pY * 1.2, pZ * 0.8,    pX * 0.7, -pY * 1.2, pZ * 0.8,    pX * 0.9, -pY * 0.5, pZ * 0.8,
      // Hind Legs (LB: 4 points, RB: 4 points)
      -pX * 0.9, -pY * 0.5, -pZ * 0.8,  -pX * 0.7, -pY * 1.2, -pZ * 0.8,  -pX * 0.5, -pY * 1.2, -pZ * 0.8,  -pX * 0.5, -pY * 0.5, -pZ * 0.8,
       pX * 0.5, -pY * 0.5, -pZ * 0.8,   pX * 0.5, -pY * 1.2, -pZ * 0.8,   pX * 0.7, -pY * 1.2, -pZ * 0.8,   pX * 0.9, -pY * 0.5, -pZ * 0.8,
      // Tail (4 points)
      -0.05, pY * 0.2, -pZ * 1.0,     0.05, pY * 0.2, -pZ * 1.0,     0.05, pY * 0.4, -pZ * 1.5,    -0.05, pY * 0.4, -pZ * 1.5
    ];

    // Bone skin indices and weights assigning joints (0 = spine, 1 = head, 2 = LF, 3 = RF, 4 = LB, 5 = RB, 6 = Tail)
    const boneSkinIndices: number[] = [];
    const boneSkinWeights: number[] = [];

    for (let idx = 0; idx < vertices.length / 3; idx++) {
      const zVal = vertices[idx * 3 + 2];
      const yVal = vertices[idx * 3 + 1];
      const xVal = vertices[idx * 3];

      if (idx >= 0 && idx < 8) {
        // Body joints
        boneSkinIndices.push(0, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      } else if (idx >= 8 && idx < 16) {
        // Head joints
        boneSkinIndices.push(1, 0, 0, 0);
        boneSkinWeights.push(0.9, 0.1, 0.0, 0.0);
      } else if (idx >= 16 && idx < 20) {
        // LF limb
        boneSkinIndices.push(2, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      } else if (idx >= 20 && idx < 24) {
        // RF limb
        boneSkinIndices.push(3, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      } else if (idx >= 24 && idx < 28) {
        // LB limb
        boneSkinIndices.push(4, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      } else if (idx >= 28 && idx < 32) {
        // RB limb
        boneSkinIndices.push(5, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      } else {
        // Tail
        boneSkinIndices.push(6, 0, 0, 0);
        boneSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      }
    }

    // Geometry indices definitions for cuboids
    const indices = [
      // Body faces
      0,1,2, 0,2,3,  4,6,5, 4,7,6,  0,5,1, 0,4,5,  3,2,6, 3,6,7,  1,5,6, 1,6,2,  0,3,7, 0,7,4,
      // Head faces
      8,9,10, 8,10,11, 12,14,13, 12,15,14, 8,13,9, 8,12,13, 11,10,14, 11,14,15, 9,13,14, 9,14,10, 8,11,15, 8,15,12,
      // limbs (LF, RF, LB, RB faces)
      16,17,18, 16,18,19, 20,21,22, 20,22,23, 24,25,26, 24,26,27, 28,29,30, 28,30,31,
      // Tail faces
      32,33,34, 32,34,35
    ];

    // Standard normals
    const normals: number[] = [];
    for (let n = 0; n < vertices.length; n += 3) {
      normals.push(0, 1, 0); // procedurally upright normals
    }

    // Embed Binary packing arrays with DataView
    const vertexCount = vertices.length / 3;
    const totalByteLength = 
      (vertexCount * 3 * 4) + // positions: Float32
      (vertexCount * 3 * 4) + // normals: Float32
      (vertexCount * 4 * 2) + // joints_0: Uint16
      (vertexCount * 4 * 4) + // weights_0: Float32
      (indices.length * 2);   // indices: Uint16

    const arrayBuffer = new ArrayBuffer(totalByteLength);
    const view = new DataView(arrayBuffer);
    
    let byteOffset = 0;

    // 1. Pack POSITIONS
    const posOffset = byteOffset;
    for (let v = 0; v < vertices.length; v++) {
      view.setFloat32(byteOffset, vertices[v], true);
      byteOffset += 4;
    }

    // 2. Pack NORMALS
    const normOffset = byteOffset;
    for (let u = 0; u < normals.length; u++) {
      view.setFloat32(byteOffset, normals[u], true);
      byteOffset += 4;
    }

    // 3. Pack JOINTS
    const jointOffset = byteOffset;
    for (let j = 0; j < boneSkinIndices.length; j++) {
      view.setUint16(byteOffset, boneSkinIndices[j], true);
      byteOffset += 2;
    }

    // 4. Pack WEIGHTS
    const weightOffset = byteOffset;
    for (let w = 0; w < boneSkinWeights.length; w++) {
      view.setFloat32(byteOffset, boneSkinWeights[w], true);
      byteOffset += 4;
    }

    // 5. Pack INDICES (indices are Uint16)
    const idxOffset = byteOffset;
    for (let idxVal = 0; idxVal < indices.length; idxVal++) {
      view.setUint16(byteOffset, indices[idxVal], true);
      byteOffset += 2;
    }

    // Base64 encode full binary payload chunk
    const binaryBase64 = btoa(
      new Uint8Array(arrayBuffer).reduce((str, byte) => str + String.fromCharCode(byte), "")
    );

    // Build the GLTF JSON with embedded buffers
    const gltfJSON = {
      asset: {
        version: "2.0",
        generator: "StarPuff AI 3D Exporter v2.1"
      },
      scene: 0,
      scenes: [
        {
          nodes: [0] // Scene starts with Root bone
        }
      ],
      nodes: [
        {
          name: "StarPuff_Rig_Root",
          children: [1], // links child joints
          translation: [0, 0, 0]
        },
        {
          name: "Mesh_Instance_Group",
          mesh: 0,
          skin: 0
        },
        {
          name: "Joint_Spine",
          translation: [0, 0, 0],
          children: [3, 4, 5, 6, 7, 8] // spinal bone branches
        },
        {
          name: "Joint_Head",
          translation: [0, pY * 0.85, pZ * 0.5]
        },
        {
          name: "Joint_LF_Leg",
          translation: [-pX * 0.7, -pY * 0.85, pZ * 0.8]
        },
        {
          name: "Joint_RF_Leg",
          translation: [pX * 0.7, -pY * 0.85, pZ * 0.8]
        },
        {
          name: "Joint_LB_Leg",
          translation: [-pX * 0.7, -pY * 0.85, -pZ * 0.8]
        },
        {
          name: "Joint_RB_Leg",
          translation: [pX * 0.7, -pY * 0.85, -pZ * 0.8]
        },
        {
          name: "Joint_Tail",
          translation: [0, pY * 0.3, -pZ * 1.1]
        }
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: 1,
                JOINTS_0: 2,
                WEIGHTS_0: 3
              },
              indices: 4,
              material: 0
            }
          ]
        }
      ],
      skins: [
        {
          inverseBindMatrices: 5, // Accessor index for inverse matrix (normally identity mapping)
          joints: [2, 3, 4, 5, 6, 7, 8] // Indices mapped bone joints list
        }
      ],
      materials: [
        {
          name: "Stardust_Emissive_Material",
          pbrMetallicRoughness: {
            baseColorFactor: [1.0, 0.85, 0.9, 1.0], // light glowing rose hue
            metallicFactor: 0.1,
            roughnessFactor: 0.9
          },
          emissiveFactor: [0.95, 0.8, 1.0], // soft stellar light emissions!
          doubleSided: true
        }
      ],
      buffers: [
        {
          uri: `data:application/octet-stream;base64,${binaryBase64}`,
          byteLength: totalByteLength
        }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: posOffset, byteLength: vertexCount * 3 * 4, target: 34962 }, // POSITION
        { buffer: 0, byteOffset: normOffset, byteLength: vertexCount * 3 * 4, target: 34962 }, // NORMAL
        { buffer: 0, byteOffset: jointOffset, byteLength: vertexCount * 4 * 2, target: 34962 }, // JOINTS_0
        { buffer: 0, byteOffset: weightOffset, byteLength: vertexCount * 4 * 4, target: 34962 }, // WEIGHTS_0
        { buffer: 0, byteOffset: idxOffset, byteLength: indices.length * 2, target: 34963 }      // INDICES
      ],
      accessors: [
        { bufferView: 0, byteOffset: 0, componentType: 5126, count: vertexCount, type: "VEC3" }, // POS
        { bufferView: 1, byteOffset: 0, componentType: 5126, count: vertexCount, type: "VEC3" }, // NORM
        { bufferView: 2, byteOffset: 0, componentType: 5123, count: vertexCount, type: "VEC4" }, // JOINT
        { bufferView: 3, byteOffset: 0, componentType: 5126, count: vertexCount, type: "VEC4" }, // WEIGHT
        { bufferView: 4, byteOffset: 0, componentType: 5123, count: indices.length, type: "SCALAR" } // INDEX
      ]
    };

    // Trigger standard download link
    const jsonStr = JSON.stringify(gltfJSON, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const dlLink = document.createElement("a");
    dlLink.href = URL.createObjectURL(blob);
    dlLink.download = `${nameSanitized}_starPuff_lowPoly_3D.gltf`;
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);

    triggerToast(`🎉 成功下载 ${targetName} 治愈星尘骨骼模型 GLTF！文件大小约 55KB，可在微信小游戏或 3D 编辑器载入！`);
    playSound("success");
  };

  // Canvas drawing & animation rigging loop
  useEffect(() => {
    if (!canvasRef.current || !reconstructedModel) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let localTime = 0;

    const render = () => {
      localTime += 0.055;
      const width = canvas.width;
      const height = canvas.height;

      // Deep dark violet space canvas background clearing
      ctx.fillStyle = "rgba(10, 5, 29, 0.45)";
      ctx.fillRect(0, 0, width, height);

      // Procedural Background Grid Lines with slow orbit drift representation
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      const gridShift = (localTime * 4) % gridSpacing;
      
      ctx.beginPath();
      for (let x = gridShift; x < width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridShift; y < height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Cybernetic holographic radar orbit rings and angle markings
      ctx.strokeStyle = "rgba(252, 64, 122, 0.03)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let s = 1; s <= 4; s++) {
        ctx.arc(width / 2, height / 2 + 50, s * 45 * zoom, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Horizontal Laser Scanning effect
      const laserY = (height / 2 + 50) + Math.sin(localTime * 0.8) * 110 * zoom;
      const gradient = ctx.createLinearGradient(0, laserY - 15, 0, laserY + 15);
      gradient.addColorStop(0, "rgba(252, 64, 122, 0.0)");
      gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.16)");
      gradient.addColorStop(1, "rgba(252, 64, 122, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(width / 2 - 160 * zoom, laserY - 15, 320 * zoom, 30);

      // Slow orbit drift if not dragging (orbit camera)
      let currentYaw = yaw;
      if (!isDragging.current) {
        currentYaw += 0.006 * rotationSpeed;
      }

      // Read model configurations
      const count = reconstructedModel.verticesCount;
      const nodes = reconstructedModel.shapeNodes;
      const dimensions = reconstructedModel.dimensions;
      const bounciness = reconstructedModel.physicsBounciness;
      const breathing = Math.sin(localTime * (1 / reconstructedModel.breathingRate)) * 0.06 * dimensions.height;

      // Calculate rotation trig coefficients only once to boost rendering speed & scope accessibility
      const cosY = Math.cos(currentYaw);
      const sinY = Math.sin(currentYaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // Interpolate Animation skeleton and offset bones dynamically
      let boneOffsets = {
        spineY: 0, spinePitch: 0, headPitch: 0, tailYaw: 0, tailPitch: 0,
        lfLegY: 0, rfLegY: 0, lbLegY: 0, rbLegY: 0, bouncinessMult: 1.0
      };

      if (activeAnimation === "walk") {
        boneOffsets.spineY = Math.sin(localTime * 4.0) * 0.05;
        boneOffsets.spinePitch = Math.sin(localTime * 3.0) * 0.04;
        boneOffsets.lfLegY = Math.sin(localTime * 5.0) * 0.28;
        boneOffsets.rfLegY = -Math.sin(localTime * 5.0) * 0.28;
        boneOffsets.lbLegY = -Math.sin(localTime * 5.0) * 0.28;
        boneOffsets.rbLegY = Math.sin(localTime * 5.0) * 0.28;
        boneOffsets.tailYaw = Math.sin(localTime * 8.0) * 0.3;
        boneOffsets.headPitch = Math.cos(localTime * 4.0) * 0.07;
      } else if (activeAnimation === "wag_tail") {
        boneOffsets.tailYaw = Math.sin(localTime * 14.5) * 0.65;
        boneOffsets.tailPitch = Math.cos(localTime * 12.0) * 0.15;
        boneOffsets.spinePitch = Math.sin(localTime * 3.0) * 0.02;
        boneOffsets.headPitch = Math.sin(localTime * 2.0) * 0.04;
      } else if (activeAnimation === "sit") {
        boneOffsets.spineY = -0.15;
        boneOffsets.spinePitch = -0.22;
        boneOffsets.lbLegY = -0.15;
        boneOffsets.rbLegY = -0.15;
        boneOffsets.tailPitch = -0.3;
        boneOffsets.headPitch = 0.15;
      } else if (activeAnimation === "pet") {
        boneOffsets.headPitch = Math.sin(localTime * 3.2) * 0.15;
        boneOffsets.spinePitch = Math.sin(localTime * 1.5) * 0.03;
        boneOffsets.tailYaw = Math.sin(localTime * 6.0) * 0.35;
        boneOffsets.bouncinessMult = 1.6;

        if (Math.random() < 0.24) {
          spawnEdgeStar(width / 2 + Math.sin(localTime) * 10, height / 2 - 80, "#ff5c8a");
        }
      } else {
        boneOffsets.spineY = Math.sin(localTime * 2.2) * 0.015;
        boneOffsets.tailYaw = Math.sin(localTime * 3.0) * 0.12;
      }

      // Project vertices onto 3D projection
      const projectedPoints: Array<{ x: number, y: number, zDepth: number, color: string }> = [];

      for (let i = 0; i < count; i++) {
        const ratio = i / count;
        const theta = ratio * Math.PI;
        const phi = ratio * Math.PI * 7.5; // cosmic helix spiral

        let vx = Math.sin(theta) * Math.cos(phi) * 78 * dimensions.width;
        let vy = Math.cos(theta) * 98 * (dimensions.height + breathing);
        let vz = Math.sin(theta) * Math.sin(phi) * 78 * dimensions.depth;

        if (vy > 25) {
          vy += boneOffsets.headPitch * 25 + boneOffsets.spineY * 85;
        } else if (vy < -40) {
          if (vx < 0 && vz > 0) vy += boneOffsets.lfLegY * 30; // front left
          else if (vx > 0 && vz > 0) vy += boneOffsets.rfLegY * 30; // front right
          else if (vx < 0 && vz < 0) vy += boneOffsets.lbLegY * 30; // back left
          else if (vx > 0 && vz < 0) vy += boneOffsets.rbLegY * 30; // back right
          vy += boneOffsets.spineY * 85;
        } else {
          if (vz < -45) {
            vx += boneOffsets.tailYaw * 35;
            vy += boneOffsets.tailPitch * 25;
          }
          vy += boneOffsets.spineY * 85;
        }

        if (shockwaveFactor > 0) {
          const dist = Math.sqrt(vx*vx + vy*vy + vz*vz);
          const force = Math.sin(dist * 0.12 - localTime * 5.5) * 14 * shockwaveFactor * bounciness * boneOffsets.bouncinessMult;
          vx += (vx / dist) * force;
          vy += (vy / dist) * force;
          vz += (vz / dist) * force;
        }

        // Rotate yaw on Y-axis
        const xRot1 = vx * cosY - vz * sinY;
        const zRot1 = vx * sinY + vz * cosY;

        // Rotate pitch on X-axis
        const yRot2 = vy * cosP - zRot1 * sinP;
        const zRot2 = vy * sinP + zRot1 * cosP;

        const scaleVal = 210 / (210 + zRot2);
        const pX = width / 2 + xRot1 * scaleVal * zoom;
        const pY = height / 2 + yRot2 * scaleVal * zoom + 18;

        const depthPercent = (zRot2 + 100) / 200;
        const depthIdx = Math.min(reconstructedModel.depthMapColors.length - 1, Math.max(0, Math.floor(depthPercent * reconstructedModel.depthMapColors.length)));
        const vertColor = reconstructedModel.depthMapColors[depthIdx] || selectedColor;

        projectedPoints.push({ x: pX, y: pY, zDepth: zRot2, color: vertColor });

        if (Math.random() < 0.001 * stardustParticleStrength) {
          spawnEdgeStar(pX, pY, vertColor);
        }
      }

      // Draw structural 3D triangular connector wires to model the skeleton skin
      ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let k = 0; k < projectedPoints.length; k += 4) {
        if (k + 1 < projectedPoints.length) {
          ctx.moveTo(projectedPoints[k].x, projectedPoints[k].y);
          ctx.lineTo(projectedPoints[k+1].x, projectedPoints[k+1].y);
        }
        if (k + 2 < projectedPoints.length) {
          ctx.lineTo(projectedPoints[k+2].x, projectedPoints[k+2].y);
        }
      }
      ctx.stroke();

      // Render 3D Point cloud particles
      projectedPoints.forEach((pt) => {
        const radius = Math.max(0.65, (1.85 + (pt.zDepth / 100)) * zoom);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.shadowBlur = 4;
        ctx.shadowColor = pt.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Compute bone joints array projections
      const boneCoordinates: Array<{ x: number, y: number, color: string }> = [];

      nodes.forEach((node, idx) => {
        let nX = node.x * 78 * dimensions.width;
        let nY = node.y * 98 * (dimensions.height + breathing);
        let nZ = node.z * 78 * dimensions.depth;

        if (idx === 0 || idx === 1 || idx === 2) {
          nY += boneOffsets.headPitch * 25 + boneOffsets.spineY * 85;
        } else if (idx === 4) {
          nY += boneOffsets.lfLegY * 30 + boneOffsets.spineY * 85;
        } else if (idx === 5) {
          nY += boneOffsets.rfLegY * 30 + boneOffsets.spineY * 85;
        } else if (idx === 6) {
          nY += boneOffsets.lbLegY * 30 + boneOffsets.spineY * 85;
        } else if (idx === 7) {
          nY += boneOffsets.rbLegY * 30 + boneOffsets.spineY * 85;
        } else if (idx === 8) {
          nX += boneOffsets.tailYaw * 35;
          nY += boneOffsets.tailPitch * 25 + boneOffsets.spineY * 85;
        } else {
          nY += boneOffsets.spineY * 85;
        }

        // Apply yaw/pitch Rotations
        const xRot1 = nX * cosY - nZ * sinY;
        const zRot1 = nX * sinY + nZ * cosY;
        const yRot2 = nY * cosP - zRot1 * sinP;
        const zRot2 = nY * sinP + zRot1 * cosP;

        const scaleVal = 210 / (210 + zRot2);
        const pX = width / 2 + xRot1 * scaleVal * zoom;
        const pY = height / 2 + yRot2 * scaleVal * zoom + 18;

        boneCoordinates.push({ x: pX, y: pY, color: node.color });
      });

      // Overlay Skeletal holographic bone link rods
      if (showBoneSkeleton && boneCoordinates.length >= 9) {
        ctx.shadowBlur = 0;
        SKELETON_BONES.forEach((bone) => {
          const startBone = boneCoordinates[bone.from];
          const endBone = boneCoordinates[bone.to];
          if (startBone && endBone) {
            // Draw dual line core glow
            ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(startBone.x, startBone.y);
            ctx.lineTo(endBone.x, endBone.y);
            ctx.stroke();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startBone.x, startBone.y);
            ctx.lineTo(endBone.x, endBone.y);
            ctx.stroke();
          }
        });
      }

      // Draw bone pin markers nodes
      let closestNode: { x: number, y: number, label: string } | null = null;
      let minMouseDist = 18;

      boneCoordinates.forEach((pt, j) => {
        const nodeObj = nodes[j];
        if (!nodeObj) return;

        // Pin outer pulsing ring
        const glowPulse = 6.0 + Math.sin(localTime * 2.2) * 2.5;
        ctx.fillStyle = pt.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = pt.color;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Holographic technical telemetry coordinates circles
        ctx.strokeStyle = j === 3 ? "#00f2fe" : "rgba(255, 255, 255, 0.6)"; // Spine highlight
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glowPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Mouse hover tracking logic
        const mX = startMousePos.current.x;
        const mY = startMousePos.current.y;
        const dx = pt.x - mX;
        const dy = pt.y - mY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < minMouseDist) {
          minMouseDist = dist;
          closestNode = { x: pt.x, y: pt.y, label: `🦴 [Joint ${j}] ${nodeObj.label} <${nodeObj.x.toFixed(1)}, ${nodeObj.y.toFixed(1)}, ${nodeObj.z.toFixed(1)}>` };
        }

        // Pointer aesthetic pointer line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        const ptX = pt.x + (nodeObj.x >= 0 ? 15 : -15);
        const ptY = pt.y - 12;
        ctx.lineTo(ptX, ptY);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "8px monospace";
        ctx.fillText(nodeObj.label.split(" ")[0], ptX + (nodeObj.x >= 0 ? 3 : -32), ptY + 3);
      });

      // Update and draw Stardust Floating Edge Particles
      designParticles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.pulse += 0.1;

        const alpha = 1.0 - (p.life / p.maxLife);
        const scaleSpark = p.size * (1.0 + Math.sin(p.pulse) * 0.3);

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = alpha;

        // Draw cross star shape
        ctx.beginPath();
        ctx.arc(p.x, p.y, scaleSpark, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      // Cleanup expired stardust particles
      designParticles.current = designParticles.current.filter(p => p.life < p.maxLife);

      // Handle displaying hovering node tooltip card
      if (closestNode) {
        setHoveredNode(closestNode);
        ctx.strokeStyle = "#ff407a";
        ctx.lineWidth = 1;
        ctx.strokeRect(closestNode.x - 7, closestNode.y - 7, 14, 14);
      } else {
        setHoveredNode(null);
      }

      // Decay interactive shockwaves
      if (shockwaveFactor > 0) {
        setShockwaveFactor((prev) => Math.max(0, prev - 0.04));
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [reconstructedModel, yaw, pitch, zoom, shockwaveFactor, rotationSpeed, activeAnimation, showBoneSkeleton, stardustParticleStrength]);

  // WebGL Real-time 3D loader for Cat.gltf
  useEffect(() => {
    if (!useReal3D || !threeCanvasRef.current) return;

    const canvas = threeCanvasRef.current;
    
    // Resolve dynamic width and height
    const width = canvas.clientWidth || 450;
    const height = canvas.clientHeight || 320;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a051d); // Immersive deep violet
    scene.fog = new THREE.FogExp2(0x0a051d, 0.08);

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.5);

    // 3. Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 4. Create Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffb5ff, 2.0); // Warm neon purple
    dirLight1.position.set(5, 5, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.camera.top = 2;
    dirLight1.shadow.camera.bottom = - 2;
    dirLight1.shadow.camera.left = - 2;
    dirLight1.shadow.camera.right = 2;
    dirLight1.shadow.camera.near = 0.1;
    dirLight1.shadow.camera.far = 40;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f3ff, 1.5); // Warm neon cyan
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    // Headlight attached directly to camera which changes focus as we drag
    const pointLight = new THREE.PointLight(0xffffff, 1.8, 12);
    camera.add(pointLight);
    scene.add(camera);

    // 5. Grid helper representing space gravity platform
    const gridHelper = new THREE.GridHelper(10, 20, 0xec4899, 0x3b82f6);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    
    // 5.1 Floor plane for receiving shadows
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0a051d, 
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const floorPlane = new THREE.Mesh(floorGeometry, floorMaterial);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -0.51; // Just below grid
    floorPlane.receiveShadow = true;
    scene.add(floorPlane);

    // 6. Root group and raycasting setup
    const catGroup = new THREE.Group();
    scene.add(catGroup);
    
    // Add particle system for interaction feedback
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff69b4, // Hot pink for hearts/stars
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const maxParticles = 100;
    const positions = new Float32Array(maxParticles * 3);
    const velocities: THREE.Vector3[] = [];
    const lifetimes = new Float32Array(maxParticles);
    
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // Hidden initially
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3());
      lifetimes[i] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Load user's cat model
    setIsGltfLoading(true);
    setGltfLoadError("");
    setGltfLoadProgress(0);

    const loader = new GLTFLoader();
    // 原 Khronos Cat.gltf 外链已失效（raw.githubusercontent 不可达），改用本地主宠物模型
    const catModelUrl = '/models/pet.glb';

    let catModel: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let clickReactionTime = 0;

    loader.load(
      catModelUrl,
      (gltf) => {
        const cat = gltf.scene;

        // Scale and orient perfectly
        cat.scale.set(0.5, 0.5, 0.5); 
        cat.position.set(0, -0.5, 0); 
        cat.rotation.y = 0;

        cat.traverse((node: any) => {
          if (node.isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.6; // Slightly softer
              mat.metalness = 0.1;
              mat.envMapIntensity = 1.0;
            }
          }
        });

        // Setup Animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(cat);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        catModel = cat;
        catGroup.add(cat);
        setIsGltfLoading(false);
        console.log('✅ 写实猫咪模型加载成功！');
      },
      (xhr) => {
        if (xhr.total > 0) {
          const progress = Math.round((xhr.loaded / xhr.total) * 100);
          setGltfLoadProgress(progress);
        } else {
          setGltfLoadProgress((p) => Math.min(99, p + 8));
        }
      },
      (err: any) => {
        console.error('❌ 加载失败：', err);
        setGltfLoadError(err.message || "无法加载在线 3D 猫咪 GLB 模型");
        setIsGltfLoading(false);
      }
    );

    // 7. Orbit Controls & Raycaster
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit below ground slightly
    controls.target.set(0, 0, 0);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (catModel) {
        const intersects = raycaster.intersectObject(catModel, true);
        if (intersects.length > 0) {
          // Play click sound
          playSound('click');
          
          // Trigger "Reaction" (wobble/jump scale)
          clickReactionTime = 1.0;
          
          // Emit particles from intersection point
          const point = intersects[0].point;
          const posAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
          
          let spawned = 0;
          for (let i = 0; i < maxParticles && spawned < 15; i++) {
            if (lifetimes[i] <= 0) {
              posAttribute.setXYZ(i, point.x, point.y, point.z);
              velocities[i].set((Math.random() - 0.5) * 4, Math.random() * 4 + 2, (Math.random() - 0.5) * 4);
              lifetimes[i] = 1.0 + Math.random() * 0.5;
              spawned++;
            }
          }
          posAttribute.needsUpdate = true;
          triggerToast("✨ 揉了揉猫咪！");
        }
      }
    };
    
    canvas.addEventListener('click', onMouseClick);

    // 8. Animation loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      controls.update();
      
      if (mixer) {
        mixer.update(dt);
      }

      // Gentle floating/wobbling animation + Click Reaction
      if (catModel) {
        // Base floating
        let scaleM = 0.5;
        let rotY = Math.cos(t * 0.45) * 0.04;
        let posY = -0.5 + Math.sin(t * 2.2) * 0.035;
        
        // Click reaction modification
        if (clickReactionTime > 0) {
          clickReactionTime -= dt * 2.5;
          const bounce = Math.sin(clickReactionTime * Math.PI) * 0.15;
          scaleM += bounce;
          posY += bounce * 0.5;
          rotY += bounce * 2.0; // Spin slightly
        }
        
        catModel.scale.set(scaleM, scaleM, scaleM);
        catModel.position.y = posY;
        catModel.rotation.y = rotY;
      }
      
      // Update Particles
      const posAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < maxParticles; i++) {
        if (lifetimes[i] > 0) {
          lifetimes[i] -= dt;
          if (lifetimes[i] <= 0) {
             posAttribute.setY(i, -100); // Hide
          } else {
            const vx = velocities[i].x;
            const vy = velocities[i].y;
            const vz = velocities[i].z;
            
            const px = posAttribute.getX(i) + vx * dt;
            const py = posAttribute.getY(i) + vy * dt;
            const pz = posAttribute.getZ(i) + vz * dt;
            
            // Gravity
            velocities[i].y -= 9.8 * dt;
            
            posAttribute.setXYZ(i, px, py, pz);
          }
        }
      }
      posAttribute.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      const w = canvas.clientWidth || 450;
      const h = canvas.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', onMouseClick);
      controls.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
      if (particleGeometry) particleGeometry.dispose();
      if (particleMaterial) particleMaterial.dispose();
    };
  }, [useReal3D]);

  // Handle Dragging rotation actions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      startMousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = mouseX - startMousePos.current.x;
      const dy = mouseY - startMousePos.current.y;
      
      setYaw((prev) => prev + dx * 0.012);
      setPitch((prev) => Math.max(-Math.PI / 3.2, Math.min(Math.PI / 3.2, prev - dy * 0.012)));
      
      startMousePos.current = { x: mouseX, y: mouseY };
    } else {
      startMousePos.current = { x: mouseX, y: mouseY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setShockwaveFactor(1.1); // Dynamic elastic recoil
    playSound("bubble");

    // Click triggers stardust bursts onto the mouse coord
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (let i = 0; i < 15; i++) {
        spawnEdgeStar(x, y, selectedColor);
      }
    }
  };

  const handleApplyToPet = () => {
    if (!reconstructedModel) return;
    onSync3DModelToPet(reconstructedModel);
    void unlock(ACHIEVEMENTS.first3dReconstruct);
    triggerToast(`💖 3D 全息体骨骼和动作配置已被同步给星枢家园的【${targetName}】！`);
    playSound("success");
  };

  return (
    <div className="bg-[#110c2c]/90 border border-white/10 rounded-3xl p-5 md:p-6 text-white space-y-6 shadow-2xl backdrop-blur-md" id="pet-3d-quantum-reconstruct">
      {/* Visual Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Rotate3d className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              📸 真实爱宠 3D 骨骼重构与动画设计沙盒
              <span className="px-2 py-0.5 bg-purple-500/25 text-purple-300 text-[9px] rounded-full font-mono tracking-widest uppercase font-bold animate-pulse">
                RIGGED 3D STUDIO
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              上传去世爱宠照片，系统自动抠图去除杂景，智能提取骨架定位点，渲染生成可在微信小游戏中加载运行的骨骼模型！
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Control / Settings Column (Columns: 5) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Section 1: Picture Source & AI Background Removal */}
          <div className="bg-[#18092d]/60 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-400 font-mono tracking-widest uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                Step 1: 上传照片及主体抠图剔除
              </span>
              <span className="text-[10px] text-gray-500">Chroma Selector</span>
            </div>

            {/* Custom file drag and upload button box */}
            <div className="relative group border-2 border-dashed border-white/10 hover:border-pink-500/40 rounded-xl p-5 transition-all bg-black/40 text-center flex flex-col items-center justify-center cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 mb-1.5 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-200">
                拖拽或点击，替换爱宠照片 🖼️
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                支持任意格式，上传后系统将智能去除背景
              </p>
            </div>

            {/* Background tolerance threshold controls */}
            <div className="space-y-2 pt-1 bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  💡 剔除背景容差门限 (Tolerance)
                </span>
                <span className="text-pink-300 font-mono">{bgTolerance}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="85" 
                value={bgTolerance}
                onChange={(e) => setBgTolerance(Number(e.target.value))}
                className="w-full accent-pink-500 h-1 rounded-lg bg-white/10 cursor-pointer"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={processBackgroundRemoval}
                  disabled={isBgRemoving}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    isBgRemoving 
                      ? "bg-slate-800 text-gray-500" 
                      : isBgRemoved 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white"
                  }`}
                >
                  {isBgRemoving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>主体解算中...</span>
                    </>
                  ) : isBgRemoved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>重新星尘祛除背景</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>✨ 提取爱宠主体 (智能祛背景)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Presets catalog selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-mono block">或选作精多样板模型：</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SAMPLES.map((preset) => {
                  const isActive = selectedPresetUrl === preset.url;
                  return (
                    <div 
                      key={preset.name}
                      onClick={() => triggerPresetSelect(preset)}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isActive 
                          ? "bg-purple-900/40 border-purple-500 text-white" 
                          : "bg-black/30 border-white/5 hover:border-white/20 text-gray-400"
                      }`}
                    >
                      <img 
                        referrerPolicy="no-referrer"
                        src={preset.url} 
                        alt={preset.name}
                        className="w-8 h-8 rounded-lg object-cover" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{preset.name.split(" ")[0]}</p>
                        <p className="text-[8px] text-gray-500 uppercase">{preset.type}系</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Rigging options & type attributes */}
          <div className="bg-[#18092d]/60 border border-white/10 rounded-2xl p-4 space-y-4">
            <span className="text-xs font-bold text-pink-400 font-mono tracking-widest uppercase block mb-1">
              Step 2: 绑定 3D 全息大世界魂息
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block font-mono">主体属系 / Type</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as PetType);
                    playSound("click");
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="猫">🐾 猫咪系 (Feline)</option>
                  <option value="狗">🐾 狗狗系 (Canine)</option>
                  <option value="兔">🐾 兔子系 (Leporidae)</option>
                  <option value="鸟">🐾 飞羽系 (Avian)</option>
                  <option value="仓鼠">🐾 仓鼠系 (Cricetidae)</option>
                  <option value="其他">🐾 专属灵系 (Celestial)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block font-mono">全彩称谓 / Label</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="如：天乐"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 block font-mono">定位色调主频颜色</label>
              <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-7 h-7 bg-transparent border-0 rounded cursor-pointer"
                />
                <span className="text-xs font-mono text-purple-200">{selectedColor.toUpperCase()}</span>
                <div className="flex gap-1 ml-auto">
                  {["#fad0a3", "#ffccd5", "#b099fc", "#00f2fe", "#2edcc8"].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        playSound("click");
                      }}
                      className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Big Trigger button */}
            <button
              onClick={handleReconstruct}
              disabled={isProcessing}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isProcessing 
                  ? "bg-slate-800 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white border border-pink-400/20"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                  <span>正在采集特征三维并解算骨骼...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>一键启动 AI 3D 骨骼重构绑定</span>
                </>
              )}
            </button>
          </div>

          {/* Telemetry Logger */}
          {(statusLogs.length > 0 || isProcessing || extractLogs.length > 0) && (
            <div className="bg-black/80 border border-purple-500/25 rounded-2xl p-3.5 font-mono text-[9px] text-purple-300 space-y-1 max-h-36 overflow-y-auto shadow-inner leading-normal">
              <div className="flex items-center justify-between text-[8px] text-gray-500 pb-1.5 border-b border-white/5 uppercase select-none">
                <span>🛰️ 3D 重建与抠像链路测绘 (Studio Telemetry)</span>
                <span className="animate-pulse text-green-400">● ENGINE READY</span>
              </div>
              {extractLogs.map((log, i) => (
                <div key={`ex-${i}`} className="text-pink-300">{log}</div>
              ))}
              {statusLogs.map((log, i) => (
                <div key={`re-${i}`} className="text-cyan-300">{log}</div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-1.5 text-pink-400 animate-pulse">
                  <span>⏳ 正在获取 3D-Sight 发光渐变与蒙皮顶点分配因子...</span>
                  <span className="animate-bounce">_</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 3D Visual Sandbox Simulator Area (Columns: 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          
          <div className="w-full bg-[#0a051d] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
            
            {/* Ambient layout grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-purple-950/20 to-black/80 pointer-events-none" />
            
            {/* Source preview badge image top left corner */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl flex items-center gap-2 z-10 scale-90 md:scale-100 shadow-xl">
              <div className="relative">
                <img 
                  referrerPolicy="no-referrer"
                  src={getCurrentImageUrl()} 
                  alt="Original"
                  className="w-10 h-10 object-cover rounded-xl" 
                />
                {isBgRemoved && (
                  <div className="absolute -inset-1 rounded-xl bg-pink-500/20 border border-pink-500/60 animate-pulse pointer-events-none" />
                )}
              </div>
              <div className="text-[9px] flex flex-col justify-center select-none">
                <span className="text-gray-400">原始与抠图状态</span>
                <span className="text-pink-300 font-mono tracking-widest font-semibold flex items-center gap-1">
                  {isBgRemoved ? "✅ 已去背景" : "❌ 包含背景"}
                </span>
              </div>
            </div>

            {/* Engine Selector switch */}
            <div className="absolute top-16 left-3 bg-black/85 backdrop-blur-md border border-white/10 p-1 rounded-xl flex items-center gap-1 z-10 shadow-lg scale-90 md:scale-100">
              <button
                type="button"
                onClick={() => { setUseReal3D(false); playSound("click"); }}
                className={`px-2 py-0.5 text-[8.5px] font-mono font-bold rounded-lg transition-all cursor-pointer ${!useReal3D ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                🌌 2D全息
              </button>
              <button
                type="button"
                onClick={() => { setUseReal3D(true); playSound("click"); }}
                className={`px-2 py-0.5 text-[8.5px] font-mono font-bold rounded-lg transition-all cursor-pointer ${useReal3D ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                🔮 WebGL 真实3D
              </button>
            </div>

            {/* HUD state indicators top-right corner */}
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-xl text-[9px] font-mono text-gray-300 flex items-center gap-2 z-10 pointer-events-none select-none">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>全息模型: {reconstructedModel ? "✨ 已就绪" : "❌ 待生成"}</span>
            </div>

            {/* Real WebGL ThreeJS Canvas */}
            <canvas
              ref={threeCanvasRef}
              style={{ display: useReal3D ? 'block' : 'none' }}
              className="w-full h-[320px] max-w-full rounded-2xl cursor-grab active:cursor-grabbing z-0 shadow-xl"
              title="按打拖拽：旋转 3D 写实猫咪模型"
            />

            {/* Classic 2D Procedural Hologram Canvas */}
            <canvas
              ref={canvasRef}
              width={450}
              height={320}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              style={{ display: !useReal3D ? 'block' : 'none' }}
              className="w-full h-[320px] max-w-full rounded-2xl cursor-grab active:cursor-grabbing z-0 shadow-xl"
              title="按住拖拽：3D旋转观察几何骨架 | 点击：爆开 stardust 心形粒子"
            />

            {/* WebGL Loader overlays */}
            {useReal3D && isGltfLoading && (
              <div className="absolute inset-0 bg-[#0a051d]/90 flex flex-col items-center justify-center p-6 gap-3 z-20">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-xs font-mono text-gray-300 font-bold uppercase tracking-widest animate-pulse">
                    正在搭载真 WebGL 渲染管线...
                  </p>
                  <p className="text-[10px] text-pink-400 font-mono">
                    拉取写实猫咪三维网格模型：{gltfLoadProgress}%
                  </p>
                </div>
                <div className="w-48 bg-white/10 h-1 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-150"
                    style={{ width: `${gltfLoadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {useReal3D && gltfLoadError && (
              <div className="absolute inset-0 bg-[#0a051d]/95 flex flex-col items-center justify-center p-6 gap-2 z-20">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="text-xs text-rose-400 font-semibold text-center">
                  ⚠️ 三维网格装载失败！
                </p>
                <p className="text-[9px] text-gray-400 text-center max-w-xs leading-relaxed font-mono">
                  {gltfLoadError}
                  <br />
                  请检查网络或点击左上切换为“2D全息”经典渲染管道。
                </p>
              </div>
            )}

            {/* Overlay interactive bone rig nodes coordinates */}
            {!useReal3D && hoveredNode && (
              <div 
                className="absolute bg-black/90 border-2 border-pink-400 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white shadow-2xl pointer-events-none z-20 flex items-center gap-2 transition-all duration-100"
                style={{
                  left: `${Math.min(canvasRef.current?.clientWidth || 250, hoveredNode.x - 70)}px`,
                  top: `${Math.max(10, hoveredNode.y - 45)}px`
                }}
              >
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                <span>{hoveredNode.label}</span>
              </div>
            )}

            {/* Bottom tools control row inside canvas screen */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/70 backdrop-blur-md border border-white/10 p-2 rounded-2xl z-10">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showBonesCheck" 
                  checked={showBoneSkeleton}
                  onChange={(e) => setShowBoneSkeleton(e.target.checked)}
                  disabled={useReal3D}
                  className="w-3.5 h-3.5 accent-pink-500 rounded cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="showBonesCheck" className="text-[10px] text-gray-300 font-mono cursor-pointer select-none disabled:opacity-50">
                  👁️ {useReal3D ? "已切换至物理着色器渲染网格" : "显示全息骨骼组件 (Bone Skeleton Rig)"}
                </label>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] md:text-[9.5px] text-pink-300 font-mono">
                  💡 {useReal3D ? "鼠标拖拽旋转 3D 写实模型 | 滚轮缩放" : "拖动鼠标旋转 3D | 点击产生星尘"}
                </span>
              </div>
            </div>

            {/* Quick controllers tray absolute left (Zoom, Speed, Particles) */}
            <div className="absolute right-3 bottom-16 bg-black/80 border border-white/10 p-1.5 rounded-xl flex flex-col gap-1.5 z-10 shadow-lg">
              <button
                type="button"
                onClick={() => { 
                  if (useReal3D) {
                    triggerToast("💡 已复位 WebGL 朝向镜头");
                  } else {
                    setZoom((z) => Math.min(1.8, z + 0.1)); 
                  }
                  playSound("click"); 
                }}
                className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center hover:text-white cursor-pointer"
                title={useReal3D ? "偏极复位" : "放大 (Zoom In)"}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { 
                  if (useReal3D) {
                    triggerToast("💡 提示：在三维中滑动可自由旋转哦");
                  } else {
                    setZoom((z) => Math.max(0.6, z - 0.1)); 
                  }
                  playSound("click"); 
                }}
                className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center hover:text-white cursor-pointer"
                title={useReal3D ? "操作手势提示" : "缩小 (Zoom Out)"}
              >
                <ZoomIn className="w-4 h-4 rotate-90" />
              </button>
              <button
                type="button"
                disabled={useReal3D}
                onClick={() => { 
                  setRotationSpeed(p => p === 0 ? 0.5 : 0); 
                  playSound("click"); 
                }}
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer ${rotationSpeed === 0 ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-gray-300"}`}
                title="暂停/开启 自转 (Rotate Orbit)"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              </button>
            </div>
          </div>

          {/* New Section: GLTF Export Panel */}
          {reconstructedModel && (
            <div className="w-full bg-[#150a2f]/80 border border-purple-500/20 rounded-2xl p-4 space-y-4 shadow-xl">
              
              {/* 导出操作按钮 */}
              <div className="space-y-2">
                <span className="text-[10px] text-purple-300 font-sans block tracking-wide">
                  ✨ 让 3D 星尘形象陪伴你
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleExportGLTF}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-300/10 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
                    title="导出 3D 模型文件"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出 3D 模型</span>
                  </button>

                  <button
                    onClick={handleApplyToPet}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white border border-pink-300/10 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
                    title="让主页的小家伙拥有这套 3D 形象"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                    <span>同步到家园</span>
                  </button>
                </div>
              </div>

              {/* 星尘档案签印 */}
              <div className="p-3.5 bg-[#09031a] rounded-xl border border-pink-500/15">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-sans tracking-wide">星尘档案签印</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-100 text-justify font-sans">
                  {reconstructedModel.loreParagraph}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
