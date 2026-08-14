import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnimatedPetModel } from "../pet3d/AnimatedPetModel";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, Suspense } from "react";
import { PetConfig } from "../types";
import { playSound } from "../audio/AudioSynth";

export function adjustBrightness(hex: string, percent: number): string {
  if (!hex || hex[0] !== '#') return hex || '#ffffff';
  let num = parseInt(hex.slice(1), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
}

export function drawVoxelCube(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  
  // Left face (shaded darker)
  ctx.fillStyle = adjustBrightness(color, -25);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size, y - size / 2);
  ctx.lineTo(x - size, y + size - size / 2);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();

  // Right face (medium shaded)
  ctx.fillStyle = adjustBrightness(color, -10);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y - size / 2);
  ctx.lineTo(x + size, y + size - size / 2);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();

  // Top face (highlight brightest)
  ctx.fillStyle = adjustBrightness(color, 15);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size, y - size / 2);
  ctx.lineTo(x, y - size);
  ctx.lineTo(x + size, y - size / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

interface HomeCanvasProps {
  petConfig: PetConfig;
  equipped: {
    halo: string | null;  // e.g. "halo_golden"
    trail: string | null; // e.g. "trail_neon"
    orbit: string | null; // e.g. "orbit_stars"
    cape: string | null;  // e.g. "cape_aurora"
  };
  onClickPet?: () => void;
  stardustSparkleTrigger?: number; // incremental trigger from outside
}

// Visual Model engine visualization modes
type RenderingMode = "shaded" | "wireframe" | "rig" | "xray" | "model3d" | "voxel" | "realistic-stardust";
type WeatherType = "clear" | "star-rain" | "aurora" | "snow";
type CycleTimeType = "day" | "sunset" | "night";

export default function HomeCanvas({ petConfig, equipped, onClickPet, stardustSparkleTrigger }: HomeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [useReal3D, setUseReal3D] = useState<boolean>(true);
  const useReal3DRef = useRef(true);
  const animationRef = useRef<number | null>(null);

  // 沉睡状态 ref（由 petConfig.isSleeping 驱动，供 rAF 主循环读取）
  const isSleepingRef = useRef<boolean>(petConfig.isSleeping ?? false);

  // Day & Night atmospheric systems state
  const [skyTime, setSkyTime] = useState<CycleTimeType>("night");
  const [skyWeather, setSkyWeather] = useState<WeatherType>("clear");

  useEffect(() => {
    useReal3DRef.current = useReal3D;
  }, [useReal3D]);

  useEffect(() => {
    isSleepingRef.current = petConfig.isSleeping ?? false;
  }, [petConfig.isSleeping]);

  // Determine pet species type
  const species = (() => {
    const t = petConfig.type || "";
    if (t.includes("猫")) return "cat";
    if (t.includes("狗")) return "dog";
    if (t.includes("兔")) return "rabbit";
    if (t.includes("鼠")) return "hamster";
    return "cat";
  })();

  // Pet Emotion System indicators (心情, 能量, 亲密) with LocalStorage persistence
  // 存储 key 使用稳定 id（避免同名宠物互相覆盖、改名后数据成孤儿），并兼容旧的 name key
  const petStorageKey = petConfig.id ?? petConfig.name;

  const readPetStat = (key: string, fallback: number): number => {
    try {
      const v =
        localStorage.getItem(`star_puff_${key}_${petStorageKey}`) ??
        (petStorageKey !== petConfig.name
          ? localStorage.getItem(`star_puff_${key}_${petConfig.name}`) // legacy name-key migration
          : null);
      return v ? parseInt(v, 10) : fallback;
    } catch {
      return fallback;
    }
  };

  const [moodIndex, setMoodIndex] = useState<number>(() => readPetStat("mood", 75));
  // 能量值：以陪伴能量系统（companionEnergy）为单一真实来源，画布只做显示跟随
  const [energyIndex, setEnergyIndex] = useState<number>(() => petConfig.companionEnergy ?? petConfig.statusEnergy ?? 90);
  const [hungerIndex, setHungerIndex] = useState<number>(() => readPetStat("hunger", petConfig.statusHunger ?? 80));
  const [cleanIndex, setCleanIndex] = useState<number>(() => readPetStat("clean", petConfig.statusCleanliness ?? 95));
  const [petLevel, setPetLevel] = useState<number>(() => readPetStat("level", petConfig.level ?? 1));
  const [petExp, setPetExp] = useState<number>(() => readPetStat("exp", petConfig.exp ?? 0));
  const [intimacyIndex, setIntimacyIndex] = useState<number>(() => readPetStat("intimacy", 55));

  const [autoWeatherCycle, setAutoWeatherCycle] = useState<boolean>(true);
  const [timeToNextWeather, setTimeToNextWeather] = useState<number>(45); // seconds countdown
  const [weatherAdviceText, setWeatherAdviceText] = useState<string>("星空微粒气象台：天体网络连通：多维时空粒子轨道运行平稳。");

  // Synchronized refs mirroring indices to bypass requestAnimationFrame closure capturing limits
  const moodIndexRef = useRef<number>(moodIndex);
  moodIndexRef.current = moodIndex;

  const energyIndexRef = useRef<number>(energyIndex);
  energyIndexRef.current = energyIndex;

  const intimacyIndexRef = useRef<number>(intimacyIndex);
  intimacyIndexRef.current = intimacyIndex;

  const autoWeatherCycleRef = useRef<boolean>(autoWeatherCycle);
  autoWeatherCycleRef.current = autoWeatherCycle;

  // Persist Pet mood statistics（以稳定 id 为 key；能量值不再独立持久化，改由陪伴能量系统统一管理）
  useEffect(() => {
    try {
      localStorage.setItem(`star_puff_mood_${petStorageKey}`, moodIndex.toString());
      localStorage.setItem(`star_puff_hunger_${petStorageKey}`, hungerIndex.toString());
      localStorage.setItem(`star_puff_clean_${petStorageKey}`, cleanIndex.toString());
      localStorage.setItem(`star_puff_level_${petStorageKey}`, petLevel.toString());
      localStorage.setItem(`star_puff_exp_${petStorageKey}`, petExp.toString());
      localStorage.setItem(`star_puff_intimacy_${petStorageKey}`, intimacyIndex.toString());
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }, [moodIndex, hungerIndex, cleanIndex, petLevel, petExp, intimacyIndex, petStorageKey]);

  // 能量值跟随陪伴能量系统（companionEnergy）：单一真实来源，切换/喂食后画布同步
  useEffect(() => {
    setEnergyIndex(petConfig.companionEnergy ?? petConfig.statusEnergy ?? 90);
  }, [petConfig.companionEnergy, petConfig.statusEnergy, petConfig.id]);

  // Automated Real-world Weather & Climate evolution wheel
  useEffect(() => {
    if (!autoWeatherCycle) return;
    const interval = setInterval(() => {
      setTimeToNextWeather((prev) => {
        if (prev <= 1) {
          const weathers: WeatherType[] = ["clear", "star-rain", "aurora", "snow"];
          const times: CycleTimeType[] = ["day", "sunset", "night"];

          const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
          const nextTime = times[Math.floor(Math.random() * times.length)];

          setSkyWeather(nextWeather);
          setSkyTime(nextTime);
          playSound("chime");

          const advisories: Record<string, string[]> = {
            clear: [
              "【星际晴空】：多维气象交替，璀璨天穹转为明净状态，星元气回复加速！",
              "【清霄大晴】：磁场恢复连通。恒星余晖轻拂着虚数微粒，宜户外嬉戏。"
            ],
            "star-rain": [
              "【极夜流星红警】：高密度的多维流星巨澜击穿轨道！捕获高能星尘速度 +400%！",
              "【流星雨盛宴】：银河长风呼啸！天降五彩流星。在此刻许愿能收获心灵抚慰。"
            ],
            aurora: [
              "【宇宙寒绿炫光】：高强度极光帷幕正在北纬12°扩散！暖粒子共振率飙升！",
              "【灵空极光脉冲】：幽美绿烟染透高维天穹。圣歌回响，小家伙的心灵倍显宁静。"
            ],
            snow: [
              "【晶体暴风雪预警】：超凡零度冰雪巨流袭来。请注意拥抱并保护好您的小萌友！",
              "【星屑冰晶大雪】：冷极波动扩散。天色昏沉，小主子可能会蜷缩身体以防感冒～"
            ]
          };

          const adviceList = advisories[nextWeather];
          const chosenAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
          setWeatherAdviceText(chosenAdvice);

          // Customize speeches based on pet types
          const species = (() => {
            const t = petConfig.type || "";
            if (t.includes("猫")) return "cat";
            if (t.includes("狗")) return "dog";
            if (t.includes("兔")) return "rabbit";
            if (t.includes("鼠")) return "hamster";
            return "cat";
          })();

          let speechText = "";
          if (nextWeather === "snow") {
            if (species === "cat") speechText = "喵呜...天上下起冰凉的小雪花了！肉垫冷冰冰的，想躲在主人的星环守护里取暖 (..•˘_˘•..)";
            else if (species === "dog") speechText = "汪汪！下雪啦！你看我的大尾巴都扫了一地亮晶晶的星雪！飞扑——！🐾❄️";
            else if (species === "rabbit") speechText = "咕，凉飕飕的星晶雪落在我的长耳朵上...肚子咕噜噜了，可以求主人的暖流饭饭吗 (๑•́ ₃ •̀๑)";
            else speechText = "呜，天冷起来了，我要缩成一团星光棉花球睡觉觉，主人快来温柔摸摸我～";
            
            // Cold decreases indices naturally a bit
            setMoodIndex(m => Math.max(25, m - 5));
          } else if (nextWeather === "star-rain") {
            if (species === "cat") speechText = "喵！是五彩流星雨！我的瞳孔里倒映出亿万星屑！好兴奋啊，看我飞扑！🤩🎆";
            else if (species === "dog") speechText = "汪汪汪！流星雨来啦！尾巴已经摇到冒火花啦！我们闭上眼和主人一起许愿！✨🚀";
            else if (species === "rabbit") speechText = "哇，好亮的小流星划过去啦！我的耳朵都跟着一动一动的呢 ( > ₃ <)⭐";
            else speechText = "智、多维星空掉下好吃的星屑啦！快帮我拿勺子接着！我要一口吞！🐾🍖";

            setMoodIndex(m => Math.min(100, m + 15));
            setEnergyIndex(e => Math.min(100, e + 10));
          } else if (nextWeather === "aurora") {
            if (species === "cat") speechText = "喵哈～ 极光绿纱在天上飘来飘去，像超级大逗猫棒！心灵变得暖洋洋的 😌💖";
            else if (species === "dog") speechText = "嗷呜——！看到极光，我的上古狼魂仿佛在神圣咆哮！呼呼...开玩笑的啦汪 🐕🌈";
            else if (species === "rabbit") speechText = "咕，极光的波浪好像仙境里的彩裙呀...在这样的星夜散步太有意境了 🌙✨";
            else speechText = "吱！绿莹莹的光雾好神奇呀，像是夜空中飘满了亮晶晶的能量奶酪 🧀⚡";

            setMoodIndex(m => Math.min(100, m + 8));
            setIntimacyIndex(i => Math.min(100, i + 12));
          } else {
            speechText = `主人！天晴转明了！星能矩阵已经满格，最喜欢暖烘烘的贴贴啦 🚀💕`;
            setMoodIndex(m => Math.min(100, m + 6));
          }

          setWhisperBubbleText(speechText);
          setWhisperTimer(220); // Longer show time for climate dialogue

          return 45; // Reset back to 45 seconds climate phase
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoWeatherCycle, petConfig.name, petConfig.type]);

  // Pet natural metabolic indexes decay
  useEffect(() => {
    const metabolism = setInterval(() => {
      setEnergyIndex((prev) => {
        const next = Math.max(10, prev - 1);
        if (next < 30) {
          // high fatigue drops mood faster
          setMoodIndex(m => Math.max(12, m - 1));
        }
        return next;
      });

      setMoodIndex((prev) => {
        // Slow natural mood decay if left solitary
        if (energyIndexRef.current > 70) {
          return Math.max(15, prev - 1);
        }
        return Math.max(10, prev - 2);
      });
    }, 8500); // execute every 8.5 seconds
    return () => clearInterval(metabolism);
  }, []);

  // Day & Night atmospheric systems state

  // Dynamic kinematic motion command state
  const [activeGesture, setActiveGesture] = useState<"nod" | "wag" | "roll" | "jump" | "dance" | null>(null);
  const gestureTimer = useRef<number>(0);
  const rollAngle = useRef<number>(0);
  const danceOffsetX = useRef<number>(0);
  const danceOffsetY = useRef<number>(0);

  // Gaze tracking coordinates
  const mouseCoords = useRef({ x: 220, y: 160 });
  const targetCoords = useRef({ x: 220, y: 160 });

  // Drag rotation coordinates for 3D modes
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Viewport Engine state variables
  const [renderMode, setRenderMode] = useState<RenderingMode>("realistic-stardust");
  const [furDensity, setFurDensity] = useState<number>(360);
  const [physicsTension, setPhysicsTension] = useState<number>(0.12);

  // V2.7 Advanced Interactive States for Ultra-Realistic 2D Stardust Pet
  const [activeExp, setActiveExp] = useState<"blinking" | "curious" | "alert" | "happy">("curious");
  const [touchEffect, setTouchEffect] = useState<"idle" | "stroke" | "feed" | "hug" | "farewell">("idle");
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [farewellAlpha, setFarewellAlpha] = useState<number>(1.0);
  const [whisperBubbleText, setWhisperBubbleText] = useState<string>("");
  const [whisperTimer, setWhisperTimer] = useState<number>(0);
  const [feedingItem, setFeedingItem] = useState<string | null>(null);

  // Synchronized refs mirroring reactive states to bypass requestAnimationFrame closure capture limits
  const skyTimeRef = useRef<CycleTimeType>(skyTime);
  skyTimeRef.current = skyTime;

  const skyWeatherRef = useRef<WeatherType>(skyWeather);
  skyWeatherRef.current = skyWeather;

  const activeGestureRef = useRef<"nod" | "wag" | "roll" | "jump" | "dance" | null>(activeGesture);
  activeGestureRef.current = activeGesture;

  const activeExpRef = useRef<"blinking" | "curious" | "alert" | "happy">(activeExp);
  activeExpRef.current = activeExp;

  const touchEffectRef = useRef<"idle" | "stroke" | "feed" | "hug" | "farewell">(touchEffect);
  touchEffectRef.current = touchEffect;

  const shieldActiveRef = useRef<boolean>(shieldActive);
  shieldActiveRef.current = shieldActive;

  const farewellAlphaRef = useRef<number>(farewellAlpha);
  farewellAlphaRef.current = farewellAlpha;

  const whisperBubbleTextRef = useRef<string>(whisperBubbleText);
  whisperBubbleTextRef.current = whisperBubbleText;

  const whisperTimerRef = useRef<number>(whisperTimer);
  whisperTimerRef.current = whisperTimer;

  const feedingItemRef = useRef<string | null>(feedingItem);
  feedingItemRef.current = feedingItem;
  
  // Custom interactive refs for chewing, feeding counts, and wink kinetics
  const feedRecordCount = useRef<number>(0);
  const winkRemainingFrames = useRef<number>(0);
  const winkingEyeSide = useRef<"left" | "right">("left");
  const foodDropProgress = useRef<number>(0);
  const chewRemainingFrames = useRef<number>(0);

  // Dynamic gesture recognizer state refs
  const touchPartAnimation = useRef<"head" | "back" | "stomach" | "paws" | "tail" | null>(null);
  const touchPartProgress = useRef<number>(0);
  const gestureAction = useRef<"click" | "double-click" | "long-press" | "long-press-3s" | "slide-left" | "slide-right" | "pinch" | "spread" | null>(null);
  const gestureProgress = useRef<number>(0);
  const lickOverlayFrames = useRef<number>(0);
  const gestureScaleMultiplier = useRef<number>(1.0);
  
  // High fidelity trail points for manual stroke gestures
  const strokeTrail = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const breathParticleTimer = useRef<number>(0);

  // Verlet Cape nodes (representing physically simulated segment chains)
  const capePoints = useRef<Array<{ x: number; y: number; oldX: number; oldY: number }>>([]);
  const linkLength = 15;

  // Jump physics variables
  const jumpOffset = useRef(0);
  const jumpVelocity = useRef(0);
  const isJumping = useRef(false);
  const landingSquash = useRef(0);

  // Dynamic particle burst coordinates for sparks and interaction stars
  const sparkParticles = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
    alpha: number;
    text?: string;
  }>>([]);

  // Inertia values for ear & tail bones
  const earSway = useRef(0);
  const earSpeed = useRef(0);
  const tailSway = useRef(0);
  const tailSpeed = useRef(0);

  // Initialize Verlet point parameters for ribbon/cape cloth
  useEffect(() => {
    capePoints.current = [];
    for (let i = 0; i < 7; i++) {
      capePoints.current.push({
        x: 200 - i * linkLength,
        y: 150,
        oldX: 200 - i * linkLength,
        oldY: 150
      });
    }
  }, []);

  // Image loader for high-fidelity photorealistic rendering matching user's uploaded pictures
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const src = petConfig.model3d?.sourceImage;
    if (src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        setImgElement(img);
      };
      img.onerror = () => {
        console.warn("Failed to load realistic kitten image:", src);
      };
    } else {
      setImgElement(null);
    }
  }, [petConfig.model3d?.sourceImage]);

  // Sync outside trigger pulse
  useEffect(() => {
    if (stardustSparkleTrigger && stardustSparkleTrigger > 0) {
      triggerStardustExplosion();
    }
  }, [stardustSparkleTrigger]);

  const triggerStardustExplosion = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + jumpOffset.current;
    
    const colors = [
      petConfig.primaryColor,
      petConfig.secondaryColor,
      ...(petConfig.stardustMatrixHex || []),
      "#ffe066",
      "#a8ffb2",
      "#ff85a1"
    ];

    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      sparkParticles.current.push({
        x: centerX + (Math.random() - 0.5) * 20,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1.2 + Math.random() * 2), // upward float bias
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        size: 3 + Math.random() * 5,
        alpha: 1.0
      });
    }
    playSound("sparkle");
  };

  const triggerGesture = (type: "nod" | "wag" | "roll" | "jump" | "dance") => {
    playSound("click");
    setActiveGesture(type);
    gestureTimer.current = type === "roll" ? 120 : type === "dance" ? 180 : 100;
    if (type === "jump") {
      if (!isJumping.current) {
        isJumping.current = true;
        jumpVelocity.current = -9.2;
        triggerStardustExplosion();
      }
    } else {
      triggerStardustExplosion();
    }
  };

  const triggerHeartPuff = (clickX: number, clickY: number) => {
    playSound("chime");
    setActiveExp("happy");
    // Generate lovely flying heart shapes using parametric equation vectors
    for (let j = 0; j < 25; j++) {
      const theta = (j / 25) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const hx = 16 * Math.pow(sinT, 3);
      const hy = -(13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));
      
      const speedScale = 0.15 + Math.random() * 0.12;
      sparkParticles.current.push({
        x: clickX,
        y: clickY,
        vx: hx * speedScale + (Math.random() - 0.5) * 0.5,
        vy: hy * speedScale - 0.9, 
        color: Math.random() < 0.65 ? "#fc407a" : "#ffa6c9",
        life: 1.0,
        size: 3.5 + Math.random() * 3,
        alpha: 1.0
      });
    }
  };

  const detectTouchedPart = (x: number, y: number, canvasWidth: number, canvasHeight: number): "head" | "back" | "stomach" | "paws" | "tail" => {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2 + 10;
    const bodyR = 48;

    const headShiftX = cx;
    const headShiftY = cy - 30; // head is located 30px above body center
    const distToHead = Math.hypot(x - headShiftX, y - headShiftY);
    if (distToHead < 45) {
      return "head";
    }

    const tailX = cx - bodyR * 0.95;
    const tailY = cy + bodyR * 0.2;
    const distToTail = Math.hypot(x - tailX, y - tailY);
    if (distToTail < 28) {
      return "tail";
    }

    if (y > cy + bodyR * 0.4 && y <= cy + bodyR + 25 && Math.abs(x - cx) < bodyR * 1.0) {
      return "paws";
    }

    if (y <= cy + bodyR * 0.15 && y > cy - bodyR * 0.9 && x < cx + bodyR * 0.5) {
      return "back";
    }

    return "stomach";
  };

  const triggerSpeciesReaction = (
    gesture: "click" | "double-click" | "long-press" | "long-press-3s" | "slide-left" | "slide-right" | "pinch" | "spread",
    part: "head" | "back" | "stomach" | "paws" | "tail"
  ) => {
    const species = (() => {
      const t = petConfig.type || "";
      if (t.includes("猫")) return "cat";
      if (t.includes("狗")) return "dog";
      if (t.includes("兔") || t.includes("兔")) return "rabbit";
      if (t.includes("鼠") || t.includes("仓鼠")) return "hamster";
      return "cat"; // default to cat for general cute drawings
    })();

    console.log(`[Gesture Triggered] Species: ${species}, Gesture: ${gesture}, Part: ${part}`);

    // Update global gesture state refs
    gestureAction.current = gesture;
    gestureProgress.current = 90; // maximum timer check duration
    touchPartAnimation.current = part;
    touchPartProgress.current = 60; // 2 seconds

    // Cool visual adjustments
    setActiveExp("happy");

    // Dynamic Pet Emotion Index Updates based on touch reactions
    if (gesture === "long-press" || gesture === "long-press-3s") {
      setMoodIndex(prev => Math.min(100, prev + 12));
      setIntimacyIndex(prev => Math.min(100, prev + 6));
    } else if (part === "tail" && (species === "cat" || species === "hamster")) {
      // Animal mildly dislikes tail-pulls / contact
      setMoodIndex(prev => Math.max(10, prev - 8));
      setIntimacyIndex(prev => Math.max(10, prev - 4));
    } else {
      setMoodIndex(prev => Math.min(100, prev + 6));
      setIntimacyIndex(prev => Math.min(100, prev + 2));
    }
    // Staying active consumes 1 energy index point
    setEnergyIndex(prev => Math.max(10, prev - 1));

    const canvas = canvasRef.current;
    if (canvas) {
      // All gestures trigger universal stardust spark sound with a beautiful chime
      playSound("stardust_flash");
      for (let i = 0; i < 15; i++) {
        sparkParticles.current.push({
          x: targetCoords.current.x + (Math.random() - 0.5) * 20,
          y: targetCoords.current.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - 1,
          color: petConfig.primaryColor,
          life: 0.7,
          size: 2.5 + Math.random() * 3,
          alpha: 0.95
        });
      }
    }

    // Specialize behaviors based on animal type
    if (species === "cat") {
      switch (gesture) {
        case "click":
          if (part === "head") {
            playSound("cat_purr");
            setWhisperBubbleText("喵呜～ 舒服到耳朵要贴贴啦 ฅ(๑•▽•๑)ฅ");
          } else if (part === "back") {
            playSound("cat_petted");
            setWhisperBubbleText("呼噜呼噜～ 喜欢你顺着毛摸我的背 *´∀`)´∀`)*´∀`)");
            for (let i = 0; i < 15; i++) {
              sparkParticles.current.push({
                x: targetCoords.current.x + (Math.random() - 0.5) * 40,
                y: targetCoords.current.y + (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2,
                color: "#ffe066",
                life: 1.2,
                size: 3,
                alpha: 0.8
              });
            }
          } else if (part === "stomach") {
            playSound("cat_happy_meows");
            setWhisperBubbleText("哎呀！猫咪最敏感的肚皮都被你发现了啦 ٩(๑> ₃ <)۶");
            
            // Also trigger standard cute jump!
            isJumping.current = true;
            jumpVelocity.current = -8.2;
            earSpeed.current = 1.1;
            tailSpeed.current = 1.8;
            triggerStardustExplosion();
          } else if (part === "paws") {
            playSound("cat_curious_meow");
            setWhisperBubbleText("喵？小肉垫是你可以随便捏的嘛？(๑•́ ₃ •̀๑)");
          } else if (part === "tail") {
            playSound("cat_hiss");
            setWhisperBubbleText("沙...！尾巴是不可以乱碰的啦！哼！( >д<)");
          }
          break;

        case "double-click":
          if (part === "head") {
            playSound("cat_double_meow");
            lickOverlayFrames.current = 60; // trigger licking
            setWhisperBubbleText("啵唧！蹭蹭你的屏幕～ 给你一个香浓的猫物语吻！😽💋");
          } else {
            playSound("cat_excited");
            setWhisperBubbleText("喵喵喵！星尘光环开启，原地给主人转大圈圈！🌟🌀");
            for (let i = 0; i < 30; i++) {
              const ang = (i / 30) * Math.PI * 2;
              sparkParticles.current.push({
                x: targetCoords.current.x + Math.cos(ang) * 40,
                y: targetCoords.current.y + Math.sin(ang) * 40,
                vx: Math.cos(ang) * 3,
                vy: Math.sin(ang) * 3,
                color: `hsl(${(i * 12) % 360}, 95%, 70%)`,
                life: 1.0,
                size: 4,
                alpha: 0.95
              });
            }
          }
          break;

        case "long-press":
          playSound("cat_petted");
          setWhisperBubbleText("呼噜呼噜呼噜…… 暖洋洋的，感觉灵魂都要被融化啦 💤🌸");
          break;

        case "long-press-3s":
          playSound("cat_sleep_purr");
          setWhisperBubbleText("呼噜噜…… 进入星空深睡梦境…… 梦里也有主人哦 🌟🌙");
          setActiveExp("blinking");
          break;

        case "slide-left":
        case "slide-right":
          if (gesture === "slide-right") {
            playSound("cat_purr");
            setWhisperBubbleText("顺着头摸到尾，酥酥麻麻的超治愈～ 喵哈 ฅ(=^ᵕ^=)ฅ");
          } else {
            playSound("cat_protest");
            setWhisperBubbleText("傲娇甩头！反方向摸毛猫咪可是会轻微抗议的哟！(`ε´ )");
            earSpeed.current = 4.0;
          }
          break;

        case "pinch":
          playSound("stardust_shrink");
          playSound("stardust_bounce");
          setWhisperBubbleText("咻！猫咪瞬间缩成了超弹力星尘球，弹跳力 Max！🏀✨");
          break;

        case "spread":
          playSound("stardust_grow");
          playSound("stardust_lick");
          lickOverlayFrames.current = 80;
          setWhisperBubbleText("呼！放大猫咪扑过来，两只前爪扒拉，大口吧唧舔镜头！😻👅");
          break;
      }
    } else if (species === "dog") {
      switch (gesture) {
        case "click":
          if (part === "head") {
            playSound("dog_bark_double");
            setWhisperBubbleText("汪汪！耳朵竖起来！收到摸摸指令，好开心呀！🐕☀️");
          } else if (part === "back") {
            playSound("dog_whimper_soft");
            setWhisperBubbleText("唔～ 抖了抖金毛，感觉舒服到尾巴都要打结了嗷！🐶🌟");
          } else if (part === "stomach") {
            playSound("dog_excited_barks");
            setWhisperBubbleText("汪汪汪！四脚朝天躺倒求抚摸！肚子完全交给你啦！💛🐾");
            
            // Also trigger standard cute jump!
            isJumping.current = true;
            jumpVelocity.current = -8.2;
            earSpeed.current = 1.1;
            tailSpeed.current = 1.8;
            triggerStardustExplosion();
          } else if (part === "paws") {
            playSound("dog_paw_bark");
            setWhisperBubbleText("嗒嗒～ 伸出一只胖前爪，给主人一个诚挚的星际握手！🤝🌟");
          } else if (part === "tail") {
            playSound("dog_super_excited");
            setWhisperBubbleText("汪！尾巴转速全开！开心得像螺旋桨一样要升空啦！🛸💨");
          }
          break;

        case "double-click":
          if (part === "head") {
            playSound("dog_lick_whimper");
            lickOverlayFrames.current = 75;
            setWhisperBubbleText("啊姆！快速狂舔镜头，湿漉漉的小舌头瞬间洗刷屏幕！😋💦");
          } else {
            playSound("dog_jump_pray");
            setWhisperBubbleText("汪汪！原地超级大三连跳，坐下双手合十跟主人作揖啦！✨🐾");
          }
          break;

        case "long-press":
          playSound("dog_whimper_soft");
          setWhisperBubbleText("呜呜～ 像棉花糖一样依偎在你身边，暖和极了 (っ•u•ｃ)");
          break;

        case "long-press-3s":
          playSound("dog_sleep_snore");
          setWhisperBubbleText("嘘！小萌狗靠在你的手指上睡着啦，在梦里汪汪说梦话呢 💤🌙");
          break;

        case "slide-left":
        case "slide-right":
          if (gesture === "slide-right") {
            playSound("dog_whimper_soft");
            setWhisperBubbleText("顺着狗狗的背滑行，感觉整条狗都要飞起来了呢！🚀💫");
          } else {
            playSound("dog_paw_bark");
            setWhisperBubbleText("汪！甩甩头抖抖毛，抖落一身星河星尘，主人我们去玩吧！⚾✨");
          }
          break;

        case "pinch":
          playSound("stardust_shrink");
          playSound("stardust_bounce");
          setWhisperBubbleText("咻！汪汪缩成了一个好吃的芝麻汤圆，在宇宙里滚个不停！🍥🍡");
          break;

        case "spread":
          playSound("stardust_grow");
          playSound("stardust_lick");
          lickOverlayFrames.current = 80;
          setWhisperBubbleText("扑倒！大金毛放大贴面，糊了你满屏幕热腾腾的狗罐头之印！🐾👅");
          break;
      }
    } else if (species === "rabbit") {
      switch (gesture) {
        case "click":
          if (part === "head") {
            playSound("rabbit_nose");
            setWhisperBubbleText("噗噗噗～ 动了动粉嫩的长耳朵，鼻子在你的指尖嗅个不停 🐰🥕");
          } else if (part === "back") {
            playSound("rabbit_purr");
            setWhisperBubbleText("咕咕～ 兔兔蜷缩成一个软糯的大麻薯，背上留下了一道流星 🌠🐇");
          } else if (part === "paws") {
            playSound("rabbit_wash_face");
            setWhisperBubbleText("沙沙沙～ 抬起毛茸茸的小爪子，仔细洗脸梳理长毛，超软萌 🐾🚿");
          } else if (part === "tail" || part === "stomach") {
            playSound("rabbit_ear_chirp");
            setWhisperBubbleText("叽？兔兔尾巴像一团爆米花，抖一下代表兔兔很喜欢你哦~ 🍿💖");
            
            // Trigger standard jump
            isJumping.current = true;
            jumpVelocity.current = -8.2;
            earSpeed.current = 1.1;
            tailSpeed.current = 1.8;
            triggerStardustExplosion();
          }
          break;

        case "double-click":
          playSound("rabbit_excited");
          setWhisperBubbleText("叽叽叽！原地球蹦蹦，双手护在胸前作揖，转圈后一跃向天！🎈🐇");
          break;

        case "long-press":
          playSound("rabbit_sleep");
          setWhisperBubbleText("咕咕咕…… 将软糯的身躯完全交给你抚摸，安详极了 🐇🌸");
          break;

        case "long-press-3s":
          playSound("rabbit_sleep");
          setWhisperBubbleText("呼、呼…… 兔兔进入无重力太空香甜美梦…… 请温柔抚摸它哦~ 💤🌙");
          setActiveExp("blinking");
          break;

        default:
          playSound("rabbit_nose");
          setWhisperBubbleText("叽叽～ 彩色星尘轨迹亮起，兔兔开心得在太空中旋转！🐇✨");
          break;
      }
    } else if (species === "hamster") {
      switch (gesture) {
        case "click":
          if (part === "head") {
            playSound("hamster_chirp");
            setWhisperBubbleText("吱吱！小仓鼠仰起头睁大黑宝石大眼睛，胡须颤巍巍的！🐹🌻");
          } else if (part === "back" || part === "stomach") {
            playSound("hamster_content");
            setWhisperBubbleText("吱吱～ 挠一挠肚子就缩成了一个圆滚滚的小毛团！超可爱！🎾🐹");
            
            isJumping.current = true;
            jumpVelocity.current = -8.2;
            earSpeed.current = 1.1;
            tailSpeed.current = 1.8;
            triggerStardustExplosion();
          } else if (part === "paws") {
            playSound("hamster_chewing");
            chewRemainingFrames.current = 35;
            setWhisperBubbleText("咔嚓咔嚓！腮帮子瞬间塞得鼓裹囊囊，满嘴都是星尘阳光瓜子！🌻😋");
          }
          break;

        case "double-click":
          playSound("hamster_chirp");
          setWhisperBubbleText("吱——！仓鼠拼命在太空中踩起了隐形仓鼠轮，踩出了一圈超绚星环！🌀🎡");
          break;

        case "long-press":
          playSound("hamster_sleep");
          setWhisperBubbleText("吱、吱…… 融化在你手心里了！变成了一块无骨舒芙蕾松饼 🥞🍥");
          break;

        case "long-press-3s":
          playSound("hamster_sleep");
          setWhisperBubbleText("呼…… 躺在主人温暖的虚拟掌心呼呼大睡，发出细碎的梦话 💤🌙");
          setActiveExp("blinking");
          break;

        default:
          playSound("hamster_content");
          setWhisperBubbleText("哇呜哇呜～ 吐出几颗星光能量豆，捧在爪子上给你递过来！🐹🌠");
          break;
      }
    }

    setWhisperTimer(180); // Open bubble for 3 seconds of peak expressiveness

    if (onClickPet) {
      onClickPet();
    }
  };

  const handlePetInteraction = () => {
    // Forward-compatible trigger if React code requests it
  };

  // Mouse coordinate tracker & Multi-touch tactile gestural recognition layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Track state of touches inside listeners to avoid stale values
    let touchStartPt: { x: number; y: number } | null = null;
    let touchStartT: number = 0;
    let touchCurrentPt: { x: number; y: number } | null = null;
    let isPinching = false;
    let initPinchD: number | null = null;
    let isDraggingGesture = false;
    let longPressTimerRef: any = null;
    let lastTouchTimeVal = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      touchStartPt = { x: e.clientX, y: e.clientY };
      touchCurrentPt = { x: e.clientX, y: e.clientY };
      touchStartT = Date.now();
      isDraggingGesture = false;

      // Handle long press scheduling
      if (longPressTimerRef) clearTimeout(longPressTimerRef);
      longPressTimerRef = window.setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        if (touchStartPt) {
          const rx = touchStartPt.x - rect.left;
          const ry = touchStartPt.y - rect.top;
          const part = detectTouchedPart(rx, ry, canvas.width, canvas.height);
          triggerSpeciesReaction("long-press", part);

          // Second level 3s sleeper check
          longPressTimerRef = window.setTimeout(() => {
            triggerSpeciesReaction("long-press-3s", part);
            longPressTimerRef = null;
          }, 2500);
        }
      }, 500);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetCoords.current = { x, y };
      touchCurrentPt = { x: e.clientX, y: e.clientY };

      if (touchStartPt) {
        const dist = Math.hypot(e.clientX - touchStartPt.x, e.clientY - touchStartPt.y);
        if (dist > 15) {
          isDraggingGesture = true;
          if (longPressTimerRef) {
            clearTimeout(longPressTimerRef);
            longPressTimerRef = null;
          }
        }
      }

      if (isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        dragOffset.current.x += dx;
        dragOffset.current.y += dy;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        // Stroke back rub trail points
        strokeTrail.current.push({ x, y, alpha: 1.0 });
        if (strokeTrail.current.length > 25) {
          strokeTrail.current.shift();
        }

        // Particle golden trail
        if (Math.random() < 0.6) {
          sparkParticles.current.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            color: "#ffca28",
            life: 0.8,
            size: 2.2 + Math.random() * 2,
            alpha: 1.0
          });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging.current = false;
      if (longPressTimerRef) {
        clearTimeout(longPressTimerRef);
        longPressTimerRef = null;
      }

      if (touchStartPt && touchStartT > 0) {
        const clickDuration = Date.now() - touchStartT;
        const dx = e.clientX - touchStartPt.x;
        const dist = Math.hypot(dx, e.clientY - touchStartPt.y);

        const rect = canvas.getBoundingClientRect();
        const rx = touchStartPt.x - rect.left;
        const ry = touchStartPt.y - rect.top;
        const part = detectTouchedPart(rx, ry, canvas.width, canvas.height);

        if (dist > 30) {
          // Slide gesture
          if (dx < -30) {
            triggerSpeciesReaction("slide-left", part);
          } else if (dx > 30) {
            triggerSpeciesReaction("slide-right", part);
          }
        } else if (clickDuration < 250) {
          // Handle Single / Double click
          const now = Date.now();
          if (now - lastTouchTimeVal < 300) {
            triggerSpeciesReaction("double-click", part);
            lastTouchTimeVal = 0;
          } else {
            lastTouchTimeVal = now;
            setTimeout(() => {
              if (lastTouchTimeVal === now) {
                triggerSpeciesReaction("click", part);
              }
            }, 300);
          }
        }
      }

      touchStartPt = null;
      touchStartT = 0;
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      if (longPressTimerRef) {
        clearTimeout(longPressTimerRef);
        longPressTimerRef = null;
      }
      targetCoords.current = { x: canvas.width / 2, y: canvas.height / 2 - 30 };
      touchStartPt = null;
      touchStartT = 0;
    };

    // Mobile specific touch multi-tactile bindings
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initPinchD = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (longPressTimerRef) {
          clearTimeout(longPressTimerRef);
          longPressTimerRef = null;
        }
      } else if (e.touches.length === 1) {
        isPinching = false;
        initPinchD = null;
        isDragging.current = true;
        const touch = e.touches[0];
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        touchStartPt = { x: touch.clientX, y: touch.clientY };
        touchCurrentPt = { x: touch.clientX, y: touch.clientY };
        touchStartT = Date.now();
        isDraggingGesture = false;

        if (longPressTimerRef) clearTimeout(longPressTimerRef);
        longPressTimerRef = window.setTimeout(() => {
          const rect = canvas.getBoundingClientRect();
          if (touchStartPt) {
            const rx = touchStartPt.x - rect.left;
            const ry = touchStartPt.y - rect.top;
            const part = detectTouchedPart(rx, ry, canvas.width, canvas.height);
            triggerSpeciesReaction("long-press", part);

            longPressTimerRef = window.setTimeout(() => {
              triggerSpeciesReaction("long-press-3s", part);
              longPressTimerRef = null;
            }, 2500);
          }
        }, 500);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (isPinching && e.touches.length === 2 && initPinchD) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / initPinchD;
        if (ratio < 0.78 && gestureAction.current !== "pinch") {
          triggerSpeciesReaction("pinch", "stomach");
        } else if (ratio > 1.22 && gestureAction.current !== "spread") {
          triggerSpeciesReaction("spread", "head");
        }
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        targetCoords.current = { x, y };
        touchCurrentPt = { x: touch.clientX, y: touch.clientY };

        if (touchStartPt) {
          const dist = Math.hypot(touch.clientX - touchStartPt.x, touch.clientY - touchStartPt.y);
          if (dist > 15) {
            isDraggingGesture = true;
            if (longPressTimerRef) {
              clearTimeout(longPressTimerRef);
              longPressTimerRef = null;
            }
          }
        }

        if (isDragging.current) {
          const dx = touch.clientX - lastMousePos.current.x;
          const dy = touch.clientY - lastMousePos.current.y;
          dragOffset.current.x += dx;
          dragOffset.current.y += dy;
          lastMousePos.current = { x: touch.clientX, y: touch.clientY };

          strokeTrail.current.push({ x, y, alpha: 1.0 });
          if (strokeTrail.current.length > 25) {
            strokeTrail.current.shift();
          }

          if (Math.random() < 0.6) {
            sparkParticles.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5 - 0.5,
              color: "#ffca28",
              life: 0.8,
              size: 2.2 + Math.random() * 2,
              alpha: 1.0
            });
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDragging.current = false;
      if (longPressTimerRef) {
        clearTimeout(longPressTimerRef);
        longPressTimerRef = null;
      }

      if (isPinching) {
        isPinching = false;
        initPinchD = null;
      } else if (touchStartPt && touchStartT > 0) {
        const clickDuration = Date.now() - touchStartT;
        const rect = canvas.getBoundingClientRect();
        
        let endX = touchStartPt.x;
        let endY = touchStartPt.y;
        if (touchCurrentPt) {
          endX = touchCurrentPt.x;
          endY = touchCurrentPt.y;
        }

        const dx = endX - touchStartPt.x;
        const dist = Math.hypot(dx, endY - touchStartPt.y);

        const rx = touchStartPt.x - rect.left;
        const ry = touchStartPt.y - rect.top;
        const part = detectTouchedPart(rx, ry, canvas.width, canvas.height);

        if (dist > 30) {
          if (dx < -30) {
            triggerSpeciesReaction("slide-left", part);
          } else if (dx > 30) {
            triggerSpeciesReaction("slide-right", part);
          }
        } else if (clickDuration < 250) {
          const now = Date.now();
          if (now - lastTouchTimeVal < 300) {
            triggerSpeciesReaction("double-click", part);
            lastTouchTimeVal = 0;
          } else {
            lastTouchTimeVal = now;
            setTimeout(() => {
              if (lastTouchTimeVal === now) {
                triggerSpeciesReaction("click", part);
              }
            }, 300);
          }
        }
      }

      touchStartPt = null;
      touchStartT = 0;
    };

    // Mouse wheel as simulated pinch / spread desktop trigger
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 && gestureAction.current !== "pinch") {
        triggerSpeciesReaction("pinch", "stomach");
      } else if (e.deltaY < 0 && gestureAction.current !== "spread") {
        triggerSpeciesReaction("spread", "head");
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Multi-touch binds
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [petConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    // Atmospheric weather particle list for premium realistic simulations
    const weatherParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      type: "snow" | "meteor" | "aurora_spark";
    }> = [];

    const mainLoop = () => {
      // 3D 模式下跳过 2D 绘制（节省性能），但仍保持 rAF 循环以便切回
      if (useReal3DRef.current) {
        animationRef.current = requestAnimationFrame(mainLoop);
        return;
      }

      // Update interactive gesture timers and parameters
      if (activeGestureRef.current) {
        gestureTimer.current--;
        if (gestureTimer.current <= 0) {
          setActiveGesture(null);
        }
      }

      // Decrement wink and whisper timers frame-by-frame
      if (winkRemainingFrames.current > 0) {
        winkRemainingFrames.current--;
      }
      if (whisperTimerRef.current > 0) {
        setWhisperTimer(prev => {
          const next = Math.max(0, prev - 1);
          whisperTimerRef.current = next;
          return next;
        });
      }

      // Update tactile touch and species interaction animation timers
      if (touchPartProgress.current > 0) {
        touchPartProgress.current--;
        if (touchPartProgress.current === 0) {
          touchPartAnimation.current = null;
        }
      }
      if (gestureProgress.current > 0) {
        gestureProgress.current--;
        if (gestureProgress.current === 0) {
          gestureAction.current = null;
        }
      }
      if (lickOverlayFrames.current > 0) {
        lickOverlayFrames.current--;
      }

      // Kinetic zoom/scale transitions for pinch or spread
      if (gestureAction.current === "pinch") {
        gestureScaleMultiplier.current += (0.45 - gestureScaleMultiplier.current) * 0.15;
      } else if (gestureAction.current === "spread") {
        gestureScaleMultiplier.current += (1.45 - gestureScaleMultiplier.current) * 0.15;
      } else {
        gestureScaleMultiplier.current += (1.0 - gestureScaleMultiplier.current) * 0.15;
      }

      // 1. Nod (点头) calculations : Head pitch oscillations
      let nodOffsetAngle = 0;
      let nodOffsetY = 0;
      if (activeGestureRef.current === "nod") {
        nodOffsetAngle = Math.sin(frame * 0.3) * 0.18;
        nodOffsetY = Math.sin(frame * 0.3) * 6.5; // head shifts up & down physically
        earSpeed.current += Math.sin(frame * 0.3) * 0.6; // ears twitch along
      }

      // 2. Wag tail (摇尾巴) calculations
      if (activeGestureRef.current === "wag") {
        tailSpeed.current += Math.sin(frame * 0.8) * 3.2; // intense rapid wag
        danceOffsetX.current += (Math.sin(frame * 0.8) * 4.5 - danceOffsetX.current) * 0.2; // body sways to balance tail force
      }

      // 3. Roll (打滚儿) rotation calculations
      let rollOffsetX = 0;
      let rollOffsetY = 0;
      if (activeGestureRef.current === "roll") {
        rollAngle.current = (rollAngle.current + 0.11) % (Math.PI * 2);
        rollOffsetY = Math.abs(Math.sin(rollAngle.current)) * -22; // tumbling vertical hop
        rollOffsetX = Math.sin(rollAngle.current * 0.5) * 38; // rolling horizontal slide
      } else if (activeGestureRef.current === "dance") {
        // body swivels left/right to dance steps rhythm
        rollAngle.current += (Math.sin(frame * 0.18) * 0.15 - rollAngle.current) * 0.15;
      } else if (isJumping.current && activeGestureRef.current === "jump") {
        // Acrobatic backflip twist in mid-air
        rollAngle.current = Math.min(Math.PI * 2, (jumpOffset.current / -92) * Math.PI);
      } else if (touchPartAnimation.current === "stomach") {
        // Tummy rub comfortable flip over
        rollAngle.current += (Math.PI - rollAngle.current) * 0.15;
        rollOffsetY += 15;
      } else {
        if (rollAngle.current > 0) {
          rollAngle.current -= 0.08;
          if (rollAngle.current < 0) rollAngle.current = 0;
        } else if (rollAngle.current < 0) {
          rollAngle.current += 0.08;
          if (rollAngle.current > 0) rollAngle.current = 0;
        }
      }

      // 4. Kinetic Dance (快乐舞蹈) calculations
      if (activeGestureRef.current === "dance") {
        // Infinity loop curves (sideway moon walk steps)
        danceOffsetX.current = Math.sin(frame * 0.22) * 22;
        danceOffsetY.current = Math.sin(frame * 0.44) * 8 - 4;
        tailSpeed.current += Math.cos(frame * 0.3) * 1.4;
        earSpeed.current += Math.sin(frame * 0.2) * 0.8;
      } else if (activeGestureRef.current !== "wag") {
        danceOffsetX.current += (0 - danceOffsetX.current) * 0.1;
        danceOffsetY.current += (0 - danceOffsetY.current) * 0.1;
      }

      // 0. 沉睡状态：画面变暗 + 星尘缓慢飘散，宠物停止动画
      if (isSleepingRef.current) {
        const darkGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        darkGrad.addColorStop(0, "#010008");
        darkGrad.addColorStop(1, "#050512");
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 缓慢飘散的星尘粒子
        for (let i = 0; i < 40; i++) {
          const px = (frame * 0.15 + i * 37) % canvas.width;
          const py = (canvas.height - ((frame * 0.2 + i * 53) % canvas.height));
          const twinkle = 0.2 + 0.3 * Math.sin(frame * 0.03 + i);
          ctx.fillStyle = `rgba(200, 200, 255, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.sin(frame * 0.02 + i) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 中心蜷缩的沉睡剪影（简化）
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#8fa4b3";
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 42, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头部
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 16, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        frame++;
        animationRef.current = requestAnimationFrame(mainLoop);
        return;
      }

      // 1. Draw atmospheric diurnal/nocturnal background depending on skyTime
      let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (skyTimeRef.current === "day") {
        // Celestial Dawn
        bgGrad.addColorStop(0, "#1c1445");
        bgGrad.addColorStop(0.5, "#3d226a");
        bgGrad.addColorStop(1, "#fad0a3"); // beautiful glowing horizons
      } else if (skyTimeRef.current === "sunset") {
        // Aurora sunset
        bgGrad.addColorStop(0, "#080415");
        bgGrad.addColorStop(0.4, "#2e073c");
        bgGrad.addColorStop(0.8, "#65114e");
        bgGrad.addColorStop(1, "#ff758c");
      } else {
        // Standard high-fidelity cosmic starry night
        bgGrad.addColorStop(0, "#04020a");
        bgGrad.addColorStop(1, "#0d0922");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render diagnostic grid lines
      if (renderMode === "wireframe" || renderMode === "rig") {
        ctx.strokeStyle = "rgba(123, 97, 255, 0.15)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        ctx.strokeStyle = "rgba(242, 125, 38, 0.1)";
        ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 160, 0, Math.PI * 2); ctx.stroke();
      } else if (renderMode === "xray") {
        ctx.fillStyle = "#030206";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const waveY = (frame * 2.2) % (canvas.height + 100) - 50;
        const grad = ctx.createLinearGradient(0, waveY - 40, 0, waveY + 40);
        grad.addColorStop(0, "rgba(123, 97, 255, 0)");
        grad.addColorStop(0.5, "rgba(123, 97, 255, 0.08)");
        grad.addColorStop(1, "rgba(123, 97, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, waveY - 40, canvas.width, 80);
      } else {
        // Smooth cosmic central glow
        const lightGlow = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 20,
          canvas.width / 2, canvas.height / 2, 180
        );
        lightGlow.addColorStop(0, "rgba(22, 16, 45, 0.85)");
        lightGlow.addColorStop(1, "rgba(6, 4, 13, 0.2)");
        ctx.fillStyle = lightGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw celestial sun or lunar moon based on time cycle
      if (skyTimeRef.current === "day") {
        ctx.save();
        ctx.fillStyle = "rgba(250, 208, 163, 0.08)";
        ctx.beginPath(); ctx.arc(canvas.width - 60, 60, 45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#fad0a3";
        ctx.beginPath(); ctx.arc(canvas.width - 60, 60, 16, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (skyTimeRef.current === "night" || skyTimeRef.current === "sunset") {
        ctx.save();
        ctx.shadowColor = "#8ec5fc";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.arc(canvas.width - 60, 50, 12, 0.3 * Math.PI, 1.7 * Math.PI);
        ctx.arc(canvas.width - 54, 50, 12, 1.7 * Math.PI, 0.3 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Weather effects: Aurora, Star rain, Snow (Super High-Fidelity Physics Particle Engine)
      if (skyWeatherRef.current === "aurora") {
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, "rgba(4, 231, 98, 0)");
        grad.addColorStop(0.25, `rgba(4, 231, 98, ${0.15 + Math.sin(frame * 0.012) * 0.08})`);
        grad.addColorStop(0.5, `rgba(6, 182, 212, ${0.12 + Math.cos(frame * 0.015) * 0.06})`);
        grad.addColorStop(0.75, `rgba(122, 79, 255, ${0.15 + Math.sin(frame * 0.01) * 0.08})`);
        grad.addColorStop(1, "rgba(122, 79, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 18 + Math.sin(frame * 0.02) * 4;
        ctx.shadowBlur = 24;
        ctx.shadowColor = "rgba(4, 231, 98, 0.6)";
        ctx.beginPath();
        ctx.moveTo(-10, 60);
        for (let wx = 0; wx <= canvas.width + 10; wx += 40) {
          const wy = 50 + Math.sin(frame * 0.02 + wx * 0.007) * 16 + Math.cos(frame * 0.01 + wx * 0.003) * 6;
          ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        ctx.restore();

        // Spawn vertical floating spiritual ions
        if (weatherParticles.filter(p => p.type === "aurora_spark").length < 24) {
          if (Math.random() < 0.15) {
            weatherParticles.push({
              x: Math.random() * canvas.width,
              y: canvas.height + 10,
              vx: (Math.random() - 0.5) * 0.35,
              vy: -0.45 - Math.random() * 0.65,
              size: 1.5 + Math.random() * 2.5,
              alpha: 0.18 + Math.random() * 0.35,
              color: Math.random() < 0.6 ? "#10b981" : "#a855f7",
              type: "aurora_spark"
            });
          }
        }
      }

      if (skyWeatherRef.current === "star-rain") {
        ctx.save();
        // Dynamic Meteor Star Rain Spawning
        if (weatherParticles.filter(p => p.type === "meteor").length < 8) {
          if (Math.random() < 0.06) {
            weatherParticles.push({
              x: Math.random() * (canvas.width + 120),
              y: -20,
              vx: -3.8 - Math.random() * 4.4,
              vy: 3.2 + Math.random() * 3.8,
              size: 1.5 + Math.random() * 2.2,
              alpha: 0.8 + Math.random() * 0.2,
              color: ["#fde047", "#f472b6", "#22d3ee"][Math.floor(Math.random() * 3)],
              type: "meteor"
            });
          }
        }
        ctx.restore();
      }

      if (skyWeatherRef.current === "snow") {
        ctx.save();
        // Frosted vignette cozy glazed border framing the viewport
        const groundGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 3.2, canvas.width / 2, canvas.height / 2, canvas.width / 1.35);
        groundGrad.addColorStop(0, "rgba(255,255,255,0)");
        groundGrad.addColorStop(0.88, "rgba(224, 242, 254, 0.04)");
        groundGrad.addColorStop(1, "rgba(224, 242, 254, 0.18)");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Dynamic falling physical snowflake spawning
        if (weatherParticles.filter(p => p.type === "snow").length < 45) {
          if (Math.random() < 0.28) {
            weatherParticles.push({
              x: Math.random() * canvas.width,
              y: -15,
              vx: (Math.random() - 0.5) * 0.8,
              vy: 0.8 + Math.random() * 1.4,
              size: 1.1 + Math.random() * 2.2,
              alpha: 0.38 + Math.random() * 0.55,
              color: "#e2f1ff",
              type: "snow"
            });
          }
        }
      }

      // --- RENDER & SIMULATE DYNAMIC ENVIRONMENTAL PARTICLES ---
      weatherParticles.forEach((p) => {
        if (p.type === "snow") {
          // Drifting with organic horizontal wind swing
          p.x += p.vx + Math.sin(frame * 0.015 + p.y * 0.008) * 0.28;
          p.y += p.vy;

          ctx.save();
          ctx.fillStyle = `rgba(226, 241, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === "meteor") {
          p.x += p.vx;
          p.y += p.vy;

          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          // Beautiful fading comet trails
          ctx.lineTo(p.x - p.vx * 3.3, p.y - p.vy * 3.3);
          ctx.stroke();
          ctx.restore();

          // Sparkle trails behind shooting meteors!
          if (Math.random() < 0.22) {
            sparkParticles.current.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              color: p.color,
              life: 0.5,
              size: 1.0 + Math.random() * 1.5,
              alpha: 0.8
            });
          }
        } else if (p.type === "aurora_spark") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.0022; // Slow fading floaters

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Maintain particle collection bounds checks (sweep dead particles)
      for (let i = weatherParticles.length - 1; i >= 0; i--) {
        const wp = weatherParticles[i];
        if (wp.y > canvas.height + 30 || wp.y < -30 || wp.x > canvas.width + 40 || wp.x < -40 || wp.alpha <= 0) {
          weatherParticles.splice(i, 1);
        }
      }

      // Physics coordinate calculations
      let currentYOffset = 0;
      if (isJumping.current) {
        jumpVelocity.current += 0.44; // gravity step
        currentYOffset = jumpOffset.current + jumpVelocity.current;
        if (currentYOffset >= 0) {
          currentYOffset = 0;
          jumpVelocity.current = 0;
          isJumping.current = false;
          landingSquash.current = 0.28; // high fidelity impact squish
          playSound("beep");
          // Splat puff particle release on ground impact
          for (let i = 0; i < 25; i++) {
            sparkParticles.current.push({
              x: canvas.width / 2 + (Math.random() - 0.5) * 60,
              y: canvas.height / 2 + 65,
              vx: (Math.random() - 0.5) * 5,
              vy: -0.5 - Math.random() * 2.5,
              color: "#ffffff",
              life: 0.8,
              size: 2 + Math.random() * 4,
              alpha: 0.9
            });
          }
        }
        jumpOffset.current = currentYOffset;
      } else {
        landingSquash.current *= 0.86;
      }

      // Smooth kinematic interpolation for Head Gaze Gaze target coordinates
      mouseCoords.current.x += (targetCoords.current.x - mouseCoords.current.x) * 0.12;
      mouseCoords.current.y += (targetCoords.current.y - mouseCoords.current.y) * 0.12;

      // Hover calculations
      const timeFreq = frame * 0.048;
      const hoverY = Math.sin(timeFreq) * 11 + currentYOffset;
      const hoverX = Math.cos(timeFreq * 0.7) * 4;

      // Base anchor centers
      const cx = canvas.width / 2 + hoverX;
      const cy = canvas.height / 2 + hoverY;

      if (!useReal3DRef.current) {
      if (renderMode === "model3d" && petConfig.model3d) {
        const model = petConfig.model3d;
        const count = model.verticesCount;
        const nodes = model.shapeNodes;
        const dimensions = model.dimensions;
        const bounciness = model.physicsBounciness;
        const breathing = Math.sin(frame * 0.05) * 0.05 * dimensions.height;

        ctx.fillStyle = "rgba(10, 5, 29, 0.45)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // draw background circles
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.beginPath();
        for (let i = 1; i <= 4; i++) {
          ctx.arc(canvas.width / 2, canvas.height / 2, i * 35, 0, Math.PI * 2);
        }
        ctx.stroke();

        let currentYaw = frame * 0.012 + dragOffset.current.x * 0.015;
        let currentPitch = 0.25 + dragOffset.current.y * 0.015;

        const projected: Array<{ x: number; y: number; zDepth: number; color: string }> = [];
        for (let i = 0; i < count; i++) {
          const ratio = i / count;
          const theta = ratio * Math.PI;
          const phi = ratio * Math.PI * 8.5;

          let vx = Math.sin(theta) * Math.cos(phi) * 80 * dimensions.width;
          let vy = Math.cos(theta) * 100 * (dimensions.height + breathing);
          let vz = Math.sin(theta) * Math.sin(phi) * 80 * dimensions.depth;

          // rotate
          const cosY = Math.cos(currentYaw);
          const sinY = Math.sin(currentYaw);
          const xRot1 = vx * cosY - vz * sinY;
          const zRot1 = vx * sinY + vz * cosY;

          const cosP = Math.cos(currentPitch);
          const sinP = Math.sin(currentPitch);
          const yRot2 = vy * cosP - zRot1 * sinP;
          const zRot2 = vy * sinP + zRot1 * cosP;

          const scaleVal = 200 / (200 + zRot2);
          const pX = canvas.width / 2 + xRot1 * scaleVal;
          const pY = canvas.height / 2 + yRot2 * scaleVal + jumpOffset.current;

          const depthPercent = (zRot2 + 100) / 200;
          const depthIdx = Math.min(model.depthMapColors.length - 1, Math.max(0, Math.floor(depthPercent * model.depthMapColors.length)));
          const vertColor = model.depthMapColors[depthIdx] || petConfig.primaryColor;

          projected.push({ x: pX, y: pY, zDepth: zRot2, color: vertColor });
        }

        // draw wireframe lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let k = 0; k < projected.length; k += 4) {
          if (k + 1 < projected.length) {
            ctx.moveTo(projected[k].x, projected[k].y);
            ctx.lineTo(projected[k+1].x, projected[k+1].y);
          }
        }
        ctx.stroke();

        // draw particle dots
        projected.forEach((pt) => {
          const radius = Math.max(0.6, 1.8 + (pt.zDepth / 100));
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3D anatomical nodes pins
        nodes.forEach((node) => {
          let nY = node.y * 100 * (dimensions.height + breathing);
          let nX = node.x * 80 * dimensions.width;
          let nZ = node.z * 80 * dimensions.depth;

          const cosY = Math.cos(currentYaw);
          const sinY = Math.sin(currentYaw);
          const xRot1 = nX * cosY - nZ * sinY;
          const zRot1 = nX * sinY + nZ * cosY;

          const cosP = Math.cos(currentPitch);
          const sinP = Math.sin(currentPitch);
          const yRot2 = nY * cosP - zRot1 * sinP;
          const zRot2 = nY * sinP + zRot1 * cosP;

          const scaleVal = 200 / (200 + zRot2);
          const pX = canvas.width / 2 + xRot1 * scaleVal;
          const pY = canvas.height / 2 + yRot2 * scaleVal + jumpOffset.current;

          const pulse = 4 + Math.sin(frame * 0.1) * 1.5;
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(pX, pY, pulse, 0, Math.PI * 2);
          ctx.shadowBlur = 8;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(pX, pY);
          ctx.lineTo(pX + (node.x >= 0 ? 10 : -10), pY - 8);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "8px monospace";
          ctx.fillText(node.label.split(" ")[0], pX + (node.x >= 0 ? 12 : -32), pY - 6);
        });
      } else if (renderMode === "voxel") {
        // Draw soft stellar background grid
        ctx.fillStyle = "rgba(8, 4, 22, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(123, 97, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -4; i <= 4; i++) {
          ctx.moveTo(canvas.width / 2 + i * 40, 0);
          ctx.lineTo(canvas.width / 2 + i * 40, canvas.height);
          ctx.moveTo(0, canvas.height / 2 + i * 30);
          ctx.lineTo(canvas.width, canvas.height / 2 + i * 30);
        }
        ctx.stroke();

        // Setup Voxel rotation matrices
        let currentYaw = frame * 0.01 + dragOffset.current.x * 0.015;
        let currentPitch = 0.35 + dragOffset.current.y * 0.015;

        // Custom voxel generation simulating interactive 3D model
        const voxels: Array<{ x: number; y: number; z: number; color: string; size: number }> = [];
        
        const primaryCol = petConfig.primaryColor || "#ff85a1";
        const secondaryCol = petConfig.secondaryColor || adjustBrightness(primaryCol, -15);

        // Core body (voxel grid) to form the pet torso
        for (let bx = -1.2; bx <= 1.2; bx += 0.6) {
          for (let by = -0.8; by <= 0.8; by += 0.6) {
            for (let bz = -0.8; bz <= 0.8; bz += 0.6) {
              voxels.push({
                x: bx * 35,
                y: by * 30 + 15,
                z: bz * 30,
                color: primaryCol,
                size: 8
              });
            }
          }
        }

        // Head Voxel box
        const hOffset = Math.sin(frame * 0.06) * 2; // subtle head breathe
        for (let hx = -0.9; hx <= 0.9; hx += 0.6) {
          for (let hy = -0.9; hy <= 0.9; hy += 0.6) {
            for (let hz = -0.9; hz <= 0.9; hz += 0.6) {
              voxels.push({
                x: hx * 24,
                y: hy * 24 - 32 + hOffset,
                z: hz * 24,
                color: secondaryCol,
                size: 6.5
              });
            }
          }
        }

        // Ears based on pet classification
        const isCat = petConfig.type.includes("猫");
        const isDog = petConfig.type.includes("狗");
        const earBreathe = Math.sin(frame * 0.1) * 3;

        if (isCat) {
          // Pointy voxel ears
          for (let ez = -0.3; ez <= 0.3; ez += 0.6) {
            voxels.push({ x: -16, y: -52 + earBreathe, z: ez * 10, color: primaryCol, size: 5 });
            voxels.push({ x: -20, y: -48 + earBreathe, z: ez * 10, color: primaryCol, size: 4 });
            voxels.push({ x: 16, y: -52 + earBreathe, z: ez * 10, color: primaryCol, size: 5 });
            voxels.push({ x: 20, y: -48 + earBreathe, z: ez * 10, color: primaryCol, size: 4 });
          }
        } else if (isDog) {
          // Droopy ears
          for (let ez = -0.3; ez <= 0.3; ez += 0.6) {
            voxels.push({ x: -22, y: -26 + earBreathe * 0.5, z: ez * 10, color: primaryCol, size: 5.5 });
            voxels.push({ x: -24, y: -18, z: ez * 10, color: secondaryCol, size: 5 });
            voxels.push({ x: 22, y: -26 + earBreathe * 0.5, z: ez * 10, color: primaryCol, size: 5.5 });
            voxels.push({ x: 24, y: -18, z: ez * 10, color: secondaryCol, size: 5 });
          }
        } else {
          // General cute voxel spikes
          voxels.push({ x: -12, y: -48, z: 0, color: primaryCol, size: 4.5 });
          voxels.push({ x: 12, y: -48, z: 0, color: primaryCol, size: 4.5 });
        }

        // Animated tail
        const tailCycle = Math.sin(frame * 0.12) * 12;
        for (let i = 1; i <= 4; i++) {
          voxels.push({
            x: -35 - i * 8,
            y: 15 + (i * 2) + tailCycle * (i / 4),
            z: Math.sin(frame * 0.05 + i) * 6,
            color: primaryCol,
            size: 6 - i * 0.8
          });
        }

        // Project and depth sort (Painter's algorithm)
        const cosY = Math.cos(currentYaw);
        const sinY = Math.sin(currentYaw);
        const cosP = Math.cos(currentPitch);
        const sinP = Math.sin(currentPitch);

        const projectedVoxels = voxels.map((vox, idx) => {
          // Yaw rotation (Y-axis)
          const x1 = vox.x * cosY - vox.z * sinY;
          const z1 = vox.x * sinY + vox.z * cosY;

          // Pitch rotation (X-axis)
          const y2 = vox.y * cosP - z1 * sinP;
          const z2 = vox.y * sinP + z1 * cosP;

          // Perspective scaling
          const scaleVal = 260 / (260 + z2);
          const pX = canvas.width / 2 + x1 * scaleVal;
          const pY = canvas.height / 2 + y2 * scaleVal + jumpOffset.current;

          return {
            original: vox,
            projectedX: pX,
            projectedY: pY,
            depthZ: z2,
            scaleVal: scaleVal
          };
        });

        // Sort descending by depth (draw back-to-front)
        projectedVoxels.sort((a, b) => b.depthZ - a.depthZ);

        // Render sorted voxels
        projectedVoxels.forEach((pv) => {
          const s = pv.original.size * pv.scaleVal;
          drawVoxelCube(ctx, pv.projectedX, pv.projectedY, s, pv.original.color);
        });

        // Generate glowing float stardust particles at the voxel margins
        if (Math.random() < 0.08) {
          const randVox = projectedVoxels[Math.floor(Math.random() * projectedVoxels.length)];
          if (randVox) {
            sparkParticles.current.push({
              x: randVox.projectedX + (Math.random() - 0.5) * 15,
              y: randVox.projectedY + (Math.random() - 0.5) * 15,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -0.4 - Math.random() * 0.8,
              color: Math.random() < 0.5 ? primaryCol : "#ffffff",
              life: 0.8,
              size: 2 + Math.random() * 2,
              alpha: 0.6
            });
          }
        }

        // Overlay Interactive drag advice text
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("🖱️ 按住并拖拽以360°旋转3D体素模型", canvas.width / 2, canvas.height - 15);
        ctx.restore();
      } else {
        // Dynamic variables for pet parts
        const bodyR = 48;
      const headR = 34;

      // Segment offsets matching character head turn
      const targetDX = mouseCoords.current.x - cx;
      const targetDY = mouseCoords.current.y - (cy - 30);
      const angle = Math.atan2(targetDY, targetDX);
      const lookDist = Math.min(10, Math.hypot(targetDX, targetDY) * 0.08);
      const headOffsetX = Math.cos(angle) * lookDist;
      const headOffsetY = Math.sin(angle) * lookDist - 30; // base head offset is 30px above body center

      // Common skeleton coordinate references elevated for outer rendering scopes
      const hx = cx + headOffsetX;
      const hy = cy + headOffsetY;
      const tailBaseX = cx - bodyR * 0.85;
      const tailBaseY = cy + bodyR * 0.2;

      // 1. Verlet Cape calculation logic
      const anchorNodeX = cx;
      const anchorNodeY = cy + 10;

      if (capePoints.current.length > 0) {
        // Bind start anchor node to model spine
        capePoints.current[0].x = anchorNodeX;
        capePoints.current[0].y = anchorNodeY;

        // Apply dynamic winds to points
        for (let i = 1; i < capePoints.current.length; i++) {
          const pt = capePoints.current[i];
          const tempX = pt.x;
          const tempY = pt.y;

          // Verlet velocity integrate
          const vx = (pt.x - pt.oldX) * 0.95;
          const vy = (pt.y - pt.oldY) * 0.95;

          pt.oldX = tempX;
          pt.oldY = tempY;

          pt.x += vx;
          pt.y += vy + 0.15; // soft gravity force

          // Ripple wavy wind draft
          pt.x += Math.sin(frame * 0.12 - i) * 0.55;
          pt.y += Math.cos(frame * 0.08 + i) * 0.25;
        }

        // Keep physical constraint linkages resolved
        for (let iter = 0; iter < 4; iter++) {
          for (let i = 0; i < capePoints.current.length - 1; i++) {
            const p1 = capePoints.current[i];
            const p2 = capePoints.current[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;
            const diff = linkLength - dist;
            const percent = (diff / dist) * 0.5;
            const offsetX = dx * percent;
            const offsetY = dy * percent;

            if (i > 0) {
              p1.x -= offsetX;
              p1.y -= offsetY;
            }
            p2.x += offsetX;
            p2.y += offsetY;
          }
        }
      }

      // Draw Ribbon Cape Behind body
      if (equipped.cape && capePoints.current.length > 1) {
        ctx.save();
        ctx.beginPath();
        const first = capePoints.current[0];
        ctx.moveTo(first.x, first.y);

        // Rainbow linear hue glow if customized card equipped
        const colorAccent = (equipped.cape.includes("aurora") || equipped.cape.includes("combo")) 
          ? `hsl(${(frame * 2.5) % 360}, 90%, 65%)`
          : petConfig.secondaryColor;

        ctx.strokeStyle = colorAccent;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.shadowColor = colorAccent;
        ctx.shadowBlur = 15;
        
        // Render ribbons using cubic bezier points
        for (let i = 1; i < capePoints.current.length; i++) {
          const pt = capePoints.current[i];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Secondary shadow tail mesh for 3D fullness
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
      }

      // Inertia dynamics logic for flappy physical ears
      earSpeed.current += (-earSway.current) * 0.14 - (jumpVelocity.current * 0.05); // spring formula
      earSpeed.current *= 0.86; // damp momentum
      earSway.current += earSpeed.current;

      // Dynamic Tail wagging frequency & amplitude mapped directly to emotional index
      let baseWagFrequency = 0.14;
      let baseWagIntensity = 0.08;
      if (moodIndexRef.current >= 85 && energyIndexRef.current >= 70) {
        baseWagFrequency = 0.32; // Super excited rapid movement
        baseWagIntensity = 0.24;
      } else if (energyIndexRef.current < 35) {
        baseWagFrequency = 0.05; // Sluggish tired drag
        baseWagIntensity = 0.015;
      } else if (moodIndexRef.current < 35) {
        baseWagFrequency = 0.08; // Solitary slow droop sweep
        baseWagIntensity = 0.035;
      }

      tailSpeed.current += (-tailSway.current) * 0.12 + Math.sin(frame * baseWagFrequency) * baseWagIntensity;
      tailSpeed.current *= 0.88;
      tailSway.current += tailSpeed.current;

      // 2. Render Pet Body Base Shape (Photorealistic if image is loaded, custom realistic-stardust or standard procedural representation otherwise)
      if (!useReal3DRef.current) {
        // --- V2.7 ULTRA-REALISTIC 2D PHOTO-LEVEL PIXEL STARDUST RENDERER (Default) ---
        ctx.save();
        
        // 1. Interactive Farewell alpha dissolving calculation
        if (touchEffectRef.current === "farewell") {
          if (farewellAlphaRef.current > 0.1) {
            setFarewellAlpha(prev => {
              const next = Math.max(0, prev - 0.05);
              farewellAlphaRef.current = next;
              return next;
            });
            // emit dissolving particles
            for (let i = 0; i < 5; i++) {
              sparkParticles.current.push({
                x: cx + (Math.random() - 0.5) * 110,
                y: cy + (Math.random() - 0.5) * 110 + jumpOffset.current,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 4 - 0.5,
                color: Math.random() < 0.5 ? petConfig.primaryColor : "#ffffff",
                life: 0.8,
                size: 2 + Math.random() * 3,
                alpha: 0.9
              });
            }
          }
        } else {
          if (farewellAlphaRef.current < 1.0) {
            setFarewellAlpha(prev => {
              const next = Math.min(1.0, prev + 0.06);
              farewellAlphaRef.current = next;
              return next;
            });
          }
        }
        
        ctx.globalAlpha = farewellAlphaRef.current;

        // Ground shadow (drawn under back limbs/body)
        const shadowScale = Math.max(0.2, (1 - Math.abs(jumpOffset.current) / 100) * farewellAlphaRef.current);
        const groundY = cy + bodyR + 15;
        const shadowGrad = ctx.createRadialGradient(cx, groundY, 2, cx, groundY, 45);
        shadowGrad.addColorStop(0, "rgba(0,0,0,0.5)");
        shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, groundY, 45 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Head Gaze rotation angle & body sway with snow-induced shivering physics
        let shiverX = 0;
        let shiverY = 0;
        if (skyWeatherRef.current === "snow" && !shieldActiveRef.current) {
          shiverX = Math.sin(frame * 0.48) * 0.75;
          shiverY = Math.cos(frame * 0.52) * 0.7;
        }

        const shiftX = cx + danceOffsetX.current + rollOffsetX + shiverX;
        const shiftY = cy + danceOffsetY.current + jumpOffset.current + rollOffsetY + shiverY;
        
        const breatheScaleY = 1 + Math.sin(frame * 0.08) * 0.015;
        const breatheScaleX = 1 - Math.sin(frame * 0.08) * 0.005;

        // Dynamic cartoon model squash and stretch factors
        let jumpStretchX = 1;
        let jumpStretchY = 1;
        if (isJumping.current) {
          if (jumpVelocity.current < 0) {
            // Heading up: stretch skyward!
            jumpStretchY = 1.22;
            jumpStretchX = 0.82;
          } else {
            // Heading down: squash slightly preparing for landing impact!
            jumpStretchY = 0.92;
            jumpStretchX = 1.08;
          }
        }

        let touchModifyX = 1.0;
        let touchModifyY = 1.0;
        if (touchPartAnimation.current === "back") {
          touchModifyY = 1.25; // elegant vertical back-arching stretch
          touchModifyX = 0.86; // compact horizontal footprint
        }

        // Apply landing impact squash, stretch, and gestural pinch/spread scale factor
        const finalStretchX = breatheScaleX * jumpStretchX * (1 + landingSquash.current * 1.15) * gestureScaleMultiplier.current * touchModifyX;
        const finalStretchY = breatheScaleY * jumpStretchY * (1 - landingSquash.current * 0.85) * gestureScaleMultiplier.current * touchModifyY;

        // --- DRAW TAIL (Draw furthest back) ---
        ctx.save();
        ctx.translate(shiftX, shiftY);
        ctx.rotate(rollAngle.current);
        ctx.scale(finalStretchX, finalStretchY);
        ctx.translate(-shiftX, -shiftY);

        const tailSegmentLength = 12;
        const tailPointList: Array<{ x: number; y: number }> = [{ x: tailBaseX, y: tailBaseY }];
        for (let i = 1; i <= 5; i++) {
          const wagMultiplier = activeGesture === "wag" ? 1.8 : 1.0;
          const configWagSway = activeGesture === "wag" ? Math.sin(frame * 0.85 - i * 0.6) * 0.88 : Math.sin(frame * 0.15 - i * 0.8) * 0.25;
          let segAngle = Math.PI * 0.95 + (tailSway.current * 0.45 * wagMultiplier) + configWagSway;
          
          if (touchPartAnimation.current === "tail") {
            // Rigid vertical upright tail with rapid high-frequency defensive vibration!
            segAngle = Math.PI * 1.5 + Math.sin(frame * 1.4 + i * 0.3) * 0.22;
          }

          const prevPt = tailPointList[i - 1];
          tailPointList.push({
            x: prevPt.x + Math.cos(segAngle) * tailSegmentLength,
            y: prevPt.y + Math.sin(segAngle) * tailSegmentLength
          });
        }

        // 2.1 Tail Bottom base layer (底层 - 20% saturation correction procedural color)
        ctx.strokeStyle = petConfig.primaryColor;
        ctx.lineCap = "round";
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(tailPointList[0].x, tailPointList[0].y);
        for (let i = 1; i < tailPointList.length; i++) {
          ctx.lineTo(tailPointList[i].x, tailPointList[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(tailPointList[3].x, tailPointList[3].y);
        ctx.lineTo(tailPointList[5].x, tailPointList[5].y);
        ctx.stroke();

        // 2.2 Tail Mid hair fibers waving (中层)
        ctx.save();
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        for (let tIdx = 1; tIdx < tailPointList.length; tIdx++) {
          const pt = tailPointList[tIdx];
          const windOsc = Math.sin(frame * 0.2 + tIdx) * 3; 
          for (let h = -6; h <= 6; h += 3) {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y + h);
            ctx.quadraticCurveTo(
              pt.x - 10,
              pt.y + h + windOsc,
              pt.x - 16,
              pt.y + h + windOsc * 1.5
            );
            ctx.stroke();

            // 2.3 Tail tip spec 50% density particles (顶层: size 2x2, radius 5-8px, 2Hz)
            if (tIdx === tailPointList.length - 1 && Math.random() < 0.5) {
              sparkParticles.current.push({
                x: pt.x - 16 + (Math.random() - 0.5) * 8,
                y: pt.y + h + windOsc * 1.5 + (Math.random() - 0.5) * 8,
                vx: -0.2 - Math.random() * 0.4,
                vy: (Math.random() - 0.5) * 0.5,
                color: "#ffe066", // gold
                life: 0.6,
                size: 2, 
                alpha: 0.8
              });
              
              if (activeGesture === "wag" && Math.random() < 0.4) {
                sparkParticles.current.push({
                  x: shiftX + pt.x - 16,
                  y: shiftY + pt.y + h + windOsc * 1.5,
                  vx: (Math.random() - 0.5) * 4 - 2.5, // fly out backwards
                  vy: (Math.random() - 0.5) * 3,
                  color: Math.random() < 0.5 ? petConfig.primaryColor : "#ffe066",
                  life: 1.0,
                  size: 3 + Math.random() * 2.5,
                  alpha: 0.95
                });
              }
            }
          }
        }
        ctx.restore();
        ctx.restore(); // tail clip restore

        // --- DRAW LIMBS (Rear left, rear right, front left, front right) ---
        const drawRealisticLimb = (rx: number, ry: number, isBack: boolean) => {
          ctx.save();
          // Translate and rotate relative to the body's center to support seamless rolling & dancing
          ctx.translate(shiftX, shiftY);
          ctx.rotate(rollAngle.current);

          let oscLimb = Math.sin(frame * 0.12) * 5;
          if (activeGesture === "roll") {
            oscLimb = isBack ? -14 : 14; // leg splay when rolling happily
          } else if (activeGesture === "dance") {
            oscLimb = Math.sin(frame * 0.28 + (isBack ? Math.PI : 0)) * 14; // moon walk strides
          }

          const limbX = rx + (isBack ? -oscLimb : oscLimb);
          const limbY = ry + 10;
          
          // Layer 1 Bottom
          ctx.fillStyle = petConfig.secondaryColor;
          ctx.beginPath();
          ctx.arc(limbX, limbY, 13, 0, Math.PI * 2);
          ctx.fill();
          
          // White paw mittens
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(limbX - 3.5, limbY + 4, 5, 0, Math.PI * 2);
          ctx.arc(limbX + 3.5, limbY + 4, 5, 0, Math.PI * 2);
          ctx.fill();

          // Layer 2 Mid fibers pointing down
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          for (let f = -10; f <= 10; f += 4) {
            ctx.beginPath();
            ctx.moveTo(limbX + f, limbY - 4);
            ctx.lineTo(limbX + f + Math.sin(frame * 0.08 + f) * 1, limbY + 8);
            ctx.stroke();
          }

          // Layer 3 Paw stardust boundary (15% density, 1-2px, 0.3Hz flicker)
          if (Math.random() < 0.15) {
            sparkParticles.current.push({
              x: shiftX + (limbX * Math.cos(rollAngle.current) - limbY * Math.sin(rollAngle.current)),
              y: shiftY + (limbX * Math.sin(rollAngle.current) + limbY * Math.cos(rollAngle.current)),
              vx: (Math.random() - 0.5) * 0.3,
              vy: -0.2,
              color: "#ffffff",
              life: 0.7,
              size: 1, 
              alpha: 0.6
            });
          }
          ctx.restore();
        };

        // Draw paw locations
        drawRealisticLimb(-bodyR * 0.5, bodyR * 0.8, true);
        drawRealisticLimb(-bodyR * 0.15, bodyR * 0.85, false);
        drawRealisticLimb(bodyR * 0.25, bodyR * 0.85, true);
        drawRealisticLimb(bodyR * 0.6, bodyR * 0.78, false);

        // --- DRAW BODY TORSO (底层 White and Cream Bicolor) ---
        ctx.save();
        ctx.translate(shiftX, shiftY);
        ctx.rotate(rollAngle.current);
        ctx.scale(finalStretchX, finalStretchY);

        ctx.shadowBlur = 30;
        ctx.shadowColor = petConfig.primaryColor;

        // Bicolor split: left creamy orange, right snow white (英短乳白!)
        const bodyGrad = ctx.createLinearGradient(-bodyR, 0, bodyR, 0);
        bodyGrad.addColorStop(0, petConfig.primaryColor);
        bodyGrad.addColorStop(0.5, petConfig.primaryColor);
        bodyGrad.addColorStop(0.52, "#ffffff");
        bodyGrad.addColorStop(1, "#ffffff");

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
        ctx.fill();

        // 3D Body volume highlight
        const bodyHighlights = ctx.createRadialGradient(-15, -15, 2, -15, -15, bodyR * 0.85);
        bodyHighlights.addColorStop(0, "rgba(255,255,255,0.45)");
        bodyHighlights.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = bodyHighlights;
        ctx.beginPath();
        ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
        ctx.fill();

        // Body Mid fibers waving ±2px (中层)
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.0;
        const bHairCount = 140;
        for (let i = 0; i < bHairCount; i++) {
          const hairAng = (i / bHairCount) * Math.PI * 2;
          const rCos = Math.sin(hairAng);
          const rSin = Math.cos(hairAng);

          if (rCos < 0) continue; 

          const sx = rSin * bodyR;
          const sy = rCos * bodyR;
          
          const windVal = Math.sin(frame * 0.1 + i) * 2; 
          const ex = rSin * (bodyR + 6 + Math.abs(windVal)) + windVal;
          const ey = rCos * (bodyR + 6 + Math.abs(windVal));

          ctx.strokeStyle = i % 2 === 0 ? petConfig.secondaryColor : "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo((sx + ex)/2, (sy + ey)/2, ex, ey);
          ctx.stroke();

          // Body contour stardust specifications (20% outline density, radius 2-3px)
          if (Math.random() < 0.20 && i % 4 === 0) {
            sparkParticles.current.push({
              x: shiftX + ex,
              y: shiftY + ey,
              vx: rSin * 0.3,
              vy: rCos * 0.3 - 0.2,
              color: i % 2 === 0 ? petConfig.primaryColor : "#ffffff",
              life: 0.8,
              size: 1, 
              alpha: 0.6
            });
          }
        }
        ctx.restore();

        // --- DRAW HEAD (With gazes, tilts and blinking) ---
        ctx.save();
        const headShiftX = cx + headOffsetX * 0.35 + danceOffsetX.current + rollOffsetX;
        const headShiftY = cy + headOffsetY * 0.15 + danceOffsetY.current + jumpOffset.current + rollOffsetY + nodOffsetY;

        ctx.translate(headShiftX, headShiftY);
        ctx.rotate(rollAngle.current);
        ctx.scale(finalStretchX, finalStretchY);

        // Curious head tilt logic of V2.7
        let currentTilt = headOffsetX * 0.003 + nodOffsetAngle;
        if (activeExpRef.current === "curious") {
          currentTilt += 0.20; 
        }
        ctx.rotate(currentTilt);

        // Head Bottom (底层 creame/white bicolor)
        ctx.shadowBlur = 32;
        ctx.shadowColor = petConfig.secondaryColor;

        const headGrad = ctx.createLinearGradient(-headR, 0, headR, 0);
        headGrad.addColorStop(0, petConfig.primaryColor);
        headGrad.addColorStop(0.48, petConfig.primaryColor);
        headGrad.addColorStop(0.52, "#ffffff");
        headGrad.addColorStop(1, "#ffffff");

        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, 0, headR, 0, Math.PI * 2);
        ctx.fill();

        // Specular dome glaze
        const hHighlights = ctx.createRadialGradient(-10, -10, 2, -10, -10, headR * 0.8);
        hHighlights.addColorStop(0, "rgba(255,255,255,0.5)");
        hHighlights.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hHighlights;
        ctx.beginPath();
        ctx.arc(0, 0, headR, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Head Mid fibers waving ±1-2px
        ctx.lineWidth = 1.0;
        const hHairCount = 95;
        for (let i = 0; i < hHairCount; i++) {
          const hairAng = (i / hHairCount) * Math.PI * 2;
          const rCos = Math.cos(hairAng);
          const rSin = Math.sin(hairAng);

          const sx = rCos * headR;
          const sy = rSin * headR;
          const windSway = Math.sin(frame * 0.14 + i) * 1.5; 
          const ex = rCos * (headR + 5 + Math.abs(windSway)) + windSway;
          const ey = rSin * (headR + 5 + Math.abs(windSway));

          ctx.strokeStyle = i % 2 === 0 ? petConfig.secondaryColor : "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo((sx + ex)/2, (sy + ey)/2, ex, ey);
          ctx.stroke();

          // Hair escape stardust specifications (30% density, 3-5px radius)
          if (Math.random() < 0.30 && i % 3 === 0) {
            sparkParticles.current.push({
              x: headShiftX + ex,
              y: headShiftY + ey,
              vx: rCos * 0.4,
              vy: rSin * 0.4 - 0.2,
              color: i % 2 === 0 ? petConfig.primaryColor : "#ffffff",
              life: 0.8,
              size: 1, 
              alpha: 0.7
            });
          }
        }

        // --- DRAW EARS (With physical swaying) ---
        const drawRealisticEar = (isLeft: boolean) => {
          ctx.save();
          const dir = isLeft ? -1 : 1;
          const ebX = headR * 0.45 * dir;
          const ebY = -headR * 0.55;

          let flattenDelta = 0;
          if (touchPartAnimation.current === "head") {
            flattenDelta = 0.38 * dir; // Ears flatten outward to match a cozy head rub posture
          }
          
          // Shivering/freezing from winter cold or lonely drooping
          if (skyWeatherRef.current === "snow" && !shieldActiveRef.current) {
            flattenDelta += 0.20 * dir + Math.sin(frame * 0.48) * 0.04; // Trembling tremors
          } else if (moodIndexRef.current < 35) {
            flattenDelta += 0.12 * dir; // Droop due to loneliness
          } else if (moodIndexRef.current >= 85 && energyIndexRef.current >= 70) {
            // Ecstatic ear perked up/twitching occasionally with high spirit
            flattenDelta -= 0.08 * dir - Math.sin(frame * 0.22) * 0.02;
          }

          const earAng = (Math.PI / 4) * dir + (earSway.current * 0.15 * dir) + flattenDelta;
          const earLen = 30;

          const eTipX = ebX + Math.sin(earAng) * earLen;
          const eTipY = ebY - Math.cos(earAng) * earLen;

          // Ear Base Outer
          ctx.fillStyle = petConfig.primaryColor;
          ctx.beginPath();
          ctx.moveTo(ebX - 6, ebY);
          ctx.quadraticCurveTo(eTipX, eTipY, ebX + 6, ebY);
          ctx.closePath();
          ctx.fill();

          // Inner pink fold
          ctx.fillStyle = "#ffb3c1";
          ctx.beginPath();
          ctx.moveTo(ebX - 2.5, ebY);
          ctx.quadraticCurveTo(eTipX + 1.5 * dir, eTipY + 4, ebX + 2.5, ebY);
          ctx.closePath();
          ctx.fill();

          // Ear boundary stardust specifications (25% density, 2-4px, 1Hz)
          if (Math.random() < 0.25) {
            sparkParticles.current.push({
              x: headShiftX + eTipX,
              y: headShiftY + eTipY,
              vx: dir * 0.4,
              vy: -0.5,
              color: "#ffb3c1",
              life: 0.9,
              size: 1,
              alpha: 0.7
            });
          }
          ctx.restore();
        };

        drawRealisticEar(true);
        drawRealisticEar(false);

        // --- DRAW EYES (Dual layered transparent, adaptive pupil) ---
        const drawRealisticEye = (isLeft: boolean) => {
          ctx.save();
          const dir = isLeft ? -1 : 1;
          const eyeX = headR * 0.35 * dir + (headOffsetX * 0.15);
          const eyeY = 0 + (headOffsetY * 0.15);

          // --- DRAW EMOTIVE EYEBROWS ---
          ctx.save();
          ctx.strokeStyle = "#492d19";
          ctx.lineWidth = 1.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          
          let browYOffset = -9;
          let browDeltaY = 0;
          let browTilt = 0;
          const curMood = moodIndexRef.current;
          const curEnergy = energyIndexRef.current;

          if (curEnergy < 35) {
            // Sleepy/drooping eyebrows
            browYOffset = -6;
            browDeltaY = 1.8;
            browTilt = 0.05 * dir;
          } else if (curMood >= 85 && curEnergy >= 70) {
            // Excited/high-curve eyebrows
            browYOffset = -11;
            browDeltaY = -0.5;
            browTilt = -0.15 * dir;
          } else if (curMood < 35) {
            // Worried/Lonely eyebrows slanted upward to center
            browYOffset = -8;
            browDeltaY = -1.2;
            browTilt = 0.22 * dir;
          } else if (activeExpRef.current === "alert") {
            // Angry sharp slanted brows
            browYOffset = -8.5;
            browTilt = -0.25 * dir;
          }

          const browStartX = eyeX - 5.5;
          const browStartY = eyeY + browYOffset - browDeltaY - (browTilt * 3.5);
          const browEndX = eyeX + 5.5;
          const browEndY = eyeY + browYOffset + (browTilt * 3.5);

          ctx.moveTo(browStartX, browStartY);
          ctx.quadraticCurveTo(eyeX, eyeY + browYOffset - 1.2, browEndX, browEndY);
          ctx.stroke();
          ctx.restore();

          // Blinking cycle: checks if blinking frame interval, or slow blinks
          const blinkCycle = (frame % 280 < 16);
          const isSlowBlink = activeExpRef.current === "blinking" || blinkCycle;

          // Cute asymmetrical winking
          const isEyeClosedForWink = winkRemainingFrames.current > 0 && (
            (isLeft && winkingEyeSide.current === "left") ||
            (!isLeft && winkingEyeSide.current === "right")
          );
          const isSmilingClosed = (touchPartAnimation.current === "head") || isEyeClosedForWink;

          // Dynamic sleepy eyelids when energy is extremely low (dozing off)
          const isSleepySquint = (energyIndexRef.current < 35 && frame % 180 < 130);

          if (isSmilingClosed) {
            ctx.strokeStyle = "#492d19";
            ctx.lineWidth = 3.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            // Upward smiling curve for the happy wink!
            ctx.arc(eyeX, eyeY + 1.2, 7.5, 1.15 * Math.PI, 1.85 * Math.PI);
            ctx.stroke();
          } else if (isSleepySquint) {
            // Downward lazy sleeping curves
            ctx.strokeStyle = "#492d19";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY + 1.5, 7, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
          } else if (isSlowBlink) {
            ctx.strokeStyle = "#492d19";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 8, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
          } else {
            // Glazed Glass Eyes: Iris Gradient with rich saturation
            const eyeGrad = ctx.createRadialGradient(eyeX, eyeY, 1, eyeX, eyeY, 9);
            eyeGrad.addColorStop(0, "#ffb703"); // Amber warm shiny feline eyes
            eyeGrad.addColorStop(0.7, "#fb8500");
            eyeGrad.addColorStop(1, "#1a0b00");
            
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 9, 0, Math.PI * 2);
            ctx.fill();

            // Pupil adaptation diameter scaling with SkyTime
            let pupilWidth = 4.2; 
            let pupilHeight = 5.5;
            if (skyTime === "day") {
              pupilWidth = 1.3; // contracts to tiny sharp thread - extremely realistic!
            } else if (skyTime === "night") {
              pupilWidth = 6.2; // massive dilated starry black eye
              pupilHeight = 6.2;
            }

            // Force a highly dilated/starry eye if the opposite eye is winking
            if (winkRemainingFrames.current > 0) {
              pupilWidth = 6.8;
              pupilHeight = 6.8;
            }

            // Gaze tracking pointer coordinates translation
            const pDX = targetCoords.current.x - (headShiftX + eyeX);
            const pDY = targetCoords.current.y - (headShiftY + eyeY);
            const pAngle = Math.atan2(pDY, pDX);
            const pDist = Math.min(2.5, Math.hypot(pDX, pDY) * 0.015);

            const pupX = eyeX + Math.cos(pAngle) * pDist;
            const pupY = eyeY + Math.sin(pAngle) * pDist;

            // Draw pupil
            ctx.fillStyle = "#04020a";
            ctx.beginPath();
            ctx.ellipse(pupX, pupY, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dual glossy glass reflective slivers 
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath();
            ctx.arc(pupX - 2.5, pupY - 2.5, 2.0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255,255,255,0.45)";
            ctx.beginPath();
            ctx.arc(pupX + 3.0, pupY + 2.0, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        };

        drawRealisticEye(true);
        drawRealisticEye(false);

        // --- DRAW SNOUT, NOSE & MOUTHS ---
        const isChewing = chewRemainingFrames.current > 0;
        const noseX = headOffsetX * 0.2;
        const noseY = 7 + headOffsetY * 0.2 + (isChewing ? Math.sin(frame * 0.35) * 1.5 : 0);

        // Snout cheeks bulging (bulges with chewing cadence!)
        const cheekBulge = isChewing ? Math.abs(Math.sin(frame * 0.35)) * 2.2 : 0;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(noseX - 4.5 - cheekBulge * 0.5, noseY, 5.5 + cheekBulge, 0, Math.PI * 2);
        ctx.arc(noseX + 4.5 + cheekBulge * 0.5, noseY, 5.5 + cheekBulge, 0, Math.PI * 2);
        ctx.fill();

        // Glisten reflective nose
        ctx.fillStyle = "#ff85a1"; 
        ctx.beginPath();
        ctx.moveTo(noseX - 3.5, noseY - 2.5);
        ctx.lineTo(noseX + 3.5, noseY - 2.5);
        ctx.lineTo(noseX, noseY + 1.0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(noseX - 1.5, noseY - 2.5, 1, 1);

        // Mouth drawing (open if chewing or happy active state)
        ctx.strokeStyle = "#1a134a";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (isChewing) {
          const chewMouthFactor = Math.abs(Math.sin(frame * 0.35));
          ctx.stroke();
          ctx.fillStyle = "#ff6b8b";
          ctx.beginPath();
          // Animated ellipse reflecting open/close chew cycle
          ctx.ellipse(noseX, noseY + 2.5, 4, 1.2 + chewMouthFactor * 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#1a134a";
          ctx.stroke();
        } else if (activeExpRef.current === "happy") {
          ctx.stroke();
          ctx.fillStyle = "#ff6b8b";
          ctx.beginPath();
          ctx.arc(noseX, noseY + 2.5, 4, 0, Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#1a134a";
          ctx.beginPath();
          ctx.arc(noseX, noseY + 2.5, 4, 0, Math.PI);
          ctx.stroke();
        } else if (energyIndexRef.current < 35 && frame % 180 >= 135) {
          // Cute slow yawning round mouth animation when extremely tired
          ctx.stroke();
          ctx.fillStyle = "#ff6b8b";
          ctx.beginPath();
          ctx.arc(noseX, noseY + 2.5, 2.5 + Math.sin(frame * 0.1) * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#1a134a";
          ctx.beginPath();
          ctx.arc(noseX, noseY + 2.5, 2.5 + Math.sin(frame * 0.1) * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (moodIndexRef.current < 35) {
          // Downturned pouty sad mouth curves
          ctx.arc(noseX - 2.2, noseY + 4.0, 2.2, Math.PI, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(noseX + 2.2, noseY + 4.0, 2.2, Math.PI, 2 * Math.PI);
          ctx.stroke();
        } else {
          ctx.arc(noseX - 2.2, noseY + 1.0, 2.2, 0, Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(noseX + 2.2, noseY + 1.0, 2.2, 0, Math.PI);
          ctx.stroke();
        }

        // --- WET NOSE BREATHING VAPOR PUFF ---
        breathParticleTimer.current++;
        if (breathParticleTimer.current % 120 === 0) { 
          for (let pPos = 0; pPos < 10; pPos++) {
            sparkParticles.current.push({
              x: headShiftX + noseX,
              y: headShiftY + noseY + 1,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 0.3 + Math.random() * 0.8, 
              color: "rgba(255, 255, 255, 0.45)", 
              life: 0.6,
              size: 2 + Math.random() * 2, 
              alpha: 0.5
            });
          }
        }

        // --- WHISKERS (Independent 1px wide with star tip lights) ---
        const drawRealisticWhiskers = (isLeft: boolean) => {
          ctx.save();
          const dir = isLeft ? -1 : 1;
          const wStartX = noseX + 3.5 * dir;
          const wStartY = noseY + 1.2;

          let swayAmt = Math.sin(frame * 0.08) * 0.05 + headOffsetX * 0.002;
          if (activeExpRef.current === "alert") {
            swayAmt += 0.12 * dir; // whiskers pull forward of alert state!
          }

          ctx.strokeStyle = "rgba(255,255,255,0.72)";
          ctx.lineWidth = 1.0;

          const lengths = [36, 40, 34];
          lengths.forEach((len, idx) => {
            const angleVal = (idx * 0.12 - 0.06) * dir + swayAmt;
            const endX = wStartX + Math.cos(angleVal) * len * dir;
            const endY = wStartY + Math.sin(angleVal) * len + (idx * 1.5);

            ctx.beginPath();
            ctx.moveTo(wStartX, wStartY);
            ctx.quadraticCurveTo(
              (wStartX + endX)/2, 
              (wStartY + endY)/2 - 2, 
              endX, 
              endY
            );
            ctx.stroke();

            ctx.fillStyle = "#ffffaa";
            ctx.fillRect(endX - 1.0, endY - 1.0, 2, 2);
          });
          ctx.restore();
        };

        drawRealisticWhiskers(true);
        drawRealisticWhiskers(false);

        // Glow cheeks if happy or cheek blush
        if (activeExpRef.current === "happy") {
          ctx.fillStyle = "rgba(253, 64, 122, 0.25)";
          ctx.beginPath();
          ctx.arc(-headR * 0.5, 4, 7, 0, Math.PI * 2);
          ctx.arc(headR * 0.5, 4, 7, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore(); // Head transform restore

        // --- DRAW HUG ENERGY SHIELD (TRANS-LUCENT PULSING RING & Orb) ---
        if (shieldActiveRef.current || touchEffectRef.current === "hug") {
          ctx.save();
          const pulse = Math.sin(frame * 0.1) * 6;
          const shieldRadius = bodyR + 32 + pulse;

          const bubbleGrad = ctx.createRadialGradient(cx, cy + jumpOffset.current, shieldRadius - 10, cx, cy + jumpOffset.current, shieldRadius + 6);
          bubbleGrad.addColorStop(0, "rgba(244, 63, 145, 0.0)");
          bubbleGrad.addColorStop(0.85, "rgba(244, 63, 145, 0.12)");
          bubbleGrad.addColorStop(0.98, "rgba(6, 182, 212, 0.55)");
          bubbleGrad.addColorStop(1, "rgba(6, 182, 212, 0.0)");

          ctx.fillStyle = bubbleGrad;
          ctx.beginPath();
          ctx.arc(cx, cy + jumpOffset.current, shieldRadius + 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#06b6d4";
          ctx.beginPath();
          ctx.arc(cx, cy + jumpOffset.current, shieldRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // --- DRAW FEEDING OR SNACK falling BUBBLES ---
        if (touchEffectRef.current === "feed" && feedingItemRef.current) {
          foodDropProgress.current += 0.016; // Falling progress update increment (approx 1s duration)

          if (foodDropProgress.current <= 0.65) {
            const startY = cy - 140;
            const targetX = headShiftX + noseX;
            const targetY = headShiftY + noseY - 4;

            // Fluid parabolic lock-on coordinates to precise head mouth center!
            const currentY = startY + (targetY - startY) * (foodDropProgress.current / 0.65);
            const currentX = cx + (targetX - cx) * (foodDropProgress.current / 0.65);

            ctx.save();
            ctx.shadowColor = petConfig.primaryColor;
            ctx.shadowBlur = 15;
            ctx.font = "22px sans-serif";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(feedingItemRef.current === "snack" ? "🐟" : feedingItemRef.current === "milk" ? "🍼" : "🍖", currentX, currentY);
            ctx.restore();

            // Spawn stardust trails following gravity path
            if (Math.random() < 0.38) {
              const trailColor = feedingItemRef.current === "snack" ? "#a8ffb2" : feedingItemRef.current === "milk" ? "#ffffff" : "#ff85a1";
              sparkParticles.current.push({
                x: currentX + (Math.random() - 0.5) * 12,
                y: currentY + 6,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -0.2 - Math.random() * 0.8,
                color: trailColor,
                life: 0.6,
                size: 2.5 + Math.random() * 2,
                alpha: 0.75
              });
            }
          } else if (foodDropProgress.current > 0.65 && foodDropProgress.current < 0.68) {
            // Collision contact sweet spot! Pet bites the snack!
            playSound("sparkle");
            
            // Adjust pet emotion stats!
            setEnergyIndex(prev => Math.min(100, prev + 22));
            setMoodIndex(prev => Math.min(100, prev + 12));
            setIntimacyIndex(prev => Math.min(100, prev + 4));
            
            // Stardust eating burst explosion!
            const foodColor = feedingItemRef.current === "snack" ? "#a8ffb2" : feedingItemRef.current === "milk" ? "#ffffff" : "#ff85a1";
            for (let i = 0; i < 18; i++) {
              sparkParticles.current.push({
                x: headShiftX + noseX,
                y: headShiftY + noseY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 5 - 1.5,
                color: foodColor,
                life: 0.85,
                size: 3 + Math.random() * 4,
                alpha: 0.95
              });
            }

            chewRemainingFrames.current = 90; // Start 90 frames of custom chewing animation (1.5s)
            foodDropProgress.current = 0.7; // Transition forward
          }
        }

        // --- MANAGE CHEWING PHYSICS & CRUMB EMISSIONS ---
        if (chewRemainingFrames.current > 0) {
          chewRemainingFrames.current--;

          // Periodically spit crumbs out of the chewing mouth for peak realism!
          if (chewRemainingFrames.current % 10 === 0 && feedingItem) {
            const foodColor = feedingItem === "snack" ? "#a8ffb2" : feedingItem === "milk" ? "#ffffff" : "#ff85a1";
            sparkParticles.current.push({
              x: headShiftX + noseX + (Math.random() - 0.5) * 6,
              y: headShiftY + noseY + 2.5,
              vx: (Math.random() - 0.5) * 3,
              vy: 0.6 + Math.random() * 1.8, // falls downwards
              color: foodColor,
              life: 0.6,
              size: 1.5 + Math.random() * 1.5,
              alpha: 0.85
            });
          }

          if (chewRemainingFrames.current === 1) {
            // Completed chewing sequence completely! Gulp/Swallowed!
            playSound("success");

            // Happy core stardust particle burst
            for (let i = 0; i < 12; i++) {
              sparkParticles.current.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * 4.5,
                vy: (Math.random() - 0.5) * 4 - 2,
                color: petConfig.primaryColor,
                life: 1.0,
                size: 4 + Math.random() * 3,
                alpha: 0.9
              });
            }

            // High priority goal: Trigger Wink wink on 3rd feed!
            if (feedRecordCount.current >= 3) {
              feedRecordCount.current = 0; // Reset counter
              winkRemainingFrames.current = 75; // Trigger lovely 1.25s Wink!
              winkingEyeSide.current = Math.random() < 0.5 ? "left" : "right";
              playSound("chime");
              setWhisperBubbleText("喂满3次啦！啵唧～给你送一个超萌 Single Wink！😉💖");
              setWhisperTimer(180);

              // Explode extra cute sparkles near the winking eye!
              const targetEyeDirection = winkingEyeSide.current === "left" ? -1 : 1;
              const winkEyeX = headShiftX + (headR * 0.35 * targetEyeDirection) + (headOffsetX * 0.15);
              const winkEyeY = headShiftY + (headOffsetY * 0.15);
              for (let i = 0; i < 25; i++) {
                sparkParticles.current.push({
                  x: winkEyeX,
                  y: winkEyeY,
                  vx: (Math.random() - 0.5) * 6.5,
                  vy: (Math.random() - 0.5) * 6 - 1,
                  color: "#ffca28",
                  life: 1.1,
                  size: 3 + Math.random() * 4,
                  alpha: 0.98
                });
              }
            } else {
              const remainingVal = 3 - feedRecordCount.current;
              const itemLabel = feedingItem === "snack" ? "极光银鱼" : feedingItem === "milk" ? "星尘奶瓶" : "多维烤肉";
              setWhisperBubbleText(`啊呜啊呜～${itemLabel}真好吃！再喂 ${remainingVal} 次就会给你眨眼放电哦～ 😉✨`);
              setWhisperTimer(150);
            }

            // Cleanup canvas feeding state back to idle
            setTouchEffect("idle");
            setFeedingItem(null);
          }
        }

        // --- DRAW STROKE TRAILS ---
        ctx.save();
        strokeTrail.current.forEach((t) => {
          t.alpha -= 0.04;
          if (t.alpha > 0) {
            ctx.save();
            ctx.fillStyle = "#ffca28";
            ctx.globalAlpha = t.alpha * 0.85;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffca28";
            ctx.fillRect(t.x - 2, t.y - 2, 4, 4);
            ctx.restore();
          }
        });
        strokeTrail.current = strokeTrail.current.filter(t => t.alpha > 0);
        ctx.restore();

        // Render celestial voice speech / whispering floating bubbles
        if (whisperBubbleTextRef.current && whisperTimerRef.current > 0) {
          ctx.save();
          ctx.fillStyle = "rgba(15, 10, 36, 0.82)";
          ctx.strokeStyle = "rgba(252, 64, 122, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(0,0,0,0.5)";

          const textWidth = ctx.measureText(whisperBubbleTextRef.current).width;
          const bubbleW = Math.min(340, textWidth + 30);
          const bubbleH = textWidth > 300 ? 55 : 32;
          const bubbleX = cx - bubbleW / 2;
          const bubbleY = cy - bodyR - 85 + Math.sin(frame * 0.05) * 2;

          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8) : ctx.rect(bubbleX, bubbleY, bubbleW, bubbleH);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx - 6, bubbleY + bubbleH);
          ctx.lineTo(cx, bubbleY + bubbleH + 6);
          ctx.lineTo(cx + 6, bubbleY + bubbleH);
          ctx.closePath();
          ctx.fillStyle = "rgba(15, 10, 36, 0.82)";
          ctx.fill();

          ctx.fillStyle = "#fbcfe8";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          if (textWidth > 300) {
            ctx.fillText(whisperBubbleTextRef.current.slice(0, 20), cx, bubbleY + 16);
            ctx.fillText(whisperBubbleTextRef.current.slice(20), cx, bubbleY + 36);
          } else {
            ctx.fillText(whisperBubbleTextRef.current, cx, bubbleY + bubbleH / 2);
          }
          ctx.restore();
        }

        ctx.restore(); // V2.7 root transform restore
      } else if ((renderMode === "shaded") && imgElement) {
        ctx.save();
        
        // Add dynamic floating movement (breathing cycle + hover)
        const breatheScaleY = 1 + Math.sin(frame * 0.05) * 0.015;
        const breatheScaleX = 1 - Math.sin(frame * 0.05) * 0.005;
        
        let jumpStretchX = 1;
        let jumpStretchY = 1;
        if (isJumping.current) {
          if (jumpVelocity.current < 0) {
            // heading up: stretch
            jumpStretchY = 1.08;
            jumpStretchX = 0.95;
          } else {
            // heading down: squash
            jumpStretchY = 0.94;
            jumpStretchX = 1.03;
          }
        }
        
        // Ground shadow at static position
        ctx.save();
        const shadowScale = Math.max(0.25, 1 - Math.abs(jumpOffset.current) / 100);
        const groundY = cy + bodyR + 15;
        const shadowGrad = ctx.createRadialGradient(cx, groundY, 2, cx, groundY, 45);
        shadowGrad.addColorStop(0, "rgba(0,0,0,0.6)");
        shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, groundY, 45 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Target following horizontal/vertical slight shift (gaze tracking!) with winter shivering physics
        let shiverX = 0;
        let shiverY = 0;
        if (skyWeatherRef.current === "snow" && !shieldActiveRef.current) {
          shiverX = Math.sin(frame * 0.48) * 0.75;
          shiverY = Math.cos(frame * 0.52) * 0.7;
        }

        const shiftX = cx + headOffsetX * 0.35 + danceOffsetX.current + rollOffsetX + shiverX;
        const shiftY = cy + headOffsetY * 0.15 + danceOffsetY.current + jumpOffset.current + rollOffsetY + nodOffsetY + shiverY;

        ctx.translate(shiftX, shiftY);
        ctx.rotate(rollAngle.current);
        
        // Apply landing squishy physics to the photographed kitten image too!
        const finalImgStretchX = breatheScaleX * jumpStretchX * (1 + landingSquash.current * 1.15);
        const finalImgStretchY = breatheScaleY * jumpStretchY * (1 - landingSquash.current * 0.85);
        ctx.scale(finalImgStretchX, finalImgStretchY);
        
        // 2.5D head tilting/swivel rotation
        const rotateAmt = headOffsetX * 0.002 + nodOffsetAngle;
        ctx.rotate(rotateAmt);

        // Soft ambient glow background behind realistic kitten representing warm stardust
        // 注：此分支仅在 renderMode === "shaded" 时进入，光晕取固定值
        ctx.shadowColor = petConfig.primaryColor;
        ctx.shadowBlur = 24;

        // Render the image
        const targetWidth = 150;
        const targetHeight = 150 * (imgElement.height / imgElement.width);
        ctx.drawImage(imgElement, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
        
        ctx.restore();
      } else {
        // Fallback to standard 2-8 procedural rigging representation
        ctx.save();
        // Translate and Rotate the procedural pet around its dynamic center mass
        ctx.translate(cx + danceOffsetX.current, cy + danceOffsetY.current);
        ctx.rotate(rollAngle.current);
        ctx.translate(-(cx + danceOffsetX.current), -(cy + danceOffsetY.current));

        const bodyGradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, bodyR);
        bodyGradient.addColorStop(0, petConfig.primaryColor);
      bodyGradient.addColorStop(0.7, petConfig.secondaryColor);
      bodyGradient.addColorStop(1, "rgba(5,3,10,1)");

      ctx.fillStyle = bodyGradient;
      ctx.shadowBlur = renderMode === "wireframe" ? 0 : 25;
      ctx.shadowColor = petConfig.primaryColor;

      // If shaded mode: draw smooth organic volume. Otherwise draw diagnostic mesh framework.
      if (renderMode === "shaded") {
        ctx.beginPath();
        ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight overlay for physical roundness glaze
        const specOffset = -bodyR * 0.35;
        const specularGrad = ctx.createRadialGradient(
          cx + specOffset, cy + specOffset, 2,
          cx + specOffset, cy + specOffset, bodyR * 0.4
        );
        specularGrad.addColorStop(0, "rgba(255,255,255,0.4)");
        specularGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = specularGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
        ctx.fill();
      } else if (renderMode === "wireframe" || renderMode === "rig") {
        // Elegant polygonal concentric coordinate mesh
        ctx.strokeStyle = petConfig.primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
        ctx.stroke();
        // Spoke lines
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * bodyR, cy + Math.sin(a) * bodyR);
          ctx.stroke();
        }
      } else if (renderMode === "xray") {
        // Radiant glowing edge ring
        ctx.strokeStyle = "rgba(123, 97, 255, 0.7)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#8a4fff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Render Procedural Contours and Fluffy Fur Tufts around Body shape
      if (renderMode === "shaded" && furDensity > 0) {
        ctx.save();
        ctx.strokeStyle = petConfig.primaryColor;
        ctx.lineWidth = 1.3;
        
        const hairCount = furDensity;
        // Seed mathematical strands along standard circumference coordinates
        for (let i = 0; i < hairCount; i++) {
          const a = (i / hairCount) * Math.PI * 2;
          const hairLen = 6 + Math.sin(frame * 0.1 + i * 3) * 3;
          
          // Only emit hair strands outward around sides and back bounds
          const radialCos = Math.cos(a);
          const radialSin = Math.sin(a);
          
          const startPointX = cx + radialCos * bodyR;
          const startPointY = cy + radialSin * bodyR;
          
          const endPointX = cx + radialCos * (bodyR + hairLen) + Math.sin(frame * 0.05 + i) * 2;
          const endPointY = cy + radialSin * (bodyR + hairLen) + Math.cos(frame * 0.05 + i) * 2;

          ctx.strokeStyle = i % 3 === 0 ? petConfig.secondaryColor : "rgba(255,255,255,0.75)";
          ctx.beginPath();
          ctx.moveTo(startPointX, startPointY);
          ctx.quadraticCurveTo(
            (startPointX + endPointX)/2 + Math.cos(frame * 0.02) * 3,
            (startPointY + endPointY)/2 + Math.sin(frame * 0.03) * 3,
            endPointX,
            endPointY
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Render 4 Limbs and Paws Cycle
      const limbCycle = Math.sin(frame * 0.12) * 5;
      const drawLimb = (x: number, y: number, isBack: boolean) => {
        ctx.save();
        const limbX = x + (isBack ? -limbCycle : limbCycle);
        const limbY = y + 10;
        
        ctx.fillStyle = petConfig.secondaryColor;
        ctx.strokeStyle = "#080514";
        ctx.lineWidth = 2;

        if (renderMode === "shaded") {
          ctx.beginPath();
          ctx.arc(limbX, limbY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cute white toe details on shaded models
          ctx.beginPath();
          ctx.fillStyle = "#ffffff";
          ctx.arc(limbX - 3, limbY + 4, 4, 0, Math.PI * 2);
          ctx.arc(limbX + 3, limbY + 4, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = petConfig.secondaryColor;
          ctx.strokeRect(limbX - 8, limbY - 8, 16, 16);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(limbX, limbY);
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw rear paws and front paws relative to body height base
      drawLimb(cx - bodyR * 0.5, cy + bodyR * 0.8, true);
      drawLimb(cx - bodyR * 0.15, cy + bodyR * 0.85, false);
      drawLimb(cx + bodyR * 0.25, cy + bodyR * 0.85, true);
      drawLimb(cx + bodyR * 0.6, cy + bodyR * 0.78, false);

      // 5. Render Head Segment Bouncing / Gaze targeting coordinates
      ctx.save();
      const headGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, headR);
      headGrad.addColorStop(0, petConfig.primaryColor);
      headGrad.addColorStop(0.7, petConfig.secondaryColor);
      headGrad.addColorStop(1, "rgba(5,3,10,1)");

      ctx.fillStyle = headGrad;
      ctx.shadowBlur = renderMode === "wireframe" ? 0 : 20;
      ctx.shadowColor = petConfig.secondaryColor;

      if (renderMode === "shaded") {
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();

        // Head specular Highlight glaze overlay
        const specOffset = -headR * 0.35;
        const hSpecGrad = ctx.createRadialGradient(
          hx + specOffset, hy + specOffset, 2,
          hx + specOffset, hy + specOffset, headR * 0.4
        );
        hSpecGrad.addColorStop(0, "rgba(255,255,255,0.42)");
        hSpecGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hSpecGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();
      } else if (renderMode === "wireframe" || renderMode === "rig") {
        ctx.strokeStyle = petConfig.secondaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.stroke();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + Math.cos(a) * headR, hy + Math.sin(a) * headR);
          ctx.stroke();
        }
      } else if (renderMode === "xray") {
        ctx.strokeStyle = "rgba(123, 97, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#8a4fff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Procedural fur layers around head
      if (renderMode === "shaded" && furDensity > 0) {
        ctx.save();
        ctx.lineWidth = 1.2;
        const headHairs = Math.round(furDensity * 0.7);
        for (let i = 0; i < headHairs; i++) {
          const a = (i / headHairs) * Math.PI * 2;
          const hairLen = 5 + Math.cos(frame * 0.15 + i) * 2.5;
          const radCos = Math.cos(a);
          const radialSin = Math.sin(a);

          const shX = hx + radCos * headR;
          const shY = hy + radialSin * headR;

          const ehX = hx + radCos * (headR + hairLen) + Math.cos(frame * 0.1 + i) * 1.5;
          const ehY = hy + radialSin * (headR + hairLen) + Math.sin(frame * 0.08 + i) * 1.5;

          ctx.strokeStyle = i % 2 === 0 ? petConfig.primaryColor : "rgba(255,255,255,0.7)";
          ctx.beginPath();
          ctx.moveTo(shX, shY);
          ctx.quadraticCurveTo((shX + ehX)/2, (shY + ehY)/2, ehX, ehY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Draw Ears with inertia momentum
      const drawEar = (isLeft: boolean) => {
        ctx.save();
        const earDirX = isLeft ? -1 : 1;
        const earBaseX = hx + headR * 0.5 * earDirX;
        const earBaseY = hy - headR * 0.5;

        const earAngle = Math.PI / 4 * earDirX + (earSway.current * 0.18 * earDirX);
        const earLength = 32;

        const earTipX = earBaseX + Math.sin(earAngle) * earLength;
        const earTipY = earBaseY - Math.cos(earAngle) * earLength;

        if (renderMode === "shaded") {
          // Inner/Outer pink flaps
          ctx.fillStyle = petConfig.secondaryColor;
          ctx.strokeStyle = "#080514";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(earBaseX - 6, earBaseY);
          ctx.quadraticCurveTo(earTipX, earTipY, earBaseX + 6, earBaseY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cute pink ear inner shell
          ctx.fillStyle = "#ffb3c1";
          ctx.beginPath();
          ctx.moveTo(earBaseX - 2, earBaseY);
          ctx.quadraticCurveTo(earTipX, earTipY + 4, earBaseX + 2, earBaseY);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.strokeStyle = petConfig.primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(earBaseX, earBaseY);
          ctx.lineTo(earTipX, earTipY);
          ctx.stroke();
          ctx.strokeRect(earTipX - 3, earTipY - 3, 6, 6);
        }
        ctx.restore();
      };

      // Draw two gorgeous flappy ears
      drawEar(true);
      drawEar(false);

      // 7. Render dynamic gazing eyes & cute muzzle
      ctx.save();
      const drawEye = (isLeft: boolean) => {
        const eyeOffsetDir = isLeft ? -1 : 1;
        const eyeBaseX = hx + headR * 0.35 * eyeOffsetDir + (headOffsetX * 0.2);
        const eyeBaseY = hy - headR * 0.05 + (headOffsetY * 0.2);

        // Blinking cycle: eye is closed if frame fits interval
        const isBlinking = (frame % 160 < 6);

        if (isBlinking) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(eyeBaseX - 5, eyeBaseY);
          ctx.lineTo(eyeBaseX + 5, eyeBaseY);
          ctx.stroke();
        } else {
          // Outer whites
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(eyeBaseX, eyeBaseY, 7, 0, Math.PI * 2);
          ctx.fill();

          // Pupil tracking target coords!
          const pupilDX = targetCoords.current.x - eyeBaseX;
          const pupilDY = targetCoords.current.y - eyeBaseY;
          const pupilAngle = Math.atan2(pupilDY, pupilDX);
          const pupilDist = Math.min(2.5, Math.hypot(pupilDX, pupilDY) * 0.015);
          
          const pupilX = eyeBaseX + Math.cos(pupilAngle) * pupilDist;
          const pupilY = eyeBaseY + Math.sin(pupilAngle) * pupilDist;

          ctx.fillStyle = "#0a071c";
          ctx.beginPath();
          ctx.arc(pupilX, pupilY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Sparkly specular iris reflection highlight reflection dot
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pupilX - 1.5, pupilY - 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      if (renderMode === "shaded") {
        drawEye(true);
        drawEye(false);

        // Cute glowing muzzle and tiny white nose bridge
        const noseX = hx + (headOffsetX * 0.4);
        const noseY = hy + 8 + (headOffsetY * 0.4);

        ctx.fillStyle = petConfig.secondaryColor;
        ctx.beginPath();
        ctx.arc(noseX - 5, noseY, 6, 0, Math.PI * 2);
        ctx.arc(noseX + 5, noseY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#080512";
        ctx.beginPath();
        ctx.moveTo(noseX - 3.5, noseY - 2.5);
        ctx.lineTo(noseX + 3.5, noseY - 2.5);
        ctx.lineTo(noseX, noseY + 1.5);
        ctx.closePath();
        ctx.fill();
      } else {
        // Simple pixel skeletal eyes representation
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(hx - 12, hy - 4, 5, 5);
        ctx.fillRect(hx + 7, hy - 4, 5, 5);
      }
      ctx.restore();

      // 8. Render segmented skeletal Tail
      ctx.save();
      const tailSegmentLength = 12;
      const tailPointList: Array<{ x: number; y: number }> = [{ x: tailBaseX, y: tailBaseY }];

      // Segment wave propagation chain
      for (let i = 1; i <= 5; i++) {
        const segAngle = Math.PI * 0.95 + (tailSway.current * 0.4) + Math.sin(frame * 0.15 - i * 0.8) * 0.25;
        const prevPt = tailPointList[i - 1];
        tailPointList.push({
          x: prevPt.x + Math.cos(segAngle) * tailSegmentLength,
          y: prevPt.y + Math.sin(segAngle) * tailSegmentLength
        });
      }

      if (renderMode === "shaded") {
        // Draw fluffy tail contour stroke
        ctx.strokeStyle = petConfig.primaryColor;
        ctx.lineCap = "round";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(tailPointList[0].x, tailPointList[0].y);
        for (let i = 1; i < tailPointList.length; i++) {
          ctx.lineTo(tailPointList[i].x, tailPointList[i].y);
        }
        ctx.stroke();

        // Tip white fluff point
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(tailPointList[3].x, tailPointList[3].y);
        ctx.lineTo(tailPointList[5].x, tailPointList[5].y);
        ctx.stroke();
      } else {
        ctx.strokeStyle = petConfig.secondaryColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tailPointList[0].x, tailPointList[0].y);
        for (let i = 1; i < tailPointList.length; i++) {
          ctx.lineTo(tailPointList[i].x, tailPointList[i].y);
          ctx.strokeRect(tailPointList[i].x - 2, tailPointList[i].y - 2, 4, 4);
        }
        ctx.stroke();
      }
      ctx.restore();
      } // Closing the main photorealistic else block

      // Interactive V2.0 Realistic Stardust Particle shroud wrapping the pet body
      if (renderMode === "realistic-stardust") {
        ctx.save();
        const colors = [petConfig.primaryColor, petConfig.secondaryColor, "#7e95a5", "#ff8ba7", "#ffe066"];
        for (let layer = 0; layer < 4; layer++) {
          const speedFactor = 0.02 + layer * 0.008;
          const radiusX = 130 - layer * 20;
          const radiusY = 55 - layer * 7;
          // Slowly tilt orbit angles dynamically
          const tiltAngle = (layer * Math.PI / 4) + Math.sin(frame * 0.008) * 0.3;
          
          ctx.beginPath();
          // Render particles along the tilted orbital path
          for (let pStep = 0; pStep < 45; pStep++) {
            const stepAng = (frame * speedFactor) + (pStep * Math.PI * 2 / 45);
            const rawX = Math.cos(stepAng) * radiusX;
            const rawY = Math.sin(stepAng) * radiusY;
            
            // Orbit matrix rotation
            const rotX = rawX * Math.cos(tiltAngle) - rawY * Math.sin(tiltAngle);
            const rotY = rawX * Math.sin(tiltAngle) + rawY * Math.cos(tiltAngle);
            
            const px = cx + rotX + danceOffsetX.current;
            const py = cy + rotY + danceOffsetY.current + jumpOffset.current;
            
            // Draw pixelated glowing starry dusts
            ctx.fillStyle = colors[(pStep + layer) % colors.length];
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = bgGrad ? 10 : 6;
            ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
          }
        }
        ctx.restore();
      }

      // Kinematic bone rig overlays drawn on top if in Diagnostic Rig mode
      if (renderMode === "rig") {
        ctx.save();
        ctx.strokeStyle = "#f4f1de";
        ctx.fillStyle = "#e07a5f";
        ctx.lineWidth = 2.5;

        const drawBone = (sx: number, sy: number, ex: number, ey: number) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        };

        // Draw body backbone to head
        drawBone(cx, cy, hx, hy);
        // Spine bone to tail
        drawBone(cx, cy, tailBaseX, tailBaseY);
        // Eye vectors
        ctx.strokeStyle = "#06d6a0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy);
        ctx.lineTo(mouseCoords.current.x, mouseCoords.current.y);
        ctx.moveTo(hx + 8, hy);
        ctx.lineTo(mouseCoords.current.x, mouseCoords.current.y);
        ctx.stroke();

        ctx.restore();
      }

      // 9. Draw Orbiting Stars if equipped (Layered behind and in front of pet based on angle)
      if (equipped.orbit) {
        ctx.save();
        const starsCount = 3;
        for (let i = 0; i < starsCount; i++) {
          const orbitAngle = (frame * 0.038) + (i * (Math.PI * 2) / starsCount);
          const orbitRadiusX = 145;
          const orbitRadiusY = 40;
          const starX = cx + Math.cos(orbitAngle) * orbitRadiusX;
          const starY = cy + Math.sin(orbitAngle) * orbitRadiusY + 15;

          const isBehind = Math.sin(orbitAngle) < 0;

          // Don't draw yet if behind (drawn before body in a pure layered renderer, but with dynamic transparency we can adjust layer order)
          ctx.beginPath();
          ctx.fillStyle = i === 0 ? "#ffe066" : i === 1 ? "#a8ffb2" : "#9ae6ff";
          ctx.shadowBlur = 12;
          ctx.shadowColor = ctx.fillStyle;

          // Drawing neat glowing retro orb planets with atmosphere rings
          ctx.arc(starX, starY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Planet ring overlay
          ctx.beginPath();
          ctx.ellipse(starX, starY, 13, 3.5, Math.PI / 6, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 10. Draw Halo Above Head if equipped
      if (equipped.halo) {
        ctx.save();
        const haloX = hx;
        const haloY = hy - headR - 15;

        // Dynamic glowing aura outline
        ctx.shadowBlur = 24;
        ctx.shadowColor = equipped.halo.includes("golden") ? "#ffe066" : "#a8ffb2";
        ctx.strokeStyle = ctx.shadowColor;
        ctx.lineWidth = 4.5;

        // Draw tilted ring above head
        ctx.beginPath();
        ctx.ellipse(haloX, haloY, 35, 11, Math.PI * 0.08, 0, Math.PI * 2);
        ctx.stroke();

        // Little halo satellite sparks
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        const SatAngle = frame * 0.06;
        ctx.fillRect(haloX + Math.cos(SatAngle) * 35 - 2, haloY + Math.sin(SatAngle) * 11 - 2, 4, 4);

        ctx.restore();
      }
    }
      }

      // 11. Physics Particle burst engine update & draw
      sparkParticles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Emote floating texts bypass gravitational pull (they float upwards), while normal sparks are pulled down
        if (p.text) {
          p.vy -= 0.012; // slow rising lift
        } else {
          p.vy += 0.082; // mild gravity drag
        }
        
        p.life -= 0.016;

        if (p.life > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life * p.alpha);

          if (p.text) {
            // Render beautiful emotional text/emoji bubbling up
            ctx.font = `bold ${10 + p.size * 2.2}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;
            ctx.fillStyle = p.color;
            ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
            ctx.shadowBlur = 5;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.text, p.x, p.y);
          } else {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            // Draw pixelated glowing star elements
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
          ctx.restore();
        }
      });
      sparkParticles.current = sparkParticles.current.filter(p => p.life > 0);

      // 12. Render glass lick drool overlay if active
      if (lickOverlayFrames.current > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, lickOverlayFrames.current / 20);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Outer wet glaze mist
        ctx.fillStyle = "rgba(255, 230, 242, 0.28)";
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 105, 0, Math.PI * 2);
        ctx.fill();
        
        // Slobber and drool droplet highlights on interactive glass screen
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(centerX - 45, centerY - 40, 20, 0, Math.PI * 0.9, false);
        ctx.arc(centerX + 35, centerY - 25, 25, 0.25 * Math.PI, 1.15 * Math.PI, false);
        ctx.stroke();

        // Core soft pink tongue swipe curve licking outward toward lens
        ctx.fillStyle = "rgba(255, 115, 150, 0.88)";
        ctx.shadowColor = "#ffccd5";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        // tongue sweeps up and down frame-by-frame
        const tongueYOffset = Math.sin(frame * 0.22) * 12 + 45;
        ctx.ellipse(centerX, centerY + tongueYOffset, 65, 52, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gloss shine on soft velvet tongue
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(centerX - 18, centerY + tongueYOffset - 12, 14, 7, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // --- EMOTIONAL STATUS MICRO-EFFECT PARTICLES EMITTER ---
      if (frame % 80 === 0) { // Emit once every ~1.3 seconds
        // Safely compute local relative head offsets for coordinates alignment
        const targetDX = mouseCoords.current.x - cx;
        const targetDY = mouseCoords.current.y - (cy - 30);
        const lAngle = Math.atan2(targetDY, targetDX);
        const lLookDist = Math.min(10, Math.hypot(targetDX, targetDY) * 0.08);
        const lHeadOffsetX = Math.cos(lAngle) * lLookDist;
        const lHeadOffsetY = Math.sin(lAngle) * lLookDist - 30;
        const lHeadR = 34;

        const headXVal = cx + lHeadOffsetX * 0.35 + danceOffsetX.current + rollOffsetX;
        const headYVal = cy + lHeadOffsetY * 0.15 + danceOffsetY.current + jumpOffset.current + rollOffsetY - lHeadR * 1.15;

        const currentMoodVal = moodIndexRef.current;
        const currentEnergyVal = energyIndexRef.current;

        let emoText = "";
        let emoColor = "";

        if (currentEnergyVal < 35) {
          // Sleeping/Tired
          emoText = Math.random() < 0.65 ? "zZ" : "💤";
          emoColor = "#bae6fd";
        } else if (currentMoodVal >= 85 && currentEnergyVal >= 70) {
          // Ecstatic
          emoText = ["❤️", "🎵", "✨", "🔥"][Math.floor(Math.random() * 4)];
          emoColor = ["#f43f5e", "#c084fc", "#fbbf24", "#fda4af"][Math.floor(Math.random() * 4)];
        } else if (currentMoodVal < 35) {
          // Lonely / Sad
          emoText = ["💧", "💭", "🌧️", "💔"][Math.floor(Math.random() * 4)];
          emoColor = "#a5f3fc";
        } else if (skyWeatherRef.current === "snow" && !shieldActiveRef.current) {
          // Freezing shiver
          emoText = "❄️";
          emoColor = "#93c5fd";
        } else if (skyWeatherRef.current === "star-rain") {
          // Astro wonder
          emoText = "⭐";
          emoColor = "#fef08a";
        } else if (skyWeatherRef.current === "aurora") {
          // Spiritual / Meditative
          emoText = "✨";
          emoColor = "#a7f3d0";
        } else if (Math.random() < 0.15) {
          // Idle cozy notes
          emoText = "🎵";
          emoColor = "#e9d5ff";
        }

        if (emoText) {
          sparkParticles.current.push({
            x: headXVal + (Math.random() - 0.5) * 24,
            y: headYVal - 6,
            vx: (Math.random() - 0.5) * 0.45,
            vy: -0.7 - Math.random() * 0.55, // Rise up slowly
            color: emoColor,
            life: 1.2,
            size: 2 + Math.random() * 2.8, // Size modifier for text scale
            alpha: 0.95,
            text: emoText
          });
        }
      }

      frame++;
      animationRef.current = requestAnimationFrame(mainLoop);
    };

    mainLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [petConfig, equipped, renderMode, furDensity, imgElement]);

  // Real-time pet emotional state diagnoser and thought cloner
  const currentEmotionState = (() => {
    const curMood = moodIndex;
    const curEnergy = energyIndex;
    const curIntimacy = intimacyIndex;

    const isDog = species === "dog";
    const isCat = species === "cat";
    const isRabbit = species === "rabbit";
    const isHamster = species === "hamster";

    const isFreezing = skyWeather === "snow" && !shieldActive;
    
    if (isFreezing) {
      let t = "呜，大雪冻得全身冰凉...主人，星能护盾在哪呀 ❄️";
      if (isCat) t = "喵呜...本地时空有寒粒子流侵袭，冷得以至于我的像素毛发都蜷缩成一团了，渴望蹭蹭 🐾❄️";
      if (isDog) t = "汪汪！虽然仙女座暴风雪好冷，但为了陪伴主人，我可以用摇尾巴和原地旋转产生热量汪！🐾❄️";
      if (isRabbit) t = "咕，冰冷小雪花贴在人家的小耳朵上了。身体瑟瑟发抖，能不能启动一下星环暖流护盾降温呀 (๑•́ ₃ •̀๑)❄️";
      if (isHamster) t = "吱...手里私藏的安全葵花籽都冻硬啦！能不能捂捂人家，小爪子太冷了 ❄️🐹";
      return { status: "FREEZING", icon: "❄️", label: "寒冷发抖", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30", thought: t };
    }
    
    if (curEnergy < 35) {
      let t = "眼皮撑不住了...要在主人腿上香香睡一觉 💭";
      if (isCat) t = "喵哈...眼皮像被装了重力反向波一样沉重。我要蜷缩成一个暖洋洋的猫形星尘圈圈休眠啦...🐾💤";
      if (isDog) t = "呜汪...狂跑了整晚，现在汪电量只剩下1%了，梦里再陪主人去射手座折跃滑滑梯吧...💤🐾";
      if (isRabbit) t = "咕咪...长耳朵盖在眼皮上当遮光罩啦。在主人的温热手腕旁眯一下，梦里也要吃星光胡萝卜哦...💤🐇";
      if (isHamster) t = "吱吱...把鼓鼓囊囊的腮帮子枕在软木屑枕头上，小仓鼠要一键省电休眠啦，呼噜噜...💤🐹";
      return { status: "SLEEPING", icon: "💤", label: "瞌睡迷糊", color: "text-sky-300", bg: "bg-sky-500/10 border-sky-300/20", thought: t };
    }
    
    if (curMood >= 85 && curEnergy >= 70) {
      let t = "状态全满，元气爆表！开心得想去银河赛跑 🚀";
      if (isCat) t = "喔唷！喵喵星脉冲能量达到巅峰！感觉可以垂直窜上天花板，在星空里连续做三百个后空翻！✨🤩🐾";
      if (isDog) t = "汪哈哈！尾巴摇速已突破一万转！忠诚警报已经拉满！请下达揉头揉肚子命令，汪汪汪！🔥🐶";
      if (isRabbit) t = "兔子长耳接收器接收到狂欢蹦迪音波！开心得想在月球轨道上来一个兔子蹬腿，飞高高喽！🐇🎵";
      if (isHamster) t = "吱吱！全宇宙最强小跑轮动力全开！我已经转出了发光的微形星门幻影啦！仓鼠冲锋！🐹🎨";
      return { status: "ECSTATIC", icon: "😆", label: "狂欢雀跃", color: "text-pink-300", bg: "bg-pink-500/10 border-pink-500/30", thought: t };
    }
    
    if (curMood < 35) {
      let t = "主人，理理我嘛，我在角落有点孤孤单单的... (..•˘_˘•..)";
      if (isCat) t = "喵~ 总是把我遗忘在冷冰冰的后台数据流里。再不抱抱揉揉，我就要把你的主页代码踩乱咯 (｡•́︿•̀｡)🐾";
      if (isDog) t = "呜呜汪...主人眼睛只看着屏幕。我把湿漉漉的鼻子搁在你脚背上踩踩，不要不理我嘛汪...💔🐾";
      if (isRabbit) t = "咕...在星尘沙盒的角落默默啃了十个虚数圈圈。人家好寂寞，好像听到你的指尖耳语哦 (｡•́ - •̀｡)";
      if (isHamster) t = "吱...独自在木屑里转来转去，小松子突然就不香甜了。想要你用指针在我的小屁股后面温柔顺毛 💔🐹";
      return { status: "LONELY", icon: "😢", label: "寂寞留守", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", thought: t };
    }
    
    if (curIntimacy >= 75) {
      let t = "你身上的重力引力，是我在广阔黑夜里唯一的导航。💖";
      if (isCat) t = "喵～ 即使整个三维世界的显示屏都熄灭了，我的体表像素微光，也永远在星轨道旁为你引路。💖🐾";
      if (isDog) t = "汪！誓死效忠主人的代码城堡！只要主人一声Chime，我就立刻为你咬碎星流风暴！永远爱泥！💖🐶";
      if (isRabbit) t = "咕呜！蹭蹭主人的精致袖口。悄悄告诉你：主人的体温是这个星门两端最美味、最温暖的秘密哦 💓🐇";
      if (isHamster) t = "吱！把全宇宙最后一颗发光的星空大榛子献给主人！塞在腮帮子里热乎乎的，整颗心也是泥的～💖🐹";
      return { status: "LOVING", icon: "💖", label: "生死相依", color: "text-rose-300", bg: "bg-rose-500/10 border-rose-500/30", thought: t };
    }
    
    if (curMood >= 60) {
      let t = "现在的温度和心情指数刚刚好，暖洋洋的。";
      if (isCat) t = "呼噜呼噜... 现在的电磁辐射量刚好适宜晒一晒仙女座余晖，耳朵里像开出了柔软的蒲公英毛球。🐾";
      if (isDog) t = "汪！星空蔚蓝，数据流顺畅，一切都很安逸！让我们一会开启跳跃姿势甩一甩毛发吧，汪呜🐾";
      if (isRabbit) t = "咕。星系微风梳理着我的长耳朵和兔肚，舒服得想优雅地打个小哈欠。🐇🌟";
      if (isHamster) t = "吱吱～ 饱餐完刚添的星砂坚果。窝在主人的量子温控巢里，好惬意好舒服。🐹";
      return { status: "COZY", icon: "😊", label: "惬意悠闲", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30", thought: t };
    }
    
    // Default / idle
        // Default / idle
    let defT = "天体信号稳定。目前处于安静状态。";
    if (isCat) defT = "天体信号稳定。目前处于安静状态，猫耳警觉地搜寻着细微的量子波动。喵...";
    if (isDog) defT = "天体信号稳定。狗狗正安静地端详着跨维度的时空走廊，随时准备迎接呼唤，汪！";
    if (isRabbit) defT = "天体信号稳定。兔兔将前爪搭在星光上，静静看着你。";
    if (isHamster) defT = "天体信号稳定。正在凝视眼前的能量残影发呆。";
    return { status: "IDLE", icon: "😐", label: "平和悠长", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30", thought: defT };
  })();

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col md:flex-row relative z-10 p-0 md:p-4 gap-4 overflow-hidden">
      
      {/* 🔮 3D WEBGL HOLOGRAPHIC RENDERER CANVAS WRAPPER */}
      <div className="flex-1 md:w-2/3 bg-[#0a0715] border border-white/10 md:rounded-2xl flex flex-col overflow-hidden relative shadow-[0_0_40px_rgba(30,10,60,0.4)]" id="hologram-display-frame">
        
        {/* Top toolbar over canvas */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/40 z-20 backdrop-blur-md relative">
          <div className="flex items-center gap-2">
            <span className="md:hidden text-[10px] font-mono text-pink-300 ml-2 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
              单击唤醒
            </span>
          </div>

          {/* Engine toggle & Mode Selectors */}
          <div className="flex bg-black/45 p-0.5 rounded-lg border border-white/5 font-mono items-center">
            <span className="text-gray-500 font-mono tracking-widest uppercase ml-2 mr-2">Engine:</span>
            <button
              onClick={() => { setUseReal3D(false); playSound("click"); }}
              className={`px-2.5 py-1 rounded transition-colors uppercase ${!useReal3D ? "bg-pink-600 text-white font-bold shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              🌌 2D 核心
            </button>
            <button
              onClick={() => { setUseReal3D(true); playSound("click"); }}
              className={`px-2.5 py-1 rounded transition-colors uppercase ${useReal3D ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20" : "text-gray-400 hover:text-white"}`}
            >
              🔮 WebGL 高精实体
            </button>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-gray-500 font-mono tracking-widest uppercase mr-2">Styles:</span>
            {(!useReal3D ? (petConfig.model3d
              ? (["shaded", "wireframe", "rig", "xray", "model3d", "voxel", "realistic-stardust"] as RenderingMode[])
              : (["shaded", "wireframe", "rig", "xray", "voxel", "realistic-stardust"] as RenderingMode[])
            ) : [] as RenderingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setRenderMode(mode);
                  playSound("click");
                }}
                className={`px-2.5 py-1 rounded transition-colors uppercase ${
                  renderMode === mode
                    ? "bg-purple-600 text-white font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {mode === "shaded" ? "🎨 实体" : mode === "wireframe" ? "🕸️ 线框" : mode === "rig" ? "🦴 骨架" : mode === "xray" ? "⚡ 射线" : mode === "model3d" ? "🤖 3D全息" : mode === "voxel" ? "🧊 体素" : "💫 V2.0星尘写实"}
              </button>
            ))}
          </div>

          {/* Fur/Bone density sliders */}
          <div className="flex gap-4 items-center">
            {renderMode === "shaded" && (
              <div className="flex items-center gap-1.5 font-mono text-gray-400">
                <span>毛发细密:</span>
                <button
                  onClick={() => { setFurDensity(0); playSound("click"); }}
                  className={`px-1 rounded ${furDensity === 0 ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-white/5"}`}
                >
                  无
                </button>
                <button
                  onClick={() => { setFurDensity(120); playSound("click"); }}
                  className={`px-1 rounded ${furDensity === 120 ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5"}`}
                >
                  中
                </button>
                <button
                  onClick={() => { setFurDensity(360); playSound("click"); }}
                  className={`px-1 rounded ${furDensity === 360 ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5"}`}
                >
                  高(360线)
                </button>
              </div>
            )}
            <span className="text-gray-500">|</span>
            <div className="text-gray-400 font-mono flex items-center gap-1">
              <span>状态:</span>
              <span className="text-amber-400 font-medium">
                {isJumping.current ? "跳跃" : "呼吸漫舞"}
              </span>
            </div>
          </div>
        </div>

        {/* The interactive main drawing viewport */}
        <div className="relative flex justify-center bg-black overflow-hidden group">
          {/* 2D 核心渲染画布（含天气系统、情绪动画等旧版配件） */}
          <canvas
            ref={canvasRef}
            width={900}
            height={640}
            className="w-full h-[320px] cursor-pointer select-none border-b border-white/5"
            style={{ display: useReal3D ? "none" : "block" }}
          />

          {/* 3D WebGL 高精实体渲染画布 */}
          <div className="w-full h-[320px] relative" style={{ display: useReal3D ? "block" : "none" }}>
            <Canvas
              className="w-full h-full cursor-pointer select-none border-b border-white/5 transition-transform duration-100"
              id="rendering-canvas-viewport"
              camera={{ position: [0, 0, 5] }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 10]} intensity={1} />
              <Suspense fallback={
                <mesh>
                  <sphereGeometry args={[1, 32, 32]} />
                  <meshStandardMaterial color="red" wireframe={true} />
                </mesh>
              }>
                <AnimatedPetModel
                  energy={petConfig.companionEnergy ?? petConfig.statusEnergy ?? energyIndex}
                  isSleeping={petConfig.isSleeping ?? false}
                  mood={moodIndex}
                />
              </Suspense>
              <OrbitControls />
            </Canvas>
          </div>

          {/* Canvas cursor tracker focus point decoration */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* 1. Mood bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-pink-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-pink-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  🎭 心情值
                </span>
                <span className="font-mono text-pink-300 font-bold">{moodIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${moodIndex >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : moodIndex >= 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                  style={{ width: `${moodIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                <span>
                  {moodIndex >= 85 ? "😆 狂喜跃跃" : moodIndex >= 60 ? "😊 开心活跃" : moodIndex >= 30 ? "😐 平和怡然" : "😢 委屈无精打采"}
                </span>
              </div>
            </div>
            {/* 2. Hunger bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-orange-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-orange-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  🍖 饱食度
                </span>
                <span className="font-mono text-orange-300 font-bold">{hungerIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${hungerIndex >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : hungerIndex >= 20 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                  style={{ width: `${hungerIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                <span>{hungerIndex < 20 ? "⚠️ 极度饥饿" : hungerIndex < 60 ? "稍微饿肚子" : "吃得饱饱"}</span>
              </div>
            </div>
            {/* 3. Cleanliness bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-cyan-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-cyan-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  🫧 清洁度
                </span>
                <span className="font-mono text-cyan-300 font-bold">{cleanIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${cleanIndex >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : cleanIndex >= 20 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                  style={{ width: `${cleanIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                <span>{cleanIndex < 20 ? "⚠️ 灰尘满身" : cleanIndex < 60 ? "有点脏了" : "干干净净"}</span>
              </div>
            </div>
            {/* 4. Energy bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-amber-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  ⚡ 体力值
                </span>
                <span className="font-mono text-amber-300 font-bold">{energyIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${energyIndex >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : energyIndex >= 10 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                  style={{ width: `${energyIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                <span>{energyIndex < 10 ? "💤 想要睡觉" : energyIndex < 50 ? "稍微疲惫" : "精神抖擞"}</span>
              </div>
            </div>
          </div>

          {/* Canvas cursor tracker focus point decoration */}
          <div className="absolute inset-0 pointer-events-none border border-white/5" />

          {/* Interactive touch action helper label bottom-overlay */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/75 border border-purple-500/30 rounded-full text-[8.5px] font-mono text-purple-300 tracking-wider flex items-center gap-1.5 pointer-events-none shadow-lg">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
            <span>[单击不同部位 · 双击蹭镜头 · 左右滑动理毛 · 长按入睡 · 双指缩放]</span>
          </div>
        </div>

        {/* === 🎭 REAL-TIME PET EMOTION SYSTEM & ASTRO-WEATHER HUD === */}
        <div className="bg-[#0b0819] border-b border-white/5 p-3 flex flex-col gap-2 relative z-10" id="pet-emotion-weather-hud">
          {/* Weather News Broadcast Ticker */}
          <div className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-3 text-[9px] font-mono select-none overflow-hidden hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded text-[7.5px] uppercase font-bold tracking-wider animate-pulse">
                Broadcast 🛰️
              </span>
              <span className="text-gray-400 font-medium">星轨播报:</span>
            </div>
            
            {/* Pulsing fading text */}
            <div className="text-purple-200 truncate flex-1 uppercase tracking-wide font-sans animate-fade-in text-[9.5px]">
              {weatherAdviceText}
            </div>

            {/* Weather cycle countdown with nice pulsing indicator */}
            <div className="flex items-center gap-1.5 text-right shrink-0">
              {autoWeatherCycle ? (
                <>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <span className="text-cyan-300">
                    星天气更替 {timeToNextWeather}s
                  </span>
                </>
              ) : (
                <span className="text-gray-500">手动锁频中</span>
              )}

              {/* Toggling automatic wheel */}
              <button
                onClick={() => {
                  setAutoWeatherCycle(prev => !prev);
                  playSound("click");
                }}
                title={autoWeatherCycle ? "切换为手动气象控制模式" : "开启星区实时气象自动演化"}
                className={`ml-1 px-1.5 py-0.5 rounded border text-[8px] transition hover:bg-white/5 ${autoWeatherCycle ? "border-cyan-550/30 text-cyan-300 bg-cyan-500/5" : "border-gray-600 text-gray-400"}`}
              >
                {autoWeatherCycle ? "自动" : "手动"}
              </button>
            </div>
          </div>

          {/* Three columns metrics widgets */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Energy bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-amber-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  ⚡ 元气能量
                </span>
                <span className="font-mono text-amber-300 font-bold">{energyIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                  style={{ width: `${energyIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                <span>{energyIndex < 10 ? "💤 想要睡觉" : energyIndex < 35 ? "😵 虚弱乏力" : energyIndex < 70 ? "稍微疲惫" : "精神抖擞"}</span>
                <span>代谢慢行</span>
              </div>
            </div>

            {/* 2. Mood bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-pink-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-pink-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  🎭 心情指数
                </span>
                <span className="font-mono text-pink-300 font-bold">{moodIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                  style={{ width: `${moodIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                <span>
                  {moodIndex >= 85 ? "😆 狂喜跃跃" : moodIndex >= 60 ? "😊 开心活跃" : moodIndex >= 40 ? "😐 平和怡然" : moodIndex >= 22 ? "🙁 寂寞发呆" : "😢 委屈冰冷"}
                </span>
                <span>宜贴贴互动</span>
              </div>
            </div>

            {/* 3. Intimacy bar */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-2 flex flex-col gap-1 hover:border-red-500/25 transition duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-red-400 font-bold font-mono tracking-wider flex items-center gap-1">
                  ❤️ 羁绊亲密
                </span>
                <span className="font-mono text-red-300 font-bold">{intimacyIndex}%</span>
              </div>
              <div className="h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                  style={{ width: `${intimacyIndex}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                <span>{intimacyIndex < 30 ? "陌生疏浅" : intimacyIndex < 65 ? "默契契合" : "💖 生死相随"}</span>
                <span>耳语已解锁</span>
              </div>
            </div>
          </div>

          {/* 🧠 DYNAMIC ASTRO-THOUGHT CORE / 星灵即时心理测绘面板 */}
          <div className="bg-black/45 border border-white/5 rounded-xl p-2.5 flex flex-col gap-2 mt-1.5 hover:border-purple-500/30 transition-all duration-300 shadow-[0_4px_12px_rgba(11,8,25,0.7)]" id="astro-thought-core">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 font-bold font-mono tracking-wider text-purple-300 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>🧠 即时心理测绘 (Astro Cognitive Mind Map)</span>
              </div>
              <div className={`px-2 py-0.5 text-[8px] font-bold rounded border uppercase flex items-center gap-1 select-none shrink-0 ${currentEmotionState.bg} ${currentEmotionState.color}`}>
                <span>{currentEmotionState.icon}</span>
                <span>{currentEmotionState.label}</span>
              </div>
            </div>

            {/* Live active thoughts cloud container */}
            <div className="bg-[#06040d]/85 rounded-lg p-2 border border-white/[0.03] relative min-h-[46px] select-text">
              {/* Decorative pulse glow bar */}
              <div className="absolute top-0 left-0 right-0 h-[1.2px] bg-gradient-to-r from-transparent via-purple-500/25 to-transparent animate-pulse" />
              <p className="text-[10px] text-gray-300 font-sans leading-relaxed text-left selection:bg-purple-500/30">
                {currentEmotionState.thought}
              </p>
            </div>

            {/* Dynamic traits statistics listing */}
            <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 border-t border-white/[0.04] pt-2 mt-0.5 select-none">
              <span className="flex items-center gap-1">
                <span>🧬 星谱特质:</span>
                <span className="text-purple-400 font-semibold font-sans">
                  {species === "cat" ? "极度娇软喵 · 易撒娇" : species === "dog" ? "高元气欢汪 · 极度忠诚" : species === "rabbit" ? "软绵长耳兔 · 酷好甜食" : "塞帮屯粮鼠 · 钟爱松子"}
                </span>
              </span>
              <span>时空重力心率: <span className="text-cyan-400 font-bold font-sans animate-pulse">{energyIndex > 35 ? Math.round(58 + moodIndex * 0.22) : 22} bpm</span></span>
            </div>
          </div>
        </div>

        {/* 🎬 ACTIVE KINETIC GESTURES CONTROLLER */}
        <div className="px-4 py-2.5 bg-[#0e0a23]/60 border-b border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
              🐾 仿生写实 3D 写实动作指令集 (Kinetic Actions)
            </span>
            {activeGesture && (
              <span className="text-[9px] font-mono text-purple-300 animate-pulse uppercase">
                Performing [{activeGesture}]
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5 font-mono text-[9px]">
            <button
              onClick={() => triggerGesture("nod")}
              className={`py-1 rounded text-center transition-colors border ${activeGesture === "nod" ? "bg-purple-600/30 border-purple-450 text-white font-bold" : "bg-black/30 border-white/5 text-gray-300 hover:text-white"}`}
              id="btn-gesture-nod"
            >
              点头 (Nod)
            </button>
            <button
              onClick={() => triggerGesture("wag")}
              className={`py-1 rounded text-center transition-colors border ${activeGesture === "wag" ? "bg-purple-600/30 border-purple-450 text-white font-bold" : "bg-black/30 border-white/5 text-gray-300 hover:text-white"}`}
              id="btn-gesture-wag"
            >
              摇尾巴 (Wag)
            </button>
            <button
              onClick={() => triggerGesture("roll")}
              className={`py-1 rounded text-center transition-colors border ${activeGesture === "roll" ? "bg-purple-600/30 border-purple-450 text-white font-bold" : "bg-black/30 border-white/5 text-gray-300 hover:text-white"}`}
              id="btn-gesture-roll"
            >
              打滚儿 (Roll)
            </button>
            <button
              onClick={() => triggerGesture("jump")}
              className={`py-1 rounded text-center transition-colors border ${isJumping.current ? "bg-purple-600/30 border-purple-450 text-white font-bold" : "bg-black/30 border-white/5 text-gray-300 hover:text-white"}`}
              id="btn-gesture-jump"
            >
              跃起 (Jump)
            </button>
            <button
              onClick={() => triggerGesture("dance")}
              className={`py-1 rounded text-center transition-colors border ${activeGesture === "dance" ? "bg-purple-600/30 border-purple-450 text-white font-bold" : "bg-black/30 border-white/5 text-gray-300 hover:text-white"}`}
              id="btn-gesture-dance"
            >
              太空舞 (Dance)
            </button>
          </div>
        </div>

        {/* ✨ V2.7 PHOTOREALISTIC INTERACTION CONTROL PORTBOARD */}
        <div className="px-4 py-3 bg-[#130d2a]/70 border-b border-white/5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-pink-300 font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              💫 V2.7 2D超仿真 - 触控拟态及耳语控制台 (Tactile Control)
            </span>
            <span className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[8px] rounded uppercase">
              80% 真实照片度 + 20% 治愈星尘
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
            {/* Feeding snack buttons */}
            <button
              onClick={() => {
                if (touchEffect === "feed") {
                  setTouchEffect("idle");
                  setFeedingItem(null);
                  feedRecordCount.current = Math.max(0, feedRecordCount.current - 1);
                } else {
                  foodDropProgress.current = 0.0;
                  chewRemainingFrames.current = 0;
                  feedRecordCount.current += 1;

                  setTouchEffect("feed");
                  setFeedingItem("snack");
                  setActiveExp("happy");
                  playSound("sparkle");
                  triggerStardustExplosion();
                }
              }}
              className={`py-1.5 rounded border flex flex-col items-center justify-center gap-1 transition-all ${touchEffect === "feed" ? "bg-pink-600/30 border-pink-500 text-white font-bold shadow-[0_0_8px_rgba(236,72,153,0.3)]Scale-95" : "bg-black/35 border-white/10 text-gray-300 hover:border-pink-500/50"}`}
              id="btn-v27-feed"
            >
              <span className="text-sm">🐟</span>
              <span>逗玩互动</span>
            </button>

            {/* Hug shield button */}
            <button
              onClick={() => {
                setShieldActive(true);
                setTouchEffect("hug");
                setMoodIndex(prev => Math.min(100, prev + 15));
                setIntimacyIndex(prev => Math.min(100, prev + 8));
                playSound("sparkle");
                triggerStardustExplosion();
                setTimeout(() => {
                  setShieldActive(false);
                  setTouchEffect("idle");
                }, 4000);
              }}
              className={`py-1.5 rounded border flex flex-col items-center justify-center gap-1 transition-all ${touchEffect === "hug" ? "bg-cyan-600/30 border-cyan-500 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]Scale-95" : "bg-black/35 border-white/10 text-gray-300 hover:border-cyan-500/50"}`}
              id="btn-v27-hug"
            >
              <span className="text-sm">🛡️</span>
              <span>超凡守护星环</span>
            </button>

            {/* Farewell dissolve button */}
            <button
              onClick={() => {
                setTouchEffect("farewell");
                playSound("chime");
                triggerStardustExplosion();
                setTimeout(() => {
                  setTouchEffect("idle");
                }, 4500);
              }}
              className={`py-1.5 rounded border flex flex-col items-center justify-center gap-1 transition-all ${touchEffect === "farewell" ? "bg-amber-600/30 border-amber-500 text-white font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]Scale-95" : "bg-black/35 border-white/10 text-gray-300 hover:border-amber-500/50"}`}
              id="btn-v27-farewell"
            >
              <span className="text-sm">🌌</span>
              <span>身化星尘告别</span>
            </button>

            {/* AI voice whispering cloner sound */}
            <button
              onClick={() => {
                playSound("chime");
                setIntimacyIndex(prev => Math.min(100, prev + 10));
                setMoodIndex(prev => Math.min(100, prev + 6));
                const whispers = [
                  `主人，不要哭啦，天乐在多维星系里吃得饱跑得快呢！`,
                  `每次黑夜降临，我都把我的瞳孔放大，替你装满银河系的繁星。`,
                  `我会在你每次梦醒的时候，在天涯尽头的星门旁静静等你。`,
                  `即使我只剩下 2D 的像素光斑，我的毛发也依然永远向你波动。`
                ];
                const text = whispers[Math.floor(Math.random() * whispers.length)];
                setWhisperBubbleText(text);
                setWhisperTimer(180);
                setActiveExp("blinking");
                setTimeout(() => playSound("success"), 300);
                setTimeout(() => playSound("sparkle"), 650);
              }}
              className="py-1.5 rounded border bg-black/35 border-white/10 text-gray-300 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1 transition-all"
              id="btn-v27-ear-whisper"
            >
              <span className="text-sm">🎙️</span>
              <span>AI声纹耳语</span>
            </button>
          </div>

          {/* Micro-expression Selector Switchers */}
          <div className="flex gap-2.5 items-center justify-between text-[10px] bg-black/30 p-1.5 border border-white/5 rounded-xl">
            <span className="text-gray-400 text-[9px]">🎭 微表情写实演习:</span>
            <div className="flex gap-1">
              {(["blinking", "curious", "alert", "happy"] as const).map((exp) => (
                <button
                  key={exp}
                  onClick={() => {
                    setActiveExp(exp);
                    playSound("click");
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] tracking-wider transition-all uppercase ${activeExp === exp ? "bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold" : "text-gray-500 hover:text-gray-300"}`}
                  id={`btn-v27-exp-${exp}`}
                >
                  {exp === "blinking" ? "慢眨眼" : exp === "curious" ? "歪头杀" : exp === "alert" ? "警觉抽鼻" : "腮红开心"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🌌 DIURNAL ATMOSPHERE WEATHER PANEL */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 grid grid-cols-2 gap-4 text-[10px] font-mono">
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-400">🌕 昼夜时空天体系统</span>
            <div className="flex bg-black/45 p-0.5 rounded-lg border border-white/5">
              {(["day", "sunset", "night"] as CycleTimeType[]).map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setSkyTime(time);
                    playSound("click");
                  }}
                  className={`flex-1 py-1 text-center text-[9px] rounded uppercase ${skyTime === time ? "bg-cyan-500/20 border border-cyan-500/30 font-bold text-cyan-300 shadow" : "text-gray-400 hover:text-white"}`}
                >
                  {time === "day" ? "☀️ 清晓" : time === "sunset" ? "🌇 昏黄" : "🌌 幽夜"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-400">🌌 3D星云微粒天气</span>
            <div className="flex bg-black/45 p-0.5 rounded-lg border border-white/5">
              {(["clear", "star-rain", "aurora", "snow"] as WeatherType[]).map((weather) => (
                <button
                  key={weather}
                  onClick={() => {
                    setSkyWeather(weather);
                    playSound("sparkle");
                  }}
                  className={`flex-1 py-1 text-center text-[9px] rounded uppercase ${skyWeather === weather ? "bg-pink-500/20 border border-pink-500/30 font-bold text-pink-300 shadow" : "text-gray-400 hover:text-white"}`}
                >
                  {weather === "clear" ? "🌌 晴" : weather === "star-rain" ? "💫 陨" : weather === "aurora" ? "🟢 极" : "❄️ 霜"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Viewport Specs Footer Dashboard */}
        <div className="px-4 py-3 bg-[#080514]/90 text-[10px] grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-white/5 font-mono text-gray-400">
          <div className="flex flex-col">
            <span className="text-gray-500">骨架控制算法</span>
            <span className="text-white">正向运动学(FK) + 阻尼弹簧</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">智能拟态交互</span>
            <span className="text-white">眼底微粒瞳孔捕获追焦模型</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">衣饰物理反馈</span>
            <span className="text-white">Verlet 阻力链条(6节点)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">3D渲染通道</span>
            <span className="text-white">2.5D深度层合成缓冲区</span>
          </div>
        </div>
      </div>
    </div>
  );
}
