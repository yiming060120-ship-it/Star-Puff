# docs/ — 文档索引

> 本目录是「文档即契约」的落点。所有文档按用途分类，**归档而非删除**（见 `README.md` 宪法原则 3）。
> 首次接手请先读 `AI_HANDOFF.md`，再按需查阅下表。

## 阅读顺序建议

```
AI_HANDOFF.md  →  00-overview.md  →  01-architecture.md  →  02-types-and-contracts.md
（怎么跑/边界/现状）  （项目是什么）    （分层怎么设计）      （数据契约是什么）
```

## 目录

| 文档 | 用途 | 何时需要更新 |
|---|---|---|
| [`AI_HANDOFF.md`](./AI_HANDOFF.md) | **AI/新成员交接协议**：上机顺序、安全边界、当前状态、已知欠账 | 每次阶段性工作完成后（第 4、5 节） |
| [`00-overview.md`](./00-overview.md) | 项目总览、路线图、AI 编码铁律、文档同步矩阵 | Phase 进度变化 |
| [`01-architecture.md`](./01-architecture.md) | 分层架构详解、依赖方向、组件清单 | 新增/删除组件、依赖变更 |
| [`02-types-and-contracts.md`](./02-types-and-contracts.md) | 核心类型契约与数据模型 | `src/types.ts` 字段变更 |
| [`HANDOVER_MICROTRANSACTIONS.md`](./HANDOVER_MICROTRANSACTIONS.md) | 微交易模块运维手册：密钥、持久化、故障排查 | 微交易路由/表结构变更 |

## decisions/ — 架构决策记录（ADR）

保留「为什么这么做」的历史脉络，冲突时以最新 ADR 为准。

| ADR | 主题 | 日期 |
|---|---|---|
| [`ADR-0001`](./decisions/ADR-0001-layered-directory-structure.md) | 分层目录结构 | 2026-08-10 |
| [`ADR-0002`](./decisions/ADR-0002-data-integrity-fixes.md) | 数据完整性：本地日期、存档保护、状态存储 key | 2026-08-10 |
| [`ADR-0003`](./decisions/ADR-0003-documentation-and-core-abstraction.md) | 文档体系标准化 + `core/` 抽象层 | 2026-08-15 |
| [`ADR-0004`](./decisions/ADR-0004-security-hardening-and-race-fixes.md) | 安全加固与竞态修复：原子钱包、发放鉴权、持久化去重 | 2026-09-26 |

## design/ — 玩法与场景设计

- [`design/Scene_Features_Design.md`](./design/Scene_Features_Design.md)：七大星云场景的玩法设定。

## steam/ — 发布与上架

- [`steam/achievements.md`](./steam/achievements.md)：成就定义。
- [`steam/release-checklists/`](./steam/release-checklists/)：上线计划、直发流程、商店页文案。

## archive/ — 历史归档（只读）

- [`archive/StarPuff_Source_Code.md`](./archive/StarPuff_Source_Code.md)：重构前的源码合集快照。
- [`archive/PR_DESCRIPTION-microtransaction-hardening.md`](./archive/PR_DESCRIPTION-microtransaction-hardening.md)：微交易加固 PR 说明（已合并）。
- [`archive/logs/`](./archive/logs/)：开发期构建/运行/下载日志，见该目录内 README。

## 维护约定

1. **新增文档**：放入对应分类目录，并回到本文件登记一行。
2. **过时文档**：移入 `archive/`，不要删除。
3. **决策类内容**：写入 `decisions/ADR-XXXX-*.md`，编号递增，格式对齐已有 ADR（状态/日期/决策者/背景/决策/后果）。
4. **状态类内容**：更新 `AI_HANDOFF.md` 第 4、5 节，保持与仓库实况一致。
