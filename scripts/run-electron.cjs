// 用 Node 启动器运行 Electron：清除宿主环境注入的 ELECTRON_RUN_AS_NODE，
// 再以完整 Electron 运行时加载 electron/main.cjs（详见 main.cjs 顶部注释）
const { spawn } = require("child_process");
const path = require("path");

// 在纯 Node 进程里，require('electron') 返回 Electron 可执行文件路径。
// 但在下载失败或未安装时，require 会抛出错误。这里做三步回退：
// 1) 尝试 require('electron')；2) 回退到 PATH 中的 `electron` 命令；
// 3) 打印友好提示并退出，告知用户如何使用镜像或手动安装。
let electronPath;
try {
	electronPath = require("electron");
} catch (err) {
	// 如果未能通过 package 的 electron 模块获得可执行路径，尝试直接使用 PATH 中的 electron 可执行文件
	console.warn("[run-electron] require('electron') failed:", err.message || err);
	console.warn("[run-electron] 尝试回退到 PATH 中的 'electron' 可执行文件...");
	electronPath = "electron"; // 依赖系统 PATH
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = [path.join(__dirname, "..", "electron", "main.cjs"), ...process.argv.slice(2)];
const child = spawn(electronPath, args, { stdio: "inherit", env });

child.on("error", (err) => {
	console.error("[run-electron] 无法启动 Electron:", err.message || err);
	console.error("- 如果你处于企业/中国大陆网络环境，Electron 二进制可能无法直接从 GitHub 下载。尝试如下方案：");
	console.error("  1) 使用镜像：在运行前设置环境变量 ELECTRON_MIRROR 指向镜像，例如：https://npm.taobao.org/mirrors/electron/ 或私有镜像");
	console.error("  2) 手动安装：运行 `npx install-electron --no` 或使用代理下载后放入 node_modules/electron");
	console.error("  3) 如果本机已安装 electron，可将其放入 PATH（使 'electron' 命令可用），或安装官方 electron 可执行。\n");
	process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));
