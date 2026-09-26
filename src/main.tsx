import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {loadSaveFromDisk} from './persistence/saveManager';

// Electron 下先异步恢复本地存档到 localStorage，再挂载游戏；浏览器模式 loadSaveFromDisk 为 no-op
async function bootstrap() {
  await loadSaveFromDisk();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
