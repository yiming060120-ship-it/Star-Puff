/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";
import { Calendar, Heart, Trash2, Plus, AlertCircle, Award, Sparkles, Smile, CloudRain } from "lucide-react";

interface CustomAnniversary {
  id: string;
  date: string;
  title: string;
  desc: string;
}

interface AnniversaryManagerProps {
  petConfig: PetConfig;
  onUpdateAnniversaries: (list: CustomAnniversary[]) => void;
  triggerToast: (msg: string) => void;
}

export default function AnniversaryManager({ petConfig, onUpdateAnniversaries, triggerToast }: AnniversaryManagerProps) {
  const currentList = petConfig.anniversariesList || [];
  
  // input states
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddDate = () => {
    if (!newTitle.trim() || !newDate) {
      triggerToast("⚠️ 请填写纪念日名称与确定日期哟");
      return;
    }

    const newItem: CustomAnniversary = {
      id: "ann_" + Date.now(),
      title: newTitle,
      date: newDate,
      desc: newDesc || "在这个特别的日子，宝贝在星云里静静陪你。"
    };

    const updated = [newItem, ...currentList];
    onUpdateAnniversaries(updated);
    
    setNewTitle("");
    setNewDate("");
    setNewDesc("");
    setShowAddForm(false);
    triggerToast(`❤️ 成功添加纪念契约：【${newTitle}】！`);
    playSound("chime");
  };

  const handleDelete = (id: string) => {
    const updated = currentList.filter(item => item.id !== id);
    onUpdateAnniversaries(updated);
    triggerToast("🗑️ 成功解开相应的纪念日契约。");
    playSound("beep");
  };

  // Helper to check what kind of day today is relative to anniversaries
  const todayStr = new Date().toISOString().split("T")[0].substring(5); // MM-DD
  const birthDayMMDD = petConfig.birthDay ? petConfig.birthDay.substring(5) : "";
  const passingDayMMDD = petConfig.passingDate ? petConfig.passingDate.substring(5) : "";

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-4 shadow-xl" id="anniversary-remembrance-cabinet">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Heart className="w-4 h-4 fill-pink-500/10" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              🎗️ 纪念日与忌日守护共鸣器
            </h4>
            <p className="text-[10px] text-gray-400">设置爱宠生前特殊节点，触发专属星云气候与粒子折射特效。</p>
          </div>
        </div>

        <button
          onClick={() => { setShowAddForm(!showAddForm); playSound("click"); }}
          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold font-mono text-pink-300 flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加新契约</span>
        </button>
      </div>

      {/* Preset immutable system dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
        {/* Birthday Card */}
        <div className="bg-[#160d3d]/50 border border-pink-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white font-mono">🎂 爱宠降生辰 (Birthday)</span>
              {birthDayMMDD === todayStr && (
                <span className="px-1.5 py-0.2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[8px] rounded animate-pulse">
                  今日降临!
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono">生辰日期: {petConfig.birthDay || "未登记"}</p>
            <p className="text-[9px] text-pink-300/80">降临节效：家园派对氛围 + 萌趣星尘生日帽装扮</p>
          </div>
          <Smile className={`w-8 h-8 ${birthDayMMDD === todayStr ? "text-yellow-400 animate-bounce" : "text-gray-600"}`} />
        </div>

        {/* Departure Day / Memorial Day Card */}
        <div className="bg-[#160d3d]/50 border border-purple-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white font-mono">🍂 凡间辞世忌 (Passing Day)</span>
              {passingDayMMDD === todayStr && (
                <span className="px-1.5 py-0.2 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[8px] rounded animate-pulse">
                  今日忌辰...
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono">离世纪念：{petConfig.passingDate || "未登记"}</p>
            <p className="text-[9px] text-purple-300/80">忌日气候：全屏静谧星云降雨 + 灵魂荧光微闪</p>
          </div>
          <CloudRain className={`w-8 h-8 ${passingDayMMDD === todayStr ? "text-blue-400 animate-pulse" : "text-gray-600"}`} />
        </div>
      </div>

      {/* Inline addition Form */}
      {showAddForm && (
        <div className="bg-[#1c0e3a]/90 border border-pink-500/30 rounded-2xl p-4 space-y-3 animate-scale-up">
          <span className="text-[10px] uppercase font-mono font-bold text-pink-400 block pb-1 border-b border-white/5">
            🔑 签订新时光纪念契约
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 block font-mono">回忆主题/名称</label>
              <input
                type="text"
                placeholder="例如：初次相遇纪念日、除夕守岁"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 block font-mono">契约日期 / Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-gray-400 block font-mono">思念自述 / Whisper Content</label>
            <textarea
              rows={2}
              placeholder="当天想要对自己或宝贝说的话..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setShowAddForm(false); playSound("click"); }}
              className="px-3 py-1.5 bg-transparent text-gray-400 hover:text-white rounded-lg text-xs"
            >
              取消
            </button>
            <button
              onClick={handleAddDate}
              className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs rounded-lg shadow-md font-mono"
            >
              确定契结
            </button>
          </div>
        </div>
      )}

      {/* List showing added custom ones */}
      {currentList.length === 0 ? (
        <div className="text-center py-6 bg-black/30 border border-dashed border-white/5 rounded-2xl">
          <p className="text-xs text-gray-500">尚无自定义时光回忆契约。可以点击右上角，记录对你有重大意义的岁月节点 📅</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {currentList.map((ann) => {
            const isMatchedToday = ann.date.substring(5) === todayStr;
            return (
              <div 
                key={ann.id}
                className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
                  isMatchedToday 
                    ? "bg-[#ef476f]/15 border-[#ef476f] text-white" 
                    : "bg-black/30 border-white/5 text-gray-300"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                  <Heart className={`w-4 h-4 ${isMatchedToday ? "fill-pink-500 text-pink-400" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold leading-normal">{ann.title}</span>
                    <span className="text-[9px] text-pink-300 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      {ann.date}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">{ann.desc}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                  title="删除契约"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
