# Microtransaction 模块交接说明

目的：说明微交易模块的运行、密钥管理、持久化与常见故障排查，方便接手与运维。

前置条件
- Node.js >= 22.12（建议 22.14+）
- npm
- Windows 上如要运行 Electron 或构建 native 模块，需要安装相应的 build 工具（Visual Studio Build Tools）或使用 CI 预构建二进制。

主要文件
- `microtransaction-api/service.ts`：与 Steam MicroTxn API 的调用逻辑（订单号生成、Init/Finalize/Query/GetReport）。
- `microtransaction-api/fulfillment.ts`：发放/回收逻辑，优先使用 SQLite，保留 JSON 兼容回退。
- `microtransaction-api/orders.ts`：**服务端订单注册表**（2026-09-26 新增，见 `docs/decisions/ADR-0004`）。记录由本服务 Init 并 Finalize 成功的订单，是 `/grant` 的权威校验依据。
- `microtransaction-api/db.ts`：SQLite DAL（使用 `better-sqlite3`）。
- `electron/main.cjs`：Electron 主进程，使用 `keytar` 优先存储 `GEMINI_API_KEY`，回退写入 `userData/config.json`。

环境变量（关键）
- `GEMINI_API_KEY`：Gemini / Google GenAI API Key，用于在线 AI 服务（可由 Electron UI 在运行时设置）。
- `STEAM_WEB_API_KEY`：Steam Web API Key（生产必须配置）。
- `STEAM_APP_ID`：Steam 应用 ID，默认 480（测试用）。
- `STEAM_SANDBOX`：`true` 则使用 Sandbox API。
- `STEAM_MOCK_MODE`：开发环境可设为 `true` 强制 mock。

快速启动（开发）
```bash
npm install
npm run lint
npm run dev          # 启动后端 + Vite
# (另开 shell)
npm run electron:dev # 构建前端并以 Electron 启动
```

生产构建
```bash
npm run build
npm run build:server
npm run dist
```

数据库与持久化
- 数据根目录 `DATA_ROOT` 解析顺序：环境变量 `STARPUFF_DATA_DIR`（Electron 打包态注入 `userData`）→ 回退 `process.cwd()/microtransaction-data`；账本目录为其下的 `data/`。
  - 开发态实际落盘：`microtransaction-data/data/`。
  - 历史遗留目录：`microtransaction-api/data/`（旧版路径，仅早期版本产生过数据）。
  - 这两个目录都应被 `.gitignore` 忽略（2026-09-26 已补规则；如已被提交，需执行 `git rm --cached -r microtransaction-data microtransaction-api/data`）。
- 文件清单：
  - `starpuff.sqlite3`：`grants` / `users` 表，账本与余额的权威库。
  - `grants.json`：旧版 JSON 账本，启动时**一次性**补迁移进 SQLite（只补缺失记录，不再覆盖 SQLite 已有数据）。
  - `orders.json`：**订单注册表**（2026-09-26 新增）。未支付订单保留 7 天后清理，已支付订单永久保留，用于幂等与对账。
  - `users.json`：旧版用户账本，仅在 SQLite 中不存在该用户时才迁移（防止覆盖最新余额）。
- 备份：定期备份 `starpuff.sqlite3` **与 `orders.json`**，推荐每日备份并保存 7 日历史。

发放（Grant）校验规则（2026-09-26 起，见 ADR-0004）
`/api/mtx/grant` 不再接受任意 `orderId`，必须同时满足以下条件才会发放：
1. 字段类型合法：`orderId` / `steamId` 为非空字符串，`itemId` 为整数；
2. 该 `orderId` 由本服务 `init-purchase` 创建并已登记在 `orders.json`；
3. 订单状态为 `Finalized`（即 `finalize-purchase` 已成功）；
4. 订单的 `steamId`、`itemId` 与请求完全一致；
5. 发放数量以**服务端记录的订单数量**为准，客户端传入的 `quantity` 被忽略。

同一 `orderId` 重复请求命中幂等，直接返回首次发放结果。

常见故障与排查
- 无法发放/重复发放：检查 `grants` 表是否存在目标 `orderId`，并确认 `grantItems` 返回的成功消息。检查日志（Electron 发布态请查看 `STARPUFF_LOG` 指定的文件）。
- Refund/Chargeback 回收失败：请检查 `revokeGrant` 是否成功在 SQLite 中删除记录，并验证 `users` 表中的余额回退。
- keytar 不可用：Electron 在某些环境可能无法加载 `keytar`（缺二进制）。此时进程会回退到 `userData/config.json`。
- 发放被拒（提示「订单不存在或未经服务端初始化」/「尚未完成支付」）：调用方跳过了 Init→Finalize 闭环，或订单超过 7 天未支付已被清理。请走完整流程重试。
- 启动后余额疑似"回滚"（历史问题）：ADR-0004 已修复——迁移不再用 `users.json` 覆盖 SQLite。若仍出现，检查是否有多个实例指向不同数据目录。
- 单个请求导致进程退出（历史问题）：ADR-0004 已修复（async 异常兜底 + 入参类型收敛 + `unhandledRejection` 拦截）。若再现请保留日志并按路由定位。

对接建议（优先级）
1. 将 SQLite 迁移到受管理的数据库（Postgres/MySQL）以提高并发能力与审计能力（高）。
2. 把客户端的权威经济数据从 `localStorage` 下沉到服务端（高）。
3. ~~在生产中强制禁用 `mockMode`，未配置 `STEAM_WEB_API_KEY` 的情况下拒绝启动（防资损）~~ —— **已实施**（ADR-0004）：`NODE_ENV=production` 强制关闭 mock；非生产下 mock 仅在「显式 `STEAM_MOCK_MODE=true`」或「回环监听且缺少 Key」时启用。默认只监听 `127.0.0.1`，需对外暴露时请显式传 `host` 并配置 `STEAM_WEB_API_KEY`（高）。
4. 为 `starpuff.sqlite3` 添加备份/轮转与只读副本用于数据分析（中）。

测试 API 示例
- 获取商品列表：
```bash
curl http://localhost:3000/api/mtx/products
```
- 初始化购买（mock 模式示例）：
```bash
curl -X POST http://localhost:3000/api/mtx/init-purchase -H "Content-Type: application/json" -d '{"steamId":"7656119...","itemId":100,"quantity":1}'
```

联系人与后续
- 如果需要我可以：
  - 把 SQLite 迁移改为 Postgres 示例（代码 + migration），
  - 添加自动化对账任务（GetReport 定时），
  - 在 CI 中添加原生模块预构建步骤。
