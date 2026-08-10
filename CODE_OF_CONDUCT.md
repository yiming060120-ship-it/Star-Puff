# CODE_OF_CONDUCT.md — 工程规范（人机共同契约）

本文件是所有贡献者（人类与 AI）的单一事实来源。与口头约定冲突时，以本文件为准。

## 1. 目录与依赖

- 新代码必须放入 `README.md` 定义的分层目录中：`scenes/`（渲染）、`pet3d/`（3D 宠物）、`features/<域>/`（功能 UI）、`audio/`（音效）、`data/`（静态数据）。
- 依赖方向只允许向下：`features/scenes/pet3d` → `audio` / `types`；`audio` 与 `types.ts` 不得 import 任何组件。
- 新增一个功能域时，在 `features/` 下新建子目录，并在 README 目录树中登记。

## 2. 命名

- 组件文件：PascalCase（`MemoryAlbum.tsx`）；工具/引擎文件：PascalCase `.ts`（`AudioSynth.ts`）。
- 类型与接口：PascalCase（`PetConfig`）；常量：UPPER_SNAKE_CASE（`PET_MEMORIES`）。
- 文档：英文用 SNAKE/kebab 均可但同一目录内保持一致；ADR 必须编号（`ADR-0001-*.md`）。

## 3. 日期与时间

- 表示"今天"一律使用 `src/utils/date.ts` 的 `localDateString()`（本地时区 YYYY-MM-DD）。
- **禁止**用 `new Date().toISOString().split("T")[0]` 表示业务日期（UTC 穿越问题，见 ADR-0002）。

## 4. 类型契约

- 跨模块共享的数据结构一律定义在 `src/types.ts`，禁止在组件内重复定义同名类型。
- 修改 `types.ts` 中的既有字段视为破坏性变更：需在提交信息中说明，并检查所有引用点。

## 4. 提交

- 提交信息格式：`<type>: <摘要>`，type ∈ `feat / fix / refactor / docs / chore / archive`。
- 移动文件用 `git mv`，保留历史。
- 提交前必须通过 `npm run lint`（`tsc --noEmit`）。

## 5. 文档

- 重要架构取舍 → 在 `docs/decisions/` 新增 ADR（编号递增，状态：提议/接受/废弃）。
- 玩法与场景设计 → `docs/design/`。
- 过时文档/脚本 → 移入 `docs/archive/` 或 `scripts/archive/`，**归档而非删除**。
- 完成功能后同步更新 `docs/AI_HANDOFF.md` 的"当前状态"一节。

## 6. AI 协作者特别条款

- 开工前必读 `docs/AI_HANDOFF.md`。
- 不做信息不全的盲目操作：遇到"未知项清单"中的内容，先询问人类。
- 禁止声称未验证的成果；验证手段至少为 `npm run lint`，能运行时必须实际运行。
- 密钥只写入 `.env.local`，绝不提交（见 `SECURITY.md`）。
