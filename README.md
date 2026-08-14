# 🌌 喵汪星云 (StarPuff)

> 2D 像素星云风 · 逝宠纪念 · AI 陪伴治愈系全栈应用
> React + TypeScript + Vite + Express + Three.js + Gemini AI

本仓库的目标是成为**寿命比一次 demo 更长**的项目基础设施：目录即架构，文档即契约，AI 与人类协作者遵循同一套工程规范。

---

## 🧭 快速导航（你想……→去看……）

| 你想…… | 去看 |
|---|---|
| 把项目跑起来 | [快速开始](#-快速开始) |
| 了解目录为什么这么分 | [目录结构](#-目录结构) + `docs/decisions/ADR-0001` |
| 了解七大星云场景的玩法设计 | `docs/design/Scene_Features_Design.md` |
| 理解核心数据结构（宠物/用户/场景契约） | `src/types.ts` |
| 作为 AI / 新成员接手本项目 | **`docs/AI_HANDOFF.md`（必读）** |
| 提交代码前确认规范 | `CODE_OF_CONDUCT.md` |
| 报告安全问题 | `SECURITY.md` |
| 查看历史源码合集快照 | `docs/archive/StarPuff_Source_Code.md` |

---

## 🚀 快速开始

**前置条件**：Node.js 18+

```bash
npm install                 # 安装依赖
# 在 .env.local 中设置 GEMINI_API_KEY（参照 .env.example）
npm run dev                 # 启动开发服务器（tsx server.ts，前后端一体）
npm run lint                # 类型检查（tsc --noEmit，提交前必过）
npm run build && npm start  # 生产构建并运行
```

注意：项目新增原生依赖 `better-sqlite3`，Windows 上需本机构建工具链或在 CI/构建机中预构建二进制。建议在开发机上运行 `npm install` 前确认已安装 Visual Studio Build Tools。CI 推荐使用 Node 22 环境。 

> 工程诚实性声明：`npm run lint` 是本地最低验证门槛；任何"已完成"的功能声明都必须以通过类型检查并能实际运行 `npm run dev` 为前提。

---

## 📁 目录结构

目录结构是分层架构的直接映射——**代码放在哪一层，就只能依赖哪一层**：

```
3d/
├── README.md                  ← 本文件：入口导航仪表盘
├── CODE_OF_CONDUCT.md         ← 命名 / 日期 / 类型契约 / 提交规范（人机共同契约）
├── SECURITY.md                ← 安全策略
├── server.ts                  ← 后端入口：Express + Gemini 陪伴信件生成引擎
├── src/
│   ├── types.ts               ← 核心类型契约（相当于 ICD：先改契约，再改实现）
│   ├── App.tsx                ← SPA 顶层路由与全局面板控制
│   ├── main.tsx / index.css
│   ├── audio/
│   │   └── AudioSynth.ts      ← 音效引擎（叶子模块，不依赖任何组件）
│   ├── scenes/                ← 场景渲染层（Canvas / Three.js）
│   │   ├── HomeCanvas.tsx         主页暖阳家宿 2D Canvas 渲染核心
│   │   ├── NebulaGateCanvas.tsx   星云之门大世界漫步与奇遇系统
│   │   ├── SceneInteractiveUI.tsx 场景内嵌交互 UI
│   │   └── CelestialV26Suite.tsx  天体系统套件
│   ├── pet3d/                 ← 3D 宠物层
│   │   ├── PetThreeOverlay.tsx    Three.js 宠物叠加渲染
│   │   ├── Pet3DReconstruction.tsx 照片→3D 宠物重建
│   │   └── ArCameraSimulation.tsx AR 相机模拟
│   ├── features/              ← 功能 UI 层（按领域分组）
│   │   ├── memorial/          纪念域：MemorialZone / MemoryAlbum /
│   │   │                      MemoryFlashbackModal / PetMemoryTimeline /
│   │   │                      AnniversaryManager / StardustCeremony
│   │   ├── social/            社交域：WishingWell / ResonanceSystem
│   │   └── system/            系统域：CheckInCalendar / NotificationSettings /
│   │                          OnboardingGuide / MultiPetSelector
│   ├── data/sceneDesigns.ts   ← 场景静态数据
│   ├── utils/date.ts          ← 本地日期工具（业务日期唯一入口，见 ADR-0002）
│   └── assets/                ← 图片等静态资源
├── public/models/             ← GLB 3D 模型资源
├── docs/
│   ├── design/                ← 玩法与场景设计文档
│   ├── decisions/             ← ADR 架构决策记录（保留"为什么"）
│   ├── archive/               ← 历史文档（归档而非删除）
│   └── AI_HANDOFF.md          ← AI/新成员交接协议（必读）
└── scripts/archive/           ← 一次性修补脚本归档（不再维护，仅留痕）
```

### 依赖方向禁令（宪法原则）

```
features/*  ─┐
scenes/*   ──┼─→ audio/  ─→ (无内部依赖)
pet3d/*    ──┘
所有层 ─→ types.ts（契约层，不依赖任何实现）
```

1. **Interface Before Implementation** — 改功能先改 `src/types.ts` 契约，再改实现。
2. **禁止跨层污染** — `audio/` 与 `types.ts` 永远不 import 任何组件；组件之间的复用必须下沉到对应层。
3. **归档而非删除** — 过时的文档/脚本移入 `archive/`，保留历史脉络。
4. **验证优先于声明** — "做完了" = `npm run lint` 通过 + 实际运行验证过。
5. **每个模块可替换** — 稳定的是目录分层与类型契约，而非具体实现。

---

## 🤝 人机协作

本项目把 AI 助手视为正式工程协作者：接手前必读 `docs/AI_HANDOFF.md`（含上机顺序、安全边界、未完成事项）；所有贡献者（人或 AI）都受 `CODE_OF_CONDUCT.md` 与上方宪法原则约束；重要架构取舍必须在 `docs/decisions/` 留下 ADR。
