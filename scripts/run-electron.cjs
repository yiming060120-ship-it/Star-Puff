// 用 Node 启动器运行 Electron：清除宿主环境注入的 ELECTRON_RUN_AS_NODE，
// 再以完整 Electron 运行时加载 electron/main.cjs（详见 main.cjs 顶部注释）
const { spawn } = require("child_process");
const path = require("path");

// 纯 Node 进程里 require('electron') 返回的是 Electron 可执行文件路径
const electronPath = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = [path.join(__dirname, "..", "electron", "main.cjs"), ...process.argv.slice(2)];
const child = spawn(electronPath, args, { stdio: "inherit", env });

child.on("exit", (code) => process.exit(code ?? 0));
