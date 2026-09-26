// Preload 桥：以最小暴露面把主进程能力带给渲染层
// 保持 contextIsolation:true + nodeIntegration:false，渲染层只能访问 window.starPuff.*
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("starPuff", {
  app: {
    version: "0.1.0",
    isElectron: true,
  },
  quit: () => ipcRenderer.send("app:quit"),
  save: {
    load: () => ipcRenderer.invoke("save:load"),
    write: (save) => ipcRenderer.invoke("save:write", save),
  },
  config: {
    getGeminiKey: () => ipcRenderer.invoke("config:getGeminiKey"),
    setGeminiKey: (key) => ipcRenderer.invoke("config:setGeminiKey", key),
  },
  steam: {
    status: () => ipcRenderer.invoke("steam:status"),
    achievement: (name) => ipcRenderer.invoke("steam:achievement", name),
    cloudWrite: (name, content) => ipcRenderer.invoke("steam:cloud-write", name, content),
    cloudRead: (name) => ipcRenderer.invoke("steam:cloud-read", name),
  },
});
