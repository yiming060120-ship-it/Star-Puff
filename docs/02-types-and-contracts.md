# 02 — 类型契约与数据模型

> 阅读对象：AI 编程助手与开发者
> 前置阅读：`01-architecture.md`
> 后续阅读：`03-api-design.md`

---

## 1. 契约原则

- `src/types.ts` 是项目唯一的跨模块类型来源
- 组件/模块禁止重复定义同名类型
- 修改既有字段视为破坏性变更，需检查引用点并说明
- 新增字段必须向后兼容（可选标记 `?`）

---

## 2. 核心数据模型

### 2.1 PetConfig（宠物配置）

完整定义见 `src/types.ts`。关键约束：
- `id` 可选但强烈建议赋值：创建时兜底生成 `pet_<ts>_<random>`，作为 localStorage key
- `type` 支持 6 种：猫/狗/兔/鸟/仓鼠/其他
- 两套状态指标共存（历史债）：`moodLevel/happiness`（旧）与 `statusMood/statusHunger/statusCleanliness/statusEnergy`（V2），**当前实际生效的是 HomeCanvas localStorage 版本**

### 2.2 StarPuffUser（用户状态）

- `membership`: `"free" | "vip_month" | "vip_year"`（上帝模式通过快照机制保护真实值）
- `stardustCoins`: 星尘币，非负整数
- `activePet`: 当前激活的宠物，可为 `null`
- `allPets`: 多宠列表
- `outfitsEquipped`: 四槽位装备系统（halo/trail/orbit/cape）
- `checkInCalendar`: 本地日期字符串数组，用于签到判定

### 2.3 其他模型

| 接口 | 用途 | 关键约束 |
|------|------|---------|
| `Pet3DModelConfig` | 3D 重建骨骼数据 | `sourceImage` 为 base64 字符串 |
| `StoreItem` | 商店商品 | `type: "outfit" | "snack" | "gift"` |
| `TaskItem` | 每日任务 | `completedTimes <= maxTimes`，跨天重置 |
| `Landmark` | 星云之门地标 | `x, y` 为 Canvas 百分比坐标 |
| `PetWhisper` | 治愈耳语 | `coverImage` 当前使用 Unsplash 外链 |
| `CommunityPost` | 社区帖子 | `comments` 数组内联 |

---

## 3. 数据存储策略

| 存储键 | 数据类型 | 说明 |
|--------|---------|------|
| `starpuff_user` | `StarPuffUser` | 用户全量状态 |
| `starpuff_whispers` | `PetWhisper[]` | 耳语历史 |
| `starpuff_comp_posts` | `CommunityPost[]` | 社区帖子 |
| `starpuff_tasks` | `TaskItem[]` | 每日任务 |
| `starpuff_tasks_date` | `string` | 任务日期（本地 YYYY-MM-DD） |
| `starpuff_food` | `Record<string, number>` | 食物库存 |
| `starpuff_chat_history_v2` | `ChatMessage[]` | 聊天历史（防抖写入） |
| `starpuff_economy_backup` | `Partial<StarPuffUser>` | 上帝模式经济快照 |
| `star_puff_{stat}_{petId}` | `number` | 宠物状态（mood/energy/hunger/clean/level/exp/intimacy） |
| `starpuff_unlocked_memories` | `string[]` | 已解锁回忆 ID |
| `starpuff_bonding_charge` | `number` | 羁绊充能进度 |

**已知风险**：无加密、无迁移版本号、无配额限制——仅适合 demo 阶段。

---

## 4. 类型契约变更检查清单

修改 `types.ts` 后必须检查：
- [ ] `App.tsx` 中 `DEFAULT_KITTEN` 等种子数据
- [ ] 所有引用该类型的组件 props 解构
- [ ] `api/` 层请求/响应类型映射
- [ ] `server.ts` 中对应的请求 body 解析
- [ ] 更新本文档 §2 对应条目

---

*文档版本：v1.0 | 最后更新：2026-08-10*
