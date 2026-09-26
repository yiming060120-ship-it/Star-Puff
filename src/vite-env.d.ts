/// <reference types="vite/client" />

// Vite 客户端类型声明。
//
// 作用：为 `import.meta.glob` / `import.meta.env` 等 Vite 专有 API 提供类型。
// 缺少本文件时 `npm run lint`（tsc --noEmit）会在 App.tsx 的本地模块动态加载处报
// TS2339: Property 'glob' does not exist on type 'ImportMeta'。
