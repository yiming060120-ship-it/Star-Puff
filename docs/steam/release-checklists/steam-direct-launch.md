# 喵汪星云 StarPuff — Steam Direct 上架操作清单

> 阶段 5：全部是 Steamworks 后台操作，不需要写代码。按顺序走完即可上架。
> 前置：已完成阶段 1-4（安装包、持久化、Steamworks 接入、内购定价），已提供真实 AppID。

## 一、上架前置条件

在开始后台操作前，先确认三件事已具备。

第一，已缴纳 **Steam Direct 提交费 $100**（每个产品一次，正式版上架后才退款，见 store.steampowered.com 后台入口）。第二，已拿到**真实 AppID**——拿到后替换代码中的占位值：`electron/main.cjs` 里 `STEAM_APP_ID` 环境变量的默认值、根目录 `steam_appid.txt`（dev 联调用）、`electron-builder.yml` 无硬编码则不改。第三，本机装了 **Steam 客户端**且登录（联调覆盖层/成就/云存档都要用）。

## 二、在 Steamworks 后台创建产品配置

登录 partner.steamgames.com，进入「应用与工具」创建新应用，填入 AppID 与基础信息。创建后重点配置四块：Depot、启动选项、云存档、商店页。

**Depot 与启动选项**是让游戏能从 Steam 正常启动的关键。先到「安装」页新建一个 Depot（默认与 AppID 相同的那个即可），记下 Depot ID；再到「启动选项」把可执行文件设为 `StarPuff.exe`（NSIS 安装后的主程序），启动参数留空，工作目录留空。

**Steam Cloud 云存档**到「云存档」页开启，文件范围只写 `save.json`（详见 docs/steam/release-checklists 说明与 src/persistence/saveManager.ts 的读写路径）。可留一个 `save.json` 通配即可；如果将来加多个存档文件再扩。

## 三、用 steamcmd 上传构建

Steam 构建不走网页上传，用官方命令行工具 steamcmd。安装并登录（需受管账号，可在后台把子账号设为受管）。

在项目根建 `steam/build/app_build.vdf`（把 `<APPID>`、`<DEPOTID>`、`<USER>` 换成真实值）：

```
"AppBuild"
{
  "AppID" "<APPID>"
  "Desc" "v0.1.0 首版"
  "BuildOutput" "steam/build_output"
  "ContentRoot" "release/win-unpacked"
  "SetLive" "none"
  "Depots"
  {
    "<DEPOTID>" "steam/build/depot_build.vdf"
  }
}
```

ContentRoot 指向 electron-builder 输出的 `release/win-unpacked`（不含安装包本身，是解包后的完整运行目录）。再建 `steam/build/depot_build.vdf`：

```
"DepotBuild"
{
  "DepotID" "<DEPOTID>"
  "FileMapping"
  {
    "LocalPath" "*"
    "DepotPath" "."
    "recursive" "1"
  }
}
```

然后运行上传（Git Bash 下路径用 `/c/`）：

```bash
steamcmd +login <USER> +run_app_build /c/Users/ASUS/Desktop/Star-Puff/steam/build/app_build.vdf +quit
```

上传前**务必先跑一遍安全检查**：确认 `release/win-unpacked` 里没有 `steam_appid.txt`、没有任何密钥明文（见 store-page.md 第四节清单）。

## 四、商店页资料与分级问卷

到「商店页面」完成资料提交。素材规格见 docs/steam/release-checklists/store-page.md 第一节，成就在文档 docs/steam/achievements.md 登记后台。

**分级问卷**如实填写。StarPuff 内容评估：无暴力、无性内容、无赌博；星尘币为虚拟经济内的消费项目，问卷中的微交易/随机道具问题如实勾选（当前商品无随机开箱，若后续加抽卡需回到问卷说明）。

**微交易项目**到「内购项目」页登记：ID 100-104 星尘币、200 月度会员、201 年度会员，币种 CNY，定价与 `microtransaction-api/products.json` 完全一致。不一致会导致交易返回错误码 8。

## 五、提交三类审核

后台三个提交入口，分别对应「商店页审核」「Build 审核」「支付审核」：

1. **Build 审核**：上传完成后在「安装」页把该 Build 设为受审分支并提交审核，Steam 会对二进制做扫描（约一天）。
2. **商店页审核**：资料完整后提交，审核通过前商店页仅自己可见。
3. **支付审核**：内购项目登记完提交，Steam 审核货币与定价。

三类审核可并行提交，都通过后才允许 setlive。

## 六、正式发布 setlive

审核通过后，在「安装」页把 Build 状态改为正式版 setlive，商店页同步发布。此时真实玩家能从商店安装并从 Steam 启动。

发布后做一轮**正式环境回归**（对照端到端验收）：Steam 启动进入游戏 → Shift+Tab 覆盖层弹出 → 完成一次真实内购 → 解锁成就出现在个人资料 → 云存档跨机恢复 → 断网仍可离线游玩。**首次结算对账**：到「财务」页核对首笔收入与订单记录一致。

## 七、可选：Beta 分支内测

setlive 前可先把 Build 设为 Beta 分支（在「安装」页开启测试版并授权账号），让内测玩家抢先验证，验证通过再切正式。这不是必须步骤，但强烈建议首次上架走一遍——正式环境的覆盖层/支付对账与沙盒有差异，内测能提前暴露。

## 八、上架后维护

- 成就/内购 item 修改需重新提交对应审核。
- 新版本沿用同一套 app_build.vdf 流程（改 Desc、重新上传、审核、setlive）。
- 定期到「财务」核对结算，配合 revoke 处理退款（src/api/index.ts 的 revokeGrant 已预留）。
