# AI_HANDOFF.md — AI / 新成员交接协议

> 任何 AI 助手或新加入的人类工程师，动手前必须先读完本文件。
> 本文件回答四个问题：怎么跑、边界在哪、现在什么状态、还有什么没做完。

## 1. 上机顺序

```bash
npm install
# 复制 .env.example 为 .env.local，填入 GEMINI_API_KEY
npm run lint    # 必须通过；这是最低验证门槛
npm run dev     # tsx server.ts，前后端一体启动
```

## 2. 项目一句话

喵汪星云（StarPuff）：2D 像素星云风逝宠纪念 AI 陪伴应用。前端 React 19 + Vite + Three.js，后端 Express + Gemini API（`server.ts`），前后端同仓库、同进程启动。

## 3. 安全边界（不可逾越）

- **密钥**：`GEMINI_API_KEY` 只存在于 `.env.local`；任何代码、文档、提交中不得出现真实密钥。
- **依赖**：新增依赖前需说明理由；优先使用已有依赖（three / drei / fiber / motion / lucide-react）。
- **架构**：遵守 `README.md` 的依赖方向禁令与 `CONVENTIONS.md`；不为短期便利跨层引用。
- **数据**：本项目纪念数据是用户的情感资产，任何删除/覆盖型操作必须显式确认。

## 4. 当前状态

- ✅ 目录分层重构完成（2026-08-10，见 `docs/decisions/ADR-0001`），`tsc --noEmit` 通过。
- ✅ 数据完整性修复完成（2026-08-10，见 `docs/decisions/ADR-0002`）：本地日期规范、演示模式存档保护、宠物状态 id key、任务每日重置。
- ✅ 核心场景：暖阳家宿（`scenes/HomeCanvas`）、星云之门（`scenes/NebulaGateCanvas` + `data/sceneDesigns.ts`）。
- ✅ 3D 宠物：`pet3d/`（GLB 模型位于 `public/models/`）。
- ✅ 纪念/社交/系统功能域：`features/` 下 14 个组件。
- ✅ API 层提取（2026-08-10）：`src/api/index.ts` 封装 whisper/chat/reconstruct-3d/growth-story 四个后端接口。
- ✅ ErrorBoundary 组件（2026-08-10）：`src/components/ErrorBoundary.tsx` 捕获 WebGL 渲染崩溃，防止低端设备白屏。
- ✅ 跨平台 clean 脚本（2026-08-10）：`package.json` clean 使用 Node.js 内置 API，兼容 Windows/Linux/macOS。
- ✅ metadata.json 修正（2026-08-10）：移除"微信小程序"描述，与当前 Web SPA 实现一致。
- ✅ core/ 抽象层建立（2026-08-15，见 `docs/decisions/ADR-0003`）：`src/core/errors.ts`（结构化错误体系）+ `src/core/validators.ts`（校验工具）。
- ✅ API 层错误契约增强（2026-08-15）：`src/api/index.ts` 新增底层 `request()`，网络/HTTP/解析错误统一收敛为结构化结果，fetch 断网不再向上抛异常。
- ✅ 内购微交易链路完整（后端 mock 模式全通，前端 useMicrotransaction 六步闭环 + mtxLogger 日志面板）。

## 5. 未完成事项 / 已知欠账

- 🟡 无自动化测试与 CI；验证目前只有 `tsc --noEmit`，建议补充冒烟脚本。
- 🟡 `App.tsx`（2400+ 行）与 `HomeCanvas.tsx`（3900+ 行）仍是上帝组件：状态应抽离为 store/reducer。
- 🟡 双真值遗留：`activePet.statusXxx`（App state）与 `star_puff_*_<petId>`（localStorage）两套宠物指标未合并，目前以 HomeCanvas 的 localStorage 为实际生效方。
- 🟡 每日任务仅在应用加载时跨天重置；若用户挂机跨过零点，需刷新后才重置。
- 🟡 商店"永结星缘礼包"（combo）不解锁单件槽位，依赖渲染侧特判，需核对 `HomeCanvas` 对 combo 的渲染是否完整。
- 🟡 耳语封面图使用 Unsplash 外链，图床不可用时破图；无图片本地化/兜底。
- 🟡 ErrorBoundary 已建立，但错误体系（core/errors.ts）尚未在组件层全面接入消费，多数 catch 仍直接读 `error.message`。
- 🔴 无持久化数据库，用户数据仅存于浏览器本地（localStorage），刷新设备即丢失。

## 6. 未知项清单（遇到请先问人类，不要猜）

- Gemini API 的具体模型版本与配额策略。
- 微信小程序端（`metadata.json` 所述）与本 Web 端的关系与复用计划。
- 生产部署目标环境（`npm start` 之外无部署配置）。

---

*每次完成阶段性工作后，请更新第 4、5 节，保持本文件与仓库实况一致。*
