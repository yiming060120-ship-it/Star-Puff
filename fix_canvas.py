import re
with open("src/components/HomeCanvas.tsx", "rb") as f:
    content = f.read()

# try to decode with replace
text = content.decode('utf-8', errors='replace')

match = re.search(r'let defT = "天体信号稳定.*<canvas', text, flags=re.DOTALL)
if match:
    replacement = """    // Default / idle
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
            <button
              onClick={() => { setShowGuide(true); playSound("click"); }}
              className="text-[10px] text-gray-400 font-mono flex items-center gap-1 hover:text-white transition-colors border border-white/10 px-2 py-0.5 rounded-full hover:bg-white/5"
            >
              📖 手册
            </button>
            {isMobile && (
              <span className="text-[10px] font-mono text-pink-300 ml-2 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                单击唤醒
              </span>
            )}
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
              ? ["shaded", "wireframe", "rig", "xray", "model3d", "voxel", "realistic-stardust"] 
              : ["shaded", "wireframe", "rig", "xray", "voxel", "realistic-stardust"]
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
          {useReal3D && (
            <PetThreeOverlay 
              dragOffset={dragOffset}
              isJumping={isJumping}
              activeGestureRef={activeGestureRef}
              petConfig={petConfig}
            />
          )}
          <canvas"""
    
    new_text = text[:match.start()] + replacement + text[match.end()-7:]
    with open("src/components/HomeCanvas.tsx", "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Fixed!")
else:
    print("Not found.")

