@echo off
REM 一键打包 Windows exe（安装包）
REM 设置镜像与证书环境，规避中国大陆网络环境下 GitHub 下载失败/证书验证失败问题
chcp 65001 >nul

set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo ============================================
echo  喵汪星云 StarPuff - 打包 Windows 安装包
echo ============================================
echo.

call npm run clean
if errorlevel 1 goto :error

call npm run make-icon
if errorlevel 1 goto :error

call npm run build
if errorlevel 1 goto :error

call npx electron-builder --win --x64
if errorlevel 1 goto :error

echo.
echo ============================================
echo  打包完成！安装包位于 release 目录
echo ============================================
goto :eof

:error
echo.
echo [ERROR] 打包失败，请检查上方日志。
exit /b 1
