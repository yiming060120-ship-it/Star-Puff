# ADR-0003: 文档体系标准化与 core/ 抽象层建立

- 状态：已接受
- 日期：2026-08-15
- 决策者：项目维护者 + AI 协作者

## 背景

ADR-0001 完成了目录分层，ADR-0002 完成了数据完整性修复。但项目仍存在两个结构性欠账：

1. **文档体系不完整**：`00-overview.md` §7 规划的文档（`03-api-design.md`、`04-component-inventory.md`、`05-implementation-plan.md`、`06-testing-strategy.md`）尚未创建；`ADR-0003` 被提前引用但文件缺失。
2. **core/ 抽象层缺失**：`01-architecture.md` §2.1 规划了 `core/errors.ts`（结构化错误体系）与 `core/validators.ts`（校验工具），但 `src/core/` 目录不存在。所有 AI/网络调用失败仍以裸 `Error.message` 或 `res.json()` 直接透传，UI 层无结构化错误可消费，且 `fetch` 断网时会抛出未捕获异常，存在"按钮点击后无响应"的隐患。

## 决策

1. **建立 `src/core/` 抽象层**（框架无关、纯 TypeScript、零 UI/网络依赖）：
   - `errors.ts`：`AppError` 基类 + `NetworkError` / `ApiError` / `ValidationError` / `StateCorruptionError` / `WebGLError` 子类型，统一携带 `code` / `message` / `suggestedAction` / `context`，并提供 `toAppError()` 收敛未知异常。
   - `validators.ts`：`validatePetConfig()` / `assertNonEmpty()` / `assertNumberRange()` / `isUsableUser()`，只依赖 `errors.ts` 与 `types.ts`。
2. **改造 `src/api/` 请求封装层**：新增底层 `request()` 帮助函数，把网络错误、HTTP 非 2xx、JSON 解析失败统一收敛为结构化结果（`{ success, data?, error? }`），**永不向上层抛出未捕获异常**；所有 API 函数改为走 `request()`，对外返回类型签名保持不变（不破坏现有调用方）。
3. **文档体系标准化**：以 `00-overview.md` 为入口，按编号金字塔组织文档；`ADR-0003`（本文件）落地；进度表与 `AI_HANDOFF.md` 同步更新。

## 后果

- 正面：
  - UI 层可依据 `AppError.code` / `suggestedAction` 做针对性降级（重试 / 离线兜底 / 修正输入 / 重置存档）。
  - `fetch` 断网不再导致异常冒泡，消除"点击无反应"隐患。
  - 依赖方向依然单向：`api/ → core/ → types.ts`，符合 ADR-0001 的分层禁令。
- 代价：
  - `api/index.ts` 所有函数内部实现改为 `request()`，但对外签名不变，调用方零改动。
  - 新增 `core/` 层后，后续新增错误类型/校验规则需在此集中登记，避免散落。
- 约束：
  - `core/` 不得 import `api/` 或任何组件；`errors.ts` 零内部依赖；`validators.ts` 仅依赖 `errors.ts` + `types.ts`。
