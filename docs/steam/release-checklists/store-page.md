# 喵汪星云 StarPuff — Steam 商店页发布清单

> 上架前按此清单准备商店页素材与文案。所有图片最终统一用游戏内截图/宣传图在图片编辑器中导出。

## 一、素材规格（Steamworks 后台「商店页面」上传）

| 素材 | 尺寸 | 说明 |
|---|---|---|
| 小型胶囊图 | 231×87 | 商店首页/愿望单小图 |
| 大型胶囊图 | 616×353 | 商店页主图 |
| 主标头图 | 460×215 | 商店页顶部横幅 |
| 封面图（Hero） | 3840×1240 | 商店页顶部大图 |
| 宣传图（Library Header） | 1920×620 | 库中横图 |
| 游戏库胶囊图 | 600×900 | 库中竖图 |
| 商店截图 | 1280×720 起 | 最少 5 张，展示游戏内画面 |
| 成就图标 | 256×256 | 每个成就一张（见 achievements.md） |

素材可从 `STARPUFF_SCREENSHOT_DIR` 截图流程批量采集：
```bash
STARPUFF_SCREENSHOT_DIR=C:\path\shots release\win-unpacked\StarPuff.exe
```
启动后自动截图 1280×720 画面并退出（可结合游戏内切换场景脚本采集 7 大星系）。

## 二、商店文案（建议初稿）

**游戏名**：喵汪星云 StarPuff

**一句话简介**：一场治愈系 AI 宠物陪伴——让逝去的爱宠以星能形态，继续住在你的星空家园。

**简介正文**：
- 星尘档案馆：为爱宠建立星谱档案，记录它的模样、性格与你们的回忆。
- 7 大星系场景：从玫瑰星云公园到永恒之海，自由漫步。
- AI 陪伴对话：离线温暖模板免费可玩；可选接入 Gemini 大模型，让它"听见"你的话。
- 3D 全息重建：从一张照片重建爱宠的 3D 形态，与它再次互动。
- 签到与养成：每日签到、能量呵护、成长升级、多宠家族。

**定价**：免费游玩 + Steam 微交易内购（星尘币 / VIP 会员，首充档 ¥7）。
注：微交易须先在 Steamworks「内购项目」登记 item，与 products.json 完全一致（ID 100–104 星尘币、200 月卡、201 年卡）。

## 三、Steam 后台相关配置

1. **基础信息**：AppID 真实值（当前代码占位 480，发布前替换 `electron/main.cjs` 的 STEAM_APP_ID 与 steam_appid.txt）。
2. **成就/统计**：按 docs/steam/achievements.md 登记 8 个成就。
3. **云存档**：启用 Steam Cloud，文件范围配置为 `save.json`（自动写读，见 src/persistence/saveManager.ts）。
4. **内购项目**：登记 7 个 MicroTxn item（ID/定价与 products.json 一致，币种 CNY）。
5. **商店页审核问卷**：如实填写分级（EPCIS 建议按"无暴力、无性内容、轻度模拟赌博元素"填写，星尘币开箱为虚拟经济）。

## 四、上线前安全检查

- [ ] 安装包内无 `steam_appid.txt`、无任何密钥明文（STEAM_WEB_API_KEY 只在服务端/沙盒，绝不打进客户端）。
- [ ] `npm run build` 后 `grep -r "unsplash.com\|raw.githubusercontent\|steam_appid" dist/` 为空。
- [ ] `ELECTRON_RUN_AS_NODE` 环境变量问题仅限本机开发终端，用户环境不受影响（main.cjs 已加防御提示）。
- [ ] 断网启动可玩（离线 AI 模板 + 本地图片/模型）。

## 五、生产后端迁移（上线前提，关键风险）

Steam Web API Key 绝不能打进客户端（拆包可提取 → Steam 冻结密钥/封号）。
当前内嵌方案仅用于开发/沙盒联调。正式上架前：

1. 把 `server.ts`（AI + microtransaction-api）部署到自有托管环境（如一台小服务器 / Serverless）。
2. 环境变量注入 `STEAM_WEB_API_KEY`、`STEAM_APP_ID`（不在代码里）。
3. 客户端把 `src/api/index.ts` 的 `API_BASE` 指向托管后端 URL（零密钥）。
4. 内嵌 Express 只保留静态资源服务；/api 由前端直连托管后端。
5. 迁移后回归：内购沙盒完整闭环 + 对账一致再提 Build。
