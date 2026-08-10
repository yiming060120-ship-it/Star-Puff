/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { playSound } from "./AudioSynth";
import { Calendar, CheckCircle, Award, Star, ArrowRight, Zap, Gift } from "lucide-react";

interface CheckInCalendarProps {
  checkInCalendar: string[]; // list of dates, e.g. ["2026-05-21"]
  onCheckIn: (dayCoins: number, dateStr: string) => void;
  triggerToast: (msg: string) => void;
  lastCheckInDate?: string;
}

const CHECK_IN_ROSTER = [
  { day: 1, rewardCoins: 5, giftName: null },
  { day: 2, rewardCoins: 8, giftName: null },
  { day: 3, rewardCoins: 10, giftName: null },
  { day: 4, rewardCoins: 12, giftName: null },
  { day: 5, rewardCoins: 15, giftName: null },
  { day: 6, rewardCoins: 18, giftName: null },
  { day: 7, rewardCoins: 25, giftName: "🌟 高能星尘棒棒糖 x1" }
];

export default function CheckInCalendar({ checkInCalendar = [], onCheckIn, triggerToast, lastCheckInDate }: CheckInCalendarProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const hasCheckedInToday = checkInCalendar.includes(todayStr) || lastCheckInDate === todayStr;

  // Let's compute current continuous streak index
  const currentStreakCount = Math.min(7, checkInCalendar.length % 8 || (hasCheckedInToday ? 1 : 0));

  const handleCheckInNow = () => {
    if (hasCheckedInToday) {
      triggerToast("🛰️ 亲爱的，今天你已经收集过星海签到能量了，明天再来哦~");
      playSound("beep");
      return;
    }

    // Determine day indexing
    const nextDayNum = (checkInCalendar.length % 7) + 1;
    const rosterItem = CHECK_IN_ROSTER[nextDayNum - 1];
    const reward = rosterItem.rewardCoins;

    playSound("success");
    onCheckIn(reward, todayStr);
    
    if (rosterItem.giftName) {
      triggerToast(`🏆 极星重聚! 第 ${nextDayNum} 天连续签到，获得星尘币 +${reward} 并额外获赠 【${rosterItem.giftName}】！`);
    } else {
      triggerToast(`✨ 签到成功！连续升温第 ${nextDayNum} 天，获取星尘币 +${reward}！`);
    }
  };

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-4 shadow-xl" id="daily-checkin-calendar-box">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              📅 每日星轨签到日程
              <span className="text-[8px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
                STREAK
              </span>
            </h4>
            <p className="text-[10px] text-gray-400">连续对准星云锚点，唤醒更多沉睡星魂。</p>
          </div>
        </div>

        <button
          onClick={handleCheckInNow}
          disabled={hasCheckedInToday}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1 transition-all ${
            hasCheckedInToday
              ? "bg-slate-800 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-rose-500 text-white cursor-pointer hover:scale-105 active:scale-95"
          }`}
        >
          {hasCheckedInToday ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>今日已充能</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>收取今日星光</span>
            </>
          )}
        </button>
      </div>

      {/* Roster display alignment list */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {CHECK_IN_ROSTER.map((item, idx) => {
          const isCompleted = idx < checkInCalendar.length;
          const isTodayHighlight = !hasCheckedInToday && idx === (checkInCalendar.length % 7);
          
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                isCompleted
                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-200"
                  : isTodayHighlight
                    ? "bg-pink-600/20 border-pink-500 text-white animate-pulse"
                    : "bg-black/30 border-white/5 text-gray-500 hover:border-white/10"
              }`}
            >
              <span className="text-[9px] font-mono text-gray-400">D{item.day}</span>
              
              <div className="my-1.5 flex items-center justify-center">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                ) : item.giftName ? (
                  <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                ) : (
                  <Star className={`w-4 h-4 ${isTodayHighlight ? "text-pink-400" : "text-gray-600"}`} />
                )}
              </div>

              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] font-bold font-mono">+{item.rewardCoins}</span>
                <span className="text-[7px] text-gray-500 font-sans mt-0.5">星尘币</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional bonus telemetry banner */}
      <div className="bg-[#0b061e] border border-white/5 p-2 rounded-xl flex items-center justify-between text-[10px]">
        <span className="font-mono text-gray-400 flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          本期累计签到次数: 
          <strong className="text-pink-400 text-xs font-mono">{checkInCalendar.length}</strong> 次
        </span>
        <span className="text-[8.5px] text-zinc-500">
          第 7 天必得【高能星尘零食】🍬
        </span>
      </div>
    </div>
  );
}
