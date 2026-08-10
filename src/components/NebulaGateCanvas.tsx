import React, { useEffect, useRef, useState } from "react";
import { PetConfig, PetType } from "../types";
import { playSound } from "./AudioSynth";
import { Compass, Sparkles, Trophy, ChevronLeft, Image as ImageIcon, Info } from "lucide-react";
import { SCENE_DESIGNS } from "../data/sceneDesigns";
import { SceneInteractiveUI } from "./SceneInteractiveUI";

interface NebulaGateCanvasProps {
  userPet: PetConfig | null;
  onLoggedEvent: (log: string) => void;
  onGrantCoins: (amount: number) => void;
  isTaskAlreadyCompleted: boolean;
  onTaskCompleted: () => void;
}

const SCENE_META = [
  { id: "rose", name: "玫瑰星云公园", icon: "🌸", desc: "浪漫治愈的花卉主题公园，宠物社交聚集地。", bgGrad: ["#1c1445", "#3d226a", "#fad0a3"], particleColor: "#ff758c" },
  { id: "vega", name: "织女星小镇", icon: "🏘️", desc: "温馨的星空小镇，充满生活气息的治愈场景。", bgGrad: ["#080415", "#151b3d", "#233d54"], particleColor: "#ffd166" },
  { id: "comet", name: "彗星跑道", icon: "☄️", desc: "动感的竞速跑道，活泼的运动型场景。", bgGrad: ["#060312", "#110934", "#2c1566"], particleColor: "#00f3ff" },
  { id: "library", name: "银河图书馆", icon: "📚", desc: "安静神秘的知识殿堂，文艺治愈场景。", bgGrad: ["#04020a", "#120a2f", "#2e1c5b"], particleColor: "#e0aaff" },
  { id: "gemini", name: "双子座沙滩", icon: "🏖️", desc: "轻松活泼的双子星海滩，双倍快乐场景。", bgGrad: ["#1a0b2e", "#3a1c71", "#d76d77", "#ffaf7b"], particleColor: "#ffd166" },
  { id: "andromeda", name: "仙女座喷泉", icon: "⛲", desc: "梦幻华丽的中央喷泉广场，盛大治愈场景。", bgGrad: ["#09041a", "#1b1464", "#482673"], particleColor: "#00f3ff" },
  { id: "orion", name: "猎户座森林", icon: "🌲", desc: "神秘幽静的发光森林，自然治愈场景。", bgGrad: ["#021114", "#0a2e2d", "#155d4b"], particleColor: "#06d6a0" }
];

interface ExplorerPet {
  name: string;
  type: PetType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  primaryColor: string;
  size: number;
  isUser: boolean;
}

const BACKEND_BOTS: Array<Omit<ExplorerPet, "x" | "y" | "vx" | "vy" | "isUser">> = [
  { name: "斑斑", type: "狗", primaryColor: "#e07a5f", size: 10 },
  { name: "喵小九", type: "猫", primaryColor: "#ffd166", size: 9 },
  { name: "流星兔", type: "兔", primaryColor: "#a2d2ff", size: 9 },
  { name: "闪电青鸟", type: "鸟", primaryColor: "#560bad", size: 8 },
  { name: "波波熊", type: "其他", primaryColor: "#80ed99", size: 11 },
  { name: "千两小狗", type: "狗", primaryColor: "#f4f1de", size: 10 }
];

// --- High Fidelity Next-Gen Procedural Canvas Rendering Helpers ---
// Designed to simulate depth, volumetric lighting, and rich particle effects.

const drawStarfield = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, density: number = 100) => {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < density; i++) {
    const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
    const y = (Math.cos(i * 321.12) * 0.5 + 0.5) * h;
    const size = Math.abs(Math.sin(frame * 0.01 + i)) * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawVolumetricRays = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, frame: number, speed: number = 0.005) => {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  
  ctx.translate(cx, cy);
  ctx.rotate(frame * speed);
  for(let i=0; i<8; i++) {
    ctx.rotate((Math.PI * 2) / 8);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-radius*0.2, radius);
    ctx.lineTo(radius*0.2, radius);
    ctx.fill();
  }
  ctx.restore();
};

const drawRosePark = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  drawStarfield(ctx, w, h, frame, 50);
  
  // Distant glowing nebula
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const nebulaGrad = ctx.createRadialGradient(w*0.8, h*0.2, 10, w*0.8, h*0.2, 300);
  nebulaGrad.addColorStop(0, "rgba(255, 117, 140, 0.4)");
  nebulaGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(0,0,w,h);
  ctx.restore();

  // Winding glowing path with petal tiles
  ctx.beginPath();
  ctx.moveTo(w*0.2, h);
  ctx.bezierCurveTo(w*0.25, h*0.6, w*0.7, h*0.5, w*0.6, h*0.3);
  ctx.lineWidth = 60;
  ctx.strokeStyle = "rgba(255, 182, 193, 0.1)";
  ctx.lineCap = "round";
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(w*0.2, h);
  ctx.bezierCurveTo(w*0.25, h*0.6, w*0.7, h*0.5, w*0.6, h*0.3);
  ctx.lineWidth = 40;
  ctx.strokeStyle = "rgba(255, 200, 210, 0.2)";
  ctx.stroke();
  
  // Archway
  const ax = w*0.2, ay = h*0.4;
  ctx.strokeStyle = "#2d1b36";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.arc(ax, ay, 60, Math.PI, 0);
  ctx.stroke();
  
  // Archway vines & roses
  for(let i=0; i<12; i++) {
    const angle = Math.PI + (i/11)*Math.PI;
    const rx = ax + Math.cos(angle)*60;
    const ry = ay + Math.sin(angle)*60;
    ctx.fillStyle = "#1e3b2b";
    ctx.beginPath(); ctx.arc(rx, ry, 12, 0, Math.PI*2); ctx.fill(); // leaf
    
    // Rose
    ctx.shadowColor = "#ff4d6d";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath(); ctx.arc(rx, ry, 8 + Math.sin(frame*0.05 + i)*2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ff85a1";
    ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 3-tier Fountain
  const fx = w*0.6, fy = h*0.3;
  ctx.fillStyle = "#3a2e4d";
  ctx.beginPath(); ctx.ellipse(fx, fy+20, 80, 25, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(255, 190, 210, 0.6)";
  ctx.beginPath(); ctx.ellipse(fx, fy+15, 75, 20, 0, 0, Math.PI*2); ctx.fill(); // pool water
  
  ctx.fillStyle = "#4a3b5c";
  ctx.fillRect(fx-15, fy-30, 30, 50); // pillar
  ctx.beginPath(); ctx.ellipse(fx, fy-30, 50, 15, 0, 0, Math.PI*2); ctx.fill(); // tier 2
  
  ctx.fillRect(fx-8, fy-70, 16, 40); // pillar top
  ctx.beginPath(); ctx.ellipse(fx, fy-70, 30, 10, 0, 0, Math.PI*2); ctx.fill(); // tier 1
  
  // Fountain cascading water
  ctx.fillStyle = "rgba(255, 200, 220, 0.7)";
  ctx.shadowColor = "#ffb6c1";
  ctx.shadowBlur = 15;
  const spread = Math.sin(frame*0.1)*5;
  ctx.beginPath();
  ctx.moveTo(fx, fy-70);
  ctx.quadraticCurveTo(fx-40-spread, fy-50, fx-50, fy-30);
  ctx.lineTo(fx+50, fy-30);
  ctx.quadraticCurveTo(fx+40+spread, fy-50, fx, fy-70);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx-40, fy-30);
  ctx.quadraticCurveTo(fx-70-spread, fy-10, fx-80, fy+15);
  ctx.lineTo(fx+80, fy+15);
  ctx.quadraticCurveTo(fx+70+spread, fy-10, fx+40, fy-30);
  ctx.fill();
  ctx.shadowBlur = 0;
};

const drawVegaTown = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  drawStarfield(ctx, w, h, frame, 150);
  
  // Hillside terrain
  ctx.fillStyle = "#151b3d";
  ctx.beginPath();
  ctx.moveTo(0, h*0.5);
  ctx.quadraticCurveTo(w*0.5, h*0.4, w, h*0.6);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  
  // Cobblestone Path
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.beginPath();
  ctx.moveTo(w*0.4, h);
  ctx.lineTo(w*0.6, h);
  ctx.lineTo(w*0.55, h*0.5);
  ctx.lineTo(w*0.45, h*0.5);
  ctx.fill();

  // Lighthouse
  const lx = w*0.2, ly = h*0.3;
  ctx.fillStyle = "#1e2454";
  ctx.beginPath(); ctx.moveTo(lx, ly+150); ctx.lineTo(lx+20, ly); ctx.lineTo(lx+60, ly); ctx.lineTo(lx+80, ly+150); ctx.fill();
  ctx.fillStyle = "#3a4175";
  ctx.fillRect(lx+20, ly-20, 40, 20); // lamp room
  
  // Lighthouse beam
  drawVolumetricRays(ctx, lx+40, ly-10, 300, "rgba(255, 230, 150, 0.15)", frame, 0.02);

  // Cabins
  const drawCabin = (cx: number, cy: number, size: number) => {
    ctx.fillStyle = "rgba(40, 45, 90, 0.9)";
    ctx.shadowColor = "#3f37c9";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx, cy, size, Math.PI, 0); ctx.fill(); // dome
    ctx.shadowBlur = 0;
    ctx.fillRect(cx-size, cy, size*2, size*0.8); // body
    
    // Window
    ctx.fillStyle = `rgba(255, 220, 120, ${0.8 + Math.sin(frame*0.05 + cx)*0.2})`;
    ctx.shadowColor = "#ffb703";
    ctx.shadowBlur = 15;
    ctx.fillRect(cx-size*0.3, cy-size*0.2, size*0.6, size*0.6);
    ctx.shadowBlur = 0;
    
    // Window frame
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(cx-2, cy-size*0.2, 4, size*0.6);
    ctx.fillRect(cx-size*0.3, cy+size*0.1-2, size*0.6, 4);
  };
  
  drawCabin(w*0.7, h*0.5, 40);
  drawCabin(w*0.85, h*0.6, 50);
  drawCabin(w*0.5, h*0.45, 30);
  
  // Bakery
  drawCabin(w*0.25, h*0.7, 45);
  ctx.fillStyle = "#fb8500"; // sign
  ctx.fillRect(w*0.25-10, h*0.7-60, 20, 10);
};

const drawCometTrack = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  // Deep space background with motion blur lines
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  for(let i=0; i<30; i++) {
    const x = ((frame*5 + i*50) % w);
    const y = (Math.sin(i*999)*0.5+0.5)*h;
    ctx.fillRect(x, y, 40 + Math.random()*60, 1);
  }

  // Asteroids
  ctx.fillStyle = "#333";
  for(let i=0; i<8; i++) {
    const ax = (Math.cos(i*2.1 + frame*0.005) * w*0.4) + w/2;
    const ay = (Math.sin(i*2.1 + frame*0.005) * h*0.4) + h/2;
    ctx.beginPath();
    ctx.arc(ax, ay, 15 + (i%3)*5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(ax-5, ay-5, 4, 0, Math.PI*2); ctx.fill(); // crater
    ctx.fillStyle = "#333";
  }

  // Comet Track
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineWidth = 60;
  
  // Track gradient
  const trackGrad = ctx.createLinearGradient(0, 0, w, h);
  trackGrad.addColorStop(0, "rgba(0, 243, 255, 0.2)");
  trackGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
  trackGrad.addColorStop(1, "rgba(10, 10, 200, 0.2)");
  ctx.strokeStyle = trackGrad;
  
  ctx.beginPath();
  ctx.ellipse(w/2, h/2, w*0.35, h*0.25, 0, 0, Math.PI*2);
  ctx.stroke();
  
  // Inner glow line
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0, 243, 255, 0.8)";
  ctx.shadowColor = "#00f3ff";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.ellipse(w/2, h/2, w*0.35, h*0.25, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  // Boost Rings
  ctx.strokeStyle = "#fca311";
  ctx.lineWidth = 8;
  ctx.shadowColor = "#fca311";
  ctx.shadowBlur = 15;
  [0.1, 0.4, 0.6, 0.9].forEach(ang => {
    const angle = ang * Math.PI * 2;
    const rx = w/2 + Math.cos(angle)*w*0.35;
    const ry = h/2 + Math.sin(angle)*h*0.25;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 15, 40, angle, 0, Math.PI*2);
    ctx.stroke();
    // Inner ring
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(rx, ry, 10, 30, angle, 0, Math.PI*2);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#fca311";
  });
  ctx.shadowBlur = 0;

  // 3-2-1 sign
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 24px monospace";
  ctx.fillText("GO!", w/2 + w*0.35 - 20, h/2 - 30);
};

const drawLibrary = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  // Galaxy Ceiling
  drawVolumetricRays(ctx, w/2, h*0.1, 400, "rgba(100, 50, 255, 0.1)", frame, -0.01);

  // Towering Bookshelves (Spiral effect)
  ctx.fillStyle = "#1e132b";
  for(let layer=0; layer<6; layer++) {
    const radiusX = w*0.5 - layer*30;
    const radiusY = h*0.4 - layer*15;
    if (radiusX < 20) continue;
    
    ctx.strokeStyle = `rgba(60, 40, 90, ${0.3 + layer*0.1})`;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.ellipse(w/2, h*0.4, radiusX, radiusY, 0, Math.PI, 0); // back half
    ctx.stroke();
    
    // Draw books on this layer
    for(let b=0; b<20; b++) {
      const angle = Math.PI + (b/19)*Math.PI;
      const bx = w/2 + Math.cos(angle)*radiusX;
      const by = h*0.4 + Math.sin(angle)*radiusY - 10;
      ctx.fillStyle = `hsl(${(b*40)%360}, 60%, ${50 + layer*10}%)`;
      ctx.fillRect(bx, by, 4, 15);
    }
  }

  // Translucent Platform
  const floatY = Math.sin(frame*0.02)*10;
  ctx.fillStyle = "rgba(50, 30, 100, 0.4)";
  ctx.shadowColor = "#9d4edd";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.ellipse(w/2, h*0.7 + floatY, w*0.3, h*0.15, 0, 0, Math.PI*2);
  ctx.fill();
  
  // Glowing stairs
  ctx.fillStyle = "rgba(150, 100, 255, 0.6)";
  for(let i=0; i<5; i++) {
    ctx.fillRect(w/2 - 40 - i*20, h*0.75 + floatY + i*15, 30, 5);
  }

  // Wooden desk
  ctx.fillStyle = "#3c2a21";
  ctx.fillRect(w/2 - 60, h*0.65 + floatY, 120, 20);
  ctx.fillStyle = "#221510";
  ctx.fillRect(w/2 - 50, h*0.67 + floatY, 100, 40);

  // Open Book
  ctx.fillStyle = "#f4e2d8";
  ctx.beginPath();
  ctx.moveTo(w/2, h*0.63 + floatY);
  ctx.lineTo(w/2 - 20, h*0.6 + floatY);
  ctx.lineTo(w/2 - 20, h*0.65 + floatY);
  ctx.lineTo(w/2, h*0.68 + floatY);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w/2, h*0.63 + floatY);
  ctx.lineTo(w/2 + 20, h*0.6 + floatY);
  ctx.lineTo(w/2 + 20, h*0.65 + floatY);
  ctx.lineTo(w/2, h*0.68 + floatY);
  ctx.fill();

  // Candle
  ctx.fillStyle = "#fff";
  ctx.fillRect(w/2 + 40, h*0.6 + floatY, 6, 15);
  ctx.fillStyle = `rgba(255, 150, 50, ${0.7 + Math.sin(frame*0.2)*0.3})`;
  ctx.beginPath(); ctx.arc(w/2 + 43, h*0.58 + floatY, 4, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
};

const drawGeminiBeach = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  // Symmetrical Suns
  ctx.fillStyle = "rgba(255, 120, 120, 0.8)";
  ctx.shadowColor = "#ff7878";
  ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(w*0.3, h*0.2, 30, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(255, 180, 100, 0.8)";
  ctx.shadowColor = "#ffb464";
  ctx.beginPath(); ctx.arc(w*0.7, h*0.2, 30, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Purple Ocean
  ctx.fillStyle = "#4a235a";
  ctx.fillRect(0, h*0.35, w, h*0.3);
  
  // Waves
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  const waveOff = Math.sin(frame*0.03)*15;
  ctx.beginPath();
  ctx.moveTo(0, h*0.5 + waveOff);
  ctx.bezierCurveTo(w*0.25, h*0.55 + waveOff, w*0.75, h*0.45 + waveOff, w, h*0.5 + waveOff);
  ctx.lineTo(w, h*0.65);
  ctx.lineTo(0, h*0.65);
  ctx.fill();
  
  // Shoreline foam
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, h*0.5 + waveOff);
  ctx.bezierCurveTo(w*0.25, h*0.55 + waveOff, w*0.75, h*0.45 + waveOff, w, h*0.5 + waveOff);
  ctx.stroke();

  // Symmetrical Islands
  const drawIsland = (cx: number, cy: number, flip: boolean) => {
    ctx.fillStyle = "#ffd166"; // sand
    ctx.beginPath(); ctx.ellipse(cx, cy, 60, 20, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#06d6a0"; // grass
    ctx.beginPath(); ctx.ellipse(cx, cy-5, 45, 15, 0, 0, Math.PI*2); ctx.fill();
    
    // Palm tree
    ctx.strokeStyle = "#9c6644";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy-10);
    const lean = flip ? -30 : 30;
    ctx.quadraticCurveTo(cx+lean, cy-40, cx+lean*1.5, cy-70);
    ctx.stroke();
    // Leaves
    ctx.fillStyle = "#2a9d8f";
    const tx = cx+lean*1.5, ty = cy-70;
    for(let i=0; i<4; i++) {
      ctx.beginPath();
      ctx.ellipse(tx, ty, 20, 5, (i*Math.PI)/4, 0, Math.PI*2);
      ctx.fill();
    }
  };
  drawIsland(w*0.2, h*0.4, true);
  drawIsland(w*0.8, h*0.4, false);

  // Sand dunes and shells
  ctx.fillStyle = "#ffb703"; // Golden sand
  ctx.beginPath();
  ctx.moveTo(0, h*0.6);
  ctx.quadraticCurveTo(w*0.5, h*0.5, w, h*0.6);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Beach umbrella
  const ux = w*0.5, uy = h*0.7;
  ctx.fillStyle = "#e63946";
  ctx.beginPath(); ctx.arc(ux, uy, 40, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#f1faee";
  ctx.beginPath(); ctx.arc(ux, uy, 40, Math.PI, 0); ctx.fill(); // wait, stripes:
  ctx.fillStyle = "#e63946";
  ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 40, Math.PI, Math.PI*1.2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 40, Math.PI*1.4, Math.PI*1.6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 40, Math.PI*1.8, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = "#d4a373";
  ctx.fillRect(ux-2, uy, 4, 60); // pole
};

const drawAndromedaFountain = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  drawStarfield(ctx, w, h, frame, 200);

  // Andromeda Galaxy background
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(w*0.8, h*0.2);
  ctx.rotate(frame*0.001);
  const galGrad = ctx.createRadialGradient(0,0, 10, 0,0, 200);
  galGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  galGrad.addColorStop(0.2, "rgba(100, 150, 255, 0.4)");
  galGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = galGrad;
  ctx.scale(2, 0.5);
  ctx.beginPath(); ctx.arc(0,0, 200, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Plaza mosaic
  ctx.fillStyle = "#1b263b";
  ctx.beginPath(); ctx.ellipse(w/2, h*0.7, w*0.45, h*0.25, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
  ctx.lineWidth = 2;
  for(let i=0; i<12; i++) {
    const angle = (i/12)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(w/2, h*0.7);
    ctx.lineTo(w/2 + Math.cos(angle)*w*0.45, h*0.7 + Math.sin(angle)*h*0.25);
    ctx.stroke();
  }

  // 12 Classical Pillars
  ctx.fillStyle = "#415a77";
  for(let i=0; i<12; i++) {
    if (i > 3 && i < 9) continue; // skip back pillars to not cover fountain
    const angle = (i/12)*Math.PI*2;
    const px = w/2 + Math.cos(angle)*w*0.4;
    const py = h*0.7 + Math.sin(angle)*h*0.2 - 20;
    
    ctx.fillRect(px-8, py-80, 16, 80); // pillar
    ctx.fillStyle = "#e0e1dd";
    ctx.fillRect(px-12, py-85, 24, 10); // top
    
    // Eternal fire
    ctx.fillStyle = `rgba(0, 243, 255, ${0.7 + Math.sin(frame*0.1 + i)*0.3})`;
    ctx.shadowColor = "#00f3ff";
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(px, py-95, 8, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#415a77";
  }

  // Epic 4-tier Fountain
  const fx = w/2, fy = h*0.65;
  ctx.fillStyle = "#0d1b2a";
  ctx.beginPath(); ctx.ellipse(fx, fy+20, 100, 30, 0, 0, Math.PI*2); ctx.fill(); // pool
  ctx.fillStyle = "rgba(100, 150, 255, 0.4)";
  ctx.beginPath(); ctx.ellipse(fx, fy+15, 95, 25, 0, 0, Math.PI*2); ctx.fill(); // water
  
  const tiers = [
    {y: fy-20, r: 70}, {y: fy-60, r: 50}, {y: fy-100, r: 30}, {y: fy-130, r: 15}
  ];
  
  ctx.fillStyle = "#1b263b";
  tiers.forEach((t, i) => {
    ctx.fillRect(fx-10, t.y, 20, i === 0 ? 40 : 40); // stem
    ctx.beginPath(); ctx.ellipse(fx, t.y, t.r, t.r*0.25, 0, 0, Math.PI*2); ctx.fill(); // bowl
  });
  
  // Cascading water
  ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
  ctx.shadowColor = "#00f3ff";
  ctx.shadowBlur = 10;
  for(let i=1; i<tiers.length; i++) {
    const t0 = tiers[i];
    const t1 = tiers[i-1];
    ctx.beginPath();
    ctx.moveTo(fx-t0.r+5, t0.y);
    ctx.quadraticCurveTo(fx-t1.r-10, t0.y+20, fx-t1.r+10, t1.y);
    ctx.lineTo(fx+t1.r-10, t1.y);
    ctx.quadraticCurveTo(fx+t1.r+10, t0.y+20, fx+t0.r-5, t0.y);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
};

const drawOrionForest = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
  // Orion belt in sky
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(w*0.7, h*0.1, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(w*0.75, h*0.12, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(w*0.8, h*0.14, 3, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Bioluminescent Trees
  const drawBiolTree = (tx: number, ty: number, height: number, width: number) => {
    ctx.fillStyle = "#10002b"; // deep purple trunk
    ctx.fillRect(tx - width/2, ty - height, width, height);
    // Roots
    ctx.beginPath(); ctx.moveTo(tx - width/2, ty); ctx.lineTo(tx - width*1.5, ty+10); ctx.lineTo(tx, ty-10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx + width/2, ty); ctx.lineTo(tx + width*1.5, ty+10); ctx.lineTo(tx, ty-10); ctx.fill();
    
    // Glowing cyan canopy
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const gradient = ctx.createRadialGradient(tx, ty - height, 20, tx, ty - height, height*0.8);
    gradient.addColorStop(0, "rgba(0, 255, 200, 0.9)");
    gradient.addColorStop(0.5, "rgba(0, 150, 150, 0.5)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(tx, ty - height, height*0.8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  };
  
  drawBiolTree(w*0.15, h*0.8, 220, 30);
  drawBiolTree(w*0.85, h*0.9, 250, 40);
  drawBiolTree(w*0.5, h*0.5, 150, 20); // background tree

  // Tree hollow on right tree
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(w*0.85, h*0.9 - 30, 15, 25, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(0, 150, 255, 0.6)";
  ctx.shadowColor = "#0096ff";
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.ellipse(w*0.85, h*0.9 - 30, 10, 20, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Moss and Fog on ground
  const fogGrad = ctx.createLinearGradient(0, h*0.7, 0, h);
  fogGrad.addColorStop(0, "rgba(0, 255, 200, 0)");
  fogGrad.addColorStop(1, "rgba(0, 255, 200, 0.2)");
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, h*0.6, w, h*0.4);

  // Mushroom path
  for(let i=0; i<15; i++) {
    const mx = w*0.3 + (Math.sin(i*0.5)*w*0.1);
    const my = h*0.6 + i*15;
    
    // Stem
    ctx.fillStyle = "#ddd";
    ctx.fillRect(mx-3, my-10, 6, 10);
    // Cap
    const colors = ["#ff0a54", "#ff7096", "#8338ec", "#3a0ca3"];
    ctx.fillStyle = colors[i % colors.length];
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(mx, my-10, 12 + (i%3)*2, Math.PI, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

const RENDER_FNS: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => void> = {
  rose: drawRosePark,
  vega: drawVegaTown,
  comet: drawCometTrack,
  library: drawLibrary,
  gemini: drawGeminiBeach,
  andromeda: drawAndromedaFountain,
  orion: drawOrionForest
};

const NebulaGateCanvas: React.FC<NebulaGateCanvasProps> = ({
  userPet,
  onLoggedEvent,
  onGrantCoins,
  isTaskAlreadyCompleted,
  onTaskCompleted
}) => {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [viewingPromptInfo, setViewingPromptInfo] = useState<string | null>(null);
  
  return (
    <div className="space-y-4" id="nebula-gate-explore-panel">
      {activeSceneId ? (
        <div>
          <button onClick={() => setActiveSceneId(null)} className="mb-3 text-[11px] text-indigo-400 flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2 py-1.5 rounded-lg border border-white/10 shadow-md backdrop-blur">
            <ChevronLeft className="w-3 h-3" /> 返回星尘之门·七大地标
          </button>
          <SceneRenderer 
            sceneId={activeSceneId} 
            userPet={userPet} 
            onLoggedEvent={onLoggedEvent} 
            onTaskCompleted={onTaskCompleted}
            isTaskAlreadyCompleted={isTaskAlreadyCompleted}
            onGrantCoins={onGrantCoins}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" /> 星云之门 - 七大沉浸式地标
            </h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed font-light">
              采用「3D 次世代级星尘治愈写实风」美术设定，80%精细建模+20%发光粒子。请选择一个场景让星宠开始自主游历。精心设计的程序化渲染引擎为你呈现最绚烂的治愈星空与丁达尔体积光晕。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCENE_META.map((scene) => (
              <div 
                key={scene.id} 
                className="bg-black/40 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-400/60 hover:bg-indigo-900/30 transition-all duration-300 group flex flex-col justify-between shadow-lg relative overflow-hidden"
                onClick={() => setActiveSceneId(scene.id)}
              >
                <div 
                  className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${scene.bgGrad[0]}, ${scene.bgGrad[1]})` }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{scene.icon}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setViewingPromptInfo(scene.id); }}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors"
                      title="查看场景生成提示词与美术设定"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 mb-1.5 transition-colors">{scene.name}</h4>
                  <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed opacity-80">{scene.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt Viewer Modal */}
          {viewingPromptInfo && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setViewingPromptInfo(null)}>
              <div className="bg-[#0f0a25] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(123,97,255,0.15)]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    【{SCENE_META.find(s => s.id === viewingPromptInfo)?.name}】美术设定与提示词
                  </h3>
                  <button onClick={() => setViewingPromptInfo(null)} className="text-gray-400 hover:text-white transition-colors">×</button>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 max-h-64 overflow-y-auto text-[11px] text-indigo-200 font-mono whitespace-pre-wrap leading-relaxed select-all custom-scrollbar">
                  [ 场景风格规范 ]
                  {SCENE_DESIGNS[viewingPromptInfo]?.overview}

                  [ 景深分层 ]
                  {SCENE_DESIGNS[viewingPromptInfo]?.layers.join("\n")}

                  [ 建模要求 ]
                  {SCENE_DESIGNS[viewingPromptInfo]?.modeling.map(m => `- ${m.title}: ${m.desc.join(", ")}`).join("\n")}

                  [ 提示词 (Midjourney / Astrocade) ]
                  {SCENE_DESIGNS[viewingPromptInfo]?.prompt}
                </div>
                <p className="text-[10px] text-slate-500 mt-4 text-center tracking-wider uppercase">点击外部关闭 • 提示词严格遵循 3D次世代级写实风 设定</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SceneRenderer = ({ sceneId, userPet, onLoggedEvent, onTaskCompleted, isTaskAlreadyCompleted, onGrantCoins }: { sceneId: string, userPet: PetConfig | null, onLoggedEvent: (log: string) => void, onTaskCompleted: () => void, isTaskAlreadyCompleted: boolean, onGrantCoins: (a:number)=>void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneMeta = SCENE_META.find(s => s.id === sceneId)!;
  const sceneDesign = SCENE_DESIGNS[sceneId];
  
  const [internalLogs, setInternalLogs] = useState<string[]>([]);
  const petsRef = useRef<ExplorerPet[]>([]);
  const [adventureSeconds, setAdventureSeconds] = useState(0);
  const [adventureDone, setAdventureDone] = useState(isTaskAlreadyCompleted);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const fullMsg = `[${time}] ${msg}`;
    setInternalLogs(prev => [fullMsg, ...prev].slice(0, 50));
    onLoggedEvent(fullMsg);
  };

  useEffect(() => {
    let list: ExplorerPet[] = [];
    if (userPet) {
      list.push({
        name: userPet.name, type: userPet.type, x: 350, y: 200,
        vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
        primaryColor: userPet.primaryColor, size: 11, isUser: true
      });
    }
    BACKEND_BOTS.forEach(bot => {
      list.push({
        ...bot, x: 50 + Math.random() * 600, y: 50 + Math.random() * 320,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, isUser: false
      });
    });
    petsRef.current = list;
    addLog(`✨ 欢迎来到【${sceneMeta.name}】！星宠们已降落，开始自由探索。`);
  }, [userPet, sceneMeta]);

  useEffect(() => {
    if (adventureDone) return;
    const timer = setInterval(() => {
      setAdventureSeconds(prev => {
        if (prev >= 29) {
          clearInterval(timer);
          setAdventureDone(true);
          onTaskCompleted();
          onGrantCoins(20);
          addLog("🏆 达成星云漫步30秒成就！奖励 20 星尘币！");
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [adventureDone, onTaskCompleted, onGrantCoins]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    
    // Density scaling based on scene
    const isHighDensity = sceneId === "andromeda";
    const particleCount = isHighDensity ? 120 : 60;
    
    const particles = Array.from({length: particleCount}, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5, vy: Math.random() * 0.5 + 0.2,
      size: Math.random() * 3 + 1,
      seed: Math.random() * 100
    }));
    
    const collisionCooldowns: Record<string, number> = {};
    let req: number;

    const updateMap = () => {
      // 1. Draw Background Gradient
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, sceneMeta.bgGrad[0]);
      grad.addColorStop(0.5, sceneMeta.bgGrad[1]);
      grad.addColorStop(1, sceneMeta.bgGrad[2] || sceneMeta.bgGrad[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Procedural Scene Environment
      if (RENDER_FNS[sceneId]) {
        ctx.save();
        RENDER_FNS[sceneId](ctx, canvas.width, canvas.height, frame);
        ctx.restore();
      }

      // 3. Draw Particles (Stardust)
      ctx.fillStyle = sceneMeta.particleColor;
      particles.forEach(p => {
        p.x += p.vx; p.y -= p.vy; // move upwards as requested by user (0.5-2cm/s upward movement)
        
        // Float logic for fireflies or bugs
        if (sceneId === "orion" || sceneId === "library") {
           p.x += Math.sin(frame*0.05 + p.seed)*2;
           p.y += Math.cos(frame*0.03 + p.seed)*2;
        }
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        
        ctx.globalAlpha = Math.sin(frame * 0.02 + p.seed) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Add glow
        ctx.shadowColor = sceneMeta.particleColor;
        ctx.shadowBlur = 10; // Volumetric particle glow
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // 4. Draw Pets
      const pets = petsRef.current;
      pets.forEach(pet => {
        pet.x += pet.vx;
        pet.y += pet.vy;
        if (pet.x < 20 || pet.x > canvas.width - 20) pet.vx *= -1;
        if (pet.y < 20 || pet.y > canvas.height - 20) pet.vy *= -1;
        
        // Randomly change direction occasionally
        if (Math.random() < 0.01) {
          pet.vx += (Math.random() - 0.5);
          pet.vy += (Math.random() - 0.5);
          const speed = Math.hypot(pet.vx, pet.vy);
          if (speed > 2) {
             pet.vx = (pet.vx / speed) * 1.5;
             pet.vy = (pet.vy / speed) * 1.5;
          }
        }
        
        // Scene specific logic for pets
        if (sceneId === "comet") {
          // Force them to run around in an ellipse loosely
          const cx = canvas.width/2;
          const cy = canvas.height/2;
          const angle = Math.atan2(pet.y - cy, pet.x - cx);
          pet.vx = -Math.sin(angle) * 2.5;
          pet.vy = Math.cos(angle) * 2.5;
        }
        
        // Occasional scene interaction log using SCENE_DESIGNS data
        if (pet.isUser && Math.random() < 0.002) {
          const behaviors = sceneDesign.petBehaviors;
          if (behaviors && behaviors.length > 0) {
            const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
            addLog(`【${pet.name}】在${randomBehavior.location}，${randomBehavior.action}。${randomBehavior.effect !== '无' ? `(触发：${randomBehavior.effect})` : ''}`);
          }
        }

        const radius = pet.size;
        ctx.save();
        ctx.shadowColor = pet.primaryColor;
        ctx.shadowBlur = pet.isUser ? 20 : 8; // volumetric glow on pets
        ctx.fillStyle = pet.primaryColor;
        const motionY = Math.abs(Math.sin((frame + pet.x) * 0.1)) * 3;
        
        // Simple Body
        ctx.beginPath();
        ctx.arc(pet.x, pet.y + motionY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 0;
        ctx.fillRect(pet.x - 3.5, pet.y + motionY - 2, 2, 2.5);
        ctx.fillRect(pet.x + 1.5, pet.y + motionY - 2, 2, 2.5);
        
        ctx.fillStyle = pet.isUser ? "#ffd166" : "rgba(255,255,255,0.7)";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pet.name, pet.x, pet.y + 16 + motionY);
        ctx.restore();
      });

      // 5. Collisions
      for (let i = 0; i < pets.length; i++) {
        for (let j = i + 1; j < pets.length; j++) {
          const p1 = pets[i];
          const p2 = pets[j];
          if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 26) {
            const key = `${p1.name}-${p2.name}`;
            const cd = collisionCooldowns[key] || 0;
            if (frame > cd) {
              collisionCooldowns[key] = frame + 300;
              ctx.beginPath();
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 3;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.shadowColor = "#fff";
              ctx.shadowBlur = 15;
              ctx.stroke();
              ctx.shadowBlur = 0;
              
              if (p1.isUser || p2.isUser) {
                const other = p1.isUser ? p2 : p1;
                addLog(`碰擦相遇！与【${other.name}】温柔地交叠，触发光带特效！`);
                playSound("chime");
              }
            }
          }
        }
      }

      frame++;
      req = requestAnimationFrame(updateMap);
    };
    updateMap();
    return () => cancelAnimationFrame(req);
  }, [sceneMeta, sceneId, sceneDesign]);

  return (
    <div className="space-y-4">
      {/* 30 seconds indicator */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-6 h-6 animate-spin-slow" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1">
              <span>探索进度：星云漫步 30s 挑战</span>
              {adventureDone && <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-md" />}
            </div>
            <p className="text-[11px] text-indigo-200/60">
              在【{sceneMeta.name}】看星寻星，沉浸式感受3D高精场景与星尘粒子光影
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-sm font-mono text-indigo-300 w-16 text-right font-bold">
            {adventureSeconds}s / 30s
          </div>
          <div className="relative w-full md:w-48 h-3 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-1000 shadow-[0_0_10px_rgba(167,139,250,0.5)]"
              style={{ width: `${(adventureSeconds / 30) * 100}%` }}
            />
          </div>
          <span className="text-xs p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-300 font-bold">
            {adventureDone ? "已奖" : "+20 币"}
          </span>
        </div>
      </div>

      <div className="relative flex justify-center group overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full h-auto bg-[#060312] rounded-2xl"
        />

        <div className="absolute top-4 left-4 bg-black/60 border border-slate-700/50 rounded-lg p-2.5 text-xs text-amber-300 pointer-events-none select-none flex items-center gap-2 backdrop-blur-md hidden sm:flex">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium tracking-wide">星门多端漫游：同屏 6人</span>
        </div>
        <div className="absolute bottom-4 right-4 bg-black/60 border border-slate-700/50 rounded-lg p-2.5 text-[10px] text-white/50 pointer-events-none select-none flex items-center gap-2 backdrop-blur-md hidden sm:flex">
           <ImageIcon className="w-3.5 h-3.5" />
           <span>{sceneMeta.name} - 次世代高精 2D 拟真光影引擎</span>
        </div>
      </div>

      {/* Deep Interactive UI Panel */}
      <SceneInteractiveUI sceneId={sceneId} addLog={addLog} onGrantCoins={onGrantCoins} />

      <div className="bg-slate-950/70 border border-white/10 rounded-xl p-5 flex flex-col h-44 shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <h4 className="text-xs uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            【{sceneMeta.name}】实时奇遇记
          </h4>
          <span className="text-[9px] text-indigo-500/50 font-mono tracking-widest">ASTRO SCENE EVENT LOG</span>
        </div>
        <div className="overflow-y-auto flex-1 space-y-2.5 pr-2 custom-scrollbar text-xs">
          {internalLogs.map((log, idx) => (
            <div key={idx} className="font-mono text-indigo-100/80 leading-relaxed border-b border-white/5 pb-2 last:border-0 pl-3 border-l-2 border-indigo-500/40">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NebulaGateCanvas;
