import React, { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Sparkles, Download, Video, VideoOff, Layers, CheckCircle2, X } from "lucide-react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";

interface ArCameraSimulationProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetConfig;
  triggerToast: (msg: string) => void;
  isGodMode: boolean;
}

const FILTERS = [
  { id: "normal", name: "原版星野", class: "" },
  { id: "aurora", name: "粉色星能 (Aurora Pink)", class: "hue-rotate-30 saturate-150 contrast-110 sepia-[15%]" },
  { id: "valley", name: "极光山谷 (Polar Green)", class: "hue-rotate-[140deg] saturate-125 sepia-[10%]" },
  { id: "cozy", name: "复古金辉 (Cozy Gold)", class: "sepia saturate-150 contrast-95 brightness-105" },
  { id: "vintage", name: "星云胶片 (Sci-Fi Vintage)", class: "grayscale contrast-125 brightness-90 sepia-[20%]" }
];

export default function ArCameraSimulation({ isOpen, onClose, pet, triggerToast, isGodMode }: ArCameraSimulationProps) {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [petCoord, setPetCoord] = useState({ x: 0, y: 30 }); // relative offset from center
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [screenshotPostcard, setScreenshotPostcard] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 9) {
            clearInterval(timerRef.current);
            setIsRecording(false);
            playSound("success");
            triggerToast("🎥 10秒星云追忆微视频生成完美！已保存在Astrocade星云多媒体底座。");
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleDragDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - petCoord.x, y: e.clientY - petCoord.y };
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPetCoord({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleDragUp = () => {
    setIsDragging(false);
  };

  const handleCapture = () => {
    playSound("click");
    const phrases = [
      `“你在温暖的光年里，我能看到你在草地上留下的彩色脚印。”`,
      `“无论星河怎么旋转，你温柔的呼吸始终在耳边环绕。”`,
      `“在这个温馨的小室里，我再一次拥抱了你那蓬松的虚影。”`
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Simulate high-fidelity Polaroid postcard render state
    setScreenshotPostcard(`【喵汪星云 V2.0 AR极客相册】\n\n宠主：星之守护者\n宠物：${pet.name} (${pet.breed})\n情感滤镜：${activeFilter.name}\n治愈寄语：${phrase}\n拍摄时间：${new Date().toLocaleString()}`);
    triggerToast("📸 极客AR追忆照片拍摄成功！已自动渲染胶片质感。");
  };

  const ambientDots = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    left: `${(i * 17.5 + 4) % 100}%`,
    top: `${(i * 23.1 + 8) % 100}%`,
    delay: `${i * 0.15}s`,
    color: i % 3 === 0 ? pet.primaryColor : i % 3 === 1 ? pet.secondaryColor || "#ff007f" : "#ffffff",
    size: (i % 3) + 2
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div 
        className="relative w-full max-w-4xl bg-[#090615] border border-white/20 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(239,71,111,0.25)]"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragUp}
      >
        {/* Left side viewport mockup representing active smart lens */}
        <div className="flex-1 relative bg-[#04020a] h-[360px] md:h-[480px] overflow-hidden group">
          {/* Mock background scene rendering room layout */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#110c26] to-[#04020a]" />
          
          {/* Animated floating room outline vector lines */}
          <div className="absolute inset-x-0 bottom-0 h-40 border-t border-purple-500/10 bg-purple-500/[0.02]" />
          <div className="absolute left-1/4 bottom-0 w-px h-40 bg-purple-500/15 text-white/5 text-[8px] p-1 font-mono">X_COORD</div>
          <div className="absolute right-1/4 bottom-0 w-px h-40 bg-purple-500/15 text-white/5 text-[8px] p-1 font-mono">Y_COORD</div>
          <div className="absolute left-10 bottom-24 w-12 h-12 rounded bg-indigo-500/5 border border-indigo-500/10 rotate-12 flex items-center justify-center text-gray-700 text-[10px]">🛋️ 沙发</div>
          <div className="absolute right-16 bottom-32 w-10 h-28 rounded bg-pink-500/5 border border-pink-500/10 -rotate-6 flex items-center justify-center text-gray-700 text-[10px]">🪴 绿植</div>

          {/* AR Simulated holographic lens layer (Applying CSS Filter class) */}
          <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${activeFilter.class}`}>
            {/* Holographic noise particles */}
            {ambientDots.map((dot) => (
              <span
                key={dot.id}
                className="absolute rounded-full animate-pulse z-10"
                style={{
                  left: dot.left,
                  top: dot.top,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  backgroundColor: dot.color,
                  animationDelay: dot.delay,
                  boxShadow: `0 0 8px ${dot.color}`
                }}
              />
            ))}
          </div>

          {/* Rule-of-Thirds Grid */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
            </div>
          )}

          {/* Lens focus square */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-cyan-400/30 rounded pointer-events-none z-10 flex items-center justify-center">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
          </div>

          {/* Recording overlay */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600/90 border border-red-500 text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 z-20 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>REC 00:0{recordSeconds}s</span>
            </div>
          )}

          {/* Draggable holographic Pet Avatar inside camera space */}
          <div
            onMouseDown={handleDragDown}
            className={`absolute z-20 cursor-grab active:cursor-grabbing text-center p-3 select-none flex flex-col items-center group/pet`}
            style={{
              left: `calc(50% + ${petCoord.x}px - 70px)`,
              top: `calc(50% + ${petCoord.y}px - 70px)`,
              transition: isDragging ? "none" : "all 0.15s ease-out"
            }}
          >
            {/* Holographic glowing floor projection circle */}
            <div 
              className="absolute bottom-2 w-28 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/40 blur-[2px] animate-pulse"
              style={{
                boxShadow: `0 0 15px ${pet.primaryColor}`
              }}
            />

            {/* Glowing Pet representation */}
            <div className="relative animate-bounce" style={{ animationDuration: "2.8s" }}>
              <div 
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center relative justify-end pb-3 text-5xl select-none"
                style={{
                  textShadow: `0 0 14px ${pet.primaryColor}`
                }}
              >
                {pet.type.includes("猫") ? "🐱" : pet.type.includes("狗") ? "🐶" : pet.type.includes("兔") ? "🐰" : "🐤"}
                
                {/* Outward stardust particles swirling on hover */}
                <div className="absolute inset-0 rounded-full border border-pink-500/25 group-hover/pet:scale-110 group-hover/pet:border-cyan-400/40 transition-transform duration-500" />
              </div>
            </div>

            {/* Tag label */}
            <div className="mt-1 px-2.5 py-0.5 bg-black/75 border border-white/20 rounded text-[9px] font-mono text-cyan-300 select-none shadow-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {pet.name} · {pet.breed}
            </div>
            <div className="text-[7.5px] text-slate-500 font-mono mt-0.5 opacity-0 group-hover/pet:opacity-100 transition-opacity">
              [双指或单指拖拽以移动位置]
            </div>
          </div>

          {/* Interface status badges */}
          <div className="absolute bottom-3 left-4 text-[9px] font-mono text-gray-400 z-10 bg-black/60 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
            <span>YAW: {(petCoord.x * 0.45).toFixed(1)}°</span>
            <span>PITCH: {(petCoord.y * 0.45).toFixed(1)}°</span>
            <span className="text-gray-600">|</span>
            <span className="text-cyan-400 animate-pulse">LENS_RIGGING_ONLINE</span>
          </div>

          <div className="absolute bottom-3 right-4 z-10 flex gap-2">
            <button
              onClick={() => setPetCoord({ x: 0, y: 30 })}
              className="p-1 px-2 bg-black/70 hover:bg-black/90 border border-white/10 rounded text-[8px] text-gray-300 flex items-center gap-1 font-mono transition-colors"
              title="复位宠物位置"
            >
              <RotateCcw className="w-2.5 h-2.5" /> 复位
            </button>
            <button
              onClick={() => setShowGrid(p => !p)}
              className={`p-1 px-2 border rounded text-[8px] font-mono transition-all ${
                showGrid 
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" 
                  : "bg-black/70 border-white/10 text-gray-500"
              }`}
            >
              网格
            </button>
          </div>
        </div>

        {/* Right side controls panel */}
        <div className="w-full md:w-80 bg-[#0d091e] p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 relative">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-bold text-white tracking-widest font-sans">
                  AR 追忆相机
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-purple-300/80 leading-relaxed mb-4">
              这里支持模拟微信小程序的 AR 摄影硬件引擎，融合当前真实光影。您可拖拽上面的小宠任意摆放，合成生前在现实房间的生活合照。
            </p>

            {/* Filter selection */}
            <div className="space-y-2 mb-4">
              <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" /> 情绪滤镜选择:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveFilter(f);
                      playSound("click");
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-[10px] font-mono transition-all flex items-center justify-between border ${
                      activeFilter.id === f.id
                        ? "bg-gradient-to-r from-purple-600/30 to-pink-600/20 border-pink-500/50 text-white font-bold"
                        : "bg-black/40 hover:bg-black/80 border-white/5 text-gray-400"
                    }`}
                  >
                    <span>{f.name}</span>
                    {activeFilter.id === f.id && <Sparkles className="w-3 h-3 text-pink-400 animate-spin" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions list */}
            <div className="space-y-2.5">
              <button
                onClick={handleCapture}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_4px_15px_rgba(239,71,111,0.3)] flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-white" />
                截取 AR 温情明信片
              </button>

              <button
                onClick={() => {
                  playSound("bubble");
                  setIsRecording(r => !r);
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  isRecording
                    ? "bg-red-600/20 border-red-500 text-red-300 hover:bg-red-600/30 animate-pulse"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                }`}
              >
                {isRecording ? (
                  <>
                    <VideoOff className="w-4 h-4" /> 终止10s视频录制
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-emerald-400" /> 模拟拍摄 10s 动态录像
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Postcard preview overlay */}
          {screenshotPostcard && (
            <div className="absolute inset-0 bg-[#070412]/95 border-l border-white/10 p-4 flex flex-col justify-between z-30 animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-[10px] text-pink-400 font-bold font-mono">🌟 Polaroid Postcard</span>
                  <button 
                    onClick={() => setScreenshotPostcard(null)} 
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    重拍
                  </button>
                </div>
                <div className="bg-[#100b21] p-3 rounded-lg border border-white/5 font-mono text-[9px] text-indigo-200 leading-normal whitespace-pre-wrap">
                  {screenshotPostcard}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    playSound("success");
                    triggerToast("📥 拍立得明信片成功下载到手机相册！可在社交空间发布。");
                    setScreenshotPostcard(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 font-mono transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> 保存并导出到相册
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/5 text-[9px] font-mono text-gray-500 text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>AR HOLOGRAPH ENGINE v2.0 READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
