/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StarPuffUser, PetConfig, PetType } from "../types";
import { playSound } from "./AudioSynth";
import { Sparkles, Users, Plus, Star, Heart, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

interface MultiPetSelectorProps {
  user: StarPuffUser;
  onSelectPet: (pet: PetConfig) => void;
  onAddPet: (pet: PetConfig) => void;
  triggerToast: (msg: string) => void;
}

const PET_TYPES: PetType[] = ["猫", "狗", "兔", "鸟", "仓鼠", "其他"];

export default function MultiPetSelector({ user, onSelectPet, onAddPet, triggerToast }: MultiPetSelectorProps) {
  const allPets = user.allPets || (user.activePet ? [user.activePet] : []);
  const activePet = user.activePet;
  const isVip = user.membership !== "free";
  const slotLimit = isVip ? 5 : 3;

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PetType>("猫");
  const [breed, setBreed] = useState("");
  const [passingDate, setPassingDate] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F27D26");
  const [secondaryColor, setSecondaryColor] = useState("#818CF8");

  const handleAddNewPet = () => {
    if (!name.trim()) {
      triggerToast("⚠️ 请至少输入心爱宠物的名字呢");
      return;
    }

    if (allPets.length >= slotLimit) {
      triggerToast(`⚠️ 当前身份限额为 ${slotLimit} 只默影，请在【个人首面】升级至会员可存储至 5 只。`);
      return;
    }

    // Prepare default character config
    const newPet: PetConfig = {
      name: name.trim(),
      type,
      ownerName: user.ownerName || "主人",
      breed: breed.trim() || "混血天使",
      passingDate: passingDate || new Date().toISOString().split("T")[0],
      birthDay: birthDay || "2018-05-12",
      primaryColor,
      secondaryColor,
      stardustMatrixHex: [primaryColor, secondaryColor, "#ffffff"],
      personalityTags: ["温柔精灵", "贴心小棉袄"],
      moodLevel: 90,
      happiness: 85,
      memoryTimelineList: [],
      anniversariesList: []
    };

    onAddPet(newPet);
    setName("");
    setBreed("");
    setPassingDate("");
    setBirthDay("");
    setShowAddForm(false);
    triggerToast(`✨ 重聚重逢！【${newPet.name}】成功化作星尘默影，注册进大星谱。`);
    playSound("success");
  };

  const handleSwitch = (pet: PetConfig) => {
    if (activePet?.name === pet.name) return;
    playSound("chime");
    onSelectPet(pet);
    triggerToast(`🌌 已将主家园投射默影切换至 【${pet.name}】！灵魂契合中...`);
  };

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-4 shadow-xl" id="multi-pet-selector-cabinet">
      
      {/* Header section info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              👥 极星多默影宿命管理
              <span className="text-[8px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                {allPets.length} / {slotLimit} SLOTS
              </span>
            </h4>
            <p className="text-[10px] text-gray-400">支持独立生成AI耳语、分别记录回忆，开启“星尘共舞”互动。</p>
          </div>
        </div>

        {allPets.length < slotLimit && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); playSound("click"); }}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>纪念新天使</span>
          </button>
        )}
      </div>

      {/* Horizontal pet cards scroll list */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {allPets.map((pet) => {
          const isActive = activePet?.name === pet.name;
          const pct = Math.floor(pet.moodLevel || 85);
          
          return (
            <div
              key={pet.name}
              onClick={() => handleSwitch(pet)}
              className={`min-w-[130px] p-3 rounded-2xl border cursor-pointer transition-all relative select-none shrink-0 ${
                isActive
                  ? "bg-[#251351]/80 border-indigo-500 shadow-[0_0_15px_rgba(129,140,248,0.2)]"
                  : "bg-black/30 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Active signet corner */}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}

              {/* Type, breed badging */}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] bg-white/5 text-gray-400 px-1 rounded font-mono">
                  {pet.type}
                </span>
                <span className="text-[8px] text-indigo-300 truncate max-w-[60px]">
                  {pet.breed}
                </span>
              </div>

              {/* Pet Custom color ball indicator */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px]" style={{
                background: `linear-gradient(135deg, ${pet.primaryColor} 0%, ${pet.secondaryColor} 100%)`
              }}>
                🌌
              </div>

              {/* Name Details */}
              <div className="text-xs font-bold truncate text-white">{pet.name}</div>
              <p className="text-[8px] text-gray-500 mt-1 font-mono">心情灵力: {pct}%</p>
              
              {/* Progress bar */}
              <div className="w-full bg-white/5 rounded-full h-1 mt-0.5 overflow-hidden">
                <div 
                  className="bg-indigo-400 h-full transition-all duration-500" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Pet Form block */}
      {showAddForm && (
        <div className="bg-[#1c0e3a]/90 border border-purple-500/30 rounded-2xl p-4 space-y-3 animate-scale-up">
          <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block pb-1 border-b border-white/5">
            🔑 注星定命 ─ 重构第二只陪伴默影
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">宠物姓名 (Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如: 咪咪, 乐乐"
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              />
            </div>
            
            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">种类 (Species)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PetType)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                {PET_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#12082e]">{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">品种 (Breed)</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="如: 金毛, 布偶猫"
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">生卒忌日 (Passing Date)</label>
              <input
                type="date"
                value={passingDate}
                onChange={(e) => setPassingDate(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">诞生日 (Birthday)</label>
              <input
                type="date"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-gray-400 block">代表主色 Hex</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full bg-transparent h-7 border-0 cursor-pointer p-0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => { setShowAddForm(false); playSound("click"); }}
              className="px-3 py-1 bg-transparent text-gray-400 hover:text-white rounded text-xs"
            >
              取消
            </button>
            <button
              onClick={handleAddNewPet}
              className="px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded font-mono"
            >
              注入生体契约
            </button>
          </div>
        </div>
      )}

      {/* Bonus instruction banner */}
      <div className="bg-[#0b061e] border border-white/5 p-2 rounded-xl flex items-center justify-between text-[10px]">
        <span className="font-mono text-indigo-300 flex items-center gap-1.5 leading-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          当拥有 2 只或以上默影宠时，在大世界中星尘散逸共舞 🔮
        </span>
      </div>
    </div>
  );
}
