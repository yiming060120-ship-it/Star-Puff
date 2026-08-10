/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { playSound } from "./AudioSynth";
import { Bell, ShieldCheck, Volume2, Moon, Clock, Sparkles } from "lucide-react";

interface NotificationConfig {
  aiWhisperEnabled: boolean;
  whisperTime: string; // e.g. "10:00"
  anniversaryReminder: boolean;
  petInteractionCollision: boolean;
  giftsAndLikes: boolean;
  globalQuietPeriod: boolean; // 22:00-7:00 silent
  soundEffects: boolean;
}

interface NotificationSettingsProps {
  initialConfig?: NotificationConfig;
  onSaveConfig: (config: NotificationConfig) => void;
  triggerToast: (msg: string) => void;
}

export default function NotificationSettings({ initialConfig, onSaveConfig, triggerToast }: NotificationSettingsProps) {
  const [cfg, setCfg] = useState<NotificationConfig>(initialConfig || {
    aiWhisperEnabled: true,
    whisperTime: "10:00",
    anniversaryReminder: true,
    petInteractionCollision: true,
    giftsAndLikes: true,
    globalQuietPeriod: true,
    soundEffects: true
  });

  const handleToggle = (key: keyof NotificationConfig) => {
    playSound("click");
    const nextVal = !cfg[key];
    const updated = { ...cfg, [key]: nextVal };
    setCfg(updated);
    onSaveConfig(updated);
    
    if (key === "soundEffects") {
      triggerToast(nextVal ? "🔊 星尘音效反馈：已恢复开启。" : "🔇 星尘音效反馈：静音静默。");
    } else {
      triggerToast("⚙️ 通知偏好更改已实时在星谱上传同步！");
    }
  };

  const handleChangeTime = (time: string) => {
    playSound("click");
    const updated = { ...cfg, whisperTime: time };
    setCfg(updated);
    onSaveConfig(updated);
    triggerToast(`⏰ AI耳语推送已对准到每日【${time}】！`);
  };

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-4 shadow-xl" id="notification-and-silent-regulator">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
          <Bell className="w-4 h-4 animate-swing" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
            🛰️ 消息触达与声波反馈仪 (Preferences)
          </h4>
          <p className="text-[10px] text-gray-400">智能过滤每日提醒，避免睡眠静夜打扰，定制私人流光节奏。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Whisper push and schedules */}
        <div className="space-y-3 bg-black/20 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">🌌 AI耳语每日呼唤</span>
              <span className="text-[9px] text-gray-400">设定每天它给你说秘密的时刻</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.aiWhisperEnabled}
              onChange={() => handleToggle("aiWhisperEnabled")}
              className="rounded bg-black text-pink-500 cursor-pointer w-4 h-4"
            />
          </div>

          {cfg.aiWhisperEnabled && (
            <div className="flex items-center gap-2 bg-indigo-950/20 border border-white/5 p-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[10px] text-gray-400 font-mono">触发时间面:</span>
              <select
                value={cfg.whisperTime}
                onChange={(e) => handleChangeTime(e.target.value)}
                className="bg-[#150a31] border border-white/10 text-xs rounded px-1.5 py-0.5 focus:outline-none cursor-pointer text-pink-300 font-mono"
              >
                <option value="08:00">早上 08:00 (元气满满)</option>
                <option value="10:00">上午 10:00 (阳光正好)</option>
                <option value="15:00">下午 15:00 (温馨午后)</option>
                <option value="20:00">晚间 20:00 (繁星夜读)</option>
                <option value="22:00">深夜 22:00 (寂静助眠)</option>
              </select>
            </div>
          )}
        </div>

        {/* Quiet period indicator */}
        <div className="space-y-3 bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                22:00-07:00 绝对静谧期
              </span>
              <span className="text-[9px] text-gray-400">静默免打扰：不发出任何高频呼吸或碰撞通知</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.globalQuietPeriod}
              onChange={() => handleToggle("globalQuietPeriod")}
              className="rounded bg-black text-pink-500 cursor-pointer w-4 h-4"
            />
          </div>
          
          <div className="text-[8px] text-blue-300 leading-normal bg-blue-500/5 p-1 rounded font-sans border border-blue-500/10">
            星云公规：每晚22时至次日晨7时属于星魂酣睡回朔期，消息将自动暂存，朝晖自启。
          </div>
        </div>

        {/* Anniversary Alerts and Social triggers */}
        <div className="space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">🎂 星连诞辰/忌日提醒</span>
              <span className="text-[9px] text-gray-400">重要共处纪念日提前 1 天触发共鸣提醒</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.anniversaryReminder}
              onChange={() => handleToggle("anniversaryReminder")}
              className="rounded bg-black text-pink-500 cursor-pointer w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">🪐 远端伙伴碰撞雷达</span>
              <span className="text-[9px] text-gray-400">在大世界偶遇并摩擦邻家默影时触发提醒</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.petInteractionCollision}
              onChange={() => handleToggle("petInteractionCollision")}
              className="rounded bg-black text-pink-500 cursor-pointer w-4 h-4"
            />
          </div>
        </div>

        {/* Sound FX and Likes/Gifts responses */}
        <div className="space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-green-400" />
                琴音和鸣 (Retro sound effects)
              </span>
              <span className="text-[9px] text-gray-400">操作、升级、完成和碰撞时播放和弦声音</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.soundEffects}
              onChange={() => handleToggle("soundEffects")}
              className="rounded bg-black text-green-500 cursor-pointer w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">🎁 礼物收到与点赞</span>
              <span className="text-[9px] text-gray-400">当邻居给宝贝送出星尘糖或留言时发出雷达声</span>
            </div>
            <input 
              type="checkbox"
              checked={cfg.giftsAndLikes}
              onChange={() => handleToggle("giftsAndLikes")}
              className="rounded bg-black text-pink-500 cursor-pointer w-4 h-4"
            />
          </div>
        </div>
      </div>
      
      {/* Footer advice */}
      <div className="bg-[#0b061e] border border-white/5 p-2 rounded-xl flex items-center gap-1.5 text-[9px] text-yellow-300">
        <ShieldCheck className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <span>根据《安全数据公约》，您的个人提醒与账号信息已实时离线缓存在浏览器和本地云密匣中。</span>
      </div>
    </div>
  );
}
