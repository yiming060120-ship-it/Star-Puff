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
- **架构**：遵守 `README.md` 的依赖方向禁令与 `CODE_OF_CONDUCT.md`；不为短期便利跨层引用。
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
- ✅ 安全加固与竞态修复（2026-09-26，见 `docs/decisions/ADR-0004`）：
  - 前端扣款原子化（`App.tsx` 的 `coinsRef` + `spendCoins`/`grantCoins`），消除连点扣成负数与白嫖；
  - `/api/mtx/grant` 增加订单真实性校验（新增 `microtransaction-api/orders.ts` 服务端订单注册表）；
  - 退款回收落盘、启动迁移不再覆盖 SQLite 余额、SQLite→本迁移空操作修复；
  - Express async 异常兜底 + 入参类型收敛（单请求不再打崩进程）；默认回环监听、mock 模式收敛；
  - 来信去重与生成配额持久化；3D 导出 GLTF 修复、渲染风格（xray/rig/voxel）与自转恢复。
- ✅ 文档体系整理（2026-09-26）：新增 `docs/README.md` 索引；散落根目录的构建/运行/下载日志归档至 `docs/archive/logs/`。

## 5. 未完成事项 / 已知欠账

- 🟡 无自动化测试与 CI；验证目前只有 `tsc --noEmit`，建议补充冒烟脚本。
- 🟡 `App.tsx`（2400+ 行）与 `HomeCanvas.tsx`（3900+ 行）仍是上帝组件：状态应抽离为 store/reducer。
- 🟡 双真值遗留：`activePet.statusXxx`（App state）与 `star_puff_*_<petId>`（localStorage）两套宠物指标未合并，目前以 HomeCanvas 的 localStorage 为实际生效方。
- 🟡 每日任务仅在应用加载时跨天重置；若用户挂机跨过零点，需刷新后才重置。
- 🟡 商店"永结星缘礼包"（combo）不解锁单件槽位，依赖渲染侧特判，需核对 `HomeCanvas` 对 combo 的渲染是否完整。
- 🟡 耳语封面图使用 Unsplash 外链，图床不可用时破图；无图片本地化/兜底。
- 🟡 ErrorBoundary 已建立，但错误体系（core/errors.ts）尚未在组件层全面接入消费，多数 catch 仍直接读 `error.message`。
- 🔴 无持久化数据库，用户数据仅存于浏览器本地（localStorage），刷新设备即丢失。
- 🟡 顶栏羁绊经验条恒为 0%：`exp` 字段在全仓库无任何递增路径，属未完成功能（需先定义经验来源与等级曲线）。
- 🟡 `HomeCanvas` 喂食特效颜色分支恒为粉色（仍在比较旧字符串 `"snack"/"milk"`，实际写入的是 emoji），待改为按食物 id 传色。
- 🟡 少量 `setTimeout` 未在组件卸载时清理（单击判定 300ms、喂食/拥抱/告别延时），属低危卫生问题。
- 🟡 `microtransaction-data/` 与 `microtransaction-api/data/` 下的 SQLite/发放账本曾被提交进 git，需执行 `git rm --cached -r microtransaction-data microtransaction-api/data` 取消跟踪（`.gitignore` 已补规则）。
- 🟡 本地验证现状（2026-09-26）：
  - `npm run lint`（`tsc --noEmit`）✅ 0 错误；`npm run build`（Vite 2673 模块 + esbuild `dist/server.cjs`）✅ 通过。
  - `npm run dev` 冒烟 ✅（Node 22；无 `GEMINI_API_KEY`，走离线引擎）：`/api/config/status` 200；`/api/chat` 传 `{"message":123}` → **400**、正常请求 200；`/api/whisper` 传 `{"recentEvents":123,"petType":5,"ownerName":{}}` → 200；`/api/growth-story` 传 `{"petName":{}}` → 200；`/api/reconstruct-3d` 传 `{"base64Image":123}` → 200。**连续 5 个畸形请求后进程仍存活** → ADR-0004「单请求打崩进程」修复已获实证。
  - ⛔ `/api/mtx/*` 全部返回 **503**（模块未加载），原因见下条；微交易全链路尚未验证。
- 🔴 本机 `better-sqlite3` 不可用（**环境级问题，与本轮代码改动无关**）：`new Database(':memory:')` 直接 `ACCESS_VIOLATION`（0xC0000005）硬崩溃，`try/catch` 无法兜底，后端在模块加载期即初始化数据库故打包产物一加载就崩。
  - 已排除的原因：二进制损坏（随包的 `prebuilds/win32-x64.node` 与**用本机 VS2019 BuildTools 从源码新编译**的 `build/Release/better_sqlite3.node` 均崩）；加载器选错文件（`process.dlopen` 探针确认加载路径正确）；系统性原生模块问题（`steamworks.js` 加载正常）；SQLite 本体问题（Node 22 内置 `node:sqlite` 读写正常）。
  - 结论：需在另一台机器 / CI（推荐 Linux 容器）验证 `/api/mtx/*` 全链路。
  - 附带认知修正：`npm rebuild better-sqlite3` 在本包上是**空操作**——其 `package.json` 为 `gypfile: false`，必须显式执行 `npm run build-release`（即 `node-gyp rebuild --release --force_build=1`）才会真正编译。
- 🟡 环境要求被低估：依赖实际要求 **Node ≥ 22**（`better-sqlite3@13`、`electron@43`、`concurrently@10`、`@electron/rebuild` 均在 `engines` 声明），而 `README.md` 写的是「Node.js 18+」。建议统一表述为 Node 22.12+。
- 🟡 `npm run dev`（tsx，ESM）下 `server.ts` 顶部的 `require("./microtransaction-api/index")` 会抛 `require is not defined`，被 try/catch 兜底后微交易模块**静默降级关闭**（所有 `/api/mtx/*` 返回 503），且警告文案误导为「better-sqlite3 原生模块不可用」。修复方向：`typeof require !== "undefined" ? require("…") : createRequire(...)("…")`，既保留 esbuild 的静态内联，又兼容 ESM。**本次未改动**（本机无法验证打包路径，避免引入回归）。

## 6. 未知项清单（遇到请先问人类，不要猜）

- Gemini API 的具体模型版本与配额策略。
- 微信小程序端（`metadata.json` 所述）与本 Web 端的关系与复用计划。
- 生产部署目标环境（`npm start` 之外无部署配置）。

---

*每次完成阶段性工作后，请更新第 4、5 节，保持本文件与仓库实况一致。*
