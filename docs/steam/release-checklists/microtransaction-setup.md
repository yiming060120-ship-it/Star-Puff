# Steam 微交易（内购）上线配置清单

> 适用版本：release 分支（正式上线版）
> 目的：让游戏内的所有付费商品（星尘币 / VIP 会员 / 专属纪念服务）真正走 Steam 钱包收款。
> 状态：代码已全部就绪，本文档是 **Steamworks 后台** 的运营配置步骤。

---

## 一、前置准备

在开始前，请确认你已拥有：

1. **Steamworks 合作伙伴账号**（已注册并登录）
   - 地址：https://partner.steamgames.com
2. **游戏应用已创建**（拿到了 AppID）
3. **游戏已通过「发行商审核」**（非必须，但上线前需要）

> 如果还没有 AppID，先到 Steamworks 后台 →「游戏」→ 创建新应用，拿到 AppID。

---

## 二、申请 Publisher Web API Key

这个 Key 是后端调用 Steam 微交易 API 的凭证，**必须妥善保管、不要泄露**。

1. 登录 https://partner.steamgames.com
2. 进入你的应用后台
3. 左侧菜单 →「技术」→「Web API Key」
4. 点击「创建 Key」，选择 **Publisher Key** 类型
5. 复制生成的 Key，填入项目 `.env` 文件（见下方「环境变量配置」）

---

## 三、配置 AppID

1. 在 Steamworks 后台确认你的正式 AppID
2. 填入 `.env` 的 `STEAM_APP_ID`

> ⚠️ 当前代码里 AppID 是占位符 `480`（Spacewar 测试游戏），**必须改成你的真实 AppID**，否则无法收款。

---

## 四、配置微交易商品（最关键）

这一步决定「游戏里点购买 → 弹 Steam 钱包」能否成功，以及价格是否一致。

1. Steamworks 后台 → 你的应用 → 左侧菜单 →「**经济和商品**」→「**Microtransactions（微交易）**」
2. 逐个添加以下商品，**ID 必须和 `microtransaction-api/products.json` 完全一致**：

| 商品 ID | 名称 | 价格（人民币） | 类型 |
|---|---|---|---|
| 100 | 星尘币 ×180 | ¥7 | 消耗品（货币） |
| 101 | 星尘币 ×500 | ¥12 | 消耗品（货币） |
| 102 | 星尘币 ×1000 | ¥22 | 消耗品（货币） |
| 103 | 星尘币 ×2200 | ¥45 | 消耗品（货币） |
| 104 | 星尘币 ×4500 | ¥88 | 消耗品（货币） |
| 200 | VIP 月度会员 | ¥25 | 消耗品 |
| 201 | VIP 年度会员 | ¥128 | 消耗品 |
| 202 | 星辰织梦视频包 | ¥29.9 | 消耗品 |
| 203 | 高级小窝孪生 | ¥19.9 | 消耗品 |

> ⚠️ **关键**：商品 ID、价格必须与 `products.json` 完全一致。如果后台价格和代码里不一致，会导致 Steam 拒绝交易（错误码 8 / 价格不匹配）。

---

## 五、环境变量配置（`.env`）

在项目根目录 `.env` 文件里填入以下内容：

```env
# Steam 微交易配置
STEAM_WEB_API_KEY=你的Publisher_Web_API_Key
STEAM_APP_ID=你的正式AppID
STEAM_SANDBOX=false
STEAM_MOCK_MODE=false
```

各字段说明：

| 变量 | 说明 |
|---|---|
| `STEAM_WEB_API_KEY` | 第二步申请的 Publisher Key |
| `STEAM_APP_ID` | 正式 AppID |
| `STEAM_SANDBOX` | `true`=测试沙盒，`false`=生产环境 |
| `STEAM_MOCK_MODE` | 开发联调用的模拟模式，**生产环境必须 false** |

> 另外 `.env` 里还有 AI 对话的 `VITE_AI_API_KEY`（DeepSeek），和 Steam 无关，按需填。

---

## 六、沙盒测试流程（上线前必做）

先用 Steam 的沙盒环境测试，确认「能弹钱包、能扣款、能发货」，再切生产。

1. 把 `.env` 改为：
   ```env
   STEAM_SANDBOX=true
   ```
2. 重新打包运行游戏
3. 用一个 Steam 测试账号，逐个商品试买：
   - 点「支付」→ 应弹出 Steam 钱包授权窗口
   - 确认后 → 游戏内应立即收到对应权益（星尘币到账 / 会员生效 / 服务解锁）
4. 检查后端日志，确认没有 `Steam API failure` 错误
5. 测试通过后，把 `STEAM_SANDBOX` 改回 `false`

> 沙盒环境用的账号也是测试账号，不产生真实扣款。

---

## 七、切换到生产环境

1. 确认 `.env`：
   ```env
   STEAM_SANDBOX=false
   STEAM_MOCK_MODE=false
   ```
2. 重新打包
3. 上线前再次确认商品 ID 和价格与 Steamworks 后台完全一致

---

## 八、对账与退款处理

代码已内置对账接口，生产环境建议每日调用一次，自动发现退款/拒付并回收权益：

- 接口：`GET /api/mtx/report?type=GAMESALES`
- 退款回收：`POST /api/mtx/revoke`（传入 orderId）

> 生产环境建议用定时任务（cron）每天拉取 `GetReport`，发现 `Refunded` / `Chargedback` 状态时自动调用 `revoke` 回收玩家权益。

---

## 九、常见问题（FAQ）

| 问题 | 原因 | 解决 |
|---|---|---|
| 点购买没反应 / 弹窗没出现 | mock 模式没关，或 AppID 错误 | 检查 `.env` 的 `STEAM_MOCK_MODE` 和 `STEAM_APP_ID` |
| Steam 报错误码 8（价格不匹配） | 后台商品价格和 `products.json` 不一致 | 核对两边价格，改成一致 |
| 报「用户验证未通过」 | 用户账户状态异常（Locked from purchasing） | 换一个可信的 Steam 账号测试 |
| 扣款成功但游戏内没到账 | grant 发放失败 | 看后端日志，确认 orderId 对应的 grant 记录 |
| 想先测试不真扣钱 | 用了生产环境 | 切 `STEAM_SANDBOX=true` 用沙盒测试 |

---

## 十、检查清单（全部打勾才算配置完成）

- [ ] 已申请 Publisher Web API Key
- [ ] `.env` 已填入 `STEAM_WEB_API_KEY` 和真实 `STEAM_APP_ID`
- [ ] Steamworks 后台已配置 9 个商品（ID 100~104、200~203）
- [ ] 商品价格与 `products.json` 完全一致
- [ ] 沙盒测试通过（能弹钱包、能扣款、能发货）
- [ ] 生产环境 `STEAM_SANDBOX=false`、`STEAM_MOCK_MODE=false`
- [ ] 已配置每日对账定时任务
