/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";
import { Star, Smile, Upload, Plus, Trash2, Heart, Award, ArrowRight, BookOpen } from "lucide-react";

interface TimelineLog {
  id: string;
  date: string;
  title: string;
  content: string;
  image?: string;
}

interface PetMemoryTimelineProps {
  petConfig: PetConfig;
  onUpdateTimeline: (list: TimelineLog[]) => void;
  onUpdateTags: (tags: string[]) => void;
  triggerToast: (msg: string) => void;
}

const PERSONALITY_TAGS_POOL = [
  { label: "温柔精灵 (Gentle Spirit)", code: "温柔精灵", desc: "在大世界更温顺慢条，耳语温淑细腻" },
  { label: "调皮捣蛋 (Naughty Pup)", code: "调皮捣蛋", desc: "大世界停留攀岩高处，经常开小差嬉戏" },
  { label: "傲娇小主子 (Tsundere Boss)", code: "傲娇小主子", desc: "高冷而可爱，耳语话风有些小任性而深情" },
  { label: "贴心小棉袄 (Warm Blanket)", code: "贴心小棉袄", desc: "常追随其他邻居，耳语充满无限依赖体贴" },
  { label: "吃货大王 (Glutton King)", code: "吃货大王", desc: "大世界地标面包房常客，更愿享用美食零食" },
  { label: "老僧入定 (Sleepyhead)", code: "老僧入定", desc: "安静佛系，常躺平在原地，流光浮动极其迟缓" }
];

const PRESET_MEM_IMAGES = [
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1522850959516-58f958dde2c1?auto=format&fit=crop&q=80&w=200"
];

export default function PetMemoryTimeline({ petConfig, onUpdateTimeline, onUpdateTags, triggerToast }: PetMemoryTimelineProps) {
  const currentTags = petConfig.personalityTags || ["傲娇小主子", "温柔精灵", "贴心小棉袄"];
  const timelineList = petConfig.memoryTimelineList || [
    {
      id: "seed_1",
      date: "2025-05-12",
      title: "第一次正式回到家 🏠",
      content: "那时候还是那么小小一只，在纸箱里瑟瑟发抖。但只要用手指蹭两下你湿漉漉的小鼻子，你就急切地开始舔我的掌心。那一瞬间，我们建立了契约。",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "seed_2",
      date: "2025-11-20",
      title: "打翻了我的红茶杯 ☕",
      content: "明明是你干的坏事，却理直气壮在茶杯旁边滚来滚去。看着地毯上蔓延的茶渍，和满脚红茶印还大摇大摆叫唤的你，真是让人又爱又气。",
      image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200"
    }
  ];

  const [selTags, setSelTags] = useState<string[]>(currentTags);
  const [logTitle, setLogTitle] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logImage, setLogImage] = useState("");
  const [showAddLog, setShowAddLog] = useState(false);

  // Toggle tag in 3-Max array
  const handleToggleTag = (tagCode: string) => {
    playSound("click");
    if (selTags.includes(tagCode)) {
      const filtered = selTags.filter(t => t !== tagCode);
      setSelTags(filtered);
      onUpdateTags(filtered);
    } else {
      if (selTags.length >= 3) {
        triggerToast("⚠️ 宝贝性格最多可以选 3 个最为匹配的核心标签哦");
        return;
      }
      const updated = [...selTags, tagCode];
      setSelTags(updated);
      onUpdateTags(updated);
    }
  };

  const handleCreateLog = () => {
    if (!logTitle.trim() || !logContent.trim() || !logDate) {
      triggerToast("⚠️ 请确保填齐记忆主题、纪实日期以及正文自叙。");
      return;
    }

    const newLog: TimelineLog = {
      id: "mem_" + Date.now(),
      date: logDate,
      title: logTitle,
      content: logContent,
      image: logImage || PRESET_MEM_IMAGES[Math.floor(Math.random() * PRESET_MEM_IMAGES.length)]
    };

    const nextList = [newLog, ...timelineList].sort((a,b) => b.date.localeCompare(a.date));
    onUpdateTimeline(nextList);

    setLogTitle("");
    setLogDate("");
    setLogContent("");
    setLogImage("");
    setShowAddLog(false);
    triggerToast(`📖 【${logTitle}】这篇闪光记忆已被成功篆刻进它的星尘回线中！`);
    playSound("success");
  };

  const handleDeleteLog = (id: string) => {
    const nextList = timelineList.filter(l => l.id !== id);
    onUpdateTimeline(nextList);
    triggerToast("🗑️ 对应的星尘记忆已解除关联。");
    playSound("beep");
  };

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-5 shadow-xl" id="pet-personality-and-timeline-cabinet">
      
      {/* SECTION 1: Character Tags Preset Config */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Smile className="w-4.5 h-4.5 text-orange-400" />
          <div>
            <h4 className="text-xs font-bold font-mono text-white">✨ 契合性格共振器 (3 Traits Selector)</h4>
            <p className="text-[9px] text-gray-400">选择至多 3 项魂力印记，系统每天将根据其性格深度重构对话语气。</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {PERSONALITY_TAGS_POOL.map((tag) => {
            const isSelected = selTags.includes(tag.code);
            return (
              <button
                key={tag.code}
                onClick={() => handleToggleTag(tag.code)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] text-left transition-all relative ${
                  isSelected
                    ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500 text-orange-300 font-bold"
                    : "bg-black/30 border-white/5 text-gray-400 hover:border-white/10"
                }`}
                title={tag.desc}
              >
                <div>{tag.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Vertical Memory Timeline display */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-pink-400" />
            <div>
              <h4 className="text-xs font-bold font-mono text-white">📖 星尘记忆长卷 (remembrance Timeline)</h4>
              <p className="text-[9px] text-gray-400">持续填入与它的凡尘点滴，筑成连接阴阳二世的时间走廊。</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddLog(!showAddLog); playSound("click"); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-pink-300 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>篆刻新时刻</span>
          </button>
        </div>

        {/* Create Memory Form */}
        {showAddLog && (
          <div className="bg-[#1c0e3a]/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3 animate-scale-up">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block pb-1 border-b border-white/5">
              ✍️ 撰写回忆节点 (Record Memory)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 block font-mono">记忆主题/标题 (Title)</label>
                <input
                  type="text"
                  placeholder="如：偷吃小鱼干、在草坪狂奔"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 block font-mono">发生日期 (Date)</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 block font-mono">事件自序 (Description)</label>
              <textarea
                rows={3}
                placeholder="宝贝那个刹那有哪些可爱可笑的小表情动作？把它写在这里，温暖的往事会成为灵魂深处流光碎片的素材。"
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block font-mono">配图链接 (可选 - 支持 Unsplash 或 Preset 样张)</label>
              <input
                type="text"
                placeholder="输入影像 URL地址..."
                value={logImage}
                onChange={(e) => setLogImage(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-mono text-pink-300 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-1">
                {PRESET_MEM_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setLogImage(img); playSound("click"); }}
                    className={`rounded overflow-hidden w-9 h-9 border-2 ${logImage === img ? "border-pink-500 scale-105" : "border-transparent opacity-60"}`}
                  >
                    <img referrerPolicy="no-referrer" src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowAddLog(false); playSound("click"); }}
                className="px-3 py-1.5 bg-transparent text-gray-400 hover:text-white rounded-lg text-xs"
              >
                取消
              </button>
              <button
                onClick={handleCreateLog}
                className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs rounded-lg font-mono"
              >
                注入印记
              </button>
            </div>
          </div>
        )}

        {/* Timeline List rendering */}
        <div className="relative border-l border-white/10 ml-3 pl-6 space-y-6">
          {timelineList.map((log) => (
            <div key={log.id} className="relative group">
              {/* Dot indicator circle along line */}
              <div className="absolute -left-[30px] top-1.5 w-[9px] h-[9px] rounded-full bg-pink-500 border-2 border-slate-900 group-hover:scale-125 transition-transform" />
              
              <div className="bg-[#12082e]/80 border border-white/5 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-pink-300 font-bold bg-pink-500/10 px-2 py-0.5 rounded-full">
                    {log.date}
                  </span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="拆解这段记忆"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {log.image && (
                    <img
                      referrerPolicy="no-referrer"
                      src={log.image}
                      alt={log.title}
                      className="w-full sm:w-20 h-20 object-cover rounded-xl shrink-0 border border-white/10"
                    />
                  )}
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-white leading-normal">{log.title}</h5>
                    <p className="text-[10.5px] text-indigo-100/80 leading-relaxed text-justify">
                      {log.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
