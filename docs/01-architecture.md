# 01 — 架构设计详解（AI 可读版）

> 阅读对象：AI 编程助手与开发者
> 前置阅读：`00-overview.md`
> 后续阅读：`02-types-and-contracts.md`、`03-api-design.md`

---

## 1. 分层架构总览

采用 **六层分层架构**，依赖方向为：**上层依赖下层，下层绝不依赖上层**。

```
Layer 0 (用户):    浏览器 / 用户交互
Layer 1 (UI 层):   features/ + scenes/ + pet3d/  ← React 组件
Layer 2 (API 层):  api/                             ← fetch 封装
Layer 3 (Core 层): core/                            ← 纯 TypeScript，零框架依赖
Layer 4 (契约层):  types.ts                         ← 数据契约，不依赖任何实现
Layer 5 (底层):    audio/                           ← 音效引擎（叶子模块）
```

### 依赖方向禁令

```
features/*  ─┐
scenes/*   ──┼─→ api/ ─→ core/ ─→ types.ts
pet3d/*    ──┘
                    └─→ audio/  ─→ (零内部依赖)
```

**禁止**：
- `types.ts` import 任何组件或服务
- `audio/` import 任何组件
- `core/` import `api/` 或任何组件
- 组件之间直接 import（除同层兄弟组件按领域分组内允许）

---

## 2. 各层详细设计

### 2.1 Core 层（核心层）

| 属性 | 说明 |
|------|------|
| **位置** | `src/core/` |
| **职责** | 提供不依赖 React、不依赖网络、不依赖浏览器的通用逻辑 |

**子模块**：

| 文件 | 职责 | 关键导出 |
|------|------|---------|
| `errors.ts` | 结构化错误体系 | `AppError` 基类 + 子类型 |
| `validators.ts` | 数据校验工具 | `validatePetConfig()`, `assertNonEmpty()` |

**依赖规则**：
- `errors.ts` → 不依赖任何其他模块
- `validators.ts` → 只依赖 `errors.ts` + `types.ts`

### 2.2 API 层（接口层）

| 属性 | 说明 |
|------|------|
| **位置** | `src/api/` |
| **职责** | 封装所有 HTTP 请求，返回结构化结果 |

**函数列表**（按端点分组）：

| 函数 | 端点 | 风险 |
|------|------|------|
| `sendChatMessage()` | `POST /api/chat` | 低 |
| `generateWhisper()` | `POST /api/whisper` | 低 |
| `reconstruct3D()` | `POST /api/reconstruct-3d` | 中（含 base64 图片） |
| `generateGrowthStory()` | `POST /api/growth-story` | 低 |

**返回值契约**：每个函数返回 `{ success: boolean; data?: T; error?: AppError }`，组件永远不直接消费 `fetch().catch()`。

### 2.3 UI 层（组件层）

| 目录 | 职责 | 组件数 | 平均行数 |
|------|------|--------|---------|
| `features/memorial/` | 纪念域（回忆、周年、升星仪式） | 6 | ~280 |
| `features/social/` | 社交域（许愿、共振） | 2 | ~220 |
| `features/system/` | 系统域（签到、通知、引导、多宠） | 4 | ~180 |
| `scenes/` | 场景渲染（Canvas/Three.js） | 4 | ~1700 ⚠️ |
| `pet3d/` | 3D 宠物（WebGL 渲染） | 3 | ~870 |

**待拆组件**：
- `App.tsx`（2423 行）：需拆分为布局壳 + 状态 store + 路由逻辑
- `HomeCanvas.tsx`（3945 行）：需拆分为渲染核心 + 天气/代谢子系统 + 手势处理
- `CelestialV26Suite.tsx`（2096 行）：独立页面，可通过 Suspense 惰性加载
- `Pet3DReconstruction.tsx`（1764 行）：独立面板，可通过 Suspense 惰性加载

### 2.4 契约层

| 文件 | 关键接口 | 用途 |
|------|---------|------|
| `types.ts` | `PetConfig` | 宠物核心数据模型 |
| | `StarPuffUser` | 用户状态（含经济系统） |
| | `StoreItem` | 商店商品 |
| | `TaskItem` | 每日任务 |
| | `Landmark` | 大世界地标 |
| | `PetWhisper` / `CommunityPost` | 社交/耳语内容 |

---

## 3. 数据流

### 3.1 正常流程（以 AI 对话为例）

```
用户输入 → App.handleSendChatMessage()
    → api/sendChatMessage(payload)
        → fetch("/api/chat")
            → server.ts → Gemini API
        ← { success: true, data: { text: "..." } }
    → setChatMessages(prev => [...prev, petMsg])
    → 防抖持久化 localStorage
```

### 3.2 错误流程

```
用户输入 → api/sendChatMessage(payload)
    → fetch 失败 / 超时
    ← { success: false, error: NetworkError }
    → ErrorBoundary 捕获（React 渲染异常）
       或 toast 提示 + 兜底回复（业务降级）
```

### 3.3 确认流程（破坏性操作）

```
用户点击"清除星谱" → window.confirm("⚠️ 确认删除？")
    → 确认后：更新 user state → 清除 localStorage → toast
    → 取消：无操作
```

**当前缺陷**：`window.confirm` 在移动端 WebView 体验差，未来应替换为自定义 ConfirmDialog 组件。

---

## 4. 错误体系

```
AppError (基类)
├── NetworkError             # 网络请求失败（超时、断网）
│   └── message: "网络连接不稳定，请检查网络"
│   └── suggestedAction: "retry" | "offline"
├── ApiError                 # 服务端返回非 2xx
│   └── message: "AI 服务暂时不可用"
│   └── suggestedAction: "retry" | "use_fallback"
├── ValidationError          # 客户端校验失败
│   └── message: "宠物名字不能为空"
│   └── suggestedAction: "fix_input"
├── StateCorruptionError     # 持久化数据损坏
│   └── message: "存档数据损坏，已恢复默认"
│   └── suggestedAction: "reset" | "ignore"
└── WebGLError               # WebGL 初始化失败
    └── message: "您的设备不支持 3D 渲染，已切换到 2D 模式"
    └── suggestedAction: "fallback_2d"
```

每个错误携带：`code`、`message`（用户可见）、`suggestedAction`（给 UI 层的行为建议）、`context`（调试信息）。

---

## 5. 技术栈与依赖

| 类别 | 选型 | 版本 |
|------|------|------|
| 运行时 | Node.js + tsx | 18+ |
| 前端框架 | React | 19.x |
| 构建 | Vite + esbuild | 6.x |
| 3D 引擎 | Three.js + @react-three/fiber + @react-three/drei | 0.184 |
| AI 引擎 | @google/genai (Gemini) | 1.29 |
| UI 图标 | lucide-react | 0.546 |
| 动画 | motion | 12.23 |
| CSS | Tailwind CSS | 4.x |
| 后端 | Express | 4.x |
| 类型检查 | TypeScript | 5.8 |

---

## 6. 安全边界

以下操作**绝不自动执行**，必须人工确认：
1. 清除宠物星谱档案（已有 `window.confirm`，需改进）
2. 重置用户所有数据
3. 发送真实支付请求（当前仅模拟，上线前需接入正规支付 SDK）
4. 向第三方 API 发送用户个人数据

---

*文档版本：v1.0 | 最后更新：2026-08-10 | 下次应更新：API 层建立后更新 §2.2*
