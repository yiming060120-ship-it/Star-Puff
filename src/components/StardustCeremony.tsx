import React, { useState, useRef, useEffect } from "react";
import { PetConfig, PetType } from "../types";
import { Sparkles, Upload, Flame, Paintbrush, Heart, Music, Check } from "lucide-react";
import { motion } from "motion/react";

interface StardustCeremonyProps {
  onComplete: (config: PetConfig) => void;
  playSparkleSound?: () => void;
}

const PRESET_PETS = [
  {
    name: "小团子",
    type: "狗" as PetType,
    breed: "萨摩耶",
    colors: ["#ffffff", "#f0e6ef", "#a3b18a", "#000000"],
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "星蒲",
    type: "猫" as PetType,
    breed: "英短乳白",
    colors: ["#fad0a3", "#ffffff", "#8fa4b3", "#ff8ba7"],
    img: "https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "跳跳",
    type: "兔" as PetType,
    breed: "侏儒兔",
    colors: ["#deb887", "#f5deb3", "#fff0f5", "#a9a9a9"],
    img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "豆豆",
    type: "鸟" as PetType,
    breed: "玄凤鹦鹉",
    colors: ["#ffea00", "#ffffff", "#ff9100", "#757575"],
    img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=200",
  },
];

export default function StardustCeremony({ onComplete, playSparkleSound }: StardustCeremonyProps) {
  const [step, setStep] = useState<"info" | "analyze" | "constellation" | "crystallize">("info");
  
  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<PetType>("狗");
  const [ownerName, setOwnerName] = useState("");
  const [breed, setBreed] = useState("");
  const [passingDate, setPassingDate] = useState("2025-04-12");
  const [hobbies, setHobbies] = useState("追逐星光, 捕蝴蝶, 窗台晒太阳");
  const [favoriteThings, setFavoriteThings] = useState("小鱼干罐头, 主人的摸摸, 暖暖的枕头");
  const [selectedPhoto, setSelectedPhoto] = useState<string>(PRESET_PETS[0].img);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Custom colors derived from asset upload
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#d8f3dc");
  const [matrixHex, setMatrixHex] = useState<string[]>(["#ffffff", "#d8f3dc", "#95d5b2", "#1b4332"]);

  // Constellation Game state
  const [connectedPoints, setConnectedPoints] = useState<number[]>([]);
  const constellationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Crystallization state
  const crystallizationRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto analyzer effect
  const handlePhotoSelect = (imgUrl: string, presetColors?: string[]) => {
    setSelectedPhoto(imgUrl);
    if (presetColors) {
      setPrimaryColor(presetColors[0]);
      setSecondaryColor(presetColors[1] || colorsList[1]);
      setMatrixHex(presetColors);
    }
  };

  const colorsList = ["#ffccd5", "#ffb3c1", "#ff85a1", "#f9bec7", "#fbc3bc", "#e8e8e4", "#d8e2dc", "#b6e2d3", "#faedcd", "#a8dadc", "#d8f3dc", "#00b4d8"];

  // Analyze Step simulation
  const startAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      // Simulate color selection based on pet choices if not preset
      if (!PRESET_PETS.some(p => p.img === selectedPhoto)) {
        const list = ["猫", "兔", "鸟", "狗"];
        const randSeed = name.charCodeAt(0) || 12;
        const index = randSeed % colorsList.length;
        const colorC = colorsList[index];
        const colorD = colorsList[(index + 3) % colorsList.length];
        setPrimaryColor(colorC);
        setSecondaryColor(colorD);
        setMatrixHex([colorC, colorD, "#ffffff", "#4a4e69"]);
      }
      setAnalyzing(false);
      setStep("analyze");
      if (playSparkleSound) playSparkleSound();
    }, 1800);
  };

  // Base upload trigger
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedPhoto(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Puzzle / Constellation Game Loop
  const constellationStars = [
    { id: 0, x: 150, y: 150, connected: false },
    { id: 1, x: 250, y: 110, connected: false },
    { id: 2, x: 350, y: 150, connected: false },
    { id: 3, x: 420, y: 250, connected: false },
    { id: 4, x: 300, y: 320, connected: false },
    { id: 5, x: 200, y: 320, connected: false },
    { id: 6, x: 80, y: 250, connected: false },
    { id: 7, x: 250, y: 220, connected: false }, // Center
  ];

  const handleConstellationClick = (idx: number) => {
    if (playSparkleSound) playSparkleSound();
    if (connectedPoints.length === 0) {
      setConnectedPoints([idx]);
    } else {
      if (connectedPoints.includes(idx)) {
        // Unlink or restart
        setConnectedPoints([]);
      } else {
        setConnectedPoints([...connectedPoints, idx]);
      }
    }
  };

  // Redraw Constellation Grid
  useEffect(() => {
    if (step === "constellation" && constellationCanvasRef.current) {
      const ctx = constellationCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 500, 400);
        
        // Draw space backgrounds
        ctx.fillStyle = "rgba(12, 6, 26, 0.4)";
        ctx.fillRect(0, 0, 500, 400);

        // Draw faint guide lines matching pet shape (e.g., puppy outline)
        ctx.beginPath();
        ctx.strokeStyle = "rgba(138, 79, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(150, 150);
        ctx.lineTo(250, 110);
        ctx.lineTo(350, 150);
        ctx.lineTo(420, 250);
        ctx.lineTo(300, 320);
        ctx.lineTo(200, 320);
        ctx.lineTo(80, 250);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Joint link tracing
        if (connectedPoints.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = primaryColor;
          
          const startPt = constellationStars[connectedPoints[0]];
          ctx.moveTo(startPt.x, startPt.y);
          for (let i = 1; i < connectedPoints.length; i++) {
            const pt = constellationStars[connectedPoints[i]];
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }

        // Draw Stars
        constellationStars.forEach((star, index) => {
          const isSelected = connectedPoints.includes(index);
          const headPoint = connectedPoints[connectedPoints.length - 1] === index;

          ctx.beginPath();
          ctx.arc(star.x, star.y, isSelected ? 8 : 5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? primaryColor : "rgba(255,255,255,0.4)";
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = isSelected ? 15 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Star outer flare
          if (isSelected) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.arc(star.x, star.y, 12, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Point Label
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "10px monospace";
          ctx.fillText(`★ S${index + 1}`, star.x - 12, star.y - 14);
        });
      }
    }
  }, [step, connectedPoints, primaryColor]);

  // Crystallization Animation Loop
  useEffect(() => {
    if (step === "crystallize" && crystallizationRef.current) {
      const canvas = crystallizationRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const particles: Array<{
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        color: string;
        size: number;
        speed: number;
        angle: number;
        offset: number;
      }> = [];

      // Generate visual pet pixel shape (grid of 10x10 blocks in the center)
      const dogPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0]
      ];
      const catPattern = [
        [1,0,0,0,0,0,1,0],
        [1,1,1,1,1,1,1,0],
        [1,0,1,1,1,0,1,0],
        [1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,0,1],
        [0,1,1,1,1,1,1,0],
        [0,1,0,0,0,0,1,0]
      ];

      const chosenPattern = type === "猫" ? catPattern : dogPattern;
      const blockSize = 14;
      const startX = (canvas.width - chosenPattern[0].length * blockSize) / 2;
      const startY = (canvas.height - chosenPattern.length * blockSize) / 2;

      // Populate stardust particles migrating from the borders
      for (let r = 0; r < chosenPattern.length; r++) {
        for (let c = 0; c < chosenPattern[r].length; c++) {
          if (chosenPattern[r][c] === 1) {
            const targetX = startX + c * blockSize + blockSize/2;
            const targetY = startY + r * blockSize + blockSize/2;
            
            // Spawn far away
            const angle = Math.random() * Math.PI * 2;
            const dist = 180 + Math.random() * 100;
            const x = targetX + Math.cos(angle) * dist;
            const y = targetY + Math.sin(angle) * dist;
            const color = matrixHex[Math.floor(Math.random() * matrixHex.length)];
            
            particles.push({
              x,
              y,
              targetX,
              targetY,
              color,
              size: 4 + Math.random() * 5,
              speed: 0.02 + Math.random() * 0.03,
              angle: Math.random() * Math.PI * 2,
              offset: Math.random() * 10,
            });
          }
        }
      }

      // Add extra random cosmic background glow particles
      const bgParticles: Array<{x: number; y: number; color: string; size: number; speed: number}> = [];
      for(let i=0; i<60; i++) {
        bgParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          color: matrixHex[Math.floor(Math.random() * matrixHex.length)],
          size: Math.random() * 3,
          speed: 0.2 + Math.random() * 0.8
        });
      }

      let frame = 0;
      const animate = () => {
        ctx.fillStyle = "#0c061a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw cosmic background grids
        ctx.strokeStyle = "rgba(138, 79, 255, 0.07)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 25) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Draw bg stardust floating
        bgParticles.forEach(p => {
          p.y -= p.speed;
          if (p.y < 0) p.y = canvas.height;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        let arrivedCount = 0;
        particles.forEach(p => {
          // Lerp position towards target
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 1) {
            p.x = p.targetX;
            p.y = p.targetY;
            arrivedCount++;
          } else {
            p.x += dx * p.speed;
            p.y += dy * p.speed;
            
            // Swirling motion offset
            p.x += Math.sin(frame * 0.05 + p.offset) * 0.7;
            p.y += Math.cos(frame * 0.05 + p.offset) * 0.7;
          }

          // Draw pixel block representing Astrocade stardust matrix
          ctx.fillStyle = p.color;
          ctx.shadowBlur = dist > 10 ? 8 : 2;
          ctx.shadowColor = p.color;
          ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
          ctx.shadowBlur = 0;
        });

        // Draw magical flare in the center of ascension
        if (frame < 120) {
          ctx.beginPath();
          const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 5, canvas.width/2, canvas.height/2, 50 + frame);
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
          gradient.addColorStop(0.3, `${primaryColor}CC`);
          gradient.addColorStop(1, "rgba(12, 6, 26, 0)");
          ctx.fillStyle = gradient;
          ctx.arc(canvas.width/2, canvas.height/2, 50 + frame, 0, Math.PI * 2);
          ctx.fill();
        }

        frame++;
        if (arrivedCount < particles.length || frame < 150) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Finished particle synthesis
          ctx.font = "italic bold 16px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 10;
          ctx.fillText(`★ 2D粒子默影【${name}】诞生 ★`, canvas.width / 2, canvas.height / 2 + 100);
          ctx.shadowBlur = 0;
        }
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [step, name, type, matrixHex, primaryColor]);

  const handleFinishAscension = () => {
    if (playSparkleSound) playSparkleSound();
    onComplete({
      name: name || "星尘默影",
      type,
      ownerName: ownerName || "守护者",
      breed: breed || "可爱宝宝",
      passingDate,
      primaryColor,
      secondaryColor,
      stardustMatrixHex: matrixHex,
      hobbies: hobbies.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      favoriteThings: favoriteThings.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="w-full bg-[#0c0624] text-gray-200 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative" id="stardust-ceremony-frame">
      <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-indigo-400 pointer-events-none select-none z-10">
        ASTROCADE RITUAL UT v3.5
      </div>
      
      {/* Step Indicators */}
      <div className="flex border-b border-slate-800 bg-[#070316] p-4 text-xs font-mono select-none" id="ceremony-stepper">
        <div className={`flex-1 text-center py-1 transition-all ${step === "info" ? "text-pink-400 border-b-2 border-pink-400 font-bold" : "text-gray-500"}`}>
          1. 登记灵册
        </div>
        <div className={`flex-1 text-center py-1 transition-all ${step === "analyze" ? "text-indigo-400 border-b-2 border-indigo-400 font-bold" : "text-gray-500"}`}>
          2. 星尘提取
        </div>
        <div className={`flex-1 text-center py-1 transition-all ${step === "constellation" ? "text-cyan-400 border-b-2 border-cyan-400 font-bold" : "text-gray-500"}`}>
          3. 绘绘星轨
        </div>
        <div className={`flex-1 text-center py-1 transition-all ${step === "crystallize" ? "text-emerald-400 border-b-2 border-emerald-400 font-bold" : "text-gray-500"}`}>
          4. 升星汇聚
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Info */}
        {step === "info" && (
          <div className="space-y-5" id="step-info-form">
            <div className="text-center max-w-sm mx-auto mb-6">
              <h3 className="text-lg font-bold text-pink-300 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                开启星尘升星仪式
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                在这里，我们能引导逝去挚爱作别旧疾重获新生，将它们化作天空中一缕彩色像素发光星尘，常驻永远温暖的默影家宿。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">小天使的名字</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：咪咪、小黑、叮当..."
                    className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                    id="pet-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">挚亲类型</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as PetType)}
                      className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                      id="pet-type-select"
                    >
                      <option value="狗">🐕 狗狗</option>
                      <option value="猫">🐈 猫咪</option>
                      <option value="兔">🐇 兔兔</option>
                      <option value="鸟">🦜 鸟儿</option>
                      <option value="仓鼠">🐹 仓鼠</option>
                      <option value="其他">✨ 其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">品种名称</label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="美短、博美等"
                      className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">家长唤称 (你的称呼)</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="妈妈、老爸、姐姐等"
                    className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">纪念日 (踏上彩虹桥的时间)</label>
                  <input
                    type="date"
                    value={passingDate}
                    onChange={(e) => setPassingDate(e.target.value)}
                    className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">它的个性爱好 (英文逗号或中文逗号隔开)</label>
                  <input
                    type="text"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    placeholder="如：捕夜蛾, 踩流星, 在阳台踩奶"
                    className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">它最喜欢的人/物/事</label>
                  <input
                    type="text"
                    value={favoriteThings}
                    onChange={(e) => setFavoriteThings(e.target.value)}
                    placeholder="如：香烤起司条, 主人摸下巴, 吹蒲公英"
                    className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Photo Select */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  选择或上传原图（Astrocade智能像素分析提取色谱）
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_PETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePhotoSelect(preset.img, preset.colors)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhoto === preset.img ? "border-pink-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.img} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-0 text-[8px] bg-black/60 w-full text-center py-0.5">{preset.name}</div>
                    </button>
                  ))}
                  
                  <label className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-slate-800 transition-all">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-[7px] text-gray-400 mt-1">上传</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="relative aspect-square max-h-[140px] w-full rounded-lg overflow-hidden bg-black/50 frame-border flex items-center justify-center">
                  {selectedPhoto ? (
                    <img src={selectedPhoto} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs text-gray-500 font-mono">未选定图档</span>
                  )}
                  {analyzing && (
                    <div className="absolute inset-0 bg-[#0c061a]/90 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-4 border-t-pink-500 border-indigo-900 animate-spin mb-2"></div>
                      <span className="text-xs text-pink-300 font-mono animate-pulse">Astrocade 像素色彩剥离...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="button"
                disabled={!name || !ownerName || analyzing}
                onClick={startAnalysis}
                className="bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold py-2 px-6 rounded-lg text-sm shadow-lg flex items-center gap-2 transition-all disabled:cursor-not-allowed select-none"
              >
                确定登记，提取星尘色系
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analyze Colors */}
        {step === "analyze" && (
          <div className="space-y-5 text-center" id="step-analyze-palette">
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-indigo-300">★ 提取结果：离散色彩光谱</h3>
              <p className="text-xs text-gray-400 mt-1">
                Astrocade 引擎已读取上传照片，并降低其饱和度生成了柔和的发光像素底色，避免高频刺眼配色伤害眼球。
              </p>
            </div>

            <div className="grid grid-cols-5 gap-3 max-w-md mx-auto my-6 p-4 bg-[#120b2d] rounded-xl border border-slate-800">
              {matrixHex.map((hex, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer shadow-inner relative hover:scale-105 transition-transform"
                    style={{ backgroundColor: hex }}
                  >
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/60 text-[8px] text-gray-300 flex items-center justify-center">
                      #{idx + 1}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-gray-400">{hex}</span>
                </div>
              ))}
              
              <div className="flex flex-col items-center gap-1 justify-center border border-dashed border-slate-800 rounded-lg p-1 bg-slate-900/40">
                <Paintbrush className="w-4 h-4 text-indigo-400" />
                <span className="text-[7px] text-gray-400">微调方案</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 max-w-sm mx-auto">
              {colorsList.slice(0, 8).map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const updated = [...matrixHex];
                    updated[idx % 4] = color;
                    setMatrixHex(updated);
                    setPrimaryColor(updated[0]);
                    setSecondaryColor(updated[1]);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-600"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-between">
              <button
                onClick={() => setStep("info")}
                className="border border-slate-700 hover:bg-slate-850 text-gray-400 text-xs px-4 py-2 rounded-lg shrink-0"
              >
                上一步
              </button>
              <button
                onClick={() => {
                  setStep("constellation");
                  if (playSparkleSound) playSparkleSound();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg text-sm flex items-center gap-2"
              >
                绘制纪念星座轨迹
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Constellation Star Game */}
        {step === "constellation" && (
          <div className="space-y-4" id="step-constellation-puzzle">
            <div className="text-center max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-cyan-300">★ 绘制灵宿星座轨</h3>
              <p className="text-xs text-gray-400 mt-1">
                按顺序依次点击夜空中的星尘微粒，连接发光灵线，在夜幕绘出【{name}】的微粒轮廓。
              </p>
            </div>

            <div className="relative flex justify-center my-2">
              <canvas
                ref={constellationCanvasRef}
                width={500}
                height={350}
                className="rounded-xl border border-[#1a123f] cursor-pointer bg-[#000]"
                id="constellation-puzzle-canvas"
              />

              <div className="absolute top-2 left-2 flex gap-1 p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-cyan-400">
                <span>轨迹长度: {connectedPoints.length} / 8 点</span>
              </div>

              {/* Spark click grid for responsive styling of hotspots */}
              <div className="absolute inset-0 pointer-events-none">
                {constellationStars.map((star, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleConstellationClick(idx)}
                    className="absolute pointer-events-auto cursor-pointer rounded-full p-2 hover:bg-white/20 transition-all"
                    style={{
                      left: `calc(${(star.x / 500) * 100}% - 14px)`,
                      top: `calc(${(star.y / 350) * 100}% - 14px)`,
                      width: "28px",
                      height: "28px",
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-center font-mono text-[10px] text-gray-400">
              💡 提示：连接星光。全部连结完毕后即可启动“升星仪式”，让星粒子完成结晶汇聚！
            </p>

            <div className="pt-4 border-t border-slate-850 flex justify-between">
              <button
                onClick={() => setStep("analyze")}
                className="border border-slate-700 hover:bg-slate-850 text-gray-400 text-xs px-4 py-2 rounded-lg"
              >
                上一步
              </button>
              <button
                disabled={connectedPoints.length < 5}
                onClick={() => {
                  setStep("crystallize");
                  if (playSparkleSound) playSparkleSound();
                }}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-850 text-white font-semibold py-2 px-6 rounded-lg text-sm flex items-center gap-2 shadow-lg disabled:cursor-not-allowed"
                id="summit-constellation-btn"
              >
                点亮星门，开始升星
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Particle Crystallization Canvas */}
        {step === "crystallize" && (
          <div className="space-y-4 text-center animate-fade-in" id="step-ascend-crystallize">
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-emerald-300">🌟 宇宙默影升星融合中...</h3>
              <p className="text-xs text-gray-400 mt-1">
                2D Canvas正在渲染。像素星尘粒子慢慢汇集，形成【{name}】在星河彼端的星尘体。
              </p>
            </div>

            <div className="flex justify-center my-3 relative">
              <canvas
                ref={crystallizationRef}
                width={500}
                height={350}
                className="rounded-xl border border-[#1b3a24] bg-[#0c061a]"
                id="crystallization-canvas"
              />
              
              <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
                <div className="bg-[#070316] border border-slate-800 text-[10px] font-mono px-3 py-1 rounded text-pink-400 scale-95 border-b-2">
                  [ASTROCADE 2D CANVAS粒子重组 - 零硬件成本超流畅]
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-center">
              <button
                onClick={handleFinishAscension}
                className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 text-md tracking-wider transition-all scale-105 active:scale-95"
                id="join-galaxy-home-btn"
              >
                送入默影家宿，开始温馨陪伴
                <Heart className="w-5 h-5 text-red-400 fill-red-400 animate-pulse" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
