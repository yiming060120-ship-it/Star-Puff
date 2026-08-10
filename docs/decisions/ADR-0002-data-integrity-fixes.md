# ADR-0002: 数据完整性修复——本地日期规范、演示模式存档保护、宠物状态存储 key

- 状态：已接受
- 日期：2026-08-10
- 决策者：项目维护者 + AI 协作者

## 背景

全项目审查发现三类会持续腐蚀用户数据的问题：

1. **UTC 日期穿越**：`new Date().toISOString().split("T")[0]` 使用 UTC 日期，UTC+8 用户早 8 点前被判定为"昨天"，导致签到可重复/无法签到、耳语日期错乱。
2. **演示模式写穿存档**：上帝/访客模式切换时直接把伪造的会员/星尘币数值写入 `user` state 并经 `useEffect` 持久化，用户的真实经济数据被永久覆盖（切访客模式后真实币数被重置为 15）。
3. **宠物状态 key 不稳定**：`HomeCanvas` 的心情/能量/等级等 7 项指标以宠物**名字**为 localStorage key，同名宠物互相覆盖、改名后旧数据成为孤儿；且与 `App` 中 `activePet.statusXxx` 字段形成两套从不互通的真值。

## 决策

1. **本地日期单一入口**：新增 `src/utils/date.ts` 的 `localDateString()`，全项目禁止使用 `toISOString().split("T")[0]` 表示"今天"（写入 CONVENTIONS）。
2. **快照-恢复机制**：进入上帝模式前把真实经济字段（membership/unlimitedTalks/dialogsRemaining/dialogsMax/stardustCoins）快照到 `starpuff_economy_backup`（localStorage，防止刷新丢失）；切回访客模式时恢复这些字段但**保留演示期间获得的其他进度**（宠物、装扮等）；初始化时若发现遗留备份则优先合并。
3. **稳定 id 作为存储 key**：`PetConfig` 新增可选 `id` 字段，创建宠物时兜底生成 `pet_<timestamp>_<random>`；`HomeCanvas` 读写统一用 `id ?? name`，并对旧 name key 做一次性兼容读取（懒迁移）。
4. **每日任务重置**：任务持久化时记录本地日期 `starpuff_tasks_date`，加载时跨天则重置 `completedTimes`；同时修复首登奖励种子值（1→0）使其真正可触发。

## 附带修复（同批次）

- `server.ts`：Gemini 多模态 `contents` 改为标准 Content 数组；`express.json({ limit: "15mb" })` 承载 base64 图片；`PORT` 支持环境变量；SPA fallback 改用正则路由（兼容 Express 5）；500 响应不再向前端泄露内部错误细节。
- `HomeCanvas` 4 个存量类型错误（`gestureAction` 缺 `long-press-3s`、恒假比较、失效的 `setShowGuide` 按钮、渲染模式数组类型）。
- `AudioSynth` 主振荡链路 `onended` 断开节点；聊天历史持久化 400ms 防抖。
- `@` 别名从项目根收敛到 `src/`；`CelestialV26Suite` 的 `NodeJS.Timeout` 误用改为 `ReturnType<typeof setInterval>`。

## 后果

- 正面：签到/任务/耳语日期行为可预期；演示模式成为真正的沙盒；宠物状态与宠物实体绑定而非名字。
- 代价：访客模式不再强制伪造"免费账号"数值，而是展示真实账号数据——演示"免费体验"需另行构造测试数据。
- 遗留：`App` 的 `activePet.statusXxx` 与 `HomeCanvas` localStorage 指标仍是双真值（本次仅统一 key 策略），彻底合并需状态管理层重构，留待 ADR-0003 级别的上帝组件拆分。
