/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ErrorBoundary：捕获 React 子树中的渲染错误（含 WebGL 初始化失败），
 * 防止低端设备上的 Three.js 崩溃导致整个应用白屏。
 */

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-[#070314]/90 rounded-xl border border-purple-500/20">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">🌌</span>
          </div>
          <h3 className="text-lg font-semibold text-purple-300 mb-2">
            星辰连接中断
          </h3>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed mb-4">
            像素宇宙的粒子似乎遇到了一点波动。可能是你的设备图形驱动不兼容，请尝试刷新页面或使用更现代的浏览器。
          </p>
          <p className="text-[10px] text-gray-500 font-mono bg-black/30 px-3 py-1.5 rounded mb-5">
            {this.state.error?.message || "未知图形错误"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
          >
            重新连接星辰
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
