// Electron 主进程：内嵌 Express 后端 + 渲染窗口
// 阶段 1：后端本地化（随机端口 + 127.0.0.1），后续阶段在此扩展 IPC/Steamworks
// 防御：宿主环境（VSCode/Claude 终端）注入的 ELECTRON_RUN_AS_NODE=1 会让 Electron
// 以纯 Node 模式运行（main.cjs 静默崩溃）。该变量在 Electron 加载任何 JS 前已被检查，
// 这里只能检测到后明确报错，引导用户从干净环境（资源管理器 / Steam）启动。
if (process.env.ELECTRON_RUN_AS_NODE) {
  console.error("StarPuff: 检测到 ELECTRON_RUN_AS_NODE=1，Electron 无法以完整运行时启动。请直接双击 StarPuff.exe 或从 Steam 启动。");
  process.exit(1);
}

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
// keytar: optional native module for secure OS credential storage
let keytar = null;
try {
  keytar = require("keytar");
} catch (e) {
  keytar = null;
}

// 诊断日志：Windows GUI 程序无 stdout，设置 STARPUFF_LOG 后把 console 同时写入文件，
// 便于排查打包态/安装后的问题（发布后用户反馈也靠它）
if (process.env.STARPUFF_LOG) {
  const logFile = process.env.STARPUFF_LOG;
  const sink = (...args) => {
    const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    try {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${line}\n`);
    } catch {}
  };
  console.log = sink;
  console.error = sink;
  console.warn = sink;
}

// 清除宿主环境注入的干扰变量（VSCode/Claude 运行环境会设 ELECTRON_RUN_AS_NODE=1，
// 强制 Electron 以纯 Node 模式运行，必须清掉才能以完整 Electron 运行时启动）
delete process.env.ELECTRON_RUN_AS_NODE;

// 单实例锁：防止双开导致端口/存档写入冲突
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// 用户配置（userData/config.json）：目前只有 GEMINI_API_KEY，保存在本地不进云存档
const configPath = () => path.join(app.getPath("userData"), "config.json");

function readConfig() {
  try {
    const p = configPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) ?? {};
  } catch (e) {
    console.error("[config] 读取失败:", e?.message ?? e);
  }
  return {};
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), "utf8");
  } catch (e) {
    console.error("[config] 写入失败:", e?.message ?? e);
  }
}

// Keytar-backed secure storage for Gemini API key (preferred).
const KEYTAR_SERVICE = "StarPuff";
const KEYTAR_ACCOUNT = "gemini_api_key";

async function getStoredGeminiKey() {
  if (keytar) {
    try {
      const v = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
      if (v) return v;
    } catch (e) {
      console.warn("[keytar] getPassword failed:", e?.message ?? e);
    }
  }
  // fallback to local config file (legacy)
  try {
    return readConfig().geminiApiKey ?? "";
  } catch {
    return "";
  }
}

async function setStoredGeminiKey(key) {
  if (keytar) {
    try {
      if (key) await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, String(key));
      else await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    } catch (e) {
      console.warn("[keytar] setPassword/deletePassword failed:", e?.message ?? e);
    }
  }
  // also persist to config.json for compatibility
  try {
    const cfg = readConfig();
    cfg.geminiApiKey = String(key ?? "");
    writeConfig(cfg);
  } catch (e) {
    console.warn("[config] writeConfig fallback failed:", e?.message ?? e);
  }
}

// 内嵌启动后端
let serverModule = null; // require 到的 server.cjs，供 setGeminiApiKey 等模块级函数调用
async function startEmbeddedServer() {
  // 打包态固定生产模式：内嵌 Express serve dist 静态资源（前端零改动，同源 /api）
  process.env.NODE_ENV = "production";
  // 标记内嵌：server.ts 检测到后不自动 listen，改由本进程调用工厂函数
  process.env.STARPUFF_EMBEDDED = "1";
  // 数据目录指向 userData（可写），供微交易 SQLite 数据库/发放账本落盘，
  // 避免打包后 __dirname 指向 asar 只读目录导致写库失败
  process.env.STARPUFF_DATA_DIR = app.getPath("userData");

  const distDir = app.isPackaged
    ? path.join(process.resourcesPath, "dist")
    : path.join(__dirname, "..", "dist"); // 未打包时 electron/ 上级即项目根

  serverModule = require(path.join(distDir, "server.cjs"));
  // 启动即应用已保存的 Gemini key（优先从系统密钥链读取），实现重启后设置保留
  try {
    const stored = await getStoredGeminiKey();
    if (stored && typeof serverModule.setGeminiApiKey === "function") {
      serverModule.setGeminiApiKey(stored);
    }
  } catch (e) {
    console.warn("[startup] 读取 Gemini key 失败：", e?.message ?? e);
  }
  await serverModule.startStarPuffServer({
    port: 0, // 随机端口，规避本地端口占用
    host: "127.0.0.1", // 仅本机访问，不对外开放
    appDir: distDir,
    onListening: (port) => {
      createMainWindow(`http://127.0.0.1:${port}`);
    },
  });
}

function createMainWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: "喵汪星云 StarPuff",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.on("did-fail-load", (_e, code, desc, failedUrl) =>
    console.error("[diag] did-fail-load:", code, desc, failedUrl)
  );
  win.webContents.on("render-process-gone", (_e, details) =>
    console.error("[diag] render-process-gone:", JSON.stringify(details))
  );
  win.on("closed", () => console.log("[diag] window closed"));
  setupScreenshot(win);
  win.loadURL(url);
  return win;
}

// 截图验证模式：设置 STARPUFF_SCREENSHOT_DIR 后，页面加载完成自动截屏并退出。
// 用于自动验证渲染是否正常，也用于后续采集 Steam 商店页游戏截图（阶段 4）。
function setupScreenshot(win) {
  const shotDir = process.env.STARPUFF_SCREENSHOT_DIR;
  if (!shotDir) return;
  win.webContents.on("did-finish-load", () => {
    setTimeout(async () => {
      try {
        const image = await win.webContents.capturePage();
        fs.mkdirSync(shotDir, { recursive: true });
        const out = path.join(shotDir, "screenshot.png");
        fs.writeFileSync(out, image.toPNG());
        console.log("[shot] 截图已保存:", out);
      } catch (e) {
        console.error("[shot] 截图失败:", e.message);
      } finally {
        app.quit();
      }
    }, 5000);
  });
}

app.whenReady().then(() => {
  initSteam(); // 优先初始化 Steamworks（覆盖层/成就/云存档），失败则离线模式
  startEmbeddedServer().catch((err) => {
    console.error("StarPuff 启动失败:", err);
    app.quit();
  });
});

// 本地存档 IPC：读写 userData/save.json（渲染层 localStorage 快照桥）
// 写入前把旧档复制为 .bak，崩溃/写坏时兜底恢复
const savePath = () => path.join(app.getPath("userData"), "save.json");

ipcMain.handle("save:load", async () => {
  try {
    const p = savePath();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("[save] 读取存档失败:", e?.message ?? e);
    return null;
  }
});

ipcMain.handle("save:write", async (_e, save) => {
  try {
    const p = savePath();
    if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak");
    fs.writeFileSync(p, JSON.stringify(save, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[save] 写入存档失败:", e?.message ?? e);
    return false;
  }
});

// ---- Steamworks（阶段 3）----
// steamworks.js 使用 N-API 预编译二进制（win64 .msvc.node），跨 Electron/Node 版本 ABI 稳定，无需 rebuild。
let steamClient = null; // steamworks client 实例
let steamAvailable = false;

function initSteam() {
  if (steamClient) return;
  try {
    const steamworks = require("steamworks.js");
    // 显式传 AppID 优先；未提供时 steamborks 查找 cwd/steam_appid.txt（dev 模式）
    const appId = Number(process.env.STEAM_APP_ID) || undefined;
    steamClient = steamworks.init(appId);
    steamworks.electronEnableSteamOverlay();
    steamAvailable = true;
    console.log("[steam] Steamworks 就绪, SteamID:", String(steamClient.steamID.steamID64));
  } catch (e) {
    steamAvailable = false;
    steamClient = null;
    console.warn("[steam] Steamworks 初始化失败（Steam 客户端未运行/未登录？），游戏以离线模式运行:", e?.message ?? e);
  }
}

// Steam IPC：仅暴露最小面（状态/成就/云存档），凭据类能力不进渲染层
ipcMain.handle("steam:status", async () => ({
  available: steamAvailable,
  steamId: steamAvailable ? String(steamClient.steamID.steamID64) : null,
  appId: Number(process.env.STEAM_APP_ID) || null,
}));

ipcMain.handle("steam:achievement", async (_e, name) => {
  if (!steamAvailable || !name) return false;
  try {
    return Boolean(steamClient.achievement.activate(String(name)));
  } catch {
    return false;
  }
});

ipcMain.handle("steam:cloud-write", async (_e, name, content) => {
  if (!steamAvailable || !name) return false;
  try {
    return Boolean(steamClient.cloud.writeFile(String(name), String(content)));
  } catch {
    return false;
  }
});

ipcMain.handle("steam:cloud-read", async (_e, name) => {
  if (!steamAvailable || !name) return null;
  try {
    return steamClient.cloud.readFile(String(name)) ?? null;
  } catch {
    return null;
  }
});

// 配置 IPC：Gemini key 持久化到 userData/config.json，并立即应用到运行中的服务
ipcMain.handle("config:getGeminiKey", async () => {
  try {
    return await getStoredGeminiKey();
  } catch (e) {
    return readConfig().geminiApiKey ?? "";
  }
});
ipcMain.handle("config:setGeminiKey", async (_e, key) => {
  try {
    await setStoredGeminiKey(key);
  } catch (e) {
    console.warn("[config] setStoredGeminiKey failed:", e?.message ?? e);
  }
  if (serverModule?.setGeminiApiKey) serverModule.setGeminiApiKey(String(key ?? ""));
  return true;
});

ipcMain.on("app:quit", () => app.quit());

app.on("window-all-closed", () => app.quit());

app.on("second-instance", () => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    if (wins[0].isMinimized()) wins[0].restore();
    wins[0].focus();
  }
});
