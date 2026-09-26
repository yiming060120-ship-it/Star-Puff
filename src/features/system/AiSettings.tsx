/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 模式设置：默认离线模板可玩；桌面版可在此保存 GEMINI_API_KEY 开启 Gemini 在线 AI。
 * 密钥仅存于本机 userData/config.json（不进云存档），浏览器预览模式仅展示当前模式。
 */
import { useEffect, useState } from "react";
import { getAiConfigStatus, setGeminiKey as setGeminiKeyRemote } from "../../api";

interface Props {
  triggerToast: (text: string) => void;
}

export default function AiSettings({ triggerToast }: Props) {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const isElectron = Boolean(window.starPuff);

  async function refreshStatus() {
    try {
      const status = await getAiConfigStatus();
      setAiEnabled(Boolean(status.aiEnabled));
    } catch {
      setAiEnabled(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    window.starPuff?.config.getGeminiKey().then((k) => setKey(k ?? ""));
  }, []);

  async function save(newKey: string) {
    setSaving(true);
    try {
      if (isElectron) await window.starPuff!.config.setGeminiKey(newKey);
      await setGeminiKeyRemote(newKey); // 让运行中的服务立即生效（浏览器模式也适用）
      setKey(newKey);
      await refreshStatus();
      triggerToast(newKey ? "✨ 已开启 Gemini 在线灵犀" : "🌙 已切回离线模板模式");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-black/30 border border-cyan-500/20 rounded-xl p-4 space-y-3">
      <span className="text-[10px] uppercase tracking-widest text-[#06d6a0] font-mono block flex items-center gap-1">
        🤖 灵犀在线模式设置
      </span>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">当前模式：</span>
        <span
          className={`font-mono px-2 py-0.5 rounded ${
            aiEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {aiEnabled ? "Gemini 在线" : "离线模板"}
        </span>
      </div>

      {isElectron ? (
        <>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="GEMINI_API_KEY（留空并保存 = 离线模式）"
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-400/50"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-gray-400 hover:text-white text-xs px-2"
              title={showKey ? "隐藏" : "显示"}
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => save(key.trim())}
              disabled={saving}
              className="flex-1 bg-cyan-500/20 border border-cyan-400/30 rounded px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存并应用"}
            </button>
            {key && (
              <button
                onClick={() => save("")}
                className="px-3 py-2 text-xs text-red-300 hover:text-red-200"
              >
                清除密钥
              </button>
            )}
          </div>
          <p className="text-[9px] text-gray-500 leading-relaxed">
            密钥仅存于本机 userData/config.json，不会进入云存档。前往 ai.google.dev 申请免费 key。
          </p>
        </>
      ) : (
        <p className="text-[9px] text-gray-500 leading-relaxed">
          网页预览模式：在线灵犀由服务端环境变量 GEMINI_API_KEY 控制。安装桌面版后即可在此保存密钥。
        </p>
      )}
    </div>
  );
}
