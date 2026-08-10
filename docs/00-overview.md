# 00 — 项目总览（AI 可读版）

> 阅读对象：AI 编程助手（Codex、Copilot 等）与人类新成员
> 前置阅读：无（本文件为入口）
> 后续阅读：`01-architecture.md`

---

## 1. 项目定义

**喵汪星云 (StarPuff)** 是一款基于 **React + TypeScript + Vite + Express + Three.js + Gemini AI** 的全栈 2D/3D 像素星云风逝宠纪念 AI 陪伴治愈系应用。

它允许用户为已逝宠物创建星尘化身，在星云大世界中漫游、接收 AI 生成的治愈耳语、与其他"看星人"社群互动。

---

## 2. 核心问题与目标

| 问题 | 目标 |
|------|------|
| 20 个组件平铺，无架构表达 | 分层目录映射架构（已完成，见 ADR-0001） |
| App 组件 2400+ 行，上帝组件 | 状态抽离、API 下沉、组件拆分 |
| 无错误边界，WebGL 崩溃白屏 | ErrorBoundary + 结构化错误体系 |
| API 调用散落组件内 | 统一 `src/api/` 层 |
| 文档散落，无系统编号 | 编号文档体系 + 文档同步矩阵 |

---

## 3. 系统分层架构

```
用户浏览器
    │
React SPA (Vite)        ← 前端渲染层
    │
┌───┼───────────────────────────────────┐
│   │  scenes/    3D/Canvas 场景渲染      │
│   │  pet3d/     3D 宠物模型             │
│   │  features/  功能 UI（按领域分组）     │
│   │  audio/     音效引擎（叶子模块）      │
│   │  api/       HTTP 请求封装层          │
│   │  core/      错误体系 + 校验 + 工具    │
│   │  types.ts   核心类型契约（ICD）       │
└───┼───────────────────────────────────┘
    │  fetch /api/*
    ▼
Express Server (tsx)    ← 后端
    │
Gemini API              ← AI 引擎
```

---

## 4. 分阶段路线图

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 0 | 目录分层重构（ADR-0001） | ✅ 完成 |
| Phase 1 | 数据完整性修复（ADR-0002） | ✅ 完成 |
| Phase 2 | 文档体系标准化 + core/ 抽象层 | ⏳ 进行中（ADR-0003） |
| Phase 3 | API 层分离 + ErrorBoundary + 代码拆分 | 待开始 |
| Phase 4 | 状态管理重构（App/HomeCanvas 上帝组件拆分） | 待开始 |

---

## 5. AI 编码铁律（8 条）

1. **类型契约优先**：改功能先改 `src/types.ts`，再改实现
2. **依赖方向单向**：`features/scenes/pet3d` → `audio` / `api` / `core` → `types`；下层不得 import 上层
3. **API 不耦合 UI**：所有 `fetch()` 调用必须在 `src/api/` 层，组件只调用 `api/` 导出的函数
4. **错误必结构化**：网络/AI 调用失败返回结构化错误对象（含 `code`/`message`/`suggestedAction`），不在 UI 中直接消费 `Error.message`
5. **破坏性必确认**：覆盖用户数据（清除宠物、重置存档）需显式确认
6. **验证优先于声明**：`npm run lint` 通过 + 实际运行验证过才能声称"完成"
7. **文档同步矩阵**：任何变更必须同步更新对应文档（见下表）
8. **一次性闭环**：一个功能 = 一个 api 函数 + 一个组件 + 一个测试场景

---

## 6. 文档同步矩阵

| 变更类型 | 必须同步更新的位置 |
|---------|------------------|
| 目录结构调整 | `README.md` §目录结构、`00-overview.md` §7、`01-architecture.md` §2 |
| 类型契约字段变更 | `02-types-and-contracts.md` + `src/types.ts` |
| API 路由/参数变更 | `03-api-design.md` + `src/api/` 对应文件 + `server.ts` |
| 新增/删除组件 | `01-architecture.md` §3 组件清单 |
| Phase 进度变化 | `00-overview.md` §4 + `README.md` |
| 依赖变更 | `package.json` + `01-architecture.md` §5 |

---

## 7. 文件结构速查

```
3d/
├── README.md                  ← 主入口（人类导航仪表盘）
├── CODE_OF_CONDUCT.md         ← 工程规范（人机共同契约）
├── SECURITY.md                ← 安全策略
├── server.ts                  ← 后端入口：Express + Gemini API
├── src/
│   ├── types.ts               ← 核心类型契约（ICD）
│   ├── App.tsx                ← SPA 顶层路由（正在拆分中）
│   ├── main.tsx / index.css
│   ├── core/                  ← 框架无关的通用逻辑
│   │   ├── errors.ts              结构化错误体系
│   │   └── validators.ts          校验工具
│   ├── api/                   ← HTTP 请求封装层（Phase 3）
│   ├── audio/AudioSynth.ts    ← 音效引擎（叶子模块）
│   ├── scenes/                ← 场景渲染层
│   ├── pet3d/                 ← 3D 宠物层
│   ├── features/              ← 功能 UI 层
│   │   ├── memorial/          纪念域（6 组件）
│   │   ├── social/            社交域（2 组件）
│   │   └── system/            系统域（4 组件）
│   ├── data/sceneDesigns.ts   ← 场景静态数据
│   └── utils/date.ts          ← 本地日期工具
├── docs/
│   ├── 00-overview.md          ← 本文件
│   ├── 01-architecture.md      ← 架构设计详解
│   ├── 02-types-and-contracts.md ← 类型契约与数据模型
│   ├── 03-api-design.md        ← API 接口设计
│   ├── 04-component-inventory.md ← 组件清单与依赖图
│   ├── 05-implementation-plan.md ← 分阶段实现计划
│   ├── 06-testing-strategy.md  ← 测试策略
│   ├── design/                 ← 玩法与场景设计
│   │   └── Scene_Features_Design.md
│   ├── decisions/              ← ADR 架构决策记录
│   │   ├── ADR-0001-layered-directory-structure.md
│   │   ├── ADR-0002-data-integrity-fixes.md
│   │   └── ADR-0003-documentation-and-core-abstraction.md
│   ├── archive/                ← 历史文档（归档而非删除）
│   └── AI_HANDOFF.md           ← AI/新成员交接协议
└── scripts/archive/            ← 一次性脚本归档
```

---

## 8. 当前进度

| 条目 | 状态 |
|------|------|
| 目录分层重构 | ✅ ADR-0001 |
| 数据完整性修复 | ✅ ADR-0002 |
| 文档体系标准化 | ⏳ 进行中（ADR-0003） |
| core/ 抽象层 | ⏳ 进行中 |
| api/ 请求封装层 | 待开始 |
| ErrorBoundary + 代码拆分 | 待开始 |
| App/HomeCanvas 上帝组件拆分 | 待开始 |
| 自动化测试 | 未开始 |

---

*文档版本：v1.0 | 最后更新：2026-08-10 | 下次应更新：core/ api/ 层建立后*
