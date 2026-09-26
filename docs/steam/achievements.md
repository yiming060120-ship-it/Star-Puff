# 喵汪星云 StarPuff — Steam 成就清单

> 本文档用于在 Steamworks 后台登记成就。API 名（Achievement API Name）必须与
> `src/steam/achievements.ts` 中的常量完全一致，否则成就不会触发。
> 每个成就建议附带图标（256×256 PNG），显示名与描述按后台填写。

| API 名 | 显示名（建议） | 描述（建议） | 触发点 |
|---|---|---|---|
| `ach_first_check_in` | 初次相遇 | 完成首次签到 | App.tsx `handleCheckIn` |
| `ach_7_day_streak` | 七天星轨 | 连续签到满 7 天 | App.tsx 累计检测（`user.streakDays ≥ 7`） |
| `ach_first_whisper` | 第一声耳语 | 首次生成陪伴耳语 | App.tsx 耳语生成成功 |
| `ach_first_3d_reconstruct` | 全息归位 | 首次完成 3D 重建并同步 | Pet3DReconstruction.tsx `handleApplyToPet` |
| `ach_first_purchase` | 初次补给 | 首次完成内购 | App.tsx `handleGranted` |
| `ach_coins_1000` | 星辰富翁 | 星尘币累计 ≥ 1000 | App.tsx 累计检测（`user.stardustCoins ≥ 1000`） |
| `ach_pet_level_10` | 成长十级 | 任一宠物等级 ≥ 10 | App.tsx 累计检测（`max(allPets.level) ≥ 10`） |
| `ach_multi_pets` | 家族兴旺 | 同时拥有 2 只及以上宠物 | App.tsx 累计检测（`allPets.length ≥ 2`） |

## 说明

- 全部成就均通过 `src/steam/achievements.ts` 的 `unlock()` 幂等触发：
  - Steam 不可用（客户端未运行/浏览器模式）时自动降级为 no-op，不影响游戏。
  - 已触发成就用 `localStorage` 的 `starpuff_ach_*` 标记避免重复 IPC。
- 累计型成就（连签/星尘币/等级/多宠）在 App.tsx 根组件 effect 中随状态变化检测，事件型成就（签到/耳语/3D 重建/内购）在业务事件处插桩。
- 如需在 Steam 后台删除成就（如开发期改名），旧名必须先在后台移除，改名后重新发布 Depot。

## 在 Steamworks 后台登记步骤

1. Steamworks → 你的 App → 「成就 / 统计」→「新建成就」。
2. API 名严格按上表填写（如 `ach_first_check_in`）。
3. 上传图标（256×256）、填写显示名与描述。
4. 发布到公开（上线 App Build 时生效）。
