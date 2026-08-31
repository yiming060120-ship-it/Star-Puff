/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StarPuffUser, PetConfig, PetType } from "../../types";
import { playSound } from "../../audio/AudioSynth";
import { SPECIES_MODELS } from "../../data/speciesModels";
// [CLEANUP] 已移除 6 个未使用的图标导入：Star / Heart / CheckCircle2 / UserCheck / RefreshCw / X
import { Sparkles, Users, Plus, Pencil, Trash2 } from "lucide-react";

interface MultiPetSelectorProps {
  user: StarPuffUser;
  onSelectPet: (pet: PetConfig) => void;
  onAddPet: (pet: PetConfig) => void;
  onUpdatePet: (pet: PetConfig) => void;
  onDeletePet: (petId: string) => void;
  triggerToast: (msg: string) => void;
}

const PET_TYPES: PetType[] = ["猫", "狗", "兔", "鸟", "仓鼠", "其他"];

export default function MultiPetSelector({ user, onSelectPet, onAddPet, onUpdatePet, onDeletePet, triggerToast }: MultiPetSelectorProps) {
  const allPets = user.allPets || (user.activePet ? [user.activePet] : []);
  const activePet = user.activePet;
  const isVip = user.membership !== "free";
  const slotLimit = isVip ? 5 : 3;

  const [showAddForm, setShowAddForm] = useState(false);
  // 专门的删除面板开关
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  // 编辑状态：记录正在编辑的宠物 id
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<PetType>("猫");
  const [breed, setBreed] = useState("");
  const [passingDate, setPassingDate] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F27D26");
  const [secondaryColor, setSecondaryColor] = useState("#818CF8");
  const [modelFile, setModelFile] = useState<string>("");

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
      // [BUG-FIX] 忌日/生日默认不再写死：留空由用户自行填写，避免"忌日=今天"触发误提醒、"生日=2018"不真实
      passingDate: passingDate || "",
      birthDay: birthDay || "",
      primaryColor,
      secondaryColor,
      stardustMatrixHex: [primaryColor, secondaryColor, "#ffffff"],
      personalityTags: ["温柔精灵", "贴心小棉袄"],
      moodLevel: 90,
      happiness: 85,
      memoryTimelineList: [],
      anniversariesList: [],
      // 高精 3D 模型（用户选择的立体形态，避免所有新宠都长同一只 2D 猫）
      modelFile: modelFile || undefined,
    };

    onAddPet(newPet);
    setName("");
    setBreed("");
    setPassingDate("");
    setBirthDay("");
    setModelFile("");
    setShowAddForm(false);
    triggerToast(`✨ 重聚重逢！【${newPet.name}】成功化作星尘默影，注册进大星谱。`);
    playSound("success");
  };

  // [BUG-FIX] 宠物判等优先用 id，避免重名宠物无法切换/误判
  const petKey = (pet: PetConfig | null | undefined) => pet?.id || pet?.name || "";

  const handleSwitch = (pet: PetConfig) => {
    if (petKey(activePet) === petKey(pet)) return;
    playSound("chime");
    onSelectPet(pet);
    triggerToast(`🌌 已将主家园投射默影切换至 【${pet.name}】！灵魂契合中...`);
  };

  // 进入编辑模式：把宠物现有字段回填到表单
  const handleStartEdit = (pet: PetConfig) => {
    setEditingPetId(petKey(pet));
    setName(pet.name || "");
    setType((pet.type as PetType) || "猫");
    setBreed(pet.breed || "");
    setPassingDate(pet.passingDate || "");
    setBirthDay(pet.birthDay || "");
    setPrimaryColor(pet.primaryColor || "#F27D26");
    setSecondaryColor(pet.secondaryColor || "#818CF8");
    setModelFile(pet.modelFile || "");
    setShowAddForm(false);
    playSound("click");
  };

  // 保存编辑：把表单字段写回该宠物
  const handleSaveEdit = () => {
    if (!editingPetId) return;
    if (!name.trim()) {
      triggerToast("⚠️ 请至少输入心爱宠物的名字呢");
      return;
    }
    const target = allPets.find(p => petKey(p) === editingPetId);
    if (!target) return;
    const updated: PetConfig = {
      ...target,
      name: name.trim(),
      type,
      breed: breed.trim() || target.breed,
      passingDate: passingDate || target.passingDate,
      birthDay: birthDay || target.birthDay,
      primaryColor,
      secondaryColor,
      stardustMatrixHex: [primaryColor, secondaryColor, "#ffffff"],
      modelFile: modelFile || target.modelFile,
    };
    onUpdatePet(updated);
    setEditingPetId(null);
    playSound("success");
    triggerToast(`✨ 已更新【${updated.name}】的星尘档案！`);
  };

  // 删除宠物（至少保留一只）
  const handleDeletePet = (pet: PetConfig) => {
    if (allPets.length <= 1) {
      triggerToast("⚠️ 至少需要保留一只默影宠哦，不能全部删除。");
      playSound("beep");
      return;
    }
    const pid = petKey(pet);
    const proceed = window.confirm(`你确定要让【${pet.name}】化作星尘离开吗？\n这只小宝贝的回忆与耳语也会一并消散，此操作不可撤销。`);
    if (!proceed) return;
    onDeletePet(pid);
    playSound("chime");
    triggerToast(`🌠 【${pet.name}】已化作星尘，回到喵王星的天际。`);
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
            <p className="text-[10px] text-gray-400">支持独立生成陪伴私语、分别记录回忆，开启“星尘共舞”互动。</p>
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          {/* 删除宠物入口（至少 2 只时才可删除） */}
          {allPets.length > 1 && (
            <button
              onClick={() => {
                setShowDeletePanel(!showDeletePanel);
                setShowAddForm(false);
                setEditingPetId(null);
                playSound("click");
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                showDeletePanel
                  ? "bg-rose-500/30 border-rose-500 text-rose-200"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除宠物</span>
            </button>
          )}

          {allPets.length < slotLimit && (
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowDeletePanel(false);
                setEditingPetId(null);
                playSound("click");
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>纪念新天使</span>
            </button>
          )}
        </div>
      </div>

      {/* Pet list (vertical rows with clear edit/delete actions) */}
      <div className="space-y-2">
        {allPets.map((pet) => {
          const isActive = petKey(activePet) === petKey(pet);
          const pct = Math.floor(pet.moodLevel || 85);
          
          return (
            <div
              key={petKey(pet)}
              onClick={() => handleSwitch(pet)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                isActive
                  ? "bg-[#251351]/80 border-indigo-500 shadow-[0_0_15px_rgba(129,140,248,0.2)]"
                  : "bg-black/30 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Pet color avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border border-white/10" style={{
                background: `linear-gradient(135deg, ${pet.primaryColor} 0%, ${pet.secondaryColor} 100%)`
              }}>
                {pet.modelFile ? "🐾" : "🌌"}
              </div>

              {/* Name + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold truncate text-white">{pet.name}</span>
                  {isActive && (
                    <span className="text-[8px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full font-bold shrink-0">当前</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                  {pet.type} · {pet.breed || "未知品种"}
                </div>
                <div className="w-full max-w-[160px] bg-white/5 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-indigo-400 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Edit / Delete actions (prominent) */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(pet); }}
                  title="编辑星尘档案"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePet(pet); }}
                  title="删除这只默影宠"
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 专门的删除宠物面板 */}
      {showDeletePanel && (
        <div className="bg-[#1c0e3a]/90 border border-rose-500/30 rounded-2xl p-4 space-y-3 animate-scale-up">
          <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block pb-1 border-b border-white/5">
            🗑️ 删除宠物 · 请选择要送走的默影
          </span>
          <p className="text-[10px] text-gray-400">
            删除后该宠物的回忆、耳语与装扮都会一并消散，此操作不可撤销。
          </p>
          <div className="space-y-1.5">
            {allPets.map((pet) => {
              const isActive = petKey(activePet) === petKey(pet);
              return (
                <div key={petKey(pet)} className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border border-white/10" style={{
                    background: `linear-gradient(135deg, ${pet.primaryColor} 0%, ${pet.secondaryColor} 100%)`
                  }}>
                    {pet.modelFile ? "🐾" : "🌌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white">{pet.name}</span>
                    {isActive && <span className="ml-1 text-[8px] text-green-400">(当前)</span>}
                  </div>
                  <button
                    onClick={() => handleDeletePet(pet)}
                    disabled={allPets.length <= 1}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/50 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => { setShowDeletePanel(false); playSound("click"); }}
              className="px-3 py-1 bg-transparent text-gray-400 hover:text-white rounded text-xs"
            >
              收起
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Pet Form block */}
      {(showAddForm || editingPetId) && (
        <div className="bg-[#1c0e3a]/90 border border-purple-500/30 rounded-2xl p-4 space-y-3 animate-scale-up">
          <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block pb-1 border-b border-white/5">
            {editingPetId ? "✏️ 编辑星尘默影档案" : "🔑 注星定命 ─ 重构第二只陪伴默影"}
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

          {/* 3D 高精模型选择：从已存储的 12 个物种模型中挑选立体形态 */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-gray-400 block">
              ✨ 3D 高精模型（选择星尘宠物的立体形态，不选则用默认 2D 默影）
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {SPECIES_MODELS.map((m) => (
                <button
                  key={m.file}
                  type="button"
                  onClick={() => {
                    playSound("click");
                    setModelFile(m.file);
                  }}
                  title={`${m.label}（${m.file}）`}
                  className={`p-1 rounded-lg border text-center transition-all overflow-hidden ${
                    modelFile === m.file
                      ? "border-pink-400 bg-pink-500/20 text-white ring-1 ring-pink-400"
                      : "border-slate-700 bg-black/40 text-gray-400 hover:border-pink-400/50"
                  }`}
                >
                  <img
                    src={m.thumbnail}
                    alt={m.label}
                    className="w-full aspect-square object-cover rounded mb-1 bg-[#1a1133]"
                    loading="lazy"
                  />
                  <div className="text-[8px] font-bold leading-tight truncate">{m.label}</div>
                </button>
              ))}
            </div>
            {modelFile && (
              <p className="text-[8px] text-pink-300">已选模型：{modelFile}（将在主页 3D 模式展示）</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingPetId(null);
                playSound("click");
              }}
              className="px-3 py-1 bg-transparent text-gray-400 hover:text-white rounded text-xs"
            >
              取消
            </button>
            {editingPetId ? (
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded font-mono"
              >
                💾 保存修改
              </button>
            ) : (
              <button
                onClick={handleAddNewPet}
                className="px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded font-mono"
              >
                注入生体契约
              </button>
            )}
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
