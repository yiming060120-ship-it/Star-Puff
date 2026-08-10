/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PetConfig } from "../types";
import { PET_MEMORIES, MemorySegment } from "./MemoryFlashbackModal";
import { Lock, Eye, BookOpen, Clock, Heart, Award } from "lucide-react";
import { playSound } from "./AudioSynth";

interface MemoryAlbumProps {
  petConfig: PetConfig;
  unlockedIds: string[];
  onSelectMemory: (id: string) => void;
}

export default function MemoryAlbum({ petConfig, unlockedIds, onSelectMemory }: MemoryAlbumProps) {
  const [filterType, setFilterType] = useState<"all" | "ours">("all");

  // Determine standard matched/potential records for current pet category
  const categorizedMemories = PET_MEMORIES.map(mem => {
    const isUnlocked = unlockedIds.includes(mem.id);
    const categoryMatches = mem.category === petConfig.type || mem.category === "通用";
    return {
      ...mem,
      isUnlocked,
      categoryMatches
    };
  });

  // Filter based on user selection
  const displayed = filterType === "all" 
    ? categorizedMemories 
    : categorizedMemories.filter(m => m.categoryMatches);

  const unlockCount = categorizedMemories.filter(m => m.isUnlocked).length;

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md" id="memory-album-pane">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              🌸 {petConfig.name} 的星屑记忆相册
              <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-[9px] rounded-full font-mono font-bold animate-pulse">
                已收集 {unlockCount}/{PET_MEMORIES.length} 碎片
              </span>
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              通过日常的抚摸互动、抛送爱心、投喂星粮或漫步寻星等，能加速充能触发闪回。
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 text-[10px] font-mono self-stretch sm:self-auto justify-around">
          <button
            onClick={() => { setFilterType("all"); playSound("click"); }}
            className={`px-3 py-1 rounded transition-colors ${filterType === "all" ? "bg-purple-600 text-white font-bold" : "text-gray-400 hover:text-white"}`}
          >
            显示全集 ({PET_MEMORIES.length})
          </button>
          <button
            onClick={() => { setFilterType("ours"); playSound("click"); }}
            className={`px-3 py-1 bg-transparent rounded transition-colors ${filterType === "ours" ? "bg-purple-600 text-white font-bold" : "text-gray-400 hover:text-white"}`}
          >
            本派系关联 ({categorizedMemories.filter(m => m.categoryMatches).length})
          </button>
        </div>
      </div>

      {/* Progress thermometer bar */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-indigo-300 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" />
              星心连系充能进度
            </span>
            <span className="text-pink-300 font-bold font-mono">
              {Math.min(100, Math.round((unlockCount / PET_MEMORIES.length) * 100))}%
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-700 shadow-inner"
              style={{ width: `${(unlockCount / PET_MEMORIES.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-[#18092d] px-3 py-2 rounded-xl border border-pink-500/20 text-center flex flex-col items-center">
          <Award className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-[9px] text-gray-400 font-sans mt-0.5">收集奖励额</span>
          <span className="text-xs font-mono font-bold text-amber-300">+25币/枚</span>
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {displayed.map((mem) => {
          return (
            <div 
              key={mem.id}
              onClick={() => {
                if (mem.isUnlocked) {
                  playSound("click");
                  onSelectMemory(mem.id);
                } else {
                  playSound("beep");
                }
              }}
              className={`border rounded-2xl p-3 flex flex-col justify-between h-44 cursor-pointer overflow-hidden transition-all relative ${
                mem.isUnlocked 
                  ? "bg-slate-900/60 border-pink-500/30 hover:border-pink-500/80 hover:bg-slate-900/90 shadow-md hover:-translate-y-1 group" 
                  : "bg-black/60 border-white/5 opacity-55 saturate-50 cursor-not-allowed"
              }`}
            >
              {mem.isUnlocked && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                  <img 
                    referrerPolicy="no-referrer"
                    src={mem.image} 
                    alt={mem.title} 
                    className="w-full h-full object-cover blur-[1px] opacity-10 group-hover:scale-105 transition-all"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950" />
                </div>
              )}

              {/* Header icons info */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{mem.isUnlocked ? mem.icon : "🔒"}</span>
                  <span className="text-[10px] text-purple-300 font-mono bg-purple-900/30 border border-purple-500/15 px-1.5 py-0.5 rounded">
                    {mem.category === "通用" ? "通用魂念" : `${mem.category}系记忆`}
                  </span>
                </div>
                {mem.isUnlocked ? (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                    已解锁
                  </span>
                ) : (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-gray-500 border border-slate-700 font-mono">
                    待唤醒
                  </span>
                )}
              </div>

              {/* Title & snippet */}
              <div className="mt-3 relative z-10 flex-grow flex flex-col justify-center">
                <h5 className={`text-xs font-bold ${mem.isUnlocked ? "text-white" : "text-gray-500 font-normal font-mono"}`}>
                  {mem.isUnlocked ? mem.title : "【记忆尘封】"}
                </h5>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-3">
                  {mem.isUnlocked 
                    ? mem.descriptionTemplate(petConfig.name, petConfig.ownerName) 
                    : `当与 ${petConfig.name} 进行各种温暖交互活动频率提振时，有概率在空气里凝聚出尘封片段。`
                  }
                </p>
              </div>

              {/* Action indicators */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 relative z-10">
                <span className="font-mono">{mem.isUnlocked ? "✨ 重温温存" : "🔒 待闪回事件"}</span>
                {mem.isUnlocked ? (
                  <span className="text-pink-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    查看明细 <Eye className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    互动解禁 <Lock className="w-2.5 h-2.5 text-gray-600" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
