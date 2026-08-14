# Microtransaction 模块交接说明

目的：说明微交易模块的运行、密钥管理、持久化与常见故障排查，方便接手与运维。

前置条件
- Node.js >= 22.12（建议 22.14+）
- npm
- Windows 上如要运行 Electron 或构建 native 模块，需要安装相应的 build 工具（Visual Studio Build Tools）或使用 CI 预构建二进制。

主要文件
- `microtransaction-api/service.ts`：与 Steam MicroTxn API 的调用逻辑。
- `microtransaction-api/fulfillment.ts`：发放/回收逻辑，现已迁移为优先使用 SQLite，并保留 JSON 兼容回退。
- `microtransaction-api/db.ts`：SQLite DAL（使用 `better-sqlite3`），数据库文件位于 `microtransaction-api/data/starpuff.sqlite3`。
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
- SQLite 文件：`microtransaction-api/data/starpuff.sqlite3`（grants, users 表）。
- 迁移策略：如果存在遗留的 `microtransaction-api/data/grants.json` 或 `users.json`，服务在启动时会尝试把数据迁移到 SQLite（一次性）。
- 备份：定期备份 `starpuff.sqlite3`，推荐每日备份并保存 7 日历史。

常见故障与排查
- 无法发放/重复发放：检查 `grants` 表是否存在目标 `orderId`，并确认 `grantItems` 返回的成功消息。检查日志（Electron 发布态请查看 `STARPUFF_LOG` 指定的文件）。
- Refund/Chargeback 回收失败：请检查 `revokeGrant` 是否成功在 SQLite 中删除记录，并验证 `users` 表中的余额回退。
- keytar 不可用：Electron 在某些环境可能无法加载 `keytar`（缺二进制）。此时进程会回退到 `userData/config.json`。

对接建议（优先级）
1. 将 SQLite 迁移到受管理的数据库（Postgres/MySQL）以提高并发能力与审计能力（高）。
2. 把客户端的权威经济数据从 `localStorage` 下沉到服务端（高）。
3. 在生产中强制禁用 `mockMode`，未配置 `STEAM_WEB_API_KEY` 的情况下拒绝启动（防资损）（高）。
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
