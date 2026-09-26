# archive/logs/ — 开发期日志归档

> 这些文件原先散落在仓库根目录，会污染项目入口，并且会被 Vite 的文件监听捕捉、
> 触发「page reload dev-log.txt」式的无意义热重载循环（`dev-log.txt` 中可见大量此类记录）。
> 按「归档而非删除」原则统一移入此处，**仅作历史留痕，不再维护**。

| 文件 | 来源 | 说明 |
|---|---|---|
| `dev-log.txt` | `npm run dev > dev-log.txt` | 开发服务器输出。末尾记录了一次真实崩溃：Vite 监听 `release/win-unpacked/dxcompiler.dll` 时 `EBUSY: resource busy or locked`（Node v24）。**结论：不要在与 `release/` 同级且持续写盘的目录下跑 dev**，或把构建产物目录排除出监听范围。 |
| `build-log.txt` | `npm run build` | 生产构建输出：Vite 打包结果 + esbuild 打包 `dist/server.cjs` + 便携版组装步骤。含一条 chunk 体积告警（主包 1.8MB，建议 code-split）。 |
| `fetch-log.txt` / `fetch-err.txt` | electron-builder 依赖下载 | 下载 Electron 43.4.0 运行时（经 npmmirror 镜像）。 |
| `fetch2-log.txt` / `fetch2-err.txt` | electron-builder 依赖下载 | 下载 `winCodeSign-2.6.0.7z` 失败：`HTTP 404`（镜像缺少该二进制）。若打包 Windows 安装包报错，可从官方源或 `ELECTRON_BUILDER_BINARIES_MIRROR` 指定可用镜像。 |

## 相关约定

- 根目录**不再**提交运行日志。`.gitignore` 已补充 `dev-log.txt`、`build-log.txt`、`fetch*-log.txt`、`fetch*-err.txt` 等模式。
- 需要留存日志时建议输出到 `docs/archive/logs/` 或系统临时目录，避免放在仓库根。
