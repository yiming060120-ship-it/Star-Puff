/**
 * MtxLogPanel - 微交易日志查看面板
 *
 * 展示 mtxLogger 记录的所有购买日志，便于测试时观察模拟购买的完整链路。
 * 支持清空日志。可折叠。
 */

import React, { useEffect, useState } from "react";
import { mtxLogger, type MtxLogEntry } from "../../utils/mtxLogger";

const LEVEL_STYLE: Record<string, { color: string; label: string }> = {
  info: { color: "text-indigo-300", label: "INFO" },
  success: { color: "text-emerald-300", label: "OK" },
  warn: { color: "text-amber-300", label: "WARN" },
  error: { color: "text-rose-400", label: "ERROR" },
};

const STAGE_LABEL: Record<string, string> = {
  purchase: "流程",
  verify: "验证",
  init: "初始化",
  check: "查状态",
  finalize: "完成",
  grant: "发放",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}

export default function MtxLogPanel() {
  const [logs, setLogs] = useState<MtxLogEntry[]>(mtxLogger.getLogs());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsub = mtxLogger.subscribe(() => setLogs(mtxLogger.getLogs()));
    return unsub;
  }, []);

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-300 font-sans hover:text-white transition-colors"
        >
          <span className="text-xs">{collapsed ? "▶" : "▼"}</span>
          🧾 购买日志（{logs.length} 条）
        </button>
        <button
          onClick={() => mtxLogger.clear()}
          className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors font-sans"
        >
          清空
        </button>
      </div>

      {!collapsed && (
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-gray-500 font-sans">
              暂无购买日志，去充值中心试试吧
            </div>
          ) : (
            logs.map((log) => {
              const style = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info;
              return (
                <div
                  key={log.id}
                  className="px-3 py-1.5 border-b border-white/5 text-[10px] font-mono leading-relaxed"
                >
                  <span className="text-gray-500">{formatTime(log.timestamp)}</span>{" "}
                  <span className={style.color}>[{style.label}]</span>{" "}
                  <span className="text-purple-300">{STAGE_LABEL[log.stage] ?? log.stage}</span>{" "}
                  <span className="text-gray-200">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
