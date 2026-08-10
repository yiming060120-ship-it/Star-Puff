# ADR-0001: 按领域分层重组目录结构

- 状态：已接受
- 日期：2026-08-10
- 决策者：项目维护者 + AI 协作者

## 背景

项目从 AI Studio 导出时，全部 20 个组件平铺在 `src/components/`，根目录散落一次性 Python 修补脚本与源码合集 Markdown，README 为模板占位文本。随着场景（2D Canvas / Three.js 3D）与功能域（纪念/社交/系统）增多，平铺结构无法表达架构，AI 协作时也容易产生跨层引用。

参照 Project Prometheus 的工程理念：**目录结构应直接映射分层架构**，文档呈"入口→哲学→决策→过程"金字塔，过时产物归档而非删除。

## 决策

1. `src/components/` 拆分为四层：
   - `src/audio/` — 音效引擎（叶子模块，零内部依赖）
   - `src/scenes/` — 场景渲染层（Canvas / Three.js）
   - `src/pet3d/` — 3D 宠物层
   - `src/features/{memorial,social,system}/` — 功能 UI 层，按领域分组
2. `src/types.ts` 确立为契约层：任何共享类型只能定义于此。
3. 一次性脚本归入 `scripts/archive/`，源码合集归入 `docs/archive/`，设计文档归入 `docs/design/` —— 归档而非删除。
4. 建立 `docs/decisions/` ADR 机制，本文件为第一篇。

## 后果

- 正面：依赖方向可被肉眼检查（看 import 路径深度即可）；新功能归属明确；AI 协作者有章可循。
- 代价：既有 import 全部改写（已完成并通过 `tsc --noEmit`）；后续新增模块需自觉遵守分层禁令。
- 约束：`audio/` 与 `types.ts` 不得 import 任何组件；违反者应在 code review 中打回。
