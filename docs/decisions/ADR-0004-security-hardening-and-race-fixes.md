# ADR-0004: 安全加固与竞态修复——原子钱包、发放鉴权、持久化去重

- 状态：已接受
- 日期：2026-09-26
- 决策者：项目维护者 + AI 协作者
- 关联：ADR-0002（数据完整性）、ADR-0003（文档与 core 抽象层）

## 背景

对全仓库做了一轮深度缺陷审查（前端 `App.tsx` / `HomeCanvas.tsx` / `NebulaGateCanvas.tsx`、3D 层 `pet3d/`、功能域 `features/`、数据层 `hooks/` + `utils/`，以及后端 `server.ts` + `microtransaction-api/`）。审查只接受**有代码证据、可复现**的问题，剔除架构性欠账（已在 ADR-0002 与本文件「遗留」中登记）。

审查结论可归纳为六类系统性缺陷：

1. **扣款竞态**：所有消费点都是「用渲染闭包里的旧余额做前置校验，`setUser` updater 内既无二次校验也无夹取」。快速连点同一按钮时多次校验读到同一旧值 → 余额被扣成负数，或返回 `true` 但实际未扣款（白嫖）。
2. **发放接口零鉴权**：`POST /api/mtx/grant` 不校验订单是否真实存在、是否已支付、归属是否匹配，任何人伪造 `orderId` 即可凭空领取星尘币/会员；`quantity` 也未做类型与范围校验（可为负数/NaN）。
3. **账本持久化错乱**：退款回收只删内存不落盘（重启后死单复活并二次扣款）；启动迁移无条件用陈旧的 `users.json` 覆盖 SQLite 最新余额（资产回滚）；迁移逻辑读错了目标库导致空操作。
4. **未捕获异常打崩进程**：Express 4 不捕获 async 处理器抛出的异常，一个畸形 body（如 `{"message":123}`）即造成 `unhandledRejection` → Node 进程退出（远程 DoS）。
5. **去重/配额类状态只存在内存**：定时来信、特殊来信去重、每日生成配额都只在组件挂载时判定一次，导致「重启应用当天重复收信」「常驻应用跨天免费额度锁死」。
6. **React 反模式**：`setState` updater 内做副作用（`Math.random`/`setTimeout`/`playSound`/持久化），StrictMode 下双调用导致奖励翻倍、音效叠放；rAF 主循环闭包捕获过期 state（昼夜瞳孔、喂食碎屑恒失效）。

## 决策

### 1. 前端经济操作原子化（单一守卫）

在 `App.tsx` 引入 `coinsRef`（同步镜像最新余额）+ `spendCoins(amount): boolean` / `grantCoins(amount)`：

- 校验与扣减**在同一处完成**，并立即更新 ref，使同一事件循环内的连续调用也能读到最新值；
- updater 内再次 `Math.max(0, …)` 夹取，双保险；
- 所有 `onSpendCoins` 回调（HomeCanvas / NebulaGateCanvas / MemorialZone）统一改走 `spendCoins`，返回值语义可靠。

库存（`foodInventoryRef`）、陪伴能量（`energyRef`）、喂食次数（`feedCountRef`）、免费唤醒标记（`freeReviveUsedRef`）采用同一模式。

### 2. 服务端订单注册表是发放的唯一权威

新增 `microtransaction-api/orders.ts`：

- `initPurchase` 成功后登记订单（`Init`），`finalizePurchase` 成功后标记 `Finalized`；
- `grantItems` 要求订单**存在 + 已 Finalize + steamId 匹配 + itemId 匹配**，数量一律以服务端记录为准，忽略客户端 `quantity`；
- 注册表持久化到 `{DATA_ROOT}/data/orders.json`，未支付订单 7 天后清理，已支付订单永久保留用于幂等与对账。

订单号生成改用 `crypto.randomInt`，并与注册表比对保证进程内唯一（原实现同一毫秒有 1/10^6 碰撞率，碰撞会导致「第二笔真实付款被判为已发放」）。

### 3. mock 支付模式收敛为「非生产 + 回环监听」

`startStarPuffServer` 默认监听从 `0.0.0.0` 改为 `127.0.0.1`；mock 仅在 `NODE_ENV !== production` **且**（显式 `STEAM_MOCK_MODE=true` **或** 回环监听且无 API Key）时启用，并在启用时打印显著警告。对外开放监听时宁可报错也不假发货。

### 4. 「每天一次」类状态必须持久化

定时来信档位、特殊场景来信去重、生成配额与历史，全部落到 `starpuff_` 前缀的 localStorage 键（自动纳入存档快照），并在跨天时重新对齐当天状态。配额键名从 `stardust_*` 迁移为 `starpuff_*` 并兼容读取旧键。

### 5. 单一时钟与单一真值

- **陪伴能量**：只允许 `App` 的 30s effect 衰减并写回 `petConfig.companionEnergy`，删除 `HomeCanvas` 本地代谢循环中的能量衰减（消除双倍速率与来回跳动）。
- **对话额度**：判定统一以 `unlimitedTalks` 为准（原先「聊天用 `unlimitedTalks`、点宠物用 `membership`」两套字段易不同步），显示改用 `dialogsMax` 而非硬编码 `/5`。
- **宠物列表同步**：纪念日/时间线/标签三个处理器从「按 name 匹配」改为「按 id 匹配」，避免同名宠物互相覆盖并产生重复 id。

### 6. updater 纯净性与存储兜底

- 所有 `setState` updater 内的副作用（`localStorage` 写入、`setTimeout`、`Math.random`、`playSound`）一律外提；
- 新增 `safeSetItem` 统一兜底 localStorage 写入，避免隐私模式/配额超限时在 effect 中抛异常炸出错误边界；
- rAF 主循环读取动态值统一走 `xxxRef`（`skyTimeRef`、`feedingItemRef`、`shockwaveRef`），并从 effect 依赖中移除每帧变化的 state（消除渲染循环每帧拆装）。

## 修复清单

### 高危 · 前端

| 位置 | 修复 |
|---|---|
| `App.tsx` 送礼 / 星云之门 / HomeCanvas / MemorialZone 的 `onSpendCoins` | 改走 `spendCoins`，连点不再扣成负数或超支白嫖 |
| `App.tsx` `handleBuyItem` 零食分支 | 改为「先原子扣款、成功后再入库」，不再白嫖零食 |
| `App.tsx` `handleFeedSnack` | 库存 ref 同步守卫，1 个零食无法双击喂两次 |
| `App.tsx` `handleFeedEnergy` | 币/能量/喂食次数全走 ref，消除负余额与能量恢复丢失 |

### 高危 · 后端

| 位置 | 修复 |
|---|---|
| `routes.ts` `/grant`、`fulfillment.ts` `grantItems` | 订单真实性校验 + 入参类型校验 + 数量以服务端为准 |
| `fulfillment.ts` `revokeGrant` | 回收后 `persistGrants()` 落盘 |
| `fulfillment.ts` 启动迁移 | 不再覆盖已有用户；迁移改为遍历内存账本（原读目标库导致空操作） |
| `server.ts` / `routes.ts` | 全部 API 处理器 `handleAsync` 包装 + 全局错误中间件 + `unhandledRejection` 兜底 |
| `server.ts` 4 个 AI 端点 | 入参类型收敛（`asString` / `Array.isArray`），畸形 body 不再打崩进程 |
| `server.ts` 监听与 mock | 默认回环监听；mock 需显式开启或回环缺 Key |
| `service.ts` `generateOrderId` | `crypto.randomInt` + 注册表查重 |
| `db.ts` 回收逻辑 | 不再 clamp 到 0，负余额作为风控信号并告警 |

### 中危

- 定时来信 / 特殊来信去重持久化（`starpuff_letter_sent_slots`、`starpuff_special_letter_sent`）。
- 生成配额跨天重置修正 + 键前缀迁移（`useGenerateQuota` / `useGenerateHistory`）。
- `incrementBondingCharge` 副作用外提（StrictMode 不再双触发/双音效）。
- 长按手势第二级不再重复计入互动（一次长按不再扣 2 次额度）。
- `triggerToast` 定时器重置，新 toast 不再被旧定时器提前掐灭。
- 3D：GLTF 导出补骨骼根节点挂载、删除越界的 `inverseBindMatrices`；自转改为跨帧累积；冲击波改 ref 衰减；悬停节点引用比较。
- `AnimatedPetModel`：`useFrame` 不再冲掉 renderMode 的透明度与发光（xray/rig/voxel 恢复生效）。
- 外部调用加超时：Steam `fetch` 15s、前端 `request` 20s；Steam 错误响应体不再拼进 `error.message` 透传前端。
- `useMicrotransaction`：交易状态为失败态时中止购买；`applyGrantToUser` 防御损坏存档。

### 低危

发币文案与实发数值对齐（+15→+5、+10→+2）、「踏彩虹桥之日桥」、升星仪式提示文案、AR 录制 `00:010s`、3 处非法 Tailwind 类名 `]Scale-95`、打招呼冷却穿透（ref 守卫）、`PetMemoryTimeline` 删除分支的 updater 副作用、`NebulaGateCanvas` 日志稳定 id + 场景切换强制重挂载、`isJumpingState` 镜像、`outfitsUnlocked` 防御性读取。

## 后果

**正面**

- 前端经济操作在连点/竞态下不再产生负余额与免费商品；
- 服务端账本状态可自洽：重启不再重复扣款、不再回滚资产，发放只能命中真实已支付订单；
- 单请求无法再打崩后端进程；
- 「每天一次」类体验符合用户直觉，跨天/重启行为可预期。

**代价 / 需要注意**

- `/api/mtx/grant` 现在要求订单必须先经本服务 `init-purchase` 且 `finalize-purchase` 成功。仓库内已确认没有绕过闭环直接调用 grant 的脚本；联调/压测若需要，请走完整流程或在 mock 模式下跑。
- 默认监听回环地址：若需要在局域网/Docker 中暴露，必须显式传 `host` 并**自行配置 `STEAM_WEB_API_KEY`**（否则 mock 会被强制关闭，接口将报错而非静默假发货）。
- 新增落盘文件 `orders.json`，备份策略需与 `starpuff.sqlite3` 一并覆盖。

## 验证

- IDE 语言服务（TS/TSX）对全部改动文件 **0 诊断**。
- 本仓库当时环境 `node_modules` 尚未安装，未执行 `tsc --noEmit` / 构建；按「验证优先于声明」原则，本次修复需在 `npm install` 后补跑 `npm run lint` 与 `npm run dev` 冒烟，方可视为最终通过。

## 遗留（未在本次改动）

1. **顶栏羁绊经验条恒为 0%**：`exp` 全仓库无任何递增路径，属未完成的功能设计（需先定义经验来源与等级曲线），不擅自编造数值。
2. **喂食特效颜色恒为粉色**：`HomeCanvas` 仍在用旧字符串 `"snack"/"milk"` 比较，而喂食写入的是 emoji；需先确认 `useFeeding` 的取值域并按食物 id 传色。
3. **少量 `setTimeout` 未在卸载时清理**（单击判定 300ms、喂食/拥抱/告别延时）：低危卫生问题，分散多处，未逐一改造以避免回归。
4. ADR-0002 登记的欠账仍然有效：上帝组件拆分、`activePet.statusXxx` 与 `star_puff_*` 双真值合并、每日任务跨天重置、Unsplash 外链封面、无持久化数据库。
